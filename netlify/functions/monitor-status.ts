// prism-monitor/v1 — read-only health endpoint for Prism Mission Control.
//
// Contract: prism-mission-control/MONITORING.md. Hard rules:
//   * NEVER throws or 500s — every check is try/caught into status 'down';
//     an absolute outer backstop still returns a full-shape body with 200.
//   * STRICTLY READ-ONLY — cheap idempotent GET/HEAD only. Gumroad is NOT
//     probed live: Mission Control polls every 60 s, and a stream of bogus
//     licence-verify POSTs from Netlify's shared egress IPs (the same IPs
//     validate-access.ts uses for real customer unlocks) looks like key
//     brute-forcing and could get throttled — so `gumroad` is an env-presence
//     check only (same pattern as unity-light's Jobber check).
//   * Total runtime < ~8s: Promise.all + 5s per-check timeouts.
//   * Auth: `Authorization: Bearer <MONITOR_STATUS_SECRET>` compared timing-safe
//     (sha256 both sides, then timingSafeEqual). Secret unset → 503 (fail
//     closed). Wrong/missing bearer → 401. GET only. Cache-Control: no-store on
//     EVERY response.
//
// This is a Netlify Functions v2 module (default export + `config.path`) rather
// than the v1 `handler` style used by validate-access / avatar-*: only v2 can
// bind a custom path, and Netlify evaluates function paths BEFORE redirect rules
// (docs → Request processing order), so `/api/monitor/status` is served here
// even though the `/api/*` rewrite in netlify.toml would otherwise map it to a
// non-existent `/.netlify/functions/monitor/status`. Both syntaxes coexist in
// one functions directory. NOTE: with a custom `path` the default
// `/.netlify/functions/monitor-status` URL is NOT available — the contract
// path is the ONLY URL this function answers on.
//
// Tests live in test/monitor-status.test.ts — deliberately OUTSIDE this
// directory, because Netlify's bundler zips every module in netlify/functions
// as a live function (tsconfig's exclude does not apply to it).

import { createHash, timingSafeEqual } from 'node:crypto';
import pkg from '../../package.json';

export const config = {
  path: '/api/monitor/status',
};

type CheckStatus = 'ok' | 'warn' | 'down';
interface MonitorCheck { id: string; label: string; status: CheckStatus; detail?: string }
interface MonitorCredit {
  id: string; label: string; used?: number; limit?: number; remaining?: number;
  unit?: string; status: CheckStatus; detail?: string;
}
interface MonitorRequests {
  open: number; new: number; inProgress: number; urgent: number;
  latest: { ref: string; title: string; priority: string; status: string; createdAt: string; by?: string }[];
  url?: string;
}
interface MonitorStatus {
  contract: 'prism-monitor/v1'; app: string; name: string; version: string; generatedAt: string;
  status: CheckStatus; checks: MonitorCheck[]; requests: MonitorRequests; credits: MonitorCredit[];
}

const APP_ID = 'tycoon';
const APP_NAME = 'Tycoon — Financial Freedom Simulator';
const SITE_URL = 'https://tycoonjan22026.netlify.app';
const CHECK_TIMEOUT_MS = 5_000;

// Supabase project "tycoon" (ref bvsqnhtlwklexyijvexw, us-east-1). These two
// values are duplicated from services/leaderboard.ts (SUPABASE_URL /
// SUPABASE_ANON_KEY) — that module drags in the browser auth client +
// localStorage, so it can't be imported into a function. The publishable key
// is public by design (shipped in the client bundle; RLS enforced). Keep in
// sync if leaderboard.ts ever changes them.
const SUPABASE_URL = 'https://bvsqnhtlwklexyijvexw.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_CGy4zjl117ghewz_U1Pxcw_d3VYFWj3';

// No in-app request queue exists for Tycoon → requests block is always empty.
const EMPTY_REQUESTS: MonitorRequests = { open: 0, new: 0, inProgress: 0, urgent: 0, latest: [], url: SITE_URL };

