# SPEC.md

## 개요
`pages/game.html`의 미니게임에서 세 가지를 개선한다: (1) 모바일에서 키패드(듀얼 조이콘)가 나타나지 않고 캔버스가 뷰포트에 맞게 줄어들지 않는 버그 수정, (2) 게임 시작 직후 뜨는 인트로 컷씬("어느 한적한 병동의 오후") 본문에 해당 스테이지 목표 개수 표시, (3) 상 난이도(hard)에서는 해당 인트로 컷씬 문구를 이교수 청진기 내러티브로 분기.

## 변경 유형
**기능** (혼합 요소 포함하나 주축은 로직·반응형 분기이므로 기능 평가 기준 적용)

## 디자인 언어 & 의도
모바일 플레이어가 핸드폰을 잡자마자 "게임판이 손 안에 들어온" 느낌을 받도록 한다 — 캔버스는 실제 뷰포트에 맞춰 줄어들고, 양옆에 글래스모피즘 조이콘이 뜨며, 세로 모드에서는 부드러운 회전 안내가 뜬다. 또한 인트로 컷씬은 난이도마다 약간씩 다른 "오늘의 병동 풍경"을 전달해, 플레이 전부터 이번 판의 긴장도(목표 점수 + 보스 존재 여부)를 한 문장으로 각인시킨다.

## Sprint 범위 계약
Generator가 SPEC 외 변경을 하려 할 때의 판단 기준:
- **허용**: 모바일 검출 리팩터에 필수적인 CSS 미디어 쿼리 재배치/추가, 기존 `@media (max-width: 520px)` 블록 내부의 불가피한 값 재조정, `CUTSCENES` 상수 구조 변경에 따른 `triggerCutscene()` 호출부 최소 수정.
- **금지**: 새 효과(파티클/사운드/애니메이션) 추가, 인트로 외 컷씬(mid1/mid2) 문구 변경, 게임 밸런스(속도·스폰·TARGET_SCORE) 수정, `index.html`·`assets/css/style.css`·`assets/js/main.js`의 수정(이번 변경은 전부 `pages/game.html` + `assets/css/game.css` + `assets/js/game.js`에 국한).
- **판단 기준**: "이 변경이 없으면 SPEC 3개 기능이 제대로 동작하지 않는가?" YES면 허용, NO면 금지.

---

## 이전 코드가 모바일에서 왜 안 됐는지 — 원인 분석

핵심 버그 한 줄 요약: **조이콘과 모바일 전용 레이아웃이 전부 `@media (max-width: 520px)`에 의존하는데, 가로 모드에서 현대 폰의 뷰포트 폭은 대부분 520px을 넘는다.**

세부 원인:
1. `assets/css/game.css`의 `@media (max-width: 520px) and (orientation: landscape)`에서만 `.game-joycons`가 `display: flex`로 전환되고, 같은 조건에서만 `.game-canvas-wrap`이 `max-width: calc(100vw - 280px)` 규칙으로 축소된다. 그러나 landscape 시 viewport의 짧은 쪽(height)은 375~430 수준이어도 **긴 쪽(width)이 667~932**가 된다 (iPhone 14 Pro landscape 852×393, 갤럭시 S22 landscape 800×360). 즉 `max-width: 520px` 조건이 **거짓**이 되어 데스크톱 레이아웃으로 폴백 → 조이콘 미노출 + 캔버스 원본 크기 유지.
2. `@media (max-width: 520px) and (orientation: portrait)`에 묶인 `.game-joycons { display: none !important }` 역시 같은 이유로, 일부 폰(iPhone Pro Max 등)에서 portrait 폭 414~430이어도 조건은 일단 맞지만, landscape로 전환하자마자 터지는 첫 번째 문제를 상쇄하지 못한다.
3. `initOrientationHint()`도 동일한 `matchMedia('(max-width: 520px) and (orientation: portrait)')`를 사용 → 폭 >520px인 폰에서는 portrait여도 회전 안내가 안 뜨고, 그렇다고 joycons가 뜨는 것도 아니라 사용자는 키패드 없이 방치된다.
4. `initDualDpad()`는 `isTouchDevice()` 통과 시 `root.hidden = false`만 풀지만, CSS `.game-joycons { display: none }` 기본값이 그대로라 실제 표시는 CSS에 달려 있다 — JS가 해제해도 CSS가 막는다.
5. `.game-canvas-wrap { width: 100%; aspect-ratio: 16/10 }` 기본값 자체는 부모 폭을 따르는데, `.game-shell`의 `max-width` 제한이 데스크톱 기준이라 모바일 landscape에서 캔버스가 화면 세로 높이를 초과해 스크롤/오버플로를 유발한다. 이전 커밋 "모바일 뷰포트"는 `100dvh` 도입으로 오버레이 문제는 잡았으나 **캔버스 자체의 높이 제약**은 `max-width: 520px and landscape`에만 걸려 같은 버그에 묶여 있다.

