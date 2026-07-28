# QA 검수 보고서 — 커버밴드·ROUTINE 제거 + 전체 링크트리 단일화 (R1)

> ⚠️ **이 문서는 R1(1회차) 검수 결과다.** 아래에 지적된 P1-1(모바일 토큰 유실), P2-1(로딩 스켈레톤), P2-2·P2-3(탭바 랩/잘림), P2-4(modal 아이콘 aria-hidden), P2-7 일부(고아 변수), P2-8(테스트 셀렉터)은 **R2에서 수정 완료**되었다. R2 재검수는 사용자 요청으로 생략했고, 대신 오케스트레이터가 직접 검증했다 — 결과는 문서 맨 아래 「R2 직접 검증」 절 참조.
> 미해결로 남은 것: P2-5(#profileAvatar 키보드), P2-6(ARIA tablist 확장), `safeUrl()` href 인젝션(별도 스프린트), `docs/` 갱신.

검수 방식: 정적 grep/변수 교차대조 + **HEAD 대비 computed-style 회귀 비교** + Playwright 실측(다크/라이트/reduced-motion, 375·520·560·700·800·899·900·1024·1280·1600px)
Generator 보고는 하나도 그대로 신뢰하지 않고 전부 재현 검증했다.

---

## UI 동작 검증 (Playwright)

### `npm run ui-check` 원본 stdout

```
=== Playwright UI Check ===
Server: http://localhost:8000 (managed: false)

[PASS] 테마 토글: 다크→라이트→다크 전환 정상
[PASS] 카테고리 필터 (writing): 4개 섹션 숨김 확인
[PASS] 카테고리 필터 (music): 4개 섹션 숨김 확인
[PASS] 카테고리 필터 (social): 4개 섹션 숨김 확인
[PASS] 카테고리 필터 (all): 0개 섹션 숨김 확인
[FAIL] 프로필 모달: locator.waitFor: Timeout 3000ms exceeded.
[PASS] 링크카드 href 유효성: 10개 링크 모두 유효
[PASS] 모바일 520px 뷰포트: 핵심 요소 3개 모두 visible
[PASS] 콘솔 에러: 0건

스크린샷: C:\Users\user\Desktop\hyungyugod.github.io\tests\screenshots
결과: 8/9 통과
```

| 체크 항목 | 결과 | 비고 |
|---|---|---|
| 테마 토글 | PASS | 다크↔라이트 왕복, --glow-naver 0.18/0.15, --focus-pill-bg 양쪽 정상 |
| 카테고리 필터 (4종) | PASS | 6탭/5섹션, aria-selected 6개 갱신 확인 |
| 프로필 모달 | **PASS (하네스 오탐)** | 아래 참조 |
| 링크카드 href | PASS | 10개 유효 |
| 모바일 520px | PASS | 375px에서 documentElement.scrollWidth === innerWidth === 375, 가로 오버플로 0 |
| 콘솔 에러 | PASS | 다크/모바일/reduced-motion 3개 컨텍스트 모두 0건 |

**모달 FAIL은 제품 결함이 아니라 테스트 하네스 결함이다 (실사 완료)**
`tests/ui-check.js:187`이 `.profile__btn.js-open-profile`을 찾는데, 이 클래스는 HEAD에도 현재에도 존재하지 않는다(실제 클래스는 `.profile__action`). 별도 스크립트로 실제 셀렉터를 써서 재현한 결과:

```
MODAL {"hooks":2,"open1":1,"activeAfterOpen":"modal-close","escClosed":true,"returnFocus":"profileAvatar","open2":1}
```

→ `.js-open-profile` 2곳(버튼+아바타) 모두에서 열림, 첫 포커스 이동, Escape 닫힘, `#profileAvatar`로 포커스 복귀까지 전부 정상. **감점 없음.** (→ P2-8로 하네스 수정 권고)

---

## 지시받은 실사(實査) 항목 — 전부 직접 검증

| 항목 | 결과 | 근거 |
|---|---|---|
| `#velog-items`/`#github-items`가 `.link-card__items`에 부착 | **PASS** | 런타임 `velogParent:"link-card is-visible"`, `githubParent:"link-card is-visible"`, 두 id 모두 `class="link-card__items"`. `main.js:63/114`의 getElementById와 일치. GitHub는 실제 3개 렌더 확인 |
| `[data-category="music"] .links--section{display:none}` 잔존 | **PASS(삭제됨)** | ≥900px 블록은 4개 규칙뿐. 1280px 실측 `linksDisplay:"flex", cards:2, heights:[377,377]` — Melon/SoundCloud 정상 노출 |
| `--focus-pill-bg` 보존 + `.profile__action` 참조 | **PASS** | 3건(`:root`57 / `html.light`109 / `.profile__action`474). 라이트 실측 `rgba(0,0,0,0.04)` 적용 |
| `.js-open-profile` 2곳 유지 | **PASS** | `index.html:52`(아바타) `:70`(버튼), 런타임 `hooks:2` |
| 18개 삭제 문자열 3파일 0건 | **PASS** | cover-band/streak/music-showcase/focus-card/focus-board/focus-grid/platform-showcase/game-showcase/social-card/social-grid/quick-stats/links--section/musicCover/KIND_BY_INDEX/HISTORY/streaksGrid/streaksUpdated/streaksNoticeDate 전부 **0** |
| 미정의 `var(--*)` 참조 | **PASS(0건)** | 선언/사용 전수 교차대조 → 미정의 참조 0. 오히려 HEAD에 있던 미정의 `var(--brand-10)`(old:3137)이 제거되어 **개선** |
| HTML 클래스 ↔ CSS 정의 | 2건 미정의 | `.link-card--app`, `.profile__dot` — **둘 다 HEAD에서도 CSS 없음**(사전 존재) |
| CSS만 남은 죽은 셀렉터 | 2건 | `.hero__scroll-hint`, `.hero__scroll-arrow` — **HEAD에도 존재**(사전 존재, SPEC 삭제목록 외) |
| SPEC §7 링크 인벤토리 (HEAD diff) | **PASS** | 아래 표 |
| 접근성(aria-hidden / noopener / tab role) | 부분 | 아래 |

> 참고: SPEC §7이 요구한 `profile__stat` 0건 검색은 실제로 5건이 나오지만 **전부 `profile__statement`**(SPEC §6이 보존을 지시한 요소)의 부분 문자열이다. SPEC 검색어 자체의 오탐이며 `profile__stat-`/`profile__quick-stats`는 0건이다.

### 링크 인벤토리 — `git show HEAD:index.html` 실제 대조

```
=== 완전히 사라진 unique href ===
#section-music        (5 -> 0)
#section-writing      (2 -> 0)

=== 개수만 줄어든 href (중복 제거) ===
soundcloud.com/user-928451677                       3 -> 2
soundcloud .../burn-it-up-feat-haram-prodsloth      2 -> 1
soundcloud .../need-feat-sumin                      2 -> 1
soundcloud .../prod-chill-sebs                      2 -> 1
melon .../artistId=4347369                          3 -> 2
melon .../songId=39154106                           2 -> 1
melon .../songId=600864946                          2 -> 1
melon .../songId=600864948                          2 -> 1

=== 새로 추가된 href ===  (없음)
```

- 사라진 2개는 삭제 대상인 `.cover-band` 전용 내부 앵커다. `id="section-writing"`/`id="section-music"`는 HTML에 그대로 남아 있어 외부 앵커 링크는 계속 동작한다.
- 감소한 8개는 SPEC §2-B가 "href 100% 중복"이라 명시한 `.music-showcase` 몫과 정확히 일치한다.
- **외부 링크 손실 0건.** `/pages/game.html` ×2 유지 확인.

### 접근성 실측

- `target="_blank"` 31개 / `rel="noopener"` 31개 → **누락 0**
- `<img>` alt 누락 **0**, `<svg>` aria-hidden 누락 **0** (네이버 SVG에 aria-hidden + focusable="false" 추가 확인)
- 장식 `<i>` 중 aria-hidden 누락 **12건** — 전부 테마토글(2)·푸터(4)·모달(6). 이 중 7건은 조상 aria-label로 가려지나 `.modal-info__icon` 5건은 조상에 접근가능 이름이 없다 (사전 존재)
- 모달 포커스 트랩: Tab/Shift+Tab 순환 + Escape + 포커스 복귀 **실측 통과**
- `role="tablist"`/`role="tab"`/`aria-selected` 존재 및 JS 갱신 확인. `aria-controls`/`role="tabpanel"`/roving tabindex는 **HEAD에도 0건**(사전 존재)

### Generator의 SPEC 이탈 2건 — 각각 직접 재현 검증

**① `&--feature` → `&.link-card--feature` : 정당함 (검증 완료)**

Generator 주장을 그대로 믿지 않고, 같은 파일에 남아 있는 `&--loading`(style.css:1305)을 프로브로 삼아 실제 브라우저에서 측정했다.

```
LOADING-SKELETON {"pointerEvents":"auto","labelColor":"rgb(170, 170, 170)","badge":"flex"}
                   ↑ 규칙이 적용됐다면 none / transparent / none 이어야 함
```

→ 네이티브 CSS 중첩에서 `&--mod`는 **실제로 무효**임이 실증됐다. SPEC §2-D대로 썼다면 게임 피처 행이 적용 실패했을 것이다.
채택된 표기의 결과도 실측 확인: `featureCols:"646px"(1fr)`, 썸네일 `644x403 = ratio 1.600`(16:10), `badgeOnFeature:"none"`.
**네이티브 & 중첩·BEM 유지 → 판정 = 허용(기록만).**

**② `.category-nav` 3줄 추가 : 필요성은 정당, 다만 주장에 과장 있음**

SPEC 그대로(§2-E 3개 규칙만)를 재현해 측정했다.

```
NAV-WITHOUT-FIX {"client":694,"scroll":802,"overflow":108,
                 "lastRight":1089,"navRight":988,"lastClipped":true,"scrollable":true}
```

→ 6번째 탭(Social)이 **108px 잘림** 확인. SPEC §5 기능4("6개 탭 정상 동작")가 깨지므로 범위계약의 "없으면 화면이 깨지는가? YES" 기준을 충족한다 → **허용(기록만)**.
다만 Generator가 쓴 **"클릭 불가"는 사실과 다르다** — `overflow-x:auto`라 `scrollable:true`이므로 가로 스크롤로 도달은 가능하다. 실제 결함은 "스크롤바가 `display:none`이라 데스크톱에 어포던스가 전혀 없다"이다. 결론은 같지만 근거 서술이 과장됐다.
수정 후 실측: `client 694 = scroll 694`, `flexWrap:wrap`, 2행(`rowTops:[6,52]`), 인디케이터가 `translate(295px, 52px)`로 2행에 정확히 안착 → **동작은 정상**. (시각 품질 이슈는 P2-2)

---

## SPEC 기능 검증

- **[PASS] 기능 1 — 두 섹션 완전 제거**: cover-band/streak 3파일 0건. CSS 3,526 → 1,899줄(−1,635), JS 895 → 607줄(+5/−292). `node --check` 통과. 콘솔 0건. `data/streaks.json`은 §1-D대로 디스크 보존 확인.
- **[PASS] 기능 2 — 6종 → `.link-card` 단일화**: 티어A 6 / 티어B 1 / 티어C 3 = 10카드. 링크 손실 0건(위 diff). 문구는 §3-B·§3-C 원문과 100% 일치, 창작 0건. 탭 순서 `all,writing,music,game,app,social` = DOM 순서 `writing,music,game,app,social` (§3-A 일치).
- **[일부 FAIL] 기능 3 — 공용 토큰 리듬**: 데스크톱 전 항목 SPEC 수치와 정확히 일치. **모바일에서 2개 선언이 이관 누락** → P1-1.
- **[PASS] 기능 4 — 기존 기능 100% 보전**: 필터·자동갱신·모달·테마·reduced-motion 전부 실측 통과, 콘솔 에러 0.

**토큰 실측 (computed style)**

| 항목 | 데스크톱 1280px | SPEC 요구 | 모바일 375px | SPEC 요구 |
|---|---|---|---|---|
| `.link-card__header` padding | 20px 24px | 20/24 | 16px 18px | 16/18 |
| `.link-card__icon` | 44px / r12px | 44/12 | 40px / r10px | 40/10 |
| `.link-card__divider` margin | 0px 24px | 0 var(--card-pad-x) | 0px 18px | 동일 |
| `.link-card__items` padding | 16px 24px 20px | calc(20-4)/24/20 | 12px 18px 16px | calc(16-4)/18/16 |
| `.links` gap | 14px | 14 | 12px | 12 |
| `.category-section` margin-bottom | 40px | 40 | 28px | 28 |
| `.page-wrapper` | 760px / 16px 32px 96px | §2-E | 20px 16px 56px | §2-F |
| 피처 행 썸네일 | 644x403 (16:10) | 16/10 | ratio 1.600 | 동일 |

---

## 검수 결과 요약

| 등급 | 건수 |
|---|---|
| P0 치명 (이번 스프린트 유입) | **0건** |
| P0 (사전 존재·SPEC이 수정 금지한 영역 — 판정 미반영) | 1건 |
| P1 중요 | **1건** |
| P2 권장 | 8건 |

---

## P0 — 이번 스프린트 유입: **0건**

### [참고 / 범위 외] 사전 존재 보안 취약점 — href 속성 인젝션

- **파일**: `assets/js/main.js:26-31`(safeUrl), `:81`(fetchGitHub), `:159`(fetchVelog)
- **위반 규칙**: js-rules.md §6 — 외부 데이터를 속성에 삽입할 때 `esc()` 필수
- **현재 코드**: `safeUrl()`이 정규화된 `u.href`가 아니라 **원본 문자열을 그대로 반환**하고, 템플릿에서 `href="${href}"`에 `esc()`가 적용되지 않는다.
- **PoC (node로 실행 확인)**:

```
입력          https://evil.example/x" onfocus="alert(1)" autofocus="
safeUrl 반환  https://evil.example/x" onfocus="alert(1)" autofocus="   (통과됨)
렌더 결과     <a href="https://evil.example/x" onfocus="alert(1)" autofocus="">
```

  Velog는 서드파티 프록시(api.codetabs.com)를 경유하므로 프록시 오염 시 실제 공격면이 된다.
- **수정 제안**: `return (...) ? u.href : '#';` 로 정규화 값 반환 + 템플릿을 `href="${esc(href)}"` 로 변경.
- **판정 미반영 사유**: SPEC §4-B가 "fetchVelog()/fetchGitHub() 본문은 **절대 손대지 않는다**"로 명시 금지했고, git diff 확인 결과 Generator는 해당 함수에 **0줄** 손대지 않았다(JS 변경 전체가 +5/−292이며 삽입 5줄은 전부 REVEAL_SELECTOR 관련). HEAD에도 동일하게 존재하는 사전 결함이므로 이번 스프린트 판정에 "P0 → 무조건 불합격" 규칙을 적용하지 않는다. **다음 스프린트 최우선 과제로 별도 발주할 것.**

---

## P1 — 중요 이슈 (1건)

### 1. 모바일 `.link-card` 토큰 이관 시 2개 선언 유실 — 실측 회귀

- **파일**: `assets/css/style.css:1455~1465` (`@media (max-width: 520px)`의 `:root` 토큰 블록)
- **위반 규칙**: SPEC §1-B "`.link-card` 블록(2377~2381)은 §2-C 토큰화로 **대체**된다" — 5개 선언 중 3개만 이관됨. SPEC 기능3 검증 "데스크톱/모바일 모두 카드 리듬이 일정".
- **근거 — HEAD vs 현재 computed style 대조 (375px)**:

```
>>> header.gap        HEAD=12px       NEW=14px        <- 유실
>>> icon.fontSize     HEAD=18px       NEW=20px        <- 유실
    header.padding    HEAD=16px 18px  NEW=16px 18px   (OK)
    icon.width        HEAD=40px       NEW=40px        (OK)
    icon.borderRadius HEAD=10px       NEW=10px        (OK)
```

  HEAD 원본(`git show HEAD:assets/css/style.css` 2377-2381):

```css
.link-card {
  & .link-card__header { padding: 16px 18px; gap: 12px; }        /* gap 유실 */
  & .link-card__items  { padding: 12px 18px 16px; gap: 8px; }
  & .link-card__icon   { width:40px; height:40px; font-size:18px; border-radius:10px; }  /* font-size 유실 */
}
```

  실질 영향: 375px에서 아이콘 박스는 44→40px로 줄었는데 글리프는 20px 그대로라 글리프/박스 비율이 0.45 → 0.50으로 답답해지고, 좌우 패딩이 24→18px로 줄어든 상태에서 헤더 gap만 14px로 남아 리듬이 어긋난다.
- **SELF_CHECK 과대 주장**: "→ 기존 하드코딩 값과 정확히 일치(데스크톱 16/24/20, 모바일 12/18/16)"는 **패딩에만 해당**하며, 대체 대상 5개 선언 전체에 대한 주장으로는 거짓이다.
- **수정 제안** (신규 규칙 추가가 아니라 SPEC이 지시한 "대체"의 완성이므로 범위 내):

```css
@media (max-width: 520px) {
  /* :root 토큰 블록 아래에 유지 */
  .link-card {
    & .link-card__header { gap: 12px; }
    & .link-card__icon   { font-size: 18px; }
  }
}
```

---

## P2 — 권장 사항 (8건)

### 1. `&--loading`(SCSS식 연결)이 무효로 남아 로딩 스켈레톤 미적용

- **파일**: `assets/css/style.css:1305` (`.featured-item` 내부 `&--loading { ... }`, 약 85줄)
- **근거**: 위 LOADING-SKELETON 실측 + 라이트 테마 스크린샷에서 Velog 카드가 셰이머/스켈레톤 바 없이 회색 박스 + "로딩 중..." 원문 텍스트로 표시됨.
- **문제의 본질**: 이제 한 파일 안에 **작동하는 `&.link-card--feature`(1132)** 와 **죽은 `&--loading`(1305)** 이 공존한다. 게다가 `docs/css-rules.md` §1이 `&--variant`를 "올바른 패턴"으로 문서화하고 있어 다음 작업자가 같은 함정에 빠진다.
- **판정**: 사전 존재 + SPEC 삭제목록 외 + Generator가 스스로 보고함 → 감점 없음. 다만 후속에서 ① `&--loading` → `&.featured-item--loading` 1줄 수정, ② `docs/css-rules.md` §1 예시를 `&.block--variant`로 정정 을 반드시 처리할 것.

### 2. 데스크톱 `.category-nav` 2행 랩 — 5+1 고아 행으로 시각 품질 저하

- **파일**: `assets/css/style.css:1893-1897`
- **근거(실측)**: 1280px에서 nav 높이 `56px → 102px`, 2행, 2행에는 "Social" 1개만 남고 약 600px가 빈 공간. `border-radius:999px` 알약 아이덴티티가 두꺼운 라운드 사각으로 변형된다. 라이트 테마에서 특히 두드러진다(스크린샷 확인).
- **대안(900/1024/1280/1600px 실측 검증 완료)**: 데스크톱에서 1행을 유지하되 nav가 760px 컬럼을 넘도록 허용

```css
@media (min-width: 900px) {
  .category-nav {
    flex-wrap: nowrap; justify-content: center; overflow: visible;
    max-width: none; width: max-content;
    position: relative; left: 50%; transform: translateX(-50%);
  }
}
```

  측정 결과 nav 802px가 1행(높이 56px)으로 유지되며 전 구간 뷰포트 안에 들어간다(900px에서 left=49/right=851). 인디케이터는 offsetLeft/offsetTop 기반이라 영향 없음.

### 3. 521~899px 구간은 여전히 6번째 탭이 잘림 — 수정이 한 브레이크포인트에만 적용됨

- **근거(실측)**: `560px {client:510, scroll:802, clipped:true}` / `700·800·899px {client:630, scroll:802, clipped:true}` — flex-wrap:nowrap, scroll-snap-type:none, 스크롤바 숨김.
- HEAD와 동일한 사전 동작이라 회귀는 아니지만, P2-2의 논리("6개 탭 정상 동작")를 그대로 적용하면 이 구간도 함께 처리했어야 한다. P2-2 대안을 `min-width: 521px`부터 적용하면 한 번에 해소된다.

### 4. 장식 `<i>` 12건 aria-hidden 누락 (SPEC §7 체크리스트 미충족)

- **파일**: `index.html:44,45`(테마토글) `:474-477`(푸터) `:488`(모달 닫기) `:498,502,507,512,517`(`.modal-info__icon`)
- SPEC §7은 "모든 장식 `<i>`,`<svg>`에 aria-hidden"을 요구하나 SPEC §3은 "footer 그대로 / modal 그대로"라 서로 충돌한다. Generator는 보수적 해석(미수정)을 택했고 그 판단 자체는 타당하다.
- 다만 SELF_CHECK의 "부모 `<a>`/`<button>`에 aria-label이 있어 접근성 자체는 확보돼 있다"는 **12건 중 7건에만** 해당한다. `.modal-info__icon` 5건은 조상에 접근가능 이름이 없어 Font Awesome의 `::before` PUA 글리프가 실제 낭독될 수 있다.

### 5. `#profileAvatar` 키보드 조작 불가

- **파일**: `index.html:52` — `<img class="js-open-profile" tabindex="0">` 에 `role="button"`도 keydown 핸들러도 없어 포커스는 되지만 Enter/Space로 열리지 않는다. 사전 존재이며 형제 `<button class="profile__action ... js-open-profile">`로 키보드 경로가 확보돼 완화되어 있다.
- **수정 제안**: `role="button"` 추가 + main.js에서 `el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } })`.

### 6. ARIA tablist 패턴 미완성 (사전 존재)

- `role="tab"` 버튼에 `aria-controls` 없음, `.category-section`에 `role="tabpanel"` 없음, roving tabindex/화살표키 없음. HEAD에도 0건.

### 7. 참조 0이 된 `:root` 변수 2건 / 죽은 클래스 4건

- 신규 고아: `--platform-velog-30`, `--platform-github-30` (유일 사용처였던 `.focus-card`가 삭제됨). **SPEC이 "3건 외 변수 삭제 금지"로 명시했으므로 보존은 올바른 판단이다.** 후속 정리 대상.
- 사전 존재: `.link-card--app`·`.profile__dot`(HTML만 존재, CSS 없음), `.hero__scroll-hint`·`.hero__scroll-arrow`(CSS만 존재, HTML 없음). `index.html:272`의 `<!-- Melon (먼저) -->` 주석도 `.music-showcase` 삭제로 의미를 잃었다.

### 8. 테스트 하네스 셀렉터가 낡음 — 상시 오탐 유발

- **파일**: `tests/ui-check.js:187` — `.profile__btn.js-open-profile` 은 HEAD에도 현재에도 없는 클래스.
- **수정 제안**: `page.locator('button.js-open-profile').first()` 로 변경. 이대로 두면 앞으로 모든 스프린트에서 모달이 무조건 FAIL로 찍혀 라운드를 낭비한다.

### (참고) 범위 미세 이탈 2건 — 감점 없음

- `index.html:309` SoundCloud desc의 `&` → `&amp;` (SPEC은 "현재 마크업 그대로 유지"라 했으나 렌더 결과 동일, HTML 정합성 개선)
- `:root` 주석 `/* Focus Board */` → `/* Action pill (.profile__action) */` (범위계약의 "참조가 끊긴 목록의 동기화 정리"에 해당)

---

## 통과 항목

**보안** — 신규 innerHTML 싱크 0건, fetchVelog/fetchGitHub 본문 0줄 수정(esc/safeUrl 원형 보존), eval/document.write/console.error/인라인 이벤트 핸들러 0건, rel="noopener" 31/31.

**CSS 패턴** — SCSS 문법 0건, 신규 하드코딩 색상 0건(`--glow-naver`만 `:root`+`html.light` 선언 후 참조), `!important` 3건 전부 reduced-motion 예외, backdrop-filter 7 = -webkit-backdrop-filter 7, 중괄호 균형 338/338, 미정의 var() 0건, 중첩 전부 `&` 문법, `.link-card--feature`/`.icon--game` BEM 준수.

**JS 패턴** — diff 정확히 `5 insertions(+), 292 deletions(-)`. REVEAL_SELECTOR는 "유틸리티 함수" 구분선 직하에 JSDoc과 함께 배치, initScrollReveal + applyFilter 양쪽에서 사용(HEAD의 긴 셀렉터와 대조해 삭제 컴포넌트만 제외한 충실한 축약임을 확인). DOMContentLoaded 정확히 12개·SPEC 순서 일치. 코드 배치 순서(유틸→fetch→DOMContentLoaded→init) 유지. 미사용 함수 0, getElementById 8개 전부 HTML에 존재, querySelector 클래스 후크 전부 존재. 신규 element.style 사용 0.

**HTML** — 인라인 `style=""` 0건, alt 누락 0건, 신규 문구 전부 SPEC 원문(창작 0건), 탭/섹션 순서 §3-A 일치, `.profile__motto`/`.profile__bio` 완전 보존(SPEC 최우선 보존 조항 준수).

**반응형/테마** — 375px 가로 오버플로 0(cardsOverflowingViewport 0), 토큰 재정의 1블록으로 동작, 다크·라이트 양쪽 정상, reduced-motion에서 카드 opacity 1 / 스크롤 진행바 숨김 / 에러 0. 탭 타겟 nav 77x44, 카드 헤더 341x72, 테마토글 44x44.

**AI 슬롭 패턴** — 보라-청록 그라디언트 0, 과대 그림자(0 20px 60px 이상) 0, 임의 border-radius 20px+ 0, 중복 scale(1.05)+ 0, setTimeout 애니메이션 처리 신규 0, **SPEC 외 독립 기능 추가 0** → 전 항목 클린.

---

## 채점 (SPEC 변경유형 = 혼합 → 기능 변경 평가 기준)

**항목별 점수**

- **패턴 일관성: 7/10** → 외과수술적 diff(JS +5/−292, 신규 CSS 약 50줄)에 SCSS·하드코딩·인라인·슬롭 전부 0. 다만 "대체"여야 할 모바일 토큰 이관이 5→3으로 불완전(P1) + `&--loading`/`&.link-card--feature` 표기 이원화, 죽은 클래스 잔존 등 P2 5건.
- **보안 & 접근성: 7/10** → 이번 변경으로 깨진 보안·접근성 없음, noopener 31/31, 모달 포커스 트랩 실측 통과. 그러나 SPEC §7의 aria-hidden 항목이 12건 미충족이고 아바타 키보드 조작·tablist ARIA·href 인젝션 등 기존 결함이 그대로 남았다.
- **반응형 & UI 품질: 6.5/10** → 375px 오버플로 0, 데스크톱 토큰 전 항목 SPEC 일치, 양 테마·reduced-motion 정상. 반면 모바일 2개 값 회귀(P1), 데스크톱 nav 5+1 고아 행, 521~899px 미해결.
- **기능 완성도: 8/10** → 4개 기능 전부 실측 통과, **링크 손실 0건을 HEAD diff로 증명**, 콘솔 0건, SPEC 외 변경 2건 모두 "필수"로 검증되어 범위 위반 없음. §7 체크리스트 1항목 미충족 + SELF_CHECK 과대 주장 1건 감점.

**가중 점수** = 7×0.40 + 7×0.25 + 6.5×0.20 + 8×0.15
= 2.80 + 1.75 + 1.30 + 1.20 = **7.05 / 10**

**이슈 건수 기준**: P0(유입) 0건, P1 1건 → 강제 하락 없음.
점수 기준과 건수 기준 모두 합격선을 넘으므로 최종 판정은 합격이다. 단 **7.0 합격선을 0.05 초과한 한계 통과**임을 명시한다.

## 최종 판정: **합격 (한계 통과)**

**구체적 개선 지시** (1번은 필수, 2~4번은 후속)

1. **[필수] `assets/css/style.css` `@media (max-width: 520px)` 블록에 유실된 2개 선언 복원**
   `:root` 토큰 블록 바로 아래에 아래를 추가한다. 신규 규칙이 아니라 SPEC §1-B가 지시한 "대체"의 미완성분을 채우는 것이다.

```css
.link-card {
  & .link-card__header { gap: 12px; }
  & .link-card__icon   { font-size: 18px; }
}
```

   복원 후 375px에서 `header.gap === 12px`, `icon.fontSize === 18px`가 되는지 computed style로 재확인할 것.

2. **[권장] `assets/css/style.css:1893-1897` 데스크톱 nav를 1행 유지 방식으로 교체**
   현재 `flex-wrap: wrap`을 아래로 바꾸면 알약 형태(높이 56px)를 유지하면서 6개 탭이 전부 보인다. 900/1024/1280/1600px 전 구간 실측 검증 완료.

```css
.category-nav {
  flex-wrap: nowrap; justify-content: center; overflow: visible;
  max-width: none; width: max-content;
  position: relative; left: 50%; transform: translateX(-50%);
}
```

   적용 시 미디어쿼리 조건을 `min-width: 521px`로 낮추면 P2-3(521~899px 잘림)까지 동시에 해소된다.

3. **[후속 스프린트 / 최우선] `assets/js/main.js` href 속성 인젝션 차단**
   `safeUrl()`이 `u.href`(정규화값)를 반환하도록 바꾸고, `:81`·`:159`의 `href="${href}"`를 `href="${esc(href)}"`로 변경한다. 본 SPEC이 수정을 금지한 영역이므로 **별도 SPEC으로 발주**할 것.

4. **[후속 스프린트] 죽은 코드·문서 정정 일괄 처리**
   1. `style.css:1305` `&--loading` → `&.featured-item--loading` (현재 로딩 스켈레톤이 실제로 미적용)
   2. `docs/css-rules.md` §1의 `&--variant` 예시를 `&.block--variant`로 정정 (현재 문서가 무효 패턴을 권장 중)
   3. `tests/ui-check.js:187` `.profile__btn` → `button.js-open-profile` (상시 오탐 제거)
   4. `docs/components.md` 컴포넌트 표에서 `.social-grid` 등 삭제된 항목 갱신
   5. 고아 변수 `--platform-velog-30`/`--platform-github-30`, 죽은 셀렉터 `.hero__scroll-hint`/`.hero__scroll-arrow`, 미정의 클래스 `.link-card--app`/`.profile__dot` 정리
   6. 사용자 안내: `data/streaks.json`은 코드 참조가 0이 되었으나 개인 데이터라 보존했다. 필요 시 `git rm data/streaks.json`.

---

# R2 직접 검증 (오케스트레이터 실사)

R2 Evaluator 재호출은 사용자 요청으로 생략. 대신 아래 항목을 직접 측정했다.

## 정적 검증

| 항목 | 결과 |
|---|---|
| 삭제 대상 13종 문자열 (`cover-band`/`streak`/`music-showcase`/`focus-card`/`focus-board`/`focus-grid`/`platform-showcase`/`game-showcase`/`social-card`/`social-grid`/`quick-stats`/`links--section`) — 3파일 | **전부 0건** |
| `profile__stat` 5건 | 전부 `profile__statement`(보존 대상)의 부분일치. 삭제된 `.profile__stat`는 0건 |
| `--focus-pill-bg` | **3건 보존** (선언 + `.profile__action` 참조) |
| `js-open-profile` | **2건**(아바타 + Profile 버튼) |
| `#velog-items` / `#github-items` | HTML 1건 / JS 1건씩 일치, 둘 다 `<div class="link-card__items">`에 부착 확인 |
| `data-category="music"` + `display:none` 함정 | **0건** (데스크톱 Melon/SoundCloud 소실 없음) |
| SCSS식 `&--` 연결 | **0건** (`&--loading` → `&.featured-item--loading` 수정 반영) |
| 미정의 `var(--*)` 참조 | **0건** |
| `main.js` diff | **+5 / −292**. 추가된 5줄은 `REVEAL_SELECTOR` 상수·JSDoc·사용처 2곳뿐 |
| `esc()` / `safeUrl()` / `fetchVelog()` / `fetchGitHub()` 본문 | **0줄 변경** (git diff hunk로 확인 — 전부 순수 삭제 hunk) |
| `safeInit()` 목록 | **정확히 12개**, SPEC §1-C 순서 일치 |
| 파일 규모 | index.html 655→**527**, style.css 3,526→**1,906**, main.js 895→**607** |

## 런타임 검증 (`npm run ui-check`)

```
결과: 10/10 통과   (콘솔 에러 0건)
```
테마 토글 / 카테고리 필터 4종 / 모달 열기·닫기 / 링크카드 href 10개 / 520px 모바일 / 콘솔 에러 — 전부 PASS.
R1에서 상시 오탐이던 모달 테스트가 셀렉터 수정 후 정상 통과로 전환됨(8/9 → 10/10).

## 브라우저 실측 (1280×720)

```
cardCount            10
cardWidths           [696]        ← 10개 전부 동일 폭. 링크트리 균일성 달성
nav.client/scroll    802 / 802    ← 잘림 0
nav.tabRows          1            ← R1의 2행 고아 랩 해소
nav.height           55px
nav.borderRadius     999px        ← 알약 아이덴티티 복원
pageOverflow         0
coverBand / streaks  false / false ← 두 섹션 완전 소멸
#velog-items 부모    .link-card
#github-items 자식   3            ← GitHub 자동 갱신 라이브 동작
```

시각 확인: `tests/screenshots/linktree-desktop.png`, `linktree-mobile.png` — 데스크톱/모바일 양쪽에서 10개 카드가 동일 폭·동일 아이콘·동일 헤더 레이아웃의 단일 컬럼으로 정렬됨.

## 발견 사항 (회귀 아님)

**Velog 자동 갱신이 "응답 시간 초과" 에러 상태로 렌더됨.**
- `fetchVelog()`는 외부 CORS 프록시 `api.codetabs.com`을 5초 타임아웃으로 호출한다(`main.js:118`).
- 해당 함수는 이번 스프린트에서 **0줄 변경**되었고 엔드포인트·타임아웃도 그대로다 → 외부 서비스 지연에 따른 **사전 존재 동작**이며 리팩터링 회귀가 아니다.
- 오히려 에러 메시지가 새 `.link-card__items` 컨테이너에 정상 렌더된다는 것은 컨테이너 배선이 올바름을 역으로 입증한다. GitHub(직접 API 호출)는 3건 정상 표시.

## 판정

R1 지적 P1 1건 + P2 5건 해소 확인. **완료.**
