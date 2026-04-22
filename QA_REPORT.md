# QA 검수 보고서

대상: `pages/game.html`, `assets/css/game.css`, `assets/js/game.js`
SPEC 변경 유형: **혼합** (UI 레이아웃 + 입력 로직) → 기능 평가 기준 적용

---

## UI 동작 검증 (Playwright — `npm run ui-check`)

| 체크 항목 | 결과 | 비고 |
|---|---|---|
| 테마 토글 | PASS | 다크↔라이트 전환 정상 |
| 카테고리 필터 (writing/music/social/all) | PASS | 4종 모두 통과 |
| 프로필 모달 | FAIL | **테스트 환경 한계(P2)** — index.html 이슈, 게임 SPEC 범위 밖. CLAUDE.md의 "Playwright fixed-position overlap" 한계 사례에 해당 |
| 링크카드 href | PASS | |
| 모바일 520px 뷰포트 | PASS | 핵심 요소 3개 visible |
| 콘솔 에러 | PASS | 0건 |

결과: 8/9 (실패 1건은 SPEC 범위 밖 + 테스트 환경 한계로 채점 반영 안 함)

**주의**: ui-check.js는 메인 사이트(index.html) 기준이며, SPEC 대상인 `pages/game.html`의 orientation 분기·탭 이동은 자동화 커버 밖이다. 아래 정적 분석으로 수락 기준을 검증한다.

---

## SPEC 수락 기준 검증 (정적)

| # | 수락 기준 | 검증 |
|---|---|---|
| 1 | 데스크탑 키보드 경로 무변경 | PASS — `KEY_MAP`, keydown/keyup 코드 미변경 |
| 2 | 모바일 portrait: rotateHint 노출, D-pad 숨김 | PASS — `@media (…portrait)` 내 `.game-touchpad { display:none !important }`, JS `initOrientationHint` apply(true) |
| 3 | 모바일 landscape: 캔버스 풀 + 헤더/푸터/탑바 숨김 | PASS — `@media (…landscape)`가 topbar/header/footer/controls/touchpad 숨김, canvas `max-height: calc(100dvh - 60px)` + `100vh` fallback, `aspect-ratio: 16/10` |
| 4 | 탭 4방향 이동 | PASS — `resolveDir()`에서 우세 축 기반 판정, `state.keys[dir]=true` |
| 5 | 드래그 중 실시간 갱신 | PASS — `pointermove`에서 `applyDir(resolveDir(...))` 호출, 동일 pointerId만 추적 |
| 6 | 데드존 정지 | PASS — `TILE*0.4` 미만이면 `resolveDir`가 null → `clearKeys` |
| 7 | 오버레이 활성 중 탭 무시 | PASS — `onDown`/`onMove`에서 `isAnyOverlayOpen()` early-return (단, move는 clearKeys로 안전하게 정지) |
| 8 | `prefers-reduced-motion`에서 회전 애니 제거 | PASS — `.game-rotate-hint__icon { animation: none; }` 추가 |
| 9 | 콘솔 에러 0건 | PASS (메인 페이지 기준) |
| 10 | 탭 핸들러 `isTouchDevice()` 조건 | PASS — `if (isTouchDevice()) initTouchControls()` 유지, `initCanvasTapMove`는 그 안에서만 호출 |

---

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

### 1. rotateHint 오버레이 — `z-index: 100` 값의 의미 불명확
- **파일**: `assets/css/game.css:977` 부근
- **현상**: 하드코딩 `z-index: 100`. 기존 `.game-overlay` 대비 상대 우위가 코드에 명시되지 않음.
- **제안**: 주석으로 "`game-overlay`(z-index:10) 대비 우위로 모달 위에 덮도록"이라고 의도를 남기거나, 기존 게임 오버레이 z-index 스케일(예: 10)에 맞춰 30~50 범위로 일관화.

### 2. `.game-rotate-hint` 배경 — 하드코딩 rgba 2개 (다크/라이트)
- **파일**: `assets/css/game.css` (`background: rgba(9,8,15,0.88)` / `html.light .game-rotate-hint { background: rgba(245,244,248,0.88) }`)
- **현상**: SELF_CHECK가 언급한 대로 기존 `.game-overlay`와 동일한 패턴이긴 하나, 코드베이스 일관성 관점에서는 여전히 하드코딩.
- **제안**: 장기적으로 `--overlay-bg` 커스텀 프로퍼티를 `:root` / `html.light`에 도입해 재사용. 이번 스프린트 범위는 아니므로 기록만.

### 3. panel `box-shadow: 0 10px 40px rgba(0,0,0,0.45)` — AI 슬롭 패턴 경계
- **파일**: `assets/css/game.css` `.game-rotate-hint__panel`
- **현상**: 평가 기준표의 "box-shadow: 0 20px 60px rgba(0,0,0,0.3) 이상 과대 그림자"에 미달(10px/40px/0.45)하므로 슬롭 기준선은 넘지 않음. 다만 기존 `.game-overlay__panel`의 그림자 규약과 정렬시키면 더 좋다.
- **제안**: 기존 오버레이 패널 그림자 값을 복사/참조하여 시각 리듬 통일.

---

## 통과 항목

