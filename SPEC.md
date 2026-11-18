# Music 리디자인: SoundCloud 플레이리스트 임베드 + Game·Lumark·@hy_nxx9 정리

## 개요
게임은 `_archive/game-2026-11-18/`로 이미 백업·이동되었으므로, 홈페이지에 남은 Game 탭·섹션·스타일·사이트맵 참조를 걷어낸다.
Released Apps에서 Lumark를, Social에서 개인 인스타그램(@hy_nxx9)을 내리고, 인스타그램 정식 마크를 지식산책(@knowledge_stroll)으로 옮긴다.
SoundCloud 카드는 틀(헤더 → 디바이더 → 본문)을 유지한 채 본문의 정사각 썸네일 3개를 **실제로 재생 가능한 플레이리스트 임베드 3개(세로 스택)**로 바꾼다.

## 변경 유형
**혼합** (디자인 + 구조/콘텐츠 제거) → Evaluator는 **기능 변경 평가 기준**(패턴 40 / 보안·접근성 25 / 반응형·UI 20 / 기능 15)을 적용한다.

## 디자인 언어 & 의도
링크트리의 SoundCloud 행이 "다른 곳으로 보내는 링크"에서 "이 자리에서 바로 들을 수 있는 작은 청음실"로 바뀐다. 세 개의 플레이리스트는 사이트의 유리 카드 안에 얇은 테두리 링으로 끼워진 판처럼 놓이고, 각 판 아래 `01 · HI THERE · HG ↗` 캡션이 트랙리스트처럼 앨범 이름과 세트 링크를 조용히 드러낸다. 앨범에 포인터·포커스가 닿으면 그 판의 링과 번호만 코럴 톤으로 켜져, 재생 위젯을 흔들지 않으면서도 "지금 이 앨범"이라는 감각을 준다.

---

## Sprint 범위 계약

### 판단 기준
- **허용**: 이 SPEC의 5개 변경 + 캐시 버스팅 + 문서 갱신이 정상 동작/정합하기 위해 필수적인 최소 연동 변경.
- **금지**: SPEC에 없는 독립 기능·효과 추가(예: 임베드 재생 상태 JS 연동, SoundCloud Widget API 스크립트, 새 탭/섹션, 다른 카드 리디자인), 외부 스크립트 추가, 빌드 도구 도입, 새 CSS/JS 파일 생성.
- **판단 질문**: "이 변경이 없으면 SPEC 기능이 동작하지 않거나, 죽은 코드/죽은 링크가 남는가?" → YES면 허용, NO면 금지.

### 수정 허용 파일 (이 목록 밖은 수정 금지)
| 파일 | 범위 |
|---|---|
| `index.html` | Game 탭·섹션 삭제, Lumark 항목 삭제, @hy_nxx9 카드 삭제, 지식산책 아이콘 클래스, 푸터 Instagram 링크, SoundCloud 카드 본문 교체, 캐시 버스팅 쿼리 |
| `assets/css/style.css` | 게임/instagram2 규칙 삭제, `--feature` → `--embed` 티어 교체, `.embed-item` 블록 추가, `.link-card--app` 2개 가운데 정렬, 토큰(`--embed-h`) 추가, 주석 갱신 |
| `assets/js/main.js` | **변경 없음이 기대값**. 확인만 한다(아래 §JS). |
| `sitemap.xml` | game.html `<url>` 블록 삭제 |
| `.claude/launch.json` | `startPath` → `"/"` |
| `docs/components.md`, `docs/css-rules.md` | 실제 구조에 맞게 갱신 (§문서) |
| `docs/js-rules.md` | 게임 언급 없음 — 수정 불필요(건드리지 않는다) |

### 삭제 대상 파일 (`git rm` 아님 — 작업 트리에서 삭제만. 커밋/푸시 금지)
| 파일 | 근거 |
|---|---|
| `assets/img/app-lumark.png` | Lumark 항목 삭제 후 참조 0건 |
| `assets/img/cover-holdmetight.jpg` | SoundCloud 썸네일 교체 후 참조 0건 (grep 확인: index.html 외 참조 없음) |
| `assets/img/cover-halis.jpg` | 동일 |
| `assets/img/cover-need.jpg` | 동일 |

> 삭제가 `Operation not permitted`로 막히면 억지로 우회하지 말고 SELF_CHECK.md에 "삭제 대기 파일"로 기록한다(오케스트레이터가 처리).

### 절대 건드리지 않을 것
`_archive/**`, `AGENTS.md`, `iOS-game-roadmap.md`, `.agents/`, `.codex/`, `node_modules/`, `tests/ui-check.js`(아래 §테스트 근거), `pages/.gitkeep`, `.claude/agents/**`, `CLAUDE.md`.
`:root`의 기존 변수는 삭제/값 변경 금지(추가만 허용). 단, 주석 수정은 허용.

---

## 핵심 설계 결정

