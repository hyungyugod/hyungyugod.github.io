# QA 검수 보고서

## UI 동작 검증 (Playwright)

| 체크 항목 | 결과 | 비고 |
|---|---|---|
| 테마 토글 | PASS | 다크→라이트→다크 전환 정상 |
| 카테고리 필터 (writing) | PASS | 3개 섹션 숨김 확인 |
| 카테고리 필터 (music) | PASS | 3개 섹션 숨김 확인 |
| 카테고리 필터 (social) | PASS | 3개 섹션 숨김 확인 |
| 카테고리 필터 (all) | PASS | 0개 섹션 숨김 확인 |
| 카테고리 필터 (game) | N/A | 테스트 하네스 미포함 — 동일 버튼 패턴이므로 writing/music/social의 PASS로 회귀 없음 판단 |
| 프로필 모달 | FAIL | `.profile__btn.js-open-profile` 없음. 그러나 이는 이전 커밋(`ce39146 프로필 버튼 제거`)에서 이미 제거된 것으로, 본 Sprint와 무관한 스테일 테스트. **채점 제외**. |
| 링크카드 href | PASS | 2개 링크 모두 유효 |
| 모바일 520px | PASS | 핵심 요소 3개 모두 visible |
| 콘솔 에러 | PASS | 0건 |

결과: 8/9 통과. 실패 1건은 본 Sprint 변경과 무관한 사전 제거된 기능 관련.

## SPEC 기능 검증
- [PASS] 기능 1 — Game 쇼케이스 카드: `index.html:378–417`에 `data-category="game"` 섹션이 Music과 Social 사이에 추가됨. 썸네일/배지/아이콘/타이틀/태그라인/메타 3항목/CTA 모두 마크업 존재. 썸네일·CTA 둘 다 `/pages/game.html`로 이동하며 각기 고유 `aria-label` 부여.
- [PASS] 기능 2 — Game 카테고리 필터 버튼: `index.html:159`에서 `<button class="category-nav__btn" data-filter="game" type="button">Game</button>`로 교체됨. 기존 필터 플로우가 자동 처리. `.category-nav__btn--link` modifier 및 선행 주석 CSS에서 깔끔히 제거 확인(`style.css:727` 경계 정상).
- [PASS] 스크롤 리빌 & 필터 셀렉터에 `.game-showcase` 반영 (`main.js:396`, `main.js:429`).
- [PASS] `prefers-reduced-motion`: `.game-showcase` 포함 + 썸네일 `img` transition 억제 (`style.css:2056–2057`).

## 검수 결과 요약

| 등급 | 건수 |
|---|---|
| P0 치명 | 0건 |
| P1 중요 | 0건 |
| P2 권장 | 2건 |

## P0 — 치명적 이슈
없음.

## P1 — 중요 이슈
없음.

## P2 — 권장 사항

### 1. `transition: all` 사용
- **파일**: `assets/css/style.css:1345`
- **현재 코드**: `transition: all var(--transition);` (`.game-showcase__cta`)
- **코멘트**: 명시적 속성 나열(`background, border-color, color`)이 성능·예측성 면에서 더 낫다. 다만 코드베이스 내 다른 CTA(`platform-showcase__cta` 등)도 유사 패턴을 쓰고 있어 일관성 관점에서는 허용 가능. 차기 리팩토링에서 개선 권장.
- **수정 제안**: `transition: background var(--transition), border-color var(--transition), color var(--transition);`

### 2. Playwright 하네스에 Game 필터 케이스 미존재
- **파일**: `tests/ui-check.js`
- **코멘트**: 본 Sprint에서 Game 탭이 필터 버튼으로 전환되었으므로, 하네스에 `filterCategory('game', 3)` 케이스를 추가하면 향후 회귀 방지에 유리. SPEC 범위 외이므로 강제 아님.

## 통과 항목

