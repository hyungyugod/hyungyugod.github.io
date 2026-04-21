# 자체 점검

전략: Case A — 최초 구현 (QA 피드백 없음)

## SPEC 기능 체크
- [x] 기능 1: 카테고리 제목 헤더 추가 — 3개 섹션(writing/music/social) 각각 `.category-header` > `<h2 class="category-title">` + 기존 `.section-label` 구조로 래핑. 라벨 텍스트도 SPEC대로 부연 설명으로 변경.
- [x] 기능 2: 등장 애니메이션 일관성 — `initScrollReveal()`과 `applyFilter()` 셀렉터에 `.category-title` 추가. `prefers-reduced-motion` 블록에도 포함.
- [x] `.streaks` 내부 `<p class="section-label">Routine</p>`는 건드리지 않음.
- [x] 모바일 520px: title 28px, 악센트 바 3px, 헤더 gap/margin 축소.

## 패턴 준수 확인
- BEM 네이밍: 준수 — `.category-header`(block), `.category-title`(block). `&::before`/`&.is-visible`로 상태 표현.
- CSS 변수 사용: 준수 — `var(--font-serif)`, `var(--text)`, `var(--brand)`, `var(--ease-out-expo)`만 사용. 하드코딩 색상 없음.
- CSS 네이티브 중첩: 준수 — `& .section-label`, `&.is-visible`, `&::before`, 모바일 블록 내 `&::before` 모두 `&` 사용.
- 반응형 520px: 대응 — `.category-title` 28px, `&::before` left/width 축소, `.category-header` gap/margin 축소.
- reduced-motion: 대응 — `@media (prefers-reduced-motion: reduce)`의 opacity/transform 리셋 리스트에 `.category-title` 추가.
- esc()/safeUrl(): 해당 없음 (정적 HTML만 변경).
- 가드 클래스: 해당 없음 (새 init 함수 추가 없음).
- DOMContentLoaded 등록: 해당 없음 (기존 `initScrollReveal` 확장만).
- -webkit-backdrop-filter: 해당 없음 (blur 미사용).
- 파일 간 정합성: `.category-title` 클래스가 HTML, CSS, JS 3곳 모두 일치. `.category-header`도 HTML/CSS 일치.

## 범위 준수
- SPEC "허용" 범위 내 변경만 수행: HTML 구조 추가, CSS 신규 블록, `initScrollReveal`/`applyFilter` 셀렉터 확장, `prefers-reduced-motion` 리스트 확장.
- SPEC "금지"에 해당하는 변경 없음 (카드 그리드/카테고리 탭/section-label 근본 재설계/새 인터랙션/Routine/cover-band 모두 미변경).
