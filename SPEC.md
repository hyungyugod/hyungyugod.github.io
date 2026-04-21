# Pixel Nurse — 치비 얼굴 강화 + 모바일 터치 플레이 지원

## 개요
게임 페이지(`pages/game.html`)의 픽셀 간호사 캐릭터를 현재의 "일반 두등신"에서 **머리 비중이 큰 치비/SD 스타일**로 재설계하여 귀여움을 극대화한다. 동시에 키보드 전용이던 조작을 **가상 D-Pad 기반 터치 컨트롤**로 확장해 모바일/태블릿에서도 온전히 플레이 가능하게 만든다. 게임 로직(속도/난이도/수집/장애물/점수)은 일절 건드리지 않는다.

## 변경 유형
**혼합** (디자인: 스프라이트 리디자인 / 기능: 터치 입력 + 반응형 캔버스 뷰포트)

## 디자인 언어 & 의도
간호사는 **얼굴이 전체 신장의 절반에 가까운 2.2등신 치비**로 바뀐다. 커다란 동그란 눈, 얼굴 양쪽의 도톰한 볼터치, 배시시 웃는 작은 입이 한눈에 "귀여움"으로 읽혀야 하며, 몸과 다리는 상대적으로 작고 아담해져 움직일 때 통통 튀는 느낌을 준다. 사이트의 코럴핑크(`--brand`) 팔레트는 얼굴 악센트(볼·입·모자 십자가)에 집중 배치해 픽셀 캔버스 안에서도 브랜드 톤이 그대로 살아나도록 한다.

## Sprint 범위 계약
- **허용**: `pages/game.html` 내부의 인라인 `<style>`, 인라인 `<script>`, 그리고 `<body>` 마크업 수정. 새 DOM(가상 D-Pad)과 그에 필요한 이벤트 핸들러/상수 추가. 기존 `nurseSprite`/`drawNurse` 전면 재작성 및 히트박스 상수 변경. `KEY_MAP`에 대응하는 `state.keys` 방향 플래그를 터치 입력에서도 그대로 on/off 하도록 공유.
- **금지**: `index.html`, `assets/css/style.css`, `assets/js/main.js` 수정. `DIFFICULTY` 표의 speed/notes/noteTtl/obstacles/obsSpeed/stun 값 변경. 맵 구조(`buildMap`) 변경. 수집/스턴 판정식 변경. 음표/장애물 스프라이트 변경. 새 파일 생성. 라이브러리 추가.
- **판단 기준**: "이 변경이 없으면 치비 얼굴이 제대로 보이지 않는가 / 모바일에서 조작이 불가능한가?" → YES면 허용, NO면 금지. 예: 히트박스(`player.w/h`)를 16→14로 줄이는 것은 큰 머리가 벽에 박혀 보이지 않게 하기 위한 최소 연동 → 허용. "터치할 때 진동 피드백 추가" → SPEC에 없고 필수 아님 → 금지.

---

## 변경 범위

### pages/game.html — `<head>` 메타
- `<meta name="viewport">`에 `viewport-fit=cover, user-scalable=no, maximum-scale=1` 추가 → iOS 더블탭 줌·핀치줌으로 인한 게임 조작 방해 방지.
- 모바일 터치 제스처가 페이지 스크롤/새로고침을 트리거하지 않도록 `body.game-page`에 `overscroll-behavior: contain; touch-action: manipulation;` 스타일 추가.

### pages/game.html — `<body>` 마크업
- `.game-canvas-wrap` **바로 아래**(`.game-controls` 위)에 가상 D-Pad 컨테이너 추가:
  ```
  <div class="game-touchpad" id="gameTouchpad" aria-hidden="true" hidden>
    <div class="game-touchpad__dpad">
      <button class="game-touchpad__btn game-touchpad__btn--up"    type="button" data-dir="up"    aria-label="위로 이동">▲</button>
      <button class="game-touchpad__btn game-touchpad__btn--left"  type="button" data-dir="left"  aria-label="왼쪽으로 이동">◀</button>
      <button class="game-touchpad__btn game-touchpad__btn--right" type="button" data-dir="right" aria-label="오른쪽으로 이동">▶</button>
      <button class="game-touchpad__btn game-touchpad__btn--down"  type="button" data-dir="down"  aria-label="아래로 이동">▼</button>
    </div>
  </div>
  ```
