# 자체 점검

전략: Case A — 이유: 최초 구현. SPEC이 마크업/CSS를 확정 제공했고 JS는 NO-OP 판정. 설계를 정밀 반영.

---

## 1. 파일별 실제 변경 요약

### index.html (+63줄, 2곳)
1. **카테고리 탭 버튼 추가** — `.category-nav` 내 Game 버튼 직후, `</nav>` 직전에
   `<button data-filter="app" role="tab" aria-selected="false">` + 스마트폰 인라인 SVG(`viewBox 0 0 24 24`, `stroke="currentColor"`, `stroke-width="2"`, round cap/join, `aria-hidden`) + `.category-nav__label`("Released Apps"). 나머지 5개 탭과 동일 규격.
2. **Released Apps 섹션 추가** — Game 섹션 닫는 `</div>` 직후, Social 섹션 앞에
   `.category-section[data-category="app"][id="section-app"]` 삽입.
   - `.category-header`(`.category-title` "Released Apps" + `.section-label` "App Store 정식 출시 iOS 앱")
   - `.links.links--section` > `.link-card.link-card--app` 1개
     - `.link-card__header`(App Store 링크, `.link-card__icon.icon--app` + `fa-app-store-ios`, `__info`, `__arrow`)
     - `.link-card__divider`
     - `.link-card__items` > `.featured-item` 3개(PopPath → 김간호는 음악박사 → Lumark), 각 `<img class="featured-item__thumb featured-item__thumb--app" width="256" height="256" loading="lazy" alt="…앱 아이콘">` + `__label` + `__meta`(`__source--app` "App Store" + `__detail` 태그라인).
   - 모든 외부 링크: `target="_blank" rel="noopener"` + 확정 App Store URL 그대로.

### assets/css/style.css (+24줄, 5곳)
1. `:root` 하단(`--focus-pill-bg` 다음): `--platform-app:#0a84ff`, `--platform-app-14`, `--glow-app` 추가.
2. `html.light` 하단(`--focus-pill-bg` 다음): 라이트 대응 `--platform-app:#0071e3` 등 3개 추가.
3. 기본 `.featured-item` 블록 내 base `__thumb` 규칙 직후: `& .featured-item__thumb--app`(`border-radius:22.37%` + `1px solid var(--border)` + `box-shadow:0 2px 8px rgba(0,0,0,0.25)`).
4. 같은 블록 `__source--github` 다음: `& .featured-item__source--app`(`var(--platform-app-14)` / `var(--platform-app)`).
5. Platform Icon Colors 블록 `.icon--naver` 다음: `.icon--app`(변수 사용). 그리고 `.link-card`의 `&:has(...)` 글로우 목록 끝에 `&:has(.icon--app):hover { box-shadow:0 6px 24px var(--glow-app); }` 추가.

### assets/js/main.js
**변경 없음(NO-OP).** git diff 공란 확인.

---

## 2. SPEC 대비 반영 체크리스트

- [x] A. 카테고리 탭 버튼(Game 다음, `</nav>` 앞) — 규격/속성 동일
- [x] B. 새 섹션(Game↔Social 사이) — `.link-card` 1개 + `.featured-item` 3개 재사용
- [x] 앱 순서 PopPath → 김간호는 음악박사 → Lumark
- [x] 확정 App Store URL 정확 기입(한글 앱 URL 퍼센트 인코딩 그대로)
- [x] 태그라인 확정 문구 그대로("할 일을 흐름으로 정리" / "리듬 액션 게임" / "읽고 밑줄 긋는 기록")
- [x] `<img>` width/height 256 + loading="lazy" + 의미 있는 alt
- [x] CSS A: `:root` + `html.light` 변수 추가(삭제/변경 없음, 추가만)
- [x] CSS B: `.featured-item__thumb--app` modifier 라운드/테두리/그림자
- [x] CSS C: `.featured-item__source--app` 배지 + `.icon--app` 헤더 아이콘 색
- [x] CSS D: 카드 글로우 `&:has(.icon--app):hover` 한 줄
- [x] CSS E: 반응형 — 기존 3열 유지, 앱 전용 레이아웃 미발명(`border-radius:22.37%`는 크기 무관)
- [x] CSS F: reduced-motion — 신규 트랜지션 미도입, 기존 블록이 커버
- [x] JS: NO-OP(3-1 근거 참조)

---

## 3. JS 무변경 판정 근거 (grep 인용)

기존 두 셀렉터가 새 섹션의 컨테이너 클래스 `.link-card`를 이미 포함:

```
413:  const targets = document.querySelectorAll('.link-card, .social-card, .section-label, .platform-showcase, .game-showcase, .category-title, .focus-card, .focus-board__title, .focus-board__lede');
446:      sec.querySelectorAll('.link-card, .social-card, .section-label, ...');
```

