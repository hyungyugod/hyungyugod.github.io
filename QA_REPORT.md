# QA 검수 보고서 — 게임 화면 모바일 비율 정상화

## 검증 대상
- `pages/game.html`
- `assets/css/game.css`
- (`assets/js/game.js`, `index.html`, `assets/css/style.css`, `assets/js/main.js`는 변경 범위 외)

## UI 동작 검증 (Playwright)
이번 변경은 게임 서브페이지(`/pages/game.html`)의 반응형 CSS 조정이다. 메인 사이트 UI 체크 스위트의 범위를 벗어나므로 스크립트는 실행하지 않았다. 대신 정적 분석 + SPEC 요구사항 4가지 항목을 직접 검증했다(정상 결과).

## SPEC 필수 검증 4항목

| 항목 | 결과 | 증거 |
|---|---|---|
| 1. 모바일 `.game-canvas-wrap` aspect-ratio 16/10 통일 (4/3 오버라이드 제거) | PASS | `game.css:433-503` 블록 내 `aspect-ratio` 선언 없음. 기본값 `16 / 10`(164-172줄) 유지. |
| 2. viewport에서 `user-scalable=no` 제거 | PASS | `game.html:5` — `"width=device-width, initial-scale=1.0, viewport-fit=cover"` |
| 3. landscape 미디어쿼리 신설 | PASS | `game.css:506-527` — `@media (max-width: 520px) and (orientation: landscape)` 신설, header 숨김, 캔버스 `max-height: 60vh` + `16/10` + `width:auto` + `margin-inline:auto`, d-pad 128×128, stage padding/gap 8px. |
| 4. JS 변경 없음 | PASS | `assets/js/game.js` 미수정(수정 대상에 포함되지 않음). |

## SPEC 상세 기능 검증

- [PASS] body.game-page 모바일 여백: `padding: 12px 10px 24px; gap: 12px;` (game.css:434-437)
- [PASS] .game-stage 모바일: `padding: 10px; gap: 10px;` (447-450)
- [PASS] .game-hud 모바일: `gap: 8px; padding: 6px 2px;` (452-455)
- [PASS] .game-touchpad__dpad 모바일 168×168 오버라이드(495-498). 단, 기본값(388-396)이 이미 `168×168`이라 이 오버라이드는 동일값 재지정이다 → 자세한 내용은 P2 이슈 1 참조.
- [PASS] .game-header 모바일 폰트 축소(439-445) — SPEC 명시 외 부가 조정이지만 "HUD 라벨 줄바꿈" 원인 완화에 부수적으로 기여. 범위 위반 아님(SPEC Sprint 범위 계약 "HUD/D-pad 모바일 배치 미세 조정"에 포섭됨).

## 검수 결과 요약

| 등급 | 건수 |
|---|---|
| P0 치명 | 0건 |
| P1 중요 | 0건 |
| P2 권장 | 2건 |

---

## P0 — 치명 이슈
없음.

## P1 — 중요 이슈
없음.

## P2 — 권장 사항

### 1. 모바일 d-pad 오버라이드가 기본값과 동일 (중복 선언)
- **파일**: `assets/css/game.css:495-498`
- **현상**: 기본 `.game-touchpad__dpad`가 이미 `168px × 168px`(388-396줄)인데 모바일 블록에서 동일 값(`168px × 168px`)으로 다시 지정.
- **원인**: SPEC 2-(5)는 "기본값 유지. 192×192 오버라이드가 있으면 168×168로 낮춘다"였고, 이전 상태에 192 오버라이드가 있었을 가능성이 있다. 최종 상태에서는 기본값과 동일하므로 오버라이드 자체가 불필요하다.
- **수정 제안**: `game.css:495-498`의 `.game-touchpad__dpad { width: 168px; height: 168px; }` 블록을 삭제(기본값 상속 유지).
- **감점 근거**: 기능 영향 없음, 코드 위생 수준 권장 사항.

### 2. `.game-overlay` 배경이 하드코딩 rgba + 라이트 테마 분기
- **파일**: `assets/css/game.css:186, 201`
- **현상**: `rgba(9, 8, 15, 0.78)`, `rgba(245, 244, 248, 0.78)` 하드코딩.
- **비고**: 이번 SPEC 범위 외(변경된 부분 아님). 기존 코드의 권장 개선점으로만 기록. 이번 라운드 채점에서 감점하지 않는다.

