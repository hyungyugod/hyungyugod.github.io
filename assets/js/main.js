// -------------------------------------------------------
// 유틸리티 함수
// -------------------------------------------------------

/** 스크롤 등장 애니메이션 대상 셀렉터 — initScrollReveal / applyFilter 공용 */
const REVEAL_SELECTOR = '.link-card, .section-label, .category-title';

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
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * URL 검증 함수 — http/https 스킴만 허용
 * 원본 문자열이 아닌 정규화된 u.href를 반환한다. 원본을 그대로 돌려주면
 * 따옴표 등이 살아남아 속성 밖으로 탈출할 수 있다.
 * @param {string} url - 검증할 URL
 * @returns {string} 유효하면 정규화된 URL, 아니면 '#'
 */
function safeUrl(url) {
  try {
    const u = new URL(url);
    return (u.protocol === 'https:' || u.protocol === 'http:') ? u.href : '#';
  } catch { return '#'; }
}

/**
 * 타임아웃이 적용된 fetch 헬퍼
 * @param {string} url - 요청할 URL
 * @param {number} [ms=5000] - 타임아웃 밀리초
 * @param {RequestInit} [opts={}] - fetch에 그대로 넘길 옵션
 * @returns {Promise<Response>} fetch 응답
 */
function fetchWithTimeout(url, ms = 5000, opts = {}) {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(tid));
}

/**
 * fetch 실패 시 에러 메시지를 컨테이너에 표시
 * @param {HTMLElement} container - 에러를 표시할 DOM 요소
 * @param {string} msg - 표시할 메시지
 */
function showFetchError(container, msg) {
  container.innerHTML = `<div class="fetch-error" role="status"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> ${esc(msg)}</div>`;
}

/**
 * 각 init 함수를 독립 try-catch로 감싸 하나의 실패가 전체를 중단시키지 않게 함
 * @param {Function} fn - 실행할 초기화 함수
 * @param {string} name - 디버그용 함수 이름
 */
function safeInit(fn, name) {
  try { fn(); } catch (e) { console.warn(`[${name}] init failed:`, e); }
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
    if (!Array.isArray(repos) || !repos.length) throw new Error('No repos');

    container.innerHTML = repos.map(repo => {
      const langRaw = typeof repo.language === 'string' && repo.language ? repo.language : 'Code';
      const lang = esc(langRaw);
      const abbr = esc(langRaw.substring(0, 2).toUpperCase() || 'GH');
      const name = esc(repo.name);
      const stars = esc(repo.stargazers_count ?? 0);
      const href = safeUrl(repo.html_url);
      const ariaLabel = esc(`${repo.name || 'Repository'} GitHub 저장소 열기`);

      return `<a class="featured-item" href="${esc(href)}" target="_blank" rel="noopener" aria-label="${ariaLabel}">
        <svg class="featured-item__thumb" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <rect class="featured-item__fallback-bg" width="200" height="200"/>
          <text class="featured-item__fallback-mark" x="100" y="94" text-anchor="middle" font-family="Inter,sans-serif" font-size="40" font-weight="800">${abbr}</text>
          <text class="featured-item__fallback-accent--github" x="100" y="122" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" opacity="0.82">${lang}</text>
        </svg>
        <div class="featured-item__label">${name}</div>
        <div class="featured-item__meta">
          <span class="featured-item__source featured-item__source--github">GitHub</span>
          <span class="featured-item__detail">${lang} · ${stars} stars</span>
        </div>
      </a>`;
    }).join('');
  } catch (e) {
    console.warn('GitHub fetch failed:', e);
    const msg = e.name === 'AbortError' ? '응답 시간 초과' : '불러오기 실패 — 새로고침 해보세요';
    showFetchError(container, msg);
  }
}

// -------------------------------------------------------
// Auto-fetch: Velog posts (latest 3 via RSS)
// Velog RSS는 CORS 헤더를 주지 않아 브라우저에서 직접 읽을 수 없다.
// 공개 중계 서비스를 순서대로 시도하고, 앞의 것이 실패하면 다음으로 넘어간다.
// -------------------------------------------------------

