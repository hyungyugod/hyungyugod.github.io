# QA 검수 보고서

## UI 동작 검증 (Playwright)

| 체크 항목 | 결과 | 비고 |
|---|---|---|
| 테마 토글 | PASS | 다크↔라이트 정상 |
| 카테고리 필터 (4종) | PASS | writing/music/social/all 모두 정상 |
| 프로필 모달 | FAIL | 메인 페이지 모달 — 본 SPEC(게임 페이지)과 무관, 기존 이슈 |
| 링크카드 href | PASS | 2개 링크 유효 |
| 모바일 520px | PASS | 핵심 요소 visible |
| 콘솔 에러 | PASS | 0건 |

전체: 8/9 통과. **프로필 모달 실패는 메인 페이지 검사 항목으로 본 SPEC(`pages/game.html`, `assets/js/game.js`, `assets/css/game.css`) 변경 범위 밖**. 게임 페이지 자체에 대한 자동화 시나리오는 ui-check 스크립트에 부재. 정적 검증으로 보강.

스크린샷: `tests/screenshots/`

## SPEC 기능 검증

- [PASS] **TARGET_SCORE = { easy:50, normal:30, hard:40 }** — game.js:47 정확
- [PASS] **DIFFICULTY 재배치** — game.js:54-56
  - normal: notes 4, noteTtl 3500, obstacles 5, obsBaseSpeed 170→290, spawnInterval [1.0,0.35], throwBurst 3, maxObstacles 10 (구 hard 값과 정확 일치)
  - hard: notes 4, noteTtl 2800, obstacles 6, obsBaseSpeed 200→340, spawnInterval [0.8,0.25], throwBurst 4, maxObstacles 14 (SPEC 강화 표 정확 일치)
- [PASS] **PROFESSOR 상수** (game.js:61-67) — patrolSpeed 70, throwInterval [2.5,1.4], stethoSpeed 220, stethoMax 4, freezeDuration 2000
- [PASS] **state.professor.active 토글** — startGame()에서 hard일 때만 initProfessor 호출, 그 외 active=false (game.js:893-897)
- [PASS] **청진기 충돌 비즉사** — frozenUntil = now + 2000, 콤보 0, 청진기 제거, hits 증가 X (game.js:1839-1855)
- [PASS] **입력 차단 frozen 포함** — `immobile = stunned || frozen` (game.js:1655-1656)
- [PASS] **발 밑 정지 인디케이터** — 코럴톤 도트 패턴 그림 (game.js:1971-1983)
- [PASS] **CSS 변수 :root + html.light 양쪽** — 11개 변수 모두 정의 (game.css:28-37, 54-63)
- [PASS] **시작 오버레이 hint** — game.html:76 "상 난이도: 이교수의 청진기에 맞으면 2초간 움직일 수 없다." 추가
- [PASS] **back-to-difficulty 리셋** — stethoscopes/professor.active/frozenUntil 모두 리셋 (game.js:790,795,796)
- [PASS] **이교수 본체 즉사** (game.js:1811-1835)
- [PASS] **professorPaletteCache 테마 토글 무효화** (game.js:9, 26)
- [PASS] **renderPreview hard 분기** — 이교수+청진기 표시 (game.js:2215-2219)
- [PASS] **initNurseChief hard 속도 80→100** (game.js:1151)
- [PASS] **이교수 텔레그래프 코럴색** — drawProfessorTelegraph (game.js:1462-1473)

## 검수 결과 요약

| 등급 | 건수 |
|---|---|
| P0 치명 | 0건 |
| P1 중요 | 0건 |
| P2 권장 | 3건 |

## P0 — 치명적 이슈
없음.

## P1 — 중요 이슈
없음.

## P2 — 권장 사항

### 1. 청진기 매 프레임 getComputedStyle 호출 (성능)
- **파일**: `assets/js/game.js:1422-1424`
- **문제**: `drawStethoscope` 내부에서 매 호출마다 `getComputedStyle(document.documentElement).getPropertyValue('--prof-stethoscope-bell')` 등을 3회 호출. 동시 청진기 4개 + 60fps = 초당 720회 강제 layout 조회. `getProfessorPalette()`는 이미 캐시되어 있으므로 동일 캐시에 stethoscope 색상 키도 함께 저장하는 것이 일관됨.
- **현재**: `const bellColor = getComputedStyle(...).getPropertyValue('--prof-stethoscope-bell').trim() || '#d8d4dc';`
- **수정 제안**: `getProfessorPalette()` 캐시에 `'_bell'`, `'_rim'`, `'_tube'` 같은 보조 키를 추가하거나, 별도 `getStethoscopePalette()` 캐시 함수 도입. chiefPalette/nursePalette와 패턴 일관성 ↑.

### 2. drawStethoscope의 tubeColor 변수 미사용
- **파일**: `assets/js/game.js:1421, 1450`
- **문제**: `const tubeColor = palette['J'] || '#181418';` 선언 후 `ch === 't'` 분기는 `tubeStrong || tubeColor` 폴백으로만 쓰임. tubeStrong이 항상 CSS에 정의되어 있으므로 사실상 fallback 경로로만 사용된다. 가독성 저하.
- **수정 제안**: tubeColor 변수 삭제하고 `ctx.fillStyle = tubeStrong;` 단일 사용. 또는 의도가 이중 폴백이면 주석 추가.