| # | 결정 | 근거 |
|---|---|---|
| D1 | **B 티어를 재정의**: `.link-card--feature`(16:10 커버 1개)를 폐기하고 **`.link-card--embed`(임베드 세로 스택)**로 교체한다. 3티어 체계(A 프리뷰 / B 임베드 / C 단독)는 유지. | `--feature`의 규칙 4줄은 Game과 함께 전부 죽는다. 같은 이름에 전혀 다른 규칙을 붙이면 이름이 내용을 속이므로, 이름까지 바꿔 "B = 본문이 재생 위젯인 행"으로 의미를 고정한다. 새 카드 컴포넌트가 아니라 기존 `.link-card` + `__header/__divider/__items` 골격 그대로에 수정자 하나다. |
| D2 | 임베드 항목은 `.featured-item`을 재사용하지 않고 **별도 아이템 블록 `.embed-item`**(`<figure>`)로 만든다. | `.featured-item`은 `<a>` 전체가 링크이고 hover 시 translate/scale·카운터 배지·썸네일 확대가 붙는다. iframe(재생 컨트롤 포함)을 링크 안에 넣을 수 없고 움직여서도 안 된다. 블록을 분리하면 그 효과들이 **구조적으로** 적용되지 않으므로 무효화용 오버라이드 CSS가 필요 없다. |
| D3 | 위젯 `color`는 `#ff5500` → **`#b07068`**(라이트 테마 `--brand`)로 바꾼다. | 플랫폼 정체성은 헤더 아이콘·주황 글로우가 이미 맡고, 재생 버튼/웨이브폼 진행색은 사이트 코럴 톤에 맞춘다. iframe 파라미터는 테마별로 바꿀 수 없어서, 흰 재생 아이콘 대비가 3:1을 넘는 더 어두운 쪽(`#b07068`, 약 3.9:1)을 고정값으로 쓴다(`#c4847a`는 약 2.9:1). |
| D4 | 임베드 높이는 토큰 `--embed-h` (데스크톱 300px / 모바일 260px)로 제어. | 링크트리 규칙("모바일은 `:root` 재정의 한 블록")을 그대로 따른다. 300px은 SoundCloud visual 플레이어 원문 값, 260px은 좁은 폭에서 카드가 과하게 길어지지 않으면서 아트워크·재생 버튼·웨이브폼이 모두 보이는 하한. |
| D5 | Released Apps(2개)는 **타일 모양을 그대로 두고 가운데로 모은다**. `.link-card--app`의 `__items`를 "3열일 때의 한 칸 폭" 2칸 + `justify-content: center`로. | 사용자 요청은 "Lumark를 내려 달라"까지다. 3열 그리드에 2개면 오른쪽 한 칸이 비어 미완성처럼 보이고, 2열로 늘리면 아이콘이 과대해진다. 타일 크기·모양(정사각 아이콘 + 이름 + 배지)은 손대지 않고 정렬만 바꾸는 것이 요청 범위에 가장 가깝다. 앱 카드 자체의 리디자인은 범위 밖. |
| D6 | 임베드 카드는 hover 시 **카드 리프트(translateY)를 끈다**. 글로우·화살표·디바이더 강조는 유지. | 재생 위젯 위에서 포인터가 움직일 때마다 1000px 높이 카드 전체가 들썩이면 재생/시크 조작이 불안정해 보인다. |

---

## 변경 범위

### index.html 변경사항

#### H1. 캐시 버스팅
- `/assets/css/style.css?v=20260814-1` → `?v=20261118-1`
- `/assets/js/main.js?v=20260814-1` → `?v=20261118-1`

#### H2. Game 제거
- `#categoryNav` 안의 `<button class="category-nav__btn" data-filter="game" ...>…</button>` 전체(SVG 포함) 삭제. 남는 순서: All → Study & Writing & Dev → Music → Released Apps → Social (5개).
- `<!-- Game -->` 주석부터 `<section ... id="section-game">…</section>` 끝까지 삭제. DOM 섹션 순서: writing → music → app → social (탭 순서와 일치).
- `<meta name="description">`, OG/Twitter 설명은 게임을 언급하지 않으므로 그대로 둔다.

#### H3. Lumark 제거
- `#section-app` 의 `.link-card--app .link-card__items` 안에서 Lumark `<a class="featured-item" href="https://apps.apple.com/kr/app/lumark/...">…</a>` 블록 전체 삭제. PopPath, 김간호는 음악박사 2개만 남는다(순서 유지).
- 마크업 구조(`featured-item__thumb--app`, `__label`, `__meta`)는 그대로 둔다. 레이아웃은 CSS(§C5)만으로 바꾼다.

