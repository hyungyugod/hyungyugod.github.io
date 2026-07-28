# 자체 점검 — 커버밴드 · ROUTINE 제거 + 전체 링크트리 단일화

전략: Case A — 이유: QA 가중 7.05/10 합격·P0 유입 0건이라 방향은 유지하고, 지시된 P1 1건 + 승인된 P2 4건만 정밀 적용했다.

검증 방식: 정적 grep + **Playwright 실측**(로컬 `python -m http.server 8000`, 375·520·521·560·640·700·760·800·810·820·825·830·834·836·838·840·845·850·899·900·1024·1280·1600px / 다크·라이트·reduced-motion). 아래 수치는 전부 computed style·getBoundingClientRect 실측값이다.

---

# R2 — QA 지시 반영 내역 (수정 전/후 실측)

## [P1-1] 모바일 토큰 이관 유실 2건 복원 — **완료**

`assets/css/style.css` `@media (max-width: 520px)` `:root` 토큰 블록 바로 아래에 추가:

```css
  /* 토큰으로 표현되지 않는 모바일 전용 값 (축소된 아이콘 박스에 맞춘 글리프/간격) */
  .link-card {
    & .link-card__header { gap: 12px; }
    & .link-card__icon   { font-size: 18px; }
  }
```

**375px computed style 실측**

| 항목 | HEAD | R1 (수정 전) | R2 (수정 후) | 판정 |
|---|---|---|---|---|
| `.link-card__header` **gap** | 12px | **14px** ← 회귀 | **12px** | 복원 |
| `.link-card__icon` **font-size** | 18px | **20px** ← 회귀 | **18px** | 복원 |
| `.link-card__header` padding | 16px 18px | 16px 18px | 16px 18px | 유지 |
| `.link-card__icon` width | 40px | 40px | 40px | 유지 |
| `.link-card__icon` border-radius | 10px | 10px | 10px | 유지 |

**경계 누수 없음 확인** — 520px: `gap 12px / font-size 18px`, 521px: `gap 14px / font-size 20px`(데스크톱 값). 미디어쿼리 밖으로 새지 않는다.

---

## [P2-2 + P2-3] `.category-nav` 1행 알약 유지 — **완료 (조건 1건 조정, 근거 아래)**

`@media (min-width: 900px)`의 `flex-wrap: wrap` 3줄을 **삭제**하고, `@media (max-width: 520px)` nav 블록 바로 아래에 신설:

```css
/* 6개 탭 합계(802px)가 링크 컬럼(≤760px)보다 넓다.
   컬럼 밖으로 확장시켜 알약 1행을 유지하되, 뷰포트를 넘지 않도록 상한을 둔다.
   상한에 걸리는 좁은 폭에서는 기존 가로 스크롤 동작이 그대로 유지된다. */
@media (min-width: 521px) {
  .category-nav {
    max-width: calc(100vw - 32px);
    left: 50%;
    transform: translateX(-50%);
  }
}
```

### 실측 대조 (nav 폭 / 높이 / 행수 / 마지막 탭 잘림 / 뷰포트 초과)

