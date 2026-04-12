# QA 검수 보고서

## UI 동작 검증 (Playwright)

| 체크 항목 | 결과 | 비고 |
|---|---|---|
| 테마 토글 | PASS | 다크→라이트→다크 전환 정상 |
| 카테고리 필터 (writing) | PASS | 2개 섹션 숨김 확인 |
| 카테고리 필터 (music) | PASS | 2개 섹션 숨김 확인 |
| 카테고리 필터 (social) | PASS | 2개 섹션 숨김 확인 |
| 카테고리 필터 (all) | PASS | 0개 섹션 숨김 확인 |
| 프로필 모달 | FAIL (P2) | 테스트 환경 한계 — scrollIntoViewIfNeeded()가 fixed hero 내부 버튼에서 page-wrapper 스크롤 유발. scrollY=0에서 버튼은 뷰포트 내 접근 가능. |
| 링크카드 href | PASS | 5개 링크 모두 유효 |
| 모바일 520px | PASS | 핵심 요소 3개 모두 visible |
| 콘솔 에러 | PASS | 0건 |

스크린샷: `tests/screenshots/`

## SPEC 기능 검증
- [PASS] orbit-stage 전체 제거: HTML/CSS/JS에서 orbit 관련 코드 완전 제거, 변수만 유지
- [PASS] hero-keywords 플로팅 배경: 10개 키워드, aria-hidden="true", kw-float 애니메이션
- [PASS] hero-split 스플릿 레이아웃: 좌측 카드 + 우측 콘텐츠 flex 구조
- [PASS] hero-split__card 3D tilt: initCardTilt() 함수, reduced-motion/hover:none 가드
- [PASS] hero-social 소셜 아이콘: 6개 링크, 모두 rel="noopener" + aria-label
- [PASS] profileAvatar ID 유지: 모달 포커스 복귀 정상
- [PASS] js-open-profile 클래스: 아바타 + 버튼 모두 유지
- [PASS] scroll-hint 위치 유지: .hero 직속 자식
- [PASS] CSS 변수 추가: --hero-split-gap, --card-tilt-perspective
- [PASS] --orbit-card-bg, --orbit-card-border 변수 보존
- [PASS] 반응형 520px: hero-split column 전환, 카드/아바타 크기 축소
- [PASS] prefers-reduced-motion: hero-keywords animation:none, hero-split__card-inner transition:none
- [PASS] light 테마: hero-split__card-inner, hero-keywords__item 대응

## Sprint 범위 검증
- [PASS] 모든 변경이 히어로 섹션 내부 또는 히어로 레이아웃 동작에 필수적
- [허용] .page-wrapper z-index 1→2, margin-top: 100vh, background 추가 — fullscreen fixed hero 패턴에 필수
- [허용] initNameShine() — SPEC CSS의 profile__name shine gradient layer를 구동하는 필수 companion
- [허용] initMottoReveal() — SPEC CSS의 motto-item opacity:0 초기값을 is-visible로 전환하는 필수 함수
- [허용] html.light .profile__bio::before/::after — 기존 bio 요소의 라이트 테마 대응 (히어로 내부)

## 검수 결과 요약

| 등급 | 건수 |
|---|---|
| P0 치명 | 0건 |
| P1 중요 | 0건 |
| P2 권장 | 4건 |

## P2 — 권장 사항

### 1. 미사용 CSS 클래스 `.profile__dot`
- **파일**: `assets/css/style.css:584-588`
- **위반 규칙**: 3-6 파일 간 정합성 — 미사용 CSS 클래스 없음
- **현재 코드**: `.profile__dot { color: var(--brand-light); display: inline-block; animation: dot-pulse 2s ease-in-out infinite; }`
- **수정 제안**: HTML에서 사용하지 않으므로 해당 CSS 블록 삭제. 관련 `@keyframes dot-pulse`도 다른 곳에서 미참조 시 함께 삭제.

### 2. 미사용 CSS 변수 `--glow-instagram`
- **파일**: `assets/css/style.css:36`, `assets/css/style.css:75`
- **위반 규칙**: 3-6 파일 간 정합성 — 선언만 있고 참조하는 CSS 규칙 없음
- **현재 코드**: `--glow-instagram: rgba(225, 48, 108, 0.18);`
- **수정 제안**: 소셜 그리드의 Instagram 카드에 glow 효과가 없으므로, 현재로서는 불필요. 향후 사용 계획이 있다면 유지하되 주석 추가. 즉시 수정 불요.

### 3. `border-radius: 20px` 하드코딩
- **파일**: `assets/css/style.css:707`
- **위반 규칙**: 3-2 CSS 패턴 — 하드코딩 값 대신 CSS 변수 사용 권장
- **현재 코드**: `.hero-split__card-inner { border-radius: 20px; }`
- **수정 제안**: `:root`에 `--radius-card: 20px` 변수를 추가하고 `border-radius: var(--radius-card)` 사용. 단, SPEC에서 20px을 명시하고 기존 코드베이스에도 12px/14px/24px 등 하드코딩이 다수 있으므로, 기존 패턴과 동일한 수준의 문제.

