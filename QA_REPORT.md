# QA 검수 보고서 — 캐릭터별 스킬 5종

## UI 동작 검증 (Playwright)

`npm run ui-check` (일반 사이트 기본 체크):

| 체크 항목 | 결과 | 비고 |
|---|---|---|
| 테마 토글 | PASS | 다크↔라이트 전환 정상 |
| 카테고리 필터 (writing/music/social/all) | PASS | 4종 모두 통과 |
| 프로필 모달 | FAIL | **범위 밖 pre-existing** — 이번 스프린트는 game.html 한정, index.html 모달 미변경 |
| 링크카드 href | PASS | 2개 모두 유효 |
| 모바일 520px | PASS | 핵심 요소 visible |
| 콘솔 에러 | PASS | 0건 |

`node tests/game-check.js` (iPhone SE 375×667 — 게임 페이지):
- overlayHasScroll=false, 시작 버튼 오버레이 내부 가시=true, 콘솔/페이지 에러=0건.

스크린샷: `tests/screenshots/`

**판단**: 프로필 모달 실패는 index.html/main.js 관련 pre-existing 이슈로, 이번 스프린트(pages/game.html + game.css + game.js)의 변경 범위와 무관. 패널티 미적용.

---

## SPEC 기능 검증

### 1. 스킬 상수 & state 확장
- [PASS] `SKILLS` 5종 (kim/jung/geon/im/lee) name·desc·durationMs·cooldownMs·abbr 모두 SPEC과 1:1 일치. (game.js:115–121)
- [PASS] `IM_SLOW_FACTOR=0.6`, `JUNG_DASH_TILES=3`, `JUNG_DASH_PX=JUNG_DASH_TILES*TILE`, `JUNG_BREAK_RADIUS=18`, `GEON_MAGNET_RADIUS=6*TILE`. (game.js:122–126)
- [PASS] `state.skill = { readyAt, activeUntil, lastUsedAt, flashUntil }` + `state.player.invincibleUntil`. (game.js:879, 881)

### 2. 5개 스킬 effect 함수
- [PASS] **kim — 응급 회피**: `p.invincibleUntil = now + 1000`. F/수간호사/이교수/청진기 충돌 블록 전부 `now >= p.invincibleUntil` 가드로 스킵. (game.js:2355–2358, 2718, 2747, 2776, 2799)
- [PASS] **jung — 곡괭이 돌진**: 현재 `p.dir` 축 벡터 TILE/2 스텝으로 `isWallAt` 충돌 체크하며 전진(최대 3타일). 가장 가까운 F 1개가 <18px이면 제거+파티클. 260ms 무적. (game.js:2361–2401)
- [PASS] **geon — 북클럽 소집**: 플레이어 중심 기준 6타일(=120px) 이내 음표 수집, 기존 콤보/gain 공식 재실행, 사운드 1회, 각 위치 파티클 4개, 0개면 false 반환(쿨다운 미소모). (game.js:2403–2441)
- [PASS] **im — 벼락치기**: executeSkill은 true만 반환, `update()`에서 `imSlow = 0.6` 분기로 F·청진기·`updateNurseChief`·`updateProfessor`에 `dtSlow` 전달. 플레이어 속도는 원본 dt 유지. (game.js:2443–2447, 2581–2613)
- [PASS] **lee — 워프**: 맵 빈 타일 중 NPC·이교수로부터 `SPAWN_SAFE_DIST` 이상, 플레이어 맨해튼 거리 최대 칸 선택. 출발·도착 파티클 2연. 500ms 무적. bestTile 없으면 false. (game.js:2449–2493)

### 3. 쿨다운/지속시간 관리
- [PASS] `tryActivateSkill`: `now < state.skill.readyAt` 가드 → executeSkill 실패 시 early return → 성공 시에만 readyAt/activeUntil/flashUntil 갱신. (game.js:2324–2344)
- [PASS] `updateSkillHud(now)`: `prog = 1 - clamp((readyAt-now)/cd)` 매 프레임 계산, HUD·keypad 동시 상태 동기화. (game.js:2502–2530)
- [PASS] `startGame()`에서 `readyAt=now`, `activeUntil/lastUsedAt/flashUntil=0`, `invincibleUntil=0`로 초기화. (game.js:1488–1496)
- [PASS] `endGame()`에서 skill 필드 0 + HUD/keypad 클래스 제거. (game.js:1561–1572)

