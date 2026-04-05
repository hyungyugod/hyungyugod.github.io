# SPEC.md — 히어로/프로필 섹션 100vh 풀스크린 리모델링

## 개요
현재 `.page-wrapper` 내부에 `max-width: 680px`로 제한된 정적 프로필 카드를 100vh 풀스크린 히어로 섹션으로 분리·확장한다. 화면 가득 채운 첫 인상을 만들되, 스크롤 아래에는 기존 링크트리 구조를 그대로 유지한다. 프로필 콘텐츠의 타이포를 스케일업하고, 스태거 입장 애니메이션 + 스크롤 패럴랙스 페이드아웃 + 스크롤 힌트 화살표를 추가하여 다이나믹한 랜딩 경험을 제공한다.

## 변경 유형
디자인

## 디자인 언어 & 의도
사이트 첫 방문 시 화면 전체를 지배하는 히어로가 "이 사람은 뭔가 다르다"는 인상을 순간적으로 각인시킨다. glassmorphism 카드들이 어둑한 그라디언트 배경 위로 하나씩 부드럽게 등장하며, 스크롤하면 히어로가 자연스럽게 사라지고 콘텐츠 세계로 넘어가는 전환이 "탐색하고 싶다"는 욕구를 유발한다. 기존 코럴핑크 팔레트와 글래스모피즘 언어를 유지하면서 스케일만 극적으로 확장하는 것이 핵심이다.

## Sprint 범위 계약
- **허용**: SPEC 기능의 정상 동작에 필수적인 최소 연동 변경 (예: `.profile`이 `.page-wrapper` 밖으로 나가면서 필요한 기존 스타일 조정)
- **금지**: SPEC에 없는 독립적인 새 기능/효과 추가 (예: 링크 카드 영역 리디자인, 새 섹션 추가, 소셜 카드 효과 변경, 색상 팔레트 변경, 폰트 변경)
- **판단 기준**: "이 변경이 없으면 SPEC 기능이 제대로 동작하지 않는가?" → YES면 허용, NO면 금지
- **:root CSS 변수**: 기존 변수의 값 변경/삭제 금지. 새 변수 추가만 허용.

---

## 변경 범위

### index.html 변경사항

1. **`.profile` 섹션을 `.page-wrapper` 밖으로 이동하고 `<section class="hero" id="hero">`로 감싸기**
   - 현재 구조 (line 40~73):
     ```
     .page-wrapper > .theme-toggle + .profile + .category-nav + ...
     ```
   - 변경 구조:
     ```
     body
       > .scroll-progress
       > .hero-bg
       > section.hero#hero
       >   button.theme-toggle.js-theme-toggle  (여기로 이동)
       >   .profile  (기존 내부 구조 100% 보존)
       >   .hero__scroll-hint  (새 요소)
       > .page-wrapper
       >   nav.category-nav  (page-wrapper 첫 자식)
       >   ...나머지 그대로
     ```

2. **`.theme-toggle` 버튼**: `.page-wrapper` 안에서 `.hero` 안으로 이동 (CSS에서 `position: fixed`로 변경)

3. **스크롤 힌트 요소 추가** (`.hero` 마지막 자식):
   ```html
   <div class="hero__scroll-hint" aria-hidden="true">
     <span class="hero__scroll-arrow">
       <i class="fa-solid fa-chevron-down"></i>
     </span>
   </div>
   ```

4. **기존 `.profile` 내부 HTML 구조는 절대 변경하지 않음** — 모든 클래스명, ID, data 속성, JS 후크 100% 보존. `.profile__motto`, `.profile__bio`, `.profile__btn` 등 모든 자식 요소 유지.

### assets/css/style.css 변경사항

1. **새 CSS 변수 추가** (`:root` 블록에 추가, 기존 변수 수정 없음):
   ```css
   --hero-name-size: 80px;
   --hero-name-size-mobile: 52px;
   --hero-entrance-offset: 28px;
   --hero-entrance-duration: 0.7s;
   --hero-stagger: 0.12s;
   --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
   ```

2. **`.hero` 블록 (신규)**:
   ```css
   .hero {
     position: relative;
     z-index: 1;
     width: 100%;
     min-height: 100vh;
     display: flex;
     flex-direction: column;
     align-items: center;
     justify-content: center;
     padding: 80px 24px 48px;
   }
   ```

3. **`.hero-bg` 높이 변경**: `height: 45vh` → `height: 100vh`

4. **`.theme-toggle` position 변경**: `position: absolute` → `position: fixed`, `z-index: 50`

5. **`.profile` 스타일 수정**:
   - `animation: fadeInUp 0.55s ease-out` → 제거 (heroEntrance 스태거로 대체)
   - `margin-bottom: 100px` → `margin-bottom: 0`
   - `padding-top: 16px` → `padding-top: 0`

6. **타이포 스케일업**:
   - `.profile__name` `font-size`: 42px → `var(--hero-name-size)` (80px)
   - `.profile__subtitle` `font-size`: 11px → 14px, `letter-spacing`: 2.5px → 3px
   - `.profile__motto` `max-width`: 440px → 540px
   - `.profile__bio` `max-width`: 440px → 540px

