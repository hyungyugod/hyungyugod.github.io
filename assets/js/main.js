// -------------------------------------------------------
// 유틸리티 함수
// -------------------------------------------------------

/**
 * XSS 방지를 위한 HTML 이스케이프 함수
 * @param {string} str - 이스케이프할 문자열
 * @returns {string} HTML 특수문자가 이스케이프된 문자열
 */
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * URL 검증 함수 — http/https 스킴만 허용
 * @param {string} url - 검증할 URL
 * @returns {string} 유효하면 원래 URL, 아니면 '#'
 */
function safeUrl(url) {
  try {
    const u = new URL(url);
    return (u.protocol === 'https:' || u.protocol === 'http:') ? url : '#';
  } catch { return '#'; }
}

/**
 * 타임아웃이 적용된 fetch 헬퍼
 * @param {string} url - 요청할 URL
 * @param {number} [ms=5000] - 타임아웃 밀리초
 * @returns {Promise<Response>} fetch 응답
 */
function fetchWithTimeout(url, ms = 5000) {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(tid));
}

/**
 * fetch 실패 시 에러 메시지를 컨테이너에 표시
 * @param {HTMLElement} container - 에러를 표시할 DOM 요소
 * @param {string} msg - 표시할 메시지
 */
function showFetchError(container, msg) {
  container.innerHTML = `<div class="fetch-error"><i class="fa-solid fa-triangle-exclamation"></i> ${msg}</div>`;
}

// -------------------------------------------------------
// Auto-fetch: GitHub repos (latest 3 by push)
// -------------------------------------------------------

/**
 * GitHub API에서 최근 push된 레포 3개를 가져와 카드로 렌더링
 * @returns {Promise<void>}
 */
async function fetchGitHub() {
  const container = document.getElementById('github-items');
  if (!container) return;

  try {
    const res = await fetchWithTimeout('https://api.github.com/users/hyungyugod/repos?sort=pushed&per_page=3');
    if (!res.ok) throw new Error('GitHub ' + res.status);
    const repos = await res.json();
    if (!repos.length) throw new Error('No repos');

    container.innerHTML = repos.map(repo => {
      const lang = esc(repo.language || '');
      const abbr = lang ? lang.substring(0, 2).toUpperCase() : '</>';
      const name = esc(repo.name);
      const stars = esc(repo.stargazers_count);
      const href = safeUrl(repo.html_url);

      return `<a class="featured-item" href="${href}" target="_blank" rel="noopener">
        <svg class="featured-item__thumb" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="#0d1117"/>
          <text x="100" y="90" text-anchor="middle" font-family="Inter,sans-serif" font-size="40" font-weight="800" fill="#30363d">${abbr}</text>
          <text x="100" y="114" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" fill="#58a6ff" opacity="0.7">${lang || 'Code'}</text>
          <text x="100" y="148" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" fill="#8b949e">★ ${stars}</text>
        </svg>
        <div class="featured-item__label">${name}</div>
      </a>`;
    }).join('');
  } catch (e) {
    console.warn('GitHub fetch failed:', e);
    const msg = e.name === 'AbortError' ? '응답 시간 초과' : '불러오기 실패 — 새로고침 해보세요';
    showFetchError(container, msg);
  } finally {
    // 로딩 스켈레톤은 innerHTML 교체로 자동 제거됨
  }
}

// -------------------------------------------------------
// Auto-fetch: Velog posts (latest 3 via RSS)
// Proxy: codetabs.com returns raw XML text
// -------------------------------------------------------

/**
 * Velog RSS에서 최근 포스트 3개를 가져와 카드로 렌더링
 * @returns {Promise<void>}
 */
