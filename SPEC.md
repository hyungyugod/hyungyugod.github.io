# 모바일 세로 모드 하단 키패드 전환 (가로 회전 강제 제거)

## 개요
현재 게임 페이지(`pages/game.html`)는 터치 디바이스가 세로(portrait)일 때 "기기를 가로로 돌려주세요" 전체 오버레이를 띄워 플레이를 강제로 차단하고, 가로(landscape)에서만 좌우 듀얼 조이콘으로 조작하게 되어 있다. 사용자 경험이 단절되므로, 세로 모드에서도 바로 플레이할 수 있도록 회전 강제 로직을 제거하고, 캔버스 아래쪽에 크고 눌림감 좋은 방향 키패드(D-Pad)를 고정 노출한다. 기존 키보드/캔버스 탭 이동 로직과 함께 공존한다.

## 변경 유형
혼합 (로직 변경 + UI/레이아웃 재설계) — Evaluator는 "기능 변경 평가 기준"을 적용한다.

## 디자인 언어 & 의도
세로 폰에서 사이트는 이미 코럴핑크 glassmorphism의 아늑한 방과 같은 톤을 유지한다. 하단 키패드는 "돌리라"는 차단 장벽 대신, 캔버스 아래에 자연스럽게 이어지는 **glassmorphism 조작 패드**로 등장해 손가락이 닿는 위치에 머무른다. 버튼은 기존 `.game-joycon__btn`의 원형 모티브와 `--brand-*` 팔레트를 크게 확장한 형태로, 눌렀을 때 코럴핑크 글로우가 번지며 게임 세계와 조작 UI가 하나의 분위기로 연결되는 경험을 목표로 한다.

## Sprint 범위 계약
Generator가 SPEC 외 변경을 하려 할 때의 판단 기준:
- **허용**: (a) 세로 키패드 노출을 위해 기존 `body.is-touch.is-portrait .game-joycons { display:none }` 규칙을 바꾸는 것, (b) `clearDpadPressed()` 같이 조이콘 상태 리셋 함수와 신규 키패드를 연동하는 것, (c) `initTouchControls()`에서 `initDualDpad()` 호출 유지/재사용, (d) 캔버스 `aspect-ratio`/`max-height`를 키패드 공간 확보 위해 모바일 한정으로 조정, (e) 회전 안내 DOM/CSS/JS 완전 삭제.
- **금지**: 새로운 게임 기능(새 난이도, 새 버튼 기능, 햅틱 라이브러리, 사운드), SPEC이 요구하지 않은 추가 오버레이, 데스크톱 레이아웃 변경, 기존 키보드/캔버스 탭 조작 로직의 의미 변경.
- **판단 기준**: "이 변경이 없으면 세로 모드에서 하단 키패드로 플레이가 불가능한가?" → YES면 허용, NO면 금지.

## 삭제 대상 (가로 회전 강제 UI/로직)

### `pages/game.html`
- `<div class="game-rotate-hint" id="rotateHint" ...>` 전체 블록(158~165행) **삭제**.

### `assets/css/game.css`
- "회전 안내 오버레이" 섹션 전체 삭제:
  - `.game-rotate-hint { ... }` 블록 (약 1080~1142행)
  - `html.light .game-rotate-hint { ... }` (약 1144~1146행)
  - `@keyframes gameRotateSpin { ... }` (약 1148~1151행)
  - `@media (prefers-reduced-motion: reduce)` 내부의 `.game-rotate-hint__icon { animation: none; }` 규칙(약 1182~1184행) 삭제.
- "가로 모드 전용" 레이아웃 블록 제거/정리:
  - `body.is-touch.is-portrait .game-joycons { display: none; }` → **삭제**(세로에서도 키패드 노출해야 함).
  - `body.is-touch.is-landscape { ... }` 블록(약 1012~1065행): **전체 삭제**. 세로가 유일한 모바일 모드가 되므로 landscape 전용 레이아웃은 불필요.
  - `@media (max-height: 360px) { body.is-touch.is-landscape .game-joycon__btn { ... } }`(1067~1074행): **삭제**.
