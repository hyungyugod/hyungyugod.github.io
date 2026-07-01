# Released Apps 카테고리 탭/섹션 추가

## 개요
링크 카드 영역에 "Released Apps"(출시한 앱) 새 카테고리 탭과 섹션을 추가하여, Apple App Store에 실제 출시된 iOS 앱 3개(PopPath · 김간호는 음악박사 · Lumark)를 앱 아이콘 이미지와 함께 소개한다. 기존 카테고리 탭/섹션 시스템(`data-filter` / `data-category`)을 그대로 재사용하며, 카드 컴포넌트는 기존 `.link-card` + `.featured-item` 패턴을 활용해 코드 일관성을 극대화한다. 목표는 방문자가 필자의 "쓰기/코드/음악"에 더해 "실제 앱 출시" 성과까지 한눈에 확인하도록 하는 것이다.

## 변경 유형
**혼합 (디자인 + 기능)** — 새 탭/섹션 추가(기능·구조)와 iOS 앱 아이콘용 시각 스타일 신설(디자인)이 함께 있으므로, Evaluator는 **기능 변경 평가 기준**을 적용한다(혼합은 기능 기준 적용 규칙).

## 디자인 언어 & 의도
둥근 사각형(iOS 앱 아이콘) 3개가 코럴핑크 글래스 카드 안에 나란히 놓여, 방문자가 "이 사람은 실제로 앱을 출시했구나"를 즉시 체감하게 한다. 아이콘은 실제 App Store 아이콘처럼 부드러운 라운드 코너와 은은한 테두리·그림자를 가져, 사이트의 glassmorphism + 코럴핑크 정체성 안에서 "제품감"을 자연스럽게 드러낸다. 기존 Velog/GitHub/Melon 카드와 동일한 리듬을 유지하되, 정사각 아이콘이 주는 시각적 정돈감으로 섹션이 완결적으로 보이게 한다.

## Sprint 범위 계약
Generator가 SPEC 외 변경을 하려 할 때의 판단 기준:
- **허용**: SPEC 기능(새 탭 버튼, 새 섹션, 3개 앱 카드, 아이콘 라운드 처리, 반응형/테마 대응)의 정상 동작에 필수적인 최소 연동 변경. 예: 새 카드 클래스를 도입할 경우 `initScrollReveal`/`applyFilter` 셀렉터에 그 클래스를 추가하는 것.
- **금지**: SPEC에 없는 독립 기능/효과 추가. 예) 앱 다운로드 수·별점 등 가짜 메타데이터 생성, 앱 상세 모달, 스크린샷 캐러셀, 새 애니메이션 키프레임, App Store API 연동, 기존 다른 섹션 스타일 리팩터링.
- **판단 기준**: "이 변경이 없으면 SPEC 기능이 제대로 동작하지 않는가?" → YES면 허용, NO면 금지.

## 핵심 설계 결정 (근거)

1. **탭 위치 = Game 다음(마지막)**. 근거: 카테고리 순서가 콘텐츠 성숙도/무게 순으로 흐른다(Study & Writing & Dev → Music → Social → Game). "출시한 앱"은 가장 완성도 높은 산출물이자 Game(웹 미니게임)과 성격이 인접(둘 다 인터랙티브 제품)하므로, Game 바로 다음에 배치해 "플레이 가능한 미니 프로젝트 → 정식 출시 제품"으로 이어지는 자연스러운 상향 흐름을 만든다. `data-filter="app"`, 라벨은 **"Released Apps"**.

2. **카드 컴포넌트 = 기존 `.link-card` 1개 컨테이너 + 내부 `.featured-item` 3개 재사용**. 근거:
   - `.featured-item`은 이미 `aspect-ratio: 1` + `object-fit: cover`의 **정사각 썸네일**을 렌더링 → iOS 앱 아이콘에 완벽히 부합.
   - `.link-card`와 `.featured-item`, `.section-label`, `.category-title` 모두 이미 `initScrollReveal`(413행)과 `applyFilter`(446행)의 셀렉터 목록에 포함되어 있음 → **JS 로직 변경 불필요**(가장 안전하고 일관됨).
   - 기존 `.link-card__items`의 `repeat(3, 1fr)` 그리드가 앱 3개 나열에 그대로 맞음.

