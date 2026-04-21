# Category Nav Remodel — Icon + Label Segment Bar (glassmorphism pill tab)

## 개요
현재 `.category-nav` 버튼이 폰트 12px · 패딩 7×18px로 시각적 무게가 너무 작고, 아이콘/활성 인디케이터 없이 평범한 pill 배열에 머물러 있다. 본 작업은 구조와 기능은 그대로 유지한 채 **아이콘+라벨 세그먼트 바**로 완전히 리모델링하여, glassmorphism 트랙 위에서 슬라이딩 pill이 탭 사이를 이동하는 사이트 정체성 톤의 포커스 있는 네비게이션으로 격상한다.

## 변경 유형
**디자인** (기능 변경 없음 — 필터링 동작/클래스/DOM 의미는 100% 보존)

## 디자인 언어 & 의도
glassmorphism 트랙 위를 코럴핑크 pill 인디케이터가 `--spring-bounce`로 탄성있게 미끄러지는, **"살아있는 세그먼트 바"**를 만든다. 아이콘이 각 카테고리의 성격(학습/음악/사람/놀이)을 1초 안에 읽히게 하고, 확대된 타이포·여백이 이 네비게이션을 사이트의 중심 앵커 UI로 끌어올린다. 모바일에서는 가로 스크롤 세그먼트로 자연스럽게 전환되어 같은 언어를 유지한다.

## Sprint 범위 계약
- **허용 (수정 가능 영역)**:
  - `index.html`의 `<nav id="categoryNav">` 및 그 내부 `<button>` 5개 (내부 구조 재작성)
  - `assets/css/style.css`의 `.category-nav` 및 그 중첩 규칙 (691~727 라인) 전면 재작성
  - `.category-nav` 전용 모바일/reduced-motion 미디어 쿼리 추가
  - `assets/js/main.js`의 `initCategoryFilter` 함수에 **슬라이딩 인디케이터 위치 갱신 로직만** 추가, 신규 resize 리스너 필요 시 추가
- **금지 (건드리지 말 것)**:
  - `:root` / `html.light` 의 기존 CSS 변수 정의 (추가는 허용, 변경/삭제 금지)
  - `.category-section`, `.category-header`, `.category-title`, 카드/쇼케이스 등 다른 섹션 스타일
  - `initCategoryFilter`의 필터 로직, 리플 이펙트, 페이드 전환 로직
  - `cover-band` IIFE (771 라인 주변)의 `categoryNav` 참조 방식 — 기존 `.category-nav__btn.is-active` 선택자와 `[data-filter="all"]` 선택자가 그대로 동작해야 함
- **판단 기준**: "이 변경이 없으면 슬라이딩 인디케이터/아이콘 세그먼트 바가 제대로 동작하지 않는가?" → YES면 허용, NO면 금지

## 변경 범위

### index.html 변경사항 (154~160 라인)

기존 5개 버튼을 **아이콘+라벨 내부 구조**로 재작성하고, 인디케이터 요소를 DOM에 추가한다.

```html
<nav class="category-nav" id="categoryNav" role="tablist" aria-label="카테고리 필터">
  <span class="category-nav__indicator" aria-hidden="true"></span>
  <button class="category-nav__btn is-active" data-filter="all" type="button" role="tab" aria-selected="true">
    <svg class="category-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
    <span class="category-nav__label">All</span>
  </button>
  <button class="category-nav__btn" data-filter="writing" type="button" role="tab" aria-selected="false">
    <svg class="category-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M4 19.5V5a2 2 0 0 1 2-2h11l4 4v12.5a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 19.5Z"/>
      <path d="M8 8h6M8 12h8M8 16h5"/>
    </svg>
    <span class="category-nav__label">Study &amp; Writing &amp; Dev</span>
  </button>
  <button class="category-nav__btn" data-filter="music" type="button" role="tab" aria-selected="false">
    <svg class="category-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M9 18V5l11-2v13"/>
      <circle cx="6" cy="18" r="3"/>
      <circle cx="17" cy="16" r="3"/>
    </svg>
    <span class="category-nav__label">Music</span>
  </button>
  <button class="category-nav__btn" data-filter="social" type="button" role="tab" aria-selected="false">
    <svg class="category-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="9" cy="8" r="3.5"/>
      <path d="M2.5 20c.7-3.3 3.4-5.5 6.5-5.5s5.8 2.2 6.5 5.5"/>
      <circle cx="17" cy="7" r="2.5"/>
      <path d="M15 13.5c2.5 0 4.5 1.6 5 4"/>
    </svg>
    <span class="category-nav__label">Social</span>
  </button>
  <button class="category-nav__btn" data-filter="game" type="button" role="tab" aria-selected="false">
    <svg class="category-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M6 9h4M8 7v4M15 10h.01M18 8h.01"/>
      <rect x="2.5" y="6" width="19" height="12" rx="4"/>
    </svg>
    <span class="category-nav__label">Game</span>
  </button>
</nav>
```

