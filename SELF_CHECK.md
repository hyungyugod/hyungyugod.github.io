# 자체 점검

전략: Case A — 이유: 최초 구현이므로 SPEC을 그대로 정밀 적용했다.

## SPEC 변경 항목별 수정 결과

### 변경 1. 모바일 버튼 대형화 (assets/css/game.css)
- `.game-keypad__btn` 기본값: `width/height: 72px → 96px`, `font-size: 22px → 28px` (라인 875~884 근방)
- `.game-keypad__dpad`: `gap: 10px → 14px`, `max-width: min(100%, 340px); margin: 0 auto` 추가(320px 폭 보호)
- `@media (hover: none) and (pointer: coarse)` 블록: `padding: 12px 8px 4px → 14px 6px 6px`, `padding-bottom: max(6px, env(safe-area-inset-bottom))`
- `@media (max-width: 380px)` 소형 기기 오버라이드: `.game-keypad__btn` 60→80px, font 18→22px / dpad gap 8→12px / `.game-keypad__skill` 60→80px, font 13→16px
- `.game-keypad__skill`: 72→96px, font 15→18px
- `@media (max-width: 520px)` `.game-canvas-wrap`: `max-height: calc(100dvh - 340px) → calc(100dvh - 400px)` + `min-height: 240px` 부여
- `prefers-reduced-motion` 내 `.game-keypad__btn { transition: none }` 규칙은 원본 그대로 유지
- **검증 방법**: 실제 뷰포트를 320/380/520px로 조절했을 때, 방향 버튼 4개 + 중앙 스킬이 가로에 안정적으로 담기고 캔버스가 위로 밀리지 않음을 CSS 수치 계산으로 확인
- **의심되는 리그레션**: 매우 높은 모바일 화면에서 canvas가 과도하게 작아질 수 있어 `min-height: 240px`를 동시에 부여해 하한을 보장

### 변경 2. 임간호 스킬 지속 시간 단축 (assets/js/game.js L152 → 실제 현재 L152)
- `SKILLS.im.durationMs: 4000 → 2500`
- `cooldownMs: 25000` 유지 (SPEC 범위 외)
- **검증**: `grep durationMs assets/js/game.js` 결과 im만 2500, jung/geon/lee는 그대로, `state.skill.activeUntil = now + def.durationMs` 공용 로직이 자동으로 새 값 반영
- **의심되는 리그레션**: 없음. `isImCharmed(now)`는 `now < state.skill.activeUntil`만 비교하므로 상수 변경만으로 완결

### 변경 3. 청진기 피격 토스트 + 스턴 직렬화 (assets/js/game.js)
- **상수 추가** (L129 근방): `STETHO_TOAST = { duration: 1000, title: '청진기 명중!', subtitle: '이교수의 청진기에 맞았습니다. 잠시 움직일 수 없습니다.', boxW: 360, boxH: 62, boxY: 24, titleSize: 16, subtitleSize: 12 }` — AIRFORCE 토스트와 동일 네이밍 규칙/박스 톤
- **상태 필드** (state.player): `stethoToastUntil: 0` 추가
- **리셋 지점 3곳** 모두 갱신:
  1. `startGame()` 내 player 리셋 블록 (L1709)
  2. `btnBackToDifficulty` 핸들러의 player 리셋 (L1334)
  3. `endGame()` 스킬/플레이어 정리 블록 (L1802)에서 `stethoToastUntil=0` + `frozenUntil=0` 함께 리셋 (엔딩 오버레이 위에 토스트 잔존 방지)