3. **앱 아이콘 라운드 처리 = 신규 modifier `.featured-item__thumb--app`**. 근거: 원본 PNG는 전면 배경(full-bleed) 정사각 이미지라 라운드 코너가 없다. CSS에서 `border-radius`로 iOS 스타일 라운드 사각을 입혀야 한다. 기존 `.featured-item__thumb`를 전역 변경하면 Velog/GitHub 등 다른 썸네일에 영향을 주므로, **modifier로만 한정 적용**한다.

## 변경 범위

### index.html 변경사항

**A. 카테고리 탭 버튼 추가** — `.category-nav`(240~282행) 내부, **Game 버튼(275~281행) 바로 다음, `</nav>` 직전**에 새 버튼 추가:

```html
<button class="category-nav__btn" data-filter="app" type="button" role="tab" aria-selected="false">
  <svg class="category-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="6" y="2.5" width="12" height="19" rx="3"/>
    <path d="M10 5.5h4"/>
    <path d="M11 18.5h2"/>
  </svg>
  <span class="category-nav__label">Released Apps</span>
</button>
```
- 아이콘은 기존 탭들과 동일 규격(인라인 SVG, `viewBox="0 0 24 24"`, `stroke="currentColor"`, `stroke-width="2"`, round cap/join, `class="category-nav__icon"`, `aria-hidden="true"`). 스마트폰(둥근 사각 바디 + 상단 스피커 슬릿 + 하단 홈 인디케이터)을 상징 → "모바일 앱"을 직관적으로 전달.

**B. 새 섹션 추가** — **Game 섹션(`<div class="category-section" data-category="game" id="section-game">` … 그 닫는 `</div>`, 452~491행) 바로 다음, Social 섹션(494행) 앞**에 삽입:

```html
<!-- Released Apps -->
<div class="category-section" data-category="app" id="section-app">
  <div class="category-header">
    <h2 class="category-title">Released Apps</h2>
    <p class="section-label">App Store 정식 출시 iOS 앱</p>
  </div>
  <div class="links links--section">

    <div class="link-card link-card--app">
      <a class="link-card__header" href="https://apps.apple.com/kr/app/poppath/id6785336260" target="_blank" rel="noopener" aria-label="App Store에서 출시 앱 보기">
        <div class="link-card__icon icon--app">
          <i class="fa-brands fa-app-store-ios"></i>
        </div>
        <div class="link-card__info">
          <div class="link-card__title">App Store</div>
          <div class="link-card__desc">정식 출시한 iOS 앱</div>
        </div>
        <i class="fa-solid fa-arrow-right link-card__arrow"></i>
      </a>
      <div class="link-card__divider"></div>
      <div class="link-card__items">

        <a class="featured-item" href="https://apps.apple.com/kr/app/poppath/id6785336260" target="_blank" rel="noopener" aria-label="PopPath App Store에서 보기">
          <img class="featured-item__thumb featured-item__thumb--app" src="/assets/img/app-poppath.png" alt="PopPath 앱 아이콘" width="256" height="256" loading="lazy">
          <div class="featured-item__label">PopPath</div>
          <div class="featured-item__meta">
            <span class="featured-item__source featured-item__source--app">App Store</span>
            <span class="featured-item__detail">할 일을 흐름으로 정리</span>
          </div>
        </a>

        <a class="featured-item" href="https://apps.apple.com/kr/app/%EA%B9%80%EA%B0%84%ED%98%B8%EB%8A%94-%EC%9D%8C%EC%95%85%EB%B0%95%EC%82%AC/id6780122826" target="_blank" rel="noopener" aria-label="김간호는 음악박사 App Store에서 보기">
          <img class="featured-item__thumb featured-item__thumb--app" src="/assets/img/app-ganho.png" alt="김간호는 음악박사 앱 아이콘" width="256" height="256" loading="lazy">
          <div class="featured-item__label">김간호는 음악박사</div>
          <div class="featured-item__meta">
            <span class="featured-item__source featured-item__source--app">App Store</span>
            <span class="featured-item__detail">리듬 액션 게임</span>
          </div>
        </a>

        <a class="featured-item" href="https://apps.apple.com/kr/app/lumark/id6776158784" target="_blank" rel="noopener" aria-label="Lumark App Store에서 보기">
          <img class="featured-item__thumb featured-item__thumb--app" src="/assets/img/app-lumark.png" alt="Lumark 앱 아이콘" width="256" height="256" loading="lazy">
          <div class="featured-item__label">Lumark</div>
          <div class="featured-item__meta">
            <span class="featured-item__source featured-item__source--app">App Store</span>
            <span class="featured-item__detail">읽고 밑줄 긋는 기록</span>
          </div>
        </a>

      </div>
    </div>

  </div>
</div>
```