### 3. up 방향 professor 스프라이트의 row 10 우측 머리 음영 키 'H' (소문자 h 의도?)
- **파일**: `assets/js/game.js:1328`
- **문제**: `base[10] = '..HhhHHHHHHHhH..';` — 행 끝 두 번째 문자가 'h'(소문자, 음영) 다음 'H'(대문자, 본체)로 끝남. 좌측은 'Hhh'(본체→음영×2) 패턴이지만 우측은 'hH'(음영→본체)로 비대칭. 다른 행(6~9)은 모두 좌우 대칭(`HhSSSSSSSShH`). 시각 비대칭 가능성. 의도된 디자인이면 무시 가능.
- **수정 제안**: 대칭 의도면 `'..HhhHHHHHHhhH..'` (14칸 유지하면서 양 끝 'h' 대칭)로 검토. 다만 SPEC 도트표는 down 자세만 명시했으므로 P2.

## 통과 항목

- **보안**: 외부 데이터 주입 없음 (Canvas 픽셀 + 정적 텍스트). innerHTML 미사용. textContent로만 cutscene/HUD 갱신. eval/document.write 없음.
- **CSS 패턴**: 신규 클래스 0개 (SPEC "새 CSS 클래스 금지" 준수). 11개 변수 모두 :root/html.light 양쪽 정의. `!important` 미사용. backdrop-filter 신규 추가 없음.
- **JS 패턴**: 가드 클래스(`if (!prof.active || !prof.patrolPath.length) return;`) 사용. JSDoc 주석 + 섹션 구분선 풍부. console.error 미사용. drawNurseChief/initNurseChief/updateNurseChief 패턴 정확히 미러링.
- **HTML**: 인라인 스타일/이벤트 핸들러 신규 추가 없음. 신규 hint는 기존 `.game-overlay__hint` 클래스 재사용.
- **반응형 & 접근성**: reduced-motion 분기 모두 처리 (청진기 회전, 텔레그래프 깜빡임, frozen 깜빡임 모두 비활성. 단 frozen 메커닉 자체는 적용 — SPEC 일치). 신규 캔버스 요소는 기존 캔버스 반응형에 편승.
- **파일 간 정합성**: `--prof-*` CSS 변수 11개 ↔ JS readVar 키 정확 일치. state.professor 필드 startGame/back-to-difficulty/update/render 모두 일관 참조. PROFESSOR.freezeDuration → frozenUntil 정확 반영.
- **Sprint 범위 준수**: 제3 NPC 추가 X, 청진기 외 신규 투사체 X, 신규 컷씬/효과음 시스템 변경 X, 게임시간/콤보/F 즉사 룰 변경 X, 신규 CSS 클래스 X. 코드 추가는 모두 SPEC 명시 항목 또는 SPEC 동작 필수 (drawProfessorTelegraph는 SPEC "이교수 텔레그래프(!)는 코럴핑크로 표시" 명시 항목).

---

## 채점

**항목별 점수** (기능 변경 기준 적용):

- 패턴 일관성: 9/10 → drawNurseChief/initNurseChief 패턴을 정확히 미러링. CSS 변수·캐시·테마 무효화 모두 기존 패턴 준수. drawStethoscope의 매 프레임 getComputedStyle만 미세 흠.
- 보안 & 접근성: 10/10 → 외부 데이터 주입 없음, reduced-motion 4개 경로 모두 처리, hint 추가로 신규 메커닉 사전 고지.
- 반응형 & UI 품질: 9/10 → 캔버스 내부 픽셀 요소만 추가되어 기존 반응형 규칙에 자연 편승. 시각적 식별(이교수 검정 vs 수간호사 흰옷, 코럴 텔레그래프 vs 빨강 텔레그래프) 명확.
- 기능 완성도: 10/10 → SPEC 13개 항목 모두 정확 구현. 파라미터 표 수치 100% 일치. 청진기 즉사 X / 본체 즉사 O / frozen 입력 차단 / 인디케이터 / back-to-difficulty 리셋까지 누락 없음.

**가중 점수**: (9×0.4) + (10×0.25) + (9×0.2) + (10×0.15) = 3.6 + 2.5 + 1.8 + 1.5 = **9.4 / 10.0**

## 최종 판정: **합격**

**구체적 개선 지시** (다음 라운드 권장 — 합격이므로 필수 아님):
1. `assets/js/game.js:1419-1457` `drawStethoscope`의 매 프레임 getComputedStyle 호출을 `getProfessorPalette()` 캐시에 통합. (P2 #1)
2. `assets/js/game.js:1421, 1450` 미사용 `tubeColor` 변수 정리하거나 폴백 의도 주석화. (P2 #2)
3. `assets/js/game.js:1328` up 방향 professor 스프라이트 row 10의 좌우 비대칭 패턴 의도 확인. (P2 #3)
