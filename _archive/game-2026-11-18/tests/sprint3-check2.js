'use strict';
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();

  page.on('console', msg => { if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text()); });
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('http://localhost:3000/pages/game.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // Toggle to light theme BEFORE hiding overlay — redraw happens in rAF loop
  await page.evaluate(() => { document.querySelector('.js-theme-toggle')?.click(); });
  await page.waitForTimeout(800);

  await page.evaluate(() => {
    const ov = document.getElementById('overlayStart');
    if (ov) ov.classList.add('is-hidden');
  });
  await page.waitForTimeout(1200);

  const lightVars = await page.evaluate(() => {
    const s = getComputedStyle(document.documentElement);
    return {
      pants: s.getPropertyValue('--nurse-pants').trim(),
      themeClass: document.documentElement.className,
    };
  });
  console.log('LIGHT vars:', JSON.stringify(lightVars));

  const scan = await page.evaluate(() => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const img = ctx.getImageData(0, 0, w, h).data;
    const target = { r: 0x7f, g: 0xb5, b: 0xd8 };
    let pantsCount = 0;
    let firstPant = null;
    // Scan non-transparent unique colors
    const colorMap = {};
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const r = img[i], g = img[i+1], b = img[i+2], a = img[i+3];
        if (a === 0) continue;
        if (Math.abs(r - target.r) <= 4 && Math.abs(g - target.g) <= 4 && Math.abs(b - target.b) <= 4) {
          pantsCount++;
          if (!firstPant) firstPant = { x, y, r, g, b };
        }
        // Aggregate unique colors that could be pants (blueish)
        if (b > r && b > g && b > 150 && r > 100) {
          const k = `${r},${g},${b}`;
          colorMap[k] = (colorMap[k]||0) + 1;
        }
      }
    }
    const topBlues = Object.entries(colorMap).sort((a,b)=>b[1]-a[1]).slice(0, 6);
    return { w, h, pantsCount, firstPant, topBlues };
  });
  console.log('LIGHT canvas scan:', JSON.stringify(scan, null, 2));

  await page.screenshot({ path: 'tests/screenshots/sprint3-light2.png', fullPage: false });
  await browser.close();
})().catch(e => { console.error('ERR', e); process.exit(1); });