지침/규칙 반영:
- 세 앱 링크 URL은 사용자가 확정한 값을 **정확히** 사용(위 마크업에 그대로 기입). 모두 `target="_blank" rel="noopener"`.
- 카드 순서: PopPath → 김간호는 음악박사 → Lumark (사용자 지정 순).
- 태그라인은 간결·사실 위주(과장/AI슬롭 금지). 김간호는 음악박사는 웹 미니게임과 혼동되지 않도록 섹션 라벨을 "App Store 정식 출시 iOS 앱"으로 두고, 카드 `__detail`은 "리듬 액션 게임"으로 앱 성격만 담백하게 기술.
- `<img>`에 `width="256" height="256"` 명시(CLS 방지) + `loading="lazy"` + 의미 있는 `alt`.
- **정적 HTML이므로 `esc()`/`safeUrl()` 대상 아님**(외부/런타임 데이터가 아님). 링크는 신뢰된 하드코딩 값.

### assets/css/style.css 변경사항

**A. `:root`에 App Store 색상 변수 추가** (기존 변수 삭제/변경 없이 `:root` 하단, `--focus-pill-bg` 다음 줄에 추가):
```css
--platform-app: #0a84ff;            /* App Store 블루 (다크 테마) */
--platform-app-14: rgba(10, 132, 255, 0.14);
--glow-app: rgba(10, 132, 255, 0.18);
```
그리고 `html.light` 블록(`--focus-pill-bg` 다음)에 라이트 대응 추가:
```css
--platform-app: #0071e3;
--platform-app-14: rgba(0, 113, 227, 0.14);
--glow-app: rgba(0, 113, 227, 0.15);
```
근거: 기존 플랫폼 색상들(`--platform-velog` 등)과 동일한 네이밍/구조를 따른다. 하드코딩 대신 변수화.

**B. 앱 아이콘 라운드 처리** — `.featured-item` 블록 내부에 modifier 추가(기존 `.featured-item__thumb` 규칙 근처):
```css
& .featured-item__thumb--app {
  border-radius: 22.37%;              /* iOS superellipse 근사 (정사각 대비 비율) */
  border: 1px solid var(--border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}
```
- 아이콘이 컨테이너에 꽉 차되 iOS 아이콘처럼 라운드 사각으로 보이게 함. `--radius`(10px 고정)는 정사각 아이콘 코너 비율로는 부족하므로 % 라운드를 사용(AI 슬롭 규칙의 "임의 20px+ radius"와 무관 — 이는 아이콘 전용 비율 기반 값).
- `object-fit: cover`는 기존 `.featured-item__thumb`에서 이미 상속되므로 재선언 불필요.
- 호버 시 `transform: scale(1.08)`(기존 `.featured-item:hover .featured-item__thumb` 규칙)이 그대로 적용 → 별도 추가 없음(중복 scale 금지 규칙 준수).

**C. App Store 아이콘/소스 배지 색상** — 기존 패턴을 따라 추가:
```css
/* .featured-item 블록 내부, __source--github 규칙 다음 */
& .featured-item__source--app {
  background: var(--platform-app-14);
  color: var(--platform-app);
}
```
그리고 `.link-card__icon` 계열 색상(카드 헤더 아이콘) — 기존 `icon--melon` 등과 동일한 위치/방식으로:
```css
.icon--app {
  background: var(--platform-app-14);
  color: var(--platform-app);
}
```
(기존 `.icon--velog`/`.icon--melon` 등이 정의된 곳을 찾아 같은 블록/방식으로 추가. 하드코딩 색상 금지.)