#### H4. Instagram 정리
- Social의 첫 카드(`href="https://www.instagram.com/hy_nxx9/"`, `@hy_nxx9`) `.link-card` 전체 삭제.
- 지식산책 카드의 `<div class="link-card__icon icon--instagram2">` → `<div class="link-card__icon icon--instagram">`. 제목 "지식산책", 설명 "@knowledge_stroll"은 유지.
- Social 최종: 지식산책 → 네이버 (2개, C 티어).
- 푸터 Instagram 링크를 다음으로 교체:
```html
<a href="https://www.instagram.com/knowledge_stroll/" target="_blank" rel="noopener" title="Instagram · 지식산책" aria-label="지식산책 Instagram (@knowledge_stroll)"><i class="fa-brands fa-instagram" aria-hidden="true"></i></a>
```
  (다른 푸터 아이콘의 `<i>`에는 이번 범위상 손대지 않는다. 교체하는 이 한 줄만 `aria-hidden` 포함.)

#### H5. SoundCloud 카드 — 최종 마크업 (그대로 교체)
`<!-- SoundCloud -->` 아래의 `.link-card` 전체를 아래로 교체한다.

```html
      <!-- SoundCloud — B 티어(임베드 스택): 플레이리스트를 카드 안에서 바로 재생 -->
      <div class="link-card link-card--embed">
        <a class="link-card__header" href="https://soundcloud.com/user-928451677" target="_blank" rel="noopener">
          <div class="link-card__icon icon--soundcloud">
            <i class="fa-brands fa-soundcloud" aria-hidden="true"></i>
          </div>
          <div class="link-card__info">
            <div class="link-card__title">SoundCloud</div>
            <div class="link-card__desc">플레이리스트 3개 · 여기서 바로 재생</div>
          </div>
          <i class="fa-solid fa-arrow-right link-card__arrow" aria-hidden="true"></i>
        </a>
        <div class="link-card__divider"></div>
        <div class="link-card__items">

          <figure class="embed-item">
            <iframe class="embed-item__frame"
              title="HI THERE — HG SoundCloud 플레이리스트"
              src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/soundcloud%253Aplaylists%253A2326738125&color=%23b07068&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true"
              loading="lazy"
              allow="autoplay; encrypted-media"></iframe>
            <figcaption class="embed-item__caption">
              <a class="embed-item__link" href="https://soundcloud.com/user-928451677/sets/hi-there" target="_blank" rel="noopener" aria-label="HI THERE · HG 플레이리스트 SoundCloud에서 열기">
                <span class="embed-item__index" aria-hidden="true">01</span>
                <span class="embed-item__title">HI THERE</span>
                <span class="embed-item__by">HG</span>
                <i class="fa-solid fa-arrow-up-right-from-square embed-item__arrow" aria-hidden="true"></i>
              </a>
            </figcaption>
          </figure>

          <figure class="embed-item">
            <iframe class="embed-item__frame"
              title="LIE — HG SoundCloud 플레이리스트"
              src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/soundcloud%253Aplaylists%253A2312172417&color=%23b07068&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true"
              loading="lazy"
              allow="autoplay; encrypted-media"></iframe>
            <figcaption class="embed-item__caption">
              <a class="embed-item__link" href="https://soundcloud.com/user-928451677/sets/lie" target="_blank" rel="noopener" aria-label="LIE · HG 플레이리스트 SoundCloud에서 열기">
                <span class="embed-item__index" aria-hidden="true">02</span>
                <span class="embed-item__title">LIE</span>
                <span class="embed-item__by">HG</span>
                <i class="fa-solid fa-arrow-up-right-from-square embed-item__arrow" aria-hidden="true"></i>
              </a>
            </figcaption>
          </figure>

          <figure class="embed-item">
            <iframe class="embed-item__frame"
              title="IOU — HG SoundCloud 플레이리스트"
              src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/soundcloud%253Aplaylists%253A2300418450&color=%23b07068&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true"
              loading="lazy"
              allow="autoplay; encrypted-media"></iframe>
            <figcaption class="embed-item__caption">
              <a class="embed-item__link" href="https://soundcloud.com/user-928451677/sets/iou" target="_blank" rel="noopener" aria-label="IOU · HG 플레이리스트 SoundCloud에서 열기">
                <span class="embed-item__index" aria-hidden="true">03</span>
                <span class="embed-item__title">IOU</span>
                <span class="embed-item__by">HG</span>
                <i class="fa-solid fa-arrow-up-right-from-square embed-item__arrow" aria-hidden="true"></i>
              </a>
            </figcaption>
          </figure>

        </div>
      </div>
```

마크업 규칙 (Evaluator 검사 항목):
- iframe에 `width`/`height`/`frameborder`/`scrolling` **속성 없음**. 크기·테두리는 CSS만.
- `src`의 `&`는 HTML 속성 안에서도 동작하지만, 일관성을 위해 원문 그대로(`&`) 둔다. URL의 `%253A` 이중 인코딩은 **SoundCloud 원문 그대로 유지**(손대면 위젯이 깨진다). 바뀌는 파라미터는 `color=%23ff5500 → color=%23b07068` 하나뿐.
- 헤더 href에서 `?utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing` 제거.
- 인라인 `style` 속성 금지(SoundCloud가 준 크레딧 div는 사용하지 않는다).
- 순서: HI THERE(01) → LIE(02) → IOU(03).

