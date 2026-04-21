# QA 검수 보고서

## UI 동작 검증 (Playwright)

`npm run ui-check` 실행 결과 (루트 레포 기준, 현재 워크트리 파일 기반 테스트):

| 체크 항목 | 결과 | 비고 |
|---|---|---|
| 테마 토글 | PASS | 다크→라이트→다크 전환 정상 |
| 카테고리 필터 (writing) | PASS | |
| 카테고리 필터 (music) | PASS | |
| 카테고리 필터 (social) | PASS | |
| 카테고리 필터 (all) | PASS | |
| 프로필 모달 | FAIL | **Playwright 환경 한계**: `scrollIntoViewIfNeeded` 이슈(이전 스프린트 동일 증상). 이번 SPEC 범위 외. P2로 분류 |
| 링크카드 href 유효성 | PASS | 2개 링크 모두 유효 |
| 모바일 520px 뷰포트 | PASS | 핵심 요소 3개 모두 visible |
| 콘솔 에러 | PASS | 0건 |

결과: 8/9 통과. 실패 1건은 기존 스프린트부터 존재하는 Playwright 환경 한계로 **이번 변경과 무관**.
스크린샷: `tests/screenshots/`

추가로 SELF_CHECK.md의 Playwright 결과(게임 페이지 전용 테스트)에서:
- iPhone SE(375×667): overlayEnd `scrollHeight === clientHeight === 667`, `overflow-y: hidden`, pageerror 0
- Desktop(1280×800): 2-col grid, listen 버튼 전폭(342px), Tab 첫 포커스 = btnListenTrack
- 실패 상태: listen `display:none`, CTA 3열 복귀

---

## SPEC 기능 검증

### 기능 1: 성공 시 "HG 실습 작곡 노래 듣기" 외부 링크
- [PASS] **노출 조건**: `game.js:921` `const success = score >= target;`, `game.js:938` `else if (success)` 분기 내부 `game.js:947-948`에서만 `is-hidden` 제거 + `game-cta--success` 추가. SPEC 조건 "score >= target" 정확 일치.
- [PASS] **숨김 리셋 3곳**:
  - `endGame()` 초입: `game.js:906-907`
  - `startGame()` 초입: `game.js:872-873`
  - `btnBackToDifficulty` 핸들러: `game.js:775-776`
- [PASS] **DOM 정적 + 토글 방식**: `game.html:114-121` 정적 `<a>` + `is-hidden` 초기 클래스. innerHTML 사용 0건.
- [PASS] **URL 정확 일치**: `game.html:116` `href="https://www.youtube.com/watch?v=_lIkCnyABVA&list=LL&index=27"` — SPEC 스펙 그대로.
- [PASS] **target + rel**: `game.html:117` `target="_blank"`, `game.html:118` `rel="noopener noreferrer"` 동시 설정.
- [PASS] **aria-label**: `game.html:119` `aria-label="HG가 실습때 만든 노래 새 탭에서 듣기"`.
- [PASS] **레이블**: `game.html:120` `🎵 HG가 실습때 만든 노래 듣기`.
- [PASS] **삽입 위치**: CTA 맨 앞 (DOM 순서 Tab 첫 포커스 자동 확보).

### 기능 2: 수간호사 본체 직접 충돌 즉사
- [PASS] **삽입 위치**: `game.js:1388-1416` — `updateNurseChief` 호출(L1342) 직후, F 충돌 루프(L1418~1442) **직전**. SPEC 지시 정확 준수.
- [PASS] **기존 F 충돌 로직 불변**: L1418~1442 블록 변경 없음 — 신규 블록을 앞에 삽입한 패턴.
- [PASS] **가드**: `game.js:1390` `if (state.nurseChief.active)` 조건부 실행.
- [PASS] **히트박스 14×14 중앙 앵커**: `game.js:1392-1394` `CHIEF_HB = 14`, `cx = chief.x - 7`, `cy = chief.y - 7`.
- [PASS] **AABB 겹침 감지**: `game.js:1395-1396` 표준 AABB 4변 비교.
- [PASS] **F 충돌과 동등 후처리**: `hits++`(L1397), `combo=0`(L1398), `updateComboHud(false)`(L1399), `playTone(110,0.25)` + 100ms 후 `playTone(82,0.35)`(L1402-1403), 셰이크/비네트(L1406-1410), `gameoverReason='hit'`(L1412), `endGame()`(L1413), `return`(L1414).
- [PASS] **return 누락 없음**: L1414에 `return` 존재 — 동프레임 F 중복 hit 방지.
- [PASS] **reduced-motion 가드**: `game.js:1406` `!reducedMotion` 조건 — 시각만 생략, 판정은 정상 동작.
- [PASS] **엔딩 제목 정합**: `gameoverReason='hit' && !success` → `game.js:932-936` 분기에서 "수간호사에게 걸렸어요!" 자동 표시.

