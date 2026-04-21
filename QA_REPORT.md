# QA 검수 보고서

**검수 대상**: SPEC.md — 게임 난이도 재조정 + 수간호사 시각화 + 프로필 HG 복구 + 즉사/재시작 흐름 개선
**변경 유형**: 혼합(기능 위주) → 기능 변경 평가 기준 적용
**검수 라운드**: R1

---

## UI 동작 검증 (Playwright)

```
=== Playwright UI Check ===
Server: http://localhost:8000 (managed: true)

[PASS] 테마 토글: 다크->라이트->다크 전환 정상
[PASS] 카테고리 필터 (writing): 3개 섹션 숨김 확인
[PASS] 카테고리 필터 (music): 3개 섹션 숨김 확인
[PASS] 카테고리 필터 (social): 3개 섹션 숨김 확인
[PASS] 카테고리 필터 (all): 0개 섹션 숨김 확인
[FAIL] 프로필 모달: locator.waitFor: Timeout 3000ms exceeded.
[PASS] 링크카드 href 유효성: 2개 링크 모두 유효
[PASS] 모바일 520px 뷰포트: 핵심 요소 3개 모두 visible
[PASS] 콘솔 에러: 0건

결과: 8/9 통과
```

| 체크 항목 | 결과 | 비고 |
|---|---|---|
| 테마 토글 | PASS | |
| 카테고리 필터 (4종) | PASS | |
| 프로필 모달 | FAIL | 테스트 스크립트 결함(사전 존재) — 이번 SPEC과 무관. 상세는 P2 이슈 3번 참고. |
| 링크카드 href | PASS | |
| 모바일 520px | PASS | |
| 콘솔 에러 | PASS (0건) | |

게임 페이지 Playwright 자동 검증은 ui-check.js 대상에 없음 — 아래 SPEC 기능 검증은 정적 코드 분석 기반 수행.

스크린샷: tests/screenshots/

---

## SPEC 기능 검증

### 기능 1: 프로필 HG 폴백 복구
- [PASS] style.css:186-196 (html.light .profile__name): `color: var(--text);` 선두 + `@supports not (-webkit-background-clip: text)` 가드로 `-webkit-text-fill-color: currentColor;` 복원 — 정확히 추가.
- [PASS] style.css:407-428 (.hero & .profile__name 중첩 블록): 라인 414에 `color: var(--brand-light);` 폴백 + 라인 425-427에 동일 `@supports not` 가드 추가.
- SPEC 지시대로 라인 186/402 부근 두 군데 모두 처리. gradient 클립 실패 시에도 HG 텍스트가 단색으로 렌더링됨.

### 기능 2: 성공 기준 변경 (easy 80 / normal 60 / hard 60)
- [PASS] game.js:38 — `const TARGET_SCORE = { easy: 80, normal: 60, hard: 60 };` SPEC 값과 정확히 일치.
- [PASS] `updateStartGoal()` (line 640-644)이 `TARGET_SCORE[state.difficulty]`를 `<strong>`에 주입 → 자동 반영.

### 기능 3: 수간호사 NPC 시각화 + 투척 로직
- [PASS] `state.nurseChief` 객체(line 578-589): x, y, dir, frameAcc, frame, patrolPath, patrolIdx, throwTimer, telegraphUntil, throwArmUntil, active 모두 존재.
- [PASS] `initNurseChief()` (line 1024-1068): easy=좌우 2점 40px/s, normal=대각선 4점 60px/s, hard=4모서리 80px/s — SPEC과 일치.
- [PASS] `nurseChiefSprite()` (line 423-490): 16x20 백발(H)+안경(G)+베이지 상의(U) 스프라이트. 김간호(`nurseSprite`)와 색/안경/팔레트 모두 차별화.
- [PASS] `drawNurseChief()` (line 515-531): getChiefPalette() 캐시로 CSS 변수 읽어 렌더. 테마 토글 시 `chiefPaletteCache = null` 무효화(line 18).
- [PASS] 렌더 루프(line 1412-1421): `chief.active`이면 플레이어 그리기 이전에 `drawNurseChief()` 호출, 텔레그래프 조건부 `drawTelegraph()` 호출.
- [PASS] `spawnObstacleFromChief()` (line 1141-1181): `chief.x/y` 기준 플레이어 방향 atan2, `throwBurst` 루프, ±15도 스프레드, 벽 충돌 시 `findEmptyTile` 폴백.
- [PASS] `updateNurseChief()` (line 1075-1134): 패트롤 선형 보간, 걷기 프레임, 투척 타이머 → 0.4s 텔레그래프 → 실제 투척 → 팔 올림 180ms.
- [PASS] CSS 변수 `--nurse-chief-hair/-glass/-uniform/-accent/-uniform-shadow` game.css:13-17에 추가.