| vw | R1 navW/navH/rows/clip | R2 navW/navH/rows/clip | R2 navLeft→navRight | 문서 가로 오버플로 |
|---|---|---|---|---|
| 521 | 473 / 56 / 1 / **잘림** | 489 / 56 / 1 / 잘림 | 16→505 | 0 |
| 560 | 512 / 56 / 1 / **잘림** | 528 / 56 / 1 / 잘림 | 16→544 | 0 |
| 640 | 592 / 56 / 1 / **잘림** | 608 / 56 / 1 / 잘림 | 16→624 | 0 |
| 700 | 632 / 56 / 1 / **잘림** | 668 / 56 / 1 / 잘림 | 16→684 | 0 |
| 800 | 632 / 56 / 1 / **잘림** | 768 / 56 / 1 / 잘림 | 16→784 | 0 |
| 825 | 632 / 56 / 1 / **잘림** | 793 / 56 / 1 / 잘림 | 16→809 | 0 |
| **830** | 632 / 56 / 1 / **잘림** | 798 / 56 / 1 / **정상** | 16→814 | 0 |
| 850 | 632 / 56 / 1 / **잘림** | 804 / 56 / 1 / 정상 | 23→827 | 0 |
| 899 | 632 / 56 / 1 / **잘림** | 804 / 56 / 1 / 정상 | 48→851 | 0 |
| 900 | 696 / **102** / **2행** / 정상 | 804 / **56** / **1행** / 정상 | 48→852 | 0 |
| 1024 | 696 / **102** / **2행** / 정상 | 804 / **56** / **1행** / 정상 | 110→914 | 0 |
| 1280 | 696 / **102** / **2행** / 정상 | 804 / **56** / **1행** / 정상 | 238→1042 | 0 |
| 1600 | 696 / **102** / **2행** / 정상 | 804 / **56** / **1행** / 정상 | 398→1202 | 0 |

- **P2-2 해소**: 900~1600px 전 구간에서 nav 높이 `102px(2행, 2행에 Social 1개만) → 56px(1행)`. `border-radius: 999px` 알약 형태 복귀 확인(다크/라이트 스크린샷).
- **P2-3 해소(830px~)**: 잘림 경계가 `899px 이하 전 구간` → `829px 이하`로 내려갔다. 830~899px 구간이 새로 정상화됐다.
- 전 구간 `document.scrollWidth - innerWidth === 0` (가로 페이지 오버플로 0).
- nav 중심 = 뷰포트 중심 (예: 1280px에서 238+804/2 = 640 = 1280/2).

### 조건 조정 근거 — `max-width: none` → `max-width: calc(100vw - 32px)` (실측 기반)

QA가 제시한 블록을 그대로 `min-width: 521px`에 적용하면 **좁은 구간에서 뷰포트를 넘어간다.** 탭 6개의 자연 폭(`nav.scrollWidth`)이 **802~804px**로 실측됐기 때문이다:

- 560px 뷰포트에서 `max-width: none` + `width: max-content` → nav 804px가 560px 뷰포트 중앙에 놓여 **left ≈ −122px / right ≈ 682px**. 가로 페이지 오버플로가 생기고, 왼쪽으로 밀려난 앞쪽 탭들은 `scrollLeft`가 음수가 될 수 없어 **도달 불가**가 된다.
- 즉 QA가 검증한 900/1024/1280/1600px에서는 안전하지만, 지시받은 521~899px까지 낮추려면 상한이 반드시 필요하다.

**대안 비교 후 선택**
1. 브레이크포인트를 `min-width: 836px`으로 올리고 QA 블록 원형 유지 → 836이라는 숫자가 **탭 라벨 텍스트 길이에 종속**된 매직넘버라, 라벨 한 글자만 바뀌어도 조용히 깨진다. 521~835px은 개선 0.
2. **(채택)** 조건은 지시대로 `min-width: 521px`로 두고 폭에 상한을 건다 → 규칙이 스스로 한계를 지켜 매직넘버가 없다.
   - 뷰포트 ≥ 830px: 상한(≥798px) ≥ 콘텐츠 → nav = `max-content` 804px, 1행, 6탭 전부 노출, 뷰포트 초과 없음.
   - 뷰포트 521~829px: 상한이 걸려 nav = `100vw − 32px`. base의 `overflow-x: auto` + `justify-content: flex-start`가 그대로 살아 **기존 가로 스크롤 동작 유지**. 게다가 폭이 넓어져(700px: 632→668) 탭이 한 개 더 보인다.

