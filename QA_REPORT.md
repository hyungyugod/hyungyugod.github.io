# QA 검수 보고서

## UI 동작 검증 (Playwright)

| 체크 항목 | 결과 | 비고 |
|---|---|---|
| 테마 토글 | PASS | 다크→라이트→다크 전환 정상 |
| 카테고리 필터 (writing) | PASS | 2개 섹션 숨김 확인 |
| 카테고리 필터 (music) | PASS | 2개 섹션 숨김 확인 |
| 카테고리 필터 (social) | PASS | 2개 섹션 숨김 확인 |
| 카테고리 필터 (all) | PASS | 0개 섹션 숨김 확인 |
| 프로필 모달 | PASS | 열기/닫기 정상 |
| 링크카드 href | PASS | 5개 링크 모두 유효 |
| 모바일 520px | PASS | 핵심 요소 3개 모두 visible |
| 콘솔 에러 | PASS | 0건 |

스크린샷: `tests/screenshots/`

## SPEC 기능 검증

### A. :root 변수 값 변경
- [PASS] --brand, --brand-light, --brand-04~60 모두 SPEC 값과 일치
- [PASS] --radius: 10px, --radius-sm: 6px
- [PASS] --transition: 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94)
- [PASS] --brand-btn-text: rgba(212,164,156,0.85)
- [PASS] --glow-* 5개 변수 뮤트화 완료
- [PASS] --font-serif 신규 변수 추가

### B. html.light 변수 값 변경
- [PASS] --brand: #b07068, --brand-light: #c48a82
- [PASS] --brand-04~60 rgba(176,112,104,*) 변환 완료
- [PASS] --glow-* 5개 변수 뮤트화 완료

### C. 세리프 폰트 적용
- [PASS] .profile__name: font-family: var(--font-serif), font-weight: 700
- [PASS] .profile__bio-quote strong: font-family: var(--font-serif)
- [PASS] .modal-name: font-family: var(--font-serif), font-weight: 700
- [PASS] .section-label: font-family: var(--font-serif), letter-spacing: 1.5px

### D. 여백 확대
- [PASS] .profile margin-bottom: 100px
- [PASS] .links--section margin-bottom: 56px
- [PASS] .category-nav margin-bottom: 64px
- [PASS] .social-grid margin-bottom: 48px
- [PASS] .profile__bio padding: 32px 36px
- [PASS] .link-card__header padding: 20px 24px
- [PASS] .link-card__items padding: 16px 24px 20px

### E. 모션 제거/절제
- [PASS] float-gentle 애니메이션 삭제
- [PASS] spin-ring 애니메이션 avatar-wrap에서 제거, opacity 0.35
- [PASS] link-card::before background: transparent, rotate-angle 삭제
- [PASS] link-card:hover::before opacity:1 삭제
- [PASS] link-card:hover::after glass-sweep 삭제
- [PASS] 카드 hover shadow 0 6px 24px, icon scale 1.04, arrow 3px
- [PASS] odd/even 카드 회전 제거
- [PASS] @keyframes float-gentle, glass-sweep, rotate-angle, @property --angle 삭제

### F. 라이트 테마 연동
- [PASS] html.light .link-card::after 블록 삭제
- [PASS] html.light .link-card:hover box-shadow: 0 4px 20px rgba(0,0,0,0.08)
- [PASS] html.light .social-card:hover box-shadow: 0 6px 24px rgba(0,0,0,0.08)

### G. 반응형 (520px)
- [PASS] .profile margin-bottom: 72px
- [PASS] .link-card__header padding: 16px 18px
- [PASS] .link-card__items padding: 12px 18px 16px
- [PASS] .profile__bio padding: 24px 24px

### index.html
- [PASS] Cormorant Garamond 폰트 링크 추가

### JS
- [PASS] initCardTilt 함수 전체 삭제
- [PASS] initMagneticButtons 함수 전체 삭제
- [PASS] DOMContentLoaded에서 두 safeInit 호출 제거

---

