# SPEC.md — Pixel Nurse Note-Catcher 게임 페이지

## 개요
카테고리 내비게이션의 `Game` 버튼이 현재 섹션 링크 없이 존재한다. 이 버튼을 누르면 신규 서브페이지 `pages/game.html`이 열리고, 픽셀 아트 스타일의 간호사 캐릭터가 건물 안을 뛰어다니며 30초 안에 음표를 최대한 많이 획득하는 캔버스 게임을 플레이할 수 있게 한다. 사이트 본체의 글래스모피즘 + 코럴핑크(`--brand: #c4847a`) 정체성과 다크/라이트 테마를 그대로 계승한다.

## 변경 유형
**혼합** (디자인 + 기능)

## 디자인 언어 & 의도
레트로 픽셀 게임의 저해상도 감성과 사이트 본체의 차분한 글래스모피즘을 결합하여, "방문자가 잠시 숨을 돌리는 미니 공간"을 만든다. 간호학과 전공(프로필 모달에 명시됨)을 유쾌하게 드러내는 간호사 캐릭터가 음표(프로듀서 활동)를 수집하는 설정으로 포트폴리오의 두 정체성을 한 화면에 녹인다. 게임 HUD·버튼·모달은 본체와 동일한 `--brand`, `--bg-card`, `--radius`, `backdrop-filter`를 사용하여 일관성을 유지하며, 라이트/다크 테마가 `localStorage('theme')`를 통해 자동 적용된다.

## Sprint 범위 계약
Generator가 SPEC 외 변경을 하려 할 때의 판단 기준:
- **허용**:
  - `pages/game.html` 내부의 스타일/스크립트(단일 파일 내 `<style>`, `<script>`)는 이 파일 한정으로 자유롭게 작성 가능
  - `index.html`의 Game 버튼을 `<a>` 링크처럼 동작시키기 위한 최소 JS 연동 (main.js 내 `initCategoryFilter`에서 링크는 필터 루프 제외)
  - Game 버튼 자체의 포인터 아이콘/스타일 보정이 필요하면 `style.css`에 스코프 추가
- **금지**:
  - 게임 로직을 `main.js`에 추가 (게임은 `pages/game.html` 내부에 완전히 격리)
  - 다른 카테고리 탭(All/Writing/Music/Social) 동작 변경
  - 새로운 외부 라이브러리/CDN (Phaser, Pixi 등) 추가
  - `assets/img/`에 새 이미지 추가 (픽셀 아트는 캔버스에서 코드로 그린다)
  - 새 CSS/JS 파일 생성 (단, `pages/game.html`은 단일 HTML 파일이므로 내부 `<style>`/`<script>` 허용)
- **판단 기준**: "이 변경이 없으면 게임 페이지 진입/테마 동기화/복귀가 제대로 동작하지 않는가?" → YES면 허용, NO면 금지

---

## 변경 범위

### index.html 변경사항
1. 라인 159 근방의 `Game` 버튼을 **`<a class="category-nav__btn category-nav__btn--link" href="/pages/game.html">Game</a>`** 로 교체
2. 기존 4개 버튼(All/Writing/Music/Social)은 그대로 유지

### pages/game.html (신규 생성)
- `<!DOCTYPE html>` + `<html lang="ko">`
- `<head>`에 `<link rel="stylesheet" href="/assets/css/style.css">` + 테마 FOUC 방지 스크립트
- `<body class="game-page">` 안에 다음 구조:
  - 돌아가기 링크 `<a class="game-back" href="/">← 돌아가기</a>`
  - 테마 토글 버튼 (메인의 `.theme-toggle` 재사용, 페이지 내부에서 바인딩)
  - `<main class="game-shell">`:
    - `<header class="game-header">` 제목/부제
    - `<section class="game-stage">`:
      - HUD (TIME / SCORE / BEST)
      - `<canvas id="gameCanvas" width="640" height="400">`
      - 시작 오버레이 (난이도 radiogroup 3개 + 시작 버튼)
      - 종료 오버레이 (점수 표시 + 다시 플레이 / 홈으로)
    - `<footer class="game-footer">`

