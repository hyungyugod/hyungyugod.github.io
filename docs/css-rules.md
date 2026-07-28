# CSS 규칙

이 문서는 `assets/css/style.css`에 적용되는 모든 CSS 규칙을 정의합니다.

---

## 1. CSS 네이티브 중첩 (필수)

SCSS가 아닌 **CSS 네이티브 중첩 `&` 문법**을 사용합니다.

```css
/* 올바른 패턴 */
.block {
  color: var(--text);

  & .block__child {
    font-size: 14px;
    &:hover { color: var(--brand); }
  }

  &.block--variant { background: var(--bg-card); }  /* 모디파이어는 전체 이름 */
  &.is-active { border-color: var(--brand-40); }
  &::after { content: ''; position: absolute; }
}

/* 금지 */
.block {
  &--variant { }        /* SCSS식 문자열 연결 — 네이티브 중첩에서 무효 */
  .child { }            /* & 없이 중첩 */
  $color: red;          /* SCSS 변수 */
  @include mixin();     /* SCSS mixin */
}
```

### ⚠️ `&--variant`는 동작하지 않는다

SCSS는 `&--variant`를 `.block--variant`로 **문자열 연결**하지만, CSS 네이티브 중첩에는 그런 기능이 없다.
`&`는 부모 셀렉터를 가리키는 값일 뿐이라 뒤에 문자를 붙일 수 없고, 규칙 전체가 조용히 무시된다.
빌드 에러도 콘솔 경고도 없어서 **눈으로는 절대 발견되지 않는다.**

```css
.featured-item {
  &--loading { opacity: 0.4; }   /* ❌ 적용 안 됨. 에러도 안 남 */
  &.featured-item--loading { opacity: 0.4; }  /* ✅ */
}
```

실제로 이 함정 때문에 로딩 스켈레톤이 오랫동안 적용되지 않은 채 원문 텍스트("로딩 중...")를 노출했다.
**모디파이어를 중첩할 때는 `&.block--variant`처럼 블록 이름을 전부 적는다.**
헷갈리면 중첩하지 말고 최상위에 `.block--variant { }`로 따로 쓴다.

---

## 2. 색상 체계 — CSS Custom Properties

모든 색상은 `:root` 변수를 사용한다. 하드코딩 금지.
새 색상이 필요하면 `:root`와 `html.light` **양쪽**에 추가한다. 한쪽만 넣으면 반대 테마에서 값이 샌다.

**배경:**
`--bg: #0f0e15` · `--bg-dark: #09080f` · `--bg-card: rgba(23,21,30,0.82)` · `--bg-card-hover: rgba(30,28,40,0.9)`

**브랜드 (더스티 로즈):**
`--brand: #c4847a` · `--brand-light: #d4a49c` (라이트 테마: `#b07068` / `#c48a82`)
투명도 변형: `--brand-04` `-06` `-08` `-10` `-12` `-14` `-20` `-25` `-35` `-40` `-60` — 11단계

**텍스트:**
`--text: #eee` · `--text-muted: #aaa` · `--text-dim: #808080` (라이트: `#1a1a2e` / `#555` / `#6b6b6b`)

### ⚠️ 브랜드 색을 텍스트에 쓸 때는 `--brand-text`

`--brand-light`는 **그라디언트의 밝은 끝단**이다. 라이트 테마에서 이걸 글자색으로 쓰면
밝은 배경 위 밝은 글자가 되어 대비가 2.6:1까지 떨어진다.

```css
color: var(--brand-text);    /* ✅ 글자 */
background: linear-gradient(135deg, var(--brand-light), var(--brand));   /* ✅ 배경 */
color: var(--brand-light);   /* ❌ 라이트 테마에서 AA 실패 */
```

다크 테마에서는 `--brand-text`와 `--brand-light`가 같은 값이라 겉모습이 바뀌지 않는다.
라이트 테마에서만 `#8a574f`로 어두워진다.

**플랫폼 배지 색도 마찬가지다.** `--platform-velog` / `--platform-github` / `--platform-app`은
다크용 원색이 밝은 배경에서 2.2:1까지 떨어지므로 `html.light`에 어두운 값을 따로 둔다.
배지 배경이 **같은 색의 14% 틴트**라 그 위에서 4.5:1을 넘어야 한다는 점을 잊지 말 것.

**보더:**
`--border: rgba(255,255,255,0.07)` · `--border-hover: rgba(255,255,255,0.14)`

**공용 토큰:**
`--radius: 10px` · `--radius-sm: 6px` · `--radius-lg: 16px` · `--font: 'Inter', 'Noto Sans KR', ...` · `--font-serif: 'Cormorant Garamond', ...` · `--transition: 0.55s cubic-bezier(0.25,0.46,0.45,0.94)` · `--spring-bounce` · `--ease-out-expo`

