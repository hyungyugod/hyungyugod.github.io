# QA 검수 보고서

## UI 동작 검증 (Playwright)

| 체크 항목 | 결과 | 비고 |
|---|---|---|
| 테마 토글 | PASS | 다크↔라이트 정상 |
| 카테고리 필터 (4종) | PASS | writing/music/social/all 모두 통과 |
| 프로필 모달 | FAIL | `locator.waitFor: Timeout 3000ms exceeded` — index.html 테스트. **본 SPEC은 game.html만 대상**이며 index.html/main.js 변경 0. 하네스 메모리상 반복되는 테스트 환경 한계(P2 분류) |
| 링크카드 href | PASS | 2/2 유효 |
| 모바일 520px | PASS | 핵심 요소 3개 visible |
| 콘솔 에러 | PASS | 0건 |

결과: 8/9 통과. 스크린샷: `tests/screenshots/`

## SPEC 기능 검증

### 삭제 대상 — 모두 완료
- [PASS] `#rotateHint` DOM 제거 — `pages/game.html`에 `game-rotate*` 잔존 0건
- [PASS] `.game-rotate-hint`, `@keyframes gameRotateSpin`, reduced-motion 내부 `.game-rotate-hint__icon` 규칙 — `assets/css/game.css` grep 0건
- [PASS] `body.is-touch.is-portrait .game-joycons { display:none }` 삭제 — 전체 assets 트리 grep 0건
- [PASS] `body.is-touch.is-landscape { ... }` 블록 + `@media (max-height: 360px)` landscape 블록 삭제 — grep 0건
- [PASS] `initOrientationHint()`, `syncMobileLayoutClasses()` 함수/호출 삭제 — grep 0건
- [PASS] `is-touch`/`is-portrait`/`is-landscape` 바디 클래스 의존 제거 — grep 0건

### 신규 추가 — 기능 1: 하단 D-Pad 키패드
- [PASS] `game.html:132-139` — `.game-keypad > .game-keypad__dpad > .game-keypad__btn` BEM 구조, `data-dir` 보존, `aria-hidden="true" hidden` 초기값, `role="group"` + `aria-label`
- [PASS] 배치 — `.game-stage` 내부, `.game-canvas-wrap` 바로 아래, `.game-controls` 위(132~139 vs 141~145)
- [PASS] `game.css:697-748` — 기본 `display:none` + `&[hidden]` 가드, `.game-keypad__dpad` grid 3×3 십자 배치, 버튼 72×72px, backdrop-filter + -webkit- 페어, `:active/.is-pressed` 코럴핑크 글로우(`box-shadow: 0 0 22px var(--brand-14)`), `:focus-visible` outline, `touch-action: none`
- [PASS] `game.css:751-758` — `@media (hover:none) and (pointer:coarse)` 노출 해제 규칙 정확
- [PASS] `game.css:761-771` — 380px 브레이크포인트 60×60px, gap 8px
- [PASS] `game.css:698, 756` — iOS safe-area `padding-bottom: max(4px, env(safe-area-inset-bottom))` 적용

### 기능 2: 키보드/캔버스 탭/키패드 3-way 공존
- [PASS] `game.js:2062` — `dpadPressCount` 레퍼런스 카운터 유지
- [PASS] `game.js:2083-2084` — release 시 카운터 감소 후 0일 때만 `state.keys[dir] = false`
- [PASS] `game.js:2089, 2177` — `isAnyOverlayOpen()` 가드 유지

### 기능 3: 터치 디바이스 감지 & 노출 제어
- [PASS] `game.js:2069-2073` — `initKeypad()`가 `root.hidden = false; aria-hidden='false'` 수행
- [PASS] `game.js:2202` — `if (isTouchDevice()) initTouchControls();` 유지, `initTouchControls()`(2049) → `initKeypad()` 호출(2056)
- [PASS] 데스크톱에서는 `initTouchControls` 미호출로 `hidden` 유지 → CSS도 `display:none`

### reduced-motion
- [PASS] `game.css:1057-1065` — `.game-keypad__btn { transition:none }` + `:active/.is-pressed { transform:none; box-shadow:none }`

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

### 1. "모바일: 하단 키패드 또는 화면 터치" 안내가 사실상 보이지 않음
- **파일**: `pages/game.html:144`, `assets/css/game.css:1023-1025`, `assets/js/game.js:2051-2052`
- **현상**: SPEC이 `.game-controls`에 새 안내 한 줄을 추가하라고 했고 Generator는 추가했지만,
  - 데스크톱에서는 `.game-controls`가 표시되나 "모바일" 안내는 맥락 불일치
  - 모바일(≤520px)에서는 CSS `.game-controls { display:none }`(line 1024)으로 전체 블록이 숨겨짐
  - 추가로 `initTouchControls()`가 인라인 `style.display='none'`까지 적용(2052행, 기존 로직)
