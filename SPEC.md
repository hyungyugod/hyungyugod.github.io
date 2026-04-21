# SPEC.md

## 카테고리 섹션 제목 헤더 추가

## 개요
각 카테고리 섹션(Study & Writing & Dev / Music / Social) 위쪽에 해당 카테고리를 명확히 알려주는 **큰 제목 헤더**를 왼쪽 상단 정렬로 추가한다. 현재도 `.section-label`이 각 섹션 위에 존재하지만, 11px serif uppercase의 작은 캡션 스타일이라 "카드 위의 카테고리 제목"으로서의 존재감이 약하다. 이 변경은 방문자가 각 섹션을 한눈에 구분할 수 있도록 **계층성 있는 제목 + 기존 라벨**의 2단 헤더 구조를 도입한다.

## 변경 유형
**디자인** — HTML 구조에 제목 요소 추가 및 CSS 스타일 작성. 로직 변경 없음.

## 디자인 언어 & 의도
코럴핑크(`--brand`) 악센트를 사용한 세리프(`--font-serif`) 대형 제목이 카드 그리드 왼쪽 위에 "앵커"처럼 자리잡아, 각 섹션이 하나의 챕터처럼 읽히도록 만든다. 기존 작은 `.section-label`은 제목 아래 **kicker(카테고리 분류 태그)** 역할로 재배치되어, "카테고리명 → 설명 라벨 → 카드 그리드"의 타이포그래피 리듬을 만든다. 글래스모피즘 톤을 유지하면서도 스크롤할 때 각 섹션의 시작점이 명확하게 느껴지는 것이 목표다.

## Sprint 범위 계약
Generator가 SPEC 외 변경을 하려 할 때의 판단 기준:
- **허용**: 제목 헤더를 위해 `.category-section` 상단 여백(margin/padding) 미세 조정, 기존 `.section-label`의 margin-top 조정, `initScrollReveal()` 타깃 셀렉터에 새 제목 클래스 추가(등장 애니메이션 일관성 유지용)
- **금지**: 카드 그리드 레이아웃 변경, 카테고리 탭(`.category-nav`) 디자인 변경, `.section-label` 스타일의 근본적 재설계(색상/폰트패밀리/사이즈 변경), 새로운 인터랙션 효과 추가, Routine/cover-band 섹션 수정
- **판단 기준**: "이 변경이 없으면 새 제목 헤더가 시각적으로 자연스럽게 자리잡지 못하는가?" → YES면 허용, NO면 금지

## 변경 범위

### index.html 변경사항
각 `.category-section` 내부 `.section-label` 바로 **위**에 `<h2 class="category-title">` 추가. 총 3곳:

1. `#section-writing` (data-category="writing")
   - `<h2 class="category-title">Study &amp; Writing &amp; Dev</h2>` 추가
   - 기존 `<p class="section-label">Study & Writing & Dev</p>`는 유지하되 텍스트를 부연 설명으로 변경: `<p class="section-label">개발 · 글쓰기 · 학습 기록</p>`

2. `#section-music` (data-category="music")
   - `<h2 class="category-title">Music</h2>` 추가
   - 기존 라벨 텍스트 변경: `<p class="section-label">음악 · 프로듀싱 · 릴리즈</p>`

3. `#section-social` (data-category="social")
   - `<h2 class="category-title">Social</h2>` 추가
   - 기존 라벨 텍스트 변경: `<p class="section-label">연결점 · 소셜 링크</p>`

**주의**: `.streaks` 섹션 내부의 `<p class="section-label">Routine</p>`은 건드리지 않는다.

구조 예시:
```html
<div class="category-section" data-category="writing" id="section-writing">
  <div class="category-header">
    <h2 class="category-title">Study &amp; Writing &amp; Dev</h2>
    <p class="section-label">개발 · 글쓰기 · 학습 기록</p>
  </div>
  <div class="links links--section">
    ...
  </div>
</div>
```

### assets/css/style.css 변경사항

**추가**: `/* ---- Category Header ---- */` 섹션 신설 (기존 `/* ---- Section Label ---- */` 블록 바로 앞).

```css
.category-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 18px;
  padding-left: 2px;

  & .section-label {
    margin-top: 0;
    margin-bottom: 0;
    padding-left: 0;
  }
}

.category-title {
  font-family: var(--font-serif);
  font-size: 38px;
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.5px;
  color: var(--text);
  position: relative;
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.6s var(--ease-out-expo), transform 0.6s var(--ease-out-expo);

  &.is-visible {
    opacity: 1;
    transform: translateY(0);
  }

  &::before {
    content: '';
    position: absolute;
    left: -14px;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 0.75em;
    background: var(--brand);
    border-radius: 2px;
    opacity: 0.85;
  }
}
```

**반응형 (`@media (max-width: 520px)` 블록에 추가)**:
```css
.category-title {
  font-size: 28px;
  &::before {
    left: -10px;
    width: 3px;
  }
}
.category-header {
  gap: 4px;
  margin-bottom: 14px;
}
```

**접근성 (`@media (prefers-reduced-motion: reduce)`)**: 기존 리스트에 `.category-title` 추가.

**하드코딩 금지**: 색상/폰트/트랜지션 이징은 전부 CSS 변수(`--brand`, `--font-serif`, `--text`, `--ease-out-expo`) 사용.

### assets/js/main.js 변경사항

**`initScrollReveal()` 함수**: targets 셀렉터에 `, .category-title` 추가.
**`applyFilter()` 함수**: 섹션 내부 즉시표시 셀렉터에 `, .category-title` 추가.

추가 함수/이벤트 없음.

## 기능 상세

### 기능 1: 카테고리 제목 헤더
- 각 카테고리 섹션 시작부에 세리프 대형 제목 + 기존 라벨을 2단으로 쌓은 왼쪽 정렬 헤더 블록.
- 순수 시각 요소. 스크롤 시 페이드인 + 살짝 위로 올라오는 등장 애니메이션.
- `.category-header` — flex column, align-items flex-start
- `.category-title` — 38px serif, 좌측 `::before` 코럴핑크 악센트 바 (4×0.75em)

### 기능 2: 등장 애니메이션 일관성
- `initScrollReveal()` 및 `applyFilter()`의 셀렉터 리스트에 `.category-title` 추가.

## 주의사항
- `.streaks` 섹션 내부 `<p class="section-label">Routine</p>`은 건드리지 않는다.
- 다크/라이트 테마 자동 대응 (`var(--text)`, `var(--brand)` 사용).
- `<h2>` 시맨틱 태그 사용으로 접근성 확보.
- 모바일 520px에서 28px로 축소, 악센트 바 3px.
- BEM: `.category-header` / `.category-title`.