const VELOG_RSS = 'https://v2.velog.io/rss/@hyungyugod';

/**
 * 글 본문 HTML에서 첫 번째 이미지 주소를 꺼낸다 (썸네일 대체용)
 * @param {string} html - RSS description HTML
 * @returns {string} 이미지 URL, 없으면 빈 문자열
 */
function firstImageSrc(html) {
  // DOMParser가 만든 문서는 비활성이다 — 스크립트가 실행되지 않고 이미지도 로드되지 않는다.
  // 정규식과 달리 src 안의 &amp; 같은 엔티티가 풀린 값을 얻는다
  const doc = new DOMParser().parseFromString(String(html ?? ''), 'text/html');
  return doc.querySelector('img')?.getAttribute('src') || '';
}

/**
 * 날짜 문자열을 YYYY-MM-DD로 줄인다
 * @param {string} raw - RSS pubDate(RFC 822) 또는 'YYYY-MM-DD HH:mm:ss'
 * @returns {string} 표시용 날짜, 해석할 수 없으면 'Recent post'
 */
function toDateLabel(raw) {
  const text = String(raw ?? '').trim();
  // 'YYYY-MM-DD HH:mm:ss'는 Date 파싱 결과가 브라우저마다 달라 앞 10자리를 그대로 쓴다
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const date = new Date(text);
  return text && !Number.isNaN(date.valueOf()) ? date.toISOString().slice(0, 10) : 'Recent post';
}

/**
 * rss2json — RSS를 JSON으로 바꿔 주는 중계 서비스
 * @returns {Promise<Array<{title: string, link: string, image: string, date: string}>>} 최신순 포스트
 */