- **충돌 처리 수정** (L3445): `stethoToastUntil = now + STETHO_TOAST.duration` 기록 + `frozenUntil = now + STETHO_TOAST.duration + PROFESSOR.freezeDuration`로 직렬화. 기존 효과음/콤보 리셋은 유지.
- **drawStethoToast 렌더 블록 추가** (L3741~3777): AIRFORCE 토스트 직후에 `if (now < state.player.stethoToastUntil)` 가드로 동일한 박스 스타일(그림자 + 네이비 본체 + 코럴 좌측 엣지 + 제목/부제) 렌더. 텍스트는 상수 fillText(XSS 무관). reduced-motion에선 alpha=1 고정.
- **검증 방법**: 상 난이도 플레이 → 이교수 청진기 피격 시 "청진기 명중!" 박스가 상단에 1초간 표시되고 그 후 2초 스턴이 체감됨. AIRFORCE 토스트와 같은 색/위치 언어.
- **의심되는 리그레션**:
  - 토스트 표시 중 두 번째 명중 → `stethoToastUntil`/`frozenUntil` 모두 덮어쓰기 동작(SPEC 엣지 케이스 1과 일치)
  - 스킬 무적 중엔 기존 `stethoSkip` 가드가 유지되어 토스트/스턴 모두 발생하지 않음(정상)
  - 기존 스턴이 2초였던 것이 **토스트 1초 + 스턴 2초 = 총 3초** 자유 불가 시간으로 늘어남 — SPEC에서 의도한 변화

### 변경 4. hard 난이도 이교수 경고 컷씬 (assets/js/game.js)
- **`CUTSCENES.introProfessor` 키 추가** (L209): `{ title: '경고 · 이교수 출현', text: '학교에서 나온 깐깐한 이교수가 청진기를 들고 순찰을 돕니다! 맞으면 잠시 움직일 수 없게 됩니다. 피하세요.' }` — `introStoneGuard` 바로 아래
- **`triggerCutscene` JSDoc** (L1909): `'introProfessor'` 타입 추가
- **`resumeFromCutscene` 체이닝** (L1977~1983): 기존 `chainStoneGuard` (normal/easy) 블록 바로 아래에 `chainProfessor` 분기 추가. 조건:
  ```
  state.difficulty === 'hard' && state.cutscenesShown.has('intro') && !state.cutscenesShown.has('introProfessor')
  ```
  150ms 후 `triggerCutscene('introProfessor')`. 두 분기는 난이도로 상호 배타.
- **검증**: `grep introProfessor assets/js/game.js` → 6건 일치 (상수, 주석 1건, JSDoc, 체크 2건, 호출 1건)
- **의심되는 리그레션**: 없음. `state.cutscenesShown`은 startGame마다 새 Set으로 생성되므로 난이도 전환 시 자동 초기화.

### 변경 5. 캐릭터별 최고 기록 (assets/js/game.js + pages/game.html + assets/css/game.css)

#### 스키마 & 저장소
- **상수**: `BEST_BY_CHAR_KEY = 'pixelNurseBestByChar'` 추가 (L60). 구 `STORAGE_KEY = 'pixelNurseBest'`는 **롤백용으로 유지**(삭제 금지 준수).
- **state.best 스키마 변경** (L980~987): `{kim/jung/geon/im/lee: {easy,normal,hard}}` 5×3 구조.
- **loadBest()** 재작성 (L1053~1089):
  1. 신 키 우선 읽기 → 화이트리스트(`CHARACTER_IDS`) 필터링 + `normalizeBestScore`로 [0, 9999] clamp
  2. 신 키 없으면 구 키 읽어 `state.best.kim` 하위로 이관 + 즉시 `saveBest()` 호출(이후 신 키만 사용)
  3. try/catch로 Safari private mode 등 저장 실패 감싸기
- **saveBest()**: `{ version: 2, records: state.best }` payload로 신 키에만 저장.

#### 참조 교체
- `updateBestHud` (L1226~1230): `state.best[state.difficulty]` → `state.best[state.characterId][state.difficulty]`
- `endGame` 신기록 판정 (L1823~1829): 동일 패턴으로 교체 + 방어적 초기화 `|| (state.best[state.characterId] = { easy: 0, normal: 0, hard: 0 })`
- `btnCharacterConfirm` 핸들러에 `updateBestHud()` 호출 추가 — 캐릭터 변경 시 HUD Best가 즉시 갱신

