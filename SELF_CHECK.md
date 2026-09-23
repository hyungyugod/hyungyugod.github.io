# 자체 점검 — SoundCloud NEED → IOU EP 교체 + Quiet Glass 정비

전략: 최초 구현 (QA 이전) — SPEC 항목을 셀렉터·함수명 기준으로 1:1 적용

## SPEC 기능 체크

### 기능 1: IOU EP 교체
- [x] NEED `<a>` 블록(need-feat-sumin / cover-need.jpg) 삭제
- [x] IOU `featured-item`을 SoundCloud `.link-card__items` 첫 자식으로 추가 (aria-label, alt "IOU EP 커버", width/height 500, `rel="noopener"`, `.featured-item__source` "EP" 배지)
- [x] 최종 순서 IOU → 악어는 하늘을 나는 꿈을 꾸었다 → Burn It Up (Playwright로 확인)
- [x] SoundCloud 헤더 href utm 제거 → `https://soundcloud.com/user-928451677`
- [x] 히어로 eyebrow → `<a class="profile__eyebrow">` "New EP · IOU" 알약 (dot + arrow `aria-hidden`, aria-label 없음, `rel="noopener"`)
- [x] `assets/img/*` 추가·삭제 없음 (cover-need.jpg 삭제는 메인 에이전트 몫, 3파일 내 `cover-need` 참조는 0건)

### 기능 2: Quiet Glass 배경·히어로
- [x] `.hero-bg`: animation/background-size/`& img`/`&::after` 삭제, `pointer-events:none`, brand-14 radial + bg-dark→bg linear 정적 배경. `html.light .hero-bg` 블록, `@keyframes gradient-shift` 삭제
- [x] `.hero`: `position:relative; z-index:1`, overflow·min-height 삭제, padding `clamp(42px,6vh,84px) 24px clamp(40px,6vh,72px)`. 900px+: min-height 삭제, padding-bottom `clamp(48px,7vh,80px)`. 모바일: `padding:48px 16px 40px`만
- [x] 테마 토글을 `.hero` 밖, `.scroll-progress` 다음(body 직계)으로 이동 — 부모 BODY 확인
- [x] `.profile__halo`, `.profile__hint`, `.scroll-hint` 요소·CSS 삭제. `scroll-bounce`/`halo-pulse`/`dot-pulse`/`avatar-ring-breathe`/`fadeInUp` keyframes 삭제
- [x] 아바타 링 `::before` animation → `avatar-ring-rotate`만 (hover opacity 0.9 이제 적용됨)
- [x] JS 삭제: `initMouseParallax`, `initHeroParallax`, `initMottoReveal` 본문 + safeInit 등록
- [x] 히어로 등장 지연: avatar 0 / eyebrow .08 / name .14 / subtitle .20 / statement .26 / actions .32 / motto-item 1·2·3 .38·.44·.50 / bio .58. `.hero .profile__motto` 컨테이너 애니메이션 삭제
- [x] `.profile`의 `margin-bottom:0; padding-top:0` 및 모바일 `margin-bottom:36px` 삭제

### 기능 3: 카드 인터랙션 재정비
- [x] `.link-card` 등장 → `card-rise` keyframes, fill-mode `backwards`, nth-child(2/3) 0.08s/0.16s. 기존 transition-delay 3줄·기본 `translateY(24px)` 삭제. hover 시 `matrix(...,-2)` 적용 확인 (lift가 막히지 않음)
- [x] `--card-glow` 변수화 (기본 brand-14, 9개 플랫폼 `:has`), 기존 `&:has(...):hover` 10줄 + `html.light .link-card:hover` 삭제. 라이트 테마 hover 그림자에 `rgba(255,85,0,0.15)` 글로우 확인
- [x] hover에 `border-color: var(--border-hover)`, `background-color: var(--bg-card-hover)`, `box-shadow: var(--shadow-card-hover), 0 6px 24px var(--card-glow)`
- [x] 카드 스포트라이트 `::after` (radial, `--spot-size`, `--spot-x/y` fallback) + `initCardSpotlight()` (page-wrapper 위임, rAF 병합, hover:none·reduced-motion·touch 가드) — hover 시 `--spot-x` 기록·`::after` opacity 1 확인
- [x] `.link-card__desc` 13px
- [x] `.featured-item`: `background: var(--bg-item)`, `html.light .featured-item` 삭제, counter/`::before` 번호 배지 전부 삭제(모바일·로딩·feature·reduced-motion 포함), nth-child transition-delay 삭제, hover `translateY(-2px)` + `--shadow-item-hover` + 썸네일 scale 1.04
- [x] `__label` 12px / line-clamp 2 / `overflow-wrap:anywhere` (모바일 11px), `__meta` padding `0 10px 10px` (모바일 10px), feature 내 label 12px 재정의 삭제

