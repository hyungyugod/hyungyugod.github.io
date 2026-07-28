# 커버밴드 · ROUTINE 제거 + 전체 링크트리 단일화

## 개요
사용자가 지목한 두 섹션(`.cover-band` 커버 스트립, `.streaks` ROUTINE 위젯)을 HTML/CSS/JS 전 영역에서 완전히 제거한다.
동시에 현재 6종으로 흩어져 있는 카드 컴포넌트(`focus-card` / `platform-showcase` / `music-showcase` / `link-card` / `game-showcase` / `social-card`)를 **`.link-card` 단일 셸 하나로 통합**하여, 남은 모든 콘텐츠가 폭·간격·아이콘·호버가 완전히 동일한 세로 한 줄 링크 목록으로 읽히게 만든다.
기존 링크는 단 하나도 사라지지 않으며, 카테고리 필터 / Velog·GitHub 자동 갱신 / 프로필 모달 / 테마 토글은 전부 그대로 동작한다.

## 변경 유형
**혼합** (대규모 삭제 + 마크업 재구성 + JS 참조 정리)
→ Evaluator는 `evaluation_criteria.md`의 **"기능 변경 평가 기준"**(패턴 40% / 보안접근성 25% / 반응형UI 20% / 기능 15%)을 적용한다.

## 디자인 언어 & 의도
이 사이트는 지금 "무엇을 보여줄까"를 6가지 다른 목소리로 동시에 말하고 있다. 이번 변경의 목표는 **목소리를 하나로 줄이는 것**이다 — 모든 링크가 같은 폭, 같은 여백, 같은 44px 아이콘, 같은 `translateY(-2px)` 호버를 가진 한 줄의 카드로 정렬되어, 방문자가 "이 사람이 어디에 있는지"를 스크롤 한 번으로 훑을 수 있게 한다.
글래스모피즘 + 코럴핑크 정체성은 유지하되, **새로운 장식은 단 하나도 추가하지 않는다.** 비워낸 자리는 여백으로 남긴다. 개성은 카드마다 다른 플랫폼 아이콘 색과 호버 글로우(`--glow-velog` / `--glow-melon` / …)로만 표현하고, 나머지는 전부 침묵시킨다.
이번 스프린트의 야심은 "무엇을 더할까"가 아니라 **"CSS 3,526줄을 약 2,100줄로 줄이면서 화면은 더 좋아 보이게 만드는 것"**이다.

## Sprint 범위 계약
- **허용**: 아래 "제거 목록"·"재구성 설계"에 명시된 변경, 그리고 그 변경으로 참조가 끊긴 CSS 규칙 / JS 함수 / 상수 / 셀렉터 목록의 동기화 정리.
- **금지**: SPEC에 없는 새 시각 효과·애니메이션·컴포넌트·섹션 추가. 삭제된 섹션 자리를 메우는 어떤 종류의 신규 UI도 금지. 문구(카피) 임의 창작 금지 — SPEC에 적힌 문구만 사용.
- **판단 기준**: "이 변경이 없으면 SPEC이 요구한 삭제/통합 후에 화면이 깨지거나 콘솔 에러가 나는가?" → YES면 허용, NO면 금지.
- **특히 금지**: `.profile__motto`(3C 카드)와 `.profile__bio` 영역은 **절대 건드리지 않는다.** 과거 커밋 `9a38067 Restore original homepage motto`에서 사용자가 이 영역의 삭제를 직접 되돌린 이력이 있다.

---

## 1. 제거 대상 — 파일별 정확한 삭제 목록

> ⚠️ 아래 행 번호는 **삭제 전 기준**이다. 위에서부터 지우면 번호가 밀리므로, 반드시 **셀렉터/함수명으로 검색해서** 지울 것.

### 1-A. index.html 삭제

| # | 대상 | 위치 |
|---|---|---|
| 1 | `<section class="cover-band">` 전체 (7개 `<a>` + `.cover-band__caption`) | 198~221행 |
| 2 | `<section class="streaks">` 전체 (`.streaks__header`, `#streaksUpdated`, `#streaksGrid`, 스켈레톤 3개, `.streaks__notice`, `#streaksNoticeDate`) | 223~237행 |
| 3 | `<div class="profile__quick-stats">` 전체 (Velog / GitHub / 3C 3개 `.profile__stat`) | 75~88행 |
| 4 | `<div class="music-showcase">` 전체 (`#musicCover`, 트랙 6개, `.music-showcase__links`) | 344~395행 |

### 1-B. assets/css/style.css 삭제

