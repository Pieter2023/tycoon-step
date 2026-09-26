const { webkit, devices } = require(process.env.HOME + '/.npm/_npx/420ff84f11983ee5/node_modules/playwright');
const out = process.argv[2];
const targets = [['before', 'https://tycoonjan22026.netlify.app/'], ['after', 'http://localhost:5190/']];
(async () => {
  const browser = await webkit.launch();
  for (const [name, url] of targets) {
    const ctx = await browser.newContext({ ...devices['iPhone 15 Pro'] });
    await ctx.addInitScript(() => { for (const [k, v] of [['tycoon_onboarding_seen_v1', '1'], ['tycoon_quick_tutorial_seen_v1', '1'], ['tycoon_authenticated', 'true'], ['tycoon_access_tier', 'full']]) localStorage.setItem(k, v); });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Start a new game' }).click();
    await page.getByRole('heading', { name: 'Alex Chen' }).click();
    await page.getByRole('button', { name: 'Learn', exact: true }).click();
    await page.getByText('Tap to open Self Learn').click();
    await page.getByRole('button', { name: 'Start Certification' }).click();
    const dialog = page.getByRole('dialog', { name: 'Sales Accelerator quiz' });
    await dialog.waitFor();
    await page.waitForTimeout(800);
    const m = await dialog.evaluate(el => { const r = el.getBoundingClientRect(), ov = el.parentElement; const b = [...el.querySelectorAll('button')].map(x => [(x.innerText || x.getAttribute('aria-label')).trim(), Math.round(x.getBoundingClientRect().top), Math.round(x.getBoundingClientRect().bottom)]); return { vh: innerHeight, top: Math.round(r.top), bottom: Math.round(r.bottom), scrollable: ov.scrollHeight > ov.clientHeight, buttons: b }; });
    console.log(name, JSON.stringify(m));
    await page.screenshot({ path: `${out}/${name}-top.png` });
    await dialog.evaluate(el => { el.parentElement.scrollTop = el.parentElement.scrollHeight; });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${out}/${name}-bottom.png` });
    await ctx.close();
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