해결 방향 — **뷰포트 폭 기반이 아닌 디바이스 특성 기반 감지**:
- JS에서 터치 디바이스 감지(`pointer: coarse` + `ontouchstart`) + 가로/세로 orientation을 읽어 `<body>`에 상태 클래스 부착:
  - `body.is-touch` — 터치 디바이스
  - `body.is-touch.is-landscape` — 가로 모드 (조이콘 표시 + 캔버스 dvh 축소)
  - `body.is-touch.is-portrait` — 세로 모드 (회전 안내 표시, 조이콘 숨김)
- CSS 미디어 쿼리는 여전히 데스크톱 레이아웃 유지용으로 `(max-width: 520px)` 블록을 보존하되, 조이콘/캔버스 축소/회전 안내의 **트리거를 바디 클래스로 교체**한다. 이로써 폭 >520px인 폰에서도 올바르게 작동.

---

## 변경 범위

### pages/game.html
- `#overlayStart` 내부 기존 구조 유지 (`#startGoal`의 "목표 40점 · 45초" 표시는 이미 동작 → 건드리지 말 것).
- 인트로 컷씬 패널 내 `#cutsceneText` 아래에 `<p class="game-overlay__goal" id="cutsceneGoal" hidden></p>` 한 줄 신규 추가 (JS에서 채움, 기본 hidden).
- `index.html`·`main.js`는 수정하지 않음.

### assets/css/game.css
1. **조이콘 노출 규칙 재배치**: 기존 `@media (max-width: 520px) and (orientation: landscape)` 안의 `.game-joycons { display: flex; position: fixed; inset: 0; ... }` 및 `.game-topbar/header/footer/controls { display: none }` 규칙을 `body.is-touch.is-landscape ...` 선택자로 이동. 기본값 `.game-joycons { display: none }` 유지.
2. **캔버스 축소 규칙 재배치**: `.game-canvas-wrap { aspect-ratio: 16/10; max-height: calc(100dvh - 60px); max-width: calc(100vw - 280px); ... }`를 `body.is-touch.is-landscape .game-canvas-wrap { ... }`로 이동.
3. **회전 안내**: 기본 `.game-rotate-hint[hidden] { display: none }` 유지. 표시는 JS가 `hidden` 속성과 `.is-visible` 토글로 제어.
4. **인트로 컷씬 목표 표시 스타일**: `.game-overlay--cutscene .game-overlay__goal { ... }` 1~2줄 신규 추가. 기존 CSS 변수 재사용, 하드코딩 색 금지.
5. 기존 `@media (max-width: 520px)` 블록은 타이포/패딩 축소 목적 규칙만 남기고, 조이콘/캔버스/회전 안내 관련 규칙은 모두 바디 클래스 셀렉터로 이관.
6. `@media (prefers-reduced-motion: reduce)` 기존 규칙 유지.

