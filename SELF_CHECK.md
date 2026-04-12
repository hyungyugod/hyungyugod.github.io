# 자체 점검

## SPEC 기능 체크
- [x] orbit-stage 전체 래퍼 제거 (HTML): SVG 트랙, orbit-stage__cards, 6개 orbit-card 링크 모두 제거 완료
- [x] hero-keywords 플로팅 배경 추가 (HTML): 10개 키워드 span, aria-hidden="true", CSS 커스텀 프로퍼티 스타일 적용
- [x] hero-split 스플릿 레이아웃 추가 (HTML): 좌측 프로필 카드 + 우측 콘텐츠 구조, id="heroSplit", id="heroCard" 포함
- [x] hero-social 소셜 아이콘 추가 (HTML): 6개 소셜 링크, 모두 rel="noopener" + aria-label 포함
- [x] profileAvatar ID 유지: 모달 포커스 복귀용 ID 유지 완료
- [x] js-open-profile 클래스 유지: 아바타 + 버튼 모두 유지
- [x] scroll-hint 기존 위치 유지: .hero 직속 자식으로 변경 없음
- [x] CSS 변수 추가: --hero-split-gap, --card-tilt-perspective 추가 완료
- [x] orbit 관련 CSS 제거: .orbit-stage, .orbit-card, light 테마, 600px 미디어쿼리 모두 제거
- [x] --orbit-card-bg, --orbit-card-border 변수 유지: :root에서 삭제하지 않음
- [x] hero-keywords CSS 추가: kw-float 키프레임, light 테마 대응
- [x] hero-split CSS 추가: 카드 레이아웃, glassmorphism, -webkit-backdrop-filter 포함
- [x] hero-social CSS 추가: flex 레이아웃, hover 효과, spring-bounce 트랜지션
- [x] hero-split__content CSS 추가: flex column 레이아웃, 모토/바이오/버튼 배치
- [x] light 테마 hero-split__card-inner 추가
- [x] 반응형 520px 추가: hero-split column 전환, 카드 최대너비, 아바타 크기 축소
- [x] prefers-reduced-motion 추가: hero-keywords__item animation:none, hero-split__card-inner transition:none
- [x] initOrbit() 제거 + initCardTilt() 추가 (JS)
- [x] initHeroParallax() 셀렉터 변경: .orbit-stage -> .hero-split
- [x] DOMContentLoaded에서 initOrbit -> initCardTilt 교체

## 패턴 준수 확인
- BEM 네이밍: 준수 - hero-keywords__item, hero-split__card, hero-split__card-inner, hero-split__content, hero-social__link, hero-social__icon
- CSS 변수 사용: 준수 - 모든 색상은 var() 사용, 하드코딩 없음 (box-shadow rgba는 기존 패턴과 동일)
- CSS 네이티브 중첩: 준수 - & 문법 사용 (.hero-keywords 내부, .hero-split__card 내부, .hero-social__link 내부 등)
- 반응형 520px: 대응 완료 - hero-split column 전환, 카드 크기 축소, 키워드 폰트 축소
- reduced-motion: 대응 완료 - CSS에서 animation:none/transition:none, JS에서 matchMedia 가드
- esc()/safeUrl(): 해당 없음 - 외부 데이터 삽입 없음 (정적 HTML)
- 가드 클래스: 적용 - initCardTilt에서 card/inner null 체크, reduced-motion/hover:none 체크
- DOMContentLoaded 등록: 등록 완료 - safeInit(initCardTilt, 'initCardTilt')
- -webkit-backdrop-filter: 함께 작성 완료 - hero-split__card-inner에 포함
- 파일 간 정합성: 일치 - heroCard/heroSplit ID, hero-split__card-inner 클래스명 모두 HTML/CSS/JS 일치

## 범위 외 미구현
- 없음. 모든 변경이 SPEC 범위 내에서 수행됨.