- **보안**: 외부 데이터/`innerHTML`/`eval` 사용 없음. `esc`/`safeUrl`가 필요한 삽입 없음.
- **CSS 패턴**: 네이티브 `&` 중첩 준수, BEM `game-rotate-hint__{panel,icon,title,desc}` + `is-visible` 상태 클래스, `-webkit-backdrop-filter` 동반 선언, `var(--bg-card/--border/--brand-40/--brand-12/--brand-14/--brand-light/--text/--text-muted/--radius/--font-serif)` 적극 사용. `!important`는 portrait/landscape의 `.game-touchpad { display: none }`에서만 사용(접근성/오버라이드 목적이며 SPEC 명시).
- **JS 패턴**: 함수 선언식(`function initCanvasTapMove()`), 콜백은 화살표(`onDown/onMove/onEnd/apply/clearKeys/resolveDir/applyDir`), 가드 클래스(`if (!canvas) return;`, `if (!p) return null;`, `rect.width===0` 체크, `if (!hint) return`) 다수 적용, JSDoc 주석 정돈, IIFE 말단 초기화 블록에 `initOrientationHint()` 등록. `matchMedia` `addEventListener`/`addListener` 양쪽 대응.
- **HTML**: `#rotateHint` `role="dialog" aria-labelledby aria-hidden hidden` 완비. 기존 `target="_blank"`/`rel="noopener"` 유지.
- **반응형 & 접근성**: `@media (max-width:520px)` orientation 분기 양쪽 구현, `prefers-reduced-motion`에 회전 아이콘 추가, `touch-action: none`으로 제스처 차단, `100dvh` + `100vh` 폴백.
- **파일 간 정합성**: `#rotateHint`·`#gameCanvas`·`.game-touchpad` 모두 HTML·CSS·JS 간 이름 일치.
- **Sprint 범위**: SPEC 금지 항목(키보드 경로 변경, 게임 로직 수정, 스와이프/핀치/더블탭, orientation lock API, 메인 사이트 파일 수정) 일절 없음. 메인 사이트 3파일 변경 없음 확인.
- **멀티터치**: `activePointerId`로 첫 포인터만 추적 — SPEC에 없지만 SPEC 기능 정상 동작에 필수적인 안전 장치로 범위 내로 판단.

---

## 채점

평가 기준: **기능 변경 평가 기준** (SPEC 변경 유형 "혼합")

| 항목 | 점수 | 코멘트 |
|---|---|---|
| 패턴 일관성 (40%) | **9/10** | BEM/CSS 변수/네이티브 중첩/가드 클래스/JSDoc/init 등록 모두 준수. P2 수준 하드코딩 배경 rgba 2건(기존 `.game-overlay`와 동일 패턴) 만 감점. |
| 보안 & 접근성 (25%) | **9/10** | `role="dialog"` + `aria-labelledby` + `aria-hidden` + `hidden` 속성, `prefers-reduced-motion` 대응, `matchMedia` 구형 폴백까지 포함. 외부 데이터 삽입 없음. 오버레이 포커스 트랩은 SPEC 범위 밖이라 감점 없음. |
| 반응형 & UI 품질 (20%) | **9/10** | portrait/landscape 양쪽 분기, `100dvh`+`100vh` 폴백, `touch-action: none`, `aspect-ratio: 16/10`, 캔버스 `cursor: pointer`. 시각적 hover 상태는 게임 특성상 해당 없음. |
| 기능 완성도 (15%) | **10/10** | SPEC 수락 기준 10개 모두 정적 검증 통과. 멀티터치 안전장치·`isAnyOverlayOpen` 실시간 모니터링 등 견고함 추가. |

**가중 점수** = 9×0.4 + 9×0.25 + 9×0.2 + 10×0.15 = 3.6 + 2.25 + 1.8 + 1.5 = **9.15 / 10.0**

### 엄격성 재검토

"8.0 이상 경고 신호"를 의식하여 재점검:
- 하드코딩 색상 있는가? → `rgba(9,8,15,0.88)` / `rgba(245,244,248,0.88)` / `rgba(0,0,0,0.45)` 3건. 다만 기존 `.game-overlay`가 동일 패턴 유지 중이며 SPEC이 glassmorphism 유지를 명시 → P1이 아닌 P2로 판단. 패턴 일관성 10→9로 이미 반영.
- SPEC 범위 위반? → 없음 (메인 사이트 파일 무변경, 제스처 추가 없음, 키보드 경로 무변경, orientation lock 미사용).
- `!important` 사용? → portrait/landscape `.game-touchpad` 숨김 2건. SPEC이 직접 지시한 규약이고, 기존 규칙 오버라이드 목적이므로 위반 아님.
- 범위 초과 기능 추가? → `activePointerId` 멀티터치 가드는 "탭 이동이 제대로 동작하려면 필수"(두 손가락 들어오면 방향이 엉킴) → 허용 범주.
- `transitionend` 대신 `setTimeout`? → 해당 없음.

재검토 후에도 감점 근거 없음 → 9.15 유지.

---

## 최종 판정: **합격**

**근거**:
- 가중 점수 9.15 ≥ 7.0 (합격선)
- P0 0건, P1 0건 → "P1 3건 이상 시 최대 조건부 합격" 조항 해당 없음
- SPEC 수락 기준 10/10 정적 통과
- Sprint 범위 계약 준수

**권장 개선 (합격 후 차기 스프린트용, 블로킹 아님)**:
1. `.game-rotate-hint` `z-index: 100`에 주석 추가 — 기존 `.game-overlay` 스택과의 관계 명시
2. 장기적으로 `--overlay-bg`(다크/라이트 쌍) 커스텀 프로퍼티 도입해 `.game-overlay` / `.game-rotate-hint` 배경 rgba 하드코딩 일원화
3. `.game-rotate-hint__panel` `box-shadow` 값을 기존 `.game-overlay__panel` 규약과 통일