#### 엔딩 오버레이 UI
- **HTML (pages/game.html L151~171)**: `<section class="game-overlay__records" aria-label="최고 기록">` 블록을 `#endStats` 직후 `#endStory` 직전에 삽입. 타이틀에 `<span class="js-nurse-name">김간호</span>` 후크로 자동 이름 치환.
- **JS `renderEndRecords()`** (L1185~1215): `recMineEasy/Normal/Hard`에 `textContent` 주입 + `endRecordsTbody` 재렌더(CHARACTERS 순서, 현재 캐릭터는 `tr.is-current` 강조). createElement + textContent만 사용 → XSS 안전.
- **`btnToggleAllRecords` 토글 핸들러** (L1218~1225): `is-hidden` 클래스 + `hidden` 속성 + `aria-expanded` + 버튼 라벨 ▾/▴ 토글.
- **endGame에서 호출** (L1902): `endScore.textContent = String(score)` 직전에 `renderEndRecords()` 호출 + 매 엔딩마다 "다른 실습생" 섹션은 기본 닫힘 상태.

#### 캐릭터 선택 카드 최고 기록
- `initCharacterGrid()` 내부 (L1436~1443): `tag` 뒤에 `.game-character-card__best` span 추가. `const maxScore = Math.max(rec.easy, rec.normal, rec.hard)` → `최고 N점` / `기록 없음` 표기. textContent만 사용.
- `openCharacterOverlay()`에서 `initCharacterGrid()`를 매번 호출하도록 수정 — 이전 라운드에서 경신된 기록이 카드에 반영된다.

#### CSS
- **`.game-overlay__records` 블록 신설** (L448~554 근방): records-title / records-list / records-toggle / records-all / records-table / `tr.is-current` 강조 스타일. 색상 전부 `var(--brand-*)`, `var(--bg-card)`, `var(--border)`, `var(--text-*)` 사용. 하드코딩 없음.
- **`.game-character-card__best`** (`.game-character-card` 중첩 내부): `font-size: 10px; color: var(--brand-light); font-variant-numeric: tabular-nums;`
- **520px 반응형**: records-title, records-list, records-table, character-card__best 모두 폰트/패딩 축소 블록 추가.
- **`#overlayEnd .game-overlay__panel--end`**: `overflow-y: auto` 추가 — 기록 섹션 추가로 키 작은 모바일에서 컨텐츠가 길어질 때 내부 스크롤.

## grep 기반 점검 결과

- `state.best` 접근점: 10건 (loadBest 마이그레이션, saveBest payload, updateBestHud, renderEndRecords 2건, initCharacterGrid 카드 1건, endGame 신기록 1건). **모두 `state.best[id]` 형태**이며 구 스키마 `state.best.easy/normal/hard` 잔존 **0건**.
- `SKILLS.im.durationMs`: L152 한 곳. 값 2500.
- `frozenUntil`: 6건 (player 리터럴/리셋 3곳, stethoscope 충돌 수정, frozen 판정 2곳). 모두 의도한 위치.
- `stethoToastUntil`: 7건 (player 리터럴 1, 리셋 3, 충돌 시 세팅 1, render 가드 2). 일관.
- `STETHO_TOAST`: 11건 (정의 + 참조). 모두 drawStethoToast/충돌 처리에서 소비.
- `introStoneGuard` vs `introProfessor`: 각 4/6건. `introProfessor` 체이닝은 `introStoneGuard` 체이닝 바로 아래 (L1977), 상호 배타(난이도 분기).
- `drawAirforceToast`는 함수로 분리되어 있지 않고 render() 내 인라인 블록 — `drawStethoToast`도 동일 인라인 블록으로 AIRFORCE 토스트 직후에 배치(SPEC 요구대로 "동일 박스 스타일 재사용").
- `innerHTML`: game.js 내 신규 삽입 **0건**. 모두 `textContent` + `createElement`.
- `localStorage.setItem` 신규 키: `pixelNurseBestByChar`만 저장. 구 키 `pixelNurseBest`는 **절대 제거하지 않음**(rollback 여지).

