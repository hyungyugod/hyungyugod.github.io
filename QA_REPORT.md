# QA 검수 보고서 — Pixel Nurse Note-Catcher 게임 페이지

## UI 동작 검증 (Playwright)

| 체크 항목 | 결과 | 비고 |
|---|---|---|
| 테마 토글 | PASS | 다크↔라이트 전환 정상 |
| 카테고리 필터 (writing) | PASS | 2개 섹션 숨김 |
| 카테고리 필터 (music) | PASS | 2개 섹션 숨김 |
| 카테고리 필터 (social) | PASS | 2개 섹션 숨김 |
| 카테고리 필터 (all) | PASS | 0개 섹션 숨김 — <a> Game 버튼이 필터 루프에서 제외됨을 간접 확인 |
| 프로필 모달 | FAIL | locator.click 타임아웃 — **Playwright 환경 한계** (scrollIntoView 시 page-wrapper가 fixed hero를 덮는 기존 이슈). 이번 SPEC 범위 바깥. P2로 기록. |
| 링크카드 href 유효성 | PASS | 2개 링크 유효 |
| 모바일 520px 뷰포트 | PASS | 핵심 요소 3개 visible |
| 콘솔 에러 | PASS | 0건 |

결과: 8/9 통과. 실패 1건은 기존에도 재현되던 Playwright 환경 한계(P2).

게임 페이지(pages/game.html)는 tests/ui-check.js 시나리오 바깥이므로 정적 분석으로 검증함.

---

## SPEC Acceptance Criteria 검증 (15개)

| # | 항목 | 결과 | 근거 |
|---|---|---|---|
| 1 | Game 버튼 → /pages/game.html 이동 | PASS | index.html:159 <a href="/pages/game.html"> |
| 2 | 난이도 오버레이 + "하" 기본 | PASS | overlayStart 기본 표시, data-diff="easy" 버튼 aria-checked="true" (game.html:500), state.difficulty=easy (game.html:837) |
| 3 | 화살표/WASD + 벽 충돌 | PASS | KEY_MAP 8키 (game.html:903), isWallAt AABB + 축별 분리 이동 (game.html:1026-1033) |
| 4 | 음표 +1 & 즉시 재스폰 | PASS | game.html:1077-1081 splice → score++ → spawnNote() |
| 5 | 30초 카운트다운 | PASS | timeLeft -= dt → <=0에서 endGame() (game.html:1103-1107) |
| 6 | 상 난이도: 속도 100 / 장애물 5 / TTL 2500 | PASS | game.html:569 hard: { speed:100, obstacles:5, noteTtl:2500, obsSpeed:150, stun:800 } — SPEC 표와 **완전 일치** |
| 7 | pixelNurseBest 저장/복원 | PASS | loadBest()/saveBest() try/catch + 난이도별 객체 (game.html:850-867) |
| 8 | 테마 토글 + 캔버스/HUD 색상 동기화 | PASS | .js-theme-toggle 바인딩 (game.html:545-553), themeColors() 매 프레임 isLightTheme() 조회 (game.html:697-707) |
| 9 | "홈으로" / 복귀 | PASS | game.html:521 <a href="/"> |
| 10 | reduced-motion 대응 | PASS | JS reducedMotion 플래그 (game.html:572, 1036, 1122) + CSS @media (prefers-reduced-motion: reduce) (game.html:449-457) |
| 11 | 콘솔 에러 없음 | PASS | 정적 분석: try/catch로 localStorage/WebAudio 방어, feature-detect, Playwright 메인 페이지 0건 |
| 12 | 520px 반응형 | PASS | game.html:396-446 버튼 세로 정렬, HUD 폰트 축소 |
| 13 | image-rendering: pixelated | PASS | game.html:198 + ctx.imageSmoothingEnabled = false (game.html:691) |
| 14 | 외부 라이브러리/이미지 없음 | PASS | CDN/<img> 없음, 픽셀 아트는 fillRect로 드로잉 |
| 15 | 기존 4개 탭 동작 동일 | PASS | main.js:449 if (btn.tagName === A) return; 1줄 추가 — 기존 <button>들 영향 없음 (Playwright 필터 테스트 4종 모두 PASS) |

**15/15 PASS**

---

## 난이도 밸런스 대조 검증

SPEC의 체감 난이도(중=15~25개, 상=5~10개) 관점으로 수치 대조:

| 파라미터 | 하 | 중 | 상 | SPEC 일치 |
|---|---|---|---|---|
| 플레이어 속도 (px/s) | 180 | 140 | 100 | ✓ |
| 장애물 속도 (px/s) | 0 | 90 | 150 | ✓ |
| **속도차(장애물−플레이어)** | — | **−50 (안전)** | **+50 (위협)** | — |
| 동시 음표 | 6 | 4 | 2 | ✓ |
| 음표 TTL (ms) | ∞ | 5000 | 2500 | ✓ |
| 장애물 수 | 0 | 2 | 5 | ✓ |
| 스턴 (ms) | — | 500 | 800 | ✓ |
| 맵 | 기둥 1 | 방 2 + 기둥 | 방 4 + 기둥 다수 | ✓ |

**난이도 상의 실질적 어려움이 구조적으로 보장된다**:
1. 장애물 속도(150) > 플레이어 속도(100) — 회피가 본질적으로 어려움
2. 음표 수명 2.5초 + 동시 2개 — 순간 이동 시간 부족
3. 모서리 방 4개 + 기둥 다수로 경로 단절 빈번
4. 스턴 800ms 동안 점수 감점과 이동 불가 동시 발생

→ "상"이 체감상 명백하게 어려움. 난이도 분리 설계 합격.

---

## 집중 검증 — localStorage / FOUC / 접근성 / 보안

### localStorage 파싱 방어 (game.html:850-867)
- try/catch로 JSON.parse 예외 차단 ✓
- null/undefined 가드 (if (!raw) return) ✓
- 타입 체크 (typeof parsed === object) ✓
- 숫자 변환 + NaN 폴백 (Number(...) || 0) ✓
- **합격**. 오염된 JSON/배열/문자열이 들어와도 안전.

### 테마 FOUC 방지 (game.html:11-19)
- <head> 최상단, <link rel="stylesheet"> 이전에 실행 ✓
- try/catch로 저장소 접근 불가 환경(Safari Private 등) 방어 ✓
- localStorage.getItem(theme) === light일 때만 html.light 추가 — 메인 사이트와 동일 키/로직 ✓
- **합격**.

### 접근성 (role / aria)
- role=radiogroup + aria-label=난이도 (game.html:499) ✓
- 난이도 버튼 3개 모두 role=radio + aria-checked (game.html:500-502) ✓
- aria-checked 동적 업데이트 (game.html:889-890) ✓
- 시작/종료 오버레이 role=dialog + aria-labelledby (game.html:496, 512) ✓
- 종료 점수 aria-live=polite (game.html:514) ✓
- 캔버스 aria-label="Pixel Nurse 게임 캔버스" ✓
- 테마 토글 aria-label="테마 전환" ✓
- 장식 아이콘 aria-hidden=true ✓
- **합격**.

### 보안
- 외부 fetch 없음, 모든 URL 정적 → esc()/safeUrl() 불필요 ✓
- 인라인 이벤트 핸들러 없음 ✓
- eval / document.write 없음 ✓
- target=_blank 미사용 (내부 링크만) → rel=noopener 불필요 ✓

---

## 검수 결과 요약

| 등급 | 건수 |
|---|---|
| P0 치명 | 0 |
| P1 중요 | 0 |
| P2 권장 | 3 |

## P0 — 치명적 이슈
없음.

## P1 — 중요 이슈
없음.

## P2 — 권장 사항

### 1. 불필요한 .replace(/e/g, E) 호출
- **파일**: pages/game.html:742
- **현재 코드**: "....SEESEEeS....".replace(/e/g,"E")
- **이유**: 소문자 e를 쓰고 즉시 대문자 E로 치환 — 의도 불명, 매 nurseSprite() 호출마다 불필요한 정규식 실행.
- **수정 제안**: 원본 문자열에 대문자 E를 직접 기입 → "....SEESEEES...."

### 2. nurseSprite()를 매 프레임 호출 (문자열 배열 재생성)
- **파일**: pages/game.html:774-794
- **이유**: drawNurse()가 매 프레임 nurseSprite()를 호출해 16개 문자열 배열을 새로 만든다. GC 부하는 미미하지만 dir/frame 조합(4×3=12)이 유한하므로 pre-compute 가능.
- **수정 제안**: 모듈 로드 시 const SPRITES = { down_0: [...], ... } 테이블 구축, 또는 팔레트 인덱스를 담은 Uint8Array로 변환.

### 3. Playwright 프로필 모달 테스트 실패 (기존 이슈, 범위 바깥)
- **파일**: tests/ui-check.js (SPEC 변경 대상 아님)
- **이유**: scrollIntoViewIfNeeded()가 fixed hero 내부 버튼에서 page-wrapper 겹침을 유발하는 Playwright 환경 한계.
- **수정 제안**: 후속 스프린트에서 force click 또는 scrollY=0 상태 직접 클릭으로 회피.

