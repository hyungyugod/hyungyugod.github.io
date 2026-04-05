# QA 검수 보고서

## UI 동작 검증 (Playwright)

| 체크 항목 | 결과 | 비고 |
|---|---|---|
| 테마 토글 | PASS | 다크→라이트→다크 전환 정상 |
| 카테고리 필터 (4종) | PASS | writing/music/social/all 모두 정상 |
| 프로필 모달 | PASS | 열기/닫기 정상 |
| 링크카드 href | PASS | 5개 링크 모두 유효 |
| 모바일 520px | PASS | 핵심 요소 3개 모두 visible |
| 콘솔 에러 | PASS | 0건 |

스크린샷: `tests/screenshots/`

## SPEC 기능 검증

- [PASS] `.profile` 섹션을 `.page-wrapper` 밖으로 이동, `<section class="hero" id="hero">`로 감싸기
- [PASS] `.theme-toggle` 버튼을 `.hero` 안으로 이동 (position: fixed, z-index: 50)
- [PASS] 스크롤 힌트 요소 `.hero__scroll-hint` 추가 (aria-hidden="true")
- [PASS] `.profile` 내부 HTML 구조 100% 보존
- [PASS] 새 CSS 변수 6개 추가 (:root, 기존 변수 수정 없음)
- [PASS] `.hero` 블록 CSS (100vh, flex center)
- [PASS] `.hero-bg` height 45vh -> 100vh
- [PASS] `.profile` animation 제거, margin-bottom: 0, padding-top: 0
- [PASS] 타이포 스케일업 (name 80px, subtitle 14px/3px, motto/bio max-width 540px)
- [PASS] `@keyframes heroEntrance` + 스태거 입장 애니메이션 (6개 요소)
- [PASS] 스크롤 힌트 스타일 + `@keyframes heroBounce`
- [PASS] `.page-wrapper` padding 80px -> 48px
- [PASS] 반응형 520px 대응
- [PASS] `prefers-reduced-motion` 대응 (hero 스태거 + scroll-hint)
- [PASS] `initHeroParallax()` JS 함수 + DOMContentLoaded 등록

## Sprint 범위 준수

- [PASS] SPEC.md에 "변경 유형: 디자인" 명시됨
- [PASS] SPEC에 없는 독립적 기능 추가 없음
- [PASS] :root 기존 변수 값 변경/삭제 없음 (새 변수 6개 추가만)

## 검수 결과 요약

| 등급 | 건수 |
|---|---|
| P0 치명 | 0건 |
| P1 중요 | 1건 |
| P2 권장 | 2건 |

## P1 -- 중요 이슈

### 1. 모바일 반응형에서 히어로 프로필 이름 크기 충돌
- **파일**: `assets/css/style.css:1105, 1114`
- **위반 규칙**: SPEC 반응형 요구사항 -- `.hero .profile__name`은 모바일에서 `var(--hero-name-size-mobile)` (52px)이어야 함
- **현재 코드**:
  - 1105행: `.hero .profile__name { font-size: var(--hero-name-size-mobile); }` (52px)
  - 1114행: `.profile` 블록 내 `& .profile__name { font-size: 34px; }` -> `.profile .profile__name { font-size: 34px; }`
- **문제**: 두 셀렉터의 specificity가 동일 (0,0,2,0). `.profile .profile__name`이 소스 순서상 뒤에 위치하므로 34px이 적용됨. 히어로 내부의 프로필 이름이 SPEC 의도인 52px이 아닌 34px로 렌더링됨.
- **수정 제안**: 1105행의 셀렉터를 `.hero .profile .profile__name`으로 변경하여 specificity를 높이거나, 1105행을 1114행 뒤로 이동:
  ```css
  /* 1114행 뒤에 배치하여 소스 순서로 우선 적용 */
  .hero .profile__name { font-size: var(--hero-name-size-mobile); }
  ```

## P2 -- 권장 사항

### 1. 미사용 CSS 변수 `--hero-stagger`
- **파일**: `assets/css/style.css:41`
- **위반 규칙**: 미사용 CSS 변수 (파일 간 정합성)
- **현재 코드**: `--hero-stagger: 0.12s;` -- 정의만 존재, 참조 없음
- **문제**: 스태거 딜레이가 `0.12s`, `0.24s`, `0.36s` 등으로 하드코딩됨. `--hero-stagger` 변수가 정의되었지만 한 번도 사용되지 않음.
- **수정 제안**: 변수를 활용하거나 제거. 활용 예시:
  ```css
  .hero .profile__name {
    animation: heroEntrance var(--hero-entrance-duration) var(--ease-out-expo) var(--hero-stagger) both;
  }
  .hero .profile__subtitle {
    animation: heroEntrance var(--hero-entrance-duration) var(--ease-out-expo) calc(var(--hero-stagger) * 2) both;
  }
  ```
  또는 사용하지 않을 경우 `:root`에서 `--hero-stagger` 선언을 제거.