async function loadVelogViaRss2Json() {
  const res = await fetchWithTimeout('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(VELOG_RSS), 6000);
  if (!res.ok) throw new Error('rss2json ' + res.status);
  const data = await res.json();
  if (data.status !== 'ok' || !Array.isArray(data.items)) throw new Error('rss2json payload');

  return data.items.map(item => ({
    title: item.title,
    link: item.link,
    image: item.thumbnail || firstImageSrc(item.description),
    date: item.pubDate,
  }));
}

/**
 * codetabs — 원본 RSS XML을 그대로 중계하는 프록시
 * @returns {Promise<Array<{title: string, link: string, image: string, date: string}>>} 최신순 포스트
 */
async function loadVelogViaCodetabs() {
  const res = await fetchWithTimeout('https://api.codetabs.com/v1/proxy/?quest=' + encodeURIComponent(VELOG_RSS));
  if (!res.ok) throw new Error('codetabs ' + res.status);
  const xml = new DOMParser().parseFromString(await res.text(), 'text/xml');

  return Array.from(xml.querySelectorAll('item')).map(item => {
    // <link>의 내용이 요소 안이 아니라 형제 텍스트 노드로 들어오는 경우가 있다
    const linkEl = item.querySelector('link');
    return {
      title: item.querySelector('title')?.textContent,
      link: linkEl?.textContent?.trim() || linkEl?.nextSibling?.nodeValue?.trim(),
      // 이미지: 본문 HTML → enclosure → media:content 순
      image: firstImageSrc(item.querySelector('description')?.textContent)
        || item.querySelector('enclosure')?.getAttribute('url')
        || item.querySelector('content')?.getAttribute('url'),
      date: item.querySelector('pubDate')?.textContent,
    };
  });
}

/**
 * Velog RSS에서 최근 포스트 3개를 가져와 카드로 렌더링
 * @returns {Promise<void>}
 */
async function fetchVelog() {
  const container = document.getElementById('velog-items');
  if (!container) return;

  try {
    // 무료 중계 서비스는 하나씩 멈추는 일이 잦다. 순서대로 시도해 처음 성공한 결과를 쓴다
    let posts = [];
    let lastError = new Error('No items');
    for (const load of [loadVelogViaRss2Json, loadVelogViaCodetabs]) {
      try {
        posts = (await load()).slice(0, 3);
        if (posts.length) break;
        lastError = new Error('No items');
      } catch (e) {
        lastError = e;
      }
    }
    if (!posts.length) throw lastError;

    container.innerHTML = posts.map(post => {
      const titleRaw = String(post.title ?? '').trim();
      const title = esc(titleRaw || 'Untitled');
      const href = safeUrl(post.link);
      const imgUrl = safeUrl(post.image);
      const ariaLabel = esc(`${titleRaw || 'Velog post'} Velog 포스트 열기`);

      // CSP의 img-src가 https만 허용한다. http 썸네일은 깨진 이미지 대신 대체 썸네일로 보낸다
      const thumbHtml = imgUrl.startsWith('https://')
        ? `<img class="featured-item__thumb" src="${esc(imgUrl)}" alt="" loading="lazy">`
        : `<svg class="featured-item__thumb" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <rect class="featured-item__fallback-bg" width="200" height="200"/>
            <text class="featured-item__fallback-accent--velog" x="100" y="100" text-anchor="middle" font-family="Inter,sans-serif" font-size="52" font-weight="800" opacity="0.32">V</text>
            <text class="featured-item__fallback-accent--velog" x="100" y="122" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" opacity="0.55">velog</text>
          </svg>`;

      return `<a class="featured-item" href="${esc(href)}" target="_blank" rel="noopener" aria-label="${ariaLabel}">
        ${thumbHtml}
        <div class="featured-item__label">${title}</div>
        <div class="featured-item__meta">
          <span class="featured-item__source featured-item__source--velog">Velog</span>
          <span class="featured-item__detail">${esc(toDateLabel(post.date))}</span>
        </div>
      </a>`;
    }).join('');
  } catch (e) {
    console.warn('Velog fetch failed:', e);
    const msg = e.name === 'AbortError' ? '응답 시간 초과' : '불러오기 실패 — 새로고침 해보세요';
    showFetchError(container, msg);
  }
}

// -------------------------------------------------------
// 초기화
// -------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  safeInit(fetchGitHub, 'fetchGitHub');
  safeInit(fetchVelog, 'fetchVelog');
  safeInit(initModal, 'initModal');
  safeInit(initCategoryFilter, 'initCategoryFilter');
  safeInit(initThemeToggle, 'initThemeToggle');
  safeInit(initScrollReveal, 'initScrollReveal');
  safeInit(initScrollProgress, 'initScrollProgress');
  safeInit(initNameShine, 'initNameShine');
  safeInit(initCardSpotlight, 'initCardSpotlight');
});

// -------------------------------------------------------
// 스크롤 페이드인 (Intersection Observer)
// -------------------------------------------------------

function initScrollReveal() {
  const targets = document.querySelectorAll(REVEAL_SELECTOR);

  // prefers-reduced-motion 시 즉시 표시
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    targets.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  targets.forEach(el => observer.observe(el));
}

// -------------------------------------------------------
// 카테고리 필터
// -------------------------------------------------------

/**
 * 섹션 필터링 헬퍼 — 카테고리에 따라 섹션을 표시/숨김
 * @param {NodeList} sections - 카테고리 섹션 목록
 * @param {string} filter - 적용할 필터 값 ('all' 또는 카테고리명)
 */
function applyFilter(sections, filter) {
  sections.forEach(sec => {
    if (filter === 'all' || sec.dataset.category === filter) {
      sec.classList.remove('is-hidden');
      sec.querySelectorAll(REVEAL_SELECTOR).forEach(el => el.classList.add('is-visible'));
    } else {
      sec.classList.add('is-hidden');
    }
  });
}

/**
 * 페이드 전환 + 섹션 필터 초기화
 */
