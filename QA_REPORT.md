# QA 검수 보고서

## UI 동작 검증 (Playwright)

루트 포트폴리오(npm run ui-check) 기준:

| 체크 항목 | 결과 | 비고 |
|---|---|---|
| 테마 토글 | PASS | 다크-라이트-다크 전환 정상 |
| 카테고리 필터 (4종) | PASS | writing/music/social/all 모두 정상 |
| 프로필 모달 | FAIL | locator.waitFor 3s 타임아웃 — 이번 SPEC 범위 외(루트 기능). Generator 수정사항(pages/game.*, game.js)과 무관한 기존 이슈 |
| 링크카드 href | PASS | 2개 링크 유효 |
| 모바일 520px | PASS | 핵심 3요소 visible |
| 콘솔 에러 | PASS | 0건 |

- 결과: 8/9 통과. 실패 1건은 루트 index.html 프로필 모달로, 이번 Sprint에서 수정하지 않은 영역. 루트 index.html / style.css / main.js는 변경되지 않았음(git diff --stat 확인).
- 게임 페이지(pages/game.html) 전용 Playwright 시나리오는 존재하지 않아 수동 정적 검증으로 보완.

## Sprint 범위 계약 검증

git diff --stat HEAD 결과:
- assets/css/game.css | 186 +/-
- assets/js/game.js   | 230 +/-
- pages/game.html     |  21 +
- 루트 index.html, assets/css/style.css, assets/js/main.js 변경 0건

