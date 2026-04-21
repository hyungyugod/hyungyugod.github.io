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

  // Toggle to light theme
  await page.evaluate(() => { document.querySelector('.js-theme-toggle')?.click(); });
  await page.waitForTimeout(400);

  // Force preview redraw by clicking a difficulty button
  await page.evaluate(() => {
    const btn = document.querySelector('.game-difficulty__btn[aria-checked="true"]');
    if (btn) btn.click();
  });
  await page.waitForTimeout(500);

  await page.evaluate(() => {
    const ov = document.getElementById('overlayStart');
    if (ov) ov.classList.add('is-hidden');
  });
  await page.waitForTimeout(500);

  const lightVars = await page.evaluate(() => {
    const s = getComputedStyle(document.documentElement);
    return { pants: s.getPropertyValue('--nurse-pants').trim(), themeClass: document.documentElement.className };
  });
  console.log('LIGHT vars:', JSON.stringify(lightVars));

  const scan = await page.evaluate(() => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const img = ctx.getImageData(0, 0, w, h).data;
    const targetLight = { r: 0x7f, g: 0xb5, b: 0xd8 };
    const targetDark = { r: 0x9e, g: 0xc9, b: 0xe8 };
    let lightCount = 0, darkCount = 0;
    let firstLight = null;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const r = img[i], g = img[i+1], b = img[i+2], a = img[i+3];
        if (a === 0) continue;
        if (Math.abs(r - targetLight.r) <= 4 && Math.abs(g - targetLight.g) <= 4 && Math.abs(b - targetLight.b) <= 4) {
          lightCount++;
          if (!firstLight) firstLight = { x, y };
        }
        if (Math.abs(r - targetDark.r) <= 4 && Math.abs(g - targetDark.g) <= 4 && Math.abs(b - targetDark.b) <= 4) {
          darkCount++;
        }
      }
    }
    return { lightCount, darkCount, firstLight };
  });
  console.log('LIGHT canvas (after redraw):', JSON.stringify(scan));

  await page.screenshot({ path: 'tests/screenshots/sprint3-light-redraw.png', fullPage: false });
  await browser.close();
})().catch(e => { console.error('ERR', e); process.exit(1); });