function initCategoryFilter() {
  const nav = document.getElementById('categoryNav');
  if (!nav) return;

  const btns = nav.querySelectorAll('.category-nav__btn');
  const sections = document.querySelectorAll('.category-section');
  const indicator = nav.querySelector('.category-nav__indicator');

  // 활성 버튼 위치에 인디케이터 정렬
  function updateIndicator() {
    if (!indicator) return;
    const active = nav.querySelector('.category-nav__btn.is-active');
    if (!active) return;
    indicator.style.width = active.offsetWidth + 'px';
    indicator.style.height = active.offsetHeight + 'px';
    indicator.style.transform = 'translate(' + active.offsetLeft + 'px, ' + active.offsetTop + 'px)';
    nav.classList.add('is-ready');
  }

  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 전환 중 재클릭 시 이전 타이머가 새 전환의 인라인 스타일을 지워버리는 것을 막는 토큰
  let transitionToken = 0;

  /**
   * 카테고리 선택 — 라디오 상태 · roving tabindex · 인디케이터 · 섹션 필터를 갱신
   * @param {HTMLElement} btn - 선택할 버튼
   */
  function select(btn) {
    btns.forEach(b => {
      const on = b === btn;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-checked', String(on));
      // roving tabindex: 선택된 항목만 Tab 순서에 남긴다 (라디오그룹 규약)
      b.tabIndex = on ? 0 : -1;
    });

    updateIndicator();
    btn.scrollIntoView({
      behavior: reduceMotion() ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'center'
    });

    const filter = btn.dataset.filter;
    const visible = Array.from(sections).filter(s => !s.classList.contains('is-hidden'));

    if (!visible.length || reduceMotion()) {
      applyFilter(sections, filter);
      return;
    }

    const token = ++transitionToken;
    visible.forEach(sec => {
      sec.style.opacity = '0';
      sec.style.transform = 'translateY(-10px)';
      sec.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
    });

    setTimeout(() => {
      if (token !== transitionToken) return;  // 더 최근 전환이 시작됨
      visible.forEach(sec => {
        sec.style.opacity = '';
        sec.style.transform = '';
        sec.style.transition = '';
      });
      applyFilter(sections, filter);
    }, 200);
  }

  btns.forEach(btn => {
    btn.addEventListener('click', () => select(btn));
  });

  // 방향키 / Home / End 로 이동 — 라디오그룹은 이동과 동시에 선택된다
  nav.addEventListener('keydown', (e) => {
    const list = Array.from(btns);
    const current = list.indexOf(document.activeElement);
    if (current === -1) return;

    let next;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown': next = (current + 1) % list.length; break;
      case 'ArrowLeft':
      case 'ArrowUp':   next = (current - 1 + list.length) % list.length; break;
      case 'Home':      next = 0; break;
      case 'End':       next = list.length - 1; break;
      default: return;
    }

    e.preventDefault();
    list[next].focus();
    select(list[next]);
  });

  // 초기 인디케이터 정렬 (레이아웃 안정 후 이중 호출)
  requestAnimationFrame(updateIndicator);
  window.addEventListener('load', updateIndicator);

  // resize는 연속 발화하므로 프레임 단위로 합친다
  let resizeFrame = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(updateIndicator);
  });
}

// -------------------------------------------------------
// 테마 토글 (다크/라이트)
// -------------------------------------------------------

/**
 * 다크/라이트 테마 전환 토글 초기화
 * localStorage에 사용자 선택을 저장한다. 복원은 FOUC를 막기 위해 index.html <head>의 인라인 스크립트가 맡는다
 */