### 기능 4: 타이포·여백·접근성
- [x] 모토: item opacity/transform/`.is-visible` 삭제, transition border/box-shadow만, radius `--radius`, back radius `--radius`, front/back `-webkit-backface-visibility`. word 11/10px(ls 0.8px), kr 11/10px, back-text 12/11px
- [x] 375px 뷰포트에서 "CONFRONTATION" 10px 한 줄 수용 확인 (scrollWidth ≤ clientWidth)
- [x] `.profile__bio` padding `var(--card-pad-y) var(--card-pad-x)`, 모바일 `24px 24px` 삭제
- [x] `.profile__dot` brand-text + margin 0 2px, `.profile__action` pill + padding 0 18px, `--primary` brand-14/brand-40
- [x] `html.light .profile__name`·`.modal-name`의 `#1a1a2e` → `var(--text)`
- [x] 탭: padding 10px 16px, gap 6px, 13px, overflow hidden 삭제, 아이콘 16px, 모바일 padding 14px 16px, 521px 확장 규칙 유지
- [x] `.category-section` transition 삭제
- [x] `.section-label`: sans 12px/500/ls 0.2px/none, clip-path·translateY·`::before` 삭제, `.category-header` 안 재정의 삭제 (base margin/padding 0), reduced-motion `clip-path` 삭제
- [x] `.theme-toggle` hover translateY(-1px) + `--shadow-card-hover`, 해 아이콘 `--theme-sun` (라이트 rgb(168,101,15) 확인)
- [x] `.ripple` + `ripple-expand` + `addRipple` 삭제, 클릭은 `() => select(btn)`, JSDoc "페이드 전환 + 섹션 필터 초기화". `select()`·키보드 로직 무변경
- [x] `.modal-box` radius `--radius-lg`, `.modal-close` `type="button"` + `<i aria-hidden>`
- [x] 푸터: gap 8px, 40×40 원형 타깃(측정 40×40), hover brand-text/focus-pill-bg/border/translateY(-2px), filter·scale 삭제, `<i>` 4개 aria-hidden
- [x] App Store 카드 `link-card--app` 제거
- [x] 999px 리터럴 4곳 → `var(--radius-pill)` (남은 `999px`는 토큰 정의 1건)
- [x] 캐시 버전 `?v=20260923-1` (css/js)
- [x] reduced-motion: 지정 항목 삭제, `.hero .profile__motto` → `.hero .profile__motto-item`, 추가 4건 (card animation none, `::after` none, 아바타 링 none, 푸터 hover transform none) — Playwright reducedMotion 컨텍스트에서 전부 적용 확인

### docs 동기화
- [x] `docs/components.md`: 프로필 행 JS → `initTyping()` `initNameShine()`, "그 외 컴포넌트"에 카드 스포트라이트/`initCardSpotlight()` 한 줄
- [x] `docs/css-rules.md` §5 `--card-glow` 방식 예시, §7 `card-rise` (backwards) 한 줄

## SPEC "주의사항" 검증 결과
- grep 0건 (index.html + style.css + main.js 합산): profile__halo 0, profile__hint 0, scroll-hint 0, scroll-bounce 0, halo-pulse 0, dot-pulse 0, fadeInUp 0, gradient-shift 0, avatar-ring-breathe 0, ripple 0, addRipple 0, initMouseParallax 0, initHeroParallax 0, initMottoReveal 0, feat-counter 0, link-card--app 0, need-feat-sumin 0, cover-need 0 — **전부 0건**
- 미정의 `var(--*)`: 스크립트로 style.css 전체 대조 → 미정의는 `--spot-x`, `--spot-y`뿐이며 둘 다 fallback(`50%`, `0%`) 보유 + JS가 설정. `--card-glow`는 `.link-card` 안에서 정의. **실질 0건**
- game.css `var()` 참조 목록에 삭제 대상 없음 (`:root` 기존 변수 삭제·값 변경 없음 — 추가만)
- 히어로 직계 애니메이션 요소(eyebrow, motto-item)에 hover transform 없음
- node --check main.js 통과, CSS 중괄호 균형 0