## 검수 결과 요약

| 등급 | 건수 |
|---|---|
| P0 치명 | 0건 |
| P1 중요 | 1건 |
| P2 권장 | 3건 |

## P1 -- 중요 이슈

### 1. Sprint 범위 위반: SPEC에 없는 `.profile__motto` 컴포넌트 추가
- **파일**: `index.html:55-71`, `assets/css/style.css:329-381`, `assets/css/style.css:1046-1050` (반응형), `assets/css/style.css:1371-1374` (reduced-motion)
- **위반 규칙**: Sprint 범위 계약 - "금지: SPEC에 없는 새 컴포넌트, 새 인터랙션, 새 섹션, 레이아웃 구조 변경"
- **현재 상태**: SPEC은 "HTML 구조 변경 없음: DOM 구조, 클래스명, ID, data 속성은 일체 변경하지 않는다"고 명시하나, `.profile__motto` 3열 카드 섹션이 신규 추가됨 (HTML 17줄 + CSS ~55줄). `.profile__subtitle`의 `margin-bottom`도 28px에서 20px으로 SPEC에 없는 변경이 발생.
- **판단**: "이 변경이 없으면 SPEC 기능이 제대로 동작하지 않는가?" -- NO. Quiet Luxury 디자인 리뉴얼은 motto 없이도 완전히 동작한다. 이것은 독립적 신규 기능이다.
- **수정 제안**: SPEC 범위 외 변경이므로, 별도 Sprint로 분리해야 한다. 현재 구현에서 제거하거나, SPEC을 수정하여 포함시킨 후 재평가해야 한다.

## P2 -- 권장 사항

### 1. 미사용 `@keyframes spin-ring` 잔존
- **파일**: `assets/css/style.css:471-474`
- **위반 규칙**: 미사용 CSS 코드 정리
- **현재 코드**: `@keyframes spin-ring { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`
- **수정 제안**: `animation: spin-ring`이 어디에서도 사용되지 않으므로 삭제. SPEC E7에서도 삭제를 권장하고 있음.

### 2. `.link-card::before` 사실상 비활성 코드
- **파일**: `assets/css/style.css:705-714`
- **위반 규칙**: 불필요한 코드 정리
- **현재 코드**: `background: transparent; opacity: 0;` -- 투명 배경 + 불투명도 0으로, 시각적 효과 없이 DOM 요소만 존재. `&:hover::before { opacity: 1; }` 도 삭제되어 hover 시에도 투명한 채로 유지됨.
- **수정 제안**: `::before` 의사요소 블록 전체를 삭제하거나, 향후 사용 계획이 없다면 제거.

### 3. `.profile__subtitle` margin-bottom 값 무단 변경
- **파일**: `assets/css/style.css:325`
- **위반 규칙**: SPEC에 명시되지 않은 여백 변경
- **현재 코드**: `margin-bottom: 20px` (기존 28px)
- **수정 제안**: motto 섹션 추가에 따른 연동 변경이나, motto 자체가 범위 외이므로 함께 원복 필요. 만약 motto를 유지한다면 SPEC에 명시 필요.

---

## 통과 항목

- **보안**: innerHTML 사용 시 `esc()` 적용 확인, `safeUrl()` 적용 확인, `eval()`/`document.write()` 미사용, 인라인 이벤트 핸들러 없음
- **CSS 패턴**: CSS 네이티브 중첩 `&` 문법 준수, SCSS 문법 없음, 하드코딩 색상은 플랫폼 아이콘/`:root`/`html.light` 정의뿐 (기존 코드 유지), `!important`는 `prefers-reduced-motion` 내부만 사용, `-webkit-backdrop-filter` 모든 곳에 작성, BEM 네이밍 준수
- **JS 패턴**: function 선언식/화살표 함수 구분 준수, 가드 클래스 적용, `console.error` 미사용 (`console.warn`만), `fetchWithTimeout()` + `try/catch/finally`, JSDoc 주석 + 섹션 구분선, DOMContentLoaded init 등록, 코드 배치 순서 준수
- **HTML 구조**: `target="_blank"` + `rel="noopener"` 준수, 모달 `role="dialog"` + `aria-modal` + `aria-label` 존재, 모든 `<img>`에 `alt` 존재, JS에서 사용하는 ID 모두 HTML에 존재
- **반응형 & 접근성**: `@media (max-width: 520px)` 대응 완료, `prefers-reduced-motion` 대응 완료, 모달 포커스 트랩 (Tab 순환 + Escape 닫기 + 포커스 복귀) 정상 동작, 키보드 접근 가능
- **기능 보전**: Playwright 10/10 전항목 PASS, 테마 토글/카테고리 필터/모달/링크카드 모두 정상 동작

