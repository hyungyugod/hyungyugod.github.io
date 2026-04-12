# QA 검수 보고서

## UI 동작 검증 (Playwright)

| 체크 항목 | 결과 | 비고 |
|---|---|---|
| 테마 토글 | PASS | 다크/라이트/다크 전환 정상 |
| 카테고리 필터 (writing) | PASS | 2개 섹션 숨김 확인 |
| 카테고리 필터 (music) | PASS | 2개 섹션 숨김 확인 |
| 카테고리 필터 (social) | PASS | 2개 섹션 숨김 확인 |
| 카테고리 필터 (all) | PASS | 0개 섹션 숨김 확인 |
| 프로필 모달 열기 | PASS | is-open 클래스 추가 확인 |
| 프로필 모달 닫기 | PASS | is-open 클래스 제거 확인 |
| 링크카드 href | PASS | 2개 링크 모두 유효 |
| 모바일 520px | PASS | 핵심 요소 3개 모두 visible |
| 콘솔 에러 | PASS | 0건 |

스크린샷: `tests/screenshots/`

결과: **10/10 통과**

## SPEC 기능 검증

- [PASS] 기능 1 (오빗 컴포넌트 제거): orbit-stage 래퍼, SVG 트랙, 6개 orbit-card가 HTML에서 완전 제거됨. CSS에서 .orbit-stage, .orbit-card 및 관련 규칙(light theme, 600px 미디어쿼리 포함) 전체 삭제. JS에서 initOrbit 함수 삭제 및 DOMContentLoaded 호출 제거. :root CSS 변수(--orbit-card-bg, --orbit-card-border)는 삭제 금지 원칙에 따라 유지됨.
- [PASS] 기능 2 (프로필 전폭 재배치): profile이 hero 직접 자식으로 이동. .profile에 max-width: 720px, width: 100% 추가. .profile__motto max-width 540px->640px, .profile__bio max-width 540px->640px. 데스크톱(900px+)에서 .profile max-width: 800px 추가.
- [PASS] 기능 3 (섹션 간격 축소): 7개 spacing 값 모두 SPEC대로 변경 확인.
  - .category-nav margin-bottom: 64->32px
  - .links--section margin-bottom: 24->12px
  - .category-section padding: 48->24px (데스크톱)
  - .page-wrapper padding-top: 48->24px (기본), 60->32px (데스크톱)
  - .footer margin-top: 56->28px
  - .social-grid margin-bottom: 24->12px
  - .music-showcase margin-bottom: 24->12px (데스크톱)
- [PASS] 반응형: 모바일 520px에서 .page-wrapper padding-top 40->24px, .profile margin-bottom 72->36px
- [PASS] JS 연동: initHeroParallax에서 .orbit-stage 참조 제거, .profile 직접 선택으로 수정

## Sprint 범위 준수

- [PASS] SPEC에 "변경 유형: 디자인" 명시됨
- [PASS] Generator가 SPEC 외 독립 기능을 추가하지 않음
- [PASS] 모든 변경이 "오빗 제거 후 레이아웃 정상 동작" 또는 "섹션 간격 축소"에 필수적인 변경임

## 검수 결과 요약

| 등급 | 건수 |
|---|---|
| P0 치명 | 0건 |
| P1 중요 | 0건 |
| P2 권장 | 2건 |

## P2 -- 권장 사항

### 1. section-label margin 변경이 SPEC 표에 미포함
- **파일**: `style.css:740-741`
- **위반 규칙**: Sprint 범위 계약 -- SPEC 간격 축소 표에 .section-label은 없음
- **현재 코드**: `margin-top: 0; margin-bottom: 6px;` (이전: `margin-top: 8px; margin-bottom: 8px;`)
- **판단**: 오빗 제거 + 섹션 간격 축소의 밀도 조정에 부수적으로 필요한 변경. SPEC 판단 기준("이 변경이 없으면 간격 축소가 적용되지 않는가?")에 비추면 엄밀히 독립적이나, 시각적 일관성 유지를 위한 미세 조정이므로 P2로 분류.
- **수정 제안**: 다음 SPEC에 명시하거나, 현재 값 유지 (기능 영향 없음).