**플랫폼 아이콘 색상:**
SoundCloud(`#ff5500→#ff7700`) · Instagram(`#833AB4→#E1306C→#F77737`) · Instagram2(`#405DE6→#5851DB→#833AB4`) · Melon(`#00cd3c→#00a832`) · Brunch(`#111`/`#ddd`) · Velog(`#20c997→#12b886`) · GitHub(`#ececec`/`#0a0a0a`) · Naver(`#03C75A`) · App Store(`--platform-app`)

**호버 글로우:** `--glow-velog` `--glow-brunch` `--glow-github` `--glow-melon` `--glow-soundcloud` `--glow-instagram` `--glow-naver` `--glow-app`

> `assets/css/game.css`는 이 변수들을 그대로 상속해서 쓴다. `:root` 변수를 지울 때는 `style.css`뿐 아니라 **`game.css`의 `var()` 참조도 함께 확인**해야 한다.

---

## 3. 클래스 네이밍 — BEM

```
block__element--modifier
```

- **Block**: `.link-card`, `.featured-item`, `.profile`, `.modal-backdrop`, `.category-nav`, `.category-section`, `.links`, `.footer`
- **Element**: `__header`, `__icon`, `__title`, `__desc`, `__arrow`, `__thumb`, `__label`, `__info`, `__divider`, `__items`, `__meta`, `__source`, `__detail`
- **Modifier**: `--feature`(피처 행), `--loading`(스켈레톤), `--app`(앱 아이콘 썸네일)
- **아이콘 모디파이어**: `.icon--velog` `--github` `--brunch` `--melon` `--soundcloud` `--app` `--game` `--instagram` `--instagram2` `--naver`
- **상태 클래스**: `is-` 접두사 → `is-active`, `is-hidden`, `is-open`, `is-visible`, `is-closing`
- **JS 후크**: `js-` 접두사 → `js-open-profile`, `js-theme-toggle` (스타일 적용 금지, JS 전용 셀렉터)

---

## 4. 레이아웃

전체 페이지는 **단일 컬럼 링크트리**다. 모든 콘텐츠가 `.link-card` 한 종류의 셸을 공유하며,
카드는 `.links` 안에 세로로만 쌓인다. 카드끼리 가로로 나란히 놓지 않는다.

- **Flexbox**: 1차원 레이아웃 (프로필, 네비, 카드 헤더, 푸터)
- **Grid**: 카드 내부 프리뷰 아이템 (`repeat(3,1fr)`, 피처 행만 `1fr`)
- **max-width**: `.page-wrapper` 기본 `680px` → `@media (min-width:900px)`에서 `760px`
- **간격**: `gap` 속성만 사용 (margin 간격 조절 지양)

### 링크트리 토큰

카드의 여백·아이콘 크기는 전부 `:root` 토큰으로 제어한다. 컴포넌트에 px를 직접 쓰지 않는다.

| 토큰 | 데스크톱 | 모바일(≤520px) | 용도 |
|---|---|---|---|
| `--card-gap` | 14px | 12px | 카드 사이 세로 간격 |
| `--card-pad-x` | 24px | 18px | 헤더/아이템 좌우 패딩 |
| `--card-pad-y` | 20px | 16px | 헤더 상하 패딩 |
| `--card-items-gap` | 10px | 8px | 프리뷰 썸네일 사이 간격 |
| `--card-icon` | 44px | 40px | 아이콘 정사각 크기 |
| `--card-icon-radius` | 12px | 10px | 아이콘 라운드 |
| `--stack-gap` | 40px | 28px | 섹션 사이 세로 간격 |

모바일 대응은 **`:root` 재정의 한 블록**으로 끝낸다. 컴포넌트마다 520px 오버라이드를 새로 쓰지 않는다.

### 카드 3티어

| 티어 | 구성 | 적용 |
|---|---|---|
| A. 프리뷰 행 | `__header` + `__divider` + `__items`(정사각 썸네일 3개) | Velog, GitHub, Brunch, Melon, SoundCloud, App Store |
| B. 피처 행 | 위와 같되 `.link-card--feature` (16:10 커버 1개) | Game |
| C. 단독 행 | `__header`만 | Instagram, 지식산책, 네이버 |

`__header`는 세 티어 모두 `[아이콘] [제목/설명] [→]`로 동일하다.
새 링크를 추가할 때는 셋 중 하나를 고르는 것이지, 새 컴포넌트를 만드는 것이 아니다.

---