### 4. 입력 — 모바일 중앙 버튼 + 데스크톱 Shift
- [PASS] Shift (좌/우) keydown: `e.repeat` 무시, `isAnyOverlayOpen()` + `!state.running` 가드, `preventDefault` 후 `tryActivateSkill()`. (game.js:1431–1437)
- [PASS] 모바일 `keypadSkill` pointerdown: 오버레이/running 가드, pointerCapture, is-pressed 토글, `tryActivateSkill()`. pointerup/cancel/leave 전부 release 처리. (game.js:3030–3051)
- [PASS] 터치 타겟: 72×72(≤380px시 60×60) — 48px 이상 충족. (game.css:1098–1156)

### 5. 오버레이 플로우
- [PASS] 난이도 → 캐릭터 → 스킬 → 게임: `btnCharacterConfirm`이 `renderSkillOverlay()` → `overlaySkill.remove('is-hidden')` → `btnSkillStart.focus()`. (game.js:1288–1301)
- [PASS] `btnSkillStart` → `startGame()`. (game.js:1371–1376)
- [PASS] `btnSkillBack` → overlayCharacter 복귀 + 활성 카드 포커스. (game.js:1378–1389)
- [PASS] Esc 키: 스킬 오버레이 열려있을 때 `btnSkillBack.click()`. (game.js:1391–1398)
- [PASS] `isAnyOverlayOpen()`에 `overlaySkill` 포함. (game.js:1421–1428)

### 6. 기존 게임플레이 불변 (Sprint 범위 계약)
- [PASS] 스프라이트/팔레트/`nurseSprite`/`drawCharacterCardAvatar`: 수정 없음 (읽기·재사용만).
- [PASS] `buildMap`, `DIFFICULTY`, `TARGET_SCORE`, `CHARACTERS`, `CUTSCENES`, `TOILET`, `KEY_MAP`: 모두 불변.
- [PASS] `updateNurseChief`/`updateProfessor` **본체 시그니처 불변**, 호출부에서 `dtSlow` 스케일만 주입. (game.js:2606, 2609)
- [PASS] `spawnObstacle`/`spawnObstacleFromChief`: 수정 없음.
- [PASS] F 즉사 / 청진기 2초 정지 / 콤보 공식(3+:+1, 5+:+2, 7+:+3): 모두 기존 그대로 유지. geon 스킬도 동일 공식 재실행.
- [PASS] 테마 토글 / localStorage / 변기 / 컷씬: 불변.

### 7. 보안 (XSS) — skillCard 렌더
- [PASS] `renderSkillOverlay()` 전체가 `createElement` + `textContent`만 사용. `innerHTML` / `insertAdjacentHTML` 없음. 기존 자식은 `while (skillCard.firstChild) removeChild` 루프로 비움. SKILLS는 내부 정적 상수라 외부 주입 위험 0. (game.js:1313–1369)

### 8. 접근성 & reduced-motion
- [PASS] `role="dialog"` + `aria-labelledby="skillTitle"` + `aria-describedby="skillDesc"`. HUD `aria-live="polite"`, skill label `aria-hidden="true"`. (game.html:109–123, 57–63)
- [PASS] `@media (prefers-reduced-motion: reduce)`: 카드 진입 animation / breath / flash / keypad transition 모두 비활성. (game.css:1466–1530)

---

## 검수 결과 요약

| 등급 | 건수 |
|---|---|
| P0 치명 | 0건 |
| P1 중요 | 0건 |
| P2 권장 | 2건 |

## P0 — 치명적 이슈
없음.

## P1 — 중요 이슈
없음.

## P2 — 권장 사항

### 1. `updateSkillHud`에서 `hudSkillLabel.textContent` 매 프레임 동일 문자열 재할당
- **파일**: `assets/js/game.js:2505`
- **현상**: `update()` 말미에서 매 프레임 호출되며 `hudSkillLabel.textContent = def.abbr` 항상 실행. DOM 엔진이 문자열 비교로 short-circuit하지만 명시적 가드가 취향상 권장됨.
- **수정 제안**:
  ```js
  if (hudSkillLabel && hudSkillLabel.textContent !== def.abbr) {
    hudSkillLabel.textContent = def.abbr;
  }
  ```
