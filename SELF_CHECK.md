# 자체 점검 — "김간호는 음악박사" 중독성 업그레이드

전략: Case A — 이유: 최초 R1 실행, SPEC 정밀 적용.

---

## 1. SPEC 항목별 구현 상태

### A. pages/game.html

- [x] **A1. HUD 콤보 슬롯 추가** — `game-hud__slot--combo` + `#hudCombo` 추가. Score 슬롯에 `aria-live="polite"` 부여. HUD 컨테이너 `aria-live="off"` 는 제거(슬롯 단위로 옮김).
- [x] **A2. 시작 오버레이 목표 점수 표시** — `.game-overlay__goal#startGoal` 추가. 기본 문구 "목표 22점 · 45초".
- [x] **A3. 종료 오버레이 통계 블록** — `.game-overlay__stats#endStats` ul 리스트 추가 (`#statMaxCombo`, `#statHits`, `#statAccuracy`).
- [x] **A4. 별도 라이브 영역** — SPEC대로 제외 (A1의 Score `aria-live`로 갈음).
- [x] **A5. 음정 표시** — SPEC대로 제외.
- [x] **A6. `btnReplay` 라벨 유지** — HTML 변경 없음, JS에서 `startGame()` 직접 호출.

### B. assets/css/game.css

- [x] **B1. `--game-*` 네임스페이스 변수 확장** — `--game-combo-glow`, `--game-particle` 추가. `html.light`에서 `--game-combo-glow: var(--brand-35)` 재정의.
- [x] **B2. 콤보 값 상태 클래스** — `.is-combo-bump` (0.22s 바운스, `@keyframes gameComboBump`), `.is-combo-hot` (`--brand-light` + 10px 글로우) 구현.
- [x] **B3. 캔버스 셰이크** — `.game-canvas-wrap.is-shake` 0.25s `@keyframes gameShake` (최대 4px translate).
- [x] **B4. 콤보 리본** — SPEC대로 제외.
- [x] **B5. 시작 목표 텍스트 스타일** — `.game-overlay__goal` 12px, strong=`--brand-light`.
- [x] **B6. 종료 통계 리스트 스타일** — flex + `--brand-06` bg + `--brand-20` border + 모바일 축소.
- [x] **B7. 콤보 슬롯 모바일 대응** — 520px에서 HUD gap:4px, 라벨 8px, 값 15px.
- [x] **B8. reduced-motion 확장** — `.is-shake`/`.is-combo-bump` animation+transform:none, 글로벌 `animation-duration: 0.01ms !important` 추가.

### C. assets/js/game.js

- [x] **C1. 리플레이 즉시 재시작** — `btnReplay` 클릭 시 `overlayEnd.classList.add('is-hidden')` + `startGame()` 직접 호출.
- [x] **C2. 오버레이 스크롤 방지 + 키 누적 방지** — `isAnyOverlayOpen()` 헬퍼 도입. 오버레이 열림 시 `state.keys[dir] = false` + `e.preventDefault()`.
- [x] **C3. 진행 중 난이도 변경 차단** — `diffBtns.forEach` 핸들러 맨 앞에 `if (state.running) return;`.
- [x] **C4. 스폰 안전지대** — `findEmptyTile(map, rng, avoid)` 파라미터 추가. `SPAWN_SAFE_DIST=4`. `playerTile()` 헬퍼 추가. `spawnNote`/`spawnObstacle`에서 플레이어 타일을 avoid에 전달. 200회 시도 후 fallback.
- [x] **C5. 컷씬 복귀 스폰 타이머 보정** — `resumeFromCutscene()`에서 `curveT()`+`lerp()`로 interval 계산 후 `state.nextSpawnAt = now + intervalSec * 1000`.
- [x] **C6. 컷씬 닫기 키 확장** — `e.key === 'Escape' || 'Enter' || ' '` 모두 허용. `e.preventDefault()` 포함.
- [x] **C7. 콤보 시스템** — state에 `combo/maxCombo/hits/collected` 추가. 수집 시 콤보 증가 + 점수 보너스(3+:+1, 5+:+2, 7+:+3) + `updateComboHud(true)` + `SCALE_FREQS` 단계별 톤. 피격 시 combo=0 + hits++ + `playTone(196)` + setTimeout `playTone(147, 0.18)` 90ms 후 + 캔버스 셰이크.
- [x] **C8. 파티클 시스템** — `state.particles = []`. `spawnParticles(cx, cy, count)` + `updateParticles(dt)` + 렌더 (3px 네모, globalAlpha = life/maxLife). 3+콤보 10개 / 7+콤보 14개 / 기본 6개. reduced-motion에선 생략.
- [x] **C9. 속도에 콤보 반영 없음** — `currentPlayerSpeed`는 그대로.
- [x] **C10. 종료 통계 업데이트** — `statMaxCombo/statHits/statAccuracy.textContent` 갱신. accuracy = `denom===0 ? 100 : round(collected/denom*100)`. null 가드 포함.
- [x] **C11. 엔딩 텍스트 강화** — 성공+신기록 / 성공+비신기록 / 실패+target-2 / 실패+기본 4가지 분기.
- [x] **C12. 시작 목표 동적 갱신** — `updateStartGoal()` 헬퍼. 난이도 변경 클릭 + 초기 로드 시 호출.
- [x] **C13. 초기 preview** — 변경 없음.
- [x] **C14. 밸런스 조정** — `TARGET_SCORE: {easy:22, normal:16, hard:12}`, `easy.notes:5`, `hard.notes:3`, `hard.noteTtl:4000`. normal.notes=4 유지.
- [x] **C15. HUD Score aria-live** — A1에서 Score 슬롯에 `aria-live="polite"` 부여.

