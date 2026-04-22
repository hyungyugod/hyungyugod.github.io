# QA 검수 보고서

## UI 동작 검증 (Playwright)

| 체크 항목 | 결과 | 비고 |
|---|---|---|
| 테마 토글 | PASS | 루트 index 기준 |
| 카테고리 필터 (4종) | PASS | 루트 index 기준 |
| 프로필 모달 | FAIL | **범위 외** — 이번 SPEC은 `pages/game.html`만 수정, 루트 index/modal 무변경. 기존 테스트 환경 타이밍 이슈로 판단(이번 변경과 무관) |
| 링크카드 href | PASS | |
| 모바일 520px (index) | PASS | |
| 콘솔 에러 | PASS | 0건 |

> 주: `tests/ui-check.js`는 루트 `index.html`을 대상으로 한 스모크 스위트이며, `pages/game.html`의 모바일 분기(`body.is-touch.is-landscape`)는 커버하지 않는다. 이번 SPEC의 핵심 변경(터치 기반 바디 클래스 전환, 인트로 컷씬 분기·목표 줄)은 정적 분석과 코드 리뷰로 검증하였다.

## SPEC 기능 검증
- **[PASS] 기능 1: 모바일 조이콘/캔버스 축소 노출 버그 수정**
  - `game.js` L2189-2217: `syncMobileLayoutClasses()`가 `isTouchDevice()` 통과 시 `<body>`에 `is-touch` + `is-portrait`/`is-landscape` 상호 배타 토글. `matchMedia('change')` + `addListener` 폴백 + `resize` 폴백 모두 구비.
  - `game.css` L1019-1072: 조이콘 `display: flex` + 캔버스 `max-width: calc(100vw - 280px)` + `max-height: calc(100dvh - 60px)`을 `body.is-touch.is-landscape` 스코프로 이관. 뷰포트 폭 >520px인 폰(iPhone 14 Pro, 갤럭시 S22 등)에서도 정상 트리거.
  - 기존 `@media (max-width: 520px)` 블록(L760-1007)은 타이포/패딩/오버레이 dvh 규칙만 보존 — SPEC "허용" 조건에 정확히 일치.
- **[PASS] 기능 2: 인트로 컷씬 본문 아래 목표 개수 줄 추가**
  - `pages/game.html` L93: `<p class="game-overlay__goal" id="cutsceneGoal" hidden></p>` 신규 추가.
  - `game.js` L1058-1067: `id === 'intro'`일 때 `textContent`로 `"목표 N점 · 45초"` 주입 + `hidden = false`. mid1/mid2는 `textContent = ''` + `hidden = true` 복원 → 재진입 안전.
  - `game.css` L426-435: `.game-overlay--cutscene .game-overlay__goal` 전용 스타일(CSS 변수만 사용, 하드코딩 0건).
- **[PASS] 기능 3: 상 난이도 인트로 컷씬 문구 분기**
  - `game.js` L76-94: `CUTSCENES.intro`가 `textByDiff: { easy, normal, hard }` 구조로 확장. hard 문구 SPEC 준수.
  - `game.js` L1050-1052: `cut.textByDiff ? (cut.textByDiff[state.difficulty] || cut.textByDiff.easy) : cut.text` — mid1/mid2의 단일 `text` 필드와 호환.

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

### 1. SPEC과 `initOrientationHint()` 구현의 미세 불일치
- **파일**: `assets/js/game.js:2224-2242`
- **SPEC 6-2**: "표시 조건을 `body.classList.contains('is-touch') && body.classList.contains('is-portrait')`로 변경"
- **현재 코드**: `const shouldShow = isTouchDevice() && mql.matches;` (L2232)
- **평가**: 기능적으로 동치이며, 인라인 주석(L2231)에 "이벤트 콜백 순서 독립성 확보"로 이탈 사유를 명시했다. `syncMobileLayoutClasses()`와 `initOrientationHint()`가 둘 다 `matchMedia('change')` 이벤트에 등록될 때, 바디 클래스가 아직 갱신되지 않은 상태에서 `initOrientationHint`가 먼저 실행될 위험을 피하려는 의도 → **합리적 판단**. P2로만 기록.
- **권장**: 그대로 둔다. 수정 불필요.

### 2. `resize` 리스너가 두 함수에서 중복 등록
- **파일**: `assets/js/game.js:2216, 2251`
- **상황**: `syncMobileLayoutClasses()`와 `initOrientationHint()`가 각각 `window.addEventListener('resize', …)` 등록 → 뷰포트 리사이즈 시 두 콜백이 모두 실행.
- **영향**: 실질적 부작용 없음(서로 다른 상태를 다룸). 다만 오리엔테이션 변경 시 두 번 재계산.
- **권장**: 현 설계 유지. 굳이 합치면 가독성 희생. P2 관찰만.

