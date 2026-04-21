# SPEC.md — "김간호는 음악박사" 게임 품질/중독성 업그레이드

## 1. 현재 게임 분석 요약

**게임**: 16x10 타일(실질 32x20) 픽셀 탑다운 수집 게임. 플레이어(김간호)는 45초 안에 맵을 돌며 음표를 모으고, 수간호사가 뿌리는 빨간 F를 피해 난이도별 목표 점수(Easy 18 / Normal 14 / Hard 10) 달성을 노린다.

**핵심 루프**: 이동 → 음표 수집(+1, 880Hz 톤) → F 회피(실패 시 -1 + 스턴 400~700ms) → 15s/30s 컷씬 → 타임업 → 성공/실패 판정 → 최고 점수 저장. 파일은 `pages/game.html`, `assets/css/game.css`, `assets/js/game.js` 셋으로 완결된 서브페이지.

---

## 2. 발견된 하자 / 이슈 목록

### Critical (기능 오동작·사고 가능)

1. **`game.js:447-449` 리플레이 버튼 사고**: `btnReplay` 클릭 시 end 오버레이를 닫고 start 오버레이를 다시 띄우는데, 이때 `btnStart`를 다시 눌러야 플레이가 시작된다. "다시 플레이"라는 라벨과 동작이 불일치 → 즉시 재시작이 자연스러움.
2. **`game.js:453-470` 전역 키 리스너가 페이지 스크롤을 먹음**: 오버레이(시작/컷씬/종료) 상태에서는 `state.running=false`라 화살표가 페이지 스크롤을 유발. 또한 `keydown` 리스너가 오버레이 열려 있을 때도 `state.keys`에 true를 세팅해서 컷씬 복귀 후 관성 이동 가능.
3. **`game.js:442-445` 난이도 전환 시 초기화 누락**: 게임 중에 난이도 버튼을 클릭하면 현재 게임의 `state.difficulty`가 즉시 바뀌어서 속도/스폰 주기가 튐. → running 상태에선 난이도 변경 불가 가드 필요.
4. **`game.js:721-732` 음표 수집 판정에서 같은 프레임에 여러 음표 동시 수집 시 `spawnNote()`를 수집 개수만큼 호출** — 작동은 하지만 비효율·의도불명. while 보정과 중복.
5. **`game.js:497` 초기 추가 스폰 타이머가 인트로 컷씬 정지 시간을 고려 안 함**: 인트로 컷씬 중 `performance.now()`는 계속 흐르므로 컷씬을 길게 읽으면 재개 즉시 F가 한꺼번에 스폰. `resumeFromCutscene()`에서 `nextSpawnAt`을 보정해야 함.
6. **`game.js:752-757` 타이머가 dt 누적** — 정지는 되지만, `cutscene` 트리거 순간 해당 프레임에 `state.timeLeft -= dt`가 이미 반영되어 컷씬 진입 시 타이머 한 프레임 분 까먹음(무시 가능 수준).

### Major (UX·밸런스·접근성)

7. **`game.js:608-613` Escape로만 컷씬을 닫을 수 있음** — Space/Enter도 허용해야 자연스러움.
8. **`game.html:56` 캔버스에 `tabindex` 없음 + 점수 변화를 스크린리더에 알리는 라이브 영역 없음**.
9. **`game.js:477-517` startGame에서 플레이어를 항상 `(2,2)` 타일에 배치** — 첫 F가 근처 스폰되면 시작 직후 피격. 플레이어 스폰 시 주변 4타일 내 F 스폰 금지 가드 필요.
10. **`game.js:629-639` spawnObstacle이 플레이어 타일과 겹칠 수 있음** → 스폰 즉시 충돌. 반경 4타일 내 스폰 금지 가드.
11. **난이도 밸런스 역전**: Easy=18 TTL=Infinity → "계속 돌면 달성", Hard=10 TTL=3초 → 운 게임. 재검토 필요.
12. **점수 피드백 빈약** — 수집 시 숫자만 바뀌고 사운드·시각효과가 매번 동일. 콤보/연쇄 개념 없음 → 중독성 0.
13. **엔딩 컷씬이 "신기록!" 한 줄**로 끝 — 다시 플레이 훅 부족.
14. **소리**: 사인파 1음. "음악박사" 컨셉과 연결 약함. 화음/아르페지오로 확장 필요.
15. **`game.js:784` 음표 bob 계산** 매 프레임 `Math.sin` 호출. 후속 과제.
16. **`game.css:633-648` reduced-motion**에서 `animation-duration`은 누락. `animation: none` 개별 지정만.