**QA 블록에서 의도적으로 뺀 3줄과 그 이유**
- `justify-content: center` — 오버플로 상태의 스크롤 컨테이너에서 center 정렬은 앞쪽 항목을 `scrollLeft` 음수 영역으로 밀어내 **도달 불가**로 만든다. 반대로 `width: max-content`인 넓은 구간에서는 남는 공간이 없어 **아무 효과가 없다**. base의 `flex-start` 유지가 정답.
- `overflow: visible` — 521~829px의 가로 스크롤 폴백을 죽인다. base `overflow-x: auto` 유지. 넓은 구간에서는 nav 폭 == 콘텐츠 폭이라 스크롤바도 안 생기고 잘리지도 않는다(위 표 clip=정상).
- `flex-wrap: nowrap` / `width: max-content` / `position: relative` — **이미 base `.category-nav`에 선언**되어 있어 재선언이 중복이다.

**마지막 탭 도달성 실측**: `nav.scrollLeft = 99999` 후 6번째 탭이 nav 우측 경계 안으로 들어오는지 확인 → 375 / 520 / 521 / 700px 전부 `true`. 잘리는 구간에서도 스크롤로 100% 도달 가능.

### 520px 이하 모바일 — 무변경 확인

| vw | scroll-snap-type | btn scroll-snap-align | navW | 판정 |
|---|---|---|---|---|
| 375 | `x mandatory` | `center` | 343 (R1과 동일) | 무변경 |
| 520 | `x mandatory` | `center` | 488 (R1과 동일) | 무변경 |
| 521 | `none` | `none` | 489 | 데스크톱 규칙 진입 |

신설 규칙이 `min-width: 521px` 안에 있어 모바일에는 **적용 자체가 불가능**하다. `@media (max-width: 520px) .category-nav` 블록은 한 글자도 건드리지 않았다.

### 인디케이터 추종 정확도 (0.45s 스프링 트랜지션 종료 후 측정)

6개 탭 × 8개 뷰포트(375·520·560·700·830·900·1280·1600) = 48회 클릭 실측. 활성 버튼 대비 인디케이터의 좌표·크기 오차:

```
IND 1280  all[dx=0 dy=0 dw=-0.3 dh=0]  writing[dx=-0.3 dy=0 dw=-0.3 dh=0]  music[dx=0.4 dy=0 dw=-0.1 dh=0]
          game[dx=0.3 dy=0 dw=-0.2 dh=0]  app[dx=0.1 dy=0 dw=-0.3 dh=0]  social[dx=-0.3 dy=0 dw=-0.3 dh=0]
```

- 전 구간 최대 오차 **|dx| ≤ 0.4px, |dw| ≤ 0.4px, dy = 0, dh = 0** (서브픽셀 반올림 범위).
- `dy = 0`은 1행 유지의 교차 증거다(R1의 2행 상태에서는 2행 탭이 `translate(295px, 52px)`였다).
- `offsetLeft/offsetTop` 기반이라 nav의 `transform: translateX(-50%)`에 영향받지 않음을 실측으로 확인.

---

## [P2-1] 로딩 스켈레톤 복구 — **완료**

`assets/css/style.css` `.featured-item` 내부 `&--loading` → **`&.featured-item--loading`** (1줄). 네이티브 CSS 중첩에는 SCSS식 문자열 연결이 없어 규칙 전체(약 85줄)가 무효였던 문제로, R1에서 `&.link-card--feature`로 해결한 것과 동일한 사안이다.

**Velog/GitHub 응답을 pending 상태로 묶어 초기 로딩 화면을 고정시킨 뒤 실측**

