# QA 검수 보고서

## SPEC 기능 검증

### 원본 SPEC (대대적 비주얼 개선 10개)
- [PASS] 기능 1 (타이핑 CSS 수정): `.typing`에 `display: inline-block; min-width: 1ch` 추가됨 (style.css:382-384)
- [PASS] 기능 2 (모달 리뉴얼): 스프링 오픈(spring-bounce), 시차 진입, 백드롭 강화, 닫기 애니메이션 모두 구현됨 (style.css:1078-1319, main.js:387-411)
- [PASS] 기능 3 (배경 그라디언트 애니메이션): `gradient-shift` keyframes + `background-size: 400% 400%` 적용 (style.css:229-231, 425-430)
- [PASS] 기능 4 (아바타 부유 애니메이션): `float-gentle` keyframes + `.profile__avatar-wrap` 적용 (style.css:270, 432-435)
- [PASS] 기능 5 (카드 그라디언트 보더): `@property --angle`, `rotate-angle`, `.link-card::before` conic-gradient 구현 (style.css:437-445, 676-688)
- [PASS] 기능 6 (플랫폼별 글로우): `:has()` 셀렉터로 5개 플랫폼 box-shadow 적용 (style.css:691-695)
- [PASS] 기능 7 (섹션 라벨 와이프 리빌): `clip-path: inset(0 100% 0 0)` → `inset(0 0 0 0)` 전환 (style.css:514-521)
- [PASS] 기능 8 (카드 진입 다양화): odd/even 미세 회전 + 호버 시 복귀 + 시차 딜레이 0/0.12/0.24s (style.css:567-568, 571, 603-605)
- [PASS] 기능 9 (마그네틱 버튼): CSS transition에 spring-bounce 추가 + JS `initMagneticButtons()` 구현 (style.css:408, 474, main.js:494-511)
- [PASS] 기능 10 (푸터 아이콘 호버 강화): `scale(1.15) translateY(-3px)` + `drop-shadow` + filter transition 추가 (style.css:993-998)

### SELF_CHECK 추가 변경사항 (카드 인터랙션 강화)
- [PASS] glass-sweep `::after` 의사요소 + 호버 애니메이션 (style.css:587-601)
- [PASS] CSS counter 번호 뱃지 (style.css:700-701, 718-738)
- [PASS] 디바이더 호버 그라디언트 (style.css:583-585)
- [PASS] featured-item 호버 강화 (style.css:745-753)
- [PASS] 시차 트랜지션 웨이브 (style.css:755-757)
- [PASS] 모바일 반응형 업데이트 (style.css:1027-1037)

## 검수 결과 요약

| 등급 | 건수 |
|---|---|
| P0 치명 | 0건 |
| P1 중요 | 2건 |
| P2 권장 | 4건 |

## P0 -- 치명적 이슈

없음.

## P1 -- 중요 이슈

### 1. 하드코딩 색상: 테마 토글 아이콘 및 라이트 테마 컴포넌트
- **파일**: `style.css:116`
- **위반 규칙**: CSS 규칙 2조 "모든 색상은 `:root` 변수를 사용한다. 하드코딩 금지"
- **현재 코드**: `color: #f0c040;` (태양 아이콘 색상)
- **분석**: 태양 아이콘 색상 `#f0c040`은 플랫폼 아이콘에 해당하지 않는 UI 요소 색상이므로 예외에 포함되지 않는다. 이 색상은 이전 커밋부터 존재하던 문제이나 규칙 위반임에는 변함없다.
- **수정 제안**: `:root`에 `--icon-sun: #f0c040;` 변수를 추가하고, `color: var(--icon-sun);`으로 변경

### 2. 하드코딩 색상: 라이트 테마 featured-item 배경
- **파일**: `style.css:207`
- **위반 규칙**: CSS 규칙 2조 "하드코딩 금지"
- **현재 코드**: `html.light .featured-item { background: #f0eff4; }`
- **분석**: 라이트 테마 전용 배경색이 변수 없이 하드코딩되어 있다. 새로 추가된 코드는 아니지만, 이번 변경에서 `.featured-item` 관련 코드를 대폭 수정하면서 함께 정리해야 했다.
- **수정 제안**: `html.light` 블록에 `--bg-featured: #f0eff4;`를 추가하고 `background: var(--bg-featured);`으로 변경. 다크 테마 `:root`에도 `--bg-featured: var(--bg-dark);` 추가.

## P2 -- 권장 사항

### 1. `safeInit`이 화살표 함수로 선언됨
- **파일**: `main.js:166`
- **위반 규칙**: JS 규칙 4조 "유틸/헬퍼/init은 function 선언식"
- **현재 코드**: `const safeInit = (fn, name) => { ... };`
- **분석**: `safeInit`은 DOMContentLoaded 블록 바깥에서 정의된 유틸리티 헬퍼 함수이므로 `function` 선언식이어야 한다. 화살표 함수는 콜백/클로저에 사용.
- **수정 제안**: `function safeInit(fn, name) { try { fn(); } catch (e) { console.warn(\`[\${name}] init failed:\`, e); } }`

### 2. `element.style` 직접 조작이 다수 존재
- **파일**: `main.js:315-317` (카테고리 필터 페이드), `main.js:471,482` (패럴랙스), `main.js:504` (마그네틱)
- **위반 규칙**: JS 규칙 10조 "시각적 변경은 CSS 클래스로 처리. element.style은 overflow 제어 등 최소한만"
- **분석**: 카테고리 필터의 페이드 전환(opacity, transform, transition)은 CSS 클래스로 처리할 수 있다. 패럴랙스와 마그네틱은 마우스 좌표 기반이므로 `element.style` 사용이 합리적이나, 카테고리 필터의 `sec.style.opacity/transform/transition` 설정은 `is-fading` 같은 CSS 클래스로 대체 가능하다.
- **수정 제안**: `.category-section.is-fading { opacity: 0; transform: translateY(-10px); transition: opacity 0.18s ease, transform 0.18s ease; }` CSS 클래스를 추가하고, JS에서 `sec.classList.add('is-fading')` / `sec.classList.remove('is-fading')`으로 변경. 패럴랙스/마그네틱/틸트의 동적 좌표 기반 `element.style`은 허용.

