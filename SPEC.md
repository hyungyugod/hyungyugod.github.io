# Velog/GitHub 중심 홈 리디자인

## 개요
홈페이지를 Velog와 GitHub가 주력으로 보이는 현대적 개인 포트폴리오로 재구성한다. 최근 작업을 자동으로 보여주는 기존 Velog RSS/GitHub API 흐름은 유지하되, 첫 화면과 콘텐츠 섹션에서 "최근 개발과 기록이 계속 움직이는 사람"이라는 인상을 강화한다.

## 변경 유형
혼합 — HTML 구조와 CSS 레이아웃을 크게 조정하고, 기존 동적 데이터 렌더링을 새 카드 구조에 맞게 보강한다.

## 디자인 언어 & 의도
코럴 핑크 기반 글래스모피즘은 유지하면서, 좁은 링크 허브 느낌을 줄이고 데스크톱에서는 editorial bento portfolio처럼 넓고 정돈된 화면을 만든다. Velog/GitHub는 가장 큰 시각적 무게를 가지며, 최근 글과 최근 레포가 살아 있는 작업 피드처럼 보이도록 한다. 여백, 줄 길이, 카드 내부 마진을 명확히 정리해 글이 답답하거나 떠 보이지 않게 한다.

## Sprint 범위 계약
Generator가 SPEC 외 변경을 하려 할 때의 판단 기준:
- **허용**: Velog/GitHub 중심 리디자인 구현에 필요한 HTML 재배치, 기존 fetch 렌더링 마크업 보강, CSS 반응형 조정, 기존 init 대상 클래스 확장
- **허용**: 기존 Music/Social/Routine/Game 섹션을 새 레이아웃에 맞게 시각적으로 정돈하되 기능과 링크는 보존하는 변경
- **금지**: 새 외부 라이브러리/프레임워크 추가, 새 CSS/JS 파일 생성, 게임 페이지 자체 변경, SPEC에 없는 독립 기능 추가
- **판단 기준**: "이 변경이 없으면 Velog/GitHub 중심의 최근 작업 포트폴리오 경험이 제대로 완성되지 않는가?" → YES면 허용, NO면 금지

## 변경 범위

### index.html 변경사항
- Hero 안의 `.profile` 구조를 유지하되, `HG` 중심에서 Velog/GitHub 주력 정체성이 드러나는 카피와 CTA를 추가한다.
  - 예: `.profile__eyebrow`, `.profile__statement`, `.profile__actions`, `.profile__quick-stats`
  - CTA는 Velog, GitHub, 이메일/프로필로 연결하고 외부 링크에는 `target="_blank" rel="noopener"`를 유지한다.
- 기존 3C 모토와 긴 bio는 유지하되, 첫 화면에서 과밀하지 않도록 hero 카피/CTA와 균형 있게 재배치한다.
- `.page-wrapper` 첫 부분에 `work-hub` 또는 `focus-board` 섹션을 추가해 Velog/GitHub 최신 작업을 크게 보여준다.
  - Velog 최신 글 컨테이너는 기존 `id="velog-items"`를 유지하거나, JS를 함께 수정해 새 `id`를 일관되게 사용한다.
  - GitHub 최신 레포 컨테이너는 기존 `id="github-items"`를 유지하거나, JS를 함께 수정해 새 `id`를 일관되게 사용한다.
  - 두 주력 카드에는 "Latest writing" / "Latest code" 성격의 헤더, 짧은 설명, CTA를 포함한다.
- 기존 Study & Writing & Dev 섹션에서는 Velog/GitHub 중복이 과하게 보이지 않도록, 새 주력 섹션과 역할이 겹치지 않게 정리한다.
  - Brunch는 보조 writing 카드로 유지한다.
  - Velog/GitHub 최신 피드가 새 주력 섹션으로 이동했다면 기존 위치의 중복 카드 제거 또는 축소를 허용한다.
- Category nav는 유지하되, 주력 섹션이 All 화면에서 먼저 보이도록 위치를 조정한다.
- Game 섹션과 `/pages/game.html` 링크는 기존 동작과 문구를 보존한다.

### assets/css/style.css 변경사항
- 데스크톱 `.page-wrapper`의 최대 폭을 확장해 링크 허브 느낌을 줄인다. 모바일에서는 기존처럼 단일 열을 유지한다.
- 새 주력 섹션에 BEM 클래스 추가:
  - `.focus-board`, `.focus-board__header`, `.focus-board__title`, `.focus-board__lede`
  - `.focus-grid`, `.focus-card`, `.focus-card--velog`, `.focus-card--github`
  - `.focus-card__top`, `.focus-card__icon`, `.focus-card__title`, `.focus-card__desc`, `.focus-card__items`, `.focus-card__cta`