- 조이콘 기본 스타일 주석(`/* 듀얼 조이콘 D-Pad (모바일 가로 모드 전용) ... */`)은 "모바일 세로 하단 키패드"로 **주석 문구 수정**.

### `assets/js/game.js`
- `function initOrientationHint()` 전체(약 2237~2265행) **삭제**.
- `DOMContentLoaded` 초기화 블록(약 2275행)의 `initOrientationHint();` 호출 **삭제**.
- `syncMobileLayoutClasses()`는 **제거**(`is-touch` / `is-portrait` / `is-landscape` 바디 클래스 분기가 더 이상 필요 없음). 초기화 블록(2273행)의 `syncMobileLayoutClasses();` 호출도 함께 삭제.
  - 단, `initTouchControls()`가 `isTouchDevice()` 체크로 이미 gating되므로 바디 클래스 의존 없이 동작한다.

## 신규 추가

### `pages/game.html` 변경사항
- 기존 `<div class="game-joycons" id="gameJoycons" aria-hidden="true" hidden>` 구조를 **단일 하단 고정 키패드로 재작성**:
  ```html
  <div class="game-keypad" id="gameKeypad" aria-hidden="true" hidden>
    <div class="game-keypad__dpad" role="group" aria-label="이동 키패드">
      <button class="game-keypad__btn game-keypad__btn--up"    type="button" data-dir="up"    aria-label="위로 이동">▲</button>
      <button class="game-keypad__btn game-keypad__btn--left"  type="button" data-dir="left"  aria-label="왼쪽으로 이동">◀</button>
      <button class="game-keypad__btn game-keypad__btn--right" type="button" data-dir="right" aria-label="오른쪽으로 이동">▶</button>
      <button class="game-keypad__btn game-keypad__btn--down"  type="button" data-dir="down"  aria-label="아래로 이동">▼</button>
    </div>
  </div>
  ```
- 배치 위치: `.game-stage` 내부, `.game-canvas-wrap` 바로 아래(`.game-controls` 위). 데스크톱에서는 CSS로 숨김.
- 기존 `id="gameJoycons"`와 `.game-joycon*` 클래스 구조는 **대체**(BEM 루트를 `.game-keypad`로 통일). 단, `data-dir` 속성은 그대로 유지해 JS가 재사용 가능하게 한다.
- `<div class="game-controls" aria-hidden="true">` 안내 텍스트 한 줄 추가(혹은 수정): "모바일: 하단 키패드 또는 화면 터치".

### `assets/css/game.css` 변경사항
- 기존 `.game-joycons`, `.game-joycon`, `.game-joycon__btn` 블록을 **`.game-keypad`, `.game-keypad__dpad`, `.game-keypad__btn` BEM 구조로 재작성**.
- 기본 상태(데스크톱): `.game-keypad { display: none; }` — `&[hidden] { display: none; }` 가드 포함.
- 노출 규칙: 터치 디바이스에서만 보이게 한다. 바디 클래스 제거에 맞춰 **미디어 쿼리만으로 제어**:
  ```css
  @media (hover: none) and (pointer: coarse) {
    .game-keypad:not([hidden]) {
      display: flex;
      justify-content: center;
      padding: 12px 8px 4px;
    }
  }
  ```
  (JS가 `hidden` 속성을 제거하면 나타남.)
- `.game-keypad__dpad`: `display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr); gap: 10px;` — 기존 조이콘의 십자 배치를 계승(up: col2/row1, left: col1/row2, right: col3/row2, down: col2/row3).
- `.game-keypad__btn` 스타일 — 기존 `.game-joycon__btn` 스타일을 **크기만 확대한 형태**로 계승:
  - `width: 72px; height: 72px;` (520px 이하에서 `72px` → 충분히 크게), `border-radius: 50%`, `border: 1px solid var(--border)`, `background: var(--bg-card)`, `color: var(--text-muted)`, `font-size: 22px`, `font-weight: 700`, `touch-action: none`, `user-select: none`, `-webkit-user-select: none`, `backdrop-filter: blur(14px) saturate(1.1)` + `-webkit-` 접두사, `transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.15s var(--spring-bounce)`.
  - `&:active, &.is-pressed`: `background: var(--brand-12); border-color: var(--brand-40); color: var(--brand-light); transform: scale(0.92); box-shadow: 0 0 22px var(--brand-14);`
  - `&:focus-visible`: `outline: 2px solid var(--brand-40); outline-offset: 2px;`
