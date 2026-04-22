# 자체 점검

전략: 최초 구현 (QA 이전) — SPEC 지시를 직접 반영.

## SPEC 기능 체크

### 삭제 대상
- [x] `pages/game.html`의 `#rotateHint` 블록 전체 삭제
- [x] `game.css`의 `.game-rotate-hint`, `html.light .game-rotate-hint`, `@keyframes gameRotateSpin`, reduced-motion 내부 `.game-rotate-hint__icon` 규칙 모두 삭제
- [x] `body.is-touch.is-portrait .game-joycons { display:none }` 삭제
- [x] `body.is-touch.is-landscape { ... }` 블록 전체 삭제
- [x] `@media (max-height: 360px) { body.is-touch.is-landscape .game-joycon__btn ... }` 삭제
- [x] `game.js`의 `initOrientationHint()` 함수 전체 + 호출 삭제
- [x] `syncMobileLayoutClasses()` 함수 + 호출 삭제

### 신규 추가
- [x] `.game-keypad > .game-keypad__dpad > .game-keypad__btn` BEM 구조로 단일 하단 키패드 HTML 작성 (`.game-stage` 내부, `.game-canvas-wrap` 바로 아래, `.game-controls` 위)
- [x] `data-dir="up|down|left|right"` 속성 유지
- [x] `.game-controls`에 "모바일: 하단 키패드 또는 화면 터치" 안내 추가
- [x] CSS: `.game-keypad` 기본 `display:none` + `&[hidden]` 가드
- [x] `@media (hover:none) and (pointer:coarse)` 에서 `.game-keypad:not([hidden]) { display:flex; justify-content:center; padding:12px 8px 4px }`
- [x] `.game-keypad__dpad` grid 3×3, gap 10px, 십자 배치
- [x] `.game-keypad__btn` 72×72px, border-radius 50%, glassmorphism(backdrop-filter + -webkit-), transition, `:active/.is-pressed` 코럴핑크 글로우, `:focus-visible` outline
- [x] `@media (max-width: 380px)` 버튼 60×60px, font-size 18px, dpad gap 8px
- [x] `@media (max-width: 520px)`에 `.game-canvas-wrap { max-height: calc(100dvh - 340px) }` 추가
- [x] reduced-motion 블록에 `.game-keypad__btn` 규칙(transition none + active/is-pressed 상태 중립화) 추가
- [x] 새 `:root` 변수 추가 없음 (기존 `--brand-*`, `--bg-card`, `--border`, `--radius`, `--spring-bounce` 재사용)
- [x] iOS safe-area: `padding-bottom: max(4px, env(safe-area-inset-bottom))` 적용
- [x] JS: `initDualDpad()` → `initKeypad()`로 리네이밍, `gameJoycons` → `gameKeypad`, `.game-joycon__btn` → `.game-keypad__btn`
- [x] `clearDpadPressed()` 셀렉터 `#gameKeypad .game-keypad__btn.is-pressed`로 갱신
- [x] `initTouchControls()`에서 `initKeypad()` 호출, `initCanvasTapMove()` 유지
- [x] `DOMContentLoaded` 초기화에서 `syncMobileLayoutClasses()` / `initOrientationHint()` 호출 삭제
- [x] JSDoc 주석 "모바일 하단 키패드(세로 전용)"로 갱신
- [x] `dpadPressCount` 레퍼런스 카운터 구조 유지 (키보드/탭 공존)
- [x] `isAnyOverlayOpen()` 가드 유지

## 패턴 준수 확인

- BEM 네이밍: 준수 — `.game-keypad` / `.game-keypad__dpad` / `.game-keypad__btn` / `--up/--down/--left/--right` modifier
- CSS 변수 사용: 준수 — 하드코딩 색상 없음, 기존 `--brand-*`, `--bg-card`, `--border`, `--spring-bounce` 재사용
- CSS 네이티브 중첩: 준수 — `&` 문법만 사용, SCSS 없음
- 반응형 520px: 대응 — `.game-canvas-wrap` max-height 추가, 380px 브레이크포인트는 SPEC 명시로 추가 (매우 작은 기기용)
- reduced-motion: 대응 — `.game-keypad__btn` transition/active 규칙 갱신
- esc()/safeUrl(): 해당 없음 — 외부 데이터 처리 없음
- 가드 클래스: 준수 — `initKeypad()` 내부 `if (!root) return;`, `initTouchControls()` 내부 `if (!canvas) return;` 유지
- DOMContentLoaded 등록: 유지 — `if (isTouchDevice()) initTouchControls();` 호출이 `initKeypad()`를 체이닝
- -webkit-backdrop-filter: 함께 작성 — `.game-keypad__btn`에서 쌍으로 명시
- 파일 간 정합성:
  - HTML `id="gameKeypad"` ↔ JS `getElementById('gameKeypad')` 일치
  - HTML `.game-keypad__btn` ↔ CSS `.game-keypad__btn` ↔ JS `.game-keypad__btn` 셀렉터 일치
  - `data-dir` 속성 HTML↔JS 일치
  - 제거된 `gameJoycons`/`.game-joycon*`/`#rotateHint`/`is-touch`/`is-portrait`/`is-landscape` 참조 전역 삭제 완료 (Grep 결과 SPEC.md 외 잔존 없음)

## 범위 준수
- SPEC 허용 범위 (a)~(e) 모두 반영, 금지 항목(새 기능, 추가 오버레이, 데스크톱 레이아웃 변경, 기존 조작 로직 의미 변경) 위반 없음.
- `dpadPressCount` 구조는 SPEC 지시대로 유지 (단일 D-Pad여도 키보드/캔버스 탭과의 공존 안전장치).
