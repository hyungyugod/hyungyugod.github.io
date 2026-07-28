# 컴포넌트 & 프로젝트 구조

이 문서는 프로젝트의 파일 구조, 현재 컴포넌트 목록, 테마 시스템을 정의합니다.

---

## 1. 파일 구조

```
/ (루트)
├── index.html              ← 메인 페이지
├── assets/
│   ├── css/style.css       ← 메인 페이지 스타일 전부 (~1900줄)
│   ├── css/game.css        ← 게임 전용 스타일 (style.css 변수를 상속)
│   ├── js/main.js          ← 메인 페이지 스크립트 전부 (~640줄)
│   ├── js/game.js          ← 게임 로직 (게임 페이지에서만 로드)
│   └── img/                ← 이미지 에셋
├── pages/
│   └── game.html           ← 미니게임 서브페이지
├── docs/                   ← 이 문서들 (Claude가 필요할 때 읽음)
├── tests/ui-check.js       ← Playwright 스모크 테스트 (npm run ui-check)
├── robots.txt · sitemap.xml · CNAME
└── favicon.ico
```

**메인 페이지는 `index.html` + `style.css` + `main.js` 3개 파일이 전부다.**
게임은 별도 페이지라 `game.css` / `game.js`로 분리되어 있으며, 이것이 유일한 예외다.
게임 파일들은 `style.css`의 `:root` 변수를 상속해 쓰므로 변수를 지울 때 함께 확인해야 한다.

### 파일 접근 권한

| 파일 | 수정 가능 |
|---|---|
| `index.html` | O |
| `assets/css/style.css` | O |
| `assets/js/main.js` | O |
| `assets/img/*` | 읽기만 |
| `pages/*.html` | O (서브페이지 생성 시) |
| `assets/css/game.css`, `assets/js/game.js` | O (게임 페이지 작업 시) |
| `tests/ui-check.js` | O (셀렉터가 낡았을 때) |

### 핵심 제약

- 메인 페이지에는 새 CSS/JS 파일을 만들지 않는다. **3파일 구조를 유지**한다.
- 외부 라이브러리/프레임워크를 추가하지 않는다 (바닐라 JS, 네이티브 CSS).
- 페이지 본문은 **단일 컬럼 링크트리**다. 새 콘텐츠는 `.link-card` 3티어 중 하나로 만든다. 새 카드 컴포넌트를 만들지 않는다.

---

## 2. 컴포넌트 목록

본문은 `.link-card` **한 종류**로 통일되어 있다. 아래 10개 행이 전부다.

| 행 | 티어 | 클래스 / ID | JS 함수 |
|---|---|---|---|
| Velog | A | `.link-card` `#velog-items` | `fetchVelog()` — RSS 최근 3개 |
| GitHub | A | `.link-card` `#github-items` | `fetchGitHub()` — API 최근 3개 |
| Brunch | A | `.link-card` | — (정적 3개) |
| Melon | A | `.link-card` | — (정적 3개) |
| SoundCloud | A | `.link-card` | — (정적 3개) |
| App Store | A | `.link-card` | — (정적 3개) |
| Game | B | `.link-card.link-card--feature` | — (내부 링크) |
| Instagram | C | `.link-card` | — |
| 지식산책 | C | `.link-card` | — |
| 네이버 | C | `.link-card` | — |

티어 정의는 `css-rules.md` §4 참조. 새 링크는 셋 중 하나를 고르는 것이지 새 컴포넌트를 만드는 게 아니다.

### 그 외 컴포넌트

| 컴포넌트 | HTML 클래스 | JS 함수 |
|---|---|---|
| 프로필 섹션 | `.profile` | `initTyping()` `initMottoReveal()` `initNameShine()` |
| 카테고리 필터 | `.category-nav` (radiogroup) | `initCategoryFilter()` |
| 프로필 모달 | `.modal-backdrop` | `initModal()` |
| 테마 토글 | `.theme-toggle` `.js-theme-toggle` | `initThemeToggle()` |
| 스크롤 진행바 | `.scroll-progress` | `initScrollProgress()` |
| 푸터 | `.footer` | — |

### 유틸리티 함수

`esc()` · `safeUrl()` · `fetchWithTimeout()` · `showFetchError()` · `safeInit()`

### 공용 상수

`REVEAL_SELECTOR` — 스크롤 등장 애니메이션 대상. `initScrollReveal()`과 `applyFilter()`가 공유한다.
등장 애니메이션이 필요한 새 컴포넌트를 만들면 여기에 추가해야 한다.

---

## 3. 카테고리 필터 시스템

`.category-section` 요소에 `data-category` 속성을 부여하여 탭 필터링:

| 버튼 라벨 | data-filter / data-category | 섹션 id |
|---|---|---|
| All | `all` (전체 표시) | — |
| Study & Writing & Dev | `writing` | `#section-writing` |
| Music | `music` | `#section-music` |
| Game | `game` | `#section-game` |
| Released Apps | `app` | `#section-app` |
| Social | `social` | `#section-social` |

**버튼 순서와 DOM 섹션 순서는 항상 일치시킨다.** 어긋나면 All 화면에서 순서가 뒤바뀐다.
GitHub/Velog 카드 내부 아이템만 런타임 동적 생성, 나머지는 정적 HTML.