7. **`@keyframes heroEntrance` (신규)**:
   ```css
   @keyframes heroEntrance {
     from { opacity: 0; transform: translateY(var(--hero-entrance-offset)); }
     to   { opacity: 1; transform: translateY(0); }
   }
   ```

8. **스태거 입장 애니메이션** — `.hero` 내부 각 `.profile` 자식에 적용:
   - `.hero .profile__avatar-wrap`: delay 0s, duration 0.7s
   - `.hero .profile__name`: delay 0.12s
   - `.hero .profile__subtitle`: delay 0.24s
   - `.hero .profile__motto`: delay 0.36s
   - `.hero .profile__bio`: delay 0.48s
   - `.hero .profile__btn`: delay 0.60s
   - 모두 `animation-fill-mode: both`, `animation-timing-function: var(--ease-out-expo)`

9. **스크롤 힌트 스타일 (신규)**:
   ```css
   .hero__scroll-hint {
     position: absolute;
     bottom: 32px;
     left: 50%;
     transform: translateX(-50%);
     z-index: 2;
     opacity: 0;
     animation: heroEntrance 0.7s var(--ease-out-expo) 1s forwards;
   }

   .hero__scroll-arrow {
     display: flex;
     align-items: center;
     justify-content: center;
     width: 36px;
     height: 36px;
     border-radius: 50%;
     border: 1px solid var(--brand-25);
     color: var(--brand-light);
     font-size: 14px;
     animation: heroBounce 2s ease-in-out infinite;
   }

   @keyframes heroBounce {
     0%, 100% { transform: translateY(0); opacity: 0.6; }
     50%      { transform: translateY(8px); opacity: 1; }
   }
   ```

10. **`.page-wrapper` 패딩 조정**: `padding: 80px 24px 80px` → `padding: 48px 24px 80px`

11. **반응형 `@media (max-width: 520px)` 추가**:
    ```css
    .hero { padding: 56px 16px 40px; }
    .hero .profile__name { font-size: var(--hero-name-size-mobile); }
    .hero .profile__subtitle { font-size: 12px; }
    .hero .profile__motto { max-width: 100%; }
    .hero .profile__bio { max-width: 100%; }
    .hero__scroll-hint { bottom: 24px; }
    .hero__scroll-arrow { width: 32px; height: 32px; font-size: 12px; }
    ```

12. **`@media (prefers-reduced-motion: reduce)` 추가**:
    ```css
    .hero .profile__avatar-wrap,
    .hero .profile__name,
    .hero .profile__subtitle,
    .hero .profile__motto,
    .hero .profile__bio,
    .hero .profile__btn { animation: none; opacity: 1; transform: none; }
    .hero__scroll-hint { animation: none; opacity: 1; }
    .hero__scroll-arrow { animation: none; opacity: 0.6; }
    ```

### assets/js/main.js 변경사항

1. **`initHeroParallax()` 함수 (신규)** — 스크롤 시 히어로 콘텐츠 페이드아웃 + 위로 밀림:
   ```javascript
   function initHeroParallax() {
     const hero = document.getElementById('hero');
     if (!hero) return;
     const profile = hero.querySelector('.profile');
     const scrollHint = hero.querySelector('.hero__scroll-hint');
     if (!profile) return;
     if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

     window.addEventListener('scroll', () => {
       const scrollY = window.scrollY;
       const heroH = hero.offsetHeight;
       const ratio = Math.min(scrollY / heroH, 1);

       profile.style.opacity = 1 - ratio * 1.5;
       profile.style.transform = `translateY(${-scrollY * 0.3}px)`;

       if (scrollHint) {
         scrollHint.style.opacity = Math.max(0, 1 - ratio * 3);
       }
     }, { passive: true });
   }
   ```

2. **DOMContentLoaded에 등록**:
   ```javascript
   safeInit(initHeroParallax, 'initHeroParallax');
   ```

---

## 기존 기능 영향 없음 확인

| 기능 | 영향 | 이유 |
|------|------|------|
| 타이핑 애니메이션 | 없음 | `#typingText` ID 유지 |
| 마우스 패럴랙스 | 없음 | `.hero-bg` 셀렉터 유지, window 기준 계산 |
| 프로필 모달 | 없음 | `.js-open-profile` 클래스 유지 |
| 스크롤 리빌 | 없음 | `.link-card` 등은 page-wrapper 내 유지 |
| 테마 토글 | 미미 | CSS position만 fixed로 변경, JS 로직 동일 |
| 카테고리 필터 | 없음 | `#categoryNav` page-wrapper 내 유지 |
| GitHub/Velog fetch | 없음 | `#github-items`, `#velog-items` 위치 무변경 |

## 주의사항
1. **`.profile` 내부 HTML은 절대 변경하지 말 것** — motto, bio, btn 등 모든 자식 요소 유지
2. **기존 `@keyframes fadeInUp`은 삭제하지 말 것** — 다른 곳에서 사용 가능
3. **:root 기존 변수 값 변경 금지** — 새 변수 추가만 허용
4. **색상 팔레트, 폰트, 브랜드 컬러 변경 금지** — 기존 디자인 언어 유지
5. **라이트 테마**: 새 요소들이 모두 CSS 변수 기반이므로 별도 오버라이드 불필요