- **결과**: 추가된 안내 문구는 실제 렌더링 경로가 없는 데드 콘텐츠에 가깝다.
- **수정 제안 (선택)**: 본 SPEC 범위를 벗어날 수 있으므로 즉시 고치진 않아도 됨. 추후 개선 시 키패드 자체에 `aria-label`/시각 라벨로 동등 정보를 제공하거나, `.game-controls`를 모바일에서도 짧게 노출.

### 2. `.game-keypad` 기본 상태의 `padding-bottom` 중복
- **파일**: `assets/css/game.css:699, 756`
- **현상**: `.game-keypad` 기본 규칙(line 699)에 `padding-bottom: max(4px, env(safe-area-inset-bottom))`이 있고, `@media (hover:none) and (pointer:coarse)` 내부(line 756)에 동일 선언이 반복. 기본 상태는 `display:none`이므로 line 699 선언은 렌더링에 영향 없음 — 하나로 줄이는 편이 읽기 좋음.
- **수정 제안**: line 699의 `padding-bottom` 제거 후, 미디어쿼리 내부 선언만 유지. (혹은 반대로 기본에 두고 media에서 제거.)

### 3. Playwright 프로필 모달 실패 (환경 한계)
- **파일**: `tests/ui-check.js` (SPEC 범위 밖)
- **현상**: `locator.waitFor: Timeout 3000ms` — 본 SPEC은 `pages/game.html` + `game.css` + `game.js`만 수정했고 `index.html`/`main.js`/`style.css`는 diff 0건. 하네스 메모리에 기록된 반복적 테스트 환경 한계로 판단.
- **조치**: 이번 스프린트 감점 대상 아님. 향후 별도 스프린트로 테스트 안정화 권장.

## 통과 항목
- 보안: 외부 데이터 처리 없음, `esc()`/`safeUrl()` 대상 없음, 인라인 이벤트 핸들러 0건
- CSS 패턴: 네이티브 `&` 중첩 사용, 하드코딩 색상 0건, `--brand-*`/`--bg-card`/`--border`/`--spring-bounce` 재사용, `!important` 미사용, `-webkit-backdrop-filter` 페어
- BEM: `.game-keypad` / `.game-keypad__dpad` / `.game-keypad__btn` / `--up|--down|--left|--right` + `.is-pressed` 상태 클래스
- JS 패턴: function 선언식 init + 화살표 콜백, `if (!root) return;` 가드, JSDoc 주석, DOMContentLoaded 내 초기화, `state.keys[dir]` 단일 레일 공존
- HTML: `aria-label`/`role="group"` 구비, 새 인라인 스타일 0건
- 반응형: 380/520px 이중 대응, safe-area-inset 적용
- 접근성: `prefers-reduced-motion` 대응, `:focus-visible` outline 유지
- Sprint 범위: SPEC 허용(a~e) 외 변경 없음, 금지 항목(새 기능/오버레이/데스크톱 변경/조작 의미 변경) 위반 0건
- 파일 간 정합성: HTML `id="gameKeypad"` ↔ JS `getElementById('gameKeypad')` ↔ CSS `.game-keypad*` 완전 일치, 구(`gameJoycons`/`game-joycon*`/`rotateHint`/`is-touch`/`is-portrait`/`is-landscape`) 잔존 참조 0건
- 콘솔 에러: 0건

---

## 채점 (기능 변경 기준 — SPEC "혼합"이지만 로직 재배선 비중이 큼)

**항목별 점수**:
- 패턴 일관성: 9/10 → BEM·네이티브 중첩·CSS 변수·JS init 패턴 모두 준수. 사소한 `padding-bottom` 중복 1건만 P2
- 보안 & 접근성: 9/10 → 외부 데이터 없음, `aria-label`/role/`:focus-visible`/reduced-motion/`touch-action` 모두 구비
- 반응형 & UI 품질: 9/10 → 380/520px 대응, safe-area-inset, 캔버스 `max-height: calc(100dvh - 340px)` 공간 확보. 작성된 "모바일" 안내가 사실상 비표시인 점이 -1
- 기능 완성도: 9/10 → SPEC의 삭제/추가 항목 100% 반영, Pointer Events 멀티포인터 대각선 지원, 레퍼런스 카운터 유지로 3-way 공존 안전. index.html 프로필 모달 Playwright 실패는 SPEC 범위 밖(환경 한계)

**가중 점수** = (9×0.4) + (9×0.25) + (9×0.2) + (9×0.15) = **9.0 / 10.0**

이슈 건수: P0 0건, P1 0건 → 점수 기준 단독 채택.

## 최종 판정: **합격**

**구체적 개선 지시**(후속 스프린트용 · 선택):
1. `assets/css/game.css:699` — 기본 상태의 `padding-bottom` 선언을 제거하고 미디어쿼리 내부(line 756)만 남겨 중복 제거.
2. (선택) `.game-controls`의 모바일 숨김 정책 재검토 — 새로 추가된 "모바일: 하단 키패드 또는 화면 터치" 안내가 실제 노출되도록 할지, 또는 해당 `<span>`을 제거할지 결정.
3. (범위 밖) `tests/ui-check.js`의 프로필 모달 검사 안정화는 별도 스프린트로 분리 권장.