**`:root` / `html.light` 변수** (⚠️ 이 3건만 삭제. 다른 변수는 절대 건드리지 말 것)
- `:root` 56~60행: `/* Routine Streaks */` 주석 + `--streak-diary` · `--streak-workout` · `--streak-threec` · `--streak-track`
- `html.light` 107행: `--streak-track`
- `:root` 63~64행 / `html.light` 108~109행: `--focus-shadow`, `--focus-inset`
  - 근거: `--focus-shadow`는 삭제될 `.focus-card:hover`가 유일 사용처, `--focus-inset`은 선언만 있고 사용처 0건(이미 죽은 변수).
  - **이 삭제는 `docs/css-rules.md` "기존 :root 변수 삭제 금지" 규칙에 대해 SPEC이 명시적으로 승인한 예외다.** 삭제 컴포넌트 전용 토큰이며, 삭제 후 참조 0건임을 검색으로 확인할 것.
- 🚨 **`--focus-pill-bg`는 절대 삭제 금지.** `.profile__action`(508행)이 사용 중이며 `.profile__action`은 살아남는다.

**컴포넌트 블록 (통째로 삭제)**

| 셀렉터 | 대략 행 |
|---|---|
| `.focus-board { … }` | 859~908 |
| `.focus-grid { … }` | 910~914 |
| `.focus-card { … }` | 916~1077 |
| `.platform-showcase { … }` (중복된 주석 2줄 포함) | 1453~1643 |
| `.game-showcase { … }` | 1645~1848 |
| `html.light .game-showcase`, `html.light .game-showcase:hover` | 1850~1856 |
| `.social-grid { … }` | 2127~2133 |
| `.social-card { … }` | 2135~2206 |
| `/* ---- Streaks ---- */ .streaks { … }` ~ `@keyframes streak-shimmer { … }` (streaks 전용 520px 미디어쿼리 + reduced-motion 미디어쿼리 + keyframes 포함) | 3088~3466 |
| `/* ---------- Cover band ---------- */` ~ 파일 끝 (`html.light .cover-band`, `@media(max-width:900px)`, `@media(max-width:720px)` 포함) | 3468~3526 |

**`html.light` 오버라이드 삭제**
- `html.light .platform-showcase[data-platform="velog"]` / `:hover` / `[brunch]` / `:hover` / `[github]` / `:hover` (283~306행)
- `html.light .platform-showcase__cta` (307~310행)
- `html.light .social-card:hover` (311~314행)
- `html.light .music-showcase`, `html.light .music-showcase__track:hover, …is-active`, `html.light .music-showcase__link-btn` (3073~3086행)
- ✅ **유지**: `html.light .featured-item`, `html.light .link-card:hover`, `html.light .icon--brunch`, `html.light .icon--github`

**프로필 (quick-stats)**
- `.profile` 내부 542~576행: `& .profile__quick-stats`, `& .profile__stat`, `& .profile__stat-value`, `& .profile__stat-label`
- 806~809행: `.hero .profile__quick-stats { … }` (등장 애니메이션)
- 2274~2277행(520px): `& .profile__quick-stats`, `& .profile__stat`, `& .profile__stat-value`, `& .profile__stat-label`
- 2744행(reduced-motion): 셀렉터 목록에서 `.hero .profile__quick-stats,` 제거

**`@media (max-width: 520px)` 내부 삭제**
- `.focus-board { … }` (2288~2305), `.focus-grid { … }` (2307~2309), `.focus-card { … }` (2311~2375)
- `.platform-showcase { … }` (2383~2393), `.game-showcase { … }` (2395~2405)
- `.social-grid { … }` (2440~2443), `.social-card { … }` (2445~2453)
- `.link-card { … }` 블록(2377~2381)은 §2-C 토큰화로 **대체**된다 (삭제 후 토큰 :root 오버라이드로 이관)

**`@media (min-width: 900px)` 내부 삭제**
- `.focus-board`(2808~2820), `.focus-grid`(2822~2826), `.focus-card`(2828~2834)
- `.category-section { min-height/padding-top/padding-bottom }`(2837~2841) — `--stack-gap`으로 대체
- `.category-section[data-category="writing"] .links--section`(2849~2852)
- `.platform-showcase { … }`(2855~2898), `.platform-showcase .featured-item__thumb`(2900~2903), `.platform-showcase .featured-item__label`(2905~2907)
- `.music-showcase` ~ `.music-showcase__link-btn` 전체(2910~3059)
- `.category-section[data-category="music"] .links--section { display: none; }`(3061~3064) — **반드시 삭제.** 남으면 데스크톱에서 Melon/SoundCloud 카드가 사라진다.
- `.social-grid`(3067~3070)

**기타 죽은 코드 삭제**
- 132~144행 터치 하드닝 셀렉터 목록에서 `.platform-showcase__cta`, `.music-showcase__link-btn`, `.focus-card__cta` 제거 → 최종 목록: `button, .profile__action, .link-card__header`
- `.link-card` 내부 1338~1339행: `&:nth-child(odd).is-visible`, `&:nth-child(even).is-visible` (`.is-visible`과 동일한 값을 재선언하는 no-op)
- `.link-card` 내부 1360~1369행: `&::after { … opacity: 0 … }` (트리거가 없어 영구히 보이지 않는 죽은 레이어) + 2726행 `.link-card:hover::after { animation: none; opacity: 0; }`
- `.links` 의 `&--section` 모디파이어(1312~1314) — HTML에서도 `links--section` 클래스를 전부 제거하고 `links`만 남긴다