---

### assets/css/style.css 변경사항

#### C1. 토큰 추가 (`:root` 링크트리 토큰 블록, `--stack-gap` 아래)
```css
  --embed-h: 300px;          /* 임베드 행(B 티어) 플레이어 높이 — SoundCloud visual 원문 값 */
```
모바일 `@media (max-width: 520px)`의 기존 `:root { … }` 재정의 블록 **안에** 추가:
```css
    --embed-h: 260px;
```
`html.light`에는 추가하지 않는다(색이 아니라 치수이므로 테마 무관).

`--radius-lg` 줄의 주석 `/* game.css가 참조 */` → `/* 메인 페이지 미사용 — 서브페이지용 예약 */` (변수 자체는 삭제 금지 원칙에 따라 유지).

#### C2. 게임·instagram2 잔재 삭제
- `.link-card { … }` 안의 `&.link-card--feature { … }` 블록(주석 `/* 피처 행 — 프리뷰 3개 대신 16:10 커버 1개 */` 포함) 전체 삭제 → C3로 대체.
- `&:has(.icon--instagram2):hover { … }` 줄 삭제.
- `&:has(.icon--game):hover { … }` 줄 삭제.
- `/* ---- Platform Icon Colors ---- */`의 `.icon--instagram2 { … }` 줄, `.icon--game { … }` 줄 삭제.
- 삭제 후 `grep -n "game\|instagram2\|link-card--feature" assets/css/style.css` → 0건이어야 한다.
- `/* 6개 탭 합계(802px)가 링크 컬럼(≤760px)보다 넓다. …` 주석을 5개 탭 기준으로 고쳐 쓴다. 예:
  `/* 5개 탭 합계가 링크 컬럼(≤696px 콘텐츠 폭)과 거의 같아 폰트/로케일에 따라 넘칠 수 있다. … */` — 규칙 자체(`@media (min-width:521px) .category-nav { … }`)는 안전장치로 **유지**.

#### C3. B 티어 — `.link-card--embed` (`.link-card { … }` 안, 삭제한 `--feature` 자리에)
```css
  /* B 티어: 임베드 행 — 본문이 재생 위젯인 카드. 썸네일 그리드 대신 세로 스택 */
  &.link-card--embed {
    & .link-card__items {
      grid-template-columns: 1fr;
      gap: var(--card-pad-y);
    }

    /* 위젯 위에서 카드가 들썩이지 않게 리프트만 끈다 (글로우·화살표·디바이더는 유지) */
    &.is-visible:hover { transform: translateY(0); }
  }
```
> 특이도 메모: 기본 hover는 `.link-card:hover`(0,2,0), 이 규칙은 `.link-card.link-card--embed.is-visible:hover`(0,4,0)라 확실히 이긴다. `.is-visible` 없이 쓰면 등장 전 `translateY(24px)` 상태를 hover가 덮어 버리므로 반드시 `.is-visible`과 결합한다.