주요 변경 요점:
- `role="tablist"` + 각 버튼 `role="tab"` + `aria-selected` (→ 접근성 정책: tablist 선택)
- 선두에 `<span class="category-nav__indicator">` 추가 — 슬라이딩 배경 전용 absolute 요소
- 각 버튼 내부: inline SVG 18×18(view 24 24, stroke-based, `currentColor`) + `<span class="category-nav__label">`

### assets/css/style.css 변경사항 (691~727 라인 전면 재작성)

**새로 추가할 CSS 변수는 없다.** 기존 `--brand-*`, `--border`, `--border-hover`, `--bg-card`, `--text`, `--text-muted`, `--radius`, `--transition`, `--spring-bounce` 만 사용.

#### 수치/토큰 매핑 표

| 영역 | 속성 | 값 |
|---|---|---|
| `.category-nav` (트랙) | display | `inline-flex` (중앙정렬 `margin: 0 auto`, 래퍼 flex) |
| | position | `relative` |
| | padding | `6px` |
| | gap | `4px` |
| | background | `var(--bg-card)` |
| | border | `1px solid var(--border)` |
| | border-radius | `999px` |
| | backdrop-filter | `blur(14px) saturate(1.1)` (+ `-webkit-`) |
| | box-shadow | `0 8px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.04)` |
| | margin-bottom | `32px` |
| `.category-nav__indicator` | position | `absolute` |
| | top / left | `6px` / `0` |
| | height | `calc(100% - 12px)` |
| | width | `0` (JS 설정) |
| | background | `linear-gradient(135deg, var(--brand-25), var(--brand-14))` |
| | border | `1px solid var(--brand-40)` |
| | border-radius | `999px` |
| | box-shadow | `0 4px 14px var(--brand-20), inset 0 0 0 1px var(--brand-12)` |
| | transition | `transform 0.45s var(--spring-bounce), width 0.45s var(--spring-bounce)` |
| | pointer-events | `none` |
| | z-index | `0` |
| | opacity | `0` → `.is-ready` 시 `1` |
| `.category-nav__btn` | position | `relative` |
| | z-index | `1` |
| | display | `inline-flex` |
| | align-items | `center` |
| | gap | `8px` |
| | padding | `12px 22px` |
| | border | `none` |
| | border-radius | `999px` |
| | background | `transparent` |
| | color | `var(--text-muted)` |
| | font-family | `var(--font)` |
| | font-size | `14px` |
| | font-weight | `600` |
| | letter-spacing | `0.1px` |
| | white-space | `nowrap` |
| | cursor | `pointer` |
| | transition | `color 0.3s ease, transform 0.3s var(--spring-bounce)` |
| `&:hover` | color | `var(--text)` |
| | transform | `translateY(-1px)` |
| `&:hover .category-nav__icon` | filter | `drop-shadow(0 0 6px var(--brand-25))` |
| `&:focus-visible` | outline | `2px solid var(--brand-40)` |
| | outline-offset | `3px` |
| `&.is-active` | color | `var(--brand-light)` |
| `&.is-active .category-nav__icon` | stroke-width | `2.2` |
| `.category-nav__icon` | width / height | `18px` / `18px` |
| | flex-shrink | `0` |
| | transition | `filter 0.3s ease, stroke-width 0.3s ease` |
| `.category-nav__label` | display | `inline` |

#### 모바일 `@media (max-width: 520px)`

```
.category-nav {
  display: flex;
  justify-content: flex-start;
  max-width: 100%;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 5px;
  &::-webkit-scrollbar { display: none; }

  & .category-nav__btn {
    padding: 10px 16px;
    font-size: 12px;
    scroll-snap-align: center;
    flex-shrink: 0;
  }
  & .category-nav__icon { width: 16px; height: 16px; }
  & .category-nav__indicator { top: 5px; height: calc(100% - 10px); }
}
```

#### Reduced motion

```
@media (prefers-reduced-motion: reduce) {
  .category-nav__indicator { transition: none; }
  .category-nav__btn { transition: color 0.2s linear; }
  .category-nav__btn:hover { transform: none; }
}
```

#### 라이트 테마
별도 override 불필요. 모든 색이 `--brand-*` / `--bg-card` / `--border` 토큰을 통하므로 자동 대응. box-shadow의 `rgba(0,0,0,0.12)`가 라이트에서 과하면 `0 6px 18px rgba(0,0,0,0.06)`로 조정 가능.

### assets/js/main.js 변경사항

기존 `initCategoryFilter` 함수(440~490)에 **인디케이터 위치 갱신 로직만 추가**한다.

