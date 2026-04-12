'use strict';

/**
 * Playwright UI 검증 스크립트
 * 사용법: node tests/ui-check.js
 * 또는:  npm run ui-check
 */

const { chromium } = require('playwright');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8000';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

// ---------------------------------------------------------------------------
// 서버 유틸
// ---------------------------------------------------------------------------

function checkServerUp(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      res.resume();
      resolve(res.statusCode < 500);
    }).on('error', () => resolve(false));
  });
}

function startDevServer() {
  const cmd = process.platform === 'win32' ? 'python' : 'python3';
  const server = spawn(cmd, ['-m', 'http.server', '8000'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'ignore',
    detached: false,
  });
  server.on('error', () => {
    // python3 실패 시 python 재시도
    spawn('python', ['-m', 'http.server', '8000'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'ignore',
    });
  });
  return server;
}

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function ensureServer() {
  if (await checkServerUp(BASE_URL)) return { managed: false };
  console.log('  서버 미실행 — 자동 시작 시도 중...');
  const proc = startDevServer();
  await wait(3000);
  if (await checkServerUp(BASE_URL)) return { managed: true, proc };
  proc.kill();
  return { managed: false, failed: true };
}

// ---------------------------------------------------------------------------
// 스크린샷 유틸
// ---------------------------------------------------------------------------

async function saveScreenshot(page, name) {
  if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  const filePath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  return filePath;
}

// ---------------------------------------------------------------------------
// 체크 함수들
// ---------------------------------------------------------------------------

/** 테마 토글: 다크 → 라이트 → 다크 (데스크탑에서는 네비바 버튼 사용) */
async function checkThemeToggle(page) {
  try {
    // 데스크탑(1280px)에서는 네비바 테마 버튼, 모바일에서는 기존 버튼
    let btn = page.locator('.js-theme-toggle-desktop').first();
    const desktopVisible = await btn.isVisible().catch(() => false);
    if (!desktopVisible) {
      btn = page.locator('.js-theme-toggle').first();
    }
    await btn.waitFor({ timeout: 3000 });

    await btn.click();
    await page.waitForFunction(
      () => document.documentElement.classList.contains('light'),
      { timeout: 2000 }
    );
    await saveScreenshot(page, 'theme-light');

    await btn.click();
    await page.waitForFunction(
      () => !document.documentElement.classList.contains('light'),
      { timeout: 2000 }
    );
    await saveScreenshot(page, 'theme-dark');

    return { name: '테마 토글', passed: true, detail: '다크→라이트→다크 전환 정상' };
  } catch (e) {
    return { name: '테마 토글', passed: false, detail: e.message.split('\n')[0] };
  }
}

/** 카테고리 필터: writing / music / social / all */
async function checkCategoryFilter(page) {
  const filters = ['writing', 'music', 'social'];
  const results = [];

  // 데스크탑(900px+)에서는 카테고리 탭이 숨겨지고 모든 섹션이 표시됨
  const catNavVisible = await page.locator('#categoryNav').isVisible().catch(() => false);
  if (!catNavVisible) {
    // 데스크탑 모드: 네비바 링크로 대체. 모든 섹션이 표시되는지 확인
    const allVisible = await page.evaluate(() => {
      const sections = document.querySelectorAll('[data-category]');
      return Array.from(sections).every(s => !s.classList.contains('is-hidden'));
    });
    results.push({
      name: '데스크탑 네비바 — 모든 섹션 표시',
      passed: allVisible,
      detail: allVisible ? '3개 섹션 모두 표시 확인' : '일부 섹션 숨겨짐',
    });

    // 네비바 링크 존재 확인
    const navLinks = await page.locator('.desktop-nav__link').count();
    results.push({
      name: '데스크탑 네비바 — 링크 수',
      passed: navLinks === 3,
      detail: `${navLinks}개 링크 확인`,
    });

    await saveScreenshot(page, 'filter-writing');
    return results;
  }

  try {
    for (const cat of filters) {
      const btn = page.locator(`[data-filter="${cat}"]`).first();
      await btn.waitFor({ timeout: 3000 });
      await btn.click();
      await wait(300);

      // 해당 카테고리 외 섹션에 is-hidden 존재 여부
      const hiddenCount = await page.evaluate((category) => {
        const sections = document.querySelectorAll('[data-category]');
        let count = 0;
        sections.forEach((s) => {
          if (s.dataset.category !== category && s.classList.contains('is-hidden')) count++;
        });
        return count;
      }, cat);

      if (hiddenCount === 0) {
        results.push({ name: `카테고리 필터 (${cat})`, passed: false, detail: `클릭 후 다른 섹션에 is-hidden 없음` });
      } else {
        if (cat === 'writing') await saveScreenshot(page, 'filter-writing');
        results.push({ name: `카테고리 필터 (${cat})`, passed: true, detail: `${hiddenCount}개 섹션 숨김 확인` });
      }
    }

    // all 복귀
    const allBtn = page.locator('[data-filter="all"]').first();
    await allBtn.click();
    await wait(300);
    const stillHidden = await page.evaluate(() => {
      return document.querySelectorAll('[data-category].is-hidden').length;
    });
    results.push({
      name: '카테고리 필터 (all)',
      passed: stillHidden === 0,
      detail: stillHidden === 0 ? '0개 섹션 숨김 확인' : `${stillHidden}개 섹션이 여전히 숨김`,
    });
  } catch (e) {
    results.push({ name: '카테고리 필터', passed: false, detail: e.message.split('\n')[0] });
  }

  return results;
}

