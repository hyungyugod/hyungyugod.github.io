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
  container.innerHTML = `<div class="fetch-error"><i class="fa-solid fa-triangle-exclamation"></i> ${esc(msg)}</div>`;
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
        ? `<img class="featured-item__thumb" src="${esc(safeUrl(imgUrl))}" alt="" loading="lazy">`
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
// Auto-fetch: 루틴 연속일수 streak 위젯
// Source: /data/streaks.json — 수동으로 days/updatedAt 수정 후 push
// -------------------------------------------------------

/**
 * /data/streaks.json을 읽어 3개 streak 카드를 렌더링
 * @returns {Promise<void>}
 */
async function fetchStreaks() {
  const grid = document.getElementById('streaksGrid');
  if (!grid) return;
  const updatedEl = document.getElementById('streaksUpdated');

  const TONE_WHITELIST = ['diary', 'workout', 'threec'];
  const ICON_RE = /^fa-[a-z0-9-]+$/;
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

  try {
    const res = await fetchWithTimeout('/data/streaks.json', 5000, { cache: 'no-cache' });
    if (!res.ok) throw new Error('Streaks ' + res.status);
    const data = await res.json();
    const items = Array.isArray(data?.streaks) ? data.streaks : [];
    if (!items.length) throw new Error('No streaks');

    grid.innerHTML = items.map(s => {
      const tone = TONE_WHITELIST.includes(s?.tone) ? s.tone : '';
      const toneClass = tone ? `streak-card--${tone}` : '';

      const label = esc(s?.label ?? '');
      const days = Math.max(0, Number(s?.days) || 0);

      const iconRaw = typeof s?.icon === 'string' ? s.icon : '';
      const iconClass = ICON_RE.test(iconRaw) ? iconRaw : 'fa-check';

      // startDate 검증: 화이트리스트 통과 시에만 캡슐 렌더
      const startRaw = typeof s?.startDate === 'string' ? s.startDate : '';
      const startDate = DATE_RE.test(startRaw) ? startRaw : '';

      // 단위 표기: workout만 누적 일수("일"), 그 외는 "일 연속"
      const unit = tone === 'workout' ? '일' : '일 연속';

      const ariaLabel = esc(startDate
        ? `${s?.label ?? ''} ${days}일, ${startDate}부터`
        : `${s?.label ?? ''} ${days}일`);

      const history = Array.isArray(s?.history)
        ? s.history.map(n => Math.max(0, Number(n) || 0)).slice(0, 6)
        : [];
      const historyMonths = Array.isArray(s?.historyMonths)
        ? s.historyMonths.slice(0, 6)
        : [];
      const chartMax = history.length ? Math.max(...history, 1) : 1;
      const barsHtml = history.map((v, i) => {
        const pct = Math.max(4, Math.round((v / chartMax) * 100));
        const m = esc(String(historyMonths[i] ?? (i + 1)));
        return `<div class="streak-chart__bar">
          <span class="streak-chart__bar-value">${esc(v)}</span>
          <div class="streak-chart__bar-fill" style="height:${pct}%"></div>
          <span class="streak-chart__bar-month">${m}</span>
        </div>`;
      }).join('');
      const hasHistory = history.length > 0;

      return `<div class="streak-card ${toneClass} streak-card--flippable" aria-label="${ariaLabel}" role="button" tabindex="0" aria-expanded="false">
        <button class="streak-card__flip-btn" type="button" aria-label="${label} 그래프 보기" tabindex="-1">
          <i class="fa-solid fa-chart-column" aria-hidden="true"></i>
        </button>
        <div class="streak-card__flipper">
          <div class="streak-card__face streak-card__face--front">
            <div class="streak-card__top">
              <span class="streak-card__icon"><i class="fa-solid ${esc(iconClass)}"></i></span>
              <span class="streak-card__label">${label}</span>
            </div>
            <div class="streak-card__value">
              <span class="streak-card__days">${days}</span>
              <span class="streak-card__unit">${unit}</span>
            </div>
            ${startDate
              ? `<span class="streak-card__since">
                   <i class="fa-regular fa-calendar streak-card__since-icon" aria-hidden="true"></i>
                   Since ${esc(startDate)}
                 </span>`
              : ''}
          </div>
          <div class="streak-card__face streak-card__face--back" aria-hidden="true">
            ${hasHistory
              ? `<div class="streak-chart">
                   <div class="streak-chart__header">
                     <span class="streak-chart__title">${label}</span>
                     <span class="streak-chart__sub">최근 6개월</span>
                   </div>
                   <div class="streak-chart__bars">${barsHtml}</div>
                 </div>`
              : `<div class="streak-chart streak-chart--empty">데이터 준비 중</div>`}
          </div>
        </div>
      </div>`;
    }).join('');

    bindStreakFlip(grid);

    // updatedAt 표시 (헤더 + 안내문 날짜 태그)
    const u = typeof data?.updatedAt === 'string' && DATE_RE.test(data.updatedAt)
      ? data.updatedAt : '';
    if (updatedEl) {
      updatedEl.textContent = u ? `업데이트 ${u}` : '';
    }
    const noticeDateEl = document.getElementById('streaksNoticeDate');
    if (noticeDateEl) {
      noticeDateEl.textContent = '';
      if (u) {
        const tag = document.createElement('span');
        tag.className = 'streaks__notice-tag';
        tag.textContent = u;
        noticeDateEl.appendChild(tag);
        noticeDateEl.appendChild(document.createTextNode('까지의 데이터입니다.'));
      }
    }
  } catch (e) {
    console.warn('Streaks fetch failed:', e);
    const msg = e.name === 'AbortError' ? '응답 시간 초과' : '루틴 데이터를 불러오지 못했어요';
    showFetchError(grid, msg);
    if (updatedEl) updatedEl.textContent = '';
  }
}