const respond = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

const shortError = (e: unknown) => String((e as any)?.message ?? e).slice(0, 200);

/** Release the socket for responses whose body we never read (undici keeps it open otherwise). */
const discardBody = (res: Response) => {
  try {
    void res.body?.cancel().catch(() => {});
  } catch {
    /* body may already be consumed/locked — irrelevant */
  }
};

// Hash both sides first so lengths never leak through timingSafeEqual's length check.
const safeEqual = (a: string, b: string) =>
  timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());

const RANK: Record<CheckStatus, number> = { ok: 0, warn: 1, down: 2 };
const worstOf = (items: { status: CheckStatus }[]) =>
  items.reduce<CheckStatus>((w, i) => (RANK[i.status] > RANK[w] ? i.status : w), 'ok');

const configCheck = (id: string, label: string, ok: boolean): MonitorCheck =>
  ok ? { id, label, status: 'ok' } : { id, label, status: 'warn', detail: 'not configured' };

/** Timeout + try/catch wrapper: any throw/timeout becomes status 'down'. */
async function runCheck(
  id: string,
  label: string,
  fn: (signal: AbortSignal) => Promise<{ status: CheckStatus; detail?: string }>,
): Promise<MonitorCheck> {
  try {
    const result = await fn(AbortSignal.timeout(CHECK_TIMEOUT_MS));
    return { id, label, ...result };
  } catch (e) {
    const msg = shortError(e);
    const detail = /timeout|abort/i.test(msg) ? `timed out after ${CHECK_TIMEOUT_MS}ms` : msg;
    return { id, label, status: 'down', detail };
  }
}

// 1. OpenAI — avatar generation (avatar-options / avatar-final) breaks without it.
async function openaiCheck(signal: AbortSignal) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { status: 'down' as const, detail: 'OPENAI_API_KEY missing' };
  const res = await fetch('https://api.openai.com/v1/models', {
    headers: { authorization: `Bearer ${key}` },
    signal,
  });
  discardBody(res); // /v1/models returns a multi-KB list we never need
  if (res.status === 401 || res.status === 403) return { status: 'down' as const, detail: `key rejected (${res.status})` };
  if (!res.ok) return { status: 'warn' as const, detail: `OpenAI HTTP ${res.status}` };
  return { status: 'ok' as const };
}

const supabaseHeaders = { apikey: SUPABASE_PUBLISHABLE_KEY, authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}` };

/** UTC date id — same convention as services/dailyChallenge.ts (challenge_id = "YYYY-MM-DD" UTC). */
const todayChallengeId = () => new Date().toISOString().slice(0, 10);

// 2. Supabase REST — project not paused, anon SELECT policy on daily_scores intact.
async function supabaseCheck(signal: AbortSignal) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/daily_scores?select=challenge_id&limit=1`, {
    headers: supabaseHeaders,
    signal,
  });
  discardBody(res);
  if (!res.ok) return { status: 'down' as const, detail: `PostgREST HTTP ${res.status}` };
  // Cheap extra: today's score count via HEAD + Prefer: count=exact (Content-Range: */N).
  let detail = 'daily_scores readable';
  try {
    const today = todayChallengeId(); // computed once so count + label can't straddle UTC midnight
    const head = await fetch(
      `${SUPABASE_URL}/rest/v1/daily_scores?select=challenge_id&challenge_id=eq.${today}`,
      { method: 'HEAD', headers: { ...supabaseHeaders, prefer: 'count=exact' }, signal },
    );
    discardBody(head);
    const range = head.headers.get('content-range') ?? '';
    const total = range.split('/')[1];
    if (head.ok && total && total !== '*') detail = `${total} scores today (${today})`;
  } catch {
    /* count is best-effort only */
  }
  return { status: 'ok' as const, detail };
}