**D. 카드 글로우** — `.link-card`의 `&:has(...)` 글로우 목록(1435~1439행)에 한 줄 추가:
```css
&:has(.icon--app):hover { box-shadow: 0 6px 24px var(--glow-app); }
```

**E. 반응형** — `@media (max-width: 520px)` 단일 브레이크포인트 대응:
- `.link-card__items`의 `repeat(3, 1fr)`가 좁은 화면에서 아이콘이 지나치게 작아지면, 앱 섹션 한정으로 아이콘 가독성을 확보한다. 기존 다른 카드가 모바일에서 3열을 유지한다면 **동일하게 3열 유지**(일관성 우선)하되, 라벨 오버플로만 확인. 만약 실측상 3열에서 아이콘이 44px 미만으로 작아진다면 앱 섹션 한정 `.link-card--app .link-card__items { grid-template-columns: repeat(3, 1fr); gap: 8px; }` 수준의 미세 조정만 허용(새 레이아웃 발명 금지). Generator는 기존 모바일 동작을 먼저 확인하고 최소 변경.
- `.featured-item__thumb--app`의 `border-radius: 22.37%`는 크기 무관 비율이라 모바일에서도 자동 대응.

**F. `prefers-reduced-motion`** — 신규 CSS는 애니메이션/트랜지션을 새로 도입하지 않고 기존 `.featured-item`/`.link-card`의 트랜지션만 상속하므로, 기존 `@media (prefers-reduced-motion: reduce)` 블록이 그대로 커버한다. **추가 규칙 불필요**(단, Generator는 새 트랜지션을 도입하지 말 것).

**G. 라이트 테마 아이콘 배경** — `html.light .featured-item { background: #f0eff4; }`(265행)가 앱 아이콘 카드에도 적용되지만, 앱 아이콘은 full-bleed 이미지라 배경이 거의 보이지 않음. 추가 대응 불필요. 다만 `.featured-item__thumb--app`의 `border`가 라이트에서도 `var(--border)`로 자동 전환되어 대응됨.

### assets/js/main.js 변경사항

**변경 불필요 (판정: NO-OP).** 근거:
- 새 탭은 `data-filter="app"` `<button>`이며, `initCategoryFilter`(457행)가 `.category-nav__btn` 전체를 순회하고 `<a>`만 제외(478행)하므로 새 버튼이 자동으로 필터 바인딩된다.
- 새 섹션은 `.category-section[data-category="app"]`이며 `applyFilter`(442행)가 `sec.dataset.category === filter`로 매칭하므로 자동 동작.
- 카드가 기존 `.link-card` / `.featured-item` / `.section-label` / `.category-title` 클래스를 **재사용**하므로 `initScrollReveal`(413행)과 `applyFilter`(446행)의 셀렉터 목록에 **이미 포함**되어 있다 → 스크롤 리빌/필터 시 표시 모두 정상 동작.
- 카테고리 인디케이터(`updateIndicator`)는 `.is-active` 버튼 기준으로 자동 계산되므로 새 탭 추가에 영향 없음.

**⚠️ 만약 Generator가 `.link-card`/`.featured-item`이 아닌 새 클래스를 도입한다면**(권장하지 않음), 반드시 다음 두 셀렉터 목록에 그 클래스를 추가해야 한다:
1. `initScrollReveal` 413행: `document.querySelectorAll('.link-card, .social-card, ... , .focus-board__lede')`
2. `applyFilter` 446행: `sec.querySelectorAll('.link-card, .social-card, ... , .focus-board__lede')`
누락 시 새 섹션이 `opacity: 0`으로 남아 보이지 않는 치명적 버그가 발생한다. **본 SPEC은 기존 클래스 재사용을 채택하므로 이 위험이 없다.**

## 기능 상세