→ SPEC "금지: 루트 본체 수정" 준수.
→ SPEC 외 변경으로 식별된 두 건(#overlayEnd .game-overlay__panel--end overflow-y: auto 추가 / openCharacterOverlay에서 initCharacterGrid 재호출)은 SPEC 허용 판단 기준("이 변경 없으면 SPEC 기능이 동작 안 하거나 기존 기능이 깨지는가 → YES") 충족. 범위 위반 아님.

## SPEC 기능 검증

1. [PASS] 모바일 버튼 확대 실제 수치
   - .game-keypad__btn width/height: 96px (game.css L975-976), font-size 28px
   - .game-keypad__dpad gap: 14px (L963), max-width: min(100%, 340px); margin: 0 auto 추가
   - .game-keypad__skill 96x96px, font-size 18px (L1228-1236)
   - @media (hover: none) and (pointer: coarse) padding: 14px 6px 6px
   - @media (max-width: 380px): btn/skill 80x80px, font 22px/16px
   - @media (max-width: 520px) .game-canvas-wrap max-height: calc(100dvh - 400px); min-height: 240px
   - 모두 SPEC 수치와 1:1 일치.

2. [PASS] SKILLS.im.durationMs === 2500
   - game.js L166에 durationMs: 2500 확인. cooldownMs: 25000은 그대로(SPEC 범위 외).

3. [PASS] 청진기 충돌 직렬화 + drawStethoToast + endGame 리셋
   - 충돌 처리(L3444-3454): stethoToastUntil = now + STETHO_TOAST.duration 세팅, frozenUntil = now + STETHO_TOAST.duration + PROFESSOR.freezeDuration로 토스트 이후 전체 freezeDuration이 체감되도록 직렬화.
   - drawStethoToast 인라인 블록(L3743-3780): AIRFORCE 토스트 직후에 if (now < state.player.stethoToastUntil) 가드로 동일 박스 스타일(쉐도우/네이비/코럴 엣지/제목/부제) 재사용. reduced-motion 시 alpha=1 고정, 마지막 200ms 페이드아웃.
   - 리셋 3곳: startGame L1711, btnBackToDifficulty L1334, endGame L1804 모두에 stethoToastUntil = 0 포함.

4. [PASS] CUTSCENES.introProfessor + resumeFromCutscene hard 체이닝
   - CUTSCENES.introProfessor 상수(L209-212): 제목 "경고 · 이교수 출현", 본문 "학교에서 나온 깐깐한 이교수가 청진기를 들고 순찰을 돕니다! 맞으면 잠시 움직일 수 없게 됩니다. 피하세요."
   - triggerCutscene JSDoc에 'introProfessor' 타입 추가 (L1911).
   - chainProfessor 분기(L1979-1986): state.difficulty === 'hard' AND cutscenesShown.has('intro') AND !cutscenesShown.has('introProfessor') 조건 150ms setTimeout. chainStoneGuard와 난이도 기반 상호 배타.

5. [PASS] state.best 스키마 5x3 + 모든 참조 교체
   - state.best 리터럴(L987-993): kim/jung/geon/im/lee 각 {easy:0, normal:0, hard:0}.
   - grep "state\.best" 결과 총 11건. 모두 state.best[id] 형태. 구 스키마 state.best.easy/normal/hard 직접 접근 0건.

6. [PASS] BEST_BY_CHAR_KEY 마이그레이션
   - 상수(L60) BEST_BY_CHAR_KEY = 'pixelNurseBestByChar'. 구 STORAGE_KEY = 'pixelNurseBest'는 주석에 "롤백 여지" 명시 유지.
   - loadBest(L1058-1088): 신 키 우선 + CHARACTER_IDS 화이트리스트 + normalizeBestScore [0, 9999] clamp. 신 키 없으면 구 키를 state.best.kim 하위로 이관 후 즉시 saveBest(). try/catch로 저장소 접근 실패 방어.
   - saveBest(L1090-1095): { version: 2, records: state.best } payload로 신 키만 저장. 구 키는 건드리지 않음.

7. [PASS] 엔딩 오버레이 #endRecords + renderEndRecords + textContent 안전 주입
   - HTML(game.html L151-171): section#endRecords, ul#endRecordsMine, button#btnToggleAllRecords (aria-expanded, aria-controls 바인딩), div#endRecordsAll[hidden], tbody#endRecordsTbody.
   - renderEndRecords(L1186-1213): recMine*에 String(...) textContent 주입. endRecordsTbody 자식 전체 제거 후 createElement('tr')/createElement('td')로 재구성. 현재 캐릭터 행 tr.className = 'is-current'. innerHTML 미사용.
   - 토글 핸들러(L1215-1223): is-hidden 클래스 + hidden 속성 + aria-expanded + 버튼 라벨(v/^) 동기화.
   - endGame 호출(L1890): endScore.textContent 주입 직전 renderEndRecords() + "다른 실습생" 섹션 기본 닫힘 리셋.

8. [PASS] .game-character-card__best 추가 + XSS 안전
   - initCharacterGrid(L1425-1434): createElement('span') + textContent. 입력은 Math.max(rec.easy, rec.normal, rec.hard) 숫자이므로 XSS 표면 없음.
   - CSS(L681-687): color: var(--brand-light), font-size: 10px, tabular-nums. 하드코딩 색상 없음.
   - 520px 블록(L1414-1416): font-size: 9px 모바일 대응.

---

## 검수 결과 요약

| 등급 | 건수 |
|---|---|
| P0 치명 | 0 |
| P1 중요 | 0 |
| P2 권장 | 2 |

## P0 — 치명적 이슈

없음.

## P1 — 중요 이슈

없음.

## P2 — 권장 사항

### 1. drawStethoToast 박스 높이 상수 불일치
- 파일: assets/js/game.js:134 vs SPEC 3-1
- 내용: SPEC 예시값 boxH: 54. 실제 구현 boxH: 62 (AIRFORCE toastBoxH와 동일).
- 평가: SPEC 3-4 "같은 박스 스타일 재사용" 요구에 맞춘 합리적 조정. SELF_CHECK.md에 명시. 감점 없음.

### 2. drawStethoToast 박스 색상 하드코딩
- 파일: assets/js/game.js:3762, 3766, 3770, 3775
- 내용: 본체 배경 (#1a2238/#e8edf5), 코럴 엣지 (#ff7b7b/#e85a6a), 제목 (#ffd0d4/#8a1a2a), 부제 (#e8eaf2/#2a2432) 하드코딩.
- 근거: 기존 AIRFORCE 토스트 블록(L3716~3729)도 동일 팔레트를 하드코딩. SPEC 3-4 "같은 박스 스타일"을 문자 그대로 이행. 기존 패턴 일관성 측면에서는 오히려 정합.
- 조치: 향후 별도 리팩토링 Sprint에서 공용 토스트 팔레트를 :root CSS 변수로 추출하는 방안 고려. 이번 Sprint 감점 없음.

## 통과 항목

- 보안: innerHTML 0건, eval/document.write 0건, 인라인 이벤트 핸들러 0건. 모든 동적 주입은 textContent/createElement.
- CSS 패턴: SCSS 문법($, @mixin 등) 0건. !important는 prefers-reduced-motion 전역 블록(L1694-1696)에서만 사용(표준 예외). 신규 클래스 모두 BEM + 네이티브 & 중첩 준수. 모든 색/보더는 var(--brand-*), var(--bg-card), var(--border), var(--text-*) 재사용.
- JS 패턴: 섹션 구분선 일관. 가드 클래스 준수. console.error/console.warn 0건. try/catch가 localStorage 전반에 적용.
- HTML 구조: aria-expanded + aria-controls="endRecordsAll", section aria-label="최고 기록" 랜드마크, js-nurse-name 후크. 새 id 8개 전부 JS getElementById와 1:1 매칭.
- 반응형 & 접근성: 520px 블록에 records-title/list/table/character-card__best 모두 폰트·패딩 축소. prefers-reduced-motion 커버.
- 파일 간 정합성: 새 id 8개 + 새 클래스 7개 모두 HTML/CSS/JS에 일관.
- XSS: 캐릭터 이름은 CHARACTERS 정적 배열, 점수는 Number 캐스팅값. 테이블은 createElement + textContent.
- AI 슬롭 패턴: 보라-청록 그라디언트/과대 box-shadow/임의 border-radius/독립 기능 무단 추가 모두 없음. setTimeout 사용은 기존 패턴 모방(chainStoneGuard 체이닝/효과음 2연타)으로 허용.

---

## 채점

SPEC 변경 유형: 혼합. 기능 평가 기준 적용.

**항목별 점수**:
- 패턴 일관성: 9/10 — BEM·CSS변수·네이티브 중첩·textContent·가드클래스 전부 준수. drawStethoToast의 하드코딩은 기존 AIRFORCE 토스트 패턴 모방이라 오히려 +.
- 보안 & 접근성: 9/10 — XSS 없음. localStorage try/catch. aria-expanded/aria-controls/aria-label/role 전부 제공. reduced-motion 커버.
- 반응형 & UI 품질: 9/10 — 96px/14px/400px SPEC 수치 정확. 320px에서 max-width: min(100%, 340px) + min-height: 240px 안전망. 520px 기록 테이블/카드 최고기록 폰트 축소.
- 기능 완성도: 10/10 — SPEC 5개 변경 전부 정확 구현. 엣지 케이스(두 번째 명중 덮어쓰기 / endGame 리셋 / 캐릭터 변경 시 HUD 재계산)까지 커버.

**가중 점수**: (9 * 0.4) + (9 * 0.25) + (9 * 0.2) + (10 * 0.15) = 3.6 + 2.25 + 1.8 + 1.5 = **9.15 / 10**

## 최종 판정: 합격

**구체적 개선 지시** (향후 Sprint 후보, 이번 라운드 수정 불요):
1. drawStethoToast/drawAirforceToast의 하드코딩 팔레트를 :root { --toast-bg-navy, --toast-accent-coral, --toast-title } 같은 공용 변수로 추출, canvas에서 getComputedStyle로 읽도록 리팩토링.
2. 엔딩 오버레이 "다른 실습생 기록" 테이블은 5행x4열 고정. 향후 캐릭터 이름이 더 긴 캐릭터 추가 시 520px 블록의 padding 재조정 필요(이번 Sprint 범위 밖).

재검수 불요 — Generator R1 통과.
