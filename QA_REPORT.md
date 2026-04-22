# QA 검수 보고서

## 검수 대상
- `pages/game.html` (조이콘 DOM 구조)
- `assets/css/game.css` (`.game-joycon` 그리드 + landscape max-width)
- `assets/js/game.js` (`initDualDpad`, `clearDpadPressed`, `dpadPressCount`)

## SPEC 대비 변경 범위 검증
SPEC.md의 Sprint 범위 계약(허용/금지 항목)과 git diff를 1:1 대조했다.

| SPEC 허용 항목 | 구현 여부 | 위치 |
|---|---|---|
| 좌측 블록에 `right` 버튼 추가, 우측 블록에 `left` 버튼 추가 | OK | `pages/game.html:136,141` |
| `.game-joycon` 3×3 십자 그리드로 통합 | OK | `assets/css/game.css:706-717` |
| 좌/우 전용 grid 블록 삭제 + 공통 `--up/--left/--right/--down` 규칙 1회 | OK | 기존 `.game-joycon--left`, `.game-joycon--right` 블록 삭제됨 |
| `state.keys[dir]` 레퍼런스 카운팅 | OK | `assets/js/game.js:2062,2083-2084,2094` |
| `activePointerId` 중복 포인터 가드 유지 | OK | `assets/js/game.js:2090` |
| `clearDpadPressed` 카운터 동반 리셋 | OK | `assets/js/game.js:2118-2121` |
| 캔버스 가용 폭 `calc(100vw - 340px)` | OK | `assets/css/game.css:1044` |

| SPEC 금지 항목 | 위반 여부 |
|---|---|
| 새 색/그림자/애니메이션 | 위반 없음 — `box-shadow`/`transition`/키프레임 추가 없음 |
| `initCanvasTapMove` 변경 | 위반 없음 — 해당 함수 무변경 |
| 레이아웃 시스템 교체 | 위반 없음 — flex 컨테이너 유지 |
| 새 버튼(공격/점프 등) | 위반 없음 |

**범위 위반: 0건.**

## UI 동작 검증 (Playwright)
실행 불가 — 프로젝트 루트에 `package.json` 없음(zero-build 사이트)이며, SPEC 변경은 모바일 가로모드 터치 UX 전용이라 데스크톱 브라우저 자동화로는 의미 있는 검증이 어렵다. 정적 분석으로 대체.

## SPEC 기능 검증
- [PASS] 기능 1 — 양쪽 4방향 D-pad: 좌·우 블록 모두 `up/left/right/down` 4버튼 (8개). 각 버튼이 `data-dir`·`aria-label`·`type="button"` 보유.
- [PASS] 기능 2 — 동일 dir 중복 입력 해제: `dpadPressCount[dir]`을 +1/-1로 관리하고, 0일 때만 `state.keys[dir] = false`. 양쪽 up 동시 눌렀다가 한쪽만 떼면 남은 쪽이 유지됨이 로직상 보장.
- [PASS] 기능 3 — 오버레이 전환 안전 리셋: `clearDpadPressed()`에서 `.is-pressed` 제거 + 4방향 카운터 0 리셋. `startGame()`에서 `state.keys = Object.create(null)`로 키 레일 전체 리셋(`game.js:880-881`)이 선행되므로 팬텀 입력 발생 경로 없음.

## 검수 결과 요약

| 등급 | 건수 |
|---|---|
| P0 치명 | 0건 |
| P1 중요 | 0건 |
| P2 권장 | 1건 |

## P0 — 치명적 이슈
없음.

## P1 — 중요 이슈
없음.

## P2 — 권장 사항

### 1. `clearDpadPressed` 리셋 루프화로 가독성 향상
- **파일**: `assets/js/game.js:2118-2121`
- **현재 코드**:
  ```js
  dpadPressCount.up = 0;
  dpadPressCount.down = 0;
  dpadPressCount.left = 0;
  dpadPressCount.right = 0;
  ```
- **제안**: 방향 추가 시 누락 위험을 줄이려면 `Object.keys(dpadPressCount).forEach(k => dpadPressCount[k] = 0);` 형태가 유지보수에 낫다. 현 4방향 고정에서는 기능·성능 차이 없음. (사소한 권장)

## 통과 항목

### 보안
- `innerHTML`/`eval`/`document.write`/인라인 핸들러 — 변경분에 없음. `esc()`·`safeUrl()` 필요 경로 없음(외부 데이터 주입 없음).

### CSS 패턴
- CSS 네이티브 중첩 `&` 준수(`assets/css/game.css:713-716`). SCSS 문법 혼입 없음.
- 하드코딩 색상 추가 없음 — 변경된 그리드 규칙은 색/그림자 미수반.
- `!important` 미사용.
- BEM `game-joycon__btn--{dir}` 유지.
- `backdrop-filter` / `-webkit-backdrop-filter` 쌍은 기존 그대로.

