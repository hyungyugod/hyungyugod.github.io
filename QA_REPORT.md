# QA 검수 보고서 - 임간호 단발 스킬 & 박병장 폭격 시퀀스

## UI 동작 검증 (Playwright)

| 체크 항목 | 결과 | 비고 |
|---|---|---|
| 포트폴리오 테마 토글 | PASS | ui-check 통과 |
| 카테고리 필터 (4종) | PASS | ui-check 통과 |
| 프로필 모달 | FAIL (환경 한계) | Playwright scrollIntoViewIfNeeded x position fixed 환경 제약. 게임 SPEC과 무관 |
| 링크카드 href | PASS | |
| 모바일 520px | PASS | |
| 포트폴리오 콘솔 에러 | PASS | 0건 |
| 게임 페이지 (iPhone SE 375x667) | PASS | overlayStart 버튼 뷰포트 내 노출, 콘솔/페이지 에러 0건 (tests/game-check.js) |

실제 게임 상태기계(박병장 오버레이 -> 비행기 -> 폭탄 -> F 소멸 -> 수간호사 복귀 재시딩)는 Playwright 시나리오 주행하지 않았다. 정적 분석 + SELF_CHECK 크로스체크로 검증함.

스크린샷: tests/screenshots/

---

## SPEC 기능 검증

### 기능 1: 나는야 모범생 단발 스킬
- [PASS] 게임당 1회 제한: tryActivateSkill (game.js:3098)에서 (state.characterId === im && state.skill.usedOnce) return; - 성공 분기(3104-3109)에서 usedOnce=true + readyAt=Infinity
- [PASS] 지속 1500ms: SKILLS.im.durationMs: 1500 (game.js:166), activeUntil = now + def.durationMs (game.js:3110)
- [PASS] HUD NaN 경로 차단: updateSkillHud (game.js:3293) im && usedOnce 분기가 remaining/cd 계산보다 먼저 배치 - readyAt=Infinity 상태에서도 NaN 없음
- [PASS] 모바일 keypadSkillBtn 동기: applyUsedOnce 헬퍼가 hudSkillSlot과 keypadSkillBtn 양쪽 적용 (game.js:3301-3302)
- [PASS] 라벨 대시 + prog=0 + is-skill-cooling 고정: 3294-3300 명시

### 기능 2: 스킬명/지속시간 데이터 변경
- [PASS] SKILLS.im 스키마 (game.js:166): name=나는야 모범생, desc에 (게임당 1회) 명시, durationMs=1500, cooldownMs=0, abbr=모범
- [PASS] 설명 오버레이 자동 반영: renderSkillOverlay는 SKILLS 맵을 직접 읽으므로 자동 갱신

### 기능 3: 박병장 등장 알림창 (일시정지형)
- [PASS] DOM 오버레이 추가 (game.html:138-147): role=dialog, aria-labelledby=airforceTitle, aria-describedby=airforceText, aria-live=assertive
- [PASS] 복합 클래스: game-overlay game-overlay--cutscene game-overlay--airforce - 기존 컷씬 스타일(배경/패널 진입 애니) 자동 상속
- [PASS] 게임 정지: triggerAirforceEasterEgg (game.js:2874-2900) running=false + cancelAnimationFrame(rafId) + state.keys=Object.create(null) + clearDpadPressed() + pauseOverlayOpen=true
- [PASS] textContent 주입: AIRFORCE.title/subtitle 상수 주입 (game.js:2894-2895) - XSS 무관
- [PASS] 포커스 관리: btnAirforceContinue.focus({ preventScroll: true }) (game.js:2899)
- [PASS] isAnyOverlayOpen 확장: overlayAirforce 포함 (game.js:1655) -> Shift/방향키 입력 차단

### 기능 4: 비행기 출격 + 폭탄 낙하 연출
- [PASS] onAirforceContinue (game.js:2906-2936): is-hidden 추가 + pauseOverlayOpen=false + 비행기 스폰(x=-planeW, y=planeY, active=true) + pendingBombDrop = now+300 + startChiefFlee(now) + 엔진음 2연타 + running=true + lastTs=now + nextSpawnAt 보정 + requestAnimationFrame(loop) 재개
- [PASS] 폭탄 투하 트리거 (game.js:3004-3008): !bombDropped && now >= pendingBombDrop -> dropBomb(now) 1회 실행, bombDropped=true 플래그
- [PASS] dropBomb 내용 (game.js:2943-2971): is-bomb-flash 420ms + 파티클 22개 + playTone(80, 0.4) -> 120ms 후 playTone(55, 0.55) + is-shake 500ms
- [PASS] CSS 섬광 애니메이션: @keyframes gameBombFlash + .game-canvas-wrap.is-bomb-flash { animation: gameBombFlash 420ms ease-out 1; } (game.css:597-605)
- [PASS] dt 폭주 방지: onAirforceContinue에서 state.lastTs = now 및 nextSpawnAt 재보정 (game.js:2931-2934)