- **영향**: 성능 거의 없음. 코드 일관성(다른 HUD 슬롯들은 값 변경 시에만 업데이트).

### 2. `universal * { animation-duration: 0.01ms !important }` (pre-existing)
- **파일**: `assets/css/game.css:1532–1535`
- **현상**: `prefers-reduced-motion` 내부의 전역 `*` 셀렉터 `!important` 규칙은 강력하지만 이후 개별 규칙들과 중복. 이번 스프린트가 만든 문제는 아니므로 기록만.
- **수정 제안**: (선택) 개별 규칙만 유지하고 `*` 규칙 제거 검토. 이번 스프린트 범위 밖.

---

## 통과 항목

- **보안**: `createElement` + `textContent`만 사용, innerHTML 미사용, 인라인 이벤트 핸들러 미사용.
- **CSS 패턴**: BEM 네이밍, `--skill-accent` / `--skill-accent-glow` 변수 스코프, `data-char` 속성 주입, `&` 네이티브 중첩, `-webkit-backdrop-filter` 동반, SCSS 문법·`!important` 오남용 없음.
- **JS 패턴**: function 선언식, JSDoc 주석, 섹션 구분선, 가드 클래스(`if (!skillCard || !overlaySkill) return`), `performance.now()` 통일.
- **반응형**: `@media (max-width: 520px)` 패널·카드·링 축소, `@media (max-width: 380px)` 스킬 버튼 60×60.
- **접근성**: role/aria 속성, Esc 핸들러, `aria-live="polite"`, 포커스 관리, reduced-motion 대응.
- **파일 간 정합성**: HTML id(`overlaySkill`, `skillCard`, `btnSkillBack`, `btnSkillStart`, `hudSkill`, `hudSkillLabel`, `hudSkillSlot`, `keypadSkill`) ↔ JS `getElementById` 전부 일치. CSS 클래스 ↔ HTML/JS 일치.
- **Sprint 범위 계약**: 필수 연동 변경만 수행(`themeBtn` 재렌더, `selectCharacterCard` HUD 즉시갱신, 초기 1회 `updateSkillHud`). 범위 외 독립 기능 추가 없음.

---

## 채점

**항목별 점수** (기능 변경 기준 — SPEC "혼합"):
- **패턴 일관성**: 9/10 → BEM/CSS변수/네이티브중첩/JSDoc 모두 준수. P2 라벨 가드 누락 1건.
- **보안 & 접근성**: 10/10 → DOM API 전용 렌더, role/aria 완비, Esc/포커스 복귀, reduced-motion 세심.
- **반응형 & UI 품질**: 9/10 → 520/380px 브레이크포인트 대응, 터치 타겟 72/60px, 악센트 컬러 캐릭터별 스코프로 차별화 표현. glassmorphism 톤 일관.
- **기능 완성도**: 10/10 → SPEC 5개 스킬 + 쿨다운 + HUD + 플로우 + 범위 보전 모두 완수. 실패 조건(geon 0수집, lee bestTile 없음) 분기까지 구현.

**가중 점수**: (9×0.4) + (10×0.25) + (9×0.2) + (10×0.15) = 3.6 + 2.5 + 1.8 + 1.5 = **9.4 / 10.0**

## 최종 판정: **합격**

**스스로 관대함 재검토**: 이 구현은 SPEC 18개 기능 요건을 빠짐없이 처리했고, XSS·접근성·reduced-motion·팬텀 입력 방지 같은 교차 관심사도 사전 고려되었다. 범위 위반 없음. P1 이상 이슈 0건. 9.4점은 타당함.

**구체적 개선 지시** (선택적, 다음 스프린트 후보):
1. (P2) `updateSkillHud`의 `hudSkillLabel.textContent`를 변경 감지 가드로 감싸 매 프레임 재할당 제거.
2. (P2, 범위 밖) `prefers-reduced-motion` 내 universal `*` 규칙 정리 — 개별 규칙만 유지 검토.
3. (기록만) `tests/ui-check.js`의 프로필 모달 실패는 index.html 관련 pre-existing 이슈. 본 스프린트와 무관하나 별도 fix-up 스프린트 권장.