| 항목 | 수정 전 (QA 실측) | 수정 후 (다크) | 수정 후 (라이트) |
|---|---|---|---|
| 규칙 적용 여부 | **미적용** | 적용 | 적용 |
| `pointer-events` | `auto` | `none` | `none` |
| 번호 뱃지 `::before` | `flex` (노출) | `none` | `none` |
| `__label` color | `rgb(170,170,170)` → **"로딩 중..." 원문 노출** | `rgba(0,0,0,0)` (투명) | `rgba(0,0,0,0)` |
| 썸네일 셰이머 `::after` | — | `shimmer-sweep / 2s` | `shimmer-sweep / 2s` |
| 썸네일 글로우 `::before` | — | `pulse-glow / 2.2s` | `pulse-glow / 2.2s` |
| 스켈레톤 바 1 / 2 | — | 158.7×8px r4 / 102.7×8px r4 | 동일 |
| 썸네일 배경 | 회색 박스 | `rgb(9,8,15)` | `rgb(232,231,236)` |
| 순차 딜레이(3개) | — | `0s, 0.15s, 0.3s` | 동일 |

대상 요소 6개(Velog 3 + GitHub 3) 전부 적용. 스크린샷에서 셰이머 스윕과 스켈레톤 바 2줄이 실제로 보이고 "로딩 중..." 텍스트는 사라졌다.

---

## [P2-4] `.modal-info__icon` 5건 `aria-hidden="true"` — **완료**

`index.html` 498 / 502 / 507 / 512 / 517행. 조상에 접근가능 이름이 없어 Font Awesome PUA 글리프가 낭독될 수 있던 5건에만 추가했다.

- 적용 후 `modal-info__icon` 내부 `<i>` 중 `aria-hidden` 보유 = **5 / 5**.
- 지시대로 **미적용 유지 8건**: 테마토글 ×2(44, 45), 스크롤힌트 셰브론 ×1(125), 푸터 ×4(474~477), 모달 닫기 ×1(488). 전부 부모 `<button>`/`<a>`에 `aria-label`이 있거나 이번 지시 범위 밖이다.
  - ※ QA가 센 12건에는 125행 스크롤힌트 셰브론이 빠져 있어 실제 잔여는 7건이 아닌 8건이다. 지시가 "5건에만"이었으므로 125행도 건드리지 않았다.

---

## [P2-8] 테스트 하네스 셀렉터 수정 — **완료**

`tests/ui-check.js:187`
`page.locator('.profile__btn.js-open-profile')` → `page.locator('button.js-open-profile').first()`

**`npm run ui-check` 원본 stdout (수정 후)**

```
[PASS] 테마 토글: 다크→라이트→다크 전환 정상
[PASS] 카테고리 필터 (writing): 4개 섹션 숨김 확인
[PASS] 카테고리 필터 (music): 4개 섹션 숨김 확인
[PASS] 카테고리 필터 (social): 4개 섹션 숨김 확인
[PASS] 카테고리 필터 (all): 0개 섹션 숨김 확인
[PASS] 프로필 모달 열기: #profileModal.is-open 추가 확인
[PASS] 프로필 모달 닫기: is-open 클래스 정상 제거
[PASS] 링크카드 href 유효성: 10개 링크 모두 유효
[PASS] 모바일 520px 뷰포트: 핵심 요소 3개 모두 visible
[PASS] 콘솔 에러: 0건

결과: 10/10 통과
```

**8/9 → 10/10**. 상시 오탐 FAIL 제거 확인.

---

## [P2-7 일부] 참조 0 변수 / 낡은 주석 정리 — **완료**

- `:root`에서 `--platform-velog-30`, `--platform-github-30` 삭제.
  - 삭제 전 참조 확인: `var(--platform-velog-30)` **0건**, `var(--platform-github-30)` **0건** (html/css/js 전수 grep, `.claude/worktrees` 제외).
  - 삭제 후 런타임 `getComputedStyle(html).getPropertyValue()` → 양쪽 다 빈 문자열(= 미정의). 다크·라이트 양 테마에서 미정의 `var()` 참조로 인한 스타일 붕괴 없음.
  - `--platform-brunch-30`은 지시 범위 밖이라 **보존**(`:root` + `html.light` 2곳 선언 유지).
- `index.html:272` `<!-- Melon (먼저) -->` → `<!-- Melon -->`.

