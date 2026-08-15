import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// Lives in test/ (NOT netlify/functions/) on purpose: Netlify's bundler would
// otherwise deploy this file as a live function.
import handler, { config } from '../netlify/functions/monitor-status';

const SECRET = 'test-monitor-secret';
const url = 'https://tycoonjan22026.netlify.app/api/monitor/status';
const get = (auth?: string) =>
  handler(new Request(url, { method: 'GET', headers: auth ? { authorization: auth } : {} }));

const jsonResponse = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });

/** Happy-path fetch implementation covering every vendor the endpoint probes. */
const happyImpl = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const u = String(input);
  if (u.startsWith('https://api.openai.com/v1/models')) return jsonResponse({ data: [] });
  if (u.includes('/rest/v1/daily_scores') && init?.method === 'HEAD') {
    return new Response(null, { status: 200, headers: { 'content-range': '*/7' } });
  }
  if (u.includes('/rest/v1/daily_scores')) return jsonResponse([{ challenge_id: '2026-08-15' }]);
  if (u.includes('/auth/v1/health')) return jsonResponse({ version: 'v2.195.0', name: 'GoTrue' });
  if (u.startsWith('https://tycoonjan22026.netlify.app/')) {
    return new Response('<html><title>Tycoon</title></html>', { status: 200, headers: { 'content-type': 'text/html' } });
  }
  throw new Error(`unexpected fetch ${u}`);
};
const happyFetch = vi.fn(happyImpl);

describe('monitor-status (prism-monitor/v1)', () => {
  const env = { ...process.env };

  beforeEach(() => {
    process.env.MONITOR_STATUS_SECRET = SECRET;
    process.env.OPENAI_API_KEY = 'sk-test';
    process.env.GUMROAD_PRODUCT_ID = 'prod_test';
    process.env.ACCESS_CODES = 'ALPHA,BETA';
    happyFetch.mockReset();
    happyFetch.mockImplementation(happyImpl);
    vi.stubGlobal('fetch', happyFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    for (const k of Object.keys(process.env)) if (!(k in env)) delete process.env[k];
    Object.assign(process.env, env);
  });

  it('binds only the contract path', () => {
    expect(config.path).toBe('/api/monitor/status');
  });

  it('fails closed with 503 when MONITOR_STATUS_SECRET is unset', async () => {
    delete process.env.MONITOR_STATUS_SECRET;
    const res = await get(`Bearer ${SECRET}`);
    expect(res.status).toBe(503);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(await res.json()).toEqual({ error: 'not configured' });
    expect(happyFetch).not.toHaveBeenCalled();
  });

  it('rejects a missing or wrong bearer with 401', async () => {
    for (const auth of [undefined, 'Bearer nope', `Basic ${SECRET}`, SECRET]) {
      const res = await get(auth);
      expect(res.status).toBe(401);
      expect(res.headers.get('cache-control')).toBe('no-store');
      expect(await res.json()).toEqual({ error: 'unauthorized' });
    }
    expect(happyFetch).not.toHaveBeenCalled();
  });

  it('is GET only (405 after auth)', async () => {
    const res = await handler(new Request(url, { method: 'POST', headers: { authorization: `Bearer ${SECRET}` } }));
    expect(res.status).toBe(405);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('returns the full contract body with status ok when everything is healthy', async () => {
    const res = await get(`Bearer ${SECRET}`);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const body = await res.json();
    expect(body.contract).toBe('prism-monitor/v1');
    expect(body.app).toBe('tycoon');
    expect(body.name).toBe('Tycoon — Financial Freedom Simulator');
    expect(body.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(new Date(body.generatedAt).toISOString()).toBe(body.generatedAt);
    expect(body.status).toBe('ok');
    expect(body.checks.map((c: any) => c.id)).toEqual([
      'openai', 'supabase', 'supabase-auth', 'gumroad', 'access-codes', 'site',
    ]);
    for (const c of body.checks) expect(c.status).toBe('ok');
    expect(body.checks.find((c: any) => c.id === 'supabase').detail).toMatch(/^7 scores today/);
    expect(body.requests).toEqual({ open: 0, new: 0, inProgress: 0, urgent: 0, latest: [], url: 'https://tycoonjan22026.netlify.app' });
    expect(body.credits).toEqual([]);
    // Strictly read-only: GET/HEAD only, and Gumroad is never called (env-presence check).
    for (const [input, init] of happyFetch.mock.calls) {
      expect(['GET', 'HEAD']).toContain((init?.method ?? 'GET').toUpperCase());
      expect(String(input)).not.toContain('gumroad');
    }
  });

  it('marks openai down when the key is missing and warn-only for missing GUMROAD/ACCESS_CODES', async () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.GUMROAD_PRODUCT_ID;
    delete process.env.ACCESS_CODES;
    const body = await (await get(`Bearer ${SECRET}`)).json();
    const byId = Object.fromEntries(body.checks.map((c: any) => [c.id, c]));
    expect(byId.openai).toMatchObject({ status: 'down', detail: 'OPENAI_API_KEY missing' });
    expect(byId.gumroad).toMatchObject({ status: 'warn', detail: 'not configured' });
    expect(byId['access-codes']).toMatchObject({ status: 'warn', detail: 'not configured' });
    expect(body.status).toBe('down');
  });

  it('marks openai down on 401 and never throws when a vendor fetch rejects', async () => {
    happyFetch.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const u = String(input);
      if (u.startsWith('https://api.openai.com')) return jsonResponse({ error: 'bad key' }, 401);
      if (u.includes('/auth/v1/health')) throw new TypeError('fetch failed');
      if (u.includes('/rest/v1/daily_scores')) return jsonResponse([], 200);
      return new Response('Tycoon', { status: 200 });
    });
    const res = await get(`Bearer ${SECRET}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    const byId = Object.fromEntries(body.checks.map((c: any) => [c.id, c]));
    expect(byId.openai).toMatchObject({ status: 'down', detail: 'key rejected (401)' });
    expect(byId['supabase-auth']).toMatchObject({ status: 'down', detail: 'fetch failed' });
    expect(byId.supabase.status).toBe('ok');
    expect(body.status).toBe('down');
  });

  it('supabase HTTP error → down; site without "Tycoon" → warn; still 200 overall', async () => {
    happyFetch.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const u = String(input);
      if (u.includes('/rest/v1/daily_scores')) return jsonResponse({ message: 'paused' }, 503);
      if (u.startsWith('https://tycoonjan22026.netlify.app/')) return new Response('<html>Other</html>', { status: 200 });
      return happyImpl(u, init);
    });
    const res = await get(`Bearer ${SECRET}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    const byId = Object.fromEntries(body.checks.map((c: any) => [c.id, c]));
    expect(byId.supabase).toMatchObject({ status: 'down', detail: 'PostgREST HTTP 503' });
    expect(byId.site.status).toBe('warn');
    expect(body.status).toBe('down');
  });
});
