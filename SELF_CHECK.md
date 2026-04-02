# 자체 점검

## SPEC 기능 체크
- [x] 기능 1 (타이핑 CSS): `.typing`에 `display: inline-block; min-width: 1ch` 추가
- [x] 기능 2A (모달 스프링 오픈): `.modal-box` transform을 `scale(0.92) translateY(24px)`으로, timing을 `var(--spring-bounce)`, duration `0.5s`로 변경
- [x] 기능 2B (모달 시차 진입): `.modal-photo-wrap`, `.modal-name`, `.modal-eng`, `.modal-divider`, `.modal-info li`에 순차 transition-delay 적용, 기본 상태에서 opacity:0/transform으로 숨김
- [x] 기능 2C (백드롭 강화): `.modal-overlay` blur를 12px로 변경, `::after` pseudo-element에 radial-gradient 브랜드 글로우 추가
- [x] 기능 2D (닫기 애니메이션): `.is-closing` 클래스에 exit transition 정의 (CSS), JS에서 `is-closing` 추가 후 `transitionend` + 500ms fallback으로 제거
- [x] 기능 3 (배경 그라디언트 애니메이션): `.hero-bg`에 `background-size: 400% 400%` + `animation: gradient-shift 15s ease infinite`, 라이트 테마에도 동일 적용
- [x] 기능 4 (프로필 아바타 부유): `.profile__avatar-wrap`에 `animation: float-gentle 6s ease-in-out infinite`
- [x] 기능 5 (카드 그라디언트 보더): `@property --angle` 등록, `rotate-angle` keyframe, `.link-card::before` conic-gradient, 호버 시 opacity:1, 내부 요소에 z-index:1 부여. overflow:hidden 제거하여 ::before가 보이도록 처리
- [x] 기능 6 (플랫폼별 글로우): `:has()` 셀렉터로 velog/brunch/github/melon/soundcloud 각각 box-shadow 적용
- [x] 기능 7 (섹션 라벨 와이프 리빌): `.section-label`에 `clip-path: inset(0 100% 0 0)` 기본, `.is-visible`에서 `inset(0 0 0 0)`
- [x] 기능 8 (카드 진입 다양화): odd/even에 미세 회전(0.5deg/-0.5deg), 호버 시 rotate(0deg) 복귀, 시차 딜레이 0s/0.12s/0.24s
- [x] 기능 9 (마그네틱 버튼): CSS에 `transform 0.25s var(--spring-bounce)` 추가, JS에 `initMagneticButtons()` 구현 + DOMContentLoaded 등록
- [x] 기능 10 (푸터 아이콘 호버 강화): `scale(1.15) translateY(-3px)` + `drop-shadow`, transition에 filter 추가

## CSS 변수 추가
- [x] `:root`에 `--spring-bounce`, `--glow-velog/brunch/github/melon/soundcloud` 추가
- [x] `html.light`에 동일 glow 변수를 낮은 불투명도로 오버라이드

## JS 변경
- [x] `safeInit` 헬퍼 추가, DOMContentLoaded 내 모든 init 함수를 safeInit으로 감쌈
- [x] 모달 close 함수에 `is-closing` 클래스 + transitionend + 500ms fallback
- [x] `initMagneticButtons()` 함수 추가 (hover:none, reduced-motion 가드)

## 패턴 준수 확인
- BEM 네이밍: 준수 -- 기존 클래스명 그대로 사용, 새 클래스 `is-closing`은 상태 클래스 패턴 준수
- CSS 변수 사용: 준수 -- 모든 새 색상은 `:root` 변수로 정의, 하드코딩 없음
- CSS 네이티브 중첩: 준수 -- 모든 중첩에 `&` 문법 사용
- 반응형 520px: 기존 반응형 블록 유지, 새 기능은 추가 브레이크포인트 불필요 (애니메이션/호버 기반)
- reduced-motion: 대응 -- `.hero-bg`, `.profile__avatar-wrap`, `.link-card::before`, `.section-label` clip-path 모두 비활성화 추가
- esc()/safeUrl(): 해당 없음 (새 외부 데이터 삽입 없음)
- 가드 클래스: 적용 -- `initMagneticButtons()`에 hover:none + reduced-motion 가드, 모달 close에 is-open 가드
- DOMContentLoaded 등록: 등록 -- `safeInit(initMagneticButtons, 'initMagneticButtons')` 추가
- -webkit-backdrop-filter: 기존 사용 유지, 새 backdrop-filter 추가 시 `-webkit-` 함께 작성 (modal-overlay는 기존에 이미 있었으므로 blur 값만 변경)
- 파일 간 정합성: 일치 -- HTML 변경 없음, CSS 클래스명(`is-closing`, `is-open`, `is-visible`)과 JS에서 사용하는 클래스명 일치