---

## 2. 수정한 파일 요약

### `pages/game.html`
- L40: `.game-hud` 컨테이너에서 `aria-live="off"` 제거
- L45: Score 슬롯에 `aria-live="polite"` 부여
- L49-52: 콤보 HUD 슬롯(`.game-hud__slot--combo` + `#hudCombo`) 신규
- L74: 시작 목표 표시 `.game-overlay__goal#startGoal` 신규
- L106-110: 종료 통계 리스트 `.game-overlay__stats` + 3개 `<li>` 신규

### `assets/css/game.css`
- L6-17: `--game-combo-glow`, `--game-particle` 변수 추가. light 테마 override 보강
- L177-192: `.is-combo-bump` + `@keyframes gameComboBump` + `.is-combo-hot` 신규
- L194-216: `.game-canvas-wrap.is-shake` + `@keyframes gameShake` 신규 (네이티브 중첩)
- L293-338: `.game-overlay__goal` + `.game-overlay__stats` 신규 (네이티브 중첩 `& li`)
- L607-637: 520px 미디어 내 HUD 압축 + 통계 축소 스타일
- L745-758: reduced-motion에 `.is-shake`/`.is-combo-bump` 비활성 + 글로벌 `animation-duration: 0.01ms` 강화

### `assets/js/game.js`
- L33: `TARGET_SCORE = {easy:22, normal:16, hard:12}` — 밸런스 조정
- L38-40: `DIFFICULTY.easy.notes=5`, `hard.notes=3`, `hard.noteTtl=4000`
- L43-47: `SCALE_FREQS` (C장조 10음) + `SPAWN_SAFE_DIST=4` 상수 추가
- L154-206: `findEmptyTile` avoid 파라미터 + `playerTile()` 헬퍼 추가
- L424-430: state에 `combo/maxCombo/hits/collected/particles` 추가
- L463-476: DOM refs에 `hudCombo`, `canvasWrap`, `startGoalEl`, `statMaxCombo`, `statHits`, `statAccuracy` 추가
- L482-516: `updateStartGoal()`, `updateComboHud(bump)` 헬퍼 함수 신규
- L518-528: 난이도 클릭 핸들러 `if (state.running) return;` + `updateStartGoal()` 호출
- L535-539: `btnReplay` 즉시 `startGame()` 호출
- L549-577: `isAnyOverlayOpen()` 헬퍼 + keydown 핸들러 오버레이 가드
- L582-634: `startGame()` — combo/stats/particles/keys 초기화, hudCombo 리셋
- L636-700: `endGame()` — maxCombo/hits/accuracy DOM 갱신, 엔딩 분기 4가지
- L734-747: `resumeFromCutscene()` — nextSpawnAt 보정
- L754-762: 컷씬 닫기 키 Escape/Enter/Space 확장
- L767-791: `spawnNote`/`spawnObstacle` — 플레이어 타일 avoid 전달
- L793-833: `spawnParticles`, `updateParticles` 신규
- L915-952: 수집 루프 — 콤보/점수보너스/스케일톤/파티클 통합
- L958-990: 피격 루프 — 콤보 리셋/2연타 저음/캔버스 셰이크
- L993: `updateParticles(dt)` 매 프레임 호출
- L1048-1058: render() 파티클 draw 블록 추가
- L1113: 초기화에서 `updateStartGoal()` 호출

---

## 3. Sprint 범위 계약 준수 여부

### 허용 범위 내에서 수행
- 콤보/파티클/스케일 사운드/리플레이 개선/스폰 안전지대/버그수정 모두 SPEC에 명시됨.
- HUD 4슬롯 레이아웃 변경 → 콤보 슬롯 추가의 불가피한 연동.
- `state.keys = Object.create(null)` 재초기화 (startGame 진입 시) → 누적 키 제거를 위한 최소 연동.

### 금지 사항 위반 없음
- 새 CSS 변수는 `--game-` 네임스페이스만 사용 (`--game-combo-glow`, `--game-particle`).
- 기존 `--brand*` 변수는 재사용만, 삭제/변경 없음.
- 새 아이템/새 적 유형/파워업/리더보드 없음.
- 외부 라이브러리/이미지/폰트 추가 없음.
- 캔버스 해상도 640×400 유지.
- 보라-청록 그라디언트 없음, 하드코딩 색상 없음, `border-radius` 기존 토큰(`--radius-sm`)만 사용.

### SPEC 외 변경 / 범위 외 아이디어
- 없음. 모든 변경은 SPEC의 A/B/C 항목 중 하나에 대응.