### JS 패턴
- `function` 선언식(`initDualDpad`, `clearDpadPressed`) + 콜백 화살표 — 기존 패턴 일치.
- 가드 클래스 `if (!root) return;`(2071), `if (activePointerId !== null) return;`(2090), `if (e.pointerId !== activePointerId) return;`(2101) 준수.
- `console.error` 미사용, `try/catch` 주변 기존 구조 훼손 없음.
- 주석·JSDoc 보강(2064-2068, 2111-2114)으로 의도 명확화.

### HTML 구조
- 모든 버튼 `type="button"` + `aria-label` 보유. 외부 링크 아님(`rel` 불필요).
- 신규 인라인 스타일 없음.
- JS가 `#gameJoycons` + `.game-joycon__btn[data-dir]`를 쿼리 — HTML과 일치.

### 반응형 & 접근성
- `body.is-touch.is-landscape` 블록 유지, 조이콘 위치/pointer-events/z-index 보전.
- `@media (max-height: 360px)` 초소형 landscape 조이콘 축소 규칙 보존.
- `@media (prefers-reduced-motion: reduce)` 블록 내 `.game-joycon__btn` transition/pressed 무효화 유지(1186-1194).
- `:focus-visible` outline 규칙 유지(746-749).
- `touch-action: none` 버튼에 유지.

### 파일 간 정합성
- HTML `data-dir ∈ {up,left,right,down}` ↔ CSS `.game-joycon__btn--{up,left,right,down}` ↔ JS `dpadPressCount[dir]` 키 완전 일치.
- CSS에 선언된 그리드 위치는 양쪽 블록 모두 기대대로 매핑(좌우 동일 십자형).
- 이전 `.game-joycon--left` / `.game-joycon--right` 전용 grid 규칙은 삭제되어 미사용 셀렉터 잔존 없음.

### AI 슬롭 패턴 검사
보라-청록 그라디언트, 과대 그림자, 임의 border-radius 20px+, 불필요한 scale, SPEC 외 독립 기능, `setTimeout` 애니메이션 타이밍 — 전부 해당 없음.

## 잠재 엣지 케이스(참고, 감점 아님)
1. `setPointerCapture` 후 포인터가 버튼 밖으로 이동해도 캡처가 유지되어 `pointerleave`가 호출되지 않을 수 있다. 이는 변경 이전부터 존재한 동작이며 SPEC 범위 밖이라 이번 검수 대상 아님.
2. 오버레이가 열린 상태에서 이미 누르고 있던 버튼을 뗄 때, 포인터별 closure의 `activePointerId`는 여전히 유효 → `release()` 호출 → `dpadPressCount[dir]` 이미 0 → `Math.max(0, -1)=0` 가드로 음수 방지됨. 팬텀 입력 없음. 설계 양호.

---

## 채점 (기능 변경 평가 기준 적용)

**항목별 점수**:
- 패턴 일관성: 9/10 → BEM·네이티브 중첩·CSS 변수·function 선언 + 화살표 콜백·가드 클래스 모두 기존 패턴 그대로. 사소한 가독성 권장 1건.
- 보안 & 접근성: 9/10 → 변경분에 보안 표면 없음. 버튼 전부 `aria-label`·`type="button"`. reduced-motion 블록에 조이콘 대응 유지.
- 반응형 & UI 품질: 9/10 → landscape 가용 폭 340px로 조정되어 3×3 패드가 양쪽 80px 폭을 확보. 기존 글래스/pressed 톤 온전.
- 기능 완성도: 10/10 → SPEC 3개 기능 모두 구현. 레퍼런스 카운팅·중복 포인터 가드·clearDpadPressed 카운터 리셋 전부 사양 일치.

**가중 점수**: (9×0.4) + (9×0.25) + (9×0.2) + (10×0.15) = 3.60 + 2.25 + 1.80 + 1.50 = **9.15 / 10.0**

**P0 이슈 0건, P1 이슈 0건** → 점수 하락 트리거 없음.

## 최종 판정: 합격

**후속 권장 사항 (비차단)**:
1. (권장) `clearDpadPressed`의 카운터 리셋을 `Object.keys(dpadPressCount).forEach(...)`로 축약하여 향후 방향 확장 시 누락 방지.
2. (참고) 포인터 캡처 상태에서 `pointerleave`가 발화하지 않는 경계 케이스는 추후 UX 회의에서 별건으로 다루는 것이 좋음 — 이번 SPEC 범위 아님.
