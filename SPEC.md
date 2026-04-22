# SPEC.md

## 개요
모바일(좁은 뷰포트) 환경에서 기존 가상 D-pad(키패드)를 제거하고, 대신 가로 방향(landscape)으로 눕힌 상태에서 캔버스 맵을 최대한 크게 키운 뒤, 맵을 터치하면 플레이어 기준 상대 방향으로 이동하는 방식으로 조작을 바꾼다. 세로 방향(portrait)일 때는 "가로로 돌려주세요" 안내 오버레이를 띄워 회전을 유도한다. 데스크탑 키보드 조작(WASD/화살표)은 기존과 동일하게 유지된다.

## 변경 유형
**혼합** (UI 레이아웃 + 입력 로직 변경)

## 디자인 언어 & 의도
모바일에서 작은 화면을 방향패드가 절반 가까이 잡아먹던 구조를 없애고, 화면 전체가 "게임판 그 자체"가 되도록 재구성한다. 플레이어 캐릭터를 손가락으로 직접 "끌어당기듯" 탭하는 인터랙션은 픽셀 보드게임 같은 촉감을 주며, 손가락이 캐릭터를 가리지 않도록 탭 지점이 곧 이동 방향의 힌트가 된다. 코럴핑크 브랜드 톤의 회전 안내 오버레이와 glassmorphism 카드가 세로→가로 전환을 유도하는 온보딩 모먼트로 작동한다.

## Sprint 범위 계약
**포함**:
- `@media (max-width:520px)` 환경에서 orientation 기반 레이아웃 분기 (portrait/landscape)
- portrait일 때 "기기를 가로로 돌려주세요" 풀스크린 안내 오버레이 표시
- landscape일 때 D-pad 완전 숨김 + 캔버스 영역을 viewport에 꽉 차도록 확대
- 캔버스 영역에 포인터(탭) 기반 방향 입력 핸들러 추가 — 플레이어 셀 중심 vs 탭 좌표 비교로 4방향 판정
- 기존 `initTouchControls()` 로직 중 D-pad 부분 제거/대체

**제외 (금지)**:
- 데스크탑 키보드 입력 경로 변경 (그대로 유지)
- 게임 로직(속도/충돌/스폰/난이도) 수정
- 새로운 제스처(스와이프, 핀치, 더블탭 등) 추가 — 이번 스프린트는 "단순 탭 방향 이동"만
- 메인 사이트(`index.html`, `style.css`, `main.js`) 파일은 건드리지 않음 — 게임 페이지 3파일만 수정
- orientation lock API 사용 금지 (브라우저 호환성 이슈, 안내만 표시)

**판단 기준**: "이 변경이 없으면 SPEC 기능(가로 회전 + 탭 이동)이 제대로 동작하지 않는가?" → YES면 허용, NO면 금지.

## 변경 범위

### pages/game.html
1. `.game-canvas-wrap` 근처에 회전 안내 오버레이 추가:
```html
<div class="game-rotate-hint" id="rotateHint" role="dialog" aria-labelledby="rotateHintTitle" aria-hidden="true" hidden>
  <div class="game-rotate-hint__panel">
    <span class="game-rotate-hint__icon" aria-hidden="true">⟳</span>
    <h2 class="game-rotate-hint__title" id="rotateHintTitle">기기를 가로로 돌려주세요</h2>
    <p class="game-rotate-hint__desc">가로 모드에서 맵을 터치해 이동합니다.</p>
  </div>
</div>
```
2. `.game-touchpad` 블록은 HTML에 그대로 두되 CSS/JS로 숨김 처리.
3. 시작 오버레이 `.game-overlay__hint` 문구: "모바일 방향패드" → "모바일: 화면을 터치한 방향으로 이동".

### assets/css/game.css

1. **회전 안내 오버레이 (신규)** `.game-rotate-hint`:
   - `position: fixed; inset: 0; z-index: 상위`
   - glassmorphism 패널 (`var(--bg-card)`, `backdrop-filter: blur(14px)`, `var(--radius)`, `var(--border)`)
   - 기본 `hidden` (JS 제어), 모바일 portrait에서만 노출
   - `.game-rotate-hint__icon` 애니메이션 `@keyframes gameRotateSpin`
   - `prefers-reduced-motion: reduce` 시 회전 애니메이션 제거