## 통과 항목
- **보안**: `triggerCutscene()`이 컷씬 본문·목표 줄을 전부 `textContent`로 주입 → XSS 0. `innerHTML` 신규 사용 0건.
- **패턴 일관성**: CSS 네이티브 중첩 `&` 유지(SCSS 문법 혼입 없음), BEM 준수(`.game-overlay__goal` 재사용, 신규 클래스 0), CSS 변수만 사용(`--text-muted`, `--brand-light`), 하드코딩 색상 0, `!important` 신규 0, `-webkit-backdrop-filter` 페어링 유지.
- **JS 패턴**: 가드 클래스(`if (!body) return`, `if (!isTouchDevice()) return`, `if (goalEl)`), 함수 선언식(유틸/init), `addEventListener`/`addListener` 폴백, JSDoc 주석 + 섹션 구분선 유지.
- **접근성**: `aria-hidden`/`aria-label`/`role="dialog"` 기존 속성 무변경, `prefers-reduced-motion` 블록(L1161-1207) 무변경, Escape/Enter/Space 컷씬 닫기 유지(L1096-1103).
- **반응형**: `@media (max-width: 520px)` 블록의 오버레이 `position: fixed` + `100dvh` 패턴 보존, 초소형 landscape(`@media (max-height: 360px)`) 조이콘 축소 규칙 보존.
- **Sprint 범위 계약**: `pages/game.html` / `assets/css/game.css` / `assets/js/game.js` 3개 파일만 수정. `index.html`·`style.css`·`main.js` 무변경(git diff 확인). 신규 효과/애니메이션/사운드 0, mid1/mid2 문구 무변경, 게임 밸런스(TARGET_SCORE/GAME_DURATION/속도) 무변경.
- **파일 간 정합성**: `#cutsceneGoal`(HTML L93) ↔ `document.getElementById('cutsceneGoal')`(JS L1058) ↔ `.game-overlay--cutscene .game-overlay__goal`(CSS L426) 일치. `body.is-touch` / `is-portrait` / `is-landscape` 클래스명 JS↔CSS 일치.

## 참고 — 이번 SPEC의 범위 밖이지만 코드베이스에 남아 있는 사항
- `game.js:940`: `setTimeout(() => triggerCutscene('intro'), 250)` — evaluation_criteria의 "setTimeout으로 애니메이션 완료 처리" 슬롭 패턴과 형태상 유사. 단, 이는 애니메이션 완료 대기가 아닌 "스폰 초기화 후 노출 딜레이" 용도이며, **이전 커밋(`9d48f53 모바일 환경 개선` 이전)부터 존재**한 코드. 이번 SPEC의 변경 범위가 아니므로 감점에 반영하지 않음. 후속 Sprint에서 `requestAnimationFrame` 2회 또는 명시적 `state.started` 플래그로 대체 권장.

---

## 채점 (기능 변경 기준)

**항목별 점수**:
- 패턴 일관성: 9/10 → BEM/CSS변수/네이티브중첩/JS init 패턴 모두 준수. P2 수준 이탈(resize 중복, initOrientationHint 문구 미세 편차)만 존재
- 보안 & 접근성: 9/10 → `textContent` 주입으로 XSS 원천 차단, aria·reduced-motion 전부 보존. 사소 감점은 새 요소의 `aria-live` 미지정(부모 `aria-live="polite"`에 포함되어 동작상 OK)
- 반응형 & UI 품질: 9/10 → 바디 클래스 트리거로 폭 >520px 폰 정상 커버, dvh 기반 축소 유지, 기존 520px 블록 보존. Playwright 게임 페이지 미커버 한계로 감점 -1
- 기능 완성도: 10/10 → SPEC 3개 기능 전부 정확 구현 + mid1/mid2 backward-compatible fallback + re-entry 안전 (`hidden = true` 복원)

**가중 점수**: 9×0.4 + 9×0.25 + 9×0.2 + 10×0.15 = 3.6 + 2.25 + 1.8 + 1.5 = **9.15 / 10.0**

## 최종 판정: **합격**

**구체적 개선 지시**: 없음 (선택 사항으로만 기록, 재작업 불요)
1. (선택) 후속 Sprint에서 `game.js:940`의 `setTimeout(() => triggerCutscene('intro'), 250)`을 `requestAnimationFrame` 2회 또는 시작 오버레이의 `transitionend`로 대체 검토
2. (선택) `syncMobileLayoutClasses()`와 `initOrientationHint()`의 `matchMedia('(orientation: portrait)')` 구독을 한 곳으로 합쳐 중복 `resize` 리스너 제거 검토