### Minor (다듬기)

17. 터치패드 대각선 이동 — 멀티 포인터 테스트 필요.
18. `game.js:199` `ctx.imageSmoothingEnabled = false` 초기 1회 설정. 라이트/다크 전환 후 안전 차원 재설정.
19. `game.html` 캔버스 외 공간이 허전 — 컨셉 몰입이 HUD 텍스트에만 의존.
20. `game.css:420-429` `.game-controls`가 PC에서 HUD 아래 공간만 차지.
21. `game.js:428` `updateBestHud()`가 DOM 참조 뒤에 선언 — 호이스팅 주의.

---

## 3. 변경 유형

**혼합** (버그 수정 + 기능 추가 + 디자인 업그레이드)
→ **기능 변경 평가 기준** 적용 (패턴 40% / 보안접근성 25% / 반응형UI 20% / 기능 15%).

---

## 4. 디자인 언어 & 의도

"음악박사"라는 컨셉을 **청각-시각 연쇄 피드백**으로 번역한다. 음표 하나를 먹을 때마다 다음 음이 C장조 스케일로 올라가며 콤보가 쌓이고, 3연쇄/5연쇄/7연쇄마다 화면에 잠깐 음표 파티클이 터지고 HUD 숫자가 튕긴다. F에 맞으면 스케일이 무너지듯 저음이 깔리며 콤보가 리셋된다. 결과적으로 "음표 줍기"가 **음악을 연주하는 행위**로 바뀌고, 플레이어는 "내 콤보를 지키고 싶다"는 본능적 집착을 얻는다. 색 팔레트는 사이트의 코럴 `--brand`와 위험 `--game-danger`만 쓴다 — 보라-청록 AI 슬롭 금지.

---

## 5. Sprint 범위 계약

**허용**:
- SPEC에 명시된 "콤보/파티클/스케일 사운드/리플레이 개선/스폰 안전지대" 기능과 그 기능이 **정상 동작하려면 불가피한 최소 연동 변경** (예: state 추가, DOM id 추가, 기존 `update()` 내 훅 삽입).
- Critical 버그 1~6번 모두 수정 (범위 내로 간주).

**금지**:
- SPEC에 없는 독립 신기능 (예: 새 아이템, 새 적 유형, 파워업, 난이도 새로 추가, 리더보드/공유).
- 사이트 전역 CSS 변수 삭제/변경 (추가는 `--game-*` 네임스페이스로만 허용).
- 외부 라이브러리/이미지/폰트 추가.
- 캔버스 해상도(640×400) 변경.
- 보라-청록 그라디언트, 하드코딩 색상, `border-radius: 20px+`, 맥락 없는 거대 그림자.

**판단 기준**: "이 변경이 없으면 SPEC의 콤보/파티클/사운드/버그수정이 제대로 동작하지 않는가?" — YES면 허용, NO면 금지.

---

## 6. 구체 실행 항목

### A. `pages/game.html` 변경

**A1. HUD에 콤보 슬롯 추가** — 중독성 기여: 콤보를 눈으로 계속 확인할 수 있어야 "지키고 싶다"는 동기가 생긴다.
- `.game-hud` 내부, Score와 Best 사이에 **새 `.game-hud__slot`** 추가:
  ```
  <div class="game-hud__slot game-hud__slot--combo">
    <span class="game-hud__label">Combo</span>
    <span class="game-hud__value" id="hudCombo">0</span>
  </div>
  ```
- 기존 Score 슬롯에 `aria-live="polite"` 부여하여 점수/콤보 변화를 스크린리더에 전달.

**A2. 시작 오버레이에 목표 점수 표시** — 중독성 기여: 명확한 목표는 도전 심리를 자극.
- `.game-overlay__hint` 아래에 `<p class="game-overlay__goal" id="startGoal">목표 <strong>18</strong>점 · 45초</p>` 추가. 난이도 변경 시 JS가 갱신.

**A3. 종료 오버레이에 통계 블록 추가** — 중독성 기여: "내가 얼마나 나아지고 있는지" 가시화.
- `.game-overlay__score` 다음에:
  ```
  <ul class="game-overlay__stats" id="endStats">
    <li><span>최대 콤보</span><b id="statMaxCombo">0</b></li>
    <li><span>F 피격</span><b id="statHits">0</b></li>
    <li><span>정확도</span><b id="statAccuracy">100%</b></li>
  </ul>
  ```
