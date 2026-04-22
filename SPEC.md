# SPEC.md

## 개요
게임 페이지의 모바일(가로 터치) 듀얼 D-pad를 현재 "좌측=상/좌/하, 우측=상/우/하"로 나뉜 분할 배치에서, **양쪽 모두 상/하/좌/우 4방향이 모두 있는 풀 D-pad**로 변경한다. 어느 손으로 잡아도 네 방향 모두를 조작할 수 있게 하여 한손 플레이·좌우 스왑을 자유롭게 한다.

## 변경 유형
**기능** (주로 JS 입력 로직 수정 + HTML 버튼 추가 + CSS 그리드 재배치. 시각 정체성은 기존과 동일.)

## 디자인 언어 & 의도
기존 조이콘의 글래스/코럴핑크 톤과 원형 버튼 언어는 그대로 유지하되, **좌우 대칭 미러드 4-key 크로스 패드**로 확장한다. 어느 쪽을 엄지로 쓰든 동일한 조작 경험을 보장하여 "어느 손이든 편한 쪽을 골라라"는 관대한 모바일 UX를 전달한다.

## Sprint 범위 계약
- **허용**: 양쪽 패드에 누락된 키(좌측의 right / 우측의 left) 버튼 추가, 그리드 재배치, 동시 입력 안정성 확보를 위한 `state.keys[dir]` 레퍼런스 카운팅(같은 dir이 양쪽에서 눌릴 때 한쪽을 떼도 다른쪽이 유지되도록), 캔버스 가용 폭 미세조정.
- **금지**: 새 색/그림자/애니메이션 추가, 탭-이동(`initCanvasTapMove`) 로직 변경, 레이아웃 시스템 자체 교체, 새 버튼(공격/점프 등) 도입.
- **판단 기준**: "이 변경이 없으면 양쪽 4방향 D-pad가 정상적으로 동작하지 않는가?" → YES면 허용, NO면 금지.

## 변경 범위

### pages/game.html 변경사항
- `#gameJoycons` 내부 두 `.game-joycon` 블록을 **동일한 4버튼 구조**로 통일한다. 각 블록은 up/down/left/right 4개 버튼을 모두 갖는다.
- 버튼 DOM (좌/우 동일):
  ```
  <div class="game-joycon game-joycon--left" data-side="left">
    <button class="game-joycon__btn game-joycon__btn--up"    data-dir="up"    type="button" aria-label="위로 이동">▲</button>
    <button class="game-joycon__btn game-joycon__btn--left"  data-dir="left"  type="button" aria-label="왼쪽으로 이동">◀</button>
    <button class="game-joycon__btn game-joycon__btn--right" data-dir="right" type="button" aria-label="오른쪽으로 이동">▶</button>
    <button class="game-joycon__btn game-joycon__btn--down"  data-dir="down"  type="button" aria-label="아래로 이동">▼</button>
  </div>
  ```
- `.game-joycon--right` 블록도 **완전히 동일한 4버튼 구조**를 갖는다.

### assets/css/game.css 변경사항
- `.game-joycon`의 grid를 **3열×3행 십자형**으로 변경:
  ```
  grid-template-columns: repeat(3, auto);
  grid-template-rows: repeat(3, auto);
  gap: 8px;
  ```
- 버튼 배치(양쪽 공통):
  - `--up`: col 2 / row 1
  - `--left`: col 1 / row 2
  - `--right`: col 3 / row 2
  - `--down`: col 2 / row 3
- 기존 `.game-joycon--left` / `.game-joycon--right` 전용 grid 배치 규칙 블록은 삭제하고, 공통 `.game-joycon__btn--up/left/right/down` 규칙 하나로 통합.
- 시각 스타일(버튼 크기/색/pressed/focus ring)은 변경 없음.
- 캔버스 가용 폭: 기존 `calc(100vw - 280px)` 류 규칙이 있으면 `calc(100vw - 340px)` 수준으로 소폭 상향.
- `prefers-reduced-motion`, `:focus-visible` 블록 수정 없음.

### assets/js/game.js 변경사항
- `initDualDpad()` 리팩터: 같은 `dir`을 가진 버튼이 양쪽에 **2개** 존재하므로, 한쪽을 떼도 다른쪽이 아직 눌려 있다면 `state.keys[dir]`을 `false`로 만들면 안 된다.
  - 클로저 상단에 `const pressCount = { up:0, down:0, left:0, right:0 };`
  - pointerdown 시:
    ```
    pressCount[dir] += 1;
    state.keys[dir] = true;
    btn.classList.add('is-pressed');
    ```
  - release 시:
    ```
    pressCount[dir] = Math.max(0, pressCount[dir] - 1);
    if (pressCount[dir] === 0) state.keys[dir] = false;
    btn.classList.remove('is-pressed');
    activePointerId = null;
    ```
  - 기존 activePointerId 중복 가드 유지.
- `clearDpadPressed()` 수정: 카운터도 함께 0으로 리셋. `pressCount`를 모듈 스코프 혹은 공유 스코프에 두거나, 리셋 함수를 `initDualDpad`에서 노출.

## 기능 상세

### 기능 1: 양쪽 4방향 D-pad
- 좌·우 조이콘 모두 상/하/좌/우 4버튼이 있는 십자 크로스 패드.
- 총 8버튼(좌 4 + 우 4), 각각 `data-dir` 보유.

### 기능 2: 좌/우 동일 dir 중복 입력의 정확한 해제
- 양쪽 up을 동시에 눌렀다가 한쪽만 뗐을 때, 남은 쪽이 계속 눌려 있는 동안 이동 유지.
- dir별 정수 카운터, 0이 될 때만 `state.keys[dir] = false`.

### 기능 3: 오버레이 전환 시 안전한 상태 리셋
- 게임 오버/클리어/일시정지 전환 시 `.is-pressed` 잔존과 pressCount를 동시 초기화.

## 주의사항
- 키보드 이벤트 경로(`state.keys[dir]` 직접 set)는 pressCount와 무관. 카운터는 터치 버튼 경로 한정.
- 인라인 이벤트 핸들러 없음. `esc()`/`safeUrl()` 불필요.
- `touch-action: none` 유지.
- 변경 영향 파일: `pages/game.html`, `assets/css/game.css`, `assets/js/game.js` (루트 3파일이 아님에 유의).