**2714행 reduced-motion 블록 셀렉터 동기화**
- 2721~2722행 목록 → `.link-card, .section-label, .category-title { opacity: 1; transform: none; }`
- 2723행 `.game-showcase .game-showcase__thumb img { transition: none; }` 삭제
- 2729~2731행 → `.link-card:hover, .profile__action:hover, .link-card .featured-item:hover { transform: none; }`

### 1-C. assets/js/main.js 삭제

| # | 대상 | 대략 행 |
|---|---|---|
| 1 | `// Auto-fetch: 루틴 연속일수 streak 위젯` 섹션 구분선 + JSDoc + `async function fetchStreaks()` 전체 | 174~299 |
| 2 | `bindStreakFlip(grid)` JSDoc + 함수 전체 | 301~327 |
| 3 | `safeInit(fetchStreaks, 'fetchStreaks');` | 345 |
| 4 | `safeInit(initMusicShowcase, 'initMusicShowcase');` | 356 |
| 5 | 커버밴드 IIFE 전체 — `/* Cover band — click to scroll … */` 주석 + `(function(){ … })();` (`activateCategory`, `scrollTo` 포함) | 801~843 |
| 6 | streaks 보강 IIFE 전체 — `/* Streaks: mark longest + render sparkline */` 주석 + `(function(){ … })();` (**상수 `KIND_BY_INDEX`, `HISTORY`, `MutationObserver` 포함**) | 845~894 |
| 7 | `// 뮤직 쇼케이스 (데스크탑) …` 섹션 구분선 + `function initMusicShowcase()` 전체 | 749~777 |
| 8 | 742~748행의 고아 주석 — `// 3C 모토 카드 순차 등장` 구분선 + `/** 모토 카드를 시차를 두고 순차적으로 등장시킴 */` JSDoc (실제 함수는 780행 이후에 자기 구분선을 따로 갖고 있는 중복 잔재) | 742~748 |

**삭제 후 남아야 할 `DOMContentLoaded` 목록 (정확히 12개, 이 순서)**
```
fetchGitHub, fetchVelog, initModal, initCategoryFilter, initThemeToggle,
initTyping, initScrollReveal, initScrollProgress, initMouseParallax,
initHeroParallax, initNameShine, initMottoReveal
```

**검증**: 삭제 후 `streak`, `cover-band`, `musicCover`, `music-showcase`, `KIND_BY_INDEX`, `HISTORY`, `streaksGrid`, `streaksUpdated`, `streaksNoticeDate` 문자열이 main.js에 **0건**이어야 한다.

### 1-D. data/streaks.json 처리 방침

- **현재 유일한 참조**: `fetchStreaks()`의 `fetchWithTimeout('/data/streaks.json', …)` 한 곳뿐. 이 함수를 지우면 참조는 0건이 된다.
- **방침: 파일은 디스크에 남겨두고, 코드 참조만 완전히 제거한다. Generator는 이 파일을 삭제하지 않는다.**
  - 근거 ①: Generator의 수정 권한은 `docs/components.md` 기준 `index.html` / `style.css` / `main.js` / `pages/*`로 한정된다.
  - 근거 ②: 일기·운동 기록이라는 **사용자 개인 데이터**다. 에이전트가 임의 삭제할 성격이 아니다.
  - 근거 ③: 제로빌드 정적 사이트라 참조되지 않는 36줄 JSON은 런타임·번들·시각적 비용이 0이다.
- 사용자가 원하면 직접 지우면 된다: `git rm data/streaks.json`. 이 안내를 최종 보고에 포함할 것.

---

## 2. 재구성 설계 — 링크트리 단일화

### 2-A. 핵심 개념: 하나의 셸, 3개 티어

모든 콘텐츠는 `.link-card` **하나의 셸**을 쓴다. 폭·라운드·패딩·아이콘 크기·호버가 전부 동일하고, **안에 담는 내용물만 3단계로 다르다.**

| 티어 | 구성 | 적용 대상 |
|---|---|---|
| **A. 프리뷰 행** | `__header` + `__divider` + `__items`(정사각 썸네일 3개) | Velog, GitHub, Brunch, Melon, SoundCloud, App Store |
| **B. 피처 행** | `__header` + `__divider` + `__items`(16:10 커버 1개, `.link-card--feature`) | Game |
| **C. 단독 행** | `__header` 만 | Instagram, 지식산책, 네이버 |

`__header` 구조는 세 티어 모두 완전히 동일: `[44px 아이콘] [제목 / 설명] [→ 화살표]`.
프리뷰 썸네일은 전부 **정사각(`aspect-ratio: 1`)**으로 통일된다 — 이것이 페이지 전체를 묶는 가장 강한 시각 신호다. (앱 아이콘의 `--app` 라운드, 게임 피처 행의 16:10만 예외)

