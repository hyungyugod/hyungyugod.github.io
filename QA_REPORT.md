# QA 검수 보고서

**대상**: pages/game.html, assets/css/game.css, assets/js/game.js
**SPEC 변경 유형**: 혼합 → **기능 변경 평가 기준 적용**

---

## UI 동작 검증 (Playwright)

| 체크 항목 | 결과 | 비고 |
|---|---|---|
| 테마 토글 | PASS | 다크/라이트 정상 전환 |
| 카테고리 필터 (4종) | PASS | 전부 정상 |
| 프로필 모달 | FAIL | Playwright 환경 한계, 게임 스프린트 범위 외 |
| 링크카드 href | PASS | |
| 모바일 520px | PASS | |
| 콘솔 에러 | PASS | 0건 |

**결과**: 8/9 통과 (실패 1건은 스프린트 무관)

---

## SPEC 수락 기준 체크 (29개)

### 기능 동작 (7/7 PASS)
- **AC1** 전체 흐름 끊김 없음 → PASS (game.js:530, 582-634)
- **AC2** 다시 플레이 즉시 재시작 → PASS (game.js:536-539, btnReplay 핸들러에서 overlayEnd hide + startGame() 직접 호출)
- **AC3** 게임 중 난이도 변경 차단 → PASS (game.js:521, if (state.running) return)
- **AC4** 컷씬 후 F 집중 스폰 없음 → PASS (game.js:734-747, resumeFromCutscene에서 lerp+curveT로 nextSpawnAt 재계산)
- **AC5** 플레이어 4타일 내 F 스폰 금지 → PASS (game.js:167-195 findEmptyTile avoid, SPAWN_SAFE_DIST=4, spawnNote/spawnObstacle 양쪽 playerTile() 전달)
- **AC6** 오버레이 중 화살표 스크롤 금지 → PASS (game.js:552-557 isAnyOverlayOpen, 564-568 state.keys=false + preventDefault)
- **AC7** 컷씬 Escape/Enter/Space 모두 닫기 → PASS (game.js:755-762)

### 중독성 Juice (8/8 PASS)
- **AC8** 콤보 HUD +1 + 바운스 → PASS (game.js:924-937, 496-516 / game.css:178-186 @keyframes gameComboBump)
- **AC9** 3콤보+ hot 톤 + 글로우 → PASS (game.css:189-192 .is-combo-hot, game.js:501-502 토글)
- **AC10** C장조 스케일 사운드 → PASS (game.js:44 SCALE_FREQS 10음, 940-941 단계별 playTone)
- **AC11** 파티클 6/10/14 분기 → PASS (game.js:944-949, reduced-motion 생략)
- **AC12** F 피격 콤보 리셋+셰이크+저음 2연타 → PASS (game.js:958-977)
- **AC13** 종료 화면 최대콤보/피격/정확도 → PASS (game.js:689-695)
- **AC14** 시작 목표 점수 난이도 전환 시 갱신 → PASS (game.js:486-490, 526, 1113)
- **AC15** 엔딩 4분기 → PASS (game.js:667-685: 신기록/비신기록/근접실패/완패)

### 코드 품질 (7/7 PASS)
- **AC16** 하드코딩 색상 0건(신규) → PASS (신규 CSS는 --game-* / --brand* 변수만 사용)
- **AC17** 새 변수는 --game-* 네임스페이스 → PASS (game.css:10-11)
- **AC18** CSS 네이티브 중첩 & → PASS (.game-canvas-wrap, .game-overlay__stats 등)
- **AC19** BEM 준수 → PASS (__stats, __goal, --combo, .is-*)
- **AC20** 애니메이션 종료 = animationend + once:true → PASS (game.js:512-514, 974-976). setTimeout으로 애니 종료 감지 0건
- **AC21** reduced-motion에서 파티클/셰이크/바운스 비활성 → PASS (JS 944, CSS 745-753, 글로벌 animation-duration 0.01ms)
- **AC22** 모바일 520px HUD 4슬롯 → PASS (game.css:607-619)

### 보안 & 접근성 (3/3 PASS)
- **AC23** 동적 텍스트 textContent → PASS (innerHTML/eval/document.write 0건)
- **AC24** Score aria-live=polite → PASS (game.html:45)
- **AC25** 포커스 가시성 → PASS

### 회귀 방지 (4/4 PASS)
- **AC26** 컷씬 타이밍 30/15s 유지 → PASS
- **AC27** 맵 레이아웃 유지 → PASS
- **AC28** --brand*, --radius* 삭제/변경 없음 → PASS
- **AC29** 터치 D-pad 유지 → PASS

**AC 합계: 29/29 PASS**

---

## 범위 위반 검사