#### C4. `.embed-item` 블록 (새 섹션 — `/* ---- Featured Items ---- */` 블록이 끝난 뒤, `@keyframes shimmer-sweep` **앞**에 삽입)
```css
/* ---- Embed Items (B 티어 본문) ----
   iframe은 링크로 감쌀 수 없고 움직여서도 안 된다. 그래서 .featured-item과
   다른 블록으로 분리해 hover 변형·카운터 배지가 구조적으로 붙지 않게 했다. */
.embed-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;

  & .embed-item__frame {
    display: block;
    width: 100%;
    height: var(--embed-h);
    border: 0;
    border-radius: var(--radius-sm);
    /* 로딩 전·lazy 대기 중 빈 판: 카드 톤 위에 코럴 빛이 한쪽에서 스미는 정지 그라디언트 */
    background:
      linear-gradient(135deg, var(--brand-08), transparent 55%),
      var(--bg-dark);
    box-shadow: 0 0 0 1px var(--border);
    transition: box-shadow var(--transition);
  }

  & .embed-item__caption {
    min-width: 0;
  }

  & .embed-item__link {
    display: flex;
    align-items: baseline;
    gap: 8px;
    min-width: 0;
    padding: 2px;
    border-radius: var(--radius-sm);
    color: var(--text-muted);
    text-decoration: none;
    font-size: 12px;
    line-height: 1.4;
    transition: color var(--transition);
  }

  & .embed-item__index {
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.6px;
    font-variant-numeric: tabular-nums;
    color: var(--text-dim);
    transition: color var(--transition);
  }

  & .embed-item__title {
    font-weight: 700;
    letter-spacing: 0.4px;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  & .embed-item__by {
    color: var(--text-dim);
    font-weight: 500;

    &::before {
      content: "·";
      margin-right: 8px;
    }
  }

  & .embed-item__arrow {
    margin-left: auto;
    font-size: 10.5px;
    color: var(--text-dim);
    transition: color var(--transition), transform var(--transition);
  }

  /* "지금 이 앨범" — 포인터가 판이나 캡션에 닿거나 포커스가 들어오면 링과 번호만 켜진다 */
  &:hover,
  &:focus-within {
    & .embed-item__frame { box-shadow: 0 0 0 1px var(--brand-35); }
    & .embed-item__index { color: var(--brand-text); }
  }

  & .embed-item__link:hover,
  & .embed-item__link:focus-visible {
    color: var(--brand-text);

    & .embed-item__arrow {
      color: var(--brand);
      transform: translate(2px, -2px);
    }
  }
}
```
설계 메모:
- 색은 전부 기존 변수(`--brand-08/35`, `--brand-text`, `--brand`, `--text*`, `--border`, `--bg-dark`). 하드코딩 색 0건. 다크/라이트는 변수 재정의로 자동 대응(`--bg-dark`: 다크 `#09080f` / 라이트 `#e8e7ec`).
- 테두리는 `border` 대신 `box-shadow` 링: iframe 내부 문서가 모서리까지 칠해져도 1px 링이 `border-radius`를 따라 깔끔하게 남고, 레이아웃 폭(100%)에 1px이 더해지지 않는다.
- 포커스 가시성은 전역 `:focus-visible { outline: 2px solid var(--brand) }`가 `.embed-item__link`에도 적용된다(제거 금지). iframe으로 Tab이 들어가면 `:focus-within`이 링을 켠다.
- `.featured-item`의 `translate/scale`, `::before` 카운터, 썸네일 `scale(1.08)`은 `.embed-item`에 **선택자가 닿지 않으므로** 별도 무효화 규칙을 쓰지 않는다.

#### C5. Released Apps 2개 — `.link-card--app` (`.link-card { … }` 안, C3 바로 아래)
```css
  /* 앱 행: 앱이 2개라 3열 그리드의 한 칸 폭은 그대로 두고 가운데로 모은다.
     앱이 다시 3개가 되면 이 규칙을 지우면 기본 3열로 돌아간다 */
  &.link-card--app {
    & .link-card__items {
      grid-template-columns: repeat(2, calc((100% - 2 * var(--card-items-gap)) / 3));
      justify-content: center;
    }
  }
```
- 타일(`.featured-item`, `__thumb--app`, `__label`, `__meta`)의 크기·모양·hover는 **변경 금지**. 정렬 규칙 한 덩어리만 추가한다.
- 한 칸 폭 = (본문 폭 − 간격 2개) / 3 → Lumark가 있던 때와 타일 크기가 정확히 같다. 모바일(≤520px)도 같은 식이 그대로 적용되므로 별도 520px 규칙 추가 금지.
- HTML 마크업은 Lumark 항목 삭제 외 변경 없음.

#### C6. Reduced motion (기존 `/* ---- Accessibility: respect reduced motion ---- */` 블록 안에 한 줄 추가)
```css
  .embed-item .embed-item__link:hover .embed-item__arrow,
  .embed-item .embed-item__link:focus-visible .embed-item__arrow { transform: none; }
```

#### C7. 확인 사항
- `--glow-soundcloud`, `:has(.icon--soundcloud):hover` 글로우는 그대로 → 임베드 카드도 주황 글로우 유지.
- `.link-card__items { counter-reset: feat-counter; }`는 다른 카드에서 계속 쓰이므로 유지.
- 삭제한 클래스의 `html.light` 오버라이드는 원래 없음(확인 완료).

---

### assets/js/main.js 변경사항
**코드 변경 없음이 기대값이다.** 검증 결과(Planner가 읽고 확인):
- `initCategoryFilter()`는 `nav.querySelectorAll('.category-nav__btn')`와 `document.querySelectorAll('.category-section')`를 런타임에 수집한다. 버튼 개수·섹션 id를 하드코딩하지 않는다.
- 인디케이터: `updateIndicator()`가 활성 버튼의 `offsetLeft/offsetWidth`로 위치를 계산 → 5개에서도 그대로 동작.
- 키보드: `ArrowLeft/Right/Up/Down` 모듈러 순환, `Home`=0, `End`=`list.length - 1` → 5개 기준으로 자동 조정.
- `applyFilter()`는 `data-category` 비교만 하므로 `game` 제거에 영향 없음.
- `REVEAL_SELECTOR = '.link-card, .section-label, .category-title'` — 임베드 카드도 `.link-card`라 등장 애니메이션 대상. `.embed-item`은 카드 안에 있으므로 추가 불필요.
- `game`, `lumark`, `instagram` 문자열 참조 0건.
- 임베드는 정적 HTML이라 `esc()/safeUrl()` 대상(외부 데이터 주입)이 아니다. Widget API 스크립트를 넣지 않는다(외부 스크립트 금지).