### 2-B. 삭제되는 6종 → `.link-card` 매핑

| 기존 컴포넌트 | 처리 | 링크 손실 |
|---|---|---|
| `.focus-card--velog` (Velog) | → 티어 A `.link-card` (`#velog-items`를 `.link-card__items`로 이동) | 없음 |
| `.focus-card--github` (GitHub) | → 티어 A `.link-card` (`#github-items` 이동) | 없음 |
| `.platform-showcase[data-platform=brunch]` | → 티어 A `.link-card` | 없음 |
| `.music-showcase` (데스크톱 전용 플레이어) | **완전 삭제** — 아래 링크 동일성 표 참조 | **없음(100% 중복)** |
| `.game-showcase` | → 티어 B `.link-card--feature` | 없음 (`/pages/game.html` 2곳 유지) |
| `.social-card` ×3 + `.social-grid` | → 티어 C `.link-card` ×3, 컨테이너는 `.links` | 없음 |

**`.music-showcase` 삭제 근거 — href 100% 중복 검증 완료**

| music-showcase 링크 | 동일 href를 이미 갖는 곳 |
|---|---|
| `melon…songId=600864946` | Melon 카드 아이템 1 |
| `melon…songId=39154106` | Melon 카드 아이템 2 |
| `melon…songId=600864948` | Melon 카드 아이템 3 |
| `soundcloud…/need-feat-sumin` | SoundCloud 카드 아이템 1 |
| `soundcloud…/prod-chill-sebs` | SoundCloud 카드 아이템 2 |
| `soundcloud…/burn-it-up-feat-haram-prodsloth` | SoundCloud 카드 아이템 3 |
| `melon…artistId=4347369` | Melon 카드 헤더 |
| `soundcloud.com/user-928451677` | SoundCloud 카드 헤더 |

고유 링크 0개 손실. 게다가 이 컴포넌트는 `≥900px`에서만 보이고, 같은 조건에서 Melon/SoundCloud 카드를 `display:none`으로 숨기는 **뷰포트 의존 컴포넌트 교체 해킹**을 동반하고 있었다 — 사용자가 지적한 "산만함"의 최대 원인이므로 통째로 제거한다.

### 2-C. 새 공용 토큰 (`:root` 하단에 **추가**)

```
/* Linktree row tokens */
--card-gap: 14px;          /* 카드 사이 세로 간격 */
--card-pad-x: 24px;        /* 헤더/아이템 좌우 패딩 */
--card-pad-y: 20px;        /* 헤더 상하 패딩 */
--card-items-gap: 10px;    /* 프리뷰 썸네일 사이 간격 */
--card-icon: 44px;         /* 아이콘 정사각 크기 */
--card-icon-radius: 12px;  /* 아이콘 라운드 */
--stack-gap: 40px;         /* 섹션 사이 세로 간격 */
--glow-naver: rgba(3, 199, 90, 0.18);
```
`html.light`에도 `--glow-naver: rgba(3, 199, 90, 0.15);` 추가.

**모바일 대응은 토큰 재정의 한 블록으로 처리**한다 (컴포넌트별 오버라이드를 대체):
```
@media (max-width: 520px) {
  :root {
    --card-gap: 12px;
    --card-pad-x: 18px;
    --card-pad-y: 16px;
    --card-items-gap: 8px;
    --card-icon: 40px;
    --card-icon-radius: 10px;
    --stack-gap: 28px;
  }
  …
}
```

**토큰 적용 지점** (`.link-card` / `.links` / `.category-section` 규칙 수정)
```
.links              { gap: var(--card-gap); }        /* --section 모디파이어 삭제 */
.category-section   { margin-bottom: var(--stack-gap); }
.link-card__header  { padding: var(--card-pad-y) var(--card-pad-x); }
.link-card__icon    { width: var(--card-icon); height: var(--card-icon);
                      border-radius: var(--card-icon-radius); }
.link-card__divider { margin: 0 var(--card-pad-x); }   /* 기존 0 20px → 헤더와 정렬 */
.link-card__items   { gap: var(--card-items-gap);
                      padding: calc(var(--card-pad-y) - 4px) var(--card-pad-x) var(--card-pad-y); }
```
(`--card-pad-y` 계산식은 데스크톱 16/24/20, 모바일 12/18/16으로 기존 값과 정확히 일치한다.)

### 2-D. 새로 추가할 CSS (이게 전부다 — 그 외 신규 규칙 금지)

```
/* 게임 아이콘 — 브랜드 톤 (기존 .game-showcase__icon 값 승계) */
.icon--game { background: var(--brand-12); color: var(--brand-light);
              border: 1px solid var(--brand-20); }
```

