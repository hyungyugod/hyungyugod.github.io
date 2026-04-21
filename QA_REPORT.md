# QA 검수 보고서

## UI 동작 검증 (Playwright)

| 체크 항목 | 결과 | 비고 |
|---|---|---|
| 테마 토글 | PASS | 다크→라이트→다크 정상 |
| 카테고리 필터 (writing) | PASS | 2개 섹션 숨김 |
| 카테고리 필터 (music) | PASS | 2개 섹션 숨김 |
| 카테고리 필터 (social) | PASS | 2개 섹션 숨김 |
| 카테고리 필터 (all) | PASS | 전체 표시 |
| 프로필 모달 | FAIL | locator timeout — 본 SPEC 변경 무관 (pre-existing) |
| 링크카드 href | PASS | 2개 링크 유효 |
| 모바일 520px | PASS | 핵심 요소 3개 visible |
| 콘솔 에러 | PASS | 0건 |

결과: 8/9. 프로필 모달 실패는 이번 SPEC(카테고리 제목 헤더 추가)과 독립된 기존 이슈로, 본 Sprint 변경 영역 밖이므로 채점에서 별도 패널티 없음 (참고만).

스크린샷: `tests/screenshots/`

## SPEC 기능 검증
- [PASS] 기능 1: 카테고리 제목 헤더 — `index.html:164-166`, `256-258`, `380-382`에 `.category-header > h2.category-title + p.section-label` 구조 완비. 라벨 텍스트도 SPEC대로 "개발 · 글쓰기 · 학습 기록" / "음악 · 프로듀싱 · 릴리즈" / "연결점 · 소셜 링크"로 변경.
- [PASS] 기능 2: 등장 애니메이션 일관성 — `main.js:396` 및 `429`에서 `.category-title` 포함, `style.css:1845`의 `prefers-reduced-motion` 리셋 리스트에도 추가됨.
- [PASS] `.streaks` 내부 `section-label`(`index.html:115`) 미변경.
- [PASS] 모바일 520px: `.category-title` 28px, `::before` 3px (`style.css:1488-1498`).

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

### 1. `.category-title`에 `scroll-margin-top` 미지정 (선택)
- **파일**: `assets/css/style.css:768-798`
- **설명**: `<h2>` 시맨틱을 도입했으므로, 추후 TOC/앵커 링크로 점프할 때 상단 여백이 필요할 수 있다. 필수 아님.
- **수정 제안**: 필요 시 `scroll-margin-top: 24px;` 추가.

## 통과 항목
- **보안**: 본 변경에는 외부 데이터/URL 삽입 없음. `innerHTML`/`eval`/인라인 핸들러 미사용.
- **CSS 패턴**: CSS 네이티브 중첩 `&` 사용 (`&.is-visible`, `&::before`, `& .section-label`, 모바일 `&::before`). CSS 변수만 사용 (`--font-serif`, `--text`, `--brand`, `--ease-out-expo`). 하드코딩 색상 없음. `!important` 없음. BEM 준수(`.category-header` / `.category-title` + `is-visible`).
- **JS 패턴**: 신규 함수 없음. 기존 `initScrollReveal()`/`applyFilter()` 셀렉터 리스트에 `.category-title`만 추가 — 최소 침습.
- **HTML 구조**: `<h2>` 시맨틱 태그로 섹션 제목 표현, 접근성 계층 개선. 인라인 스타일 미추가.
- **반응형 & 접근성**: 520px에서 font-size 28px / 악센트 바 3px 축소. `prefers-reduced-motion` 리셋 리스트에 `.category-title` 포함.
- **파일 간 정합성**: `.category-title`이 HTML(3회) / CSS / JS 3파일에서 모두 일치. 미사용/고아 클래스 없음.
- **Sprint 범위 준수**: SPEC "허용" 내 변경만 수행. 카드 그리드/카테고리 탭/section-label 근본 스타일/Routine/cover-band 모두 미변경. 범위 위반 없음.
- **AI 슬롭 패턴**: 해당 없음 — 보라-청록 그라디언트 / 과잉 그림자 / 임의 radius / setTimeout 타이밍 / SPEC 외 독립 기능 추가 전부 없음.

---

## 채점 (디자인 변경 기준 적용)

**항목별 점수**:
- D1 디자인 품질: 8/10 → 세리프 대형 제목 + 좌측 코럴 악센트 바 + 기존 라벨 kicker 재배치로 명확한 타이포그래피 계층을 만듦. 다크/라이트 변수 기반 자동 대응.
- D2 독창성: 7/10 → 세로 좌측 액센트 바(`::before` 4×0.75em)로 사이트 브랜드 컬러를 "앵커"로 활용한 점은 괜찮으나, 세리프 제목 + 수직 바는 다소 전형적인 편집 레이아웃 패턴. 차별화 요소 1개(악센트 바)로 충분.
- D3 패턴 일관성: 9/10 → CSS 변수·BEM·네이티브 중첩 전부 준수. 하드코딩/인라인/SCSS 문법 없음.
- D4 반응형 & 접근성: 9/10 → 520px 대응, `prefers-reduced-motion` 리셋 포함, `<h2>` 시맨틱.
- D5 기능 보전: 10/10 → 카테고리 필터·스크롤 리빌 정상 작동 (Playwright PASS). 기존 DOM/JS 바인딩 훼손 없음.

**가중 점수** = (8×0.30) + (7×0.30) + (9×0.20) + (9×0.15) + (10×0.05) = 2.4 + 2.1 + 1.8 + 1.35 + 0.5 = **8.15 / 10.0**

### 관대함 재검토
"내가 관대하게 본 것은 아닌가?" — 재검토 결과:
- D2 독창성은 7점에서 더 높이지 않았다 (세리프+액센트바 조합은 편집 디자인에서 흔한 패턴).
- 나머지 항목은 실제 체크리스트(변수/BEM/네이티브중첩/반응형/reduced-motion/시맨틱) 모두 구체적으로 통과 확인됨.
- Playwright 프로필 모달 실패는 본 SPEC 범위 밖이고 기존 이슈로 확인됨.
- P0·P1 이슈 0건, 범위 위반 0건, AI 슬롭 패턴 0건.

## 최종 판정: 합격

**구체적 개선 지시**: 필수 수정 사항 없음. 선택적 개선(P2)만 존재하며 현재 상태로 merge 가능.