---

## 4. 수락 기준 self-check 결과

### 기능 동작
- [x] 난이도 선택 → 시작 → 인트로 컷씬 → 진행 → 15/30s 컷씬 → 타임업 → 종료. 기존 흐름 유지.
- [x] 종료 "다시 플레이" 즉시 새 게임 시작 (C1).
- [x] 게임 중 난이도 클릭 무시 (C3).
- [x] 인트로 컷씬 긴 시간 후에도 F 집중 스폰 없음 (C5, `resumeFromCutscene`에서 `nextSpawnAt` 재설정).
- [x] 플레이어 스폰 지점 4타일 내 F 없음 (C4, `playerTile()` avoid 전달).
- [x] 오버레이 중 화살표 스크롤 방지 (C2).
- [x] 컷씬 Escape/Enter/Space로 닫기 (C6).

### 중독성 / Juice
- [x] 수집 시 콤보 HUD +1 + 바운스 애니메이션 (`updateComboHud(true)`, reduced-motion 비활성).
- [x] 3콤보 이상 `is-combo-hot` → `--brand-light` + `text-shadow: 10px var(--game-combo-glow)`.
- [x] 콤보 단계별 C장조 스케일 (`SCALE_FREQS[combo-1]`).
- [x] 파티클 개수 분기: 기본 6 → 3+: 10 → 7+: 14.
- [x] F 피격 시 combo=0 + `.is-shake` + 저음 2연타(`196Hz → 147Hz` 90ms 후).
- [x] 종료 화면에 최대 콤보 / F 피격 / 정확도 표시.
- [x] 시작 화면 `#startGoal` 난이도 전환 시 `updateStartGoal()` 호출.
- [x] 성공/실패 엔딩 4분기 (신기록/비신기록/근접실패/완패).

### 코드 품질
- [x] 하드코딩 색상 0건 — 새 추가 색상은 모두 `--brand*`/`--game-*` 변수. (기존 drawObstacle 등 내부 캔버스 색은 JS에서 이미 이뤄지고 있던 것으로 이번 스프린트 범위 외.)
- [x] 새 CSS 변수는 `--game-` 네임스페이스.
- [x] CSS 네이티브 중첩 `&` 준수 (`.game-canvas-wrap { &.is-shake {} }`, `.game-overlay__stats { & li {} }` 등).
- [x] BEM 일관성 — `.game-hud__slot--combo`, `.game-overlay__goal`, `.game-overlay__stats`, `.is-combo-bump`, `.is-combo-hot`, `.is-shake`.
- [x] 애니메이션 종료 감지는 모두 `animationend` + `{ once: true }` (combo bump, shake).
- [x] `prefers-reduced-motion: reduce`에서 파티클 생략(JS), 셰이크/바운스 CSS 비활성, 글로벌 animation-duration 0.01ms.
- [x] 모바일 520px HUD 4슬롯 — gap:4px, 라벨 8px, 값 15px.

### 보안 & 접근성
- [x] 모든 동적 텍스트 `textContent` 사용. 외부 데이터 없음.
- [x] Score 슬롯 `aria-live="polite"`.
- [x] 포커스 가시성 — 기존 `:focus-visible` 스타일 유지.

### 회귀 방지
- [x] 컷씬 트리거(`timeLeft<=30 mid1`, `<=15 mid2`) 그대로.
- [x] 맵 레이아웃 `buildMap` 변경 없음.
- [x] `--brand*`, `--radius*` 삭제/값변경 없음.
- [x] 터치 D-pad 핸들러 유지.

---

## 5. 알려진 제약 / 리스크

1. **수집 후 음표 보충 1프레임 지연** — 기존에는 `spawnNote()`가 수집 루프 내에서 즉시 호출됐으나 중복 제거(C4 해당)로 제거. 다음 프레임의 `while (notes.length < diff.notes) spawnNote();`가 보충하므로 실제 지연은 ~16ms, 체감 없음.
2. **저음 2연타의 두 번째 톤은 `setTimeout`** — SPEC C7에 명시된 대로 `setTimeout(() => playTone(147, 0.18), 90)` 사용. 이는 "애니메이션 종료 감지"가 아닌 "사운드 타이밍"이므로 `animationend` 규칙 대상이 아님.
3. **파티클 색상** — JS에서 `themeColors().brandHi`를 사용하고 있어 기존 하드코딩 색상 시스템 내에서 동작. SPEC B1의 `--game-particle` 변수는 CSS 쪽 레퍼런스로만 남아 있으며 캔버스 렌더에선 JS 테마 팔레트 사용. CSS 변수 → JS 전달 로직을 추가하는 건 범위 외로 판단.
4. **콤보 HUD 애니메이션 빠른 연쇄** — 강제 reflow(`void hudCombo.offsetWidth`)로 애니메이션 재시작을 보장. 매우 빠른 연쇄 시 누적된 `{once:true}` 리스너가 한 번에 해제되나 부작용 없음 (classList.remove는 idempotent).
5. **`endStory.classList.add('game-overlay__ending')`** — 이미 HTML에 클래스가 있어 중복 추가되지만 무해.