- 기존 `.game-controls` 블록(키보드 안내)은 그대로 둔다. 단 JS에서 터치 환경으로 감지되면 `.game-controls`는 `display:none`으로, `#gameTouchpad`는 `hidden` 제거 + `aria-hidden="false"`.
- 시작 오버레이의 안내 문구 `.game-overlay__desc`에 모바일용 보조 문장 삽입: "모바일에서는 화면 아래 방향패드를 사용하세요."

### pages/game.html — `<style>` 내부 CSS 추가/수정
1. **body.game-page** 규칙에 추가: `touch-action: manipulation;`, `overscroll-behavior: contain;`, `-webkit-tap-highlight-color: transparent;`
2. **`#gameCanvas`**: `touch-action: none;` 추가.
3. **가상 D-Pad 컴포넌트** (BEM, `var(--bg-card)`/`var(--border)`/`var(--brand-*)` 사용, 네이티브 중첩 `&`):
   ```
   .game-touchpad { width:100%; display:flex; justify-content:center; padding:4px 0 0; }
   .game-touchpad[hidden] { display:none; }
   .game-touchpad__dpad {
     position:relative; width:168px; height:168px;
     display:grid; grid-template-columns:repeat(3,1fr); grid-template-rows:repeat(3,1fr); gap:6px;
   }
   .game-touchpad__btn {
     border:1px solid var(--border); background:var(--bg-card); color:var(--text-muted);
     border-radius:var(--radius-sm); font-size:18px; font-weight:700;
     cursor:pointer; user-select:none; -webkit-user-select:none; touch-action:none;
     backdrop-filter:blur(14px) saturate(1.1); -webkit-backdrop-filter:blur(14px) saturate(1.1);
     transition:background .15s, border-color .15s, color .15s, transform .15s var(--spring-bounce);
     &:active, &.is-pressed {
       background:var(--brand-12); border-color:var(--brand-40); color:var(--brand-light); transform:scale(.94);
     }
     &:focus-visible { outline:2px solid var(--brand-40); outline-offset:2px; }
   }
   .game-touchpad__btn--up    { grid-column:2; grid-row:1; }
   .game-touchpad__btn--left  { grid-column:1; grid-row:2; }
   .game-touchpad__btn--right { grid-column:3; grid-row:2; }
   .game-touchpad__btn--down  { grid-column:2; grid-row:3; }
   ```
4. **`@media (max-width: 520px)`** 블록 내부에 추가:
   - `.game-touchpad__dpad { width: 192px; height: 192px; }`
   - `.game-canvas-wrap { aspect-ratio: 4 / 3; }`
   - `.game-controls { display: none; }`

### pages/game.html — `<script>` 내부 JS 변경

#### A. 스프라이트 재설계 — 치비 비율
- **신규 상수**: `const NURSE_W = 16; const NURSE_H = 20;` (세로 긴 스프라이트).
- **`nurseSprite(dir, frame)` 전면 재작성**: 16×20 그리드.
  - 행 0~1: 투명/모자 윗단
  - 행 1~3: 간호사 모자(흰 `W`), 중앙 코럴 십자 `C`
  - 행 3~10: **얼굴 8행(전체 40%)** — 앞머리 `H`, 얼굴 피부 `S`, 큰 눈 `E`(2칸 폭 2행 높이, 흰자 `L` 1칸), 좌우 볼터치 `R`, 중앙 작은 입 `M`
  - 행 11~14: 몸통(흰 `W`, 가슴 코럴 십자 `C`)
  - 행 15~17: 하의 `P`
  - 행 18~19: 발 `B` (걷기 프레임에서 좌우 교차)