### 기능 4: 난이도 파라미터 재조정
game.js:43-47 DIFFICULTY 테이블 — SPEC 표와 완전히 일치:

| 키 | easy | normal | hard |
|---|---|---|---|
| notes | 5 OK | 5 OK | 4 OK |
| noteTtl | Infinity OK | 5500 OK | 3500 OK |
| obstacles | 1 OK | 3 OK | 5 OK |
| obsBaseSpeed | 60 OK | 120 OK | 170 OK |
| obsMaxSpeed | 110 OK | 210 OK | 290 OK |
| spawnInterval | [3.5,2.0] OK | [1.6,0.6] OK | [1.0,0.35] OK |
| maxObstacles | 2 OK | 6 OK | 10 OK |
| throwBurst | 1 OK | 2 OK | 3 OK |

[PASS] 모든 수치 일치.

### 기능 5: 난이도 다시 선택 버튼
- [PASS] pages/game.html:115 — `<button class="game-btn game-btn--ghost" type="button" id="btnBackToDifficulty">난이도 다시 선택</button>` SPEC 구조 정확.
- [PASS] 버튼 순서(game.html:114-116): 다시 플레이 | 난이도 다시 선택 | 홈으로 — SPEC과 일치.
- [PASS] game.js:624 DOM 참조, game.js:700-744 가드 포함 이벤트 바인딩.
- [PASS] 핸들러: 루프 취소 → 비네트/셰이크 제거 → 상태 초기화(score/combo/maxCombo/hits/collected/timeLeft/notes/obstacles/particles/keys/gameoverReason/nurseChief.active) → HUD 리셋 → overlayEnd/overlayCutscene 숨김 → overlayStart 표시 → `renderPreview()` → 활성 난이도 버튼 포커스 복귀.

### 기능 6: F 즉사 처리
- [PASS] game.js:1336-1360 장애물 충돌 블록이 SPEC 사양대로 교체됨: hits += 1 / combo = 0 / 저음 2연타(110Hz, 82Hz) / is-shake + is-gameover 클래스 / gameoverReason = 'hit' / endGame() / return. 기존 스턴+감점+밀어내기 코드 제거됨.
- [PASS] `p.stunUntil`은 state/update/render에 참조가 남아있으나 충돌 시 더 이상 세팅하지 않음 → 데드 브랜치. SPEC 주의사항 '섣불리 삭제하지 말 것' 준수.
- [PASS] `endGame()` 분기(line 881-907): hitEnd && !success일 때 제목 '수간호사에게 걸렸어요!' / 문구 'F 한 장에 노래가 멈췄다…' / `--fail` 스타일. 시간초과 분기는 `gameoverReason = 'time'` 경로 유지.
- [PASS] game.css:214-224 `.game-canvas-wrap.is-gameover`: keyframes `gameGameoverVignette` 0.6s ease-out, peak box-shadow `inset 0 0 80px var(--game-danger-20)` — SPEC 사양 일치.
- [PASS] game.css:767-770 reduced-motion 블록에 `.is-gameover { animation: none; box-shadow: none; }` 대응.

---

## Sprint 범위 검증

