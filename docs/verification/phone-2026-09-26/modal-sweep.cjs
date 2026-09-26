const { webkit, devices } = require(process.env.HOME + '/.npm/_npx/420ff84f11983ee5/node_modules/playwright');
const targets = [['live', 'https://tycoonjan22026.netlify.app/'], ['fixed', 'http://localhost:5190/']];
const measure = page => page.evaluate(() => [...document.querySelectorAll('[role=dialog][aria-modal=true]')].map(el => { const r = el.getBoundingClientRect(), ov = el.parentElement; const cs = getComputedStyle(ov); const ok = r.top >= 0 && (r.bottom <= innerHeight || cs.overflowY === 'auto' || cs.overflowY === 'scroll' || getComputedStyle(el).overflowY === 'auto'); return `${el.getAttribute('aria-label')}: top ${Math.round(r.top)}, bottom ${Math.round(r.bottom)} / ${innerHeight} → ${ok ? 'reachable' : 'CUT OFF'}`; }).pop());
(async () => {
  const browser = await webkit.launch();
  for (const [name, url] of targets) {
    const ctx = await browser.newContext({ ...devices['iPhone 15 Pro'] });
    await ctx.addInitScript(() => { for (const [k, v] of [['tycoon_onboarding_seen_v1', '1'], ['tycoon_quick_tutorial_seen_v1', '1'], ['tycoon_authenticated', 'true'], ['tycoon_access_tier', 'full']]) localStorage.setItem(k, v); });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Start a new game' }).click();
    await page.getByRole('heading', { name: 'Alex Chen' }).click();
    await page.waitForTimeout(500);
    const res = [];
    const quick = async (label) => { await page.locator('[aria-label="More options"],[aria-label="Quick actions"]').first().click(); await page.waitForTimeout(300); await page.getByRole('dialog').getByRole('button', { name: new RegExp(label, 'i') }).first().click(); await page.waitForTimeout(700); res.push(await measure(page)); await page.keyboard.press('Escape'); await page.waitForTimeout(300); await page.keyboard.press('Escape'); await page.waitForTimeout(300); };
    for (const l of ['Run summary', 'Glossary', 'Tutorial videos', 'Save']) { try { await quick(l); } catch (e) { res.push(`${l}: not reached (${e.message.split('\n')[0].slice(0, 60)})`); } }
    try { await page.getByRole('button', { name: 'Learn', exact: true }).click(); await page.getByText('Tap to open Self Learn').click(); await page.getByRole('button', { name: 'Start Certification' }).click(); await page.waitForTimeout(700); res.push(await measure(page)); } catch (e) { res.push('quiz: ' + e.message.slice(0, 60)); }
    console.log(`\n${name}:\n  ` + res.join('\n  '));
    await ctx.close();
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