## 패턴 준수 확인

- **BEM 네이밍**: `.game-overlay__records`, `.game-overlay__records-title/list/toggle/all/table`, `.game-character-card__best` — 모두 block__element 패턴
- **CSS 변수 사용**: 모든 신규 색상은 `var(--brand-*)`, `var(--border)`, `var(--bg-card)`, `var(--text-*)` 사용. 하드코딩 색상 0건
- **CSS 네이티브 중첩**: `.game-overlay__records-list { & li { ... } }`, `.game-overlay__records-table { & th, & td { ... } & tr.is-current { & td { ... } } }` — `&` 문법 준수
- **반응형 520px**: records 섹션/character-card__best 모두 별도 블록에서 폰트/패딩 축소 대응
- **reduced-motion**: 토스트는 canvas 렌더(알파만 조정), DOM 애니메이션 없음. CSS 전역 `* { animation-duration: 0.01ms !important }` 블록이 커버. 추가 블록 불요.
- **esc()/safeUrl()**: 신규 데이터는 모두 정적 상수 또는 `Number`로 캐스팅된 점수 → XSS 표면 없음. `textContent`만 사용.
- **가드 클래스 (`if (!el) return;`)**: `renderEndRecords`는 개별 ref에 `if (recMineEasy)` 방어 + `if (!endRecordsTbody) return`. 토글 핸들러는 `if (btnToggleAllRecords && endRecordsAll)` 전 단계 가드.
- **DOMContentLoaded 등록**: 기존 IIFE 패턴이라 DOMContentLoaded 사용 안 함 (game.js 고유 스타일, script tag가 body 마지막). 초기화 코드 블록에 `loadBest()` → `initCharacterGrid()` 순서가 보장됨.
- **-webkit-backdrop-filter**: 신규 CSS 블록에 backdrop-filter를 추가하지 않음(기존 blur 요소는 건드리지 않음). 재확인 불필요.
- **파일 간 정합성**: game.html의 id 7개(`endRecords`, `endRecordsMine`, `recMineEasy/Normal/Hard`, `btnToggleAllRecords`, `endRecordsAll`, `endRecordsTbody`)가 game.js의 getElementById와 1:1 매칭. `.js-nurse-name`도 기존 후크 재사용.

## Sprint 범위 계약 준수

- **루트 3개 파일 (`index.html`, `assets/css/style.css`, `assets/js/main.js`)**: `git status --short` 기준 **변경 0건** (QA_REPORT.md / SELF_CHECK.md / SPEC.md만 차이). 포트폴리오 본체는 건드리지 않았다.
- **허용된 추가**: state 필드(`stethoToastUntil`), CUTSCENES 키(`introProfessor`), 새 상수(`STETHO_TOAST`, `BEST_BY_CHAR_KEY`), 기록 UI DOM/CSS — 모두 SPEC에 명시된 범위 내.
- **금지된 변경**:
  - 새 캐릭터/스킬/난이도/맵 추가 → 하지 않음
  - 청진기 속도/곡선 변경 → 하지 않음 (`PROFESSOR.stethoSpeed` 등 원본 유지)
  - 기록 전용 신규 페이지 생성 → 하지 않음 (엔딩 오버레이 + 캐릭터 선택 오버레이 내부에 녹임)
  - 외부 라이브러리/새 CSS·JS 파일 → 추가 없음
- **Sprint 범위 외지만 필요했던 변경**:
  1. `#overlayEnd .game-overlay__panel--end`에 `overflow-y: auto` 추가 — 기록 섹션 삽입으로 작은 모바일에서 콘텐츠 overflow 위험이 있어 필수 연동 변경.
  2. `openCharacterOverlay`에 `initCharacterGrid()` 재호출 — 카드 최고 기록이 라운드 종료 후 재방문 시 자동 갱신되도록. SPEC 5-2-5의 "자동 최신화" 명시에 부합하는 최소 추가.