---

## 절대 손대지 말라고 지시받은 항목 — 무변경 확인

| 대상 | 이번 라운드 변경 |
|---|---|
| `safeUrl()` / `esc()` / `fetchVelog()` / `fetchGitHub()` 본문 | **0줄** (`assets/js/main.js` 파일 전체가 이번 라운드 0줄 변경) |
| `#profileAvatar` role / keydown (P2-5) | 무변경 |
| ARIA tablist 확장 (P2-6) | 무변경 |
| `docs/` 전체 | 무변경 |
| `.profile__motto` / `.profile__bio` | 무변경 |
| `data/streaks.json` | 무변경 |
| `@media (max-width: 520px) .category-nav` (scroll-snap) | 무변경 |
| QA_REPORT에 없는 개선 · 신규 시각효과/애니메이션/컴포넌트 | **0건 추가** |

**이번 라운드 변경 총량**: `style.css` 1,899 → **1,906줄**(+7), `index.html` 527줄(속성/주석만, 줄 수 불변), `tests/ui-check.js` 1줄, `main.js` **0줄**.

## R2 회귀 점검

- 콘솔 에러 **0건** — dark-1280 / light-1280 / dark-375 / reduced-motion-1280 4개 컨텍스트 전부.
- CSS 중괄호 균형 **342 / 342**.
- SCSS식 `&--` 문자열 연결 잔존 **0건** (`&--loading` 해소로 파일 전체에서 사라짐 → 표기 이원화 문제 종료).
- `.link-card` 10개 렌더, reduced-motion에서 `is-visible` 10/10 즉시 적용.
- 라이트 테마 `--glow-naver: rgba(3,199,90,0.15)` / 다크 `0.18`, `--focus-pill-bg` 라이트 `rgba(0,0,0,0.04)` / 다크 `rgba(255,255,255,0.05)` 정상.
- 375px `document.scrollWidth === innerWidth === 375` (가로 오버플로 0).

---

# R1 구현 기록 (참고 — 위 R2 수정이 반영된 최종 상태 기준)

## SPEC 기능 체크

- [x] **기능 1: 두 섹션 완전 제거** — `.cover-band`(마크업·CSS 59줄·클릭 IIFE), `.streaks`(마크업·CSS 379줄·`fetchStreaks`·`bindStreakFlip`·보강 IIFE) 전부 삭제. 3개 파일에서 `cover-band`/`streak` 문자열 **0건**
- [x] **기능 2: 6종 카드 → `.link-card` 단일화** — `focus-card`/`platform-showcase`/`music-showcase`/`game-showcase`/`social-card` 5종 폐기, 3티어 `.link-card` 10개로 재구성. 링크 손실 0건(QA가 HEAD diff로 교차 검증)
- [x] **기능 3: 공용 토큰 기반 리듬** — `--card-*` 6종 + `--stack-gap` + `--glow-naver` 추가, 모바일은 `@media(max-width:520px) :root{}` 한 블록으로 재정의. **R2에서 이관 누락 2건(header gap / icon font-size) 복원 완료**
- [x] **기능 4: 기존 기능 100% 보전** — 필터·자동갱신·모달·테마 전부 실측 통과

### 마크업 재구성 결과
| 티어 | 카드 | 개수 |
|---|---|---|
| A 프리뷰 행 | Velog · GitHub · Brunch · Melon · SoundCloud · App Store | 6 |
| B 피처 행 | Game (`.link-card--feature`) | 1 |
| C 단독 행 | Instagram · 지식산책 · 네이버 | 3 |

`.category-nav` 탭 순서 재정렬 완료 → `tabOrder = all, writing, music, game, app, social`, `domOrder = writing, music, game, app, social` (일치)

## SPEC §7 코드 검증