### 2. page-wrapper background 제거
- **파일**: `style.css:302` (diff에서 `background: var(--bg)` 삭제)
- **위반 규칙**: Sprint 범위 계약 -- SPEC에서 page-wrapper의 background 제거를 명시하지 않음
- **현재 코드**: background 속성 없음 (이전: `background: var(--bg)`)
- **판단**: 오빗 제거 시 히어로 배경이 page-wrapper 뒤로 연결되도록 하기 위해 필요한 변경일 수 있음. 시각적으로 body에 이미 `background: var(--bg)`가 적용되므로 실질적 차이 없음. P2로 분류.
- **수정 제안**: 의도적 변경이면 유지. 아니면 `background: var(--bg)` 복원.

## 통과 항목

- **보안**: innerHTML에 esc() 적용, safeUrl() 사용, eval/document.write 없음, 인라인 핸들러 없음, console.error 없음
- **CSS 패턴**: 네이티브 중첩 & 사용, 하드코딩 색상 없음 (Generator 변경분 한정), !important는 접근성 미디어쿼리 내에서만, BEM 준수, -webkit-backdrop-filter 항상 쌍으로 작성
- **JS 패턴**: function 선언식 사용, 가드 클래스 적용, console.warn 사용, DOMContentLoaded 등록, JSDoc 주석 존재
- **HTML 구조**: target="_blank" + rel="noopener" 준수, 모달 접근성 속성(role="dialog", aria-modal, aria-label) 존재, 모든 img에 alt, JS 사용 ID가 HTML에 존재
- **반응형 & 접근성**: 520px 대응, prefers-reduced-motion 대응, 모달 포커스 트랩 + Escape 닫기 + 포커스 복귀
- **파일 간 정합성**: orbit 관련 클래스/ID가 HTML, CSS, JS 모두에서 일관 제거. 새 클래스 추가 없음.

---

## 채점

**변경 유형**: 디자인 --> 디자인 변경 평가 기준 적용

**항목별 점수**:
- D1 디자인 품질: 8/10 --> 오빗 제거 후 프로필이 전폭으로 자연스럽게 확장됨. 간격 축소가 일관적이고 밀도감 있는 레이아웃 달성. 다크/라이트 모두 정상.
- D2 독창성: 6/10 --> 이번 변경은 기존 요소 제거 + 수치 조정이 본질. SPEC 자체가 창의성을 요구하지 않으므로 독창적 표현의 여지가 제한적. "정돈된 밀도감" 목표는 달성했으나 새로운 시각 아이디어 추가 없음.
- D3 패턴 일관성: 9/10 --> CSS 변수, BEM, 네이티브 중첩 모두 준수. SPEC 범위 외 미세 변경(section-label margin, page-wrapper background) 2건 P2.
- D4 반응형 & 접근성: 9/10 --> 520px 모바일 대응 완료, prefers-reduced-motion 기존 대응 유지. Playwright 전항목 통과.
- D5 기능 보전: 10/10 --> Playwright 10/10 통과. 테마 토글, 카테고리 필터, 프로필 모달, 링크 모두 정상 동작. 콘솔 에러 0건.

**가중 점수**: (8x0.30) + (6x0.30) + (9x0.20) + (9x0.15) + (10x0.05) = 2.4 + 1.8 + 1.8 + 1.35 + 0.5 = **7.85 / 10.0**

**이슈 건수**: P0 = 0건, P1 = 0건, P2 = 2건

## 최종 판정: 합격

점수 기준 7.85 >= 7.0 충족. P0 0건, P1 0건으로 이슈 건수 기준도 충족.

**구체적 개선 지시**: (합격이므로 필수 아님, 향후 참고)
1. `style.css:740-741` -- .section-label margin 변경은 향후 SPEC에 명시할 것.
2. `style.css:302` -- page-wrapper background 제거가 의도적인지 확인하고, 의도적이면 SPEC에 기록할 것.
