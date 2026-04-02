# 대대적 비주얼 개선 (Visual Overhaul)

## 개요
포트폴리오 사이트의 시각적 품질을 대폭 향상시키는 10가지 개선을 일괄 적용한다. 모달 오픈/닫기 애니메이션 리뉴얼, 배경 그라디언트 애니메이션, 카드 그라디언트 보더, 플랫폼별 글로우, 마그네틱 버튼, 프로필 부유 효과 등을 추가하고, DOMContentLoaded 안정성을 높이며, 모든 새 애니메이션에 prefers-reduced-motion 대응을 적용한다.

## 변경 범위

### index.html 변경사항
- **변경 없음**. 모든 개선은 CSS와 JS만으로 구현한다. 기존 HTML 구조, 클래스명, ID를 그대로 활용한다.

### assets/css/style.css 변경사항

#### 새 CSS 변수 (`:root` 블록 하단에 추가)
```css
--spring-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
--glow-velog: rgba(32, 201, 151, 0.35);
--glow-brunch: rgba(100, 100, 100, 0.25);
--glow-github: rgba(236, 236, 236, 0.3);
--glow-melon: rgba(0, 205, 60, 0.35);
--glow-soundcloud: rgba(255, 85, 0, 0.35);
```

라이트 테마(`html.light`)에도 동일 변수를 약간 낮은 불투명도로 오버라이드한다.

#### 기능 1: 타이핑 효과 CSS 수정
- `.profile__bio-attr .typing`에 `display: inline-block; min-width: 1ch;` 추가하여 빈 상태에서도 커서 옆 공간 확보

#### 기능 2: 모달 리뉴얼

**A. 스프링 오픈 애니메이션**
- `.modal-box`의 초기 transform을 `scale(0.92) translateY(24px)`으로 변경
- `.modal-backdrop.is-open .modal-box`의 transition-timing-function을 `var(--spring-bounce)`로 변경
- transition duration을 `0.5s`로 변경

**B. 내부 콘텐츠 시차 진입 (순수 CSS)**
- `.modal-backdrop.is-open` 하위 셀렉터에 transition-delay를 순차적으로 적용:
  - `.modal-photo-wrap`: `opacity 0→1`, delay `0s`
  - `.modal-name`: `opacity 0→1, translateY(12px)→0`, delay `0.08s`
  - `.modal-eng`: 같은 패턴, delay `0.16s`
  - `.modal-divider`: `scaleX(0)→scaleX(1)`, delay `0.24s`
  - `.modal-info li`: `opacity 0→1, translateY(8px)→0`, delay `0.32s + nth-child * 0.06s`
- 기본 상태(is-open 아닐 때)에서 위 요소들은 `opacity: 0; transform: ...`으로 숨김

**C. 백드롭 강화**
- `.modal-overlay`의 `backdrop-filter: blur(6px)` → `blur(12px)`로 변경
- `.modal-overlay`에 `&::after` pseudo-element 추가: `radial-gradient(circle at center, var(--brand-20) 0%, transparent 70%)`로 브랜드 글로우

**D. 닫기 애니메이션**
- `.modal-backdrop.is-closing .modal-box`에 별도 exit transition 정의:
  - `transform: scale(0.95) translateY(12px); opacity: 0;`
  - `transition-timing-function: ease-in; transition-duration: 0.25s;`
- `.modal-backdrop.is-closing .modal-overlay`에도 `opacity: 0; transition: opacity 0.25s ease-in;` 적용

#### 기능 3: 배경 그라디언트 애니메이션
- `.hero-bg`에 추가:
  ```css
  background-size: 400% 400%;
  animation: gradient-shift 15s ease infinite;
  ```
- 새 `@keyframes gradient-shift`:
  ```css
  @keyframes gradient-shift {
    0%, 100% { background-position: 0% 50%; }
    25%      { background-position: 100% 0%; }
    50%      { background-position: 100% 100%; }
    75%      { background-position: 0% 100%; }
  }
  ```
- `html.light .hero-bg`에도 동일 적용
- `@media (prefers-reduced-motion: reduce)`에서 `.hero-bg { animation: none; }` 추가

#### 기능 4: 프로필 아바타 부유 애니메이션
- 새 `@keyframes float-gentle`:
  ```css
  @keyframes float-gentle {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(-6px); }
  }
  ```
- `.profile__avatar-wrap`에 `animation: float-gentle 6s ease-in-out infinite;` 추가
- `@media (prefers-reduced-motion: reduce)`에 `.profile__avatar-wrap { animation: none; }` 추가

#### 기능 5: 카드 그라디언트 보더 (호버 시)
- `@property --angle` 등록 (CSS Houdini):
  ```css
  @property --angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
  }
  ```
