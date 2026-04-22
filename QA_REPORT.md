# QA 검수 보고서 — 박병장 2단 안내 토스트 (기능 변경)

## UI 동작 검증

대상은 `/pages/game.html` + `/assets/js/game.js` 의 캔버스 2D 렌더 변경이므로 npm ui-check(홈페이지 대상) 범위 밖이다. 정적 분석 + 수동 확인 기반으로 평가한다. HTML/CSS 무변경(SPEC 선언과 일치)이므로 기존 홈페이지 동작에는 영향 없음.

| 체크 항목 | 결과 | 비고 |
|---|---|---|
| pages/game.html 변경 없음 | PASS | git status에서 untracked/modified 아님 |
| assets/css/game.css 변경 없음 | PASS | git status 미포함 |
| assets/js/main.js / index.html / style.css 변경 없음 | PASS | git status 미포함 |
| 콘솔 에러 위험 | PASS | 추가된 블록은 순수 ctx.* API, 외부 fetch/네트워크 없음 |

## SPEC 기능 검증

### 기능 1: 박병장 2단 안내 토스트
- **PASS** — game.js:3521~3584. 제목 `AIRFORCE.title`(18px bold, 코럴톤) + 본문 `AIRFORCE.subtitle`(13px regular, 뉴트럴톤) + 좌측 4px 코럴 악센트 라인(3566행) 모두 구현. y=24 상단 고정(3530행).

### 기능 2: 기존 비행기/도망 연출과의 동기화
- **PASS** — `AIRFORCE.toastDuration: 2600` (114행). `triggerAirforceEasterEgg`, `startChiefFlee`, `updateAirplane`, `drawAirplane` 함수의 내부 로직과 비행기 수치(flyDuration 2400 / planeSpeed 320 / planeY 40 / planeW 48 / planeH 14 / fleeDuration 5000 / fleeSpeed 180) 무변경 확인.

### 기능 3: CUTSCENES.introStoneGuard 텍스트 보존
- **PASS** — game.js:191~194. 원문 "경고 · 석조무사 출현" / "수간호사의 충실한 부하 석조무사가 출현합니다! 마주치면 잡혀갑니다. 절대 만나지 마세요." 유지.

## 중점 검토 항목별 결과 (요청 14개)

| # | 항목 | 결과 | 근거 라인 |
|---|---|---|---|
| 1 | AIRFORCE 상수에 title/subtitle/toastBoxW/toastBoxH/toastBoxY/toastTitleSize/toastSubtitleSize 전부 추가 | PASS | 106~124 |
| 2 | AIRFORCE.toastText 완전 제거 (참조 0건) | PASS | grep 결과 docs(SPEC/SELF_CHECK)에만 존재, 코드에는 없음 |
| 3 | AIRFORCE.toastDuration = 2600 | PASS | 114행 `toastDuration: 2600` |
| 4 | 제목/본문 원문 일치 | PASS | 116~117행 "나와라 박병장!" / "석조무사가 학창시절 같은반 친구 박병장을 불러 실습생을 도와줍니다!" 완전 일치 |
| 5 | 좌측 4px 코럴 악센트 라인 | PASS | 3565~3566행 `ctx.fillRect(cx - boxW / 2 + 2, boxY, 4, boxH - 4)` |
| 6 | 다크/라이트 테마 양쪽 색상 `isLightTheme()` 분기 | PASS | 배경(3561), 악센트(3565), 제목(3569), 본문(3574) 4군데 |
| 7 | reducedMotion에서 alpha 페이드 생략 | PASS | 3523행 `const alpha = reducedMotion ? 1 : Math.min(1, remain / 300);` |
| 8 | measureText로 폭 체크 → 초과 시 2줄 분리 + boxH 확장 | PASS | 3534~3553행 측정 로직 + 3554행 `boxH = subtitleLine2 ? 78 : AIRFORCE.toastBoxH` |
| 9 | 박병장 토스트 블록 위치가 화캉스 토스트 블록 뒤 | PASS | 화캉스 3495~3516, 박병장 3521~3584 (최상위 레이어) |
| 10 | CUTSCENES.introStoneGuard 원문 유지 | PASS | 191~194 원문 그대로 |
| 11 | triggerAirforceEasterEgg/startChiefFlee/updateAirplane/drawAirplane 로직 무변경 | PASS | 2674~2758 원본 로직 유지 |
| 12 | 비행기 수치(flyDuration/planeSpeed/planeY/planeW/planeH/fleeDuration/fleeSpeed) 무변경 | PASS | 107~113행 원본 값 유지 |
| 13 | CHARACTERS/SKILLS/pages/game.html/game.css 무변경 | PASS | 64~70행 CHARACTERS, 149~154행 SKILLS 유지. git status로 css/html 무변경 확인 |
| 14 | Sprint 범위 위반 | PASS | SPEC "허용" 4항목(상수 확장/블록 재작성/duration 조정/reduced-motion 분기)에 모두 부합, "금지" 위반 0건 |

## 검수 결과 요약

| 등급 | 건수 |
|---|---|
| P0 치명 | 0 |
| P1 중요 | 0 |
| P2 권장 | 1 |

## P0 — 치명적 이슈
없음.

## P1 — 중요 이슈
없음.

## P2 — 권장 사항