/**
 * streak 카드 클릭/키보드 입력 시 앞뒤 플립 토글
 * @param {HTMLElement} grid
 */
function bindStreakFlip(grid) {
  const cards = grid.querySelectorAll('.streak-card--flippable');
  cards.forEach(card => {
    const front = card.querySelector('.streak-card__face--front');
    const back  = card.querySelector('.streak-card__face--back');
    if (!front || !back) return;

    const toggle = () => {
      const isFlipped = card.classList.toggle('is-flipped');
      card.setAttribute('aria-expanded', String(isFlipped));
      front.setAttribute('aria-hidden', String(isFlipped));
      back.setAttribute('aria-hidden', String(!isFlipped));
    };

    card.addEventListener('click', toggle);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
  });
}

// -------------------------------------------------------
// 초기화
// -------------------------------------------------------

/**
 * 각 init 함수를 독립 try-catch로 감싸 하나의 실패가 전체를 중단시키지 않게 함
 * @param {Function} fn - 실행할 초기화 함수
 * @param {string} name - 디버그용 함수 이름
 */
const safeInit = (fn, name) => {
  try { fn(); } catch (e) { console.warn(`[${name}] init failed:`, e); }
};

document.addEventListener('DOMContentLoaded', () => {
  safeInit(fetchGitHub, 'fetchGitHub');
  safeInit(fetchVelog, 'fetchVelog');
  safeInit(fetchStreaks, 'fetchStreaks');
  safeInit(initModal, 'initModal');
  safeInit(initCategoryFilter, 'initCategoryFilter');
  safeInit(initThemeToggle, 'initThemeToggle');
  safeInit(initTyping, 'initTyping');
  safeInit(initScrollReveal, 'initScrollReveal');
  safeInit(initScrollProgress, 'initScrollProgress');
  safeInit(initMouseParallax, 'initMouseParallax');
  safeInit(initHeroParallax, 'initHeroParallax');
  safeInit(initNameShine, 'initNameShine');
  safeInit(initMottoReveal, 'initMottoReveal');
  safeInit(initMusicShowcase, 'initMusicShowcase');
});

// -------------------------------------------------------
// 타이핑 인트로 애니메이션
// -------------------------------------------------------

function initTyping() {
  const el = document.getElementById('typingText');
  if (!el) return;

  // prefers-reduced-motion 시 정적 표시
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = 'Developer';
    return;
  }

  const words = ['Developer', 'Music Producer', 'Writer', 'Thinker'];
  let wordIdx = 0;
  let charIdx = 0;
  let deleting = false;

  function tick() {
    const word = words[wordIdx];

    if (!deleting) {
      charIdx++;
      el.textContent = word.substring(0, charIdx);

      if (charIdx === word.length) {
        deleting = true;
        setTimeout(tick, 1500);
        return;
      }
      setTimeout(tick, 80);
    } else {
      charIdx--;
      el.textContent = word.substring(0, charIdx);

      if (charIdx === 0) {
        deleting = false;
        wordIdx = (wordIdx + 1) % words.length;
        setTimeout(tick, 400);
        return;
      }
      setTimeout(tick, 50);
    }
  }

  setTimeout(tick, 600);
}

// -------------------------------------------------------
// 스크롤 페이드인 (Intersection Observer)
// -------------------------------------------------------

function initScrollReveal() {
  const targets = document.querySelectorAll('.link-card, .social-card, .section-label, .platform-showcase');

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
      sec.querySelectorAll('.link-card, .social-card, .section-label, .platform-showcase')
         .forEach(el => el.classList.add('is-visible'));
    } else {
      sec.classList.add('is-hidden');
    }
  });
}

/**
 * 카테고리 탭 클릭 시 리플 이펙트 + 페이드 전환 + 섹션 필터 초기화
 */
