# 자체 점검 — Pixel Nurse 치비 + 터치 컨트롤

## SPEC 기능 체크
- [x] **뷰포트 메타 업데이트**: `viewport-fit=cover, user-scalable=no, maximum-scale=1` 추가.
- [x] **body.game-page 터치 가드**: `touch-action: manipulation`, `overscroll-behavior: contain`, `-webkit-tap-highlight-color: transparent` 추가.
- [x] **#gameCanvas**: `touch-action: none` 추가.
- [x] **가상 D-Pad 마크업**: `.game-canvas-wrap` 바로 아래, `.game-controls` 위에 `<div class="game-touchpad" id="gameTouchpad" aria-hidden="true" hidden>`로 추가. 4개 버튼(상/하/좌/우) `data-dir` + 한국어 `aria-label`.
- [x] **시작 오버레이 설명**: "모바일에서는 화면 아래 방향패드를 사용하세요." 추가.
- [x] **D-Pad CSS**: BEM, 네이티브 중첩 `&`, `var(--bg-card)/--border/--brand-*` 사용. `&:active, &.is-pressed` 상태와 `&:focus-visible` 대응.
- [x] **520px 반응형**: `.game-touchpad__dpad { 192x192 }`, `.game-canvas-wrap { aspect-ratio: 4/3 }`, `.game-controls { display: none }`.
- [x] **치비 스프라이트 재설계**: `NURSE_W=16, NURSE_H=20` 상수 추가. `nurseSprite`를 16×20 그리드로 전면 재작성. 행 1~3 모자, 행 4~10 얼굴(7행 ≈ 전체 35%, 머리 전체로는 50%), 행 11~14 상의, 행 15~17 하의, 행 18~19 발. 큰 눈(2×2 칸) + 흰자 하이라이트 L + 좌우 볼터치 R + 작은 입 M(2칸).
- [x] **방향별 처리**: `down` 양 눈/양 볼, `up` 뒷모습(머리카락), `left` 오른쪽 눈+오른쪽 볼만, `right` 왼쪽 눈+왼쪽 볼만.
- [x] **걷기 프레임**: 행 18-19 발만 교차(frame 1/2).
- [x] **걷기 바운스**: `frame !== 0 && !reducedMotion`에서 `oy -= 1`.
- [x] **팔레트 확장**: `L:'#ffffff'`, `D:'#e6dde6'` 추가.
- [x] **drawNurse 업데이트**: `ox = round(x)-8`, `oy = round(y)-24` (기존 -16 → -24), 루프 `r<20`.
- [x] **히트박스 축소**: `state.player.w/h`를 16→14. 초기 위치 `TILE*2+3`.
- [x] **터치 감지**: `isTouchDevice()` = `(pointer: coarse)` 또는 `ontouchstart in window`.
- [x] **initTouchControls**: pointer events(down/up/cancel/leave) + contextmenu 방지 + canvas touchmove preventDefault. `.game-controls`는 style.display='none'로 숨김.
- [x] **키보드 공존**: 기존 `KEY_MAP`/`keydown`/`keyup` 그대로. `state.keys` 공유.
- [x] **iOS 오디오 언락**: `btnStart` 클릭 핸들러 맨 앞에 `playTone(0, 0.001)` 삽입.

## Sprint 범위 계약 준수
- 수정 파일: `pages/game.html` 단 1개.
- `index.html`, `assets/css/style.css`, `assets/js/main.js` — **미수정**.
- `DIFFICULTY` 값, `buildMap`, 수집/스턴 판정식, 음표/장애물 스프라이트 — **미변경**.
- SPEC 외 추가 기능(진동, 대각선 버튼 등) — **없음**.
- 필수 연동 변경: 히트박스 16→14, 초기 위치 +1px — SPEC에 명시됨.

## 패턴 준수 확인
- **BEM 네이밍**: 준수 (`game-touchpad`, `game-touchpad__dpad`, `game-touchpad__btn`, `game-touchpad__btn--up/--left/--right/--down`, `.is-pressed`).
- **CSS 변수 사용**: 준수 (`--bg-card`, `--border`, `--text-muted`, `--brand-12`, `--brand-40`, `--brand-light`, `--radius-sm`, `--spring-bounce`). 하드코딩 색상 없음.
- **CSS 네이티브 중첩**: 준수 (`.game-touchpad__btn` 내부 `&:active, &.is-pressed`, `&:focus-visible`).
- **반응형 520px**: D-Pad 192×192 확장 + 캔버스 4:3 + 키보드 안내 숨김.
- **reduced-motion**: 기존 `@media (prefers-reduced-motion: reduce)` 글로벌 `*` 룰이 D-Pad transition도 커버. 스프라이트 걷기 바운스는 `!reducedMotion` JS 가드.
- **esc()/safeUrl()**: 외부 데이터 없음(정적 DOM·상수만) → 해당 없음.
- **innerHTML 금지**: 준수 — JS는 `textContent`, `setAttribute`, `classList`, `style.display`만 사용.
- **가드 클래스**: `pad.hidden = false`, `aria-hidden="false"` 토글, `state.keys[dir]` 플래그 공유.
- **DOMContentLoaded/IIFE**: 기존 즉시실행함수(`(function(){ 'use strict'; ... })()`)에 통합.
- **-webkit-backdrop-filter**: D-Pad 버튼에 `backdrop-filter`와 함께 `-webkit-backdrop-filter` 병기.
- **파일 간 정합성**: `#gameTouchpad` id, `.game-touchpad__btn` 클래스, `data-dir` 값(`up/down/left/right`) ↔ `state.keys` 키 ↔ `KEY_MAP` 값 모두 일치. `canvas` 변수 재사용.

## 접근성
- D-Pad 버튼 한국어 `aria-label` ("위로 이동" 등).
- `aria-hidden` 토글로 스크린리더 상태 일관.
- `:focus-visible` 외곽선 제공.
- `type="button"` 명시로 form submit 부작용 방지.