### 기능 5: F만 제거, A 보존
- [PASS] filter 표현식 (game.js:2945): state.obstacles = state.obstacles.filter((o) => o.type === A) - A 보존 / F 전멸
- [PASS] 매혹 중 신규 장애물 타입: spawnObstacle (game.js:2095) isImCharmed(now) ? A : F - 기존 로직 그대로 재사용
- [PASS] flee 중 F 투척 차단: startChiefFlee에서 throwTimer=99, telegraphUntil=0 무력화 (game.js:2991-2993)

### 기능 6: 수간호사 복귀 시 F 재시딩
- [PASS] flee-end 블록 확장 (game.js:2202-2211): targetCount = Math.round(obstacles * respawnCountMultiplier) - 기존 F 개수 차감 후 spawnObstacle() N회
- [PASS] spawnObstacle 안전성: 플레이어 주변 회피 (playerTile) + findEmptyTile 폴백 -> 불공정 즉사 방지
- [PASS] 복귀 효과음: playTone(220, 0.08) (game.js:2210)

### 기능 7: 접근성 & 반응형
- [PASS] prefers-reduced-motion CSS 가드: .game-canvas-wrap.is-bomb-flash { animation: none; filter: none; } (game.css:1668-1671)
- [PASS] prefers-reduced-motion JS 가드: if (!reducedMotion) spawnParticles(...) (game.js:2956-2958)
- [PASS] 게임 로직은 reduced-motion과 무관하게 실행: F 제거 / 수간호사 flee / 재시딩 모두 상시 동작
- [PASS] 520px 반응형 상속: .game-overlay--cutscene 미디어쿼리(game.css:1515-1520)를 복합 클래스로 자동 상속
- [PASS] aria 속성: role=dialog + aria-labelledby + aria-describedby + aria-live=assertive

### 초기화 지점 3곳 일관성
- [PASS] startGame (game.js:1732, 1759-1762, 1769-1770): skill.usedOnce=false, airplane.active/pendingBombDrop/bombDropped/pauseOverlayOpen 리셋, is-bomb-flash 제거, overlayAirforce is-hidden 강제
- [PASS] endGame (game.js:1822, 1829-1832, 1837-1840): 동일 필드 리셋 + 오버레이 닫기 + is-bomb-flash 제거
- [PASS] btnBackToDifficulty (game.js:1334-1344): 동일 필드 리셋 + 오버레이 닫기 + is-bomb-flash 제거

### Sprint 범위 계약 위반 검사
- [PASS] 금지 준수 - 다른 캐릭터(kim/jung/geon/lee) SKILLS 엔트리 원본 유지
- [PASS] 금지 준수 - 수간호사/이교수/석조무사 속도/HP/투척 주기 상수 원본 유지 (DIFFICULTY/PROFESSOR/STONE_GUARD)
- [PASS] 금지 준수 - airplaneSprite/drawAirplane/planeSpeed/planeY 원본 유지 (비주얼 미개편)
- [PASS] 금지 준수 - 신규 BGM/아이콘/이미지 에셋 없음
- [PASS] 금지 준수 - 전역 테마 변수 조정 없음, --brand 재사용
- [PASS] 허용 변경 - state.skill.usedOnce, state.airplane.{pendingBombDrop,bombDropped,pauseOverlayOpen} 필드 추가 (SPEC [B])
- [PASS] 허용 변경 - 캔버스 상단 AIRFORCE 토스트 완전 제거 (drawAirplane에 toast 관련 코드 없음, AIRFORCE.toast* 상수 0개. STETHO_TOAST는 별개 청진기 토스트로 SPEC 대상 아님)
- [PASS] 필수 연동 - isAnyOverlayOpen에 overlayAirforce 추가 (game.js:1655)

---

## 검수 결과 요약

| 등급 | 건수 |
|---|---|
| P0 치명 | 0건 |
| P1 중요 | 1건 |
| P2 권장 | 2건 |

---

## P0 - 치명적 이슈

없음. 보안 취약점, 기능 장애 없음.


---

## P1 - 중요 이슈

### 1. .game-overlay__text BEM 엘리먼트에 CSS 규칙 부재 - 본문 타이포/여백이 다른 오버레이와 불일치