| 항목 | 검증 결과 |
|---|---|
| index.html 수정 없음 | PASS (git diff 빈 결과) |
| assets/js/main.js 수정 없음 | PASS (git diff 빈 결과) |
| :root 값 변경/삭제 없음 | PASS (신규 --nurse-chief-* 5건 추가만, 기존 변수 불변) |
| 게임 외 페이지 수정 없음 | PASS |
| SCSS 문법 미도입 | PASS ($var, @mixin, @include, @extend 0건) |
| 새 파일 생성 없음 | PASS |
| SPEC 외 독립 기능 없음 | PASS — 연동 변경(`renderPreview` 승격, 팔레트 캐시, 시작 오버레이 desc 1줄)은 모두 SPEC 허용 범위 내 |

---

## 검수 결과 요약

| 등급 | 건수 |
|---|---|
| P0 치명 | 0건 |
| P1 중요 | 0건 |
| P2 권장 | 3건 |

---

## P0 — 치명적 이슈
없음.

## P1 — 중요 이슈
없음.

## P2 — 권장 사항

### 1. endGame 성공+피격 분기 텍스트 일관성
- **파일**: assets/js/game.js:881-896
- **현상**: 플레이어가 목표 달성과 동시에 같은 프레임에 F에 닿는 극단적 경계 케이스에서 `gameoverReason === 'hit'`이지만 `success === true`가 되면 '노래를 무사히 만들었어요!' 분기로 들어가 피격 서사가 소거된다.
- **현재 로직**: `if (hitEnd && !success) { 실패 서사 } else if (success) { 성공 서사 } else { 시간초과 서사 }`
- **수정 제안(선택)**: hitEnd 성공 시 별도 서사 변형을 추가하거나 '목표 달성 우선'을 주석으로 명시. SPEC 미명시 사항이라 감점 없음.

### 2. endStory 클래스 중복 부여
- **파일**: assets/js/game.js:879
- **현상**: HTML의 `<p class="game-overlay__ending" id="endStory">`(game.html:112)에 이미 기본 클래스가 붙어 있는데 endGame마다 `classList.add('game-overlay__ending')`를 재실행. 동작엔 영향 없으나 불필요.
- **수정 제안**: 해당 줄 삭제 또는 `--fail` 제거만 수행하도록 축소.

### 3. Playwright ui-check 셀렉터 불일치 (SPEC 외, 사전 존재 결함)
- **파일**: tests/ui-check.js:187
- **현상**: `.profile__btn.js-open-profile` 셀렉터를 찾는데 index.html:52는 `.profile__avatar.js-open-profile`. 이전 커밋부터 존재한 테스트 스크립트 결함(이번 SPEC은 index.html을 수정하지 않음) → 이번 스프린트 회귀 아님.
- **수정 제안(선택)**: 다음 스프린트에서 `.js-open-profile` 단독 셀렉터로 정정하여 모달 검증 복구.

---

## 통과 항목 (정성 요약)

- **보안**: 새 동적 텍스트(엔딩 제목/문구/컷씬 텍스트)는 모두 `textContent`만 사용. innerHTML / eval / document.write / 인라인 이벤트 핸들러 0건. 캔버스 픽셀 렌더링이므로 XSS 표면 자체가 없음.
- **CSS 패턴**: 네이티브 중첩 `&` 일관, 하드코딩 색상은 캔버스 스프라이트 내부 팔레트를 제외하고 추가 없음, `!important`는 사전 존재한 reduced-motion 전역 규칙만, `-webkit-backdrop-filter` 함께 사용.
- **JS 패턴**: 유틸/init은 function 선언식(`function lerp`, `function buildMap`, `function renderPreview` 등), 콜백은 화살표 함수. 가드 클래스 일관 사용(`if (!chief.active || !chief.patrolPath.length) return;`, `if (btnBackToDifficulty)`, `if (!startGoalEl) return;`). JSDoc 주석 다수. `try/catch` 적용(`loadBest`, `saveBest`, `playTone`).
- **HTML 구조**: 새 버튼 `type="button"` 명시, 기존 `role/aria-checked/aria-label` 보존, 새 인라인 스타일 없음, `target="_blank"` 사용 없음.
- **반응형 & 접근성**: 신규 버튼은 기존 `.game-cta { flex-direction: column; } .game-btn { width: 100%; }` 520px 규칙 자동 상속. `reducedMotion` 가드 5개 경로(걷기 프레임, 텔레그래프 깜빡임, 비네트, 셰이크, 콤보 bump) 모두 대응.
- **파일 간 정합성**: `#btnBackToDifficulty` HTML↔JS 일치, `--nurse-chief-*` CSS↔`readVar()` 일치, `.is-gameover` CSS↔JS 일치, `.game-overlay__ending--fail` CSS↔JS 일치.
- **Sprint 범위**: index.html(홈)/main.js 무수정, `:root` 기존 값 불변, SPEC 외 독립 기능 0건.