`.link-card` 블록 내부에 중첩 추가:
```
&--feature {
  & .link-card__items   { grid-template-columns: 1fr; }
  & .featured-item__thumb { aspect-ratio: 16 / 10; }
  & .featured-item__label { font-size: 12px; }
  & .featured-item::before { display: none; }   /* 단일 아이템에 번호 뱃지 불필요 */
}
```

`.link-card` 기존 `:has()` 글로우 목록에 4줄 추가 (기존 6줄과 완전히 같은 형식):
```
&:has(.icon--instagram):hover  { box-shadow: 0 6px 24px var(--glow-instagram); }
&:has(.icon--instagram2):hover { box-shadow: 0 6px 24px var(--glow-instagram); }
&:has(.icon--naver):hover      { box-shadow: 0 6px 24px var(--glow-naver); }
&:has(.icon--game):hover       { box-shadow: 0 6px 24px var(--brand-14); }
```

`@media (max-width: 520px)` 내부 프리뷰 가독성 미세 조정 1건:
```
.featured-item .featured-item__meta { padding: 0 8px 8px; font-size: 9.5px; }
```

### 2-E. 데스크톱 폭 재정의 (`@media (min-width: 900px)`)

삭제 후 남는 블록은 **정확히 아래 3개 규칙뿐**이다:
```
@media (min-width: 900px) {
  .hero { min-height: min(100svh, 820px);
          padding-top: clamp(64px, 10vh, 120px);
          padding-bottom: clamp(88px, 12vh, 140px); }

  .page-wrapper { max-width: 760px; padding: 16px 32px 96px; }   /* 기존 1120px → 760px */
  .profile      { max-width: 760px; }                             /* 기존 800px → 히어로/링크 축 정렬 */
}
```
근거: 2열 focus-grid와 가로형 platform-showcase가 사라지면 1120px 단일 컬럼은 썸네일이 340px까지 늘어나 링크트리로 읽히지 않는다. 760px는 프리뷰 썸네일을 약 230px로 유지하며, 히어로와 링크 컬럼의 좌우 축을 정확히 일치시킨다.

### 2-F. `.page-wrapper` 상단 여백

`.category-nav`가 100vh 히어로 바로 다음 첫 요소가 되므로:
- `.page-wrapper { padding: 28px 24px 80px; }` (기존 `12px 24px 80px`)
- `@media (max-width: 520px) .page-wrapper { padding: 20px 16px 56px; }` (기존 `12px 16px 56px`)

---

## 3. index.html 최종 구조

```
hero (프로필 — quick-stats만 제거, 나머지 100% 그대로)
scroll-hint
page-wrapper
  category-nav          ← 탭 순서만 재정렬 (§3-A)
  div#section-writing.category-section[data-category="writing"]
      category-header + links[ Velog / GitHub / Brunch ]
  div#section-music.category-section[data-category="music"]
      category-header + links[ Melon / SoundCloud ]
  div#section-game.category-section[data-category="game"]
      category-header + links[ Game(feature) ]
  div#section-app.category-section[data-category="app"]
      category-header + links[ App Store ]
  div#section-social.category-section[data-category="social"]
      category-header + links[ Instagram / 지식산책 / 네이버 ]
  footer (그대로)
modal-backdrop#profileModal (그대로)
```

- `.focus-board`가 갖고 있던 `data-category="writing"`은 `#section-writing` 하나로 **병합**된다. 같은 카테고리 섹션이 2개로 쪼개져 있던 상태가 해소된다.
- 모든 섹션 컨테이너는 기존 다수파를 따라 `<div class="category-section">`로 통일한다 (기존 `<section class="focus-board category-section">`은 사라짐).
- `#section-writing` / `#section-music` 등 id는 **유지**한다 (외부 앵커 링크 가능성).
- `.links--section` 클래스는 HTML에서 전부 제거하고 `class="links"`만 남긴다.

### 3-A. 카테고리 탭 순서 재정렬 (버튼 이동만, 추가/삭제 없음)

현재 탭 순서(All / Writing / Music / **Social** / Game / Apps)와 DOM 섹션 순서(writing / music / game / app / **social**)가 어긋나 "All"에서 순서가 뒤바뀐다.
→ `data-filter="social"` 버튼을 `data-filter="app"` 버튼 **뒤로 이동**시켜 최종 순서를 만든다:
`All · Study & Writing & Dev · Music · Game · Released Apps · Social`
버튼 마크업(아이콘 SVG, `role`, `aria-selected`)은 하나도 바꾸지 않고 위치만 옮긴다.

### 3-B. 각 섹션 헤더 문구 (이 문구만 사용, 창작 금지)

| 섹션 | `category-title` | `section-label` |
|---|---|---|
| writing | `Study & Writing & Dev` | `Velog · GitHub 자동 갱신 · 에세이 아카이브` |
| music | `Music` | `음악 · 프로듀싱 · 릴리즈` (기존 그대로) |
| game | `Game` | `플레이 가능한 미니 프로젝트` (기존 그대로) |
| app | `Released Apps` | `App Store 정식 출시 iOS 앱` (기존 그대로) |
| social | `Social` | `연결점 · 소셜 링크` (기존 그대로) |

