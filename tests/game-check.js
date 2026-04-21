'use strict';
const { chromium } = require('playwright');
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

function checkServerUp(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => { res.resume(); resolve(res.statusCode < 500); })
        .on('error', () => resolve(false));
  });
}
function startDevServer() {
  return spawn('python', ['-m', 'http.server', '8000'], {
    cwd: path.join(__dirname, '..'), stdio: 'ignore', detached: false
  });
}
async function wait(ms){return new Promise(r=>setTimeout(r,ms));}

(async () => {
  let srv = null;
  if (!(await checkServerUp('http://localhost:8000'))) {
    srv = startDevServer();
    for (let i=0;i<20;i++){ if(await checkServerUp('http://localhost:8000')) break; await wait(250); }
  }
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 375, height: 667 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type()==='error') errors.push(m.text()); });

  await page.goto('http://localhost:8000/pages/game.html', { waitUntil: 'networkidle' });
  await wait(500);

  // overlayStart 표시 여부 / 스크롤 여부 측정
  const data = await page.evaluate(() => {
    const overlay = document.getElementById('overlayStart');
    const panel = overlay ? overlay.querySelector('.game-overlay__panel--start') : null;
    const wrap = document.querySelector('.game-canvas-wrap');
    const btn = document.getElementById('btnStart');
    const ovRect = overlay.getBoundingClientRect();
    const pRect = panel.getBoundingClientRect();
    const wRect = wrap.getBoundingClientRect();
    const bRect = btn.getBoundingClientRect();
    return {
      viewportH: window.innerHeight,
      overlayRect: { x: ovRect.x, y: ovRect.y, w: ovRect.width, h: ovRect.height },
      panelRect: { x: pRect.x, y: pRect.y, w: pRect.width, h: pRect.height },
      canvasWrapRect: { x: wRect.x, y: wRect.y, w: wRect.width, h: wRect.height },
      btnStartRect: { x: bRect.x, y: bRect.y, w: bRect.width, h: bRect.height },
      panelScrollH: panel.scrollHeight,
      overlayScrollH: overlay.scrollHeight,
      overlayClientH: overlay.clientHeight,
      // overlay에 스크롤이 실제로 발생했는가
      overlayHasScroll: overlay.scrollHeight > overlay.clientHeight,
    };
  });
  console.log('=== iPhone SE (375x667) game.html 검사 ===');
  console.log(JSON.stringify(data, null, 2));

  // panel이 overlay 내부에서 잘리는가 / 시작 버튼이 overlay 내부에 보이는가
  const panelBottomInOverlay = data.panelRect.y + data.panelRect.h;
  const overlayBottom = data.overlayRect.y + data.overlayRect.h;
  const btnVisible = data.btnStartRect.y >= data.overlayRect.y 
                  && (data.btnStartRect.y + data.btnStartRect.h) <= overlayBottom;
  console.log(`panel bottom: ${panelBottomInOverlay}, overlay bottom: ${overlayBottom}`);
  console.log(`시작 버튼이 오버레이 영역 내부에 보이는가: ${btnVisible}`);
  console.log(`overlay에 스크롤 발생: ${data.overlayHasScroll}`);

  // 스크린샷 저장
  await page.screenshot({ path: 'tests/screenshots/game-mobile-375.png', fullPage: false });
  console.log('screenshot saved to tests/screenshots/game-mobile-375.png');

  // 수간호사 스프라이트 프리뷰 확인을 위해 캔버스 영역 스크린샷
  // overlay는 canvas 앞에 깔려있어 수간호사는 거의 안 보임 → 오버레이만 숨기고 다시 캡쳐
  await page.evaluate(() => {
    const ov = document.getElementById('overlayStart');
    if (ov) ov.classList.add('is-hidden');
  });
  await wait(300);
  await page.screenshot({ path: 'tests/screenshots/game-mobile-375-canvas.png', fullPage: false });
  console.log('canvas-only screenshot saved');

  // 콘솔 에러
  console.log(`콘솔/페이지 에러: ${errors.length}건`);
  errors.forEach(e => console.log('  - ' + e));

  await browser.close();
  if (srv) srv.kill();
})();