---

## 채점

SPEC 변경 유형: **디자인** -- 디자인 변경 평가 기준 적용.

**항목별 점수**:
- D1 디자인 품질: 8/10 -- 뮤트 로즈 + 세리프 폰트 전환이 자연스럽고, 다크/라이트 테마 모두 대응. 여백 확대와 모션 절제로 "에디토리얼 럭셔리" 의도에 부합. 다만 social-card 다크모드 hover shadow(0 10px 40px)가 link-card(0 6px 24px)와 불균형하여 "절제" 톤에 약간 불일치.
- D2 독창성: 6/10 -- SPEC 자체가 변수 값 교체 + 모션 제거 위주의 "리스킨" 작업이므로 독창적 시각 표현의 여지가 제한적. 세리프 폰트 도입과 여백 확대로 매거진 톤을 만든 것은 의미 있으나, 새로운 인터랙션이나 고유 시각 효과는 없음. motto 컴포넌트가 유일한 새 시각 요소이나 범위 외.
- D3 패턴 일관성: 8/10 -- BEM 준수, CSS 변수 사용, 네이티브 중첩 준수. 미사용 keyframe(spin-ring)과 비활성 ::before 코드가 잔존하여 P2 2건 감점.
- D4 반응형 & 접근성: 9/10 -- 520px 브레이크포인트 대응 완료, prefers-reduced-motion 대응 완료 (motto에도 추가), 포커스 가시성 유지. Playwright 모바일 테스트 PASS.
- D5 기능 보전: 7/10 -- 기존 기능 모두 정상 동작 (Playwright 10/10 PASS). Sprint 범위 위반(motto 추가)으로 -2점. SPEC에 명시된 기능 자체는 손상 없음.

**가중 점수** = (8 x 0.30) + (6 x 0.30) + (8 x 0.20) + (9 x 0.15) + (7 x 0.05)
= 2.4 + 1.8 + 1.6 + 1.35 + 0.35
= **7.5 / 10.0**

**이슈 건수 확인**:
- P0: 0건 -- 강제 불합격 조건 해당 없음
- P1: 1건 -- 3건 미만이므로 강제 하락 없음

## 최종 판정: 합격

가중 점수 7.5 >= 7.0, P0 0건, P1 1건 < 3건 -- 합격 조건 충족.

**구체적 개선 지시**:
1. **[P1] `.profile__motto` 컴포넌트를 제거하거나 별도 SPEC으로 분리할 것** -- `index.html:55-71`의 motto HTML, `style.css:329-381`의 motto CSS, `style.css:1046-1050`의 반응형, `style.css:1371-1374`의 reduced-motion, `style.css:325`의 subtitle margin-bottom 원복(28px). 만약 사용자가 motto를 원한다면 SPEC에 명시 후 다음 Sprint에서 구현.
2. **[P2] `@keyframes spin-ring` 삭제** -- `style.css:471-474` 제거. 어디에서도 참조되지 않는 죽은 코드.
3. **[P2] `.link-card::before` 비활성 코드 정리** -- `style.css:705-714` 블록 삭제. `background: transparent; opacity: 0`으로 렌더링 효과 없음.
4. **[P2] `.profile__subtitle` margin-bottom 원복** -- motto 제거 시 28px로 원복 필요.