- `정확도 = 수집 / (수집 + 피격) * 100`, 반올림 정수.

**A4. 캔버스 라이브 영역** — 구현 단순화를 위해 **A1의 Score `aria-live` 만으로 갈음**. → 이번 스프린트에서 제외.

**A5. "지금 연주 중" 음정 표시** — HUD 컴팩트 유지. 추가하지 않음.

**A6. `btnReplay`는 HTML 라벨 유지**하되 JS에서 직접 `startGame()` 호출 (C1 참고). HTML 변경 없음.

### B. `assets/css/game.css` 변경

**B1. `--game-*` 네임스페이스 변수 확장** — 파티클/콤보 글로우 컬러를 변수로:
```
:root {
  --game-combo-glow: var(--brand-40);
  --game-particle: var(--brand-light);
}
html.light {
  --game-combo-glow: var(--brand-35);
}
```
> 기존 `--brand*` 변수를 **재사용**해서 색 일관성. 새 색 하드코딩 금지.

**B2. `.game-hud__slot--combo`의 `.game-hud__value` 상태 클래스**:
- `.is-combo-bump` (0.22s 바운스): `transform: scale(1.25)` 후 복귀.
- `.is-combo-hot` (3연쇄 이상): 텍스트 컬러 `var(--brand-light)`, `text-shadow: 0 0 10px var(--game-combo-glow)`.
- 새 키프레임 `@keyframes gameComboBump`를 0→scale(1.25)→scale(1) 0.22s ease-out로 정의.
- 중독성 기여: 매 +1마다 숫자가 "튕긴다" — Juice 핵심.

**B3. 캔버스 셰이크 효과** — `.game-canvas-wrap.is-shake` 클래스 시 0.25s 동안 `transform: translate()`로 4픽셀 미세 진동 (F 피격 시 JS가 부여/해제). `prefers-reduced-motion`에선 비활성.

**B4. 콤보 리본** — 이번 스프린트에서 미루고, 콤보 표현은 HUD 슬롯 + 파티클로만 처리.

**B5. 시작 오버레이 목표 표시 스타일**:
- `.game-overlay__goal { font-size: 12px; color: var(--text-muted); & strong { color: var(--brand-light); font-weight: 700; } }`.

**B6. 종료 통계 리스트 스타일**:
- `.game-overlay__stats { display: flex; justify-content: space-between; gap: 8px; margin-top: 4px; padding: 10px 12px; background: var(--brand-06); border-radius: var(--radius-sm); border: 1px solid var(--brand-20); }`
- `& li { list-style: none; display: flex; flex-direction: column; gap: 2px; flex: 1; text-align: center; }`
- `& li span { font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-dim); }`
- `& li b { font-size: 16px; color: var(--text); font-variant-numeric: tabular-nums; }`
- 모바일(`@media (max-width: 520px)`)에서 `font-size` 축소.

**B7. 콤보 슬롯 모바일 대응** — HUD 4슬롯이 좁아짐 → `@media (max-width: 520px) .game-hud { gap: 4px; } .game-hud__label { font-size: 8px; } .game-hud__value { font-size: 15px; }`.

**B8. reduced-motion 확장**:
- `.game-canvas-wrap.is-shake { animation: none; transform: none; }`, `.game-hud__value.is-combo-bump { animation: none; transform: none; }` 추가.

### C. `assets/js/game.js` 변경

