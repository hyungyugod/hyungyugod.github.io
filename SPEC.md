# SPEC.md

## 개요
게임 페이지(`/pages/game.html`)를 홈에서 쇼케이스 카드 한 장으로 소개하고, 헤더의 "Game" 탭을 다른 탭들과 동일한 필터 버튼으로 리팩토링한다. 게임은 더 이상 "외부로 빠지는 링크"가 아니라 포트폴리오의 한 섹션으로 자리 잡고, 카드의 CTA를 통해 플레이 페이지로 이동한다.

## 변경 유형
**혼합** — 신규 쇼케이스 컴포넌트(디자인) + 카테고리 탭의 동작 전환(기능). Evaluator는 기능 변경 평가 기준을 적용한다.

## 디자인 언어 & 의도
기존 Velog/Brunch/GitHub의 `platform-showcase` 톤과 Music의 `music-showcase` 톤의 중간 지점. 큰 스크린샷 썸네일을 좌측에 대범하게 배치해 "플레이할 수 있는 작품"임을 한눈에 전달하고, 코럴핑크 브랜드 컬러를 악센트로 써서 게임이 이 사이트의 일부임을 각인시킨다. 호버 시 썸네일 위로 미묘한 스캔라인/픽셀 뉘앙스의 오버레이가 깔려 픽셀 게임의 레트로 정체성을 암시하되, glassmorphism 프레임 안에서 억제된 톤으로 마무리한다.

## Sprint 범위 계약
- **허용**:
  - `index.html`: Game 카테고리 섹션 마크업 추가, Game 탭 `<a>` → `<button data-filter="game">` 교체
  - `assets/css/style.css`: `.game-showcase` 컴포넌트 스타일 추가, 더 이상 쓰이지 않는 `.category-nav__btn--link` 규칙 제거(섹션 727–740)
  - `assets/js/main.js`: 필요 시 `initCategoryFilter`의 `if (btn.tagName === 'A') return;` 가드 제거 또는 유지(가드는 남겨둬도 안전함 — 제거는 필수 아님)
- **금지**:
  - `pages/game.html`, `assets/css/game.css`, `assets/js/game.js` 수정 (게임 로직 자체)
  - 기존 `platform-showcase`(velog/brunch/github), `music-showcase`, Melon/SoundCloud `link-card` 마크업/스타일 수정
  - `cover-band`에 게임 커버를 끼워 넣는 등의 별도 신규 기능
  - `:root` CSS 변수 삭제/변경 (추가는 허용)
- **판단 기준**: "이 변경이 없으면 Game 쇼케이스 카드가 필터링되거나 정상 렌더되지 않는가?" YES면 허용, NO면 금지.

## 변경 범위

### index.html 변경사항

**1) 카테고리 내비 (line 154–160) — Game 링크를 버튼으로 교체**
- 기존: `<a class="category-nav__btn category-nav__btn--link" href="/pages/game.html">Game</a>`
- 변경: `<button class="category-nav__btn" data-filter="game" type="button">Game</button>`
- 순서는 기존 그대로 마지막(Social 다음)에 둔다.

**2) Game 카테고리 섹션 추가**
- 삽입 위치: Social 섹션(`#section-social`, line 379) **바로 앞**. 즉 섹션 순서는 Writing → Music → **Game** → Social.
  - 근거: Social은 "연결점" 성격의 마무리 섹션이므로 콘텐츠 섹션(Game)이 그 앞에 오는 것이 자연스럽다.