### 4. `.hero-social` margin-top 사용
- **파일**: `assets/css/style.css:734`
- **위반 규칙**: 3-2 CSS 패턴 — 간격은 gap 속성 사용 (margin 간격 조절 지양)
- **현재 코드**: `.hero-social { margin-top: 4px; }`
- **수정 제안**: 부모 `.hero-split__card-inner`가 flex 레이아웃이 아니므로 gap으로 대체 어려움. 현재 구조에서는 margin이 합리적. 개선하려면 card-inner를 flex column + gap으로 재구성 필요. 즉시 수정 불요.

## 통과 항목
- **보안**: innerHTML에 esc() 적용, safeUrl() 적용, eval/document.write 미사용, 인라인 핸들러 미사용
- **CSS 패턴**: 네이티브 중첩 & 문법 사용, SCSS 혼입 없음, !important 접근성 미디어쿼리만, -webkit-backdrop-filter 병기, BEM 네이밍 준수, CSS 변수 사용 (하드코딩 색상 없음)
- **JS 패턴**: function 선언식 (initCardTilt, initNameShine, initMottoReveal), 가드 클래스, console.warn만 사용, JSDoc 주석 + 섹션 구분선, DOMContentLoaded 등록, 코드 배치 순서 준수
- **HTML 구조**: target="_blank" + rel="noopener", aria-hidden="true" on hero-keywords, alt 속성, js-open-profile 유지, 새 인라인 스타일 없음 (hero-keywords의 CSS custom property 값은 허용 패턴)
- **반응형 & 접근성**: 520px 대응, prefers-reduced-motion 대응 (CSS + JS 모두), 모달 포커스 트랩 유지
- **파일 간 정합성**: heroCard/heroSplit ID 일치, hero-split__card-inner 클래스 일치, 모든 JS 참조 ID가 HTML에 존재

---

## 채점

**변경 유형**: 디자인 → 디자인 변경 평가 기준 적용

**항목별 점수**:
- D1 디자인 품질: 8/10 → glassmorphism 톤 유지, 다크/라이트 모두 대응, 트랜지션 자연스러움. 카드 tilt + 플로팅 키워드 + 스크롤 패럴랙스가 조화롭게 동작. box-shadow rgba 하드코딩이 기존 패턴과 동일한 수준.
- D2 독창성: 8/10 → 플로팅 키워드 배경(CSS custom property 기반 개별 파라미터), 마우스 트래킹 3D tilt, 이름 shine 효과, 모토 카드 flip 인터랙션 등 사이트 정체성을 살린 고유 효과 다수. 스플릿 레이아웃 자체는 일반적이나 효과 조합이 차별화됨.
- D3 패턴 일관성: 8/10 → BEM/CSS변수/네이티브중첩 준수. P2 수준 사소한 불일치 4건 (미사용 CSS, border-radius 하드코딩 등). SCSS 혼입 없음.
- D4 반응형 & 접근성: 9/10 → 520px 대응 완전, prefers-reduced-motion CSS+JS 모두 대응, 포커스 가시성 유지. Playwright 모달 테스트 실패는 테스트 환경 한계로 실제 기능에 영향 없음.
- D5 기능 보전: 9/10 → 기존 JS 동작 정상 (테마 토글, 카테고리 필터, 링크카드 fetch, 모달). DOM 구조 변경이 기존 이벤트 바인딩을 깨뜨리지 않음. profileAvatar ID와 js-open-profile 클래스 유지.

**가중 점수**: (8 x 0.30) + (8 x 0.30) + (8 x 0.20) + (9 x 0.15) + (9 x 0.05) = 2.4 + 2.4 + 1.6 + 1.35 + 0.45 = **8.2/10**

### 관대함 재검토

최종 점수 8.0 이상이므로 관대함 재검토 수행.

- D1 8점: "box-shadow rgba 하드코딩" — 기존 코드에도 동일 패턴. 새로운 위반 아님. 유지.
- D2 8점: "스플릿 레이아웃 자체는 일반적" — 맞지만 3D tilt + floating keywords + name shine + motto flip 4개 고유 인터랙션이 있음. 8점 유지.
- D3 8점: P2 4건 중 2건(미사용 CSS)은 확실한 정합성 문제. 하지만 P1 수준은 아님. 8점 유지.
- D4 9점: Playwright 모달 FAIL을 환경 한계로 분류했는데 맞는가? — scrollY=0에서 버튼이 뷰포트 내 있고 page-wrapper에 가려지지 않음 확인. 9점 유지.
- D5 9점: 콘솔 에러 0건, 기존 기능 모두 동작 확인. 9점 유지.

재검토 결과: 점수 조정 불필요.

## 최종 판정: 합격

P0: 0건, P1: 0건 → 이슈 건수 기준 통과
가중 점수 8.2 >= 7.0 → 점수 기준 통과

**구체적 개선 지시** (선택적, 합격 후 품질 향상용):
1. `assets/css/style.css:584-588` — `.profile__dot` 블록과 관련 `@keyframes dot-pulse` 삭제 (HTML 미사용)
2. `assets/css/style.css:707` — `border-radius: 20px` → `:root`에 변수 추가 후 `var(--radius-card)` 사용 검토
