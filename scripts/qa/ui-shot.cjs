// Headless screenshots of the 2D UI for design QA (no browser pane needed).
//
//   node scripts/qa/ui-shot.cjs --out /tmp/shots --name money --size 1280x800 --nav Money
//   node scripts/qa/ui-shot.cjs --out /tmp/shots --name phone-life --size 393x659 --nav Life --engine webkit
//   node scripts/qa/ui-shot.cjs --out /tmp/shots --name picker --stay-on-menu
//
// Options:
//   --url        dev server (default http://127.0.0.1:5192)
//   --size       WxH viewport (default 1280x800); widths under 768 use the phone shell
//   --engine     chromium (default) | webkit (with --size 393x659 it emulates the iPhone 15 Pro)
//   --fixture    load test/fixtures/save-production-2026-09-13-month7.json and Continue it
//                (default: start a new game as Alex Chen)
//   --nav        a nav button's accessible name to click after the game opens (Play, Money, Career, Learn, Life)
//   --click      extra button names to click in order, comma-separated (e.g. "Portfolio,Bank")
//   --full       full-page screenshot
//   --reduce     emulate prefers-reduced-motion
//   --stay-on-menu  screenshot the mode picker instead of starting a game
//   --wait       ms to wait before the shot (default 900, lets entrance springs settle)
//
// Uses the Playwright cached by npx (see HANDOVER §6). Seeds the gates/tutorial keys and keeps the
// 3D city from auto-opening (tycoon_start_in_city=0), and opts out of analytics (umami.disabled) so
// shots of the live site are never counted. Each run is a fresh browser profile.
const path = require('path');
const pwPath = process.env.HOME + '/.npm/_npx/420ff84f11983ee5/node_modules/playwright';
const { chromium, webkit, devices } = require(pwPath);

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf('--' + name);
  if (i < 0) return fallback;
  const next = args[i + 1];
  return next === undefined || next.startsWith('--') ? true : next;
};

(async () => {
  const url = opt('url', 'http://127.0.0.1:5192');
  const out = opt('out', '.');
  const name = opt('name', 'shot');
  const [w, h] = String(opt('size', '1280x800')).split('x').map(Number);
  const engine = opt('engine', 'chromium');
  // The npx Playwright expects a newer Chromium than the cache holds; use the cached headless shell.
  const fs = require('fs');
  const cache = process.env.HOME + '/Library/Caches/ms-playwright';
  const shell = fs.existsSync(cache) ? fs.readdirSync(cache).filter((d) => d.startsWith('chromium_headless_shell-')).sort().pop() : null;
  const executablePath = shell ? `${cache}/${shell}/chrome-headless-shell-mac-arm64/chrome-headless-shell` : undefined;
  const browser = engine === 'webkit' ? await webkit.launch() : await chromium.launch({ executablePath });
  const phone = w < 768;
  const ctxOpts = engine === 'webkit' && phone
    ? { ...devices['iPhone 15 Pro'], viewport: { width: w, height: h } }
    : { viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: phone, isMobile: phone && engine !== 'webkit' ? false : undefined };
  if (opt('reduce', false)) ctxOpts.reducedMotion = 'reduce';
  const ctx = await browser.newContext(ctxOpts);
  await ctx.addInitScript(() => {
    for (const [k, v] of [['tycoon_onboarding_seen_v1', '1'], ['tycoon_quick_tutorial_seen_v1', '1'], ['tycoon_authenticated', 'true'], ['tycoon_access_tier', 'full'], ['tycoon_start_in_city', '0'], ['umami.disabled', '1']]) localStorage.setItem(k, v);
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('pageerror:', e.message));
  await page.goto(url, { waitUntil: 'networkidle' });

  if (!opt('stay-on-menu', false)) {
    if (opt('fixture', false)) {
      await page.evaluate(async () => {
        const r = await fetch('/test/fixtures/save-production-2026-09-13-month7.json');
        localStorage.setItem('tycoon_saves_v2', await r.text());
      });
      await page.reload({ waitUntil: 'networkidle' });
      await page.getByText('Continue Adult').first().click();
    } else {
      await page.getByRole('button', { name: 'Start a new game' }).click();
      await page.getByRole('heading', { name: 'Alex Chen' }).click();
    }
    await page.waitForTimeout(1200);
    // Close anything that opened on arrival (a pending event resolves with its cheapest option).
    const nav = opt('nav', false);
    if (nav) await page.getByRole('button', { name: new RegExp('^' + String(nav)) }).first().click();
    const clicks = opt('click', false);
    if (clicks) {
      for (const label of String(clicks).split(',')) {
        // Exact name first ("Bank" must not hit the "Money … bank" nav button), then a prefix match.
        const exact = page.getByRole('button', { name: label.trim(), exact: true });
        const target = (await exact.count()) ? exact : page.getByRole('button', { name: new RegExp('^' + label.trim()) });
        await target.first().click();
        await page.waitForTimeout(400);
      }
    }
  }
  await page.waitForTimeout(Number(opt('wait', 900)));
  const file = path.join(out, `${name}.png`);
  await page.screenshot({ path: file, fullPage: !!opt('full', false) });
  console.log(file);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