**C1. 리플레이 즉시 재시작** (Critical #1):
- `btnReplay.addEventListener` 핸들러를 `() => { overlayEnd.classList.add('is-hidden'); startGame(); }` 로 변경.

**C2. 오버레이 상태에서 화살표 스크롤 방지 + 키 누적 방지** (Critical #2):
- `keydown` 핸들러 시작부에 `const overlayOpen = !overlayStart.classList.contains('is-hidden') || !overlayEnd.classList.contains('is-hidden') || (cutOverlay && !cutOverlay.classList.contains('is-hidden'));`.
- 오버레이가 열려 있으면 `state.keys[dir] = false` 유지 + `if (dir) e.preventDefault()`.

**C3. 게임 진행 중 난이도 변경 차단** (Critical #3):
- `diffBtns.forEach` 클릭 핸들러 맨 앞에 `if (state.running) return;`.

**C4. 스폰 안전지대 보장** (Major #9, #10):
- `findEmptyTile`에 옵션 파라미터 `avoid` (타일 좌표 배열, 맨해튼 거리 기준) 추가.
- MIN_DIST=4. 200회 시도 중 avoid와 거리 조건 만족하는 타일 우선. 실패 시 avoid 무시 fallback.
- `spawnObstacle()`, `spawnNote()` 모두 플레이어 타일을 `avoid`에 넣어 호출.

**C5. 컷씬 복귀 시 스폰 타이머 보정** (Critical #5):
- `resumeFromCutscene()`에서 `const intervalSec = lerp(diff.spawnInterval[0], diff.spawnInterval[1], curveT()); state.nextSpawnAt = performance.now() + intervalSec * 1000;`.

**C6. 컷씬 닫기 키보드 확장** (Major #7):
- `if ((e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') && cutOpen) { e.preventDefault(); resumeFromCutscene(); }`.

**C7. 콤보 시스템** — 중독성 핵심 훅.
- `state`에 `combo: 0`, `maxCombo: 0`, `hits: 0`, `collected: 0` 추가.
- 음표 수집 시:
  - `state.combo += 1; state.maxCombo = Math.max(state.maxCombo, state.combo); state.collected += 1;`
  - **점수 가산**: 기본 1점 + 3콤보부터 +1, 5콤보부터 +2, 7콤보 이상 +3.
  - HUD 콤보 슬롯 갱신 + `is-combo-bump` 클래스 토글 (애니메이션 끝은 `animationend` 리스너 `{ once: true }`로 제거).
  - 3콤보 이상이면 `is-combo-hot` 추가, 미만이면 제거.
  - **수집 사운드 콤보 단계별 상승 스케일** (C4→D4→E4→G4→A4→C5→D5→E5…):
    - `const SCALE_FREQS = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];`
    - `playTone(SCALE_FREQS[Math.min(state.combo-1, SCALE_FREQS.length-1)], 0.09);`
- F 피격 시:
  - `state.hits += 1; state.combo = 0;`
  - 콤보 슬롯 갱신 + `is-combo-hot` 제거.
  - **저음 2연타**: `playTone(196, 0.12); setTimeout(() => playTone(147, 0.18), 90);`.
  - **캔버스 셰이크**: `canvasWrap.classList.add('is-shake')` + `animationend` 리스너 `{ once: true }` (reduced-motion 체크).

**C8. 파티클 시스템** — 중독성 기여: 수집 쾌감 시각화.
- `state.particles = []`. 각 파티클: `{x, y, vx, vy, life, maxLife}`.
- 수집 시 6개, 3콤보 이상 10개, 7콤보 이상 14개 스폰.
- update(dt): `life -= dt; x += vx*dt; y += vy*dt; vy += 120*dt` (중력). life<=0 제거.
- render: 3~4px 네모, `themeColors().brandHi`, `ctx.globalAlpha = life/maxLife`.
- reduced-motion에선 파티클 생략.

**C9. 속도에 콤보 반영 제거** — 콤보는 점수/피드백에만 반영. 플레이어 속도는 건드리지 않음.

**C10. 종료 통계 업데이트**:
- `endGame()`에서 `statMaxCombo.textContent = state.maxCombo; statHits.textContent = state.hits;`.
- `accuracy = state.collected === 0 && state.hits === 0 ? 100 : Math.round(state.collected / (state.collected + state.hits) * 100);`.
- DOM 참조는 `getElementById` 가드 필수.

**C11. 성공/실패 엔딩 텍스트 강화**:
- 성공 + 신기록: `"음표 ${score}개로 신곡 완성. 수간호사도 모르는 김간호의 첫 트랙이 태어났다."`
- 성공 + 비신기록: `"${score}개. 좋은 후렴이지만, 김간호는 더 높은 코드를 원한다."`
- 실패 + 목표 근접(target-2 이상): `"${score}점. 한 음만 더 있었으면… 다음 교대 시간엔 반드시."`
- 실패 + 그 외: 기존 메시지 유지.

**C12. 시작 오버레이 목표 점수 동적 갱신**:
- `initDiffButtons`에서 `const goalEl = document.getElementById('startGoal'); if (goalEl) goalEl.querySelector('strong').textContent = TARGET_SCORE[state.difficulty];`.
- 초기 로드 시에도 한 번 호출.

**C13. 초기 preview** — 스폰 안전지대는 preview엔 무관. 작업 없음.

**C14. 밸런스 조정**:
- `TARGET_SCORE`: Easy 18 → **22**, Normal 14 → **16**, Hard 10 → **12** (콤보 보너스로 점수 인플레 예상).
- `DIFFICULTY.easy.notes` 6 → **5** (탐험감 확보).
- `DIFFICULTY.normal.notes` 4 유지.
- `DIFFICULTY.hard.notes` 2 → **3** (운 게임화 방지).
- `DIFFICULTY.hard.noteTtl` 3000 → **4000**.
- 스턴 시간 유지.

**C15. 접근성 — HUD score `aria-live`**:
- HTML A1에서 `aria-live="polite"` 부여. JS는 textContent만 쓰면 자동 announce.

---

## 7. 수락 기준 (Acceptance Criteria)

### 기능 동작
- [ ] 시작 화면에서 난이도 선택 → "시작" 클릭 → 인트로 컷씬 → 게임 진행 → 15s/30s 컷씬 → 타임업 → 종료 화면까지 끊김 없이 진행.
- [ ] 종료 화면 "다시 플레이" 클릭 시 **즉시** 새 게임 시작 (시작 화면 거치지 않음).
- [ ] 게임 중 난이도 버튼 클릭해도 현재 게임 난이도가 바뀌지 않음.
- [ ] 인트로 컷씬을 5초 이상 두고 닫아도, 재개 직후 F가 한꺼번에 쏟아지지 않음.
- [ ] 플레이어 스폰 지점 4타일 내에 F가 스폰되지 않음 (시작 후 1초 내 피격 불가).
- [ ] 오버레이 열려 있을 때 화살표 키가 페이지 스크롤을 유발하지 않음.
- [ ] 컷씬을 Escape / Enter / Space 어느 키로도 닫을 수 있음.

### 중독성 / Juice
- [ ] 음표 수집 시 콤보 HUD 값이 1씩 증가하며 바운스 애니메이션 (reduced-motion 비활성).
- [ ] 3콤보 이상 시 콤보 숫자 컬러가 `--brand-light`로 변하고 미세 글로우.
- [ ] 수집 사운드가 콤보 단계에 따라 C4→D4→E4… 스케일로 상승.
- [ ] 5콤보 이상 시 수집 파티클 개수가 증가 (4→10→14 — 정확히는 6→10→14).
- [ ] F 피격 시 콤보 0 리셋 + 캔버스 셰이크 + 저음 2연타.
- [ ] 종료 화면에 최대 콤보 / F 피격 / 정확도 표시.
- [ ] 시작 화면 목표 점수 표시 & 난이도 전환 시 갱신.
- [ ] 성공/실패 엔딩 문구가 상황 분기.

### 코드 품질
- [ ] 하드코딩 색상 0건. 색은 `--brand*` / `--game-*` 변수로만.
- [ ] 새 CSS 변수는 `--game-` 네임스페이스 (`--game-combo-glow`, `--game-particle`).
- [ ] CSS 네이티브 중첩 `&` 문법 준수.
- [ ] BEM: `.game-overlay__stats`, `.game-overlay__goal`, `.game-hud__slot--combo`, `.is-combo-bump`, `.is-combo-hot`, `.is-shake` 일관.
- [ ] 모든 애니메이션 종료는 `animationend` + `{ once: true }`. `setTimeout`으로 애니메이션 종료 감지 금지.
- [ ] `prefers-reduced-motion: reduce`에서 파티클·셰이크·콤보 바운스 비활성.
- [ ] 모바일 520px HUD 4슬롯 레이아웃 OK.

### 보안 & 접근성
- [ ] 모든 동적 텍스트 `textContent`.
- [ ] Score 슬롯 `aria-live="polite"`.
- [ ] 포커스 가시성 유지.

### 회귀 방지
- [ ] 기존 컷씬(intro/mid1/mid2) 트리거 타이밍 유지.
- [ ] 기존 맵(easy/normal/hard) 레이아웃 변경 없음.
- [ ] 기존 `--brand*`, `--radius*` 변수 삭제/변경 없음.
- [ ] 터치 D-pad 동작 유지.

---

## 8. 후속 과제 (이번 스프린트 제외)

- 업적/뱃지 시스템.
- 사운드 on/off 토글 UI.
- 리더보드/공유.
- 적 유형 다양화, 속도 패턴 추가.
- 파워업 아이템.
- 난이도 동적 조절 (DDA).
- 캔버스 상단 콤보 리본 배지.
- 캔버스 `role="img"` + 라이브 영역.

---

**관련 파일**:
- `C:\Users\user\Desktop\hyungyugod.github.io\pages\game.html`
- `C:\Users\user\Desktop\hyungyugod.github.io\assets\css\game.css`
- `C:\Users\user\Desktop\hyungyugod.github.io\assets\js\game.js`