- **보안**: 내부 정적 경로만 사용(`/pages/game.html`, `/assets/img/cover-game.jpg`) → `safeUrl()` 불필요. `innerHTML` 신규 사용 없음. 인라인 이벤트 핸들러 없음.
- **CSS 패턴**:
  - CSS 네이티브 중첩 `&` 일관 사용, SCSS 문법 혼입 없음.
  - `:root` 브랜드 변수(`--brand`, `--brand-08~40`, `--brand-light`, `--bg-card`, `--text-muted`, `--transition`, `--ease-out-expo`) 전면 사용. 하드코딩 색상은 SPEC이 명시 지시한 레트로 오버레이(`rgba(255,255,255,0.02)`, `rgba(15,14,21,0.5)`)와 라이트 테마 오버라이드(`rgba(176,112,104,...)`)뿐 — SPEC 명시 예외.
  - `!important` 없음.
  - BEM 준수(`.game-showcase__thumb`, `__body`, `__accent`, `__badge`, `__overlay`, `__top`, `__icon`, `__info`, `__title`, `__tagline`, `__meta`, `__cta`).
  - `-webkit-backdrop-filter` 컨테이너·배지 모두 함께 작성(`style.css:1170, 1250`).
- **JS 패턴**: `applyFilter`/`initScrollReveal` 셀렉터만 최소 수정, 신규 init 불필요. 가드 클래스 유지. `console.error` 없음. 기존 init 패턴 보존.
- **HTML 구조**:
  - 모든 `<img>`에 `alt` 존재.
  - 장식 아이콘은 `aria-hidden="true"`.
  - 썸네일/CTA 링크에 고유 `aria-label` 부여.
  - 인라인 스타일 없음.
  - 내부 링크이므로 `target="_blank"`·`rel="noopener"` 불필요.
- **반응형 & 접근성**:
  - `@media (max-width: 520px)`에서 1-컬럼 전환 + 패딩/폰트 축소 완비(`style.css:1740–1750`).
  - `prefers-reduced-motion` 대응(`style.css:2056–2057`).
  - `:focus-visible` 스타일(`thumb`, `cta`) 양쪽 모두 존재.
- **파일 간 정합성**: HTML 클래스↔CSS 규칙 전부 대응. `data-category="game"` 섹션 ↔ `data-filter="game"` 버튼 일치. JS 셀렉터가 참조하는 `.game-showcase` 클래스가 HTML에 존재.
- **Sprint 범위 준수**: SPEC 금지 항목(`pages/game.html`, `game.css`, `game.js`, `cover-band`, 기존 showcase 수정, `:root` 변수 삭제) 모두 미수행 확인. SPEC 외 독립 기능 추가 없음. 섹션 순서 Writing → Music → Game → Social 정확.
- **AI 슬롭 패턴**: 보라-청록 그라디언트 없음. 과대 그림자 없음(`0 8px 40px` 사용 — 사이트 내 허용 범위). `border-radius: 16px`는 기존 `.platform-showcase`와 동일. `scale(1.04)`/`scale(1.08)`는 SPEC 지시·적정 범위. `setTimeout` 신규 추가 없음.

---

## 채점

**항목별 점수** (기능 변경 평가 기준 적용):
- 패턴 일관성: 9/10 → BEM·CSS변수·네이티브중첩·init 패턴 모두 준수, `transition: all` 1건만 P2
- 보안 & 접근성: 10/10 → 내부 링크 + aria-label·alt·focus-visible·reduced-motion·aria-hidden 전방위 대응
- 반응형 & UI 품질: 9/10 → 520px 1-컬럼 전환 완비, glassmorphism 톤 일관, `-webkit-` 접두사 포함
- 기능 완성도: 10/10 → SPEC 기능 2개 전부 구현, 스크롤 리빌 및 필터 셀렉터 업데이트, dead code 제거

**가중 점수**: (9×0.40) + (10×0.25) + (9×0.20) + (10×0.15) = 3.60 + 2.50 + 1.80 + 1.50 = **9.40 / 10.0**

> **관대함 재검토**: 9.4는 높은 점수이므로 재확인했다. (1) SPEC이 매우 상세하게 마크업·CSS 속성·셀렉터 수정까지 지정했고 Generator가 그대로 충실히 반영, (2) AI 슬롭 패턴 0건, (3) 접근성 속성 누락 0건, (4) Playwright 회귀 없음. 점수 상향 요인을 상쇄할 만한 실질적 결함을 발견하지 못했다. P2 2건은 각 항목에서 이미 -1점 반영됨.

## 최종 판정: **합격**

**구체적 개선 지시** (선택적 — 합격이므로 필수 아님):
1. `assets/css/style.css:1345` — `.game-showcase__cta`의 `transition: all`을 `background, border-color, color` 명시 나열로 교체(차기 리팩토링 시).
2. `tests/ui-check.js` — 카테고리 필터 테스트에 `filterCategory('game', 3)` 케이스 추가해 향후 회귀 검증 강화(범위 외, 선택).