내부 `<script>`에 포함:
- 테마 토글 바인딩 (main.js의 `initThemeToggle`와 동일 로직 페이지 내부 재구현)
- 게임 로직 (아래 "게임 상세 스펙" 참조)

### assets/css/style.css 변경사항
1. **Game 버튼 링크 스타일 (필수)**:
   - `.category-nav__btn--link` 추가: `<a>` 태그에도 버튼과 동일한 스타일이 적용되도록 `display:inline-flex; text-decoration:none;` 보정
   - 호버 시 글로우 강조
2. 게임 페이지 고유 레이아웃 스타일은 `pages/game.html` 내부 `<style>`에 작성 (단일 파일 유지). 공통 변수/토큰은 재사용

### assets/js/main.js 변경사항
1. `initCategoryFilter()` 내부 루프: `<a>` 태그는 필터 바인딩에서 제외
   ```js
   btns.forEach(btn => {
     if (btn.tagName === 'A') return;
     btn.addEventListener('click', ...);
   });
   ```
2. 그 외 변경 없음

---

## 게임 상세 스펙

### 캔버스 & 좌표계
- 캔버스 크기: **640 × 400 px** (논리), CSS `max-width:100%; aspect-ratio:16/10;` 반응형
- 타일 크기: **20 × 20 px** → 32열 × 20행 그리드
- 픽셀 렌더링: `ctx.imageSmoothingEnabled = false;`, CSS `image-rendering: pixelated;`
- 좌표는 정수 픽셀로 스냅

### 맵 (건물 내부)
- 외곽 벽 1타일 두께 + 내부에 **병동 복도 구조**: 중앙 가로 복도 + 수직 복도 2개 + 방 4개(모서리)
- 정적 2D 배열 `map[row][col]` (0=빈칸, 1=벽)
- 벽 색상: 다크 `#2a2233`, 라이트 `#d4ccd6`
- 바닥은 은은한 체크 패턴

### 캐릭터 (픽셀 간호사)
- 크기: **16×16 px** (1타일 내부에 여백)
- 코드로 픽셀 그리기 (이미지 파일 금지):
  - 머리: `#f5d0c0`
  - 머리카락: `#3a2a2a`
  - 간호사 캡: `#ffffff` + 코럴 십자가
  - 상의: `#ffffff`
  - 하의: `#e4b8b0`
  - 신발: `#b07068`
- 4방향 idle + 2프레임 걷기 애니메이션
- 이동: 화살표 + WASD, 벽 충돌 정지

### 음표 아이템
- 크기: **12×12 px**, 8분 음표 형태
- 색상: `var(--brand)` + 하이라이트
- 빈 타일 무작위 스폰, 획득 시 +1 점수 + 짧은 사인파 효과음 + 즉시 재스폰

### 장애물 (중·상 난이도)
- 10×10 px 작은 유닛, 복도 랜덤 이동
- 충돌 시 스턴 + 점수 -1 (최소 0)
- 개수: 하=0, 중=2, 상=5

### 난이도별 파라미터

| 파라미터 | 하 (easy) | 중 (normal) | 상 (hard) |
|---|---|---|---|
| 캐릭터 속도 (px/s) | 180 | 140 | 100 |
| 동시 음표 수 | 6 | 4 | 2 |
| 음표 수명 (ms) | ∞ | 5000 | 2500 |
| 장애물 수 | 0 | 2 | 5 |
| 장애물 속도 (px/s) | — | 90 | 150 |
| 맵 복잡도 | 외곽 + 기둥 1개 | 중앙 + 방 2개 | 방 4개 + 기둥 다수 |
| 스턴 시간 (ms) | — | 500 | 800 |

상(hard)은 속도가 느린데 장애물이 빠르고 음표가 금방 사라져 실질적으로 달성이 어려워야 한다. 체감상 중=15~25개, 상=5~10개 목표.