writing 라벨만 새로 쓴다 — 삭제되는 `.focus-board__lede`("…기존 RSS/API 흐름으로 자동 갱신됩니다")의 정보를 한 줄로 승계하기 위함이다.

### 3-C. 마크업 템플릿

**티어 A — Velog** (GitHub은 `#github-items` / `icon--github` / `fa-brands fa-github`로 동일 구조)
```html
<div class="link-card">
  <a class="link-card__header" href="https://velog.io/@hyungyugod/posts" target="_blank" rel="noopener">
    <div class="link-card__icon icon--velog"><i class="fa-solid fa-code" aria-hidden="true"></i></div>
    <div class="link-card__info">
      <div class="link-card__title">Velog</div>
      <div class="link-card__desc">개발 블로그 · 최근 글 자동 갱신</div>
    </div>
    <i class="fa-solid fa-arrow-right link-card__arrow" aria-hidden="true"></i>
  </a>
  <div class="link-card__divider"></div>
  <div class="link-card__items" id="velog-items">
    <div class="featured-item featured-item--loading"><div class="featured-item__thumb"></div><div class="featured-item__label">로딩 중...</div></div>
    <!-- 스켈레톤 3개 (기존 것 그대로 이동) -->
  </div>
</div>
```
🚨 **`id="velog-items"` / `id="github-items"`는 반드시 `.link-card__items` div에 붙인다.** `fetchVelog()`/`fetchGitHub()`가 이 요소의 `innerHTML`을 교체하므로 위치가 틀리면 자동 갱신이 죽는다.

- GitHub `__desc`: `최근 push된 프로젝트`
- Brunch: `icon--brunch` + `fa-solid fa-pen-nib`, 제목 `Brunch`, `__desc` `에세이 & 글쓰기`, 헤더 href `https://brunch.co.kr/@hyungyugood`, 아이템 3개는 기존 `.platform-showcase__content`의 `.featured-item` 3개를 **그대로** 이동
- Melon / SoundCloud / App Store 카드는 **현재 마크업 그대로 유지** (이미 티어 A다)

**티어 B — Game**
```html
<div class="link-card link-card--feature">
  <a class="link-card__header" href="/pages/game.html">
    <div class="link-card__icon icon--game"><i class="fa-solid fa-gamepad" aria-hidden="true"></i></div>
    <div class="link-card__info">
      <div class="link-card__title">김간호는 음악박사</div>
      <div class="link-card__desc">45초 몰래 작곡 미니게임 · 키보드 &amp; 모바일 패드</div>
    </div>
    <i class="fa-solid fa-arrow-right link-card__arrow" aria-hidden="true"></i>
  </a>
  <div class="link-card__divider"></div>
  <div class="link-card__items">
    <a class="featured-item" href="/pages/game.html" aria-label="김간호는 음악박사 게임 플레이하러 가기">
      <img class="featured-item__thumb" src="/assets/img/cover-game.jpg" alt="김간호는 음악박사 게임 화면" loading="lazy">
      <div class="featured-item__label">게임하러 가기</div>
    </a>
  </div>
</div>
```
기존 `.game-showcase__meta`의 3개 항목(45초 / 키보드·모바일 패드 / 난이도 3단계)은 `__desc` 한 줄로 압축한다. 내부 링크이므로 `target="_blank"` 없음.

**티어 C — Social** (3개 모두 동일 구조)
```html
<div class="link-card">
  <a class="link-card__header" href="https://www.instagram.com/hy_nxx9/" target="_blank" rel="noopener">
    <div class="link-card__icon icon--instagram"><i class="fa-brands fa-instagram" aria-hidden="true"></i></div>
    <div class="link-card__info">
      <div class="link-card__title">Instagram</div>
      <div class="link-card__desc">@hy_nxx9</div>
    </div>
    <i class="fa-solid fa-arrow-right link-card__arrow" aria-hidden="true"></i>
  </a>
</div>
```
- 지식산책: `icon--instagram2`, 제목 `지식산책`, desc `@knowledge_stroll`, href 기존 그대로
- 네이버: `icon--naver`, 제목 `네이버`, desc `성현규`, href 기존 그대로. 인라인 `<svg>`는 그대로 옮기되 **`aria-hidden="true" focusable="false"` 속성을 추가**한다 (현재 누락).

---

## 4. assets/js/main.js 변경

### 4-A. 공용 셀렉터 상수 신설 (중복 제거)
현재 동일한 긴 셀렉터 문자열이 `initScrollReveal()`(413행)과 `applyFilter()`(446행) 두 곳에 복붙되어 있어, 컴포넌트가 사라지면 둘 다 고쳐야 하는 구조다. 한 곳으로 합친다.