## 5. 호버 & 트랜지션

```css
/* 기본 */ transition: var(--transition);
/* 버튼 */ transition: background 0.25s, border-color 0.25s, color 0.25s, box-shadow 0.25s;
```

| 대상 | 호버 효과 |
|---|---|
| 카드 | `translateY(-2px)` + `box-shadow: 0 8px 40px rgba(0,0,0,0.35)` + 보더/배경 변경 |
| 아이콘 | `scale(1.06~1.08)` |
| 화살표 | `translateX(4px)` + `color: var(--brand)` |
| 푸터 링크 | `translateY(-2px)` + `color: var(--brand)` |

카드별 개성은 **호버 글로우 색**으로만 낸다. 크기·간격·이징은 전부 동일하게 유지한다.

```css
.link-card {
  &:has(.icon--velog):hover { box-shadow: 0 6px 24px var(--glow-velog); }
  /* 새 플랫폼을 추가하면 :root에 --glow-* 를 선언하고 이 목록에 한 줄 추가 */
}
```

---

## 5-1. 이미지 — `width`/`height` 속성과 `aspect-ratio`는 짝으로 쓴다

`<img>`에 `width`/`height` 속성을 붙이면 (CLS 방지용으로 붙여야 한다) 그 값이
**presentational hint로 `height` 속성에 반영**된다. CSS가 `height`를 명시하지 않으면
`aspect-ratio`는 무시되고 이미지가 원본 비율의 픽셀 높이로 늘어난다.

```css
.thumb {
  width: 100%;
  height: auto;        /* ← 이게 없으면 아래 aspect-ratio가 무력화된다 */
  aspect-ratio: 1;
}
```

실제로 이걸 빠뜨려 모달 사진이 352×838px로 늘어났고, 모달이 1120px가 되면서
닫기 버튼이 화면 밖(y = -75px)으로 밀려나 클릭 불가가 된 적이 있다.

**규칙: `<img>`에 치수 속성을 추가하면, 그 이미지를 그리는 CSS에 `height: auto`가 있는지 반드시 확인한다.**

---

## 6. 글래스모피즘

```css
/* 카드 */
backdrop-filter: blur(14px) saturate(1.1);
-webkit-backdrop-filter: blur(14px) saturate(1.1);

/* 모달 (더 강하게) */
backdrop-filter: blur(24px) saturate(1.2);
-webkit-backdrop-filter: blur(24px) saturate(1.2);
```

`-webkit-` 접두사를 **항상** 함께 작성한다.

---

## 7. 애니메이션

- **입장**: `opacity:0` + `.is-visible` 토글 (JS `initScrollReveal`) + `nth-child` 순차 딜레이
- **스켈레톤**: `shimmer-sweep`(2s) + `pulse-glow`(2.2s)
- 새 `@keyframes`는 그 애니메이션을 쓰는 컴포넌트 블록 바로 아래에 배치한다 (파일 곳곳에 분산되어 있음)

`initScrollReveal`과 `applyFilter`가 공유하는 대상 셀렉터는 `main.js`의 `REVEAL_SELECTOR` 상수 하나다.
등장 애니메이션을 받을 새 컴포넌트를 만들면 **그 상수에 추가**해야 한다.

---

## 8. 반응형

- `@media (max-width: 520px)` — **모바일 기준 브레이크포인트**
  - 맨 위 `:root` 블록에서 `--card-*` / `--stack-gap` 토큰을 재정의한다 (컴포넌트별 오버라이드 대신)
  - 프로필 축소, 모달 `max-width: 92vw`
- `@media (min-width: 521px)` — 카테고리 탭바가 6개를 한 줄에 담도록 컬럼 폭을 넘어 확장
- `@media (min-width: 900px)` — 데스크톱: 히어로 높이, `.page-wrapper` 760px
- `@media (prefers-reduced-motion: reduce)` — 접근성
  - `*` 규칙으로 모든 애니메이션/트랜지션을 사실상 0으로 만든 뒤, 개별 컴포넌트의 `opacity`/`transform` 잔상을 정리

새 컴포넌트는 **520px와 reduced-motion 두 가지는 반드시** 대응해야 한다.
토큰만 써서 만들었다면 520px 대응은 자동으로 끝난다.

---

## 9. 금지 사항

- `!important` 사용 금지 (접근성 미디어쿼리 예외)
- HTML `style=""` 인라인 스타일 추가 금지 (기존 인라인은 유지)
- SCSS/Sass/Less 문법 금지 (`$변수`, `@mixin`, `@include`, `@extend`)
- 기존 `:root` CSS 변수 삭제/값 변경 금지 (추가는 허용)