- 새 카드는 기존 정적 카드와 동일하게 `.featured-item`를 `.link-card` **내부**에 두므로, 부모 `.link-card`가 리빌될 때 함께 표시된다(GitHub/Velog/Melon 정적 카드와 동일 동작). `.featured-item` 자체는 원래도 셀렉터에 없었고 필요 없음.
- 새 탭은 `<button data-filter="app">` → `initCategoryFilter`가 `.category-nav__btn` 전체 순회 + `<a>`만 제외하므로 자동 바인딩.
- 새 섹션은 `data-category="app"` → `applyFilter`의 `sec.dataset.category === filter` 매칭으로 자동 표시/숨김.
- `git diff assets/js/main.js` = 공란(변경 0).

SPEC 24행이 "413행 셀렉터에 `.featured-item` 포함"이라 서술했으나 실제로는 미포함이다. 그러나 컨테이너 `.link-card`가 포함되어 있어 결과는 동일(NO-OP 유효). 셀렉터 수정 불필요.

---

## 4. 패턴 준수 확인

- BEM 네이밍: 준수(`.link-card--app`, `.featured-item__thumb--app`, `.featured-item__source--app`, `.icon--app` — 모두 기존 규칙 재사용)
- CSS 변수 사용: 준수. 신규 색은 전부 `--platform-app*`/`--glow-app` 변수. 하드코딩·인라인 없음.
- CSS 네이티브 중첩: 준수. `.featured-item`/`.link-card` 블록 내부에 `& …` 형태로 삽입.
- 반응형 520px: 대응. 신규 레이아웃 미발명, 기존 3열 그리드·`.link-card` 모바일 규칙(padding/gap 축소) 상속. `border-radius:22.37%`는 크기 무관.
- reduced-motion: 대응. 신규 애니메이션/트랜지션 미도입 → 기존 `@media (prefers-reduced-motion: reduce)`가 그대로 커버.
- esc()/safeUrl(): 해당 없음(정적 신뢰 하드코딩 링크, 런타임/외부 데이터 아님).
- 가드 클래스: 해당 없음(JS 무변경).
- DOMContentLoaded 등록: 해당 없음(JS 무변경).
- -webkit-backdrop-filter: 해당 없음(신규 backdrop-filter 미도입).
- 파일 간 정합성: 확인. HTML `icon--app`↔CSS `.icon--app`, HTML `featured-item__thumb--app`↔CSS 동명 규칙, HTML `featured-item__source--app`↔CSS 동명 규칙, `data-filter/data-category="app"`↔기존 JS 로직.

---

## 5. 정적 검증 결과

- HTML 새 섹션 태그 균형: `<div>` 16/16, `<a>` 4/4, `<img>` 3, `.featured-item` 3 — 균형.
- 카테고리 탭 `<button>`: 6개 / `</button>` 6개 — 균형.
- CSS 중괄호 균형: `{` 609 / `}` 609 — 균형.
- app 아이콘 이미지 3개 존재 확인: app-poppath.png / app-ganho.png / app-lumark.png.
- git diff: index.html(+63), style.css(+24), main.js(0). 3개 파일 범위 준수, JS 무변경.

---

## 6. 스스로 발견한 리스크 / 미확인 항목

1. **`.featured-item__source--app` 배지 배경 방식 차이**: 기존 velog/github 배지는 `color-mix(... 14% ...)`를 쓰지만, 본 배지는 SPEC C 지시대로 사전 계산된 `var(--platform-app-14)`를 사용. 색상 결과는 동등(둘 다 14% 알파). 인라인/하드코딩 아님. — 의도된 차이, 리스크 낮음.
2. **`fa-brands fa-app-store-ios` 렌더**: 헤더 아이콘 한정 의존. 미표시 시에도 카드 본체(앱 아이콘 이미지)는 정상. FA 6.5.1에 존재하나 브라우저 실렌더는 정적 검증만으로는 미확인. — 표시 확인 권장(카드 기능에는 영향 없음).
3. **모바일 3열 아이콘 크기**: `.page-wrapper` 680px, `.link-card__items` 3열에서 앱 아이콘이 다른 정사각 썸네일과 동일 크기. SPEC이 "44px 미만이면 미세 조정" 여지를 뒀으나 기존 카드와 동일 리듬 유지가 우선이라 조정 없이 3열 유지. 실기기 오버플로는 정적 검증 범위 밖 — 브라우저 확인 권장.
4. **라이트 테마 아이콘 배경**: full-bleed PNG라 `html.light .featured-item` 배경 거의 안 보임. `--border`가 라이트에서 자동 전환되어 테두리 대비 확보. — 리스크 낮음.