- Velog/GitHub 카드는 asymmetric bento 느낌으로 데스크톱 2열 배치하되, 카드 내부 텍스트 줄 간격과 썸네일 비율을 안정적으로 잡는다.
- 기존 `.featured-item`이 새 카드에서도 자연스럽게 동작하도록 여백, 라벨 line-height, thumbnail aspect-ratio를 보강한다.
- Hero 카피와 CTA용 스타일을 추가하고, 긴 텍스트가 모바일에서 넘치지 않도록 clamp 대신 고정/단계형 크기를 사용한다.
- 색상은 기존 CSS 변수 또는 새 CSS 변수만 사용하고, 하드코딩 색상은 기존 플랫폼 색상 예외 외에는 최소화한다.
- `@media (max-width: 520px)`에서 hero CTA, stats, focus grid, card padding, category nav 줄바꿈/스크롤을 검증한다.
- `@media (prefers-reduced-motion: reduce)`에서 새 reveal/hover 모션이 꺼지거나 transform이 제거되도록 한다.

### assets/js/main.js 변경사항
- `fetchVelog()`와 `fetchGitHub()`는 최근 3개를 보여주는 기능을 유지한다.
- 새 focus 카드에서 읽기 좋은 메타 정보를 보여줄 수 있도록 렌더링 마크업을 개선한다.
  - Velog: 제목, fallback 썸네일, "Velog" source pill
  - GitHub: 레포명, 언어, stars, fallback SVG
- `initScrollReveal()`와 `applyFilter()`가 새 `.focus-card`, `.focus-board__title` 등도 reveal 대상으로 포함하도록 확장한다.
- 기존 cover-band 클릭, category filter, modal, theme toggle, music showcase, streak 동작은 보존한다.

## 기능 상세

### 기능 1: Velog/GitHub 주력 Focus Board
- 설명: 홈 상단에서 Velog 최신 글과 GitHub 최신 레포를 가장 큰 카드로 보여주는 bento형 작업 보드.
- 사용자 동작: 방문자는 첫 스크롤에서 최근 글과 최근 코드 작업을 바로 클릭해 이동할 수 있다.
- 구현 위치: `index.html`의 `page-wrapper` 상단, `assets/css/style.css`의 focus board 스타일, `assets/js/main.js`의 fetch 렌더링.
- 세부 요소: 헤더, 설명문, Velog 카드, GitHub 카드, 각 카드별 최근 3개 item, CTA.

### 기능 2: Hero 정체성 강화
- 설명: Hero를 단순 프로필에서 "기록하고 만드는 개발자" 정체성이 드러나는 소개 영역으로 보강한다.
- 사용자 동작: 방문자는 첫 화면에서 Velog/GitHub가 주력이라는 점과 연락/프로필 이동 경로를 즉시 파악한다.
- 구현 위치: `index.html`의 `.profile`, `assets/css/style.css`의 `.profile__statement`, `.profile__actions`, `.profile__quick-stats`.
- 세부 요소: eyebrow, statement, 짧은 lede, Velog/GitHub CTA, 최근 작업 지표형 chips.

### 기능 3: 기존 섹션 재정돈
- 설명: 새 주력 섹션과 중복되는 기존 Study 섹션을 정리하고, Music/Social/Game은 기존 기능을 보존한 채 시각 톤만 맞춘다.
- 사용자 동작: All 화면에서 주력 작업 → 루틴/카테고리 → 보조 콘텐츠 순으로 자연스럽게 탐색한다.
- 구현 위치: `index.html` 섹션 순서와 일부 카드 구성, `assets/css/style.css` 반응형/여백 보정.
- 세부 요소: Brunch 보조 카드, Music showcase, Game showcase, Social cards 유지.

## 주의사항
- `id="velog-items"`와 `id="github-items"`는 JS fetch 대상이므로 HTML 변경 시 반드시 일치시킨다.
- 외부 RSS/API에서 들어오는 문자열은 기존처럼 `esc()`와 `safeUrl()`을 유지한다.
- 새 CTA는 외부 링크에 `target="_blank" rel="noopener"`를 적용한다.
- 게임 섹션과 `assets/js/game.js`, `assets/css/game.css`, `pages/game.html`은 수정하지 않는다.
- 큰 redesign이어도 단일 파일 구조를 유지한다.
