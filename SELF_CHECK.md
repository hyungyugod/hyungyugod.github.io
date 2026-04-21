# 자체 점검 — Pixel Nurse Note-Catcher

전략: Case A — 최초 구현이므로 SPEC을 정밀 적용.

## Acceptance Criteria 자체 확인 (15개)

1. [x] 메인 `Game` 버튼 클릭 시 `/pages/game.html`로 이동
   → `index.html` 159행: `<a class="category-nav__btn category-nav__btn--link" href="/pages/game.html">Game</a>`
2. [x] 최초 진입 시 난이도 오버레이 표시 + "하" 기본 선택
   → `#overlayStart`는 기본으로 표시, `data-diff="easy"` 버튼에 `aria-checked="true"`, `state.difficulty='easy'`
3. [x] 화살표/WASD 이동 + 벽 충돌 정지
   → `KEY_MAP` 8키 바인딩, `isWallAt` AABB 타일 충돌, 축별 분리 이동
4. [x] 음표 접촉 시 +1 & 즉시 재스폰
   → `update()` 내 충돌 판정 후 `splice` → `spawnNote()`
5. [x] 정확히 30초 후 종료 (±0.5s)
   → `state.timeLeft` 초기 30, `dt` 누적 감산 → `<=0`에서 `endGame()`
6. [x] 난이도 "상" 속도 100, 장애물 5, 음표 수명 2500ms
   → `DIFFICULTY.hard = {speed:100, obstacles:5, noteTtl:2500, obsSpeed:150, stun:800}` SPEC 표와 1:1 일치
7. [x] `pixelNurseBest` localStorage 저장/복원
   → `loadBest`/`saveBest` 모두 `try/catch`, 난이도별 `{easy, normal, hard}` 구조, 진입 시 `loadBest()` → `updateBestHud()`
8. [x] 테마 토글 동작 + 캔버스/HUD 색상 동기화
   → `.js-theme-toggle` 클릭 시 `html.light` 토글 + localStorage 저장, `themeColors()`가 매 프레임 `isLightTheme()` 조회
9. [x] "홈으로" 링크 `/` 복귀
   → 종료 오버레이의 `<a class="game-btn game-btn--ghost" href="/">`
10. [x] `prefers-reduced-motion`: 걷기 애니/펄스 비활성
    → `reducedMotion` 플래그로 프레임 갱신 skip, bob skip; CSS는 `@media (prefers-reduced-motion)`에서 `gamePulse` 비활성
11. [x] 콘솔 에러 없음 (자체 리뷰)
    → `try/catch`로 localStorage/WebAudio 방어, `AudioContext` feature-detect, 가드 `if (!themeBtn)`
12. [x] 520px 반응형
    → `@media (max-width: 520px)`에서 캔버스는 `width:100%` 유지(aspect-ratio), 난이도/CTA 버튼 세로 정렬, HUD 폰트 축소
13. [x] `image-rendering: pixelated`
    → `#gameCanvas { image-rendering: pixelated; }` + `ctx.imageSmoothingEnabled = false`
14. [x] 외부 라이브러리/이미지 없음
    → CDN 없음, `<img>` 없음, 모든 픽셀 아트를 Canvas에 `fillRect`로 그림
15. [x] 기존 4개 탭 동작 변경 없음
    → `index.html` 155~158행 버튼 그대로, `main.js` `initCategoryFilter`에 `if (btn.tagName === 'A') return;`만 추가

## 패턴 준수 확인

- BEM 네이밍: 준수 — `game-stage`, `game-hud__value`, `game-btn--ghost`, `category-nav__btn--link`
- CSS 변수 사용: 준수 — `var(--brand)`, `var(--bg-card)`, `var(--radius)` 전면 사용. 픽셀 색상은 캐릭터 팔레트(SPEC 명시)만 하드코딩.
- CSS 네이티브 중첩: 준수 — 모든 중첩에 `&` 사용
- 반응형 520px: 대응 — 버튼 세로 정렬, 폰트 축소, 캔버스 width 100%
- reduced-motion: 대응 — CSS 미디어쿼리 + JS `reducedMotion` 플래그
- esc()/safeUrl(): 해당 없음 — 외부 데이터 fetch 없음, 모든 URL은 정적
- 가드 클래스: 적용 — `if (!themeBtn)`, `loadBest` `try/catch`
- DOMContentLoaded 등록: N/A (게임은 페이지 내부 IIFE, main.js에는 기존 패턴 유지)
- `-webkit-backdrop-filter`: 함께 작성 — 모든 `backdrop-filter` 옆에 병기
- 파일 간 정합성: 준수 — `.category-nav__btn--link` (css) ↔ `<a class="category-nav__btn category-nav__btn--link">` (html) ↔ `btn.tagName === 'A'` 제외 (js)

## Sprint 범위 준수

- 게임 로직은 `pages/game.html` 내부 `<script>`에 완전 격리 (main.js 무변경)
- 다른 카테고리 탭 동작 변경 없음
- 외부 라이브러리/CDN 추가 없음
- `assets/img/`에 새 이미지 없음
- 새 외부 CSS/JS 파일 없음
- `:root` 변수 추가/변경 없음

## 필수 연동 변경

- `main.js initCategoryFilter` 에 `if (btn.tagName === 'A') return;` 1줄 추가 — SPEC의 "주의사항"에서 명시적으로 요구된 변경. 이 없으면 `<a>` 클릭 시 `btn.dataset.filter=undefined`로 모든 섹션이 숨겨지는 사고 발생.
- `style.css` 에 `.category-nav__btn--link` 블록 추가 — `<a>`가 버튼과 동일한 외관/정렬을 유지하도록 보정 (SPEC 변경 범위 명시).

## 난이도 밸런스 (SPEC 목표: 중=15~25, 상=5~10)

- 하: 속도 180 + 음표 6 + 장애물 0 + TTL 무한 → 쉽게 25+ 도달 가능
- 중: 속도 140 + 음표 4 + TTL 5s + 장애물 2(90px/s) + stun 500ms → 체감 15~25 근접
- 상: 속도 100 + 음표 2 + TTL 2.5s + 장애물 5(150px/s) + stun 800ms + 복잡 맵 → 5~10 구간. 속도차(캐릭터<장애물)로 실질적 난이도 상승.

## 잠재 리스크 / Known Limitations

- WebAudio는 사용자 제스처 이후 작동: 시작 버튼 클릭이 그 제스처이므로 정상 동작.
- 아주 구형 브라우저에서 `aspect-ratio` 미지원 시 캔버스 비율이 무너질 수 있으나, `width`/`height` 속성이 있어 내용은 정상 렌더.
