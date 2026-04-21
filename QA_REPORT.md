# QA 검수 보고서 — Pixel Nurse 치비 + 터치 컨트롤

## UI 동작 검증 (Playwright)

SPEC 대상이 **`pages/game.html` 단일 파일**이며 루트 프로젝트의 `npm run ui-check` 스크립트는 index.html 루트 페이지를 검증한다. 게임 페이지 전용 E2E 테스트는 별도 존재하지 않으므로 정적 분석 중심으로 진행한다. (자동 Playwright 시나리오 미존재 — 감점 없음)

정적/로직 리뷰 관점의 검증 항목:

| 체크 항목 | 결과 | 비고 |
|---|---|---|
| 파일 범위 (pages/game.html만 수정) | PASS | `git diff --name-only`로 확인. index.html / assets/css/style.css / assets/js/main.js 미수정 |
| 뷰포트 메타 업데이트 | PASS | L5, `viewport-fit=cover, user-scalable=no, maximum-scale=1` 포함 |
| body.game-page 터치 가드 | PASS | L39-41 |
| #gameCanvas touch-action:none | PASS | L203 |
| D-Pad 마크업 위치 | PASS | `.game-canvas-wrap` 아래(L600-607), `.game-controls` 위(L609) |
| 4방향 버튼/data-dir/aria-label | PASS | L602-605 |
| 시작 오버레이 모바일 안내 문구 | PASS | L571 "모바일에서는 화면 아래 방향패드를 사용하세요." |
| D-Pad CSS (BEM + 네이티브 중첩) | PASS | L411-453 |
| 520px 반응형 | PASS | L507-518 (D-Pad 192, 캔버스 4:3, controls hide) |
| 치비 스프라이트 16×20 재작성 | PASS | L820-841 |
| 방향별 얼굴 분기 | PASS | L844-863 (up 뒷모습, left/right 한쪽 눈·볼) |
| 걷기 바운스 (reduced-motion 가드) | PASS | L897 |
| drawNurse oy=-24, 루프 r<20 | PASS | L895, L898 |
| 히트박스 14×14, 초기 TILE*2+3 | PASS | L952, L1050-1051 |
| isTouchDevice / initTouchControls | PASS | L1279-1310 |
| iOS 오디오 언락 `playTone(0, 0.001)` | PASS | L1011 (btnStart 핸들러 맨 앞) |
| KEY_MAP / 키보드 공존 | PASS | L1020-1038 |
| SPEC 금지 항목 (DIFFICULTY·buildMap·판정식) | PASS | L648-652, L659-711, L1192-1217 동일 |

## SPEC 기능 검증
- [PASS] 치비 간호사 스프라이트 (2.2등신, 얼굴 40%+, 큰 눈+볼터치+작은 입)
- [PASS] 가상 D-Pad 4버튼 터치 컨트롤 (pointer events 통합, is-pressed 피드백)
- [PASS] 모바일 뷰포트 메타 & 제스처 방지
- [PASS] 입력 환경 자동 감지 (`pointer: coarse` 또는 `ontouchstart`)
- [PASS] iOS 오디오 언락

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

### 1. `.game-canvas-wrap`의 `aspect-ratio` 반응형 전환 후 D-Pad 외부 배치 이슈
- **파일**: `pages/game.html:564, 600`
- **현재**: D-Pad(`.game-touchpad`)가 `.game-canvas-wrap` **내부**에 위치하고 있어(L600) SPEC의 "`.game-canvas-wrap` 바로 아래"와는 해석 차이가 있음. 실제로는 `.game-canvas-wrap`이 L564에서 열리고 L598에 닫히는데, L600의 `.game-touchpad`는 이 닫는 태그 **바로 다음**(= `.game-canvas-wrap` 외부 / `.game-stage` 내부)으로 올바르게 배치됨. → 재확인 결과 **PASS**. 기록용으로만 남김.
- **영향**: 없음. 경고성 메모.

### 2. `.game-touchpad`의 `aria-hidden` 속성과 `hidden` 속성 중복
- **파일**: `pages/game.html:600`
- **현재**: `<div class="game-touchpad" id="gameTouchpad" aria-hidden="true" hidden>` — `hidden` 속성은 이미 DOM에서 접근성 트리 제외를 의미하므로 `aria-hidden="true"`와 중복. 다만 SPEC에 명시된 형태 그대로이고, `initTouchControls`가 둘 다 토글하므로 실 동작 문제 없음.
- **수정 제안**: SPEC 지시를 따랐으므로 감점 없음. 향후 정리 시 `hidden`만 남기면 됨.

### 3. `drawObstacle`의 하드코딩 `#6b5a72` / `#ffffff`
- **파일**: `pages/game.html:936, 941`
- **현재**: 기존 코드이며 이번 SPEC 범위에 해당 없음.
- **영향**: 기존 이슈, 이번 변경과 무관. 감점 없음.

---