- [x] `cover-band`·`streak`·`music-showcase`·`focus-card`·`focus-board`·`focus-grid`·`platform-showcase`·`game-showcase`·`social-card`·`social-grid`·`quick-stats`·`profile__stat-`·`links--section`·`musicCover`·`KIND_BY_INDEX` → 3개 파일 **전부 0건**
- [x] `--streak-*` 0건 / `--focus-shadow` 0건 / `--focus-inset` 0건 / **`--focus-pill-bg` 3건 보존**(`:root` + `html.light` + `.profile__action`)
- [x] `main.js` DOMContentLoaded **정확히 12개**, SPEC 명시 순서와 일치
- [x] `initScrollReveal`/`applyFilter` 모두 `REVEAL_SELECTOR` 사용 (선언 1 + 사용 2)
- [x] CSS SCSS 문법 0건, 중괄호 균형, 미정의 `var()` 참조 0건
- [x] 하드코딩 색상 신규 추가 0건
- [x] `!important` 3건 — 전부 reduced-motion 블록(규칙상 허용 예외)
- [x] `backdrop-filter` 7건 = `-webkit-backdrop-filter` 7건
- [x] 인라인 `style=""` 0건, `onclick` 0건
- [x] `target="_blank"` 31 / `rel="noopener"` 31 (누락 0)
- [x] `#velog-items`/`#github-items`가 `.link-card__items`에 부착 → 자동 갱신 정상
- [x] ≥900px에서 Melon/SoundCloud 카드 정상 노출
- [x] `.js-open-profile` 2곳 유지 → 모달 정상 개폐

### 토큰 적용 실측 (computed style, R2 반영 후)

| 항목 | 데스크톱(≥900) | 모바일(≤520) |
|---|---|---|
| `.link-card__header` padding / gap | `20px 24px` / `14px` | `16px 18px` / **`12px`** |
| `.link-card__icon` | `44px` / r`12px` / fs `20px` | `40px` / r`10px` / fs **`18px`** |
| `.link-card__divider` margin | `0px 24px` | `0px 18px` |
| `.link-card__items` padding | `16px 24px 20px` | `12px 18px 16px` |
| `.links` gap | `14px` | `12px` |
| `.category-section` margin-bottom | `40px` | `28px` |
| `.page-wrapper` | `760px` / `16px 32px 96px` | `20px 16px 56px` |
| 피처 행 썸네일 | 644×403 = **16:10** | ratio 1.600 |

→ 5개 선언 전부 HEAD 값과 일치. (R1에서는 패딩 3건만 일치했고 gap·font-size 2건이 회귀했었다 — QA P1-1 지적이 정확했다.)

---

## 패턴 준수 확인

- **BEM 네이밍**: 준수. 신규 클래스는 `.link-card--feature`, `.icon--game` 2개뿐
- **CSS 변수 사용**: 준수. 신규 색상은 `--glow-naver` 1개를 `:root`+`html.light`에 선언 후 참조. 하드코딩 0건
- **CSS 네이티브 중첩**: 준수 (`&`, `&.class`, `&:has()`, `& .child`). **R2에서 `&--loading` 1건을 `&.featured-item--loading`으로 정정해 SCSS식 연결 표기 0건 달성**
- **기존 `:root` 변수**: SPEC 명시 승인 3건 + QA 승인 2건(`--platform-velog-30`, `--platform-github-30`) 삭제. 그 외 무변경
- **반응형 520px**: 대응 (토큰 재정의 1블록 + `.link-card` 모바일 2선언 + `.featured-item__meta` 미세조정)
- **reduced-motion**: 대응 (셀렉터가 살아있는 클래스만 참조, 콘솔 0건 실측)
- **esc()/safeUrl()**: `fetchVelog`/`fetchGitHub` 본문 **R1·R2 통틀어 0줄 수정** → 보안 처리 원형 유지
- **가드 클래스**: 기존 함수 무변경으로 유지
- **DOMContentLoaded 등록**: 12개
- **-webkit-backdrop-filter**: 7/7 짝 유지
- **파일 간 정합성**: HTML 클래스 ↔ CSS 셀렉터 ↔ JS 셀렉터 전부 일치 (실측 렌더로 교차 확인)
- **미디어쿼리 구성**: `max-width:520px` ×2, `prefers-reduced-motion` ×2, `min-width:900px` ×1, **`min-width:521px` ×1(R2 신설)**. `docs/css-rules.md` §8의 "단일 브레이크포인트"에 대한 예외이나, QA_REPORT P2-3의 명시 지시("`min-width: 521px`로 낮춰")에 따른 것이다.