- 매우 작은 기기(≤380px width) 대응 — `@media (max-width: 380px) { .game-keypad__btn { width: 60px; height: 60px; font-size: 18px; } .game-keypad__dpad { gap: 8px; } }`.
- 캔버스 공간 확보 — 기존 `@media (max-width: 520px)` 블록 내부에 추가:
  - `.game-canvas-wrap { max-height: calc(100dvh - 340px); }` 정도(하단 키패드 ~280px + HUD/헤더 여유). 기존 `aspect-ratio: 16/10`은 유지.
- `@media (prefers-reduced-motion: reduce)` 블록 갱신:
  - `.game-keypad__btn { transition: none; }`
  - `.game-keypad__btn:active, .game-keypad__btn.is-pressed { transform: none; box-shadow: none; }`
  - (구 `.game-joycon__btn` 규칙 대체)
- 새 CSS 변수는 추가하지 않는다 — 기존 `--brand-*`, `--bg-card`, `--border`, `--radius`, `--spring-bounce` 재사용.

### `assets/js/main.js` 변경사항
- **없음**. 본 변경은 게임 페이지(`assets/js/game.js`)에 국한된다.

### `assets/js/game.js` 변경사항
- **기존 `initDualDpad()` 함수를 `initKeypad()`로 리네이밍/일반화**하고 다음과 같이 수정:
  - `const root = document.getElementById('gameKeypad');` (기존 `gameJoycons`에서 변경)
  - 내부 `root.querySelectorAll('.game-joycon__btn')` → `root.querySelectorAll('.game-keypad__btn')`로 변경.
  - `dpadPressCount` 객체와 레퍼런스 카운터 로직은 기존 그대로 유지(키보드/캔버스 탭과의 공존 안전장치). 단 **단일 D-Pad이므로 카운터가 1까지만 올라가는 정상 케이스**로 동작한다. 공존 안전성(예: 터치-다운 상태에서 오버레이가 뜨면 카운터 누락) 보장을 위해 구조는 유지.
  - `pointerdown` 시: `e.preventDefault()` + `setPointerCapture` + `state.keys[dir] = true` + `is-pressed` 추가(기존 로직 그대로).
  - `pointerup / pointercancel / pointerleave` 시: `state.keys[dir] = false` + `is-pressed` 제거(기존 로직 그대로).
  - 오버레이 열려 있으면(`isAnyOverlayOpen()`) 입력 무시(기존 가드 유지).
- **`clearDpadPressed()` 수정**:
  - 셀렉터를 `#gameKeypad .game-keypad__btn.is-pressed`로 변경. 나머지 카운터 리셋 로직은 그대로.
- **`initTouchControls()` 수정**:
  - `initDualDpad()` 호출 → `initKeypad()` 호출로 교체.
  - `initCanvasTapMove()`는 **그대로 유지**(키패드와 캔버스 탭 이동은 동시에 작동해도 안전 — 둘 다 같은 `state.keys[dir]` 레일을 토글함. 단, 탭 이동의 `clearKeys()`가 키패드로 눌린 키까지 지울 수 있으므로 아래 "주의사항" 참조).
- **`DOMContentLoaded` 초기화 블록 정리**:
  - `syncMobileLayoutClasses();` 호출 **삭제**.
  - `initOrientationHint();` 호출 **삭제**.
  - `if (isTouchDevice()) initTouchControls();` 는 그대로 유지.
- JSDoc 주석 갱신: "듀얼 조이콘(가로 전용)" → "모바일 하단 키패드(세로 전용)"로 문구 수정.

## 기능 상세

