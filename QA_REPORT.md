# QA 검수 보고서 (2회차)

## 1회차 피드백 반영 확인

| 1회차 지적 | 반영 상태 | 확인 |
|---|---|---|
| P1: desktop-nav HTML/CSS/JS 범위 위반 | index.html, main.js, style.css에서 모두 제거됨 | PASS |
| P1: music-showcase HTML/CSS/JS 범위 위반 | index.html, main.js, style.css에서 모두 제거됨 | PASS |
| P1: 과도한 데스크탑 레이아웃 (page-wrapper, social-grid 등) | SPEC 명시 변경만 남기고 나머지 제거됨 | PASS |
| P2: 하드코딩 rgba(platform 색상) | `--platform-velog-30`, `--platform-brunch-30`, `--platform-github-30` CSS 변수로 교체됨 | PASS |
| P2: initThemeToggle 내 .js-theme-toggle-desktop 셀렉터 | 단일 `.js-theme-toggle` querySelector로 복원됨 | PASS |

## UI 동작 검증 (Playwright)

| 체크 항목 | 결과 | 비고 |
|---|---|---|
| 테마 토글 | PASS | 다크/라이트/다크 전환 정상 |
| 카테고리 필터 (writing) | PASS | 2개 섹션 숨김 |
| 카테고리 필터 (music) | PASS | 2개 섹션 숨김 |
| 카테고리 필터 (social) | PASS | 2개 섹션 숨김 |
| 카테고리 필터 (all) | PASS | 0개 섹션 숨김 |
| 프로필 모달 | PASS | 열기/닫기 정상 |
| 링크카드 href | PASS | 2개 링크 유효 |
| 모바일 520px | PASS | 핵심 요소 3개 visible |
| 콘솔 에러 | PASS | 0건 |

결과: **10/10 통과**

스크린샷: `tests/screenshots/`

## SPEC 기능 검증

- [PASS] 섹션 간격 축소 (모바일): `.links--section` margin-bottom: 24px, `.social-grid` margin-bottom: 24px, `.section-label` margin-top: 0, margin-bottom: 6px
- [PASS] 섹션 간격 축소 (데스크탑 900px+): `.category-section` min-height: auto, padding 48px
- [PASS] Writing 섹션 platform-showcase 카드 3개: Velog, Brunch, GitHub 구현
- [PASS] 플랫폼별 좌측 보더 (비호버 30% / 호버 풀 색상) + glow 효과
- [PASS] `#velog-items`, `#github-items` ID 유지 (fetchVelog/fetchGitHub 호환)
- [PASS] JS initScrollReveal 셀렉터에 `.platform-showcase` 포함
- [PASS] JS applyFilter 셀렉터에 `.platform-showcase` 포함
- [PASS] 데스크탑 Writing 섹션 grid-template-columns: 1fr (단, 아래 P2 참조)
- [PASS] 데스크탑 platform-showcase .featured-item__thumb aspect-ratio: 16/10
- [PASS] 데스크탑 platform-showcase .featured-item__label font-size: 13px
- [PASS] 반응형 520px 대응 (platform-showcase 패딩/아이콘 축소)
- [PASS] prefers-reduced-motion 대응 (opacity/transform 즉시 표시)
- [PASS] 라이트 테마 platform-showcase 호버 box-shadow 대응
- [PASS] Music/Social 섹션 미변경 (범위 준수)
- [PASS] 히어로/프로필/모달/푸터 미변경 (범위 준수)

## 검수 결과 요약

| 등급 | 건수 |
|---|---|
| P0 치명 | 0건 |
| P1 중요 | 0건 |
| P2 권장 | 2건 |

## P2 -- 권장 사항

### 1. 미사용 CSS 변수 잔존 (dead code)
- **파일**: `assets/css/style.css:46-47`
- **위반 규칙**: 파일 간 정합성 (미사용 코드)
- **현재 코드**: `--nav-height: 64px;` `--section-max-width: 1200px;`
- **상태**: 1회차에서 제거된 desktop-nav 기능의 잔여 변수. 어디서도 `var(--nav-height)`, `var(--section-max-width)`로 참조되지 않음.
- **수정 제안**: `:root` 블록에서 두 변수 선언을 삭제하라.