### assets/js/game.js
1. **`syncMobileLayoutClasses()` 신규 함수**:
   - `isTouchDevice()` 통과 시 `document.body.classList.add('is-touch')`.
   - `window.matchMedia('(orientation: portrait)')` 구독 → `body`에 `is-portrait`/`is-landscape`를 상호 배타적으로 토글.
   - 초기 1회 즉시 실행 + `change` 이벤트 + `resize` 이벤트 폴백 구독 (`addEventListener`/`addListener` 폴백 포함).
2. **`initOrientationHint()` 리팩터**: 표시 조건을 `body.classList.contains('is-touch') && body.classList.contains('is-portrait')`로 변경. 문구 "가로 모드에서 맵을 터치해 이동합니다." 유지.
3. **`initDualDpad()`·`initTouchControls()`**: 현재처럼 `isTouchDevice()` 통과 시 호출 유지. 조이콘 표시 가시성은 CSS 바디 클래스에 의존.
4. **인트로 컷씬 난이도 분기**:
   - `CUTSCENES.intro` 구조를 단일 `text`에서 `textByDiff: { easy, normal, hard }`로 확장.
     - `easy`/`normal`: 기존 문구 공유("수간호사가 순찰을 돈다. 그 틈을 타, 김간호는 주머니 속 작곡 노트를 슬쩍 꺼낸다… 음표를 모으자." 또는 기존 문구 유지).
     - `hard`: "학교에서 나온 깐깐한 이교수가 오늘따라 청진기를 휘두른다. 날아오는 청진기를 피하며 음표를 모으자." (의미 유지 선에서 문구 미세 조정 허용).
   - `triggerCutscene(id, …)`에서 `const cut = CUTSCENES[id]; const text = cut.textByDiff ? (cut.textByDiff[state.difficulty] || cut.textByDiff.easy) : cut.text;`로 분기.
   - `mid1`/`mid2`는 `text` 단일 필드 유지 → 호환성 보존.
5. **인트로 컷씬 목표 개수 줄 추가**:
   - `triggerCutscene()` 내부에서 `id === 'intro'`일 때 `#cutsceneGoal`에 `` `목표 ${TARGET_SCORE[state.difficulty]}점 · ${GAME_DURATION}초` ``를 `textContent`로 주입하고 `hidden = false`.
   - 그 외 컷씬에서는 `hidden = true`로 되돌림.
6. `state.keys` 초기화, pointer capture, 조이콘 라벨 등 **그 외 로직 변경 금지**.

---

## 주의사항
- **범위 제약**: `pages/game.html`, `assets/css/game.css`, `assets/js/game.js`만 수정. `index.html`·`assets/css/style.css`·`assets/js/main.js` 금지.
- **기존 `#startGoal`**: 시작 오버레이의 "목표 40점 · 45초"는 이미 동작 → 건드리지 말 것. 이번은 **인트로 컷씬**에 목표를 덧붙이는 것.
- **XSS 방지**: 컷씬 텍스트는 `textContent`로만 주입. `innerHTML` 금지.
- **CSS 하드코딩 금지**: 새 스타일은 기존 `--brand-*`, `--text-muted` 등 변수 재사용. BEM 유지.
- **애니메이션 타이밍**: `transitionend`/`animationend` 유지. `setTimeout(fn, 300)`로 대체 금지 (슬롭 패턴).
- **`mid1`/`mid2` 호환**: `triggerCutscene` 분기는 `textByDiff` 존재 여부로 안전히 fallback.
- **`document.body`의 `game-page` 클래스**: 추가만, 제거 금지.
- **접근성**: `aria-hidden`, `aria-label`, `prefers-reduced-motion` 기존 동작 유지.
- **이전 "모바일 환경 개선", "모바일 뷰포트" 커밋**: `100dvh`·`position:fixed` 오버레이 패턴은 그대로 둔다. 이번 변경은 "뷰포트 폭 기반 조건"만 "디바이스 특성 기반 조건"으로 교체하는 delta.