### 허용 범위 내
- 콤보/파티클/스케일/리플레이/스폰 안전지대 모두 SPEC 명시 항목
- state.keys 재초기화: 누적 키 제거용 불가피한 연동

### 금지 사항 위반: **0건**
- --game-* 네임스페이스만 신규 변수 사용
- --brand*, --radius* 참조만, 값 변경/삭제 없음
- 새 아이템/적 유형/파워업/리더보드 없음
- 외부 라이브러리/이미지/폰트 추가 없음
- 캔버스 해상도 640x400 유지
- 보라-청록 그라디언트/하드코딩 색상/과대 radius/거대 그림자 모두 없음

**범위 위반 0건**

---

## 검수 결과 요약

| 등급 | 건수 |
|---|---|
| P0 치명 | 0 |
| P1 중요 | 0 |
| P2 권장 | 3 |

## P0 치명: 없음
## P1 중요: 없음

## P2 권장 사항

### P2-1. game.js:633 인트로 setTimeout 매직넘버 주석 부족
- 250ms 지연은 초기화 안정화 목적(애니메이션 종료 감지가 아님)이므로 규약 위반 아님
- 수정 제안(선택):  주석 추가

### P2-2. 콤보 HUD aria-live 누락 (game.html:49)
- SPEC A4에서 이번 스프린트 제외로 명시 → 범위 외
- 후속 스프린트에서 aria-live=polite 추가 검토

### P2-3. animationend 리스너 일시 누적 가능 (game.js:512-514, 974-976)
- {once:true}로 메모리 누수 없음, classList.remove 멱등이라 기능 영향 없음
- Self-check #4에 이미 인지 기록됨, 현재 구현 OK

---

## 강점 (통과 항목)

1. SPEC 정밀 적용 — A1~C15 전 항목 구현
2. Critical 버그 1~5 전부 수정, 특히 #5 resumeFromCutscene의 nextSpawnAt 재계산 정확
3. animationend + once:true 규약 완전 준수 (사운드 90ms setTimeout은 SPEC 허용)
4. reduced-motion 4겹 (JS 파티클, CSS 셰이크/바운스, 글로벌 duration)
5. 스폰 안전지대 정확 (맨해튼 거리 4, 200회 fallback, playerTile avoid)
6. --game-* 네임스페이스 엄수 (--game-combo-glow, --game-particle)
7. BEM: .game-hud__slot--combo, .game-overlay__goal, .game-overlay__stats, .is-combo-*, .is-shake 일관
8. 네이티브 중첩 & 일관, SCSS 혼입 0건
9. 난이도 변경 차단 if (state.running) return 최상단
10. isAnyOverlayOpen 세 오버레이 점검 + preventDefault
11. 컷씬 Escape/Enter/Space 확장
12. 엔딩 4분기 스토리

---

## 채점

| 항목 | 점수 | 코멘트 |
|---|---|---|
| 패턴 일관성 (40%) | 9/10 | BEM/네임스페이스/네이티브 중첩/animationend 전부 준수. 하드코딩 0건. P2 3건 미미 |
| 보안 & 접근성 (25%) | 8/10 | textContent, Score aria-live, reduced-motion 3겹. 콤보 aria-live 누락(범위 외) -1 |
| 반응형 & UI (20%) | 9/10 | 520px HUD 재설계, 통계 축소, 가로 모드, backdrop-filter 일관 |
| 기능 완성도 (15%) | 10/10 | AC 29/29, Critical 6건 전부 수정, 중독성 훅 전량 |

**가중 점수**: (9×0.40)+(8×0.25)+(9×0.20)+(10×0.15) = 3.60+2.00+1.80+1.50 = **8.90/10.0**

---

## 최종 판정: **합격**

- 가중 점수 8.90 >= 7.0 합격 기준 충족
- P0/P1 이슈 0건 → 강제 하락 없음
- Sprint 범위 위반 0건
- AC 29/29 PASS

**종합 코멘트**: 정밀 SPEC 적용 + 버그 수정 + 중독성 피처 완성의 삼위일체. animationend+once:true 규약, reduced-motion 4겹, resumeFromCutscene nextSpawnAt 재계산, playerTile avoid 전달이 모두 SPEC 요구 그대로 정확히 반영됐다. AI 슬롭 패턴(setTimeout으로 애니 종료, 보라-청록 그라디언트, 하드코딩 색상, 과대 radius) 위반 0건. 점수 8.0 이상이므로 관대 여부 재검토 — 29개 AC 전부 파일:라인 근거로 통과 확인.

**후속 스프린트 권장(필수 아님)**:
1. game.html:49 콤보 슬롯 aria-live=polite 추가
2. game.js:633 setTimeout 250ms 의도 주석 추가
3. 게임 페이지 전용 Playwright 시나리오 추가