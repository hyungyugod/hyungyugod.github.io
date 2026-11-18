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

/** 테마 토글: 다크 → 라이트 → 다크, theme-color 메타가 사이트 테마를 따라가는지 */
async function checkThemeToggle(page) {
  try {
    const btn = page.locator('.js-theme-toggle').first();
    await btn.waitFor({ timeout: 3000 });
    const themeColor = () => page.evaluate(() => document.querySelector('meta[name="theme-color"]')?.content);

    await btn.click();
    await page.waitForFunction(
      () => document.documentElement.classList.contains('light'),
      { timeout: 2000 }
    );
    const lightColor = await themeColor();
    await saveScreenshot(page, 'theme-light');

    await btn.click();
    await page.waitForFunction(
      () => !document.documentElement.classList.contains('light'),
      { timeout: 2000 }
    );
    const darkColor = await themeColor();
    await saveScreenshot(page, 'theme-dark');

    if (!lightColor || lightColor === darkColor) {
      return { name: '테마 토글', passed: false, detail: `theme-color가 테마를 따라가지 않음 (${lightColor} / ${darkColor})` };
    }
    return { name: '테마 토글', passed: true, detail: `다크→라이트→다크 전환 정상, theme-color ${lightColor} ↔ ${darkColor}` };
  } catch (e) {
    return { name: '테마 토글', passed: false, detail: e.message.split('\n')[0] };
  }
}

/** 카테고리 필터: 탭과 섹션이 1:1인지, 탭마다 해당 섹션만 남는지, all에서 전부 돌아오는지 */
async function checkCategoryFilter(page) {
  const results = [];

  try {
    const { filters, categories } = await page.evaluate(() => ({
      filters: Array.from(document.querySelectorAll('.category-nav__btn'))
        .map((b) => b.dataset.filter)
        .filter((f) => f !== 'all'),
      categories: Array.from(document.querySelectorAll('.category-section')).map((s) => s.dataset.category),
    }));

    // 탭만 있고 섹션이 없는(또는 그 반대) 카테고리는 죽은 탭이 된다
    const matched = filters.join(',') === categories.join(',');
    results.push({
      name: '카테고리 탭 ↔ 섹션',
      passed: matched,
      detail: matched ? `${filters.length}개 카테고리 일치 (${filters.join(', ')})` : `탭 [${filters}] / 섹션 [${categories}]`,
    });

    for (const cat of filters) {
      const btn = page.locator(`[data-filter="${cat}"]`).first();
      await btn.waitFor({ timeout: 3000 });
      await btn.click();
      await wait(300);

      const shown = await page.evaluate(() =>
        Array.from(document.querySelectorAll('.category-section'))
          .filter((s) => !s.classList.contains('is-hidden'))
          .map((s) => s.dataset.category)
      );
      const onlyTarget = shown.length === 1 && shown[0] === cat;
      if (cat === filters[0]) await saveScreenshot(page, `filter-${cat}`);
      results.push({
        name: `카테고리 필터 (${cat})`,
        passed: onlyTarget,
        detail: onlyTarget ? '해당 섹션만 표시' : `표시된 섹션: [${shown}]`,
      });
    }

    // all 복귀
    const allBtn = page.locator('[data-filter="all"]').first();
    await allBtn.click();
    await wait(300);
    const stillHidden = await page.evaluate(() => {
      return document.querySelectorAll('.category-section.is-hidden').length;
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

/** 프로필 모달 열기/닫기 — 닫힌 모달이 포커스·스크린리더에서 빠지는지까지 확인 */
async function checkModal(page) {
  const modalVisibility = () =>
    page.evaluate(() => getComputedStyle(document.getElementById('profileModal')).visibility);

  try {
    const closedBefore = await modalVisibility();

    // 버튼 요소를 우선 시도 (img보다 안정적으로 클릭 가능)
    const openBtn = page.locator('button.js-open-profile').first();
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
    // visibility는 페이드아웃(0.38s) 뒤에 꺼진다
    await page.waitForFunction(
      () => getComputedStyle(document.getElementById('profileModal')).visibility === 'hidden',
      { timeout: 2000 }
    ).catch(() => {});
    const closedAfter = await modalVisibility();
    const hiddenWhenClosed = closedBefore === 'hidden' && closedAfter === 'hidden';

    return [
      { name: '프로필 모달 열기', passed: true, detail: '#profileModal.is-open 추가 확인' },
      { name: '프로필 모달 닫기', passed: true, detail: 'is-open 클래스 정상 제거' },
      {
        name: '닫힌 모달 숨김',
        passed: hiddenWhenClosed,
        detail: hiddenWhenClosed ? 'visibility: hidden — Tab 순서에서 제외' : `visibility 열기 전 ${closedBefore} / 닫은 뒤 ${closedAfter}`,
      },
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
  // Cloudflare Web Analytics 비콘은 등록 도메인(hgfolio.com)에서만 허용되어
  // localhost에서는 항상 CORS/403을 낸다. 사이트 결함이 아니므로 제외한다.
  const isAnalyticsNoise = (msg) =>
    /cloudflareinsights/.test(msg.text()) || /cloudflareinsights/.test(msg.location()?.url || '');
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !isAnalyticsNoise(msg)) consoleErrors.push(msg.text());
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
