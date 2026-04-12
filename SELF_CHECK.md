# 자체 점검

## SPEC 기능 체크
- [x] 기능 1 (오빗 컴포넌트 제거): orbit-stage 래퍼, SVG 트랙, 6개 orbit-card, orbit-stage__cards를 HTML에서 완전 제거. CSS에서 .orbit-stage, .orbit-card, .orbit-card__icon/label/desc, light theme orbit 오버라이드, 600px 미디어쿼리 내 orbit 규칙 전체 삭제. JS에서 initOrbit 함수 전체 삭제 및 DOMContentLoaded 호출 제거.
- [x] 기능 2 (프로필 전폭 재배치): profile을 hero 직접 자식으로 이동. .profile에 max-width: 720px, width: 100% 추가. .profile__motto max-width 540px->640px, .profile__bio max-width 540px->640px. 데스크톱(900px+)에서 .profile max-width: 800px 추가.
- [x] 기능 3 (섹션 간격 축소): .category-nav margin-bottom 64->32px, .links--section margin-bottom 24->12px, .category-section padding 48->24px(데스크톱), .page-wrapper padding-top 48->24px(기본)/60->32px(데스크톱), .footer margin-top 56->28px, .social-grid margin-bottom 24->12px, .music-showcase margin-bottom 24->12px(데스크톱).

## 반응형 대응
- [x] 모바일 520px: .page-wrapper padding-top 40->24px, .profile margin-bottom 72->36px
- [x] 모바일에서는 orbit이 이미 display:none이었으므로 레이아웃 영향 없음

## 필수 연동 변경
- initHeroParallax에서 .orbit-stage 참조를 제거하고 .profile만 직접 선택하도록 수정 (패럴랙스 기능 유지를 위해 필수)

## :root CSS 변수
- [x] --orbit-card-bg, --orbit-card-border 및 html.light 내 orbit 관련 변수 오버라이드 유지 (삭제 금지 원칙 준수)

## 패턴 준수 확인
- BEM 네이밍: 준수 (기존 클래스명 유지, 새 클래스 추가 없음)
- CSS 변수 사용: 준수 (하드코딩 색상 추가 없음)
- CSS 네이티브 중첩: 준수 (& 문법 유지)
- 반응형 520px: 대응 완료 (page-wrapper, profile margin-bottom 조정)
- reduced-motion: 기존 대응 유지 (변경 없음)
- esc()/safeUrl(): 해당 없음 (외부 데이터 처리 변경 없음)
- 가드 클래스: 적용 (initHeroParallax에서 profile 가드 유지)
- DOMContentLoaded 등록: initOrbit 호출만 제거, 기존 등록 패턴 유지
- -webkit-backdrop-filter: 해당 없음 (새 backdrop-filter 추가 없음)
- 파일 간 정합성: orbit-stage/orbit-card가 HTML, CSS, JS 모두에서 일관되게 제거됨
