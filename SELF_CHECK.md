# 자체 점검

## SPEC 기능 체크
- [x] `.profile` 섹션을 `.page-wrapper` 밖으로 이동, `<section class="hero" id="hero">`로 감싸기: 완료
- [x] `.theme-toggle` 버튼을 `.hero` 안으로 이동: 완료
- [x] 스크롤 힌트 요소 `.hero__scroll-hint` 추가 (`.hero` 마지막 자식): 완료
- [x] `.profile` 내부 HTML 구조 100% 보존: 모든 클래스명, ID, data 속성, JS 후크 유지
- [x] 새 CSS 변수 6개 추가 (`:root` 블록, 기존 변수 수정 없음): 완료
- [x] `.hero` 블록 CSS (100vh, flex center): 완료
- [x] `.hero-bg` height 45vh -> 100vh: 완료
- [x] `.theme-toggle` position: fixed, z-index: 50: 완료
- [x] `.profile` animation 제거, margin-bottom: 0, padding-top: 0: 완료
- [x] 타이포 스케일업 (name 80px, subtitle 14px/3px, motto/bio max-width 540px): 완료
- [x] `@keyframes heroEntrance` 신규: 완료
- [x] 스태거 입장 애니메이션 (6개 요소, 0s~0.60s delay): 완료
- [x] 스크롤 힌트 스타일 + `@keyframes heroBounce`: 완료
- [x] `.page-wrapper` padding 80px -> 48px: 완료
- [x] 반응형 520px 대응 (hero, name, subtitle, motto, bio, scroll-hint): 완료
- [x] `prefers-reduced-motion` 대응 (hero 스태거 비활성, scroll-hint/arrow 비활성): 완료
- [x] `initHeroParallax()` JS 함수 (스크롤 패럴랙스 페이드아웃): 완료
- [x] `DOMContentLoaded`에 `safeInit(initHeroParallax)` 등록: 완료

## 패턴 준수 확인
- BEM 네이밍: 준수 -- `hero__scroll-hint`, `hero__scroll-arrow` BEM 패턴 사용
- CSS 변수 사용: 준수 -- 모든 새 값에 CSS 변수 사용, 하드코딩 색상 없음
- CSS 네이티브 중첩: 준수 -- 새 hero 스타일은 `.hero .profile__name` 형식의 독립 규칙으로 작성 (중첩 필요 없는 구조)
- 반응형 520px: 대응 완료 -- hero 패딩, name 모바일 사이즈, subtitle, motto/bio max-width, scroll-hint 위치/크기
- reduced-motion: 대응 완료 -- 모든 hero 스태거 애니메이션 비활성, scroll-hint/arrow 비활성, JS에서도 early return
- esc()/safeUrl(): 해당 없음 -- 외부 데이터 삽입 없음
- 가드 클래스: 적용 -- `if (!hero) return;`, `if (!profile) return;`, reduced-motion 체크
- DOMContentLoaded 등록: 등록 완료 -- `safeInit(initHeroParallax, 'initHeroParallax')`
- -webkit-backdrop-filter: 해당 없음 -- 새 요소에 backdrop-filter 미사용
- 파일 간 정합성: 일치 -- HTML `#hero`, `.hero__scroll-hint` / CSS `.hero`, `.hero__scroll-hint`, `.hero__scroll-arrow` / JS `getElementById('hero')`, `querySelector('.hero__scroll-hint')`

## 필수 연동 변경
- `.page-wrapper` padding 조정 (80px -> 48px): hero가 100vh를 차지하므로 기존 상단 여백이 과도해짐
- 기존 `@keyframes fadeInUp` 삭제하지 않음 (다른 곳에서 사용 가능)

## 하고 싶었으나 범위 외로 미구현
- 없음
