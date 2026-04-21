# 자체 점검

전략: Case A — 최초 구현이므로 SPEC의 6가지 요구사항을 정밀 구현.

---

## SPEC 기능 체크

### 기능 1: 프로필 "HG" 복구
- [x] `assets/css/style.css` 라인 402 부근 `.hero & .profile__name`에 `color: var(--brand-light);` 폴백 추가
- [x] 동일 규칙 내 `@supports not (-webkit-background-clip: text)` 가드 추가 → `-webkit-text-fill-color: currentColor;` 복원
- [x] `html.light .profile__name` (라인 186 부근)에도 `color: var(--text);` 폴백 + 동일 `@supports not` 가드 추가
- 결과: 브라우저가 background-clip: text를 지원하지 않거나 그라디언트 클립이 실패해도 "HG" 텍스트가 단색으로 반드시 렌더링됨

### 기능 2: 성공 기준 변경 (easy 80 / normal 60 / hard 60)
- [x] `TARGET_SCORE = { easy: 80, normal: 60, hard: 60 }` 교체 완료
- [x] `updateStartGoal()`이 기존 로직대로 자동 반영 (별도 수정 불필요)

### 기능 3: 수간호사 캐릭터 직접 등장 + F 투척 시각화
- [x] `state.nurseChief` 객체 추가: `x, y, dir, frameAcc, frame, patrolPath, patrolIdx, throwTimer, telegraphUntil, throwArmUntil, active, speed`
- [x] 난이도별 패트롤: easy=좌우 왕복(40px/s), normal=대각선 Z 패턴(60px/s), hard=4모서리 순환(80px/s)
- [x] F 투척: 타이머 만료 → 0.4s 텔레그래프(`!`) → 수간호사 위치에서 플레이어 방향 단위벡터로 `throwBurst`만큼 동시 투척 (±15° 스프레드)
- [x] `nurseChiefSprite(dir, frame, throwArm)` — 16×20 픽셀 스프라이트, 백발(H)+안경(G)+베이지 상의(U), 김간호(`nurseSprite`)와 차별화
- [x] 팔 올림 프레임: `throwArm`이 true일 때 상의 양옆으로 팔 라인 추가
- [x] `drawNurseChief(x, y, dir, frame, throwArm)` — CSS 변수(`--nurse-chief-*`) 캐시 팔레트 사용
- [x] `drawTelegraph(x, y, now)` — 머리 위 `!` 깜빡임 (reduced-motion이면 정적 표시)
- [x] 렌더 루프에 플레이어 그리기 전에 `drawNurseChief()` + 조건부 `drawTelegraph()` 추가
- [x] 수간호사 색상 변수 5종 `:root`에 추가 (`--nurse-chief-hair`, `-glass`, `-uniform`, `-accent`, `-uniform-shadow`)

### 기능 4: 중/상 난이도 상승
- [x] `DIFFICULTY` 테이블 교체: normal `notes:5, noteTtl:5500, obstacles:3, obsBaseSpeed:120, obsMaxSpeed:210, spawnInterval:[1.6,0.6], maxObstacles:6, throwBurst:2`
- [x] hard `notes:4, noteTtl:3500, obstacles:5, obsBaseSpeed:170, obsMaxSpeed:290, spawnInterval:[1.0,0.35], maxObstacles:10, throwBurst:3`
- [x] easy는 원본 유지 (+ `throwBurst:1` 추가)

### 기능 5: "난이도 다시 선택" 버튼
- [x] `pages/game.html` 종료 오버레이에 `<button class="game-btn game-btn--ghost" type="button" id="btnBackToDifficulty">난이도 다시 선택</button>` 추가
- [x] 버튼 순서: `다시 플레이 | 난이도 다시 선택 | 홈으로`
- [x] 클릭 시 루프 정리 → 상태 초기화(best/현재 난이도 유지) → HUD 리셋 → overlayEnd 숨김 → overlayStart 표시 → `renderPreview()` 재호출
- [x] 활성 난이도 버튼에 포커스 복귀 (접근성)

### 기능 6: F 즉사 처리
- [x] update 내 기존 스턴 + 감점 + 밀어내기 로직 제거
- [x] 신규: `state.hits += 1; state.combo = 0;` → 저음 2연타(110Hz, 82Hz) → `is-shake, is-gameover` 클래스 추가 → `state.gameoverReason = 'hit'` → `endGame()` → `return`
- [x] `endGame` 분기: `gameoverReason === 'hit'` && !success → 제목 "수간호사에게 걸렸어요!" / 문구 "F 한 장에 노래가 멈췄다. 김간호는 오늘만큼은 작곡을 포기하고 차트를 정리한다." + `--fail` 스타일
- [x] 시간 초과 분기 유지 (`gameoverReason = 'time'` 세팅)
- [x] `game.css`에 `.game-canvas-wrap.is-gameover` 비네트 애니메이션 추가 (`box-shadow: inset 0 0 80px var(--game-danger-20)` 0.6s)
- [x] reduced-motion 블록에 `.is-gameover { animation: none; box-shadow: none; }` 대응