### 기능 1: 하단 고정 D-Pad 키패드
- 설명: 캔버스 아래에 십자 배열의 4방향 D-Pad를 상시 노출.
- 사용자 동작: 손가락으로 버튼을 누르면 해당 방향으로 이동, 떼면 정지. 대각선 이동은 **두 버튼 동시 터치**로 가능(Pointer Events 멀티 포인터 지원).
- 구현 위치: HTML(`.game-keypad`) + CSS(`.game-keypad__btn`) + JS(`initKeypad()`).
- 세부 요소:
  - 버튼 크기 72×72px (≤380px에서 60×60px). 사이 `gap: 10px`. 터치 타깃은 WCAG 권장 44×44px 초과.
  - `touch-action: none`으로 스크롤/확대 제스처 차단.
  - `data-dir` 값: `up`/`down`/`left`/`right`.
  - 눌림 피드백: `.is-pressed` 클래스 + 코럴핑크 글로우(`box-shadow: 0 0 22px var(--brand-14)`).

### 기능 2: 키보드/캔버스 탭/키패드 3-way 공존
- 설명: 기존 키보드(WASD/화살표) 및 캔버스 탭 이동 로직과 신규 키패드가 충돌 없이 동작.
- 사용자 동작: 데스크톱은 키보드, 모바일은 키패드/캔버스 탭 중 선호 방식 자유 선택.
- 구현 위치: JS — 3개 입력 소스 모두 `state.keys[dir]` 단일 상태를 토글하는 기존 패턴 재사용.
- 세부 요소:
  - 키패드의 release 시 `dpadPressCount[dir]`이 0일 때만 `state.keys[dir] = false` — 키보드 입력이 동시에 눌려 있으면 키보드가 keyup될 때까지 키 유지(기존 레퍼런스 카운터 로직 그대로).
  - 캔버스 탭 이동의 `clearKeys()`는 포인터가 캔버스를 벗어날 때 호출되므로 키패드 누름 중 캔버스를 추가 터치하면 현재 키가 초기화될 수 있다. 이는 **기존 landscape 모드와 동일한 동작**이므로 의도된 동작으로 간주(SPEC 범위 외 개선 금지).

### 기능 3: 터치 디바이스 감지 & 노출 제어
- 설명: 키패드는 터치 디바이스에서만 노출.
- 구현 위치: JS(`initTouchControls()` → `initKeypad()`가 `hidden` 속성을 제거) + CSS(`@media (hover:none) and (pointer:coarse)` 기본 숨김 해제).
- 세부 요소:
  - 초기값 `hidden + aria-hidden="true"` → `initKeypad()`에서 `root.hidden = false; root.setAttribute('aria-hidden', 'false');`.
  - 데스크톱(`isTouchDevice()` false)에서는 `initTouchControls` 자체가 호출되지 않으므로 `hidden`이 유지되어 숨김.
  - 바디 클래스(`is-touch`, `is-portrait`, `is-landscape`) 의존 제거.

## 주의사항

- **DOM id 변경 영향**: `gameJoycons` → `gameKeypad`로 이름이 바뀌므로, JS 내 모든 참조(`#gameJoycons` 셀렉터 포함)가 함께 갱신되어야 한다. 누락 시 키패드가 동작하지 않는다.
- **바디 클래스 제거 영향**: 다른 코드가 `body.is-touch`/`body.is-portrait`/`body.is-landscape`에 의존하지 않는지 확인. 다른 페이지(`index.html`)에는 영향 없음.
- **캔버스 높이 제약**: 세로 폰(예: iPhone SE 375×667)에서 상단 topbar + header + HUD + 캔버스 + 키패드(≈240px)가 한 화면에 들어가야 한다. `aspect-ratio: 16/10` 유지 + `max-height: calc(100dvh - 340px)`로 상한 부여.
- **접근성**: `aria-label`, `prefers-reduced-motion`, `:focus-visible` 모두 유지.
- **보안**: 이번 변경은 외부 데이터를 다루지 않으므로 `esc()`/`safeUrl()` 적용 대상 없음.
- **오버레이 중 입력 차단**: `isAnyOverlayOpen()` 가드 유지.
- **iOS Safari 홈 인디케이터 겹침**: `.game-keypad { padding-bottom: max(4px, env(safe-area-inset-bottom)); }` 권장.