---

## 채점

### 항목별 점수

- **패턴 일관성 (40%)**: **9/10** — BEM, CSS 변수, 네이티브 중첩, JS init 패턴, JSDoc 모두 준수. 팔레트 캐시 + 테마 토글 무효화 + reflow 트릭 모두 기존 패턴과 동일. P2 사소 불일치 1건(redundant classList.add).
- **보안 & 접근성 (25%)**: **9/10** — textContent 주입, 포커스 복귀(`{preventScroll:true}`), role/aria-checked 보존, type="button", `prefers-reduced-motion` 5개 경로 가드. XSS/인라인핸들러/eval 0건.
- **반응형 & UI 품질 (20%)**: **9/10** — 520px 블록 자동 상속, `--fail` 톤 일관, 비네트·셰이크 reduced-motion 대응, canvas `image-rendering: pixelated` 유지. 데스크탑/모바일 시각 일관성 훌륭.
- **기능 완성도 (15%)**: **10/10** — SPEC 6개 기능 전부 정확 구현. TARGET_SCORE + DIFFICULTY 전 수치(8×3=24셀) 완벽 일치. 수간호사 패트롤·텔레그래프·투척·팔 올림·벽 회피·팔레트 캐시·포커스 복귀까지 모두 작동 가능한 구조.

### 가중 점수

= 9 × 0.4 + 9 × 0.25 + 9 × 0.2 + 10 × 0.15
= 3.6 + 2.25 + 1.8 + 1.5
= **9.15 / 10.0**

---

## 최종 판정: **합격**

- P0 0건, P1 0건 → 이슈 건수 기준 충족
- 가중 점수 9.15 ≥ 7.0 → 점수 기준 충족

**관대함 자가점검**: 9.15는 8.0 이상이므로 재검토를 1회 수행했다. 디자인·코드·접근성·SPEC 준수·범위 준수 각 영역을 하나씩 재확인했고, P1 이상으로 승격할 이슈를 찾지 못했다. SPEC 6가지 기능이 모두 정확한 수치/구조로 구현되었고, Sprint 범위 계약(index.html·main.js·`:root` 불변 등)이 엄격히 지켜졌다. 수간호사 NPC는 단순 스프라이트 추가를 넘어 패트롤 경로 분기·텔레그래프 지연·팔 올림 프레임·팔레트 캐시 무효화·벽 충돌 폴백까지 완결적으로 구현되어 있다. 특히 SPEC이 명시한 8×3=24개 난이도 수치가 단 하나의 오차 없이 일치함.

**구체적 개선 지시 (선택, 다음 스프린트 반영용)**:
1. (P2) assets/js/game.js:879 의 `endStory.classList.add('game-overlay__ending')` 중복 호출 제거. HTML에 이미 기본 클래스가 있으므로 불필요.
2. (P2) assets/js/game.js:881-896 — `hitEnd && success` 경계 케이스용 서사 변형 추가 또는 '목표 달성 우선' 설계 주석 삽입.
3. (P2, SPEC 외) tests/ui-check.js:187 셀렉터를 `.js-open-profile` 단독으로 정정하여 Playwright 프로필 모달 체크 복구.