- 파일: pages/game.html:141, assets/css/game.css (부재)
- 위반 규칙: docs/css-rules.md BEM 네이밍 일관성 + components.md 컴포넌트 스타일 일관성
- 현상:
  - AIRFORCE 오버레이 본문은 <p class="game-overlay__text" id="airforceText">로 선언되었으나, game.css 어느 곳에도 .game-overlay__text 선택자가 없다 (Grep 결과 0건).
  - 기존 모든 오버레이 본문(overlayStart, overlayCharacter, overlayCutscene)은 class="game-overlay__desc"를 사용하며, .game-overlay__desc에 font-size:12px, color:var(--text-muted), line-height:1.5가 정의됨 (game.css:383).
  - 결과적으로 박병장 오버레이 본문만 기본 <p> 스타일(브라우저 기본 또는 body 상속 16px)로 렌더되어 다른 컷씬과 타이포 톤이 불일치. 520px 미디어쿼리 (.game-overlay--cutscene .game-overlay__desc { font-size: 12px })(game.css:1520) 적용도 놓침.
  - SPEC 라인 38이 이 클래스명을 지정했으나, SPEC 의도(라인 4)는 석조무사 경고문과 동일한 2단 박스 알림이며 동일한 시각 톤이 전제다. Generator가 SPEC 명세를 문자 그대로 따랐지만, 그 결과 .game-overlay--cutscene .game-overlay__desc의 520px 반응형/컷씬 특화 톤(font-size 12px)이 AIRFORCE에는 적용되지 않는다.
- 수정 제안 (택1):
  - (A) pages/game.html:141을 <p class="game-overlay__desc" id="airforceText">로 변경 (기존 컷씬 패턴과 일치, CSS 추가 0줄)
  - (B) assets/css/game.css에 .game-overlay--airforce .game-overlay__text 스타일 신규 추가 (font-size:13px, line-height:1.55, color:var(--text-muted); 520px 미디어쿼리 font-size:12px)
- 권장: (A). 이유: (1) 별도 클래스를 새로 만들 설계적 이유가 약함(본문은 본문), (2) 기존 .game-overlay__desc가 가진 strong 중첩/520px 대응/컷씬 톤을 자동 공유, (3) BEM 엘리먼트 수를 늘리지 않음.


---

## P2 - 권장 사항

### 1. 오버레이 제목 태그가 <h3> - 문서 아웃라인 레벨 점프
- 파일: pages/game.html:140
- 현상: 다른 모든 game-overlay__title은 <h2>(startTitle, characterTitle, skillTitle, cutsceneTitle, endTitle)인데 airforceTitle만 <h3>.
- 이유: SPEC 라인 37이 <h3>로 지정. 하지만 AIRFORCE 오버레이 패널 내부에서 더 상위 <h2>가 존재하지 않아 섹션 헤딩 계층이 <h3>부터 시작 - 스크린리더 사용자에게 상위 헤딩이 생략되었나는 혼란 가능.
- 수정 제안: <h3> -> <h2>로 변경(전 오버레이 제목 톤 통일). SPEC 지시와 충돌 가능하나, SPEC 라인 37은 제목 의미 전달이 본질이고 태그는 접근성 패턴을 따르는 게 맞다.

### 2. bombFlashDuration 상수가 JS에만 존재, CSS 420ms와 이중 선언
- 파일: assets/js/game.js:117, assets/css/game.css:604
- 현상: JS AIRFORCE.bombFlashDuration:420 (game.js:117) + CSS animation: gameBombFlash 420ms (game.css:604). 두 값이 독립적으로 선언되어, 한쪽 변경 시 다른 쪽과 어긋날 수 있다.
- 수정 제안: CSS 커스텀 프로퍼티(--game-bomb-flash-duration:420ms)로 중앙화하거나, setTimeout에서 CSS 연산된 값을 읽어오기. 우선순위 낮음.


---

## 통과 항목

1. 임간호 스킬 게임당 1회 제한 (early return + usedOnce 플래그 + Infinity readyAt)
2. 1.5초 지속 (durationMs 1500 + activeUntil 계산 정상)
3. 나는야 모범생 이름 및 (게임당 1회) 설명
4. HUD NaN 경로 차단 (im && usedOnce 분기를 remaining/cd 계산보다 먼저 배치)
5. 박병장 등장 시 게임 정지 알림창 (DOM 오버레이 + role=dialog + aria-live + focus 관리)
6. 확인 버튼 -> 비행기 즉시 스폰 + 300ms pendingBombDrop + F 전멸 + 섬광/셰이크/폭발음 2연타
7. A(매혹) 오브젝트 보존, F만 제거 (filter(o => o.type === A))
8. 수간호사 복귀 시 F 재시딩 (respawnCountMultiplier 기반 targetCount 계산)
9. 캔버스 상단 AIRFORCE 토스트 완전 제거 (drawAirplane에 토스트 코드 없음, AIRFORCE.toast* 상수 0건)
10. 초기화 3곳 일관성 (startGame/endGame/btnBackToDifficulty - usedOnce/airplane 필드/is-bomb-flash/오버레이 닫기 모두 포함)
11. prefers-reduced-motion 가드 (CSS is-bomb-flash 무력화 + JS 파티클 if(!reducedMotion))
12. Sprint 범위 계약 위반 없음 (타 캐릭터/수간호사/이교수/석조무사/비행기 비주얼 전부 원본 유지)
13. 보안: XSS 무관 (AIRFORCE.title/subtitle 상수를 textContent로만 주입)
14. 이벤트 바인딩: btnAirforceContinue addEventListener 정상 (game.js:2033-2036)
15. ESC/Enter/Space는 overlayCutscene에만 반응, overlayAirforce는 확인 버튼 전용(강제 컷씬 준수)