## npm run ui-check
- **10/10 통과** (테마 토글, 카테고리 필터 4종, 모달 열기/닫기, 링크카드 href, 모바일 520px, 콘솔 에러 0건) — 최종 수정 후 재실행 결과

## 필수 연동 변경 (SPEC 문구 외, SPEC 기능 동작에 필요)
1. **featured-item__label 아래 여백을 margin으로**: SPEC대로 `padding:8px 10px` + `line-clamp:2`를 적용하니 `overflow:hidden`이 padding 경계에서 잘라 3번째 줄 윗부분("sumin)", "(Prod.SLOTH)")이 비쳐 보였다(스크린샷 확인). `padding: 8px 10px 0; margin-bottom: 8px;` (모바일 `6px 8px 0` + `margin-bottom: 6px`)로 시각 간격은 같게 유지하고 누수 제거.
2. **reduced-motion 특이도 보정**: SPEC의 `.profile__avatar-wrap::before`(0,1,1)·`.footer__social a:hover`(0,2,1)는 중첩 베이스 규칙 `.profile .profile__avatar-wrap::before`(0,2,1)·`.footer .footer__social a:hover`(0,3,1)에 져서 무효가 된다. `.profile .profile__avatar-wrap::before`, `.footer .footer__social a:hover`로 작성 (실측 ring animation `none` 확인).
3. **모바일 탭 중복 규칙 정리**: base가 13px·아이콘 16px로 바뀌어 모바일 블록의 `font-size:13px`, `.category-nav__icon 16px`가 동일값 중복이 되어 삭제 (SPEC A17 "모바일 중복 규칙" 취지).
4. 모바일 블록에 `.profile__motto-back-text { font-size: 11px }` 추가 — SPEC §3-2 "motto-back-text 12px(모바일 11px)" 명시분.

## 하고 싶었으나 범위 외로 미구현
- reduced-motion의 기존 `.profile__action:hover { transform:none }`도 베이스 `.profile .profile__action:hover`(0,3,0)에 져서 무효다. 기존 결함이며 SPEC에 없어 손대지 않음.
- 1280×800 데스크톱에서 히어로 콘텐츠 높이가 885px이라 탭(y≈901)이 첫 화면 바로 아래에 걸린다. SPEC 패딩 값은 그대로 적용했고, 더 줄이려면 SPEC에 없는 간격 변경이 필요해 보류.

## 패턴 준수 확인
- BEM 네이밍: 준수 — 신규 `profile__eyebrow-dot`, `profile__eyebrow-arrow` (Block__element)
- CSS 변수 사용: 준수 — 신규 색상 토큰(`--bg-item`, `--theme-sun`, `--shadow-*`)은 `:root`/`html.light` 양쪽 정의, 새 하드코딩 색상 없음. `#1a1a2e` 2건 제거
- CSS 네이티브 중첩: 준수 — `&:has()`, `&.is-visible:nth-child()`, `&::after`, `&:nth-child()` 모두 `&` 문법, `&--` 사용 없음
- 반응형 520px: 대응 — 알약 10px, 모토 10/10/11px, featured 11/10px, hero padding, 탭 padding. 375px 가로 오버플로 없음
- reduced-motion: 대응 — card-rise·스포트라이트·아바타 링·모토 항목·푸터 hover 정리, JS `initCardSpotlight`도 reduce 시 조기 반환
- esc()/safeUrl(): 해당 없음 (신규 외부 데이터 삽입 없음, 정적 HTML). 기존 fetch 경로 무변경
- 가드 클래스: 적용 — `initCardSpotlight` (`!root`, hover:none, reduced-motion, touch)
- DOMContentLoaded 등록: `safeInit(initCardSpotlight, 'initCardSpotlight')` 등록, 삭제 3건 등록 해제
- -webkit-backdrop-filter: 알약에 함께 작성, `-webkit-backface-visibility`도 모토 front/back에 추가
- 파일 간 정합성: `profile__eyebrow(-dot/-arrow)`, `featured-item__meta/__source`, `.page-wrapper`, `.link-card`, `--spot-x/y` — HTML·CSS·JS 일치
