const { webkit, devices } = require(process.env.HOME + '/.npm/_npx/420ff84f11983ee5/node_modules/playwright');
const [out, url, tag] = process.argv.slice(2);
(async () => {
  const browser = await webkit.launch();
  const ctx = await browser.newContext({ ...devices['iPhone 15 Pro'] });
  await ctx.addInitScript(() => { for (const [k, v] of [['tycoon_onboarding_seen_v1', '1'], ['tycoon_quick_tutorial_seen_v1', '1'], ['tycoon_authenticated', 'true'], ['tycoon_access_tier', 'full']]) localStorage.setItem(k, v); });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('pageerror', e.message));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Start a new game' }).click();
  await page.getByRole('heading', { name: 'Alex Chen' }).click();
  await page.getByRole('button', { name: /Enter 3D city/ }).first().click();
  await page.waitForSelector('canvas[role=application]', { timeout: 30000 });
  await page.waitForFunction(() => !document.querySelector('.town-loading'), null, { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2500);
  const layout = () => page.evaluate(() => { const box = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return getComputedStyle(e).display === 'none' ? 'hidden' : [Math.round(r.top), Math.round(r.height)]; }; return { vh: innerHeight, header: box('.town-header'), dest: box('.town-destinations-wrap') ?? box('.town-destinations'), roomBar: box('.town-room-bar'), interior: box('.town-interior-nav'), help: box('.town-location-help'), strip: box('.town-journey-strip'), viewport: box('.town-viewport'), more: !!document.querySelector('.town-dest-right'), less: !!document.querySelector('.town-dest-left') }; });
  console.log(tag, 'city', JSON.stringify(await layout()));
  await page.screenshot({ path: `${out}/${tag}-city.png` });
  const more = page.locator('.town-dest-right');
  if (await more.count()) {
    await more.click(); await page.waitForTimeout(900);
    const s = await page.evaluate(() => { const n = document.querySelector('.town-destinations'); return { scrollLeft: Math.round(n.scrollLeft), less: !!document.querySelector('.town-dest-left'), more: !!document.querySelector('.town-dest-right'), visible: [...n.querySelectorAll('button')].filter(b => { const r = b.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; }).map(b => b.innerText.trim().split('\n')[0]) }; });
    console.log(tag, 'after ›', JSON.stringify(s));
    await page.screenshot({ path: `${out}/${tag}-city-scrolled.png` });
    await more.click().catch(() => {}); await page.waitForTimeout(900);
    console.log(tag, 'after ›› ', JSON.stringify(await page.evaluate(() => ({ less: !!document.querySelector('.town-dest-left'), more: !!document.querySelector('.town-dest-right') }))));
  }
  // Into the bank: the guide button walks there and in.
  await page.locator('.town-guide-next').click();
  await page.waitForFunction(() => /Bank/.test(document.querySelector('.town-header h2')?.textContent || ''), null, { timeout: 60000 }).catch(() => console.log('bank not reached'));
  await page.waitForTimeout(2500);
  console.log(tag, 'bank strip', JSON.stringify(await page.evaluate(() => { const g = document.querySelector('.town-guide-next'), sm = document.querySelector('.town-journey-summary'), st = document.querySelector('.town-journey-strip'); return { guide: g.innerText, guideW: Math.round(g.getBoundingClientRect().width), summaryW: Math.round(sm.getBoundingClientRect().width), stripH: Math.round(st.getBoundingClientRect().height) }; })));
  await page.screenshot({ path: `${out}/${tag}-bank-panel.png`, clip: { x: 0, y: 0, width: 393, height: 260 } });
  const close = page.locator('.town-close-details'); if (await close.count()) await close.first().click().catch(() => {});
  await page.waitForTimeout(800);
  console.log(tag, 'bank', JSON.stringify(await layout()), await page.evaluate(() => document.querySelector('.town-header h2')?.textContent));
  console.log(tag, 'room bar fits', JSON.stringify(await page.evaluate(() => { const b = document.querySelector('.town-room-bar'); if (!b) return null; const h = document.querySelector('.town-location-help').getBoundingClientRect(); return { scroll: [b.scrollWidth, b.clientWidth], helpRight: Math.round(h.right), help: document.querySelector('.town-location-help').getAttribute('aria-label') }; })));
  await page.screenshot({ path: `${out}/${tag}-bank.png` });
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