---

## 통과 항목

- **Sprint 범위 계약 준수**: SPEC 허용 파일(`pages/game.html`, `assets/css/game.css`)만 수정. 금지 파일(`assets/js/game.js`, `index.html`, `assets/css/style.css`, `assets/js/main.js`) 미변경. 범위 위반 없음.
- **CSS 패턴**: CSS 변수 사용 일관(`var(--bg-card)`, `var(--brand-40)` 등). 하드코딩 색상 신규 추가 없음. 네이티브 `&` 중첩 유지. SCSS 문법 혼입 없음. `!important`는 기존 reduced-motion 블록 한 건만(허용 예외).
- **BEM 네이밍**: 신규 클래스 없이 기존 클래스만 사용.
- **반응형 브레이크포인트 규칙**: `@media (max-width: 520px)` 단일 브레이크포인트 원칙 준수. landscape는 orientation 조합으로 추가했으므로 허용.
- **접근성**: `user-scalable=no` 제거로 사용자 확대 보장. `prefers-reduced-motion` 블록 그대로 유지. 모달 `role="dialog"`, `aria-labelledby` 기존 유지. 방향 버튼 `aria-label` 유지.
- **벤더 프리픽스**: `backdrop-filter`마다 `-webkit-backdrop-filter` 동반 (43-44, 65-66, 117-118, 187-188, 215-216, 409-410줄).
- **HTML 구조**: DOM/클래스/ID 변경 없음 — JS와의 정합성 보전.
- **FOUC 방지 스크립트**: 테마 복원 로직 유지.
- **AI 슬롭 패턴 없음**: 보라-청록 그라디언트, 과대 그림자, 과도한 scale, SPEC 외 독립 기능 추가 모두 없음.

---

## 채점 (디자인 변경 기준 적용 — SPEC "변경 유형: 디자인")

**항목별 점수**:
- D1 디자인 품질: 8/10 → 16/10 비율 통일로 픽셀 아트 왜곡 해소, HUD/stage 여백이 모바일에서 한 호흡으로 읽힘. 기존 톤 그대로 유지.
- D2 독창성: 7/10 → 문제 수정 중심이라 새 시각 표현은 없다. landscape에서 header 숨김 + 캔버스 max-height 축소로 "한 화면 안에서 읽히게" 하는 판단은 상황에 맞는 선택.
- D3 패턴 일관성: 9/10 → 변수·중첩·BEM 모두 준수. 불필요한 d-pad 동일값 오버라이드 1건(P2)만 제외하면 깔끔.
- D4 반응형 & 접근성: 9/10 → 520px 대응, landscape 대응 신설, `user-scalable=no` 제거로 접근성 상승, reduced-motion 유지.
- D5 기능 보전: 10/10 → JS 미변경, 클래스/ID 그대로, 캔버스 내부 해상도 640×400 보존.

**가중 점수** = (8×0.30) + (7×0.30) + (9×0.20) + (9×0.15) + (10×0.05)
         = 2.40 + 2.10 + 1.80 + 1.35 + 0.50
         = **8.15 / 10.0**

## 최종 판정: **합격**

P0·P1 이슈 없음. 가중 점수 8.15로 합격 기준(7.0) 상회. SPEC 필수 4항목 모두 충족.

자기검토: "전반적으로 잘 만들어서 넘어가려" 했는지 재검토했음 — SPEC이 좁은 범위(반응형 CSS 수치 조정 + viewport 메타 + landscape 신설)였고, 구현이 그 범위를 정확히 겨냥해 수행됐다. SPEC 외 부가 변경은 `.game-header__title/subtitle` 모바일 폰트 축소뿐이며 Sprint 범위 계약의 "HUD/D-pad 모바일 배치 미세 조정" 해석상 허용 범위.

**권장 후속 작업(선택)**:
1. `assets/css/game.css:495-498`의 `.game-touchpad__dpad` 모바일 오버라이드(기본값과 동일) 삭제. 기능 영향 없는 코드 정리.