function initThemeToggle() {
  const btn = document.querySelector('.js-theme-toggle');
  if (!btn) return;

  const root = document.documentElement;
  const STORAGE_KEY = 'theme';

  // 브라우저 UI 색(theme-color)은 OS 설정이 아니라 사이트 테마를 따라가야 한다.
  // 색을 여기 다시 적지 않고 현재 테마의 --bg를 읽어 쓴다
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const syncThemeColor = () => {
    const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
    if (bg) themeColor?.setAttribute('content', bg);
  };
  syncThemeColor();

  btn.addEventListener('click', () => {
    const isLight = root.classList.toggle('light');
    syncThemeColor();
    // 사파리 개인정보 보호 모드 등에서 setItem이 던진다. 전환 자체는 막지 않는다
    try {
      localStorage.setItem(STORAGE_KEY, isLight ? 'light' : 'dark');
    } catch (e) { /* 저장 불가 — 이번 세션에만 적용 */ }
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

  // 닫힐 때 포커스를 돌려줄 요소 — 모달을 연 트리거 (아바타 또는 Profile 버튼)
  let opener = avatar;

  /**
   * 모달 열기 — is-open 클래스 추가 및 포커스 이동
   * @param {Event} e - 트리거에서 발생한 click/keydown 이벤트
   */
  const open = (e) => {
    opener = e?.currentTarget ?? avatar;
    backdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    getFocusable()[0]?.focus();
  };

  /**
   * 모달 닫기 — is-closing 애니메이션 후 is-open 클래스 제거 및 트리거로 포커스 복귀
   */
  const close = () => {
    if (!backdrop.classList.contains('is-open')) return;
    backdrop.classList.add('is-closing');
    document.body.style.overflow = '';

    const onEnd = () => {
      backdrop.classList.remove('is-open', 'is-closing');
      opener?.focus();
    };

    const box = backdrop.querySelector('.modal-box');
    if (box) {
      const handler = () => {
        box.removeEventListener('transitionend', handler);
        onEnd();
      };
      box.addEventListener('transitionend', handler);
    }

    // 500ms fallback timeout
    setTimeout(() => {
      if (backdrop.classList.contains('is-closing')) {
        onEnd();
      }
    }, 500);
  };

  document.querySelectorAll('.js-open-profile').forEach(el => {
    el.addEventListener('click', open);

    // <img> 등 네이티브 버튼이 아닌 트리거는 Enter/Space를 직접 처리해야 한다
    if (el.tagName !== 'BUTTON') {
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(e); }
      });
    }
  });
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

// -------------------------------------------------------
// 스크롤 진행 바
// -------------------------------------------------------

/**
 * 페이지 스크롤 진행률에 따라 상단 프로그레스 바를 업데이트
 */
function initScrollProgress() {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    bar.style.display = 'none';
    return;
  }

  window.addEventListener('scroll', () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${total > 0 ? document.documentElement.scrollTop / total : 0})`;
  }, { passive: true });
}

// -------------------------------------------------------
// HG 타이틀 마우스 반응 광택
// -------------------------------------------------------

/**
 * 히어로 영역 마우스 움직임에 따라 HG 타이틀에 광택 효과 적용
 */
function initNameShine() {
  const hero = document.getElementById('hero');
  if (!hero) return;
  const name = hero.querySelector('.profile__name');
  if (!name) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(hover: none)').matches) return;

  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    // 0~200% 범위로 매핑 (shine 레이어만 이동)
    const pos = Math.round(x * 200);
    name.style.backgroundPosition = pos + '% 0, 0 0';
  }, { passive: true });

  hero.addEventListener('mouseleave', () => {
    name.style.backgroundPosition = '100% 0, 0 0';
  });
}

// -------------------------------------------------------
// 링크 카드 포인터 스포트라이트
// -------------------------------------------------------

/**
 * 카드 위 포인터 좌표를 --spot-x / --spot-y로 넘겨 플랫폼 색 스포트라이트가 따라오게 함
 * 이벤트는 .page-wrapper 한 곳에 위임하고, 좌표 기록은 프레임당 한 번으로 제한한다
 */
function initCardSpotlight() {
  const root = document.querySelector('.page-wrapper');
  if (!root) return;
  if (window.matchMedia('(hover: none)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let frame = 0;
  let last = null;
  // pointermove는 연속 발화하므로 프레임 단위로 합친다
  root.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    last = e;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const card = last.target.closest('.link-card');
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--spot-x', `${last.clientX - rect.left}px`);
      card.style.setProperty('--spot-y', `${last.clientY - rect.top}px`);
    });
  }, { passive: true });
}