## 통과 항목
- **Sprint 범위 계약 완벽 준수**: 오직 `pages/game.html` 1개 파일만 수정. `index.html` / `assets/css/style.css` / `assets/js/main.js` 모두 미수정 (git diff로 검증 완료).
- **보안**: `innerHTML` / `eval` / `document.write` / 인라인 이벤트 핸들러 모두 미사용. 외부 데이터 없음 → `esc()`/`safeUrl()` 불필요.
- **CSS 패턴**: BEM(`game-touchpad__btn--up/left/right/down`, `.is-pressed`) 준수, 네이티브 중첩 `&` 사용(SCSS 문법 혼입 없음), CSS 변수(`--bg-card, --border, --text-muted, --brand-12, --brand-40, --brand-light, --radius-sm, --spring-bounce`) 사용, `-webkit-backdrop-filter` 병기(L433), `!important` 미사용(접근성 reduced-motion 제외).
- **JS 패턴**: IIFE + `'use strict'` 유지, 함수 선언식 + 화살표 콜백 혼용 패턴, 가드 클래스(`if (!pad) return;`) 적용, `console.*` 미사용, JSDoc-스타일 섹션 구분선 유지.
- **반응형 & 접근성**: 520px 브레이크포인트 3개 규칙 추가, `prefers-reduced-motion` 전역 + 스프라이트 바운스 JS 가드, `:focus-visible` 제공, 한국어 `aria-label`, `aria-hidden` 토글 일관.
- **HTML 구조**: 모든 버튼에 `type="button"`, 접근성 속성 완비, 새 인라인 스타일 미추가(JS에서 `style.display='none'` 1건은 SPEC 지시사항).
- **파일 간 정합성**: `#gameTouchpad` ID ↔ JS getElementById 일치. `.game-touchpad__btn` 클래스 ↔ CSS 정의 존재. `data-dir` 값(up/down/left/right) ↔ `state.keys` ↔ `KEY_MAP` 값 모두 일치.
- **기능 보전**: `DIFFICULTY` 표, `buildMap`, 수집/스턴 판정식, 음표/장애물 스프라이트, 맵 구조 모두 SPEC 금지 그대로 유지.
- **AI 슬롭 패턴**: 보라-청록 그라디언트 없음, 과대 그림자 없음, 임의 `border-radius` 없음(`--radius-sm` 사용), 불필요한 `scale` 중복 없음, `setTimeout` 애니메이션 취약 타이밍 없음.

---

## 채점 (기능 변경 평가 기준 — 혼합 시 기능 우선)

**항목별 점수**:
- 패턴 일관성: **9/10** → BEM / CSS 변수 / 네이티브 중첩 / JS init 패턴 완벽 준수. 하드코딩 색상은 `nurseSprite` 팔레트에 있으나 픽셀 스프라이트 고유 팔레트로 사이트 `--brand` 톤(`#c4847a`)을 일관 적용(`C`·`M` 모두 brand, `R`은 brand 파생 `#f5a8a0`) → 구조적으로 합리적. P2 사소한 중복(aria-hidden + hidden) 1건만 있음.
- 보안 & 접근성: **9/10** → XSS 표면 0, 한국어 aria-label, `:focus-visible`, `aria-hidden` 토글, reduced-motion 대응. 정적 DOM·상수만 다루므로 보안 감점 요소 없음.
- 반응형 & UI 품질: **9/10** → 520px에서 D-Pad 확대 + 캔버스 4:3 + 키보드 안내 숨김. `touch-action`·`overscroll-behavior`·`-webkit-tap-highlight-color` 등 모바일 세부도 완비. `-webkit-backdrop-filter` 병기.
- 기능 완성도: **9/10** → SPEC 5개 기능(치비·D-Pad·뷰포트·자동감지·iOS 언락) 모두 구현. 키보드 공존, pointer events 4종(down/up/cancel/leave) + contextmenu 방지, canvas touchmove preventDefault까지 완비. 기존 `DIFFICULTY`/`buildMap`/판정식 건드리지 않음.

**가중 점수**: (9×0.40) + (9×0.25) + (9×0.20) + (9×0.15) = **9.0 / 10**

---

## 최종 판정: **합격**

Sprint 범위 계약(단일 파일 수정)을 완벽히 지켰고, SPEC의 모든 항목이 명세 그대로 구현되었다. AI 슬롭 패턴 0건, P0/P1 이슈 0건, 기존 게임 로직 보전 완벽. 관대하게 채점한 것이 아닌가를 한 번 더 확인했으나 — (1) `git diff --name-only`로 파일 범위를 기계적으로 검증, (2) SPEC의 금지 영역(`DIFFICULTY`/`buildMap`/판정식)의 실제 코드 라인이 변경 없음을 확인, (3) BEM/변수/네이티브중첩/aria 속성 체크리스트를 하나씩 대조 → 모두 PASS. 감점 근거가 없다.

**구체적 개선 지시**: 없음. 합격으로 마무리.