Generator는 `grep -n "game\|lumark\|instagram\|feature" assets/js/main.js` 결과를 SELF_CHECK.md에 기록만 한다.

### sitemap.xml
`<url>` 블록 중 `<loc>https://hgfolio.com/pages/game.html</loc>`을 포함한 4줄 블록 전체 삭제. 루트 URL 블록만 남는다. XML이 well-formed인지 확인(`python3 -c "import xml.dom.minidom,sys;xml.dom.minidom.parse('sitemap.xml')"`).

### .claude/launch.json
`"startPath": "/pages/game.html"` → `"startPath": "/"`. JSON 유효성 확인(`python3 -m json.tool .claude/launch.json`).

### tests/ui-check.js — 수정하지 않는다 (근거)
- 필터 검사 대상이 `['writing', 'music', 'social']` + `all`이고 game/app을 다루지 않는다.
- 섹션·카드 개수를 단언하지 않는다(헤더 href 유효성, `.link-card` 가시성만 확인). 새 SoundCloud 헤더 href는 유효.
- `game`/`lumark`/`instagram` 문자열 의존 0건.
- 데스크톱 분기의 `.desktop-nav__link`·"3개 섹션" 문구는 이번 변경 이전부터 낡은 것이며 이번 범위와 무관 → 손대지 않는다(범위 계약).

### docs/ 갱신

#### docs/components.md
- §1 파일 구조 트리: `css/game.css`, `js/game.js`, `pages/game.html` 줄 삭제. `pages/`는 `pages/  ← (현재 비어 있음, 서브페이지용)`으로, 그리고 `_archive/  ← 내린 기능 백업 (게임: _archive/game-2026-11-18/)` 한 줄 추가. `main.js` 줄 수 표기는 실제 값으로.
- §1 본문의 "게임은 별도 페이지라 … 유일한 예외다 / 게임 파일들은 … 함께 확인해야 한다" 두 문장 삭제 → "메인 페이지는 3파일이 전부이며 예외 없음."으로 대체.
- 파일 접근 권한 표: `game.css/game.js` 행 삭제. `assets/img/*` 행을 `읽기 (미사용 이미지 삭제는 SPEC에 명시된 경우만)`으로.
- §2 컴포넌트 표를 실제 행으로 교체:

| 행 | 티어 | 클래스 / ID | JS 함수 |
|---|---|---|---|
| Velog | A | `.link-card` `#velog-items` | `fetchVelog()` — RSS 최근 3개 |
| GitHub | A | `.link-card` `#github-items` | `fetchGitHub()` — API 최근 3개 |
| Brunch | A | `.link-card` | — (정적 3개) |
| Melon | A | `.link-card` | — (정적 3개) |
| SoundCloud | B | `.link-card.link-card--embed` > `.embed-item` ×3 | — (정적 iframe 3개) |
| App Store | A | `.link-card.link-card--app` | — (정적 2개, 가운데 정렬) |
| 지식산책 | C | `.link-card` (`.icon--instagram`) | — |
| 네이버 | C | `.link-card` | — |

  표 위 문장 "아래 10개 행이 전부다" → "아래 8개 행이 전부다".
- §3 카테고리 표에서 Game 행 삭제(5행: All, writing, music, app, social). ARIA 설명의 "All은 5개 섹션을 동시에" → "All은 4개 섹션을 동시에".

#### docs/css-rules.md
- §2 플랫폼 아이콘 색상 목록에서 `Instagram2(…)` 항목 삭제.
- §2 하단 `> assets/css/game.css는 이 변수들을 그대로 상속…` 인용 단락 삭제.
- 공용 토큰 줄의 `--radius-lg: 16px`는 유지(변수 유지).
- §3 BEM: Block 목록에 `.embed-item` 추가, Element 목록에 `__frame` `__caption` `__link` `__index` `__by` 추가. Modifier `--feature(피처 행)` → `--embed(임베드 행)`, `--app`은 "앱 2개 가운데 정렬(`.link-card--app`) · 앱 아이콘 썸네일(`__thumb--app`)"로 설명 보강. 아이콘 모디파이어 목록에서 `--game` `--instagram2` 삭제.
- §4 레이아웃 Grid 설명: `repeat(3,1fr)`, 임베드 행 `1fr`, 앱 행 `repeat(2, calc((100% - 2*gap)/3))` + `justify-content:center`.
- §4 링크트리 토큰 표에 한 행 추가: `--embed-h | 300px | 260px | 임베드 행 플레이어 높이`.
- §4 카드 3티어 표 교체:

| 티어 | 구성 | 적용 |
|---|---|---|
| A. 프리뷰 행 | `__header` + `__divider` + `__items`(정사각 썸네일 3개). 앱은 `.link-card--app`로 2개를 같은 타일 크기로 가운데 정렬 | Velog, GitHub, Brunch, Melon, App Store |
| B. 임베드 행 | 위와 같되 `.link-card--embed`, `__items` 안에 `.embed-item`(iframe + 캡션 링크) 세로 스택. 카드 hover 리프트 없음 | SoundCloud |
| C. 단독 행 | `__header`만 | 지식산책, 네이버 |

  그 아래에 iframe 규칙 3줄 추가: "iframe은 `title` 필수 · `loading="lazy"` · `width/height/frameborder/scrolling` 속성 금지(크기·테두리는 CSS) · 자동재생 금지(`auto_play=false`)".

---

## 기능 상세

### 기능 1: Game 제거 마무리
- 사용자 동작: 탭 5개(All / Study & Writing & Dev / Music / Released Apps / Social). 방향키·Home/End·클릭 모두 정상, 인디케이터가 각 버튼에 정확히 맞는다.
- 죽은 링크 `/pages/game.html`이 index.html·sitemap.xml·launch.json 어디에도 없다.

### 기능 2: Released Apps 2개
- 모든 폭에서 기존과 같은 크기의 정사각 타일 2개(PopPath, 김간호는 음악박사)가 카드 가운데에 나란히 놓인다. 타일 모양·hover는 이전과 동일.

### 기능 3·4: Instagram
- Social = 지식산책(정식 인스타 그라데이션 아이콘) + 네이버. 푸터 인스타 아이콘 → @knowledge_stroll.

### 기능 5: SoundCloud 임베드 스택
- 헤더 클릭 → 프로필(`https://soundcloud.com/user-928451677`, 추적 파라미터 없음).
- 본문: HI THERE / LIE / IOU 플레이어를 카드 안에서 재생. 각 플레이어 아래 캡션 `01 HI THERE · HG ↗` 클릭 → 해당 세트 페이지 새 탭.
- 자동재생 없음. 화면 밖 플레이어는 lazy 로드. 로딩 전에는 코럴 빛 정지 그라디언트 판 + 1px 링.
- hover/focus: 해당 판의 링이 `--brand-35`로, 번호가 `--brand-text`로. 카드 자체는 들썩이지 않고 주황 글로우만.

---

## 주의사항
- **필터 전환 직후 iframe**: 섹션이 `display:none`에서 돌아올 때 lazy iframe이 그때 로드된다(정상). 재생 중 다른 탭으로 전환하면 iframe이 `display:none`이 되며 브라우저에 따라 재생이 계속될 수 있다 — 이번 범위에서 JS로 제어하지 않는다(금지 항목).
- iframe은 `.link-card__items`(`z-index:1`, `position:relative`) 안에 있어 카드 hover 레이어보다 위 → 클릭 가능. 헤더 링크 영역과 겹치지 않는다.
- 보안: iframe 출처는 `w.soundcloud.com` 고정 정적 문자열. `sandbox`는 위젯 재생을 깨뜨릴 수 있어 넣지 않는다. 캡션 링크는 `target="_blank" rel="noopener"`.
- 접근성: iframe `title`로 스크린리더에 "HI THERE — HG SoundCloud 플레이리스트" 고지. 캡션 링크 aria-label은 보이는 텍스트("HI THERE")로 시작해 label-in-name 충족. 장식 아이콘·번호는 `aria-hidden`.
- 이미지 삭제 전 반드시 `grep -rn "app-lumark\|cover-holdmetight\|cover-halis\|cover-need" --include=*.html --include=*.css --include=*.js . | grep -v node_modules | grep -v _archive` → 0건 확인 후 삭제.

## 완료 검증 체크리스트 (Generator가 SELF_CHECK.md에 결과 기록)
1. `grep -n "game\|Game" index.html assets/css/style.css sitemap.xml .claude/launch.json` → 0건 (주석 포함).
2. `grep -n "instagram2\|hy_nxx9\|lumark\|Lumark\|link-card--feature\|utm_source\|frameborder\|scrolling=\|ff5500" index.html assets/css/style.css` → 0건 (`#ff5500`은 `.icon--soundcloud` 그라디언트에 남아야 하므로 style.css에서는 그 1건만 허용).
3. `grep -c "embed-item__frame" index.html` → 3, 각 iframe에 `title=` `loading="lazy"` `allow="autoplay; encrypted-media"` 존재, `auto_play=false` 3건, `color=%23b07068` 3건.
4. `grep -n "?v=20261118-1" index.html` → 2건.
5. 정의 없는 `var(--…)` 0건 (`--embed-h` 정의 확인).
6. 탭 버튼 5개, `.category-section` 4개, 순서 일치.
7. `npm run ui-check` 가능하면 실행해 결과 기록(불가 시 사유 기록).
8. 삭제 대상 이미지 4개 처리 결과.

---

## 부록 A — 기준 커밋 재정렬과 범위 확장 (2026-11-18, 오케스트레이터)

> **이 부록이 본문과 충돌하면 부록이 우선한다.**

