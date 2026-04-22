# 자체 점검

## SPEC 기능 체크
- [x] 기능 1: 모바일 조이콘/캔버스 축소 노출 버그 수정 — 트리거를 `@media (max-width: 520px) and (orientation: ...)`에서 `body.is-touch.is-landscape` / `body.is-touch.is-portrait` 바디 클래스로 교체. `syncMobileLayoutClasses()` 신규 함수가 `isTouchDevice()` 통과 시 `<body>`에 `is-touch` + `is-portrait`/`is-landscape`를 상호 배타적으로 부착. `matchMedia('(orientation: portrait)')` 구독 + `resize` 폴백 + `addEventListener`/`addListener` 폴백 포함. 이로써 iPhone Pro Max(landscape 932×430) 등 폭 >520px인 폰에서도 조이콘 + 캔버스 dvh 축소가 올바르게 동작.
- [x] 기능 2: 인트로 컷씬 본문 아래 목표 개수 줄 추가 — `pages/game.html`에 `<p class="game-overlay__goal" id="cutsceneGoal" hidden>` 추가, `triggerCutscene()`가 `id === 'intro'`일 때 `목표 ${TARGET_SCORE[state.difficulty]}점 · ${GAME_DURATION}초`를 `textContent`로 주입하고 `hidden = false`. mid1/mid2에서는 `hidden = true`로 복원.
- [x] 기능 3: 상 난이도 인트로 컷씬 문구 분기 — `CUTSCENES.intro`를 `textByDiff: { easy, normal, hard }`로 확장. hard는 "학교에서 나온 깐깐한 이교수가 오늘따라 청진기를 휘두른다. 날아오는 청진기를 피하며 음표를 모으자." `triggerCutscene()` 에서 `cut.textByDiff ? cut.textByDiff[state.difficulty] || cut.textByDiff.easy : cut.text`로 안전 fallback — mid1/mid2(`text` 단일 필드)와 호환.

## 패턴 준수 확인
- BEM 네이밍: 준수 — `.game-overlay__goal`(기존 재사용), `.game-overlay--cutscene .game-overlay__goal`(컷씬 한정), 신규 클래스 없음
- CSS 변수 사용: 준수 — `--text-muted`, `--brand-light` 재사용. 하드코딩 색상 0건
- CSS 네이티브 중첩: 준수 — `body.is-touch.is-landscape { &.game-page { ... } & .game-topbar { ... } }` 및 `.game-overlay--cutscene .game-overlay__goal { & strong { ... } }`
- 반응형 520px: 유지 — 기존 `@media (max-width: 520px)` 블록의 타이포/패딩/오버레이 전용 규칙은 전부 보존. 조이콘/캔버스/회전안내만 바디 클래스로 이관
- reduced-motion: 유지 — 기존 `@media (prefers-reduced-motion: reduce)` 블록 무변경. 신규 애니메이션 추가 없음
- esc()/safeUrl(): 해당 없음 — 컷씬 본문은 정적 상수 `CUTSCENES`에서만 옴. `textContent` 사용으로 XSS 원천 차단. `innerHTML` 0회
- 가드 클래스: 준수 — `syncMobileLayoutClasses()`의 `if (!body) return` / `if (!isTouchDevice()) return`, `triggerCutscene()`의 `goalEl` 존재 검사
- DOMContentLoaded 등록: `game.js`는 IIFE 스코프 최하단 초기화 블록에 `syncMobileLayoutClasses()` 호출 추가(기존 `initOrientationHint()` 바로 위)
- -webkit-backdrop-filter: 신규 `backdrop-filter` 규칙 없음(기존 유지)
- 파일 간 정합성: `#cutsceneGoal`(HTML) ↔ `document.getElementById('cutsceneGoal')`(JS) ↔ `.game-overlay--cutscene .game-overlay__goal`(CSS) 일치. `body.is-touch`/`is-portrait`/`is-landscape` 클래스명 JS↔CSS 일치

## 범위 계약 준수
- SPEC에 명시된 파일(`pages/game.html`, `assets/css/game.css`, `assets/js/game.js`)만 수정. `index.html`/`assets/css/style.css`/`assets/js/main.js` 무변경
- 신규 효과/애니메이션/사운드 추가 없음. mid1/mid2 문구 무변경. 게임 밸런스(TARGET_SCORE/GAME_DURATION/속도) 무변경
- `@media (max-width: 520px)` 블록의 기존 타이포/패딩 규칙은 "조이콘 노출과 무관"하므로 그대로 보존(SPEC "허용"의 정확한 준수)