- 마크업 구조:
```html
<!-- Game -->
<div class="category-section" data-category="game" id="section-game">
  <div class="category-header">
    <h2 class="category-title">Game</h2>
    <p class="section-label">플레이 가능한 미니 프로젝트</p>
  </div>
  <div class="links links--section">
    <article class="game-showcase" data-game="pixel-nurse">
      <div class="game-showcase__accent"></div>
      <a class="game-showcase__thumb" href="/pages/game.html"
         aria-label="김간호는 음악박사 게임 플레이하러 가기">
        <img src="/assets/img/cover-game.jpg" alt="김간호는 음악박사 게임 화면 캡처" loading="lazy">
        <span class="game-showcase__thumb-overlay" aria-hidden="true"></span>
        <span class="game-showcase__badge">
          <i class="fa-solid fa-gamepad" aria-hidden="true"></i> Playable
        </span>
      </a>
      <div class="game-showcase__body">
        <div class="game-showcase__top">
          <div class="game-showcase__icon">
            <i class="fa-solid fa-gamepad" aria-hidden="true"></i>
          </div>
          <div class="game-showcase__info">
            <h3 class="game-showcase__title">김간호는 음악박사</h3>
            <p class="game-showcase__tagline">30초 안에 음표를 최대한 많이 모으는 미니 픽셀 게임</p>
          </div>
        </div>
        <ul class="game-showcase__meta">
          <li><i class="fa-solid fa-clock" aria-hidden="true"></i> 30초 플레이</li>
          <li><i class="fa-solid fa-keyboard" aria-hidden="true"></i> 키보드 · 모바일 패드</li>
          <li><i class="fa-solid fa-layer-group" aria-hidden="true"></i> 난이도 3단계</li>
        </ul>
        <a class="game-showcase__cta" href="/pages/game.html"
           aria-label="김간호는 음악박사 게임하러 가기">
          게임하러 가기 <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
        </a>
      </div>
    </article>
  </div>
</div>
```

### assets/css/style.css 변경사항

**1) `.category-nav__btn--link` 규칙 제거 (line 727–740)**
- Game 탭이 더 이상 `<a>`가 아니므로 modifier 클래스 불필요. 블록 삭제.
- 선행 주석(`/* <a> 태그로 렌더되는 Game 링크 ... */`)도 함께 삭제.

**2) `.game-showcase` 컴포넌트 스타일 추가**
- 삽입 위치: `.platform-showcase` 규칙 끝(약 line 1172 부근) **바로 뒤**. platform-showcase와 톤을 맞추기 위해 인접 배치.
- 구조: 데스크톱에서는 2-컬럼(썸네일 좌 / 본문 우), 모바일에서는 1-컬럼(썸네일 상단).
- 필수 요소:
  - `.game-showcase` 컨테이너: glassmorphism(`var(--bg-card)` + `backdrop-filter: blur(14px) saturate(1.1);` + `-webkit-backdrop-filter` 포함), `border-radius: 16px`, `overflow: hidden`, `border: 1px solid var(--brand-12)`, 좌측에 `.game-showcase__accent`(4px 너비, `background: linear-gradient(to bottom, var(--brand), var(--brand-light))`).
  - `display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 0;` (썸네일이 약간 더 크게).
  - scroll-reveal 호환: `opacity: 0; transform: translateY(24px); transition: opacity 0.5s ease-out, transform 0.5s ease-out, box-shadow var(--transition);` + `&.is-visible { opacity: 1; transform: translateY(0); }`
  - hover 시: `box-shadow: 0 8px 40px var(--brand-14), 0 0 0 1px var(--brand-25);`
  - `.game-showcase__thumb`: `display: block; position: relative; overflow: hidden; aspect-ratio: 16 / 10;` 내부 `img`는 `width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s var(--ease-out-expo);`. hover 시 `transform: scale(1.04);`.
  - `.game-showcase__thumb-overlay`: absolute fill, `background: linear-gradient(180deg, transparent 50%, rgba(15,14,21,0.5));` + 얇은 픽셀 뉘앙스의 반복 그라디언트(`repeating-linear-gradient(0deg, transparent 0 2px, rgba(255,255,255,0.02) 2px 3px)`)를 겹쳐 레트로 느낌. hover 시 opacity 1 → 0.7로 연화.
  - `.game-showcase__badge`: 썸네일 좌상단 absolute, `top: 12px; left: 12px;` `padding: 4px 10px;` `background: var(--brand-25);` `color: var(--brand-light);` `backdrop-filter: blur(8px);` `-webkit-backdrop-filter`, `font-size: 11px;` `font-weight: 700;` `letter-spacing: 0.4px;` `border-radius: 999px;` `border: 1px solid var(--brand-35);` 아이콘 + "Playable".
  - `.game-showcase__body`: `padding: 24px 24px 22px;` `display: flex; flex-direction: column; gap: 16px;` `position: relative; z-index: 1;`
  - `.game-showcase__top`: `display: flex; align-items: center; gap: 16px;`
  - `.game-showcase__icon`: `width: 52px; height: 52px; border-radius: 14px; background: var(--brand-12); color: var(--brand-light); font-size: 24px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--brand-20); transition: transform var(--transition);` 컨테이너 hover 시 `transform: scale(1.08);`.
  - `.game-showcase__title`: `font-size: 20px; font-weight: 800; letter-spacing: -0.3px; margin: 0 0 2px;`
  - `.game-showcase__tagline`: `font-size: 13px; color: var(--text-muted); margin: 0;`
  - `.game-showcase__meta`: `list-style: none; display: flex; flex-wrap: wrap; gap: 8px 14px; padding: 0; margin: 0; font-size: 12px; color: var(--text-muted);` 각 `li`는 `display: inline-flex; align-items: center; gap: 6px;` 아이콘은 `color: var(--brand-light); font-size: 11px;`.
  - `.game-showcase__cta`: `display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; font-size: 13px; font-weight: 600; color: var(--brand-light); text-decoration: none; border-radius: 8px; background: var(--brand-08); border: 1px solid var(--brand-25); transition: all var(--transition); align-self: flex-start;` & `& i { font-size: 11px; transition: transform 0.3s ease; }` hover: `background: var(--brand-14); border-color: var(--brand-40); & i { transform: translateX(3px); }`.
  - focus-visible: `.game-showcase__thumb`, `.game-showcase__cta`는 `outline: 2px solid var(--brand-40); outline-offset: 2px;`.