### A-1. 왜 다시 맞췄나
본문은 로컬 저장소의 `c2c6462`(8월 14일)를 기준으로 썼다. 푸시 직전에 확인하니 원격 `main`은 `b8545e7`(9월 23일, "quiet the page down" 정리)까지 나가 있었고, 운영 중인 사이트도 그 버전이었다. 그래서 변경분을 `b8545e7` 위에 3-way 병합으로 다시 얹고, 바뀐 기반에 맞춰 아래를 조정했다.

| 본문 | 최종 구현 | 이유 |
|---|---|---|
| C3 `&.is-visible:hover { transform: translateY(0); }` | `&:hover { transform: none; }` | 원격에서 카드 등장이 keyframes(`card-rise`, fill backwards)로 바뀌어 `.is-visible`이 transform을 잡지 않는다 |
| C4 프레임 빈 판 배경 `var(--bg-dark)` | `var(--bg-item)` | 원격이 아이템 배경 토큰 `--bg-item`을 도입 |
| C2 `:has(.icon--…):hover` 글로우 줄 삭제 | `--card-glow` 목록에서 `instagram2` 한 줄 삭제 | 원격이 글로우를 `--card-glow` 변수 하나로 통합 |
| C1 `--radius-lg` 주석 "서브페이지용 예약" | "프로필 모달 박스" | 원격에서 `.modal-box`가 이 변수를 쓴다 |
| 삭제 대상 이미지 4개 | `cover-need.jpg` 대신 `cover-iou.jpg` | 원격이 SoundCloud 썸네일을 IOU / Hold me tight / HALIS로 바꿨다 (임베드로 대체되며 3장 모두 미사용) |
| H3 "앱 카드 마크업 변경 없음" | `.link-card--app` 클래스를 다시 붙임 | 원격이 CSS 없는 수정자라며 지웠다. 2개 가운데 정렬 규칙의 후크로 필요 |

### A-2. 점검에서 나온 수정 (사용자 요청 "오류·보안 점검 후 수정, 코드 정리")
수정 허용 파일에 `assets/js/main.js`, `tests/ui-check.js`, `docs/js-rules.md`, `_config.yml`(신규)를 더한다.

| # | 문제 | 수정 |
|---|---|---|
| 1 | Velog 카드가 운영 사이트에서 "응답 시간 초과" — 중계 프록시 codetabs가 응답하지 않음 | `fetchVelog()`가 로더 2개(rss2json → codetabs)를 순서대로 시도. 응답은 `{title, link, image, date}`로 정규화 |
| 2 | Game 탭이 빠지며 탭 알약이 컬럼보다 좁아져 데스크톱에서 오른쪽으로 32px 치우침 | `@media (min-width: 521px)`에서 auto 마진 제거 |
| 3 | 닫힌 프로필 모달이 `opacity: 0`뿐이라 안의 링크 6개에 Tab 포커스가 들어감 | `visibility: hidden` + 열릴 때 즉시 `visible` |
| 4 | 모달을 Profile 버튼으로 열어도 닫으면 포커스가 아바타로 감 | 모달을 연 트리거로 복귀 |
| 5 | 모달 정보 줄의 `<br>`이 flex 행에서 무시돼 라벨과 보조 줄이 옆으로 나란히 섬 ("보유 자격증"이 두 줄로 꺾임) | `.modal-info__text`로 감쌈 |
| 6 | `theme-color` 메타가 OS 설정 기준이라 사이트 테마와 어긋남 | 메타 1개 + `initThemeToggle()`이 동기화 |
| 7 | 스켈레톤 라벨 줄이 흰색 고정값이라 라이트 테마에서 안 보임 | `var(--border)` |
| 8 | `aria-label`이 `role` 없는 `<div>`에 붙음 (2곳) | `role="group"` |
| 9 | CDN 스타일시트에 무결성 검사 없음 | Font Awesome `integrity`(SRI) + `crossorigin` |
| 10 | 주입 대비 2차 방어선 없음 | `<meta http-equiv="Content-Security-Policy">` (인라인 테마 스크립트는 sha256 해시로 허용) |
| 11 | `esc()`가 작은따옴표를 이스케이프하지 않음 | `'` → `&#39;` |
| 12 | 작업 문서·테스트가 사이트로 배포됨 (`/SPEC.html`, `/CLAUDE.html`, `/docs/*`, `/tests/*`, `/package.json`) | `_config.yml`의 `exclude` |
| 13 | 죽은 코드: 빈 `finally {}` 2곳, `ui-check.js`의 없는 셀렉터 분기(`.desktop-nav__link`, `.js-theme-toggle-desktop`) | 제거. `ui-check.js`는 탭↔섹션 일치·닫힌 모달 숨김·theme-color를 검사하도록 갱신 |

저장소 밖 문제(코드로 고칠 수 없음): `hgfolio.com`에 HTTPS 인증서가 발급돼 있지 않아 사이트가 HTTP로만 열린다. GitHub Pages 설정에서 처리해야 한다.