### 1. 2줄 분리 탐색 루프의 극단적 엣지 케이스
- **파일**: `assets/js/game.js:3540~3553`
- **위반 규칙**: 방어적 구현 (필수 규칙 위반은 아님)
- **현재 코드**: `if (subtitleMeasuredW > subtitleMaxW)`로 진입한 후, 공백이 없는(혹은 모든 head가 maxW를 초과하는) 가상 폰트 환경에서는 `splitIdx = Math.ceil(words.length / 2)` 초기값으로 폴백되어 `subtitleLine1`이 여전히 maxW를 넘을 수 있다.
- **수정 제안**: 현재 고정 subtitle은 공백 8개로 분할되며 14px 이하 Pretendard/system-ui에서 첫 4어절(`석조무사가 학창시절 같은반 친구`)이 maxW=408px 이내에 확실히 들어감이 보장되므로 실용적으로 안전. 다만 문자열이 향후 교체될 때를 대비해 split 후에도 `subtitleLine1` 폭을 한 번 더 `ctx.measureText` 검증하는 가드를 넣으면 더 견고해진다. (현재 실질 리스크 없음 → P2)

## 통과 항목

- **AIRFORCE 상수 구조**: SPEC 지정 7개 필드(title/subtitle/toastBoxW/toastBoxH/toastBoxY/toastTitleSize/toastSubtitleSize) + toastDuration(2600) + 기존 비행기 필드 모두 보존.
- **문자열 원문성**: 제목/본문이 SPEC 원문과 바이트 단위 일치. 느낌표 포함 여부까지 정확.
- **toastText 제거 완전성**: Grep 결과 코드 상 참조 0건, SELF_CHECK의 주장과 일치.
- **렌더 순서**: 화캉스 토스트 → 박병장 토스트 순으로 박병장이 위 레이어(SPEC 170행 요건).
- **접근성(reduced-motion)**: alpha 페이드 생략 분기(3523행)로 모션 민감 사용자 대응. 박스 자체는 표시 유지 — 내러티브 정보 전달 보장.
- **테마 대응**: 4군데(배경/악센트/제목/본문) `isLightTheme()` 분기로 다크=밀리터리 네이비/라이트=쿨그레이 배경, 제목은 코럴톤(라이트 `#8a1a2a` / 다크 `#ffd0d4`), 본문은 뉴트럴(라이트 `#2a2432` / 다크 `#e8eaf2`)로 SPEC 의사코드와 일치.
- **보안**: title/subtitle 모두 상수 문자열이며 `ctx.fillText`로 canvas에 직접 그려 XSS 경로 없음. `esc()`/`safeUrl()` 불필요 — SPEC 176~177행의 판단과 일치.
- **기존 기능 보전**: 비행기 함수 4개(triggerAirforceEasterEgg/startChiefFlee/updateAirplane/drawAirplane) 및 비행기 수치 7종 모두 원본 유지. CHARACTERS/SKILLS/CUTSCENES.introStoneGuard 모두 무변경.
- **파일 간 정합성**: pages/game.html, assets/css/game.css, index.html, assets/css/style.css, assets/js/main.js 모두 무변경(git status로 확인). 단일 파일(assets/js/game.js) 수정으로 격리.
- **Sprint 범위 준수**: SPEC "허용" 4항목 준수, "금지" 6항목 모두 보존. 범위 외 독립 기능 추가 0건.
- **AI 슬롭 패턴 없음**: 보라-청록 그라디언트·과대 그림자·임의 radius·transitionend 대신 setTimeout 등 자동 감점 패턴 해당 없음. measureText 기반 동적 분리 로직은 창의적 방어 구현.

---

## 채점 (기능 변경 평가 기준 적용)

**항목별 점수**:
- 패턴 일관성: **9/10** — 기존 캔버스 렌더 관례(hex 하드코딩, ctx.save/restore, isLightTheme 분기) 완전 준수. 화캉스 토스트와 동일한 구조(그림자 offset 2px, 마지막 300ms 알파 페이드) 재사용으로 일관성 확보. 감점 -1은 split 탐색 폴백의 극단 케이스 가드 미비(P2)
- 보안 & 접근성: **10/10** — 상수 문자열 + ctx.fillText로 XSS 경로 원천 차단. reduced-motion 분기 구현. canvas 2D 스크린리더 한계는 기존 토스트도 동일하므로 SPEC 범위 밖(명시 기록)
- 반응형 & UI 품질: **9/10** — 캔버스 고정 640px 내부 렌더로 반응형은 기존 CSS가 담당(변경 없음). measureText로 폰트 폴백까지 대응한 동적 2줄 분리는 우수. y=24 배치로 화캉스(y=40)와 수직 분리. 감점 -1은 2줄 분리 시 boxH 78px일 때 제목 위치(boxY+18)와 본문(boxY+40, boxY+58) 사이 간격이 다소 빡빡할 수 있음(실제 렌더 시 시각 확인 권장)
- 기능 완성도: **10/10** — SPEC 기능 3종 모두 구현. 상수 7개 신규 + 1개 변경 + 1개 삭제 모두 지시대로. 중점 14개 체크 전부 PASS

**가중 점수**: (9×0.40) + (10×0.25) + (9×0.20) + (10×0.15) = 3.6 + 2.5 + 1.8 + 1.5 = **9.4 / 10.0**

## 최종 판정: **합격**

SPEC의 Sprint 범위 계약(허용 4항목 / 금지 6항목)을 완벽히 준수하며, 중점 14개 체크 전원 PASS, P0·P1 이슈 0건. SELF_CHECK.md의 자체 주장이 실제 코드와 100% 일치.

**구체적 개선 지시**: 합격이므로 필수 수정 없음. 선택적 권장사항 1건(P2)만 향후 참고:
1. (선택) `assets/js/game.js:3540~3553` — 2줄 분리 로직에서 split 후 subtitleLine1의 측정 폭을 한 번 더 `ctx.measureText`로 검증하는 가드 추가. 현재 고정 텍스트로는 리스크 없음이나, 향후 AIRFORCE.subtitle 변경 시 방어막이 됨.