### ARIA — tabs가 아니라 radiogroup이다

겉모습은 탭바지만 **`role="radiogroup"` + `role="radio"`** 를 쓴다. WAI-ARIA의 tabs 패턴은
"선택된 탭 하나당 패널 하나"를 전제하는데, 이 필터의 **All은 5개 섹션을 동시에 보여주므로**
tabs로 표기하면 스크린리더에 거짓말이 된다. 단일 선택 필터의 정확한 패턴은 radiogroup이다.

지켜야 할 규칙:
- 선택 상태는 `aria-checked`로 표시한다 (`aria-selected`가 아니다)
- **roving tabindex**: 선택된 버튼만 `tabindex="0"`, 나머지는 `-1`. Tab 한 번에 그룹을 지나친다
- 방향키/Home/End로 이동하며, 라디오 규약대로 **이동과 동시에 선택**된다
- 섹션은 `<section aria-labelledby="title-*">` 랜드마크이며, 숨김은 `display:none`이라
  접근성 트리에서도 사라진다 — 별도 `aria-hidden`이 필요 없다

이 규칙들은 `initCategoryFilter()`의 `select()` 함수 하나에 모여 있다.

---

## 4. 테마 시스템

`<html>` 태그의 **`light` 클래스**로 전환한다 (`data-theme` 속성이 아니다).

- 클래스 없음 → 다크 (기본)
- `<html class="light">` → 라이트

```css
:root      { --bg: #0f0e15; }   /* 다크 = 기본값 */
html.light { --bg: #faf9fb; }   /* 라이트 = 오버라이드 */
```

```js
const isLight = root.classList.toggle('light');   // initThemeToggle()
```

`localStorage`의 `theme` 키에 저장하며, `index.html` `<head>`의 인라인 스크립트가
스타일시트보다 먼저 클래스를 붙여 **첫 페인트 깜빡임을 막는다.** 이 스크립트는 지우면 안 된다.

새 색상을 추가할 때는 `:root`와 `html.light` **양쪽 모두**에 선언한다.
한쪽만 넣으면 반대 테마에서 값이 새어나온다.

---

## 5. 작업 체크리스트

새 기능을 구현할 때 아래 순서를 따른다:

### 작업 전
- [ ] 관련 파일을 **Read로 읽어** 기존 패턴 확인
- [ ] 수정할 영역의 주변 코드 파악

### HTML 작업
- [ ] 새 링크는 `.link-card` 3티어 중 하나로 (새 카드 컴포넌트 금지)
- [ ] BEM 클래스명 + `js-` 후크 클래스 (필요 시)
- [ ] 동적 컨테이너에 고유 `id` 부여
- [ ] `target="_blank"` 외부 링크에 `rel="noopener"` 포함
- [ ] 장식용 `<i>` / `<svg>`에 `aria-hidden="true"`
- [ ] 버튼이 아닌 클릭 트리거에는 `role="button"` + `tabindex="0"` + `aria-label` + keydown 핸들러
- [ ] 새 섹션을 추가하면 카테고리 탭도 같은 순서로 추가

### CSS 작업
- [ ] 색상은 CSS 변수 사용 (새 색상은 `:root`와 `html.light` **양쪽**에 추가)
- [ ] 여백·아이콘 크기는 `--card-*` / `--stack-gap` 토큰 사용 (px 하드코딩 금지)
- [ ] CSS 네이티브 중첩 `&` 문법 — 모디파이어는 `&.block--variant` (`&--variant`는 무효)
- [ ] 호버: `translateY` + `box-shadow` + `border-color` 조합
- [ ] 트랜지션: `var(--transition)`
- [ ] 글래스모피즘: `backdrop-filter` + `-webkit-` 접두사
- [ ] 간격: `gap` 속성 사용
- [ ] `@media (prefers-reduced-motion: reduce)` 접근성 대응
- [ ] 컴포넌트를 지웠다면 `html.light` 오버라이드와 `:root` 전용 변수도 함께 삭제

### JS 작업
- [ ] `function init기능명()` 또는 `async function fetch기능명()` 패턴
- [ ] `DOMContentLoaded` 블록에 `safeInit()`으로 등록
- [ ] 가드 클래스 (`if (!el) return;`)
- [ ] 외부 데이터: `esc()` 필수. URL은 `safeUrl()` **후에도** `esc()`
- [ ] API: `fetchWithTimeout()` + `try/catch/finally`
- [ ] 에러: `console.warn()` + `showFetchError()`
- [ ] JSDoc 주석 + 섹션 구분선
- [ ] 등장 애니메이션이 필요하면 `REVEAL_SELECTOR`에 추가

### 작업 후
- [ ] 3개 파일 간 클래스명/ID 일관성 확인
- [ ] 삭제한 컴포넌트의 문자열이 3파일에 0건인지 grep
- [ ] 정의 없이 참조되는 `var(--*)`가 없는지 확인
- [ ] `npm run ui-check` 통과 (셀렉터가 낡았으면 테스트도 함께 수정)
- [ ] 다크·라이트 양 테마 확인
- [ ] 모바일 520px 이하 대응 확인