2. **모바일 portrait** `@media (max-width:520px) and (orientation: portrait)`:
   - `.game-touchpad { display: none !important; }`

3. **모바일 landscape** `@media (max-width:520px) and (orientation: landscape)`:
   - `.game-touchpad { display: none !important; }`
   - `.game-topbar`, `.game-footer`, 페이지 헤더 숨김
   - `.game-shell { padding: 4px; gap: 4px; max-width: 100%; }`
   - `.game-canvas-wrap { aspect-ratio: 16/10; max-height: calc(100dvh - 약 60px); max-width: 100%; margin-inline: auto; }`
   - 캔버스에 `touch-action: none; cursor: pointer;`

### assets/js/game.js

1. **`initTouchControls()` 리팩터**:
   - D-pad `pad.hidden = false` 및 버튼 루프 제거.
   - `canvas` `touchmove` preventDefault 유지.
   - 내부에서 `initCanvasTapMove()` 호출.

2. **신규 `initCanvasTapMove()`**:
   - `pointerdown`/`pointermove`/`pointerup`/`pointercancel`/`pointerleave` 리스너(`{ passive: false }`, 필요 시 `preventDefault`).
   - 좌표 환산:
     ```
     const rect = canvas.getBoundingClientRect();
     const scaleX = CANVAS_W / rect.width;
     const scaleY = CANVAS_H / rect.height;
     const tx = (e.clientX - rect.left) * scaleX;
     const ty = (e.clientY - rect.top) * scaleY;
     ```
   - 플레이어 중심 `px, py` 대비 `dx, dy`. 데드존 `TILE * 0.4`.
   - 우세 축 기반 4방향 결정 → `state.keys`의 `up/down/left/right` 하나만 true.
   - `pointerup/cancel/leave`에서 모든 방향 false.
   - `pointermove`에서 드래그 중 방향 실시간 갱신.
   - 오버레이(`overlayStart`, `overlayCutscene`, `overlayEnd`)가 활성 상태면 early-return.

3. **신규 `initOrientationHint()`**:
   - `matchMedia('(max-width: 520px) and (orientation: portrait)')`.
   - 일치 시 `#rotateHint` 보이기(`hidden=false`, `aria-hidden=false`, `.is-visible`), 아니면 숨김.
   - 초기 1회 + `change` 리스너.

4. **초기화**:
   - `if (isTouchDevice()) initTouchControls();` 유지 (내부에서 `initCanvasTapMove()` 호출).
   - `initOrientationHint();` 무조건 호출.

5. **데스크탑 키보드 경로 변경 없음**.

## 수락 기준
1. 데스크탑(>520px): 시각/동작 차이 없음, 키보드 이동 정상.
2. 모바일 portrait(≤520px): 회전 안내 오버레이 표시, D-pad 숨김.
3. 모바일 landscape(≤520px): 오버레이 숨김, 캔버스가 16:10 비율 유지하며 화면 꽉 참, 헤더/푸터/탑바 숨김 또는 최소화.
4. landscape에서 캔버스 플레이어 우/좌/위/아래 탭 시 해당 방향 이동.
5. 드래그 중 방향 실시간 갱신, 떼면 정지.
6. 데드존 내 탭은 정지.
7. 오버레이 활성 중 캔버스 탭은 이동 입력 아님.
8. `prefers-reduced-motion: reduce`에서 회전 아이콘 애니메이션 제거.
9. 콘솔 에러 0건.
10. 캔버스 탭 핸들러는 `isTouchDevice()` 조건 하에서만 등록하여 데스크탑 키보드 흐름 방해 없음.

## 주의사항
- `state.keys`를 키보드와 공유하므로 탭 핸들러는 `isTouchDevice()` 조건 필수.
- `touch-action: none`으로 스크롤/줌 제스처 방지.
- `100dvh` 사용, fallback `100vh`.
- `#rotateHint`에 `role="dialog"` + `aria-labelledby` 부여.
