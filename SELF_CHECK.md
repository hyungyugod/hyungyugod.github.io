# 자체 점검

전략: Case A — 이유: 초기 구현 (QA 피드백 전)

## SPEC 기능 체크
- [x] **기능 1: 듀얼 D-Pad 표시** — `#gameJoycons` 오버레이 + 좌/우 `.game-joycon` L자 배치 완료. `data-dir` 6개 버튼.
- [x] **기능 2: 터치 → 키 상태 브릿지** — `initDualDpad()`에서 Pointer Events로 `state.keys[dir]` 직접 조작. `setPointerCapture` 사용 (try/catch로 안전).
- [x] **기능 3: 시각적 피드백** — `.is-pressed` 클래스 + `:active` 모두에 `scale(0.92)` + `box-shadow: 0 0 18px var(--brand-14)` 글로우.
- [x] **기능 4: 캔버스 축소** — `@media (max-width:520px) landscape`에서 `.game-canvas-wrap { max-width: calc(100vw - 280px); }`.
- [x] **기능 5: 조건부 가시성** — 기본 `display: none`; landscape 모바일에서만 `display: flex`; portrait는 `!important`로 재숨김.
- [x] **부가: 기존 `.game-touchpad` 블록 완전 제거** — HTML/CSS에서 삭제 (JS에는 원래 바인딩 없었음).
- [x] **부가: 오버레이 전환 시 `is-pressed` 정리** — `clearDpadPressed()`를 `startGame`/`endGame`에서 호출.
- [x] **부가: height ≤ 360px 초소형 landscape** — 버튼 `48×48` 축소 (별도 media query, 중첩 회피).

## 패턴 준수 확인
- BEM 네이밍: 준수 (`.game-joycons`, `.game-joycon`, `.game-joycon--left/--right`, `.game-joycon__btn`, `.game-joycon__btn--up/--left/--right/--down`)
- CSS 변수 사용: 준수 (하드코딩 색상 없음; `--bg-card`, `--border`, `--brand-12`, `--brand-40`, `--brand-14`, `--brand-light`, `--text-muted`, `--spring-bounce` 사용)
- CSS 네이티브 중첩: 준수 (`&:active`, `& .game-joycon__btn--up` 등). `@media` 중첩은 의도적으로 플랫 처리하여 호환성 최대화.
- 반응형 520px: 대응 (`max-width: 520px` + `orientation: landscape/portrait` 분기)
- reduced-motion: 대응 (`transition: none`, `&:active/.is-pressed` 시 `transform: none; box-shadow: none;`)
- esc()/safeUrl(): 해당 없음 (외부 데이터 없음, 정적 HTML 버튼만)
- 가드 클래스: 준수 (`if (!root) return;`, `if (!dir) return;`)
- DOMContentLoaded 등록: 기존 `if (isTouchDevice()) initTouchControls();` 흐름 그대로 사용, 내부에서 `initDualDpad()` 호출
- -webkit-backdrop-filter: 함께 작성 (`backdrop-filter`/`-webkit-backdrop-filter` 모두)
- 파일 간 정합성: `#gameJoycons`(HTML) ↔ `document.getElementById('gameJoycons')`(JS) ↔ `.game-joycons`(CSS) 일치. `data-dir` ↔ `state.keys[dir]` 일치.

## 범위 준수
- SPEC "허용": `#gameTouchpad` 제거, `initDualDpad()` 호출 추가, 가로 모드 캔버스 `max-width` 재조정 — 모두 적용
- SPEC "금지" 미침범: 게임 로직 무변경, 새 기능 없음, 색상/폰트/테마 변수 미추가, index.html/style.css/main.js 미수정

## z-index 계층
- 조이콘 30 < 시작/종료 오버레이 50 < 회전 안내 100 — SPEC 준수
