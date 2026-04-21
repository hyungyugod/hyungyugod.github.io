'use strict';
const { chromium } = require('playwright');
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

function checkServerUp(url){return new Promise((r)=>{http.get(url,(res)=>{res.resume();r(res.statusCode<500);}).on('error',()=>r(false));});}
function wait(ms){return new Promise(r=>setTimeout(r,ms));}

(async () => {
  let srv = null;
  if (!(await checkServerUp('http://localhost:8000'))) {
    srv = spawn('python', ['-m', 'http.server', '8000'], { cwd: path.join(__dirname,'..'), stdio:'ignore', detached:false });
    for (let i=0;i<20;i++){ if(await checkServerUp('http://localhost:8000')) break; await wait(250); }
  }
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport:{width:1280,height:800}, deviceScaleFactor:2 });
  const page = await ctx.newPage();
  await page.goto('http://localhost:8000/pages/game.html', { waitUntil:'networkidle' });
  await wait(500);

  // overlay 숨겨서 프리뷰 보기
  await page.evaluate(() => {
    const ov = document.getElementById('overlayStart');
    if (ov) ov.classList.add('is-hidden');
  });
  await wait(300);
  const canvas = await page.$('#gameCanvas');
  const box = await canvas.boundingBox();
  await page.screenshot({ path:'tests/screenshots/game-preview-desktop.png', clip:{x:box.x, y:box.y, width:box.width, height:box.height} });
  console.log('preview screenshot saved');

  // 라이트 모드 토글 후 프리뷰
  await page.evaluate(() => { document.querySelector('.js-theme-toggle')?.click(); });
  await wait(400);
  await page.screenshot({ path:'tests/screenshots/game-preview-desktop-light.png', clip:{x:box.x, y:box.y, width:box.width, height:box.height} });
  console.log('light preview saved');

  await browser.close();
  if (srv) srv.kill();
})();