### 2. `initHeroParallax()`에 JSDoc `@returns` 누락
- **파일**: `assets/js/main.js:490-492`
- **위반 규칙**: JS 규칙 7번 -- JSDoc 형식 주석
- **현재 코드**:
  ```js
  /**
   * 스크롤 시 히어로 프로필을 페이드아웃하며 위로 밀어내는 패럴랙스 효과
   */
  ```
- **문제**: 다른 init 함수들(`initModal`, `initCategoryFilter` 등)도 `@returns`가 없으므로 프로젝트 관례상 일관적이긴 하나, JSDoc 완성도 측면에서 기록함.
- **수정 제안**: 프로젝트 전체 관례와 일관되므로 현재 상태 유지 가능. 향후 개선 시 void 반환 명시.

## 통과 항목

- **보안**: innerHTML에 esc() 적용됨, eval/document.write 미사용, 인라인 이벤트 핸들러 미사용
- **CSS 패턴**: CSS 네이티브 중첩 사용, SCSS 문법 없음, !important는 `prefers-reduced-motion` 미디어쿼리 내부만 (허용), BEM 네이밍 준수 (`hero__scroll-hint`, `hero__scroll-arrow`), backdrop-filter에 -webkit- 접두사 동반, 하드코딩 색상 없음 (신규 코드 전체 CSS 변수 사용), gap 속성 사용
- **JS 패턴**: function 선언식 사용 (`initHeroParallax`), 가드 클래스 적용 (`if (!hero) return`, `if (!profile) return`, reduced-motion 체크), console.error 미사용, DOMContentLoaded에 safeInit 등록, 코드 배치 순서 준수 (init 함수가 DOMContentLoaded 뒤에 위치), 섹션 구분선 있음
- **HTML 구조**: target="_blank" + rel="noopener" 준수, 접근성 속성 (모달: role="dialog", aria-modal, aria-label), 모든 img에 alt, JS에서 사용하는 ID가 HTML에 존재 (#hero, .hero__scroll-hint), 새 인라인 스타일 미추가, hero__scroll-hint에 aria-hidden="true"
- **반응형 & 접근성**: @media (max-width: 520px) 대응 (hero, scroll-hint, scroll-arrow), prefers-reduced-motion 대응 (CSS + JS 모두), 모달 포커스 트랩 정상 (Tab 순환 + Escape 닫기 + 포커스 복귀)
- **파일 간 정합성**: HTML 클래스 -> CSS 정의 일치, JS getElementById -> HTML ID 존재, 미사용 JS 함수 없음

---

## 채점

SPEC.md 변경 유형: **디자인** -> 디자인 변경 평가 기준 적용

**항목별 점수**:
- D1. 디자인 품질: **8**/10 -> 100vh 풀스크린 히어로로 기존 글래스모피즘 톤을 유지하면서 스케일 확장. 스태거 입장 + 스크롤 패럴랙스가 자연스러움. 다크/라이트 테마 모두 CSS 변수 기반으로 대응. 모바일에서 P1 크기 충돌로 -1점 적용하여 8점 -> 7점 고려했으나, Playwright 520px 테스트는 통과. 실제 시각적 차이가 있으므로 8점에서 모바일 충돌 감안하여 최종 7점.
- D2. 독창성: **8**/10 -> 스태거 입장 애니메이션 + 스크롤 패럴랙스 페이드아웃 + 바운스 스크롤 힌트 조합이 사이트 정체성(glassmorphism + 코럴핑크)과 잘 어울림. 100vh 풀스크린 랜딩은 흔한 패턴이지만, 기존 프로필 구조를 보존하면서 스케일업한 접근이 적절.
- D3. 패턴 일관성: **8**/10 -> BEM, CSS 변수, 네이티브 중첩 준수. 미사용 변수 `--hero-stagger` P2 1건 있으나 사소한 수준.
- D4. 반응형 & 접근성: **7**/10 -> 520px 대응 완료, prefers-reduced-motion CSS + JS 모두 대응. P1 모바일 font-size 충돌 감안 -2점.
- D5. 기능 보전: **10**/10 -> Playwright 10/10 통과. 기존 기능 (테마 토글, 카테고리 필터, 모달, 링크카드) 모두 정상 동작.

**가중 점수**: (7 x 0.30) + (8 x 0.30) + (8 x 0.20) + (7 x 0.15) + (10 x 0.05)
= 2.1 + 2.4 + 1.6 + 1.05 + 0.5
= **7.65 / 10.0**

**이슈 건수 기준**: P0 0건, P1 1건 -> 이슈 건수 기준 통과

## 최종 판정: 합격

가중 점수 7.65 >= 7.0, P0 0건, P1 1건 < 3건 -> 합격 기준 충족.

**구체적 개선 지시** (합격이지만 반영 권장):
1. `style.css:1105` -- 모바일 반응형에서 `.hero .profile__name { font-size: var(--hero-name-size-mobile); }` 규칙이 이후 `.profile .profile__name { font-size: 34px; }` (1114행)에 의해 덮어씌워짐. 1105행의 선언을 1114행 뒤로 이동하거나, 셀렉터 specificity를 `.hero .profile .profile__name`으로 높여야 함.
2. `style.css:41` -- `--hero-stagger: 0.12s` 변수가 미사용. calc()로 활용하거나 제거.