### 레이아웃 (no-scroll fit)
- [PASS] 데스크톱 `#overlayEnd`: `game.css:560-563` `overflow: hidden`, 2×2 grid(성공) / 3열(실패) 분기.
- [PASS] 모바일 520px `#overlayEnd`: `game.css:883-892` `position: fixed; inset:0; height:100dvh; overflow:hidden`, `game.css:940-948` `.game-cta--success` 2열 + `.game-btn--listen { grid-column: 1/-1 }` 적용.

---

## 검수 결과 요약

| 등급 | 건수 |
|---|---|
| P0 치명 | 0건 |
| P1 중요 | 0건 |
| P2 권장 | 2건 |

---

## P0 — 치명적 이슈
없음.

## P1 — 중요 이슈
없음.

## P2 — 권장 사항

### 1. 성공 시 빈 칸(4번째 셀) — 의도된 디자인이나 미세한 시각 비대칭
- **파일**: `assets/css/game.css:611-618, 940-948`
- **현상**: 2×2 grid 성공 레이아웃에서 마지막 칸(우하)이 비어있는 상태
  ```
  [ 🎵 listen (전폭) ]
  [ 다시 플레이 ] [ 난이도 다시 선택 ]
  [ 홈으로    ] [  (빈 칸)          ]
  ```
- **근거**: SPEC.md L113~118이 이 레이아웃을 **명시적으로 설계**한 것이므로 의도한 동작. 단, 사용자 관점에서 살짝 불균형으로 보일 여지 존재.
- **권장**: 이번 스프린트 범위가 아니므로 수정 불요. 후속 스프린트에서 grid를 `repeat(1,1fr)`로 두고 listen/replay/diff/home을 세로 4스택하는 옵션을 검토할 수 있음.

### 2. 프로필 모달 Playwright 실패 — 본 스프린트와 무관
- **파일**: `assets/js/main.js` (루트 인덱스 관련)
- **현상**: `npm run ui-check`에서 프로필 모달 테스트 1건 FAIL (3000ms timeout).
- **근거**: 이전 스프린트(`06c75a1 버그수정`, `949eb71 모바일 깨짐 해결`)부터 지속된 동일 증상. `position: fixed` 내 버튼 + `scrollIntoViewIfNeeded` 상호작용 이슈로 파악되며, 실제 UI 상 클릭 가능한 위치에 있음. SPEC 지시에 따라 **환경 한계**로 분류.
- **권장**: 별도 스프린트에서 Playwright 테스트 코드의 `scrollIntoViewIfNeeded` 제거 또는 `force: true` 클릭으로 회피.

---

## 통과 항목

### 보안
- [PASS] 외부 데이터 innerHTML 주입 없음 (URL 정적 HTML 기록).
- [PASS] eval/document.write 미사용.
- [PASS] 인라인 이벤트 핸들러 미사용.
- [PASS] `target="_blank"` + `rel="noopener noreferrer"` 조합 완비.

### CSS 패턴
- [PASS] 네이티브 중첩 `&` 사용: `&--listen`, `&.is-hidden`, `&.game-cta--success`, `&.game-cta--success .game-btn--listen` 모두 `&` 문법.
- [PASS] SCSS 문법 혼입 없음 (`@mixin`, `@include`, `@extend`, `$변수` 0건).
- [PASS] 하드코딩 색상 0건 (신규 `.game-btn--listen` 규칙은 `--brand-20/35/60/14`, `--brand-light`, `--brand`만 사용).
- [PASS] `!important` 미사용 (기존 reduced-motion 예외 제외).
- [PASS] BEM 네이밍: `.game-btn--listen`, `.game-cta--success`, `.is-hidden` 상태 클래스 준수.
- [PASS] `-webkit-backdrop-filter` 짝 유지 (기존 규칙 그대로).

### JS 패턴
- [PASS] 가드 클래스: `if (btnListenTrack)`, `if (endCta)`, `if (state.nurseChief.active)` 모두 early guard 적용.
- [PASS] `console.error` 미사용.
- [PASS] 섹션 구분선/JSDoc 주석 유지.
- [PASS] DOM 참조 `const` 변수화: `btnListenTrack`, `endCta` (L662-663).
- [PASS] 시각 변경은 CSS 클래스로 처리 (`classList.add/remove` 활용, `element.style` 직접 조작 없음).
- [PASS] 코드 배치 순서 유지 — 기존 IIFE 내부 상수/함수/DOM/init 순서 불변.