`// 유틸리티 함수` 구분선 바로 아래, `esc()` 위에 배치:
```js
/** 스크롤 등장 애니메이션 대상 셀렉터 — initScrollReveal / applyFilter 공용 */
const REVEAL_SELECTOR = '.link-card, .section-label, .category-title';
```
- `initScrollReveal()`: `document.querySelectorAll(REVEAL_SELECTOR)`
- `applyFilter()`: `sec.querySelectorAll(REVEAL_SELECTOR).forEach(el => el.classList.add('is-visible'));`

### 4-B. 그 외
- §1-C 삭제 목록 수행 외에 **다른 함수는 한 줄도 수정하지 않는다.**
- `fetchVelog()` / `fetchGitHub()` 본문은 **절대 손대지 않는다** — `esc()`/`safeUrl()` 보안 처리가 들어 있다. 렌더 대상 컨테이너 id가 그대로이므로 수정할 이유가 없다.
- `initCategoryFilter`, `initModal`, `initThemeToggle`, `initTyping`, `initScrollProgress`, `initMouseParallax`, `initHeroParallax`, `initNameShine`, `initMottoReveal`, `safeInit`, `esc`, `safeUrl`, `fetchWithTimeout`, `showFetchError` → 전부 유지.

---

## 5. 기능 상세

### 기능 1: 두 섹션 완전 제거
- 설명: `.cover-band`, `.streaks`를 마크업·스타일·스크립트·전용 CSS 변수까지 흔적 없이 제거
- 사용자 동작: 해당 UI가 화면에서 사라짐. 콘솔 에러 0건
- 구현 위치: 3개 파일 전부 (§1-A/B/C)
- 검증: `cover-band`, `streak`, `streaksGrid` 문자열 검색 결과 3개 파일 모두 0건

### 기능 2: 6종 카드 → `.link-card` 단일화
- 설명: focus-card / platform-showcase / music-showcase / game-showcase / social-card 5종을 폐기하고 `.link-card` 3티어로 재구성
- 사용자 동작: 모든 링크가 동일한 폭·간격·호버로 세로 정렬된 목록으로 읽힘. 클릭 대상은 전부 유지
- 구현 위치: index.html 마크업 재작성 + style.css 블록 삭제/토큰화
- 검증: 링크 인벤토리 대조 (§7)

### 기능 3: 공용 토큰 기반 리듬
- 설명: `--card-*` / `--stack-gap` 7개 토큰으로 간격·패딩·아이콘 크기를 일원화, 모바일은 `:root` 재정의 한 블록으로 처리
- 사용자 동작: 데스크톱/모바일 모두에서 카드 리듬이 일정
- 구현 위치: style.css `:root`, `@media (max-width:520px) :root`
- 검증: `.link-card`/`.links`/`.category-section`에 하드코딩 px 패딩·gap이 남아 있지 않을 것

### 기능 4: 기존 기능 100% 보전
- 카테고리 필터: 5개 `.category-section[data-category]` + 6개 탭 정상 동작
- Velog/GitHub 자동 갱신: `#velog-items` / `#github-items` 유지 → 무수정 동작
- 프로필 모달: `.js-open-profile`(아바타 + Profile 버튼) 2개 유지, 포커스 트랩 유지
- 테마 토글: `.js-theme-toggle` 유지, 삭제 컴포넌트의 `html.light` 오버라이드만 동반 삭제

---

## 6. 히어로 축소 검토 결과 (근거 기록)

사용자가 명시적으로 지목한 것은 2개 섹션뿐이므로, 히어로는 **`profile__quick-stats` 1건만 제거**하고 나머지는 전부 보존한다.

**제거 — `.profile__quick-stats`**
1. 3개 중 1개("3C / Daily routine")가 **삭제되는 ROUTINE 섹션을 가리키는 죽은 참조**다. 그대로 두면 존재하지 않는 것을 안내하게 된다.
2. 나머지 2개("Velog / Latest writing", "GitHub / Latest code")는 바로 8px 위 `.profile__actions`의 Velog·GitHub 버튼과, 아래 링크 목록의 Velog·GitHub 카드를 **3중으로 반복**한다.
3. 클릭 불가능한 `<span>`이라 **링크 손실 0건**이다.
4. 성격상 삭제되는 ROUTINE 섹션과 같은 "수치 표시" 장르다 — 함께 제거해야 사용자 의도가 완결된다.

**보존 — 검토했으나 건드리지 않기로 한 것**
- `.profile__motto`(3C 카드 3개): 커밋 `9a38067 Restore original homepage motto`에서 사용자가 이 영역 삭제를 직접 되돌린 이력이 있다. **최우선 보존.**
- `.profile__bio`(Once. Everything. / 한국어 / 타이핑): 사이트의 개인적 목소리 그 자체. 링크트리화와 무관.
- `.profile__eyebrow` + `.profile__subtitle` + `.profile__statement` + 타이핑 애니메이션: 자기소개가 4겹으로 겹치는 것은 사실이나(예: subtitle "Developer · Producer · Writer" vs 타이핑 "Developer/Music Producer/Writer/Thinker"), **텍스트 카피 삭제는 사용자가 요청하지 않았고 되돌리기 비용이 큰 변경**이므로 이번 스프린트에서 제외한다. 사용자에게 후속 제안으로만 보고할 것. Generator는 **손대지 말 것.**
- `.scroll-hint`, 아바타 halo/ring, `.hero-bg` 패럴랙스: 유지.