**3) 라이트 테마 대응**
- `html.light .game-showcase { border-color: rgba(0,0,0,0.08); }`
- `html.light .game-showcase:hover { box-shadow: 0 8px 40px rgba(176,112,104,0.14), 0 0 0 1px rgba(176,112,104,0.25); }`

**4) 반응형 — `@media (max-width: 520px)`**
- `.game-showcase { grid-template-columns: 1fr; }`
- `.game-showcase__body { padding: 18px 16px 16px; gap: 12px; }`
- `.game-showcase__top { gap: 12px; }`
- `.game-showcase__icon { width: 44px; height: 44px; font-size: 20px; border-radius: 11px; }`
- `.game-showcase__title { font-size: 17px; }`
- `.game-showcase__tagline { font-size: 12px; }`
- `.game-showcase__meta { font-size: 11px; gap: 6px 10px; }`
- `.game-showcase__cta { padding: 8px 14px; font-size: 12px; }`

**5) `prefers-reduced-motion` 대응**
- 기존 `@media (prefers-reduced-motion: reduce)` 블록의 셀렉터에 `.game-showcase`를 포함시킨다: `.link-card, .social-card, .section-label, .platform-showcase, .game-showcase, .category-title { opacity: 1; transform: none; }` 그리고 썸네일 `img`의 scale 트랜지션도 `transition: none`로 억제.

### assets/js/main.js 변경사항

**1) `applyFilter` (line 425–435) — 쿼리 셀렉터에 `.game-showcase` 추가**
```js
sec.querySelectorAll('.link-card, .social-card, .section-label, .platform-showcase, .game-showcase, .category-title')
   .forEach(el => el.classList.add('is-visible'));
```

**2) `initScrollReveal` (line 396) — 타겟 셀렉터에 `.game-showcase` 추가**
```js
const targets = document.querySelectorAll('.link-card, .social-card, .section-label, .platform-showcase, .game-showcase, .category-title');
```

**3) `initCategoryFilter` — `<a>` 가드 유지 권장.** Game 탭이 `<button>`이 되었으므로 더 이상 해당 가드에 걸리지 않아 기존 필터 로직이 자동 처리한다. 신규 init 불필요.

**4) `DOMContentLoaded` — 수정 없음.**

## 기능 상세

### 기능 1: Game 쇼케이스 카드
- 게임 스크린샷(`/assets/img/cover-game.jpg`)을 큰 썸네일로 보여주고, 제목/설명/메타(플레이 타임, 조작, 난이도) + CTA.
- 썸네일 영역 + "게임하러 가기" CTA 모두 `/pages/game.html`로 이동. 각각 고유 `aria-label`.

### 기능 2: Game 카테고리 필터 버튼
- `<a>` → `<button data-filter="game">` 교체. 리플 이펙트·페이드 전환·활성 하이라이트 모두 기존 필터 플로우 재사용.

## 주의사항
- `<a>` 가드는 삭제하지 말 것.
- `cover-band`에 게임 커버 추가 금지.
- `pages/game.html`, `game.css`, `game.js` 수정 금지.
- 접근성: alt, aria-label, focus-visible, prefers-reduced-motion 모두 준수.
- 보안: 내부 경로만 사용, `safeUrl()` 불필요.
- dead code: `.category-nav__btn--link` 블록 제거.