async function fetchVelog() {
  const container = document.getElementById('velog-items');
  if (!container) return;

  try {
    const rssUrl = 'https://v2.velog.io/rss/@hyungyugod';
    const res = await fetchWithTimeout('https://api.codetabs.com/v1/proxy/?quest=' + encodeURIComponent(rssUrl));
    if (!res.ok) throw new Error('Velog proxy ' + res.status);

    const xml = new DOMParser().parseFromString(await res.text(), 'text/xml');
    const items = Array.from(xml.querySelectorAll('item')).slice(0, 3);
    if (!items.length) throw new Error('No items');

    container.innerHTML = items.map(item => {
      const title = esc(item.querySelector('title')?.textContent?.trim() || 'Untitled');

      // <link> in RSS 2.0 is a text node sibling, not element content
      const linkEl = item.querySelector('link');
      const rawLink = linkEl?.textContent?.trim()
        || linkEl?.nextSibling?.nodeValue?.trim()
        || '';
      const href = safeUrl(rawLink);

      // Image: description HTML → enclosure → media:content
      const descHtml = item.querySelector('description')?.textContent || '';
      const imgMatch = descHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
      const imgUrl = imgMatch?.[1]
        || item.querySelector('enclosure')?.getAttribute('url')
        || item.querySelector('content')?.getAttribute('url')
        || '';

      const thumbHtml = imgUrl
        ? `<img class="featured-item__thumb" src="${esc(imgUrl)}" alt="" loading="lazy">`
        : `<svg class="featured-item__thumb" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="200" fill="#0a1a14"/>
            <text x="100" y="97" text-anchor="middle" font-family="Inter,sans-serif" font-size="52" font-weight="800" fill="#20c997" opacity="0.18">V</text>
            <text x="100" y="118" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" fill="#20c997" opacity="0.3">velog</text>
          </svg>`;

      return `<a class="featured-item" href="${href}" target="_blank" rel="noopener">
        ${thumbHtml}
        <div class="featured-item__label">${title}</div>
      </a>`;
    }).join('');
  } catch (e) {
    console.warn('Velog fetch failed:', e);
    const msg = e.name === 'AbortError' ? '응답 시간 초과' : '불러오기 실패 — 새로고침 해보세요';
    showFetchError(container, msg);
  } finally {
    // 로딩 스켈레톤은 innerHTML 교체로 자동 제거됨
  }
}

// -------------------------------------------------------
// 초기화
// -------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  fetchGitHub();
  fetchVelog();
  initModal();
  initCategoryFilter();
});

// -------------------------------------------------------
// 카테고리 필터
// -------------------------------------------------------

/**
 * 카테고리 탭 클릭 시 섹션 표시/숨김 필터 초기화
 */
function initCategoryFilter() {
  const nav = document.getElementById('categoryNav');
  if (!nav) return;

  const btns = nav.querySelectorAll('.category-nav__btn');
  const sections = document.querySelectorAll('.category-section');

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      btns.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      sections.forEach(sec => {
        if (filter === 'all' || sec.dataset.category === filter) {
          sec.classList.remove('is-hidden');
        } else {
          sec.classList.add('is-hidden');
        }
      });
    });
  });
}

// -------------------------------------------------------
// 프로필 모달
// -------------------------------------------------------

/**
 * 프로필 모달의 열기/닫기, 포커스 트랩, 키보드 접근성 초기화
 */
function initModal() {
  const backdrop = document.getElementById('profileModal');
  if (!backdrop) return;
  const avatar = document.getElementById('profileAvatar');

  const FOCUSABLE = 'a[href],button:not([disabled]),input,textarea,select,[tabindex]:not([tabindex="-1"])';

  /**
   * 모달 내부의 포커스 가능한 요소 목록 반환
   * @returns {HTMLElement[]} 포커스 가능한 요소 배열
   */
  function getFocusable() {
    return Array.from(backdrop.querySelectorAll(FOCUSABLE));
  }

  /**
   * 모달 열기 — is-open 클래스 추가 및 포커스 이동
   */
  const open = () => {
    backdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    getFocusable()[0]?.focus();
  };

  /**
   * 모달 닫기 — is-open 클래스 제거 및 아바타로 포커스 복귀
   */
  const close = () => {
    backdrop.classList.remove('is-open');
    document.body.style.overflow = '';
    avatar?.focus();
  };

  document.querySelectorAll('.js-open-profile').forEach(el => el.addEventListener('click', open));
  backdrop.querySelector('.modal-overlay').addEventListener('click', close);
  backdrop.querySelector('.modal-close').addEventListener('click', close);

  document.addEventListener('keydown', (e) => {
    if (!backdrop.classList.contains('is-open')) return;

    if (e.key === 'Escape') { close(); return; }

    // 포커스 트랩: Tab/Shift+Tab으로 모달 내부에서만 순환
    if (e.key === 'Tab') {
      const els = getFocusable();
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    }
  });
}