---

## 연동 변경 (SPEC 내 허용 범위)

- `pages/game.html` 시작 오버레이 desc 문구에 `<strong>F에 닿으면 즉시 실패</strong>` 한 줄 추가 (SPEC 명시)
- `state.gameoverReason` 추가, startGame에서 null로 초기화, 시간초과 분기에서 'time'으로 세팅
- `initPreview` IIFE를 `renderPreview()` 함수로 승격 → "난이도 다시 선택" 복귀 시 재사용. 프리뷰 구도를 "김간호 + 수간호사 + F" 3자 구도로 변경해 신규 컨셉 힌트 강화 (SPEC 기능 3의 "수간호사 실체화" 의도에 정합)
- 난이도 버튼 클릭 시 `renderPreview()` 재호출 → 난이도별 맵이 다르므로 프리뷰도 갱신 (선택 변경의 즉시성)
- 수간호사 색상 팔레트 캐시(`chiefPaletteCache`) + 테마 토글 시 invalidate → 매 프레임 `getComputedStyle` 호출 방지 (성능)
- 기존 `p.stunUntil` 관련 코드는 SPEC 지시대로 남겨둠 (update 이동 처리의 `stunned` 체크, render의 깜빡임은 현재 사용되지 않지만 참조 유지)

---

## 패턴 준수 확인

- **BEM 네이밍**: 준수. 신규 요소 없음(기존 `.game-btn game-btn--ghost` 재사용). CSS 변수 `--nurse-chief-*` 네이밍 일관됨
- **CSS 변수 사용**: 준수. 하드코딩 없음. 기존 `--game-danger-20`, `--brand`, `--text` 등 재사용. 신규 색상은 `:root` 추가
- **CSS 네이티브 중첩**: 준수. `&.is-gameover` / `@supports not` 중첩 모두 `&` 문법
- **기존 `:root` 변수**: 삭제/변경 없음. 추가만 수행 (`--nurse-chief-*` 5종)
- **반응형 520px**: 신규 DOM 요소는 `#btnBackToDifficulty` 하나이며 기존 `.game-btn game-btn--ghost` 스타일을 그대로 상속 → 기존 `@media (max-width: 520px)` 블록의 `.game-cta { flex-direction: column; }` + `.game-btn { width: 100%; }` 적용됨
- **reduced-motion**: 준수. `is-gameover` 애니메이션 비활성화, 수간호사 걷기/텔레그래프 깜빡임 모두 `reducedMotion` 가드
- **esc()/safeUrl()**: 외부 데이터 주입 없음 (canvas 픽셀 렌더링 + textContent만 사용) → N/A
- **가드 클래스**: `if (btnBackToDifficulty)` 가드 확인. `if (!chief.active || !chief.patrolPath.length) return;` 등 early return
- **-webkit-backdrop-filter**: 기존 코드 그대로 유지. 신규 backdrop-filter 도입 없음
- **파일 간 정합성**: 
  - `#btnBackToDifficulty` (HTML) ↔ `getElementById('btnBackToDifficulty')` (JS) 일치
  - `--nurse-chief-hair` 등 (CSS) ↔ `getChiefPalette()` `readVar('--nurse-chief-hair')` (JS) 일치
  - `.is-gameover` (CSS) ↔ `canvasWrap.classList.add('is-gameover')` (JS) 일치
- **단일 파일 구조**: 기존 3파일(게임용) + style.css 유지. 신규 파일 생성 없음
- **금지 사항 준수**: index.html/main.js 미수정, SCSS 문법 없음, 기존 `:root` 변수값 불변, 게임 외 페이지 미수정, `!important` 신규 사용 없음, onclick 속성 없음

---

## 주요 Sprint 범위 준수

- SPEC 외 독립 기능 추가: 없음
- 허용된 범위(SPEC에 명시된 UI 텍스트/프리뷰 재사용/팔레트 캐시)만 연동 변경
- index.html, assets/js/main.js: 수정 없음 (사용자 지시 준수)
- assets/css/style.css: 라인 186 + 402 부근 최소 수정 (HG 폴백 두 군데만)

---

## 알려진 제약

- `state.gameoverReason`이 `null`인 상태로 endGame이 호출되는 경로는 현재 없음(시간초과/F 충돌 모두 세팅). 안전망으로 null이면 시간초과 분기로 fallthrough됨
- 수간호사가 벽 위 좌표에서 투척 시 F 발사 위치가 벽에 겹칠 수 있어, `isWallAt` 체크 후 `findEmptyTile` 폴백 적용
- 수간호사 패트롤 경로는 픽셀 좌표 기반 단순 선형 이동 (맵의 벽 회피 없음) — 패트롤 포인트는 외곽 3~4타일 안쪽이라 hard의 모서리 방과도 충돌하지 않음. easy/normal도 안전 영역 내 이동