### 3. 코드 배치 순서 미세 위반: `safeInit`의 위치
- **파일**: `main.js:166`
- **위반 규칙**: JS 규칙 9조 코드 배치 순서 "유틸리티 함수 → Auto-fetch → DOMContentLoaded → init"
- **분석**: `safeInit`은 유틸리티 성격이나 DOMContentLoaded 블록 바로 위에 위치한다. 엄밀히는 `showFetchError` 아래 유틸리티 섹션(줄 1-49 부근)에 배치되어야 한다.
- **수정 제안**: `safeInit` 함수를 `showFetchError` 함수 아래(줄 49 이후), "초기화" 섹션 구분선 전으로 이동

### 4. `section-label` margin 사용
- **파일**: `style.css:509-510`
- **위반 규칙**: CSS 규칙 4조 "간격: gap 속성만 사용 (margin 간격 조절 지양)"
- **현재 코드**: `margin-top: 8px; margin-bottom: 8px;`
- **분석**: `.section-label`은 flex/grid 컨테이너의 자식이 아닌 독립 블록이므로 margin 사용이 불가피한 측면이 있으나, 상위 컨테이너(`.category-section`)에 flex + gap을 적용하여 대체할 수 있다.
- **수정 제안**: `.category-section`에 `display: flex; flex-direction: column; gap: 8px;`을 적용하고, `.section-label`에서 margin-top/bottom 제거

## 통과 항목

- **보안**: `esc()`, `safeUrl()` 외부 데이터에 모두 적용됨. `eval()`, `document.write()` 미사용. 인라인 이벤트 핸들러 없음.
- **CSS 네이티브 중첩**: 모든 중첩에 `&` 문법 사용. SCSS 문법 없음.
- **!important**: `prefers-reduced-motion` 미디어쿼리 내부에서만 사용 (허용 예외).
- **BEM 네이밍**: 신규 클래스 모두 BEM 패턴 + `is-` 상태 클래스 준수.
- **-webkit-backdrop-filter**: 모든 `backdrop-filter` 사용처에 `-webkit-` 접두사 동반 (6쌍 확인).
- **가드 클래스**: 모든 init/fetch 함수에 `if (!el) return;` 패턴 적용.
- **`console.warn` 사용**: `console.error` 미사용 확인.
- **`fetchWithTimeout()` + try/catch/finally**: fetchGitHub, fetchVelog 모두 적용.
- **JSDoc + 섹션 구분선**: 모든 함수에 JSDoc 주석 + 구분선 존재.
- **DOMContentLoaded 등록**: `initMagneticButtons` 포함 모든 init 함수 등록됨.
- **target="_blank" + rel="noopener"**: 모든 외부 링크에 적용 (HTML 검증 완료).
- **모달 접근성**: `role="dialog"`, `aria-modal="true"`, `aria-label`, 포커스 트랩, Escape 닫기, 포커스 복귀 모두 구현.
- **img alt 속성**: 모든 `<img>` 태그에 `alt` 존재.
- **반응형 520px**: 신규 `.featured-item__label`, `::before` 카운터 뱃지 모바일 대응 추가됨.
- **prefers-reduced-motion**: 전역 `*, *::before, *::after` 비활성화 + 개별 요소 `animation: none` / `display: none` 적용. JS에서도 `matchMedia` 체크.
- **파일 간 정합성**: HTML 클래스 → CSS 정의 일치, JS getElementById → HTML ID 존재 확인.

---

## 채점

**항목별 점수**:
- 패턴 일관성: 7/10 → 하드코딩 색상 2건(P1), safeInit 선언 방식/배치 위반(P2), margin 사용(P2)
- 보안 & 접근성: 9/10 → 보안 취약점 없음, 접근성 전반적으로 우수, 모달 포커스 트랩 완비
- 반응형 & UI 품질: 9/10 → 520px 브레이크포인트 대응, reduced-motion 대응, 호버 효과 일관
- 기능 완성도: 10/10 → SPEC 10개 기능 + SELF_CHECK 추가 6개 변경사항 모두 구현 완료

**가중 점수**: (7 x 0.4) + (9 x 0.25) + (9 x 0.2) + (10 x 0.15) = 2.8 + 2.25 + 1.8 + 1.5 = **8.35/10**

## 최종 판정: 합격

P0: 0건, P1: 2건 (3건 미만), 가중 점수: 8.35 (7.0 이상) -- 합격 기준 충족.

**구체적 개선 지시** (합격이나 코드 품질 향상을 위해 권장):
1. `style.css:116` — `#f0c040`을 `:root`에 `--icon-sun` 변수로 등록하고 참조로 변경
2. `style.css:207` — `#f0eff4`를 `html.light` 블록에 `--bg-featured` 변수로 등록하고 참조로 변경
3. `main.js:166` — `const safeInit = (fn, name) => {...}`를 `function safeInit(fn, name) {...}` 선언식으로 변경하고, 유틸리티 섹션(줄 49 이후)으로 이동
4. `main.js:315-317` — 카테고리 필터 페이드 전환을 CSS 클래스 `.is-fading`으로 대체
5. `style.css:509-510` — `.section-label`의 margin을 부모 컨테이너의 gap으로 대체 검토