- 새 `@keyframes rotate-angle`:
  ```css
  @keyframes rotate-angle {
    to { --angle: 360deg; }
  }
  ```
- `.link-card::before` 추가:
  ```css
  .link-card::before {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: var(--radius);
    background: conic-gradient(from var(--angle), var(--brand), var(--brand-25), var(--brand));
    z-index: -1;
    opacity: 0;
    transition: opacity 0.4s ease;
    animation: rotate-angle 4s linear infinite;
  }
  ```
- `.link-card:hover::before { opacity: 1; }`
- 카드 내부 요소(`.link-card__header`, `.link-card__divider`, `.link-card__items`)에 `position: relative; z-index: 1;` 부여
- `@media (prefers-reduced-motion: reduce)`에 `.link-card::before { animation: none; opacity: 0; }` 추가

#### 기능 6: 플랫폼별 카드 글로우
- `:has()` 셀렉터로 카드 아이콘에 따라 호버 시 box-shadow 적용:
  ```css
  .link-card:has(.icon--velog):hover { box-shadow: 0 8px 40px var(--glow-velog); }
  .link-card:has(.icon--brunch):hover { box-shadow: 0 8px 40px var(--glow-brunch); }
  .link-card:has(.icon--github):hover { box-shadow: 0 8px 40px var(--glow-github); }
  .link-card:has(.icon--melon):hover { box-shadow: 0 8px 40px var(--glow-melon); }
  .link-card:has(.icon--soundcloud):hover { box-shadow: 0 8px 40px var(--glow-soundcloud); }
  ```

#### 기능 7: 섹션 라벨 와이프 리빌
- `.section-label`의 기존 애니메이션에 clip-path 추가:
  - 기본 상태: `clip-path: inset(0 100% 0 0);`
  - `.section-label.is-visible`: `clip-path: inset(0 0 0 0);`
  - transition에 `clip-path 0.6s ease-out` 추가

#### 기능 8: 카드 진입 애니메이션 다양화
- odd/even 카드에 미세 회전 추가:
  ```css
  .link-card:nth-child(odd).is-visible { transform: rotate(0.5deg) translateY(0); }
  .link-card:nth-child(even).is-visible { transform: rotate(-0.5deg) translateY(0); }
  ```
- 호버 시 `rotate(0deg)`로 복귀
- 시차 딜레이 확대: 0s / 0.12s / 0.24s

#### 기능 9: 마그네틱 버튼 (CSS 부분)
- `.profile__btn`, `.category-nav__btn`의 transition에 `transform 0.25s var(--spring-bounce)` 추가

#### 기능 10: 푸터 아이콘 호버 강화
- `.footer__social a:hover` 수정:
  ```css
  color: var(--brand);
  transform: scale(1.15) translateY(-3px);
  filter: drop-shadow(0 4px 8px var(--brand-25));
  ```
- transition에 `filter var(--transition)` 추가

#### 접근성 (@media (prefers-reduced-motion: reduce))
기존 블록에 추가:
```css
.hero-bg { animation: none; }
.profile__avatar-wrap { animation: none; }
.link-card::before { animation: none; opacity: 0; }
.section-label { clip-path: none; }
```

### assets/js/main.js 변경사항

#### 기능 1: DOMContentLoaded 안정화
- `safeInit` 헬퍼로 각 init 함수를 독립 try-catch로 감싸기:
  ```js
  const safeInit = (fn, name) => {
    try { fn(); } catch (e) { console.warn(`[${name}] init failed:`, e); }
  };
  ```

#### 기능 2D: 모달 닫기 애니메이션
- `close` 함수에 `is-closing` 클래스 추가 → `transitionend` 후 제거
- 500ms fallback timeout

#### 기능 9: 마그네틱 버튼 효과
- 새 함수 `initMagneticButtons()`:
  - `(hover: none)` + `(prefers-reduced-motion: reduce)` 체크
  - `.profile__btn`, `.category-nav__btn`에 mousemove → translate(x*0.3, y*0.3)
  - mouseleave → transform 초기화 (CSS transition이 스프링 복귀 담당)

## 주의사항

### 기존 기능과 충돌 가능성
1. `.link-card`의 `overflow: hidden`: `::before`가 `z-index: -1`이므로 내부 요소에 `z-index: 1` 필요
2. 카드 틸트와 마그네틱: 대상이 다르므로 충돌 없음
3. 모달 닫기: `transitionend` + fallback timeout으로 안전하게 처리

### 삭제/수정 대상
1. `.modal-box` transform/transition 값 변경
2. `.modal-overlay` blur 값 변경
3. `.footer__social a:hover` transform/transition 수정
4. `.link-card` nth-child transition-delay 값 변경
5. `initModal()` close 함수 리팩터