---

## 채점

항목별 점수:

| 항목 | 점수 | 코멘트 |
|---|---|---|
| 패턴 일관성 | 7.5/10 | BEM 네이밍 대체로 준수. 단, game-overlay__text 엘리먼트를 신규 도입했으나 CSS 부재로 기존 game-overlay__desc 패턴과 이중화 - P1 1건 |
| 보안 & 접근성 | 9.0/10 | XSS 무관(textContent), role/aria/focus 모두 정석, reduced-motion 양측 가드. <h3> 레벨 점프 사소한 감점 |
| 반응형 & UI 품질 | 7.5/10 | 컷씬 복합 클래스로 520px 자동 상속. 단, game-overlay__text CSS 부재로 본문 타이포가 다른 오버레이와 불일치 - 모바일에서도 톤 차이 발생 |
| 기능 완성도 | 9.5/10 | SPEC 7개 기능 + 초기화 3곳 + isAnyOverlayOpen 확장 + 엣지케이스(dt 폭주, 잔존 클래스, 중복 투하, 입력 잔존) 모두 처리 |

가중 점수 계산 (기능 변경 기준):
= 7.5 x 0.40 + 9.0 x 0.25 + 7.5 x 0.20 + 9.5 x 0.15
= 3.00 + 2.25 + 1.50 + 1.425
= **8.18 / 10**

이슈 건수 게이트 체크:
- P0 0건 -> 통과
- P1 1건 (3건 미만) -> 최종 판정 하락 없음

---

## 최종 판정: 합격

가중 점수 8.2 / 10, P0 0건, P1 1건 - 점수 게이트(7.0 이상)와 이슈 게이트(P0=0 / P1<3) 모두 충족.

단, 아래 P1 이슈 1건은 시각 일관성에 실제 영향을 주므로 빠른 수정을 권장한다.

### 구체적 개선 지시 (권장)

1. [P1] pages/game.html:141 - class="game-overlay__text" -> class="game-overlay__desc"로 변경. 이유: 기존 컷씬 오버레이 본문 BEM 엘리먼트와 일치시키고, .game-overlay--cutscene .game-overlay__desc { font-size: 12px }(game.css:1520) 520px 반응형 및 strong 중첩 스타일을 자동 상속. CSS 추가 0줄로 해결.
2. [P2] pages/game.html:140 - <h3> -> <h2>로 승격. 다른 모든 오버레이 제목과 통일하여 스크린리더 아웃라인 일관성 확보.
3. [P2] assets/css/game.css:604 + assets/js/game.js:117 - bombFlashDuration 값을 CSS 커스텀 프로퍼티로 중앙화(선택 사항, 단일 소스 보장). 우선순위 낮음.

---

## 참고: 잘한 점

- state.skill.usedOnce 단일 플래그 + readyAt=Infinity 조합이 깔끔. updateSkillHud에서 NaN 경로를 최우선 분기로 막은 것이 설계서에 명시된 가장 큰 함정을 정확히 회피했다.
- 초기화 3곳(startGame/endGame/btnBackToDifficulty)에서 동일 5종 필드를 일관 리셋 - 라운드 간 상태 누수 차단.
- startChiefFlee에서 telegraphUntil=0, throwArmUntil=0, throwTimer=99로 flee 중 투척을 원천 차단한 처리가 SPEC의 신규 F 투척 차단 의도를 정확히 구현.
- dropBomb의 filter(o => o.type === A)로 매혹 전환 A를 보존한 것이 플레이어 보상이라는 디자인 의도를 놓치지 않았다.
- 기능 변경에도 불구하고 다른 캐릭터 스킬/NPC 밸런스/비행기 비주얼 전부 원본 유지 - Sprint 범위 계약 준수가 모범적.