### HUD
- 캔버스 상단 외부 flex 3칸: TIME / SCORE / BEST
- `font-variant-numeric: tabular-nums;`
- TIME 10초 이하 시 `color: var(--brand-light)` + 미세 펄스 (reduced-motion 시 비활성)

### 게임 흐름
1. 시작 화면: 난이도 3버튼(기본 "하") + 시작
2. 플레이 중: 30초 카운트다운, `requestAnimationFrame` + delta time
3. 종료: 점수 + 최고점 갱신 시 "신기록!" + 다시 플레이/홈으로

### 최고점 저장
- `localStorage` 키: `pixelNurseBest` → `{"easy":0,"normal":0,"hard":0}`
- BEST는 현재 선택 난이도 기준 표시
- 파싱은 `try/catch`로 방어

### 접근성
- `prefers-reduced-motion`: 걷기 애니메이션·펄스·깜빡임 비활성
- 키보드만으로 전 흐름 진행
- 난이도 버튼 `role="radiogroup"` + `aria-checked`
- 종료 점수는 `aria-live="polite"` 영역에 반영

### 보안
- 외부 fetch / 외부 URL 없음
- localStorage 파싱은 `try/catch`
- 모든 이벤트는 `addEventListener` (인라인 금지)

### 반응형
- 520px 이하: 캔버스 `width:100%`, HUD 폰트 축소, 시작 오버레이 버튼 세로 정렬
- 모바일 터치 조작은 이번 스프린트에서 생략 (키보드 안내 문구만 표시)

---

## 평가 가능한 Acceptance Criteria

1. [ ] 메인 페이지에서 `Game` 버튼 클릭 시 `/pages/game.html`로 이동한다
2. [ ] 게임 페이지 최초 진입 시 난이도 선택 오버레이가 표시되고 "하"가 기본 선택된다
3. [ ] 방향키/WASD로 간호사 캐릭터가 이동하며, 벽에 막혀 통과하지 못한다
4. [ ] 캐릭터가 음표 위에 겹치면 점수 +1 되고 음표가 다른 위치에 즉시 재스폰된다
5. [ ] 시작 후 정확히 30초가 지나면 종료 오버레이가 뜬다 (±0.5s)
6. [ ] 난이도 "상"에서 캐릭터 속도가 느리고, 장애물 5개, 음표 수명 2.5초
7. [ ] 종료 시 최고점이 `pixelNurseBest`에 저장되고 재접속 시 BEST HUD에 복원된다
8. [ ] 테마 토글이 동작하며 캔버스 배경·HUD 색상도 함께 바뀐다
9. [ ] "홈으로" 링크가 `/`로 복귀한다
10. [ ] `prefers-reduced-motion: reduce` 시 걷기 애니메이션·카운트다운 펄스 비활성
11. [ ] 콘솔 에러 없이 실행된다
12. [ ] 520px에서 캔버스가 뷰포트를 넘지 않고 오버레이 버튼이 세로 정렬된다
13. [ ] 캔버스는 `image-rendering: pixelated`로 픽셀 외관 유지
14. [ ] 외부 라이브러리/이미지 없이 순수 HTML/CSS/JS로 구현되었다
15. [ ] `index.html`의 나머지 4개 카테고리 탭 동작이 이전과 동일하다

---

## 주의사항
- **Game 버튼 교체 시**: `<button data-filter="Game">`이 그대로 남으면 `initCategoryFilter`가 click에 반응해 다른 섹션을 모두 숨기는 사고 발생. 반드시 `<a>`로 교체 + main.js 루프에서 `<a>` 제외
- **단일 파일 구조 예외**: `pages/game.html`은 서브페이지이므로 내부 `<style>`/`<script>` 허용. 새 외부 CSS/JS 파일은 여전히 금지
- **테마 동기화**: `<head>` 최상단에 `<script>if(localStorage.getItem('theme')==='light')document.documentElement.classList.add('light');</script>` 포함 (FOUC 방지)
- **Canvas 접근성**: 종료 오버레이에서 점수를 텍스트로 표시하는 것이 필수