- **방향별 처리**: `down` 정면 두 눈 / `up` 눈 한 행 위 or 뒷모습 / `left` 오른쪽 눈만 + 한쪽 볼 / `right` 좌우 반전.
- **걷기 프레임**: 15~19행만 교차. 1프레임 바운스(`frame!==0 && !reducedMotion`에서 `oy -= 1`).
- **팔레트 확장**: 기존 `S,H,W,C,P,B,E,R,M` + `L: '#ffffff'`(흰자 하이라이트), `D: '#e6dde6'`(모자 음영).
- **`drawNurse(x,y,dir,frame)`**: `SCALE=2`, `ox = Math.round(x)-8`, **`oy = Math.round(y)-24`**(기존 -16에서 변경), 루프 상한 `r<20`.
- **히트박스 축소**: `state.player.w = 14; state.player.h = 14;` (초기값). `player.x/y` 초기값 `TILE*2+3`으로 3px 안쪽 조정.

#### B. 모바일 터치 컨트롤
- **감지 함수**:
  ```
  function isTouchDevice() {
    return window.matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window);
  }
  ```
- **`initTouchControls()`** (초기화 시 호출):
  ```
  function initTouchControls() {
    const pad = document.getElementById('gameTouchpad');
    if (!pad) return;
    pad.hidden = false;
    pad.setAttribute('aria-hidden', 'false');
    const controlsHint = document.querySelector('.game-controls');
    if (controlsHint) controlsHint.style.display = 'none';
    const btns = pad.querySelectorAll('.game-touchpad__btn');
    btns.forEach(btn => {
      const dir = btn.dataset.dir;
      const press = (e) => { e.preventDefault(); state.keys[dir] = true;  btn.classList.add('is-pressed'); };
      const release=(e) => { e.preventDefault(); state.keys[dir] = false; btn.classList.remove('is-pressed'); };
      btn.addEventListener('pointerdown',   press,   { passive:false });
      btn.addEventListener('pointerup',     release, { passive:false });
      btn.addEventListener('pointercancel', release, { passive:false });
      btn.addEventListener('pointerleave',  release, { passive:false });
      btn.addEventListener('contextmenu', e => e.preventDefault());
    });
    canvas.addEventListener('touchmove', e => e.preventDefault(), { passive:false });
  }
  if (isTouchDevice()) initTouchControls();
  ```
- **키보드와 공존**: 기존 `KEY_MAP`/`keydown`/`keyup` 유지. `state.keys` 공유.
- **iOS 오디오 언락**: `btnStart` 클릭 핸들러 **맨 앞**에 `playTone(0, 0.001)` 1줄 추가(기존 `audioCtx.state==='suspended'` resume 로직 재사용).

---

## 기능 상세
1. **치비 간호사 스프라이트** — 16×16→16×20, 얼굴 40%, 큰 눈/볼터치/작은 입, 방향별 시선, 걷기 바운스.
2. **가상 D-Pad 터치 컨트롤** — 4버튼(상/하/좌/우), pointer events 통합, `.is-pressed` 피드백, 동시 누름 대각선 이동 지원.
3. **모바일 뷰포트 & 제스처 방지** — viewport 메타, `touch-action`, `overscroll-behavior`, 520px 이하 `aspect-ratio:4/3`.
4. **입력 환경 자동 감지** — `pointer:coarse`/`ontouchstart`로 터치 UI 표시+키보드 안내 숨김. 하이브리드 기기 둘 다 동작.
5. **iOS 오디오 언락** — 첫 시작 탭에서 무음 톤 resume.

## 주의사항
- **기존 기능 보전**: `update()` 이동·수집·스턴 판정식 동일. 히트박스 14×14로 축소는 큰 머리 시각 보정 의도.
- **삭제·교체**: `nurseSprite` 본문 전체, `drawNurse` oy(-16→-24)·루프(r<16→r<20), `player.w/h`(16→14).
- **접근성**: 한국어 `aria-label`, `:focus-visible`, `hidden`/`aria-hidden` 일관. reduced-motion은 글로벌 `*` 룰로 커버.
- **보안**: 정적 DOM만 추가, 외부 데이터 없음 → `innerHTML` 금지, `textContent`/`setAttribute`만.
- **테마**: `var(--bg-card)/--border/--brand-*`만 사용 → 다크·라이트 자동 대응.
- **성능**: 스프라이트 픽셀 25% 증가, 캔버스 캐릭터 1개 → 영향 무시 가능.