function initCategoryFilter() {
  const nav = document.getElementById('categoryNav');
  if (!nav) return;

  const btns = nav.querySelectorAll('.category-nav__btn');
  const sections = document.querySelectorAll('.category-section');

  btns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const filter = btn.dataset.filter;

      // 리플 이펙트
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`;
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());

      // 활성 탭 업데이트
      btns.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      // 페이드 전환
      const visible = Array.from(sections).filter(s => !s.classList.contains('is-hidden'));

      if (!visible.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        applyFilter(sections, filter);
        return;
      }

      visible.forEach(sec => {
        sec.style.opacity = '0';
        sec.style.transform = 'translateY(-10px)';
        sec.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
      });

      setTimeout(() => {
        visible.forEach(sec => {
          sec.style.opacity = '';
          sec.style.transform = '';
          sec.style.transition = '';
        });
        applyFilter(sections, filter);
      }, 200);
    });
  });
}

// -------------------------------------------------------
// 테마 토글 (다크/라이트)
// -------------------------------------------------------

/**
 * 다크/라이트 테마 전환 토글 초기화
 * localStorage에 사용자 선택을 저장하여 재방문 시 복원
 */
function initThemeToggle() {
  const btn = document.querySelector('.js-theme-toggle');
  if (!btn) return;

  const root = document.documentElement;
  const STORAGE_KEY = 'theme';

  btn.addEventListener('click', () => {
    const isLight = root.classList.toggle('light');
    localStorage.setItem(STORAGE_KEY, isLight ? 'light' : 'dark');
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
   * 모달 닫기 — is-closing 애니메이션 후 is-open 클래스 제거 및 아바타로 포커스 복귀
   */
  const close = () => {
    if (!backdrop.classList.contains('is-open')) return;
    backdrop.classList.add('is-closing');
    document.body.style.overflow = '';

    const onEnd = () => {
      backdrop.classList.remove('is-open', 'is-closing');
      avatar?.focus();
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
// 히어로 마우스 패럴랙스
// -------------------------------------------------------

/**
 * 마우스 움직임에 따라 히어로 배경을 미세하게 이동시키는 패럴랙스 효과
 */
function initMouseParallax() {
  const heroBg = document.querySelector('.hero-bg');
  if (!heroBg) return;
  if (window.matchMedia('(hover: none)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  heroBg.style.transform = 'scale(1.08)';
  let targetX = 0, targetY = 0, currentX = 0, currentY = 0;

  document.addEventListener('mousemove', (e) => {
    targetX = (e.clientX / window.innerWidth - 0.5) * 18;
    targetY = (e.clientY / window.innerHeight - 0.5) * 18;
  }, { passive: true });

  (function tick() {
    currentX += (targetX - currentX) * 0.07;
    currentY += (targetY - currentY) * 0.07;
    heroBg.style.transform = `scale(1.08) translate(${currentX}px, ${currentY}px)`;
    requestAnimationFrame(tick);
  })();
}

// -------------------------------------------------------
// 히어로 스크롤 패럴랙스 페이드아웃
// -------------------------------------------------------

/**
 * 스크롤 시 히어로 프로필을 페이드아웃하며 위로 밀어내는 패럴랙스 효과
 */
function initHeroParallax() {
  const hero = document.getElementById('hero');
  if (!hero) return;
  const profile = hero.querySelector('.profile');
  if (!profile) return;
  const scrollHint = hero.querySelector('.scroll-hint');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const heroH = hero.getBoundingClientRect().height || window.innerHeight;
    const ratio = Math.min(scrollY / heroH, 1);

    profile.style.opacity = 1 - ratio * 1.5;
    profile.style.transform = `translateY(${-scrollY * 0.3}px)`;

    // 스크롤 힌트: 100px 이상 스크롤 시 페이드아웃
    if (scrollHint) {
      scrollHint.style.opacity = scrollY > 100 ? '0' : '0.5';
    }

    hero.style.pointerEvents = ratio >= 1 ? 'none' : '';
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
// 3C 모토 카드 순차 등장
// -------------------------------------------------------

/**
 * 모토 카드를 시차를 두고 순차적으로 등장시킴
 */
// -------------------------------------------------------
// 뮤직 쇼케이스 (데스크탑): 트랙 호버 시 커버 전환
// -------------------------------------------------------

function initMusicShowcase() {
  const cover = document.getElementById('musicCover');
  if (!cover) return;

  const tracks = document.querySelectorAll('.music-showcase__track');
  if (!tracks.length) return;

  tracks.forEach(track => {
    track.addEventListener('mouseenter', () => {
      const src = track.dataset.cover;
      if (src && cover.src !== src) {
        cover.style.opacity = '0.6';
        cover.style.transform = 'scale(1.05)';
        setTimeout(() => {
          cover.src = src;
          cover.style.opacity = '1';
          cover.style.transform = 'scale(1)';
        }, 200);
      }

      tracks.forEach(t => t.classList.remove('is-active'));
      track.classList.add('is-active');
    });
  });
}

// -------------------------------------------------------
// 3C 모토 카드 순차 등장
// -------------------------------------------------------

function initMottoReveal() {
  const items = document.querySelectorAll('.profile__motto-item');
  if (!items.length) return;

  // prefers-reduced-motion 시 즉시 표시
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach(item => item.classList.add('is-visible'));
    return;
  }

  items.forEach((item, i) => {
    setTimeout(() => {
      item.classList.add('is-visible');
    }, i * 150);
  });
}