// 3. Supabase Auth (GoTrue) — magic links / anonymous accounts / cloud sync depend on it.
async function supabaseAuthCheck(signal: AbortSignal) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/health`, { headers: supabaseHeaders, signal });
  if (!res.ok) return { status: 'down' as const, detail: `GoTrue HTTP ${res.status}` };
  let version = '';
  try {
    const data = (await res.json()) as { version?: string };
    version = data?.version ?? '';
  } catch {
    /* body optional */
  }
  return { status: 'ok' as const, detail: version ? `GoTrue ${version}` : undefined };
}

// 4. Gumroad — env-presence ONLY (GUMROAD_PRODUCT_ID). Deliberately NOT a live
//    licence-verify probe: at Mission Control's 60 s poll that would be ~1,440
//    bogus-key POSTs/day from the same Netlify egress IPs validate-access.ts
//    uses for real customer unlocks — a throttle/block there would break paying
//    customers' unlocks. Real Gumroad reachability is exercised by validate-access
//    itself. (Was a live probe in the first draft; downgraded on review.)
//    If Pieter explicitly wants a live probe later: POST /v2/licenses/verify with
//    a bogus key + increment_uses_count=false is read-only (verified 2026-08-15:
//    404 {"success":false,...}) — but keep the polling volume in mind.

// 6. Live site — the SPA shell responds and is the Tycoon bundle.
async function siteCheck(signal: AbortSignal) {
  const res = await fetch(`${SITE_URL}/`, { headers: { accept: 'text/html' }, signal });
  if (!res.ok) return { status: 'down' as const, detail: `HTTP ${res.status}` };
  const html = await res.text();
  if (!/Tycoon/i.test(html)) return { status: 'warn' as const, detail: '200 but "Tycoon" not found in HTML' };
  return { status: 'ok' as const, detail: `HTTP ${res.status}` };
}

export default async (req: Request): Promise<Response> => {
  const secret = process.env.MONITOR_STATUS_SECRET;
  if (!secret) return respond({ error: 'not configured' }, 503);
  const h = req.headers.get('authorization') ?? '';
  const bearer = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!bearer || !safeEqual(bearer, secret)) return respond({ error: 'unauthorized' }, 401);
  if (req.method !== 'GET') return respond({ error: 'method not allowed' }, 405);

  const base = {
    contract: 'prism-monitor/v1' as const,
    app: APP_ID,
    name: APP_NAME,
    version: pkg.version,
    generatedAt: new Date().toISOString(),
  };

  try {
    const [openai, supabase, supabaseAuth, site] = await Promise.all([
      runCheck('openai', 'OpenAI (avatar generation)', openaiCheck),
      runCheck('supabase', 'Supabase REST (daily_scores)', supabaseCheck),
      runCheck('supabase-auth', 'Supabase Auth (GoTrue)', supabaseAuthCheck),
      runCheck('site', 'Live site', siteCheck),
    ]);
    // 4 + 5. gumroad / access-codes — env presence only (see notes above).
    const checks: MonitorCheck[] = [
      openai,
      supabase,
      supabaseAuth,
      configCheck('gumroad', 'Gumroad licence API (GUMROAD_PRODUCT_ID)', !!process.env.GUMROAD_PRODUCT_ID),
      configCheck('access-codes', 'Access codes (ACCESS_CODES)', !!process.env.ACCESS_CODES),
      site,
    ];
    const credits: MonitorCredit[] = []; // no metered credits tracked (OpenAI billing endpoints deliberately NOT called)
    const body: MonitorStatus = {
      ...base,
      status: worstOf([...checks, ...credits]),
      checks,
      requests: EMPTY_REQUESTS,
      credits,
    };
    return respond(body, 200);
  } catch (e) {
    // Absolute backstop — the contract forbids a 500.
    console.error('monitor-status failed:', shortError(e));
    const body: MonitorStatus = {
      ...base,
      status: 'down',
      checks: [{ id: 'endpoint', label: 'Monitor endpoint', status: 'down', detail: shortError(e) }],
      requests: EMPTY_REQUESTS,
      credits: [],
    };
    return respond(body, 200);
  }
};
