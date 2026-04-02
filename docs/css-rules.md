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

  &--variant { background: var(--bg-card); }
  &.is-active { border-color: var(--brand-40); }
  &::after { content: ''; position: absolute; }
}

/* 금지 */
.block {
  .child { }           /* & 없이 중첩 */
  $color: red;          /* SCSS 변수 */
  @include mixin();     /* SCSS mixin */
}
```

---

## 2. 색상 체계 — CSS Custom Properties

모든 색상은 `:root` 변수를 사용한다. 하드코딩 금지.
새 색상이 필요하면 `:root` 블록 하단에 변수를 추가한다.

**배경:**
`--bg: #0f0e15` · `--bg-dark: #09080f` · `--bg-card: rgba(23,21,30,0.82)` · `--bg-card-hover: rgba(30,28,40,0.9)`

**브랜드 (코럴 핑크):**
`--brand: #ff7b7b` · `--brand-light: #ff9b9b`
투명도 변형: `--brand-04`(0.04) ~ `--brand-60`(0.60) — 총 10단계

**텍스트:**
`--text: #eee` · `--text-muted: #aaa` · `--text-dim: #555`

**보더:**
`--border: rgba(255,255,255,0.07)` · `--border-hover: rgba(255,255,255,0.14)`

**공용 토큰:**
`--radius: 16px` · `--radius-sm: 10px` · `--font: 'Inter', 'Noto Sans KR', ...` · `--transition: 0.38s cubic-bezier(0.25,0.46,0.45,0.94)`

**플랫폼 아이콘 색상:**
SoundCloud(`#ff5500→#ff7700`) · Instagram(`#833AB4→#E1306C→#F77737`) · Instagram2(`#405DE6→#5851DB→#833AB4`) · Melon(`#00cd3c→#00a832`) · Brunch(`#111`/`#ddd`) · Velog(`#20c997→#12b886`) · GitHub(`#ececec`/`#0a0a0a`) · Naver(`#03C75A`)

---

## 3. 클래스 네이밍 — BEM

```
block__element--modifier
```

- **Block**: `.link-card`, `.social-card`, `.profile`, `.modal-backdrop`, `.category-nav`, `.footer`
- **Element**: `__header`, `__icon`, `__title`, `__desc`, `__arrow`, `__thumb`, `__label`, `__info`, `__divider`, `__items`
- **Modifier**: `--loading`, `--section`, `--instagram`, `--naver`
- **상태 클래스**: `is-` 접두사 → `is-active`, `is-hidden`, `is-open`
- **JS 후크**: `js-` 접두사 → `js-open-profile` (스타일 적용 금지, JS 전용 셀렉터)

---

## 4. 레이아웃

- **Flexbox**: 1차원 레이아웃 (프로필, 네비, 카드 헤더, 푸터)
- **Grid**: 다열 레이아웃 (`repeat(3,1fr)` — 카드 아이템, 소셜 그리드)
- **max-width**: `680px` (`.page-wrapper`)
- **간격**: `gap` 속성만 사용 (margin 간격 조절 지양)

---

## 5. 호버 & 트랜지션

```css
/* 기본 */ transition: var(--transition);
/* 버튼 */ transition: background 0.25s, border-color 0.25s, color 0.25s, box-shadow 0.25s;
```

| 대상 | 호버 효과 |
|---|---|
| 카드 | `translateY(-2px)` + `box-shadow: 0 8px 40px rgba(0,0,0,0.35)` + 보더/배경 변경 |
| 소셜카드 | `translateY(-3px)` + `box-shadow: 0 10px 40px rgba(0,0,0,0.4)` |
| 아이콘 | `scale(1.06~1.08)` |
| 화살표 | `translateX(4px)` + `color: var(--brand)` |
| 푸터 링크 | `translateY(-2px)` + `color: var(--brand)` |

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

- **입장**: `opacity:0` + `animation: fadeInUp 0.45s ease-out forwards` + `nth-child` 순차 딜레이 (~0.06s 간격)
- **스켈레톤**: `shimmer-sweep`(2s) + `pulse-glow`(2.2s)
- 새 `@keyframes`는 기존 블록 근처(483~491줄 부근)에 배치

---

## 8. 반응형

- `@media (max-width: 520px)` — **단일 브레이크포인트**
  - 소셜 그리드: 3열 → 1열 (수평 레이아웃)
  - 프로필 축소 (이름 34px, 아바타 96px)
  - 카드 패딩/간격 축소, 모달 `max-width: 92vw`
- `@media (prefers-reduced-motion: reduce)` — 접근성
  - 모든 애니메이션/트랜지션 비활성화

새 컴포넌트는 **두 미디어쿼리 모두** 대응해야 한다.

---

## 9. 금지 사항

- `!important` 사용 금지 (접근성 미디어쿼리 예외)
- HTML `style=""` 인라인 스타일 추가 금지 (기존 인라인은 유지)
- SCSS/Sass/Less 문법 금지 (`$변수`, `@mixin`, `@include`, `@extend`)
- 기존 `:root` CSS 변수 삭제/값 변경 금지 (추가는 허용)