### HTML 구조
- [PASS] `target="_blank"` 존재 시 `rel="noopener noreferrer"` 동반.
- [PASS] `aria-label` 명시.
- [PASS] JS `getElementById('btnListenTrack')` ↔ HTML `id="btnListenTrack"` 정합.
- [PASS] 인라인 스타일 추가 없음.

### 반응형 & 접근성
- [PASS] `@media (max-width: 520px)` 스코프에 `.game-cta--success` 규칙 동일 적용 (`game.css:940-948`).
- [PASS] `prefers-reduced-motion` — 기존 전역 규칙이 `canvas-wrap.is-shake/is-gameover`를 비활성화 → 수간호사 충돌도 동일 클래스이므로 자동 상속. `!reducedMotion` 가드로 시각 효과만 생략(판정은 동작).
- [PASS] 키보드 접근: listen 버튼은 `<a>` 요소로 Tab 순환 내 첫 번째 포커스 위치.

### 파일 간 정합성
- [PASS] HTML `.game-btn--listen` ↔ CSS `.game-btn { &--listen }` 정합.
- [PASS] JS 토글 클래스 `game-cta--success` ↔ CSS `#overlayEnd .game-overlay__panel--end .game-cta { &.game-cta--success }` 정합.
- [PASS] JS 토글 클래스 `is-hidden` ↔ CSS `.game-btn { &.is-hidden { display:none } }` 정합.
- [PASS] 미사용 CSS/JS 식별자 없음.

### Sprint 범위 준수 (SPEC 계약)
- [PASS] **허용 범위 내 변경만 수행**: CTA 레이아웃 재조정(4버튼), endGame success 분기 재활용, 수간호사-플레이어 AABB 충돌 분기 추가.
- [PASS] **금지 변경 없음**: 난이도/사운드/파티클/수간호사 스프라이트/F 투척 로직/점수·시간 상수/새 best 키 **전혀 건드리지 않음**.
- [PASS] **기존 F 충돌 블록 변경 금지** 준수 — L1418~1442는 이전과 동일, 신규 블록은 앞에 삽입.

---

## 채점

SPEC 변경 유형이 **기능(로직 동작 변경 2건 + 조건부 UI 추가)**이므로 `기능 변경 평가 기준` 적용.

**항목별 점수**:
- **패턴 일관성: 9/10** → BEM/CSS변수/네이티브중첩/가드/`element.style` 회피 모두 준수. 신규 코드의 섹션 구분·JSDoc 주석 수준 높음. P2 수준의 "사소한 빈 셀" 1건만 있어 -1.
- **보안 & 접근성: 10/10** → innerHTML 사용 0, 정적 URL, `rel="noopener noreferrer"` + `aria-label` + reduced-motion 가드 완비. 감점 요소 없음.
- **반응형 & UI 품질: 9/10** → 520px 전용 `.game-cta--success` 규칙 별도 제공, no-scroll fit 유지 확인. 성공 레이아웃에 빈 셀 한 칸 남는 미세 비대칭으로 -1.
- **기능 완성도: 10/10** → SPEC 수용 기준 체크리스트 전 항목 PASS. 수간호사 충돌 블록이 F 앞 + return 완비 + 가드 완비. URL·target·rel·aria 전부 정확.

**가중 점수**:
- 패턴 9 × 0.40 = 3.60
- 보안접근성 10 × 0.25 = 2.50
- 반응형UI 9 × 0.20 = 1.80
- 기능 10 × 0.15 = 1.50
- **합계 = 9.4 / 10.0**

(자체 엄격 검토: "8.0 이상이면 관대한 것 아닌가?"를 재점검했으나, P0/P1 이슈 0건 + SPEC 체크리스트 전 항목 PASS + 기존 로직 불변 + 보안 완벽이라 9.4가 정당함을 재확인.)

---

## 최종 판정: **합격**

- 가중 점수 9.4 → 7.0 이상 합격 기준 충족
- P0 0건, P1 0건 → 점수 하락 트리거 없음
- SPEC 수용 기준 체크리스트 전 항목 PASS
- SPEC "주의사항" 6개(기존 F 충돌 불변, return 필수, URL 정적, 리셋 3곳, 히트박스 과조정 금지, overflow:hidden 유지) 전원 준수

**구체적 개선 지시**: 없음. 현재 상태로 배포 가능.

(선택적 후속 개선 아이디어 — 이번 스프린트 범위 외):
1. 성공 2×2 grid 4번째 셀 비대칭이 거슬린다면, 후속 스프린트에서 1열 4스택 옵션을 검토.
2. 프로필 모달 Playwright 테스트의 `scrollIntoViewIfNeeded` 회피 처리를 별도 스프린트에서.