#### 추가 로직

1. 상단에 `const indicator = nav.querySelector('.category-nav__indicator');`
2. 헬퍼 `updateIndicator()`:
   - active 버튼의 `offsetLeft`/`offsetWidth` 측정
   - `indicator.style.transform = 'translateX(' + x + 'px)'`, `width` 설정
   - `nav.classList.add('is-ready')`
3. 기존 `btn.addEventListener('click', ...)` 내부, `btn.classList.add('is-active')` 직후:
   - `btns.forEach(b => b.setAttribute('aria-selected', b === btn ? 'true' : 'false'))`
   - `updateIndicator()`
4. 함수 끝:
   - `requestAnimationFrame(updateIndicator)`
   - `window.addEventListener('load', updateIndicator)`
   - `window.addEventListener('resize', updateIndicator)`
5. cover-band IIFE는 `allBtn.click()` 경로로 핸들러를 거치므로 자동 반영.

#### 의사코드

```js
function initCategoryFilter() {
  const nav = document.getElementById('categoryNav');
  if (!nav) return;
  const btns = nav.querySelectorAll('.category-nav__btn');
  const sections = document.querySelectorAll('.category-section');
  const indicator = nav.querySelector('.category-nav__indicator');

  function updateIndicator() {
    if (!indicator) return;
    const active = nav.querySelector('.category-nav__btn.is-active');
    if (!active) return;
    indicator.style.width = active.offsetWidth + 'px';
    indicator.style.transform = 'translateX(' + active.offsetLeft + 'px)';
    nav.classList.add('is-ready');
  }

  btns.forEach(btn => {
    if (btn.tagName === 'A') return;
    btn.addEventListener('click', (e) => {
      // 기존 리플 유지
      btns.forEach(b => {
        b.classList.remove('is-active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');
      updateIndicator();
      // 기존 페이드 전환 / applyFilter 유지
    });
  });

  requestAnimationFrame(updateIndicator);
  window.addEventListener('load', updateIndicator);
  window.addEventListener('resize', updateIndicator);
}
```

## 기능 상세

### 기능 1: glassmorphism 세그먼트 트랙
- `.category-nav` 자체가 blur+border+shadow 캡슐

### 기능 2: 아이콘 + 라벨 버튼
- 각 버튼 inline SVG 18px + 14px 라벨

### 기능 3: 슬라이딩 인디케이터
- 활성 버튼을 따라 `translateX`+`width`로 `--spring-bounce` 이징 이동

### 기능 4: 호버 glow + 포커스 가시성
- 아이콘 brand drop-shadow, 버튼 1px translateY
- `:focus-visible` 2px outline

### 기능 5: 모바일 가로 스크롤 세그먼트
- 520px 이하 `overflow-x: auto` + scroll-snap + 스크롤바 숨김

## 접근성 결정
**`role="tablist"` + 각 버튼 `role="tab"` + `aria-selected` 패턴.** (aria-pressed 아님)

## 주의사항
- 기존 기능 100% 보존: `data-filter`, `is-active`, `#categoryNav`, 리플, 페이드 전환
- cover-band IIFE 선택자 호환 유지
- 인디케이터 초기 측정: `rAF` + `load` 이벤트 이중 호출
- 리플 충돌 방지: 인디케이터 `pointer-events:none`, `z-index:0`, 버튼 `z-index:1`
- reduced-motion 지원

## 검수 체크리스트

### 디자인 품질
- [ ] 인디케이터가 활성 탭 뒤 정확히 정렬
- [ ] 탭 클릭 시 `--spring-bounce`로 미끄러짐
- [ ] 호버 drop-shadow 미묘함
- [ ] 다크/라이트 테마 모두 자연스러움
- [ ] 폰트 14px · 패딩 12×22px 적용

### 독창성
- [ ] 트랙 + 슬라이딩 인디케이터 세그먼트 바 구현
- [ ] 5개 고유 SVG 아이콘

### 패턴 일관성
- [ ] CSS 변수 사용
- [ ] BEM (`__indicator`, `__icon`, `__label`)
- [ ] 네이티브 `&` 중첩

### 반응형 & 접근성
- [ ] 520px 이하 가로 스크롤 + 바 숨김
- [ ] `prefers-reduced-motion` 대응
- [ ] `:focus-visible` 링
- [ ] `role="tablist"`/`tab`/`aria-selected` 동적 갱신

### 기능 보전
- [ ] 필터 5개 동작
- [ ] 리플 보임
- [ ] 페이드 전환 동작
- [ ] cover-band → `allBtn.click()` 경로에서 인디케이터 이동
- [ ] 리사이즈 재정렬
- [ ] `safeInit(initCategoryFilter, ...)` 유지
