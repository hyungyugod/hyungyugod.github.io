# QA 검수 보고서

## SPEC 기능 검증

- [PASS] 기능 1 (타이핑 CSS): `.typing`에 `display: inline-block; min-width: 1ch` 확인 (style.css:379-380)
- [PASS] 기능 2A (모달 스프링 오픈): `.modal-box` transform `scale(0.92) translateY(24px)`, timing `var(--spring-bounce)`, duration `0.5s` 확인 (style.css:1050-1054)
- [PASS] 기능 2B (모달 시차 진입): `.modal-photo-wrap`, `.modal-name`, `.modal-eng`, `.modal-divider`, `.modal-info li`에 순차 transition-delay 확인 (style.css:1170-1227)
- [PASS] 기능 2C (백드롭 강화): `.modal-overlay` blur 12px, `::after` radial-gradient 브랜드 글로우 확인 (style.css:1027-1036)
- [PASS] 기능 2D (닫기 애니메이션): CSS `is-closing` 정의 확인 (style.css:1230-1242), JS close 함수에 `is-closing` + `transitionend` + 500ms fallback 확인 (main.js:387-411)
- [PASS] 기능 3 (배경 그라디언트 애니메이션): `.hero-bg`에 `background-size: 400% 400%` + `animation: gradient-shift 15s ease infinite` 확인 (style.css:226-227), 라이트 테마에도 동일 적용 (style.css:143-144)
- [PASS] 기능 4 (프로필 아바타 부유): `.profile__avatar-wrap`에 `animation: float-gentle 6s ease-in-out infinite` 확인 (style.css:266)
- [PASS] 기능 5 (카드 그라디언트 보더): `@property --angle`, `rotate-angle` keyframe, `.link-card::before` conic-gradient, 호버 시 opacity:1, 내부 요소에 z-index:1 확인 (style.css:433-437, 439-441, 648-660)
- [PASS] 기능 6 (플랫폼별 글로우): `:has()` 셀렉터로 5개 플랫폼 box-shadow 확인 (style.css:663-667)
- [PASS] 기능 7 (섹션 라벨 와이프 리빌): `clip-path: inset(0 100% 0 0)` 기본, `.is-visible`에서 `inset(0 0 0 0)` 확인 (style.css:504-510)
- [PASS] 기능 8 (카드 진입 다양화): odd/even 미세 회전, 호버 시 rotate(0deg) 복귀, 시차 딜레이 확인 (style.css:557-558, 563, 576-578)
- [PASS] 기능 9 (마그네틱 버튼): CSS `transform 0.25s var(--spring-bounce)` 확인 (style.css:404, 464), JS `initMagneticButtons()` 구현 + DOMContentLoaded 등록 확인 (main.js:494-511, 181)
- [PASS] 기능 10 (푸터 아이콘 호버 강화): `scale(1.15) translateY(-3px)` + `drop-shadow` + filter transition 확인 (style.css:926-929, 924)

## 검수 결과 요약

| 등급 | 건수 |
|---|---|
| P0 치명 | 0건 |
| P1 중요 | 2건 |
| P2 권장 | 4건 |

## P1 -- 중요 이슈

### 1. safeInit이 화살표 함수로 선언됨
- **파일**: `assets/js/main.js:166`
- **위반 규칙**: JS 규칙 4 -- 유틸/헬퍼 함수는 `function` 선언식 사용
- **현재 코드**: `const safeInit = (fn, name) => { ... };`
- **수정 제안**: `function safeInit(fn, name) { ... }` 로 변경. 유틸리티 함수이므로 function 선언식을 사용해야 한다.

### 2. 라이트 테마 하드코딩 색상 -- featured-item 배경
- **파일**: `assets/css/style.css:207`
- **위반 규칙**: CSS 규칙 2 -- 모든 색상은 `:root` 변수 사용, 하드코딩 금지
- **현재 코드**: `html.light .featured-item { background: #f0eff4; }`
- **수정 제안**: `:root` 또는 `html.light` 블록에 `--bg-featured: #f0eff4;` 변수를 추가하고, `background: var(--bg-featured);`로 참조. 다크 테마에서는 `--bg-featured: var(--bg-dark);` 등으로 정의.

## P2 -- 권장 사항

### 1. 라이트 테마 하드코딩 색상 -- 아이콘 오버라이드
- **파일**: `assets/css/style.css:166-173`
- **위반 규칙**: CSS 규칙 2 -- 색상 하드코딩 지양
- **현재 코드**: 
  ```css
  html.light .icon--brunch { background: #f0f0f0; color: #333; }
  html.light .icon--github { background: #222; color: #fff; }
  ```
- **수정 제안**: 플랫폼 아이콘 색상은 예외로 인정되나, 라이트 테마 전용 오버라이드 색상(`#f0f0f0`, `#333`, `#222`)은 CSS 변수화를 권장. 예: `--icon-brunch-bg-light: #f0f0f0;` 등.

### 2. 테마 토글 아이콘 색상 하드코딩
- **파일**: `assets/css/style.css:116`
- **위반 규칙**: CSS 규칙 2 -- 색상 하드코딩 지양
- **현재 코드**: `color: #f0c040;`
- **수정 제안**: `:root`에 `--icon-sun: #f0c040;` 변수를 추가하고 참조. 단, UI 아이콘 색상으로서 경미한 위반.