/** 프로필 모달 열기/닫기 */
async function checkModal(page) {
  try {
    // 버튼 요소를 우선 시도 (img보다 안정적으로 클릭 가능)
    const openBtn = page.locator('.profile__btn.js-open-profile').first();
    await openBtn.waitFor({ timeout: 3000 });
    await openBtn.scrollIntoViewIfNeeded();
    await openBtn.click();

    await page.waitForSelector('#profileModal.is-open', { timeout: 2000 });
    await saveScreenshot(page, 'modal-open');

    const closeBtn = page.locator('#profileModal .modal-close').first();
    await closeBtn.click();
    await page.waitForFunction(
      () => !document.getElementById('profileModal')?.classList.contains('is-open'),
      { timeout: 2000 }
    );

    return [
      { name: '프로필 모달 열기', passed: true, detail: '#profileModal.is-open 추가 확인' },
      { name: '프로필 모달 닫기', passed: true, detail: 'is-open 클래스 정상 제거' },
    ];
  } catch (e) {
    return [{ name: '프로필 모달', passed: false, detail: e.message.split('\n')[0] }];
  }
}

/** 링크카드 href 유효성 */
async function checkLinkCards(page) {
  try {
    const hrefs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.link-card__header')).map((el) => el.href || el.getAttribute('href') || '');
    });

    const invalid = hrefs.filter((h) => !h || h.startsWith('javascript:') || h === '#' || h === 'about:blank');
    return {
      name: '링크카드 href 유효성',
      passed: invalid.length === 0,
      detail: invalid.length === 0
        ? `${hrefs.length}개 링크 모두 유효`
        : `유효하지 않은 href ${invalid.length}건: ${invalid.join(', ')}`,
    };
  } catch (e) {
    return { name: '링크카드 href 유효성', passed: false, detail: e.message.split('\n')[0] };
  }
}

/** 모바일 520px 뷰포트 */
async function checkMobileViewport(page) {
  try {
    await page.setViewportSize({ width: 520, height: 900 });
    await wait(500);

    const checks = ['.category-nav', '.profile__name', '.link-card'];
    const results = [];
    for (const sel of checks) {
      const el = page.locator(sel).first();
      const visible = await el.isVisible().catch(() => false);
      results.push({ sel, visible });
    }

    await saveScreenshot(page, 'mobile-520');

    // 뷰포트 원복
    await page.setViewportSize({ width: 1280, height: 900 });

    const failed = results.filter((r) => !r.visible);
    return {
      name: '모바일 520px 뷰포트',
      passed: failed.length === 0,
      detail: failed.length === 0
        ? '핵심 요소 3개 모두 visible'
        : `미노출 요소: ${failed.map((r) => r.sel).join(', ')}`,
    };
  } catch (e) {
    return { name: '모바일 520px 뷰포트', passed: false, detail: e.message.split('\n')[0] };
  }
}

// ---------------------------------------------------------------------------
// 메인
// ---------------------------------------------------------------------------

async function run() {
  // 서버 확인
  const serverState = await ensureServer();
  if (serverState.failed) {
    console.log('SERVER_UNAVAILABLE');
    console.log(`서버를 시작할 수 없습니다. 먼저 'python -m http.server 8000'을 실행하세요.`);
    process.exit(1);
  }

  console.log('=== Playwright UI Check ===');
  console.log(`Server: ${BASE_URL} (managed: ${serverState.managed})\n`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // 콘솔 에러 수집
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 10000 });

  // 체크 실행
  const results = [];

  results.push(await checkThemeToggle(page));

  const filterResults = await checkCategoryFilter(page);
  results.push(...filterResults);

  const modalResults = await checkModal(page);
  results.push(...modalResults);

  results.push(await checkLinkCards(page));
  results.push(await checkMobileViewport(page));

  // 콘솔 에러 결과
  results.push({
    name: '콘솔 에러',
    passed: consoleErrors.length === 0,
    detail: consoleErrors.length === 0
      ? '0건'
      : `${consoleErrors.length}건 — ${consoleErrors.slice(0, 3).join(' | ')}`,
  });

  await browser.close();
  if (serverState.managed && serverState.proc) serverState.proc.kill();

  // 결과 출력
  let passed = 0;
  for (const r of results) {
    const tag = r.passed ? '[PASS]' : '[FAIL]';
    console.log(`${tag} ${r.name}: ${r.detail}`);
    if (r.passed) passed++;
  }

  console.log(`\n스크린샷: ${SCREENSHOTS_DIR}`);
  console.log(`결과: ${passed}/${results.length} 통과`);

  process.exit(passed === results.length ? 0 : 1);
}

run().catch((err) => {
  console.error('ui-check 실행 오류:', err.message);
  process.exit(1);
});