### 기능 1: Released Apps 탭
- 설명: `.category-nav`에 6번째 탭 추가(`data-filter="app"`, 라벨 "Released Apps", 스마트폰 SVG 아이콘).
- 사용자 동작: 탭 클릭 시 앱 섹션만 표시(All에서는 전체와 함께 노출). 리플/인디케이터/스크롤 스냅은 기존 로직 자동 적용.
- 구현 위치: HTML(`.category-nav` 내부, Game 다음). CSS/JS 추가 없음(기존 `.category-nav__btn`/`.category-nav__icon` 스타일 및 필터 로직 재사용).
- 세부 요소: `role="tab"`, `aria-selected="false"`(초기), `type="button"`, 인라인 SVG 아이콘.

### 기능 2: Released Apps 섹션 (3개 앱 카드)
- 설명: `.category-section[data-category="app"][id="section-app"]` 안에 `.link-card` 1개(헤더 = App Store 링크) + 내부 `.featured-item` 3개(각 앱).
- 사용자 동작: 각 앱 아이콘/카드 클릭 시 해당 App Store 페이지가 새 탭에서 열림.
- 구현 위치: HTML(Game 섹션과 Social 섹션 사이). CSS(아이콘 라운드 modifier + App Store 색상 변수/배지). JS 없음.
- 세부 요소:
  - PopPath — `/assets/img/app-poppath.png` — 태그라인 "할 일을 흐름으로 정리" — https://apps.apple.com/kr/app/poppath/id6785336260
  - 김간호는 음악박사 — `/assets/img/app-ganho.png` — 태그라인 "리듬 액션 게임" — https://apps.apple.com/kr/app/%EA%B9%80%EA%B0%84%ED%98%B8%EB%8A%94-%EC%9D%8C%EC%95%85%EB%B0%95%EC%82%AC/id6780122826
  - Lumark — `/assets/img/app-lumark.png` — 태그라인 "읽고 밑줄 긋는 기록" — https://apps.apple.com/kr/app/lumark/id6776158784
  - 각 `<img>`: `alt`(앱명 + "앱 아이콘"), `width="256" height="256"`, `loading="lazy"`, `class="featured-item__thumb featured-item__thumb--app"`.

### 기능 3: iOS 아이콘 렌더링 (디자인)
- 설명: `.featured-item__thumb--app`로 `border-radius`(비율 기반) + 테두리 + 미세 그림자를 부여해 실제 App Store 아이콘처럼 보이게 함.
- 구현 위치: CSS만.
- 세부 요소: 다크/라이트 테마 모두 `var(--border)`로 테두리 자동 전환. 호버 scale은 기존 규칙 상속(중복 추가 금지).

## 주의사항
- **기존 기능 충돌 없음**: JS 무변경. 다른 섹션/탭/인디케이터/스크롤 리빌 로직에 영향 없음. Generator는 기존 `initScrollReveal`·`applyFilter` 셀렉터를 **수정하지 말 것**(기존 클래스 재사용이므로 불필요).
- **`:root` 변수 규칙**: 기존 변수 삭제/값 변경 절대 금지. `--platform-app*` / `--glow-app`은 **추가만**(다크 `:root` + `html.light` 양쪽).
- **하드코딩 색상 금지**: App Store 블루는 반드시 신규 변수(`--platform-app` 등)로. 인라인 CSS 절대 금지.
- **보안**: 링크는 정적 신뢰 값이므로 `esc()`/`safeUrl()` 비대상. 단 모든 외부 링크에 `rel="noopener"` 필수(마크업에 포함됨).
- **AI 슬롭 회피**: 보라-청록 그라디언트 금지, 과대 그림자(0 20px 60px 이상) 금지, 임의 대형 radius 금지(아이콘 % 라운드는 비율 기반 정당화). 태그라인 과장 금지 — 위 확정 문구를 그대로 사용.
- **Font Awesome 아이콘**: 카드 헤더의 `fa-brands fa-app-store-ios`는 프로젝트가 이미 로드하는 FA 6.5.1에 존재(head 29행). 미표시 시 헤더 아이콘 한정 문제이며 카드 본체(아이콘 이미지)는 정상 — 그래도 렌더 확인 권장.
- **반응형 검증 체크리스트**: 520px 이하에서 (1) 탭 가로 스크롤 스냅에 새 탭 포함 확인, (2) `.link-card__items` 3열에서 앱 아이콘/라벨 오버플로 없음 확인.