---

## 통과 항목 (전 영역)

- **보안**: 외부 데이터 없음, 인라인 핸들러 없음, eval/document.write 없음, localStorage 파싱 방어
- **CSS 패턴**: BEM (game-stage, game-hud__value, game-btn--ghost, category-nav__btn--link), 네이티브 중첩 & 전면 사용, SCSS 문법 혼입 없음, --brand/--bg-card/--radius/--spring-bounce 변수 전면 사용, 캐릭터 팔레트만 SPEC 명시대로 하드코딩, -webkit-backdrop-filter 병기, !important는 prefers-reduced-motion 예외에만
- **JS 패턴**: IIFE로 게임 로직 격리(main.js 무오염), 가드(if !themeBtn), try/catch, feature-detect(window.AudioContext || window.webkitAudioContext), console.error 미사용, 섹션 구분선 주석
- **HTML 구조**: lang=ko, role/aria-* 적절, 모든 JS ID(#gameCanvas, #hudTime, #btnStart 등) HTML에 존재
- **반응형**: 520px 브레이크포인트 — 버튼 세로 정렬/폰트 축소/캔버스 width 100%
- **접근성**: prefers-reduced-motion JS+CSS 이중 대응, :focus-visible 명시, role=radiogroup/role=dialog/aria-live 구현
- **파일 간 정합성**: .category-nav__btn--link (CSS) ↔ <a class=category-nav__btn category-nav__btn--link> (HTML) ↔ btn.tagName === A 제외 (JS) 완벽 정렬
- **Sprint 범위**: SPEC 외 변경 0건. main.js 1줄 추가는 SPEC 주의사항에서 명시 요구. 독립 기능 무단 추가 없음.

---

## 채점

**기준 적용**: SPEC 변경 유형 "혼합" → **기능 변경 평가 기준** 적용.

**항목별 점수**:
- **패턴 일관성**: **9/10** → BEM/네이티브중첩/CSS변수 모범적. 사소한 P2(replace/e/g 리팩터) 1건.
- **보안 & 접근성**: **10/10** → 외부 데이터 없음 + localStorage try/catch + FOUC 방지 스크립트 + role/aria/aria-live 완비 + reduced-motion 이중 대응.
- **반응형 & UI 품질**: **9/10** → 520px 세로 정렬 + aspect-ratio + pixelated 렌더. 글래스모피즘(backdrop-filter + bg-card) 일관. 큰 그림자 0.4 한 곳 있으나 오버레이 패널 한정이라 허용.
- **기능 완성도**: **10/10** → Acceptance 15개 전부 구현, 난이도 상의 실질적 어려움까지 속도차로 설계. main.js 연동 1줄로 기존 4개 탭 동작 보전.

**가중 점수**: (9 × 0.40) + (10 × 0.25) + (9 × 0.20) + (10 × 0.15) = 3.6 + 2.5 + 1.8 + 1.5 = **9.4 / 10.0**

## 최종 판정: **합격**

**자기 점검 — 관대해지지 않았는가?**
- P0/P1 0건은 드문 결과. 그러나:
  - SPEC 수치와 코드 1:1 대조 (난이도 상 5개 파라미터 모두 일치)
  - localStorage 파싱 4단 방어 (try + !raw + typeof object + Number||0)
  - role/aria 8개 속성 모두 실존
  - 속도차(장애물 150 > 플레이어 100) 라는 **구조적 난이도 설계** 확인
  - CSS 하드코딩(팔레트 제외)/!important 오남용/SCSS 문법 혼입 없음
- 의심 품목 재점검:
  - "스프라이트 문자열 매 프레임 생성"은 측정 전 감점하기 곤란 → P2 권장에 그침
  - 큰 그림자(0.4) 1건 — 오버레이 패널 한정이고 모달과 톤 맞는 범위 → -1점 보류
- 점수가 높은 이유가 명확하고 숨은 결함 증거가 없음. 판정 유지.

**추가 개선 권장 (합격 후 선택)**:
1. game.html:742 — .replace(/e/g,E) 제거하고 원본 문자열에 대문자 E 직접 기입.
2. nurseSprite() 결과를 모듈 로드 시 pre-compute해 매 프레임 GC 부하 감소.
3. 후속 스프린트에서 tests/ui-check.js에 게임 페이지 smoke 테스트 추가 (진입 → 난이도 선택 → 30초 경과 → 종료 오버레이 확인).
