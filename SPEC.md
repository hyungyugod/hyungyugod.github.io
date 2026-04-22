# SPEC.md — 모바일 닌텐도 스타일 듀얼 D-Pad 조이콘 컨트롤

## 개요
모바일 가로 모드에서 게임 캔버스가 일부 기기에서 잘리는 문제를 해결하기 위해 캔버스를 축소하고, 양옆에 닌텐도 조이콘 스타일의 가상 방향 키패드 오버레이를 배치한다. 왼쪽 패드는 위/왼쪽/아래 3방향(L자), 오른쪽 패드는 위/오른쪽/아래 3방향(역L자)으로 구성되며, 기존 키보드/캔버스 탭 입력과 동일한 `state.keys` 레일을 공유한다.

## 변경 유형
**혼합** — 새 UI 컴포넌트(디자인) + 터치 입력 처리 로직(기능). 평가 기준은 "기능 변경 평가 기준"을 적용한다.

## 디자인 언어 & 의도
닌텐도 Switch 조이콘처럼, 화면 좌우의 반투명 글래스 버튼이 "휴대용 콘솔을 쥔" 감각을 준다. glassmorphism(`backdrop-filter: blur` + `var(--bg-card)`)과 코럴핑크 강조(`var(--brand-40)`, `var(--brand-12)`)로 사이트 정체성을 유지하면서, 눌렀을 때 `scale(0.92)` + 브랜드 글로우가 번지는 촉각적 피드백으로 게임의 리듬감을 물리적으로 확장한다.

## Sprint 범위 계약
Generator가 SPEC 외 변경을 하려 할 때의 판단 기준:
- **허용**:
  - `#gameTouchpad`(단일 D-pad) 기존 요소 제거/교체 — 새 듀얼 D-pad로 대체되므로 필수
  - `initTouchControls()` 내부에서 `initDualDpad()` 호출 추가
  - 가로 모드 `.game-canvas-wrap` max-height / max-width 수치 재조정 (D-pad 공간 확보)
- **금지**:
  - 게임 로직(플레이어 이동, 충돌, 스폰, 컷씬, 스코어) 수정
  - 새로운 게임 기능 추가 (일시정지 버튼, A/B 액션 버튼 등)
  - 색상 팔레트 변경, 폰트 변경, 새 테마 변수 추가
  - index.html, assets/css/style.css, assets/js/main.js 수정 (이 게임은 별도 파일)
- **판단 기준**: "이 변경이 없으면 듀얼 D-pad가 정상 동작하지 않는가?" → YES면 허용.

## 변경 범위

### pages/game.html 변경사항
기존 `<div class="game-touchpad" id="gameTouchpad">` 블록을 **제거**하고, `.game-stage` 섹션 내부에 다음 구조를 추가한다:

```html
<div class="game-joycons" id="gameJoycons" aria-hidden="true" hidden>
  <div class="game-joycon game-joycon--left" data-side="left">
    <button class="game-joycon__btn game-joycon__btn--up"   type="button" data-dir="up"   aria-label="위로 이동">▲</button>
    <button class="game-joycon__btn game-joycon__btn--left" type="button" data-dir="left" aria-label="왼쪽으로 이동">◀</button>
    <button class="game-joycon__btn game-joycon__btn--down" type="button" data-dir="down" aria-label="아래로 이동">▼</button>
  </div>
  <div class="game-joycon game-joycon--right" data-side="right">
    <button class="game-joycon__btn game-joycon__btn--up"    type="button" data-dir="up"    aria-label="위로 이동">▲</button>
    <button class="game-joycon__btn game-joycon__btn--right" type="button" data-dir="right" aria-label="오른쪽으로 이동">▶</button>
    <button class="game-joycon__btn game-joycon__btn--down"  type="button" data-dir="down"  aria-label="아래로 이동">▼</button>
  </div>
</div>
```

레이아웃 전략: `.game-joycons`를 `position: fixed` 오버레이로 두고, 좌/우 조이콘은 각각 뷰포트 좌/우 가장자리에 고정한다. 기존 `.game-controls` 힌트 텍스트(데스크톱 전용)는 유지.

### assets/css/game.css 변경사항

**기존 `.game-touchpad` 관련 규칙 전체 제거**.

**새로 추가할 규칙**:

1. `.game-joycons` — 기본 `display: none;` (데스크톱에서 숨김), `[hidden]` 속성 시 `display: none`.
2. `.game-joycon` — grid 2×3, gap `8px`, 투명 배경. `pointer-events: none`, 자식 버튼만 `pointer-events: auto`.
3. `.game-joycon__btn`:
   - 크기: `56px × 56px` (기본), `48px × 48px` (height ≤ 360px landscape)
   - `border-radius: 50%`
   - `border: 1px solid var(--border)`, `background: var(--bg-card)`
   - `backdrop-filter: blur(14px) saturate(1.1)` + `-webkit-` 접두사
   - `color: var(--text-muted)`, font-size 18px, font-weight 700
   - `touch-action: none`, `user-select: none`, `-webkit-user-select: none`
   - `transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.15s var(--spring-bounce)`
   - `&:active`, `&.is-pressed`: `background: var(--brand-12); border-color: var(--brand-40); color: var(--brand-light); transform: scale(0.92); box-shadow: 0 0 18px var(--brand-14);`
   - `&:focus-visible`: `outline: 2px solid var(--brand-40); outline-offset: 2px;`

4. L자 배치 (grid 2×3):
   - `.game-joycon--left` → `grid-template-columns: 1fr 1fr`, 버튼 배치: up(col 2 row 1), left(col 1 row 2), down(col 2 row 3)
   - `.game-joycon--right` → up(col 1 row 1), right(col 2 row 2), down(col 1 row 3)

5. **반응형 & 배치**:
   - 데스크톱(521px 이상): `.game-joycons { display: none; }`
   - `@media (max-width: 520px) and (orientation: landscape)`:
     - `.game-joycons`: `position: fixed; inset: 0; display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; pointer-events: none; z-index: 30;`
     - `.game-canvas-wrap`: `max-width: calc(100vw - 280px); margin-inline: auto;` (양옆 조이콘 140px씩 공간 확보)
   - `@media (max-width: 520px) and (orientation: portrait)`: `.game-joycons { display: none !important; }`

6. `@media (prefers-reduced-motion: reduce)`:
   - `.game-joycon__btn { transition: none; }`
   - `.game-joycon__btn:active, .game-joycon__btn.is-pressed { transform: none; box-shadow: none; }`

### assets/js/game.js 변경사항

**추가할 함수**: `initDualDpad()`를 `initTouchControls()` 내부에서 호출.

**함수 스펙 `initDualDpad()`**:
- 가드: `const root = document.getElementById('gameJoycons'); if (!root) return;`
- 가시화: `root.hidden = false; root.setAttribute('aria-hidden', 'false');`
- 각 버튼마다 로컬 `activePointerId = null`로 Pointer Events 기반 바인딩:
  - `pointerdown`: `if (isAnyOverlayOpen()) return; e.preventDefault(); activePointerId = e.pointerId; btn.setPointerCapture(e.pointerId); state.keys[dir] = true; btn.classList.add('is-pressed');`
  - `pointerup`, `pointercancel`, `pointerleave`: `if (e.pointerId !== activePointerId) return; activePointerId = null; state.keys[dir] = false; btn.classList.remove('is-pressed');`
  - `contextmenu`: `e.preventDefault()`
- 동시 입력 지원 (대각선 이동)
- 오버레이 열림 시 `is-pressed` 클래스 정리 필요 (`endGame`/`startGame` 시점에 querySelectorAll로 제거)

**등록 위치**: `if (isTouchDevice()) initTouchControls();` 유지. `initTouchControls()` 함수 마지막 줄에 `initDualDpad();` 추가.

## 기능 상세

### 기능 1: 듀얼 D-Pad 표시
- 가로 모드 모바일에서 좌/우 가장자리에 `position: fixed`로 뜸
- 총 6개 버튼, `data-dir`로 방향 식별

### 기능 2: 터치 → 키 상태 브릿지
- `state.keys[dir]` 직접 조작 (기존 키보드 경로 재사용)
- `setPointerCapture`로 버튼 영역 이탈 시에도 up 보장

### 기능 3: 시각적 피드백
- `is-pressed` 클래스 → scale + 브랜드 글로우

### 기능 4: 캔버스 축소
- `max-width: calc(100vw - 280px)` → 작은 기기에서도 캔버스 완전 표시

### 기능 5: 조건부 가시성
- 데스크톱/세로 모드/비터치 기기에서 완전 숨김

## 주의사항
- 기존 `.game-touchpad` 블록(죽은 코드) 제거 — JS 바인딩 없으므로 안전
- 기존 `initCanvasTapMove()` 유지 — 공존
- z-index: 조이콘(30) < 시작/종료 오버레이(50) < 회전 안내(100)
- 보안: 외부 데이터 없음, `esc`/`safeUrl` 불필요
- 접근성: 한국어 aria-label, `prefers-reduced-motion` 대응