### 2. 데스크탑 Writing 섹션 grid-template-columns 선언 비효과
- **파일**: `assets/css/style.css:1876-1878`
- **위반 규칙**: CSS 패턴 일관성
- **현재 코드**: `.category-section[data-category="writing"] .links--section { grid-template-columns: 1fr; }`
- **상태**: `.links`는 `display: flex` (line 866)이므로 `grid-template-columns`는 효과 없음. 결과적으로 flex column이 이미 1열 레이아웃을 구현하고 있어 시각적 문제는 없으나, 의미 없는 선언이 존재.
- **수정 제안**: 해당 룰을 삭제하거나, 의도적이라면 `display: grid; grid-template-columns: 1fr;`로 변경하라.

## 통과 항목

- **보안**: `esc()`, `safeUrl()` 적용 완료. `eval()`, `document.write()` 미사용. 인라인 이벤트 핸들러 없음.
- **CSS 패턴**: CSS 네이티브 중첩 `&` 문법 사용. 하드코딩 색상 없음 (플랫폼 아이콘 예외). `!important`는 `prefers-reduced-motion` 미디어쿼리에서만 사용. BEM 네이밍 준수 (`platform-showcase__header`, `__link`, `__icon` 등). `-webkit-backdrop-filter` 모든 곳에 함께 작성. `gap` 속성 사용.
- **JS 패턴**: function 선언식 (init 함수), 화살표 함수 (콜백). 가드 클래스 적용. `console.warn` 사용 (`console.error` 없음). `fetchWithTimeout()` + `try/catch/finally`. JSDoc 주석 + 섹션 구분선. DOMContentLoaded 등록. 코드 배치 순서 준수.
- **HTML 구조**: `target="_blank"` + `rel="noopener"` 모든 외부 링크에 적용. 모달 `role="dialog"`, `aria-modal`, `aria-label` 유지. 모든 `<img>`에 `alt` 속성. JS에서 사용하는 ID (`velog-items`, `github-items`, `categoryNav`, `profileModal` 등) HTML에 존재. 새 인라인 스타일 미추가.
- **반응형 & 접근성**: 520px 대응 (platform-showcase 패딩/아이콘 축소). `prefers-reduced-motion` 대응. 모달 포커스 트랩 (Tab 순환 + Escape 닫기 + 포커스 복귀). 키보드 접근 가능.
- **파일 간 정합성**: HTML 클래스 -> CSS 정의 존재 확인. JS getElementById -> HTML ID 존재 확인. 1회차 범위 위반 코드(desktop-nav, music-showcase) 3개 파일 모두에서 일괄 제거 확인.
- **Sprint 범위 준수**: SPEC 외 독립 기능 추가 없음. 1회차 범위 위반이 모두 수정됨.

---

## 채점

**변경 유형**: 디자인 -> 디자인 변경 평가 기준 적용

**항목별 점수**:
- D1 디자인 품질: 8/10 -> glassmorphism 톤 유지, 플랫폼별 좌측 보더 + glow 호버가 기존 link-card 패턴과 자연스럽게 조화. 다크/라이트 테마 모두 대응. 간격 축소로 콘텐츠 밀도 개선.
- D2 독창성: 7/10 -> 기존 link-card에서 플랫폼별 색채를 가진 쇼케이스 카드로의 진화는 사이트 정체성을 활용한 합리적 변형. 다만 구조적으로는 link-card와 매우 유사하여 혁신적 인터랙션이라 하기엔 부족.
- D3 패턴 일관성: 8/10 -> BEM/CSS변수/네이티브중첩 준수. 하드코딩 색상을 변수로 교체 완료. P2 수준 불일치 2건(미사용 변수, 비효과 grid 선언).
- D4 반응형 & 접근성: 9/10 -> 520px 대응, prefers-reduced-motion 대응, 포커스 가시성 유지. Playwright 10/10 통과.
- D5 기능 보전: 10/10 -> 기존 JS 동작 정상 (fetchVelog, fetchGitHub, 테마 토글, 카테고리 필터, 모달). 콘솔 에러 0건.

**가중 점수**: (8 x 0.30) + (7 x 0.30) + (8 x 0.20) + (9 x 0.15) + (10 x 0.05) = 2.4 + 2.1 + 1.6 + 1.35 + 0.5 = **7.95 / 10.0**

**이슈 건수 기준**: P0 0건, P1 0건, P2 2건 -> 강제 하락 없음

## 최종 판정: 합격

**구체적 개선 지시** (P2 -- 다음 스프린트 시 정리 권장):
1. `assets/css/style.css:46-47`에서 `--nav-height: 64px;`과 `--section-max-width: 1200px;` 변수 선언을 삭제하라.
2. `assets/css/style.css:1876-1878`의 `.category-section[data-category="writing"] .links--section { grid-template-columns: 1fr; }` 룰을 삭제하라 (flex 레이아웃에서 효과 없음).