---

## 7. 완료 검증 체크리스트 (SELF_CHECK.md에 결과 기재)

**링크 인벤토리 — 변경 전후 동일해야 함**
- Velog 포스트 목록 ×1 (헤더) + 동적 3개
- GitHub 프로필 ×1 (헤더) + 동적 3개
- Brunch 매거진 ×1 + 글 3개(`/20`, `/19`, `/18`)
- Melon 아티스트 ×1 + 곡 3개(`600864946`, `39154106`, `600864948`)
- SoundCloud 프로필 ×1 + 트랙 3개(`need-feat-sumin`, `prod-chill-sebs`, `burn-it-up-feat-haram-prodsloth`)
- App Store ×1 + 앱 3개(`poppath`, `김간호는 음악박사`, `lumark`)
- `/pages/game.html` ×2
- Instagram `@hy_nxx9` ×1, `@knowledge_stroll` ×1, 네이버 검색 ×1
- 푸터: mailto, SoundCloud, Instagram, GitHub ×4
- 모달 내부 링크 ×5 (Velog, GitHub, Melon, SoundCloud, Brunch)

**코드 검증**
- [ ] 3개 파일에서 `cover-band`, `streak`, `music-showcase`, `focus-card`, `focus-board`, `focus-grid`, `platform-showcase`, `game-showcase`, `social-card`, `social-grid`, `quick-stats`, `profile__stat`, `links--section` 검색 결과 **전부 0건**
- [ ] `--streak-*`, `--focus-shadow`, `--focus-inset` 검색 0건 / **`--focus-pill-bg`는 2건 이상 존재**(선언 + `.profile__action`)
- [ ] `main.js` 최종 `DOMContentLoaded` 항목 정확히 12개
- [ ] 브라우저 콘솔 에러 0건, `initScrollReveal`/`applyFilter` 모두 `REVEAL_SELECTOR` 사용
- [ ] CSS에 SCSS 문법 없음, 하드코딩 색상 신규 추가 0건, 모든 중첩은 `&` 문법
- [ ] `@media (max-width: 520px)` 단일 브레이크포인트 유지(+ 기존 `min-width:900px` 데스크톱 블록)
- [ ] `prefers-reduced-motion` 블록 셀렉터가 살아있는 클래스만 참조
- [ ] 모든 외부 링크에 `target="_blank" rel="noopener"` / 모든 장식 `<i>`,`<svg>`에 `aria-hidden="true"`
- [ ] 다크·라이트 테마 양쪽에서 카드 배경·보더·글로우 정상
- [ ] style.css 약 2,100줄 내외 (±200줄, **정확한 수치는 합불 기준이 아님**), main.js 약 560줄 내외

---

## 8. 주의사항

- 🚨 **`--focus-pill-bg` 삭제 금지.** `.profile__action`(히어로 Velog/GitHub/Profile 버튼)이 사용한다. 지우면 버튼 배경이 사라진다.
- 🚨 **`#velog-items` / `#github-items` id 유지.** 위치가 `.link-card__items`가 아니면 자동 갱신이 조용히 죽는다.
- 🚨 **`.category-section[data-category="music"] .links--section { display: none; }`(≥900px) 반드시 삭제.** 남으면 데스크톱에서 Melon/SoundCloud 카드가 통째로 사라진다.
- 🚨 **`.js-open-profile` 클래스 2곳(아바타 `#profileAvatar`, Profile 버튼) 유지.** 모달 트리거다.
- `.link-card__header`가 `<a>`이므로 카드 전체가 링크가 아니다 — 티어 C(소셜)에서도 클릭 영역은 헤더 전체(패딩 포함)로 충분하다. 카드 전체를 감싸는 `<a>`로 바꾸지 말 것(티어 A/B에서 링크 중첩이 발생한다).
- `.link-card:nth-child(1~3)` 트랜지션 딜레이는 `.links` 직속 형제 기준으로 동작한다. 카드 사이에 다른 요소를 끼워 넣지 말 것.
- `pages/game.html`은 이번 변경 대상이 아니며, 삭제되는 클래스를 참조하지 않음(확인 완료).
- `docs/components.md`의 컴포넌트 표는 이 변경으로 낡게 된다(`.social-grid` 등). **Generator는 `docs/`를 수정하지 않는다.** 사용자에게 후속 업데이트 필요 사항으로 보고만 할 것.
- 텍스트 카피는 §3-B, §3-C에 적힌 것만 사용한다. 새 문구를 창작하지 말 것.