### 3. element.style 과다 사용
- **파일**: `assets/js/main.js:315-317, 504, 535-536, 471-482`
- **위반 규칙**: JS 규칙 10 -- 시각적 변경은 CSS 클래스로 처리, element.style은 최소한만
- **현재 상태**: 카테고리 필터 전환 시 `sec.style.opacity/transform/transition` 직접 조작(315-317), 마그네틱 버튼 `btn.style.transform`(504), 카드 틸트 `card.style.transform`(535), 패럴랙스 `heroBg.style.transform`(482). 마그네틱/틸트/패럴랙스는 마우스 좌표에 동적 반응하는 것이므로 element.style 사용이 불가피하나, 카테고리 필터 전환(315-324)은 CSS 클래스(`is-fading` 등)로 대체 가능.
- **수정 제안**: `initCategoryFilter()`의 fade-out 효과를 `is-fading` CSS 클래스로 처리. JS에서 `sec.classList.add('is-fading')` → setTimeout 후 `sec.classList.remove('is-fading')` 패턴으로 변경.

### 4. margin 간격 조절 다수 사용
- **파일**: `assets/css/style.css` 다수 라인 (258, 265, 313, 325, 394, 448, 499-500, 832, 904, 911, 919 등)
- **위반 규칙**: CSS 규칙 4 -- 간격은 `gap` 속성 사용, margin 간격 조절 지양
- **현재 상태**: 기존 코드에서부터 margin-bottom/margin-top이 광범위하게 사용됨. 이번 변경에서 새로 추가된 margin은 없으므로 기존 코드 이슈로 분류.
- **수정 제안**: 향후 리팩터링 시 인접 요소 간 간격을 부모 flex/grid의 `gap`으로 전환 검토. 현재 변경 범위에서는 신규 위반 없음.

## 통과 항목

- **보안**: `esc()` 적용 완벽 (innerHTML 삽입 시 모두 사용), `safeUrl()` 적용 완벽, `eval()/document.write()` 미사용, 인라인 이벤트 핸들러 미사용
- **CSS 네이티브 중첩**: 모든 중첩에 `&` 문법 사용, SCSS 문법 혼입 없음
- **!important**: 접근성 미디어쿼리 내부에서만 사용 (style.css:1248-1250) -- 규칙 준수
- **-webkit-backdrop-filter**: 모든 backdrop-filter에 -webkit- 접두사 함께 작성 확인
- **BEM 네이밍**: 모든 클래스명 BEM 패턴 준수, 상태 클래스 `is-` 접두사 준수 (`is-open`, `is-closing`, `is-active`, `is-hidden`, `is-visible`)
- **가드 클래스**: 모든 init 함수에 `if (!el) return;` 패턴 적용, `initMagneticButtons`에 hover/reduced-motion 가드 적용
- **JSDoc 주석 + 섹션 구분선**: 모든 함수에 JSDoc 작성, 섹션 구분선 일관 적용
- **DOMContentLoaded 등록**: `initMagneticButtons` 포함 모든 init 함수 등록 확인
- **코드 배치 순서**: 유틸 -> fetch -> DOMContentLoaded -> init 순서 준수
- **HTML 구조**: `target="_blank"` + `rel="noopener"` 모든 외부 링크에 적용, 모달 접근성 속성(`role="dialog"`, `aria-modal`, `aria-label`) 존재, 모든 img에 alt 속성 존재, 인라인 스타일 미추가
- **반응형**: `@media (max-width: 520px)` 대응 확인 (style.css:941-987)
- **접근성**: `prefers-reduced-motion` 대응 확인 (style.css:1246-1258, JS 내 matchMedia 가드 다수), 모달 포커스 트랩 + Escape 닫기 + 포커스 복귀 구현 완료
- **파일 간 정합성**: HTML 클래스와 CSS 정의 일치, JS getElementById와 HTML ID 일치, `is-closing` 클래스 JS-CSS 간 정합 확인
- **console.error 미사용**: `console.warn`만 사용 확인
- **fetchWithTimeout + try/catch/finally**: 모든 fetch 함수에 적용 확인

---

## 채점

**항목별 점수**:
- 패턴 일관성: 8/10 -> safeInit 선언 방식 위반(P1), element.style 과다 사용(P2), 하드코딩 색상 일부 존재(P1+P2). 나머지 BEM, 중첩, 코드 구조, JSDoc 등 모두 우수.
- 보안 & 접근성: 10/10 -> esc()/safeUrl() 완벽 적용, 접근성 속성 완비, 포커스 트랩 구현, reduced-motion 대응 충실.
- 반응형 & UI 품질: 9/10 -> 520px 반응형 대응, 호버 효과 일관, 트랜지션 자연스러움, -webkit- 접두사 완비. 새 기능(글래스모피즘, 그라디언트 보더 등) 품질 높음.
- 기능 완성도: 10/10 -> SPEC.md 10개 기능 모두 구현, 에러 처리 포함, DOMContentLoaded 등록 완료.

**가중 점수**: (8 x 0.4) + (10 x 0.25) + (9 x 0.2) + (10 x 0.15) = 3.2 + 2.5 + 1.8 + 1.5 = **9.0 / 10.0**

## 최종 판정: 합격

P0 이슈 0건, P1 이슈 2건 (3건 미만), 가중 점수 9.0 (7.0 이상). 두 기준 모두 합격 조건 충족.

**구체적 개선 지시** (다음 반복 불필요, 향후 개선 권장):
1. `assets/js/main.js:166` -- `safeInit`을 `function safeInit(fn, name) { ... }` 선언식으로 변경
2. `assets/css/style.css:207` -- `html.light .featured-item`의 `#f0eff4`를 CSS 변수로 추출
3. `assets/js/main.js:314-324` -- 카테고리 필터 전환 fade-out을 CSS 클래스 기반으로 리팩터링
