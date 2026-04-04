# QA 검수 보고서

**검수 회차**: 1회  
**SPEC 변경 유형**: 디자인  
**평가 기준**: 디자인 변경 평가 기준 (D1~D5)

---

## UI 동작 검증 (Playwright)

| 체크 항목 | 결과 | 비고 |
|---|---|---|
| 테마 토글 | PASS | 다크→라이트→다크 전환 정상 |
| 카테고리 필터 (writing) | PASS | 2개 섹션 숨김 확인 |
| 카테고리 필터 (music) | PASS | 2개 섹션 숨김 확인 |
| 카테고리 필터 (social) | PASS | 2개 섹션 숨김 확인 |
| 카테고리 필터 (all) | PASS | 0개 섹션 숨김 확인 |
| 프로필 모달 열기 | PASS | #profileModal.is-open 추가 확인 |
| 프로필 모달 닫기 | PASS | is-open 클래스 정상 제거 |
| 링크카드 href 유효성 | PASS | 5개 링크 모두 유효 |
| 모바일 520px | PASS | 핵심 요소 3개 모두 visible |
| 콘솔 에러 | PASS | 0건 |

스크린샷: `tests/screenshots/`

**결과: 10/10 통과**

---

## SPEC 기능 검증

- [PASS] `.profile__motto` HTML: `<p class="profile__subtitle">` 직후, `<div class="profile__bio">` 직전에 정확히 배치 (index.html:54)
- [PASS] Consistency / Curiosity / Confrontation 세 항목: 각각 letter/word/kr 스팬 구조로 구현
- [PASS] `aria-label="개인 모토"` 접근성 속성: `.profile__motto`에 부여 (index.html:54)
- [PASS] `aria-hidden="true"` 장식용 이니셜: `.profile__motto-letter`에 부여 (index.html:56, 62, 68)
- [PASS] `.profile__subtitle` margin-bottom 28px → 20px 변경 (style.css:329)
- [PASS] `.profile__motto` 그리드 CSS: `repeat(3,1fr)`, gap 8px, max-width 440px, margin 0 auto 24px (style.css:333~339)
- [PASS] `.profile__motto-item` 글래스모피즘 카드: backdrop-filter + -webkit-backdrop-filter, border, border-radius var(--radius-sm) (style.css:341~359)
- [PASS] `.profile__motto-item` 호버: translateY(-2px) + border-color var(--brand-25) + box-shadow 0 0 14px var(--brand-12) (style.css:354~358)
- [PASS] `.profile__motto-letter` 브랜드 그라디언트 텍스트: brand-light → brand, -webkit-background-clip (style.css:361~369)
- [PASS] 반응형 `@media (max-width: 520px)`: gap/padding/font-size 축소 규칙 추가 (style.css:1073~1077)
- [PASS] `@media (prefers-reduced-motion: reduce)`: hover transform 제거 처리 (style.css:1397~1400)

---

## 검수 결과 요약

| 등급 | 건수 |
|---|---|
| P0 치명 | 0건 |
| P1 중요 | 0건 |
| P2 권장 | 1건 |

---

## P0 — 치명적 이슈

없음.

---

## P1 — 중요 이슈

없음.

---

## P2 — 권장 사항

### 1. reduced-motion 블록 내 불필요한 transition 재선언

- **파일**: `assets/css/style.css:1397~1398`
- **위반 규칙**: 코드 중복 (기능적 무효)
- **현재 코드**:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      transition-duration: 0.01ms !important; /* 1384~1386행 — 모든 transition 무력화 */
    }
    .profile__motto-item {
      transition: border-color var(--transition), box-shadow var(--transition); /* 이 선언은 효과 없음 */
      &:hover { transform: none; }
    }
  }
  ```
- **설명**: 블록 상단에서 `transition-duration: 0.01ms !important`로 모든 transition이 이미 사실상 제거된 상태이므로, 이후 `transition` 재선언은 실제 동작에 영향을 주지 않는다. `&:hover { transform: none; }` 만으로 충분하다.
- **수정 제안**:
  ```css
  .profile__motto-item {
    &:hover { transform: none; }
  }
  ```
- **비고**: SPEC.md가 이 패턴을 그대로 명시했으므로 Generator 귀책이 아님. 향후 SPEC 개선 권장.

---

## 통과 항목

- **보안**: `esc()` / `safeUrl()` 모든 외부 데이터에 적용. `eval()`, `document.write()`, 인라인 이벤트 핸들러 없음.
- **CSS 패턴**: CSS 네이티브 중첩 `&` 문법 준수. 하드코딩 색상 없음 (전량 CSS 변수). `!important` 미사용 (접근성 미디어쿼리 예외). BEM 네이밍 완전 준수. `-webkit-backdrop-filter` 쌍으로 작성. `gap` 속성 사용.
- **HTML 구조**: `target="_blank"` + `rel="noopener"` 모두 준수. `aria-label`, `aria-hidden` 접근성 속성 적용. 새 인라인 스타일 없음. JS에서 사용하는 모든 ID가 HTML에 존재.
- **반응형 & 접근성**: `@media (max-width: 520px)` 5개 하위 클래스 모두 대응. `prefers-reduced-motion` 처리 구현. Playwright 모바일 520px PASS.
- **파일 간 정합성**: HTML 클래스 → CSS 정의 완전 일치. 미사용 클래스 없음.
- **Sprint 범위 준수**: SPEC에 없는 독립 기능 추가 없음. `profile__subtitle` margin-bottom 조정 및 motto 컴포넌트만 변경. JS 변경 없음.
- **AI 슬롭 패턴**: 보라-청록 그라디언트 없음. 과대 그림자 없음(`box-shadow: 0 0 14px var(--brand-12)` — 적절한 크기). 임의 `border-radius: 20px` 이상 없음 (`var(--radius-sm)` 사용). `setTimeout`으로 애니메이션 완료 처리 없음.

---

## 채점

**기준**: 디자인 변경 평가 기준 (D1~D5)

**항목별 점수**:

| 항목 | 점수 | 비중 | 코멘트 |
|---|---|---|---|
| D1 디자인 품질 | 8/10 | 30% | glassmorphism 톤 유지, hover/focus 명확, 다크/라이트 모두 대응. 완성도 높음. |
| D2 독창성 | 7/10 | 30% | 사이트 코럴핑크 브랜드 그라디언트를 이니셜 텍스트에 활용. 3열 글래스카드 구조는 흔하나 사이트 정체성과 연결된 활용. |
| D3 패턴 일관성 | 8/10 | 20% | BEM/CSS변수/네이티브중첩 완전 준수. P2 수준 불필요 코드 1건. |
| D4 반응형 & 접근성 | 9/10 | 15% | 520px 5개 하위 클래스 대응, prefers-reduced-motion 처리, aria 속성 정확히 적용. |
| D5 기능 보전 | 10/10 | 5% | Playwright 10/10 전체 통과. 기존 기능 완전 보전. |

**가중 점수 계산**:
(8 × 0.30) + (7 × 0.30) + (8 × 0.20) + (9 × 0.15) + (10 × 0.05)
= 2.40 + 2.10 + 1.60 + 1.35 + 0.50
= **7.95 / 10**

**이슈 건수 기준**: P0 0건, P1 0건 → 강제 하락 조건 없음

---

## 최종 판정: 합격

**가중 점수 7.95/10 — 합격 기준(7.0) 초과**

**구체적 개선 지시**: 없음 (P2 권장 사항 1건 — 향후 SPEC 작성 시 불필요 코드 제거 방향으로 개선 권장)
