# 자체 점검

전략: Case A (최초 구현, SPEC 정밀 적용)

## SPEC 기능 체크
- [x] 기능 1: glassmorphism 세그먼트 트랙 — `.category-nav`에 `--bg-card` 배경 + `backdrop-filter: blur(14px) saturate(1.1)` + `-webkit-` + 보더/쉐도우 적용, `width: fit-content`로 캡슐화
- [x] 기능 2: 아이콘 + 라벨 버튼 — 5개 버튼 각각 inline SVG 18×18 (stroke, currentColor) + `.category-nav__label` 14px/600 적용
- [x] 기능 3: 슬라이딩 인디케이터 — `.category-nav__indicator` absolute, `translateX` + `width`를 `var(--spring-bounce)`로 이동. `updateIndicator()` 함수 추가
- [x] 기능 4: 호버 glow + 포커스 — `:hover`에서 아이콘 `drop-shadow(0 0 6px var(--brand-25))` + 버튼 `translateY(-1px)`, `:focus-visible` 2px `var(--brand-40)` outline
- [x] 기능 5: 모바일 가로 스크롤 세그먼트 — 520px 이하 `overflow-x: auto` + `scroll-snap-type: x mandatory` + 스크롤바 숨김
- [x] 접근성: `role="tablist"` / `role="tab"` / `aria-selected` 동적 갱신
- [x] reduced-motion: indicator/btn transition 단순화, hover transform 제거

## 필수 연동 변경
- 버튼에 `aria-selected` 속성 추가 — JS가 클릭 시 토글하기 위해 HTML에도 초기값 필요 (SPEC 명시)
- `.category-nav` 자체를 `width: fit-content` + `margin: 0 auto`로 가운데 정렬 — SPEC의 "중앙정렬 `margin: 0 auto`, 래퍼 flex" 의도를 부모 래퍼 수정 없이 달성하기 위한 최소 조정
- `will-change: transform, width` 추가 — 인디케이터 부드러운 이동을 위한 힌트

## 하고 싶었으나 범위 외로 미구현
- 없음 (SPEC 범위 내 모두 구현)

## 패턴 준수 확인
- BEM 네이밍: 준수 (`category-nav__indicator`, `__btn`, `__icon`, `__label`, `.is-active`, `.is-ready`)
- CSS 변수 사용: 준수 (하드코딩 색상 없음. `rgba(0,0,0,0.12)` / `rgba(255,255,255,0.04)`는 box-shadow용 뉴트럴로 SPEC 표에 명시된 값)
- CSS 네이티브 중첩: 준수 (모든 하위 규칙 `& ...` 형태)
- 반응형 520px: 대응 (SPEC의 수치 그대로)
- reduced-motion: 대응 (별도 미디어쿼리 블록)
- esc()/safeUrl(): 해당 없음 (외부 데이터 innerHTML 삽입 없음)
- 가드 클래스: 유지 (`if (!nav) return;`, `if (!indicator) return;`, `if (!active) return;`)
- DOMContentLoaded 등록: 기존 `initCategoryFilter()` 호출 유지
- -webkit-backdrop-filter: 함께 작성됨
- 파일 간 정합성: `#categoryNav`, `.category-nav__btn`, `.is-active`, `data-filter` 모두 일치. cover-band IIFE의 `allBtn.click()` 경로는 기존 클릭 핸들러를 통과하므로 인디케이터 자동 갱신

## 기능 보전 확인
- 필터 5개 동작: 기존 `applyFilter(sections, filter)` 호출 경로 보존
- 리플: `.ripple` 생성 로직 그대로. 버튼에 `overflow: hidden` 유지
- 페이드 전환: `visible.forEach` + `setTimeout(200)` 경로 그대로
- cover-band 호환: `.category-nav__btn.is-active` + `[data-filter="all"]` 선택자 그대로 동작
- 리사이즈: `window resize` 리스너로 인디케이터 재정렬
