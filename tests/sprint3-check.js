'use strict';
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();

  page.on('console', msg => { if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text()); });
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('http://localhost:3000/pages/game.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);

  // CSS var values
  const darkVars = await page.evaluate(() => {
    const s = getComputedStyle(document.documentElement);
    return {
      pants: s.getPropertyValue('--nurse-pants').trim(),
      bun: s.getPropertyValue('--nurse-bun').trim(),
      bunShadow: s.getPropertyValue('--nurse-bun-shadow').trim(),
      chiefUniform: s.getPropertyValue('--nurse-chief-uniform').trim(),
    };
  });
  console.log('DARK vars:', JSON.stringify(darkVars));

  // Hide overlay to see sprites
  await page.evaluate(() => {
    const ov = document.getElementById('overlayStart');
    if (ov) ov.classList.add('is-hidden');
  });
  await page.waitForTimeout(500);

  // Sample canvas pixel colors around where the player draws.
  // Check canvas exists; scan for any pixel matching #9ec9e8 (dark-theme pants)
  const darkScan = await page.evaluate(() => {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return { error: 'no canvas' };
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const img = ctx.getImageData(0, 0, w, h).data;
    // Count pixels matching target pants color (allow small tolerance)
    const target = { r: 0x9e, g: 0xc9, b: 0xe8 };
    let pantsCount = 0;
    let firstPant = null;
    let chiefUniformCount = 0; // #f4f0ee
    const chief = { r: 0xf4, g: 0xf0, b: 0xee };
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const r = img[i], g = img[i+1], b = img[i+2], a = img[i+3];
        if (a === 0) continue;
        if (Math.abs(r - target.r) <= 4 && Math.abs(g - target.g) <= 4 && Math.abs(b - target.b) <= 4) {
          pantsCount++;
          if (!firstPant) firstPant = { x, y, r, g, b };
        }
        if (Math.abs(r - chief.r) <= 4 && Math.abs(g - chief.g) <= 4 && Math.abs(b - chief.b) <= 4) {
          chiefUniformCount++;
        }
      }
    }
    return { w, h, pantsCount, firstPant, chiefUniformCount };
  });
  console.log('DARK canvas scan:', JSON.stringify(darkScan));

  await page.screenshot({ path: 'tests/screenshots/sprint3-dark.png', fullPage: false });

  // Toggle to light
  await page.evaluate(() => { document.querySelector('.js-theme-toggle')?.click(); });
  await page.waitForTimeout(600);

  const lightVars = await page.evaluate(() => {
    const s = getComputedStyle(document.documentElement);
    return {
      pants: s.getPropertyValue('--nurse-pants').trim(),
      bun: s.getPropertyValue('--nurse-bun').trim(),
    };
  });
  console.log('LIGHT vars:', JSON.stringify(lightVars));

  const lightScan = await page.evaluate(() => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const img = ctx.getImageData(0, 0, w, h).data;
    const target = { r: 0x7f, g: 0xb5, b: 0xd8 };
    let pantsCount = 0;
    let firstPant = null;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const r = img[i], g = img[i+1], b = img[i+2], a = img[i+3];
        if (a === 0) continue;
        if (Math.abs(r - target.r) <= 4 && Math.abs(g - target.g) <= 4 && Math.abs(b - target.b) <= 4) {
          pantsCount++;
          if (!firstPant) firstPant = { x, y, r, g, b };
        }
      }
    }
    return { w, h, pantsCount, firstPant };
  });
  console.log('LIGHT canvas scan:', JSON.stringify(lightScan));

  await page.screenshot({ path: 'tests/screenshots/sprint3-light.png', fullPage: false });

  await browser.close();
})().catch(e => { console.error('ERR', e); process.exit(1); });