## R1 판단 기록 (QA가 2건 모두 "허용·기록만"으로 판정)

**① `&--feature` → `&.link-card--feature`** — 네이티브 CSS 중첩에 SCSS식 문자열 연결이 없어 SPEC §2-D 표기 그대로는 무효. QA가 `&--loading`을 프로브로 삼아 무효임을 독립 실증했고, R2에서 그 `&--loading`까지 정정해 파일 전체 표기를 일원화했다.

**② `.category-nav` 데스크톱 대응** — R1의 `flex-wrap: wrap`은 잘림은 막았으나 2행 고아 행을 만들었다. R2에서 위 P2-2/P2-3 방식으로 교체 완료.
※ R1 SELF_CHECK의 "6번째 탭이 잘려 **클릭 불가**"는 QA 지적대로 부정확했다. 정확히는 `overflow-x: auto`라 가로 스크롤로 도달은 가능하고, 실제 결함은 "스크롤바가 `display:none`이라 데스크톱에 어포던스가 전혀 없다"였다.

**③ 장식 아이콘 `aria-hidden`** — R1에서는 재구성 대상 링크 섹션에만 적용. R2에서 `.modal-info__icon` 5건 추가.

**④ `:root` 주석 `/* Focus Board */` → `/* Action pill (.profile__action) */`** — 참조가 끊긴 목록의 동기화 정리.

## 하고 싶었으나 범위 외로 미구현

- **`safeUrl()` href 속성 인젝션 차단** (QA 참고 P0, 사전 존재) — `safeUrl()`이 정규화된 `u.href`가 아닌 원본 문자열을 반환하고 템플릿에 `esc()`가 없다. **이번 지시가 "절대 손대지 말 것"으로 명시**해 미구현. 별도 스프린트 최우선 발주 필요
- **`#profileAvatar` role="button" + keydown** (P2-5) — 별도 스프린트 지정
- **ARIA tablist 확장** (`aria-controls` / `role="tabpanel"` / roving tabindex, P2-6) — 별도 스프린트 지정
- **`docs/css-rules.md` §1의 `&--variant` 예시 정정** — 현재 문서가 네이티브 CSS에서 무효인 패턴을 "올바른 패턴"으로 권장 중이라 다음 작업자가 같은 함정에 빠진다. `docs/` 수정 금지라 미구현
- **`docs/components.md` 컴포넌트 표 갱신** (`.social-grid` 등 삭제된 항목) — `docs/` 수정 금지
- **`--platform-brunch-30` 정리** — 이번 지시가 velog/github 2건만 승인
- **죽은 셀렉터 `.hero__scroll-hint`/`.hero__scroll-arrow`, 미정의 클래스 `.link-card--app`/`.profile__dot`** (전부 HEAD에도 존재) — 지시 범위 밖
- **521~829px에서 6탭 전부 노출** — 탭 자연 폭 802~804px가 물리적으로 들어가지 않는다. 라벨 축약·아이콘 전용 모드 등은 SPEC에 없는 새 디자인 결정이라 미구현. 해당 구간은 가로 스크롤로 전 탭 도달 가능함을 실측 확인
- **`data/streaks.json` 삭제** — 사용자 개인 데이터. 코드 참조만 0으로 만들고 파일 보존. 필요 시 `git rm data/streaks.json`
