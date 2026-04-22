# 게임 5종 개선: 모바일 버튼 확대 · 임간호 스킬 단축 · 청진기 스턴/알림 동기화 · 이교수 경고 · 캐릭터별 최고 기록

## 개요
`pages/game.html`의 "김간호는 음악박사" 게임에 다섯 가지 변경을 한 번에 반영한다. 모바일 조작성 개선 1건, 밸런스 수정 1건, 버그성 동작 수정 1건, 예고/경고 일관성 개선 1건, 기능 신설 1건이다. 모든 변경은 `pages/game.html` + `assets/css/game.css` + `assets/js/game.js` 세 파일 범위에서만 이뤄진다. (루트 `index.html`/`assets/css/style.css`/`assets/js/main.js`는 변경하지 않는다.)

## 변경 유형
**혼합** — 밸런스/버그/신기능(로직) 3건 + 모바일 레이아웃(디자인) 1건 + 예고 알림(혼합) 1건. 기능 성격이 더 크므로 평가 기준은 **기능 변경 평가 기준**을 우선 적용한다.

## 디자인 언어 & 의도
모바일 플레이어가 엄지로 정확히 방향을 찍을 수 있는 "큼직한 안심 조작감"을 만들고, 이교수·석조무사·청진기 피격 같은 비일상 이벤트에는 **게임 안쪽 토스트 박스** 하나의 통일된 언어(박병장 토스트 패턴 = `drawAirforceToast` 스타일)로 즉각 맥락을 전달한다. 기록 화면은 엔딩에서 "오늘 점수 → 이번 캐릭터 최고 → 다른 캐릭터 기록"으로 시선을 이어가게 해 각 실습생에게 애정이 쌓이도록 한다.

## Sprint 범위 계약
Generator가 SPEC 외 변경을 하려 할 때의 판단 기준:

- **허용**
  - 새 토스트(stethoscope hit, professor warn)가 정확히 동작하기 위한 `state` 필드 추가, 렌더 호출 지점 추가
  - 캐릭터별 최고 점수 저장 구조 도입을 위한 `state.best` 스키마 마이그레이션(구 데이터 읽어서 `kim` 캐릭터로 이관)
  - 모바일 키패드 확대로 인한 `.game-canvas-wrap`의 `max-height` 재조정(레이아웃이 깨지는 경우에 한해)
  - 기존 주석 블록(`//` 섹션 구분선)과 동일한 스타일로 새 주석 추가
  - `introStoneGuard`와 대칭을 이루는 `introProfessor` 컷씬 키 추가(기존 CUTSCENES 객체 확장)
- **금지**
  - 새 캐릭터/스킬/난이도/맵 추가
  - `index.html`/`assets/css/style.css`/`assets/js/main.js` 수정 (포트폴리오 본체 영역은 건드리지 않는다)
  - 청진기 투사체 속도/속도 곡선/이교수 투척 인터벌/수간호사 로직 등 **요청에 없는 밸런스 수치** 변경
  - 기록 기능을 구현하기 위해 기록 전용 **신규 페이지** 생성 (엔딩 오버레이 + 캐릭터 선택 오버레이 내부에 녹여라)
  - 외부 라이브러리 도입, 새 CSS/JS 파일 생성
- **판단 기준**: "이 변경이 없으면 SPEC의 5개 항목 중 하나가 동작하지 않거나 기존 기능을 깨는가?" → YES면 허용, NO면 금지.

---

## 현재 코드 조사 결과(근거)

| 항목 | 현재 위치 | 현재 값/동작 |
|---|---|---|
| 임간호 "벼락치기" 지속(= A 받는 시간) | `game.js` L152 `SKILLS.im.durationMs` | `4000` ms (4초) |
| 청진기 피격 스턴 시간 | `game.js` L88~94 `PROFESSOR.freezeDuration` | `2000` ms, 피격 시 L3293 `p.frozenUntil = now + 2000` |
| 스턴 타이머 비교 | `game.js` L3030, L3461 `const frozen = now < p.frozenUntil;` | `now`는 `performance.now()`. **컷씬/오버레이 중에도 `now`는 계속 흐르므로** 알림을 띄우는 동안 스턴 시간이 소진된다 — 사용자가 지적한 버그의 원인. |
| 석조무사 경고(기준이 되는 패턴) | `CUTSCENES.introStoneGuard` (L191~194), `resumeFromCutscene` L1827~1834에서 intro 직후 체이닝 | `triggerCutscene('introStoneGuard')`를 setTimeout 150ms로 예약. `state.cutscenesShown` Set으로 중복 방지. |
| 이교수 NPC | `game.js` L2310 `initProfessor`(상 난이도 startGame에서 호출), L86 `PROFESSOR` 상수 | 현재 별도 경고 컷씬 없음. intro 컷씬 본문에만 언급. |
| 모바일 방향패드 버튼 | `game.css` L863 `.game-keypad__btn` | `width/height: 72px`, `gap: 10px`. 초소형(≤380px)에서 60px. |
| 모바일 스킬 버튼 | `game.css` L1114 `.game-keypad__skill` | `72px × 72px`. |
| 캔버스 모바일 최대 높이 | `game.css` L1199 `.game-canvas-wrap { max-height: calc(100dvh - 340px) }` | 키패드 확대 시 재계산 필요. |
| Best 저장 | `game.js` L59 `STORAGE_KEY = 'pixelNurseBest'`, `loadBest/saveBest` L1018~1035 | `{easy, normal, hard}` 난이도별만 저장. 캐릭터별 구분 없음. |
| Best HUD | `hudBest` element + `updateBestHud` L1115 | 난이도 하나만 표시. |
| 엔딩 오버레이 통계 | `index page game.html` L146 `<ul id="endStats">` | 최대 콤보 / 피격 / 정확도 3개. 기록 UI 추가할 공간 있음. |
| 캐릭터 선택 그리드 | `renderCharacterGrid` L1281~1319 | 각 카드에 `avatar + name + tag`만 있음. |

---

## 변경 1. 모바일 버튼 대형화(영역 구분 강화)

### 현재 동작과 문제점
방향패드/스킬 버튼 모두 72px 원형. 손가락으로 조준 시 경계가 애매하다. 유저가 "아예 확 더 키워줘 각각의 영역을" 요청 → 각 버튼의 탭 영역을 더 크게, 버튼 사이의 시각적 분리를 더 또렷하게.

### 목표 동작
- 방향 4개 + 중앙 스킬 각각이 **손가락 안착점을 명확히 구분**할 수 있을 만큼 커진다.
- 모바일(520px 이하)에서 한눈에 "네 방향 + 가운데"가 보이도록 버튼 사이 gap을 키우고, 각 버튼의 배경/테두리 대비를 유지한다.
- 캔버스 영역이 밀려 키패드 일부가 화면 아래로 잘리지 않아야 한다.

### 구현 가이드라인 (파일: `assets/css/game.css`)

1. `.game-keypad__btn`, `.game-keypad__skill` 기본값 변경:
   - `width/height: 72px` → **`width/height: 96px`**
   - `font-size: 22px` → `font-size: 28px` (`__skill`은 `15px` → `18px`, 라벨 가독성 유지)
2. `.game-keypad__dpad { gap: 10px }` → **`gap: 14px`** (영역 구분 강화)
3. `@media (hover: none) and (pointer: coarse)` 블록에서 `.game-keypad:not([hidden])`의 `padding: 12px 8px 4px` → **`padding: 14px 6px 6px`** 로 좌우 여백만 살짝 축소해 버튼 확대 수용.
4. `@media (max-width: 380px)` 블록의 소형 기기 오버라이드:
   - `.game-keypad__btn { width/height: 60px }` → **`width/height: 80px`, `font-size: 22px`**
   - `.game-keypad__dpad { gap: 8px }` → `gap: 12px`
   - `.game-keypad__skill { width/height: 60px }` → **`80px`**, `font-size: 13px → 16px`
5. `@media (max-width: 520px)` 블록의 `.game-canvas-wrap { max-height: calc(100dvh - 340px) }` → **`calc(100dvh - 400px)`** (확대된 키패드 높이 수용). 이 수치 변경으로 작은 화면에서 캔버스가 과도하게 짧아질 위험이 있으므로 `min-height: 240px`도 함께 부여한다.
6. `backdrop-filter`, `border`, `color`, active 시 `transform: scale(0.92)` 같은 기존 효과는 유지. 색/보더만 확대해선 안 된다.
7. `prefers-reduced-motion` 블록 내 기존 `.game-keypad__btn` transition 비활성 규칙도 그대로 유지.

### 엣지 케이스
- 매우 작은 화면(320px 폭): 3×96px + 2×14px = 320px로 가로가 꽉 찬다. 320px 이하는 더 이상 축소 브레이크포인트를 추가하지 말고 `.game-keypad__dpad { max-width: min(100%, 340px); margin: 0 auto }`로 감싸 overflow가 나지 않도록 한다.
- 키패드는 `hidden` 속성이 JS로 관리되므로 CSS `display` 변화가 `hidden`보다 우선되지 않아야 한다(기존 `&[hidden] { display: none }` 유지).

---

## 변경 2. 임간호 스킬 "A 받는 시간" 단축

### 현재 동작과 문제점
`SKILLS.im.durationMs = 4000` (4초). `isImCharmed()`가 이 값을 기준으로 판정하여, 4초 동안 모든 F가 A로 전환되어 점수 2배를 몰아 받는다. 사용자 체감상 너무 길다는 피드백.

### 목표 동작
- 매혹 지속을 **2500ms(2.5초)** 로 단축. (쿨다운 25초는 유지 — SPEC 범위 외)
- 발동 순간 이미 필드에 있던 F가 A로 전환된 뒤 2.5초가 지나면 새로 들어오는 것은 다시 F로 돌아간다(기존 `isImCharmed` 로직 그대로 재사용되므로 상수만 줄이면 됨).

### 구현 가이드라인 (파일: `assets/js/game.js`)
- L152 한 줄 수정:
  - `im: { name: '벼락치기', desc: '수간호사를 매혹시켜 F 대신 A를 던지게 한다. A를 먹으면 점수 2배.', durationMs: 4000, cooldownMs: 25000, abbr: '매혹' }`
  - → `durationMs: 2500`
- 스킬 오버레이의 설명 문구(`desc`)는 "지속 X초" 같은 숫자가 하드코딩되어 있지 않으므로 수정 불필요. 만약 지속시간을 표시하는 UI가 있다면(확인 결과 없음) 그대로 자동 반영된다.
- 기존 skill 오버레이에서 `durationMs`를 참조해 "4초"처럼 렌더하는 코드가 있는지 한 번만 grep해서(`durationMs`) 확인 후, 있으면 자동 반영/없으면 추가 작업 없음.

### 엣지 케이스
- 스킬 발동 중 캐릭터가 쓰러지거나 컷씬이 뜨면 `endGame`/`triggerCutscene`에서 `state.running`이 false가 되지만 `state.skill.activeUntil`은 초기화되지 않는다. 기존 로직과 동일하므로 이번 변경으로 추가 조치 불필요. (알림 중 스턴은 변경 3에서 별도로 처리.)

---

## 변경 3. 청진기 피격 알림 + 스턴 시간 일시정지

### 현재 동작과 문제점
L3280~3300: 청진기 충돌 시 `p.frozenUntil = now + 2000` 만 세팅. **토스트/알림은 없음.** 플레이어가 사용자 요구처럼 "알림창이 뜨면" 그 알림이 노출되는 동안(예: 기존에 개발자가 다른 경로로 alert를 끼워 넣었다면) `now`는 계속 흐르므로, 알림 종료 시 스턴도 소진되어 "스턴이 바로 풀리는" 현상이 생긴다.

### 목표 동작 (요청 원문 재해석)
1. **청진기를 맞은 순간, 화면 상단에 박병장 토스트와 동일한 게임 내 박스 형태의 알림**을 1.0초간 표시한다.  
   제목: `청진기 명중!` / 부제: `이교수의 청진기에 맞아 2초간 움직일 수 없습니다.`
2. **알림이 표시되는 동안에는 스턴(frozen) 카운트다운이 소진되지 않는다.** 즉 알림이 끝난 시점부터 "피격 시 할당된 2초 전체"가 플레이어 체감 스턴으로 이어져야 한다.
3. 알림 중 플레이어 입력은 여전히 차단(이미 `immobile` 판정). 적/투사체/타이머(남은 시간)는 계속 흐른다(게임 루프는 정지하지 않는다).

### 구현 가이드라인 (파일: `assets/js/game.js`)

#### 3-1. 상수 추가
`PROFESSOR` 근처 또는 `AIRFORCE` 아래에 새 상수 블록:
```
const STETHO_TOAST = {
  duration: 1000,              // ms — 토스트 표시 시간
  title: '청진기 명중!',
  subtitle: '이교수의 청진기에 맞았습니다. 잠시 움직일 수 없습니다.',
  boxW: 360, boxH: 54, boxY: 24,
  titleSize: 16, subtitleSize: 12
};
```
(박병장 토스트 상수 `AIRFORCE.toastBoxW/H/Y/TitleSize/SubtitleSize`와 동일한 네이밍 규칙)

#### 3-2. 상태 필드 추가
`state.player`에 `stethoToastUntil: 0` 필드 추가 (L947 `player` 리터럴). 동시에 `resetState`/`startGame`/`endGame`에서 `frozenUntil`을 0으로 리셋하는 라인 근처에 `state.player.stethoToastUntil = 0`도 함께 리셋.

#### 3-3. 청진기 충돌 처리 수정 (L3280~3300)
기존:
```
state.stethoscopes.splice(i, 1);
p.frozenUntil = now + PROFESSOR.freezeDuration;
state.combo = 0;
...
```
→ 수정 후:
```
state.stethoscopes.splice(i, 1);
// 토스트 종료 시점부터 freezeDuration 전체가 적용되도록 "알림 + 스턴"을 직렬화한다.
p.stethoToastUntil = now + STETHO_TOAST.duration;
p.frozenUntil = now + STETHO_TOAST.duration + PROFESSOR.freezeDuration;
state.combo = 0;
updateComboHud(false);
playTone(440, 0.08);
setTimeout(() => playTone(220, 0.15), 100);
```
→ 이 방식은 "토스트 1s + 스턴 2s = 총 3s 동안 `frozen === true`" 가 된다. 토스트 종료 직후 사용자 체감상 "스턴 2초가 온전히 남은 것처럼" 이어져 요청과 일치한다.

#### 3-4. 토스트 렌더 함수 추가
`drawAirforceToast`(또는 해당 기능을 하는 그리기 블록, L3521~3580 근방)을 참고해 **같은 박스 스타일**의 `drawStethoToast(ctx, now)`를 추가하고, 메인 draw 파이프라인에서 AIRFORCE 토스트 근처에 호출:
```
if (now < state.player.stethoToastUntil) {
  drawStethoToast(ctx, now);
}
```
- 박스 색/보더는 기존 AIRFORCE 토스트와 동일한 CSS 변수(`--brand-*`/`--bg-card`)에서 `getComputedStyle`로 읽어 재사용.
- 텍스트는 `STETHO_TOAST.title`/`subtitle` 상수 사용 → XSS 무관(정적 상수, `fillText`).
- 잔여 시간 기반 fade-out 0.2s 구현(박병장 토스트와 동일 패턴): `const remain = state.player.stethoToastUntil - now; const alpha = remain < 200 ? remain / 200 : 1;`

#### 3-5. 입력 차단 보강
`immobile` 판정은 이미 `now < p.frozenUntil`을 포함하므로 토스트 표시 중(= `frozenUntil`이 토스트+스턴 합산) 자동으로 입력이 막힌다. 별도 수정 불필요.

### 엣지 케이스
- 토스트 표시 중 두 번째 청진기가 연속으로 명중하는 경우: `p.frozenUntil`을 **max(기존, new)** 로 갱신하지 말고 **덮어쓴다**(기존 동작 유지). 토스트도 마찬가지로 `stethoToastUntil`을 덮어쓴다. 이유: 두 번 맞으면 새 알림이 다시 1초 뜨고, 스턴도 새로 2초 + 알림 1초로 리셋되는 것이 플레이어 의도와 부합(경고는 매번 들어야 함).
- 스킬 무적 중엔 L3283 `stethoSkip` 가드에 의해 명중 자체가 발생하지 않는다. 따라서 토스트도 뜨지 않는다(정상).
- `endGame` 진입 시 `state.player.stethoToastUntil = 0`으로 반드시 리셋(잔존 토스트가 오버레이 위에 그려지지 않게).

---

## 변경 4. 상 난이도 이교수 출현 경고(석조무사 경고와 동일 패턴)

### 현재 동작과 문제점
- 상 난이도(hard): intro 컷씬 본문에만 "이교수가 청진기를 휘두른다" 문장이 들어있음. 별도 경고 컷씬 없음.
- 하/중 난이도: intro 직후 `introStoneGuard` 컷씬이 150ms 후 체이닝되어 "경고 · 석조무사 출현" 안내를 띄운다(L1827~1834).
- 사용자 요청: 상 난이도에도 **"경고 · 이교수 출현" 컷씬**을 동일 패턴으로 이어 붙여줘.

### 목표 동작
- 난이도 `hard`로 게임 시작 → intro 컷씬 → **continue 시 150ms 후 `introProfessor` 컷씬이 자동으로 이어진다** → continue 시 게임 시작.
- 이미 본 컷씬은 재표시되지 않는다(`state.cutscenesShown` 기존 메커니즘 그대로 활용).

### 구현 가이드라인 (파일: `assets/js/game.js`)

#### 4-1. `CUTSCENES`에 키 추가 (L191 근처, `introStoneGuard` 바로 아래)
```
introProfessor: {
  title: '경고 · 이교수 출현',
  text: '학교에서 나온 깐깐한 이교수가 청진기를 들고 순찰을 돕니다! 맞으면 움직일 수 없게 됩니다. 피하세요.'
}
```
- 텍스트 스타일은 `introStoneGuard`와 평행하게(경고 아이콘/공포 톤 매칭). XSS 무관(정적 상수, `textContent`로 주입됨).

#### 4-2. `resumeFromCutscene` 체이닝 확장 (L1822~1844)
기존 하/중 체이닝 블록 바로 아래에 hard 체이닝 추가:
```
const chainProfessor = state.difficulty === 'hard'
  && state.cutscenesShown
  && state.cutscenesShown.has('intro')
  && !state.cutscenesShown.has('introProfessor');
if (chainProfessor) {
  setTimeout(() => triggerCutscene('introProfessor'), 150);
  return;
}
```
- 순서: `chainStoneGuard` (normal/easy) → `chainProfessor` (hard). 두 조건은 상호 배타(난이도로 분기).
- `triggerCutscene`의 타입 주석(`@param {'intro'|'mid1'|'mid2'|'introStoneGuard'}`) JSDoc에 `'introProfessor'` 추가.

#### 4-3. `startGame`의 컷씬셋 초기화 검토
`state.cutscenesShown = new Set()` 이 매 라운드마다 리셋되는지 확인 — 현재 코드상 라운드 시작마다 새 Set으로 생성되고 있으므로 추가 조치 불필요.

### 엣지 케이스
- 난이도가 hard인데 중간에 다른 난이도로 바꾸면 `state.cutscenesShown`이 리셋되므로 새 난이도의 경고가 정상적으로 뜬다.
- reduced-motion: 컷씬 진입 애니메이션은 이미 `@media (prefers-reduced-motion: reduce)`에서 비활성화되어 있다(L1487). 추가 조치 불필요.
- 스크린리더: `#overlayCutscene`이 이미 `aria-live="polite"`이므로 새 텍스트도 자동으로 읽힌다.

---

## 변경 5. 캐릭터별 최고 기록 저장 + 기록 점수판

### 현재 동작과 문제점
- `state.best = { easy, normal, hard }` 하나뿐이어서 캐릭터를 바꿔도 "어느 실습생으로 찍었는지" 구분 불가.
- 엔딩 오버레이와 HUD의 "Best"는 현재 난이도 기준 단일 값만 표시.

### 목표 동작
- 캐릭터 × 난이도 조합별로 최고 점수를 localStorage에 저장.
- 엔딩 오버레이에 **현재 캐릭터 기준 난이도별 최고 기록** 행(3개 칸)을 추가하고, "다른 캐릭터도 보기" 토글(또는 항상 표시되는 섹션)로 전체 캐릭터×난이도 미니 표를 보여준다.
- HUD의 Best는 현재 캐릭터 × 현재 난이도 조합의 최고를 보여주도록 전환.
- 캐릭터 선택 오버레이의 각 카드에 "최고: N점(난이도 표시)" 한 줄을 추가해 애정 지표로 표시.

### 5-1. localStorage 스키마

- **신규 키**: `'pixelNurseBestByChar'`
- **스키마(JSON)**:
```
{
  "version": 2,
  "records": {
    "kim":  { "easy": 0, "normal": 0, "hard": 0 },
    "jung": { "easy": 0, "normal": 0, "hard": 0 },
    "geon": { "easy": 0, "normal": 0, "hard": 0 },
    "im":   { "easy": 0, "normal": 0, "hard": 0 },
    "lee":  { "easy": 0, "normal": 0, "hard": 0 }
  }
}
```
- **마이그레이션**: 최초 로드 시 신규 키가 없고 구 키 `'pixelNurseBest'` (`{easy,normal,hard}`)가 있으면 → 해당 값을 `records.kim`으로 이관(기본 캐릭터). 구 키는 삭제하지 말고 그대로 둔다(롤백 여지).
- **화이트리스트 검증**: 파싱 후 `CHARACTER_IDS` 밖의 캐릭터 키는 무시. 각 난이도 값은 `Number(v) || 0`로 정규화. 500점 초과 등 비정상값은 clamp(0, 9999).
- **저장 실패**: try/catch로 감싸 Safari private mode 등에서도 런타임 에러 안 나게. 기존 `saveBest`/`loadBest`와 동일 패턴.

### 5-2. 구현 가이드라인 (파일: `assets/js/game.js`)

#### 5-2-1. 상수/상태 변경
- `STORAGE_KEY = 'pixelNurseBest'` 는 남겨두고, **새 상수 `BEST_BY_CHAR_KEY = 'pixelNurseBestByChar'`** 추가.
- `state.best` 구조 변경:
  ```
  best: {
    kim:  { easy: 0, normal: 0, hard: 0 },
    jung: { easy: 0, normal: 0, hard: 0 },
    geon: { easy: 0, normal: 0, hard: 0 },
    im:   { easy: 0, normal: 0, hard: 0 },
    lee:  { easy: 0, normal: 0, hard: 0 }
  }
  ```
- `state.best[state.difficulty]`를 참조하던 코드를 **모두** `state.best[state.characterId][state.difficulty]`로 치환.
  - 대상 라인: L1116, L1695, L1698 (총 3곳 grep 재확인 필수)

#### 5-2-2. `loadBest`/`saveBest` 재작성
- `loadBest()`: 신규 키 우선 로드 → 없으면 구 키 읽어 `kim` 하위로 이관 → 파싱 실패 시 기본 zero 객체 유지. 모든 캐릭터/난이도 값은 `Number(v) || 0` + clamp.
- `saveBest()`: `{ version: 2, records: state.best }` 를 JSON.stringify 해서 `BEST_BY_CHAR_KEY`로 저장.

#### 5-2-3. HUD best 값 갱신 (`updateBestHud`)
- `hudBest.textContent = String(state.best[state.characterId][state.difficulty] || 0)` 로 수정.
- 캐릭터 선택 확정 시(`btnCharacterConfirm` 처리부, 기존 `saveCharacter` 호출 근처)에서도 `updateBestHud()` 호출 보장.
- 난이도 변경 버튼(`diffBtns` 클릭 핸들러)에서도 기존에 이미 호출하고 있다면 그대로, 없으면 추가.

#### 5-2-4. 엔딩 오버레이 확장
HTML(`pages/game.html` `#overlayEnd` 내부, `<ul class="game-overlay__stats" id="endStats">` 바로 아래)에 기록 섹션을 추가:
```
<section class="game-overlay__records" aria-label="최고 기록" id="endRecords">
  <h3 class="game-overlay__records-title"><span class="js-nurse-name">김간호</span> 최고 기록</h3>
  <ul class="game-overlay__records-list" id="endRecordsMine">
    <li><span>하</span><b id="recMineEasy">0</b></li>
    <li><span>중</span><b id="recMineNormal">0</b></li>
    <li><span>상</span><b id="recMineHard">0</b></li>
  </ul>
  <button class="game-btn game-btn--ghost game-overlay__records-toggle" type="button" id="btnToggleAllRecords" aria-expanded="false" aria-controls="endRecordsAll">
    다른 실습생 기록 보기 ▾
  </button>
  <div class="game-overlay__records-all is-hidden" id="endRecordsAll" hidden>
    <table class="game-overlay__records-table">
      <thead>
        <tr><th>실습생</th><th>하</th><th>중</th><th>상</th></tr>
      </thead>
      <tbody id="endRecordsTbody">
        <!-- JS가 렌더 (textContent만 사용) -->
      </tbody>
    </table>
  </div>
</section>
```
- JS 함수 `renderEndRecords()` 추가:
  1. `endRecordsMine`의 `recMineEasy/Normal/Hard`에 `state.best[state.characterId][diff]` 주입(`textContent`).
  2. `endRecordsTbody`를 비우고 `CHARACTERS` 순서대로 `<tr>` 생성: `td(캐릭터 이름) + td(easy) + td(normal) + td(hard)`. 모두 `textContent`.
  3. 현재 캐릭터 행은 `<tr class="is-current">`로 강조.
  4. `renderEndRecords()`는 `endGame()` 내 `endScore.textContent = String(score)` 직전에 호출.
- 토글 버튼: `btnToggleAllRecords` 클릭 시 `endRecordsAll.classList.toggle('is-hidden')` + `hidden` 속성 토글 + `aria-expanded` 토글.

#### 5-2-5. 캐릭터 선택 카드에 최고 기록 한 줄 추가
`renderCharacterGrid()` 내부에서 `tag` 아래에:
```
const best = document.createElement('span');
best.className = 'game-character-card__best';
const rec = state.best[ch.id] || { easy: 0, normal: 0, hard: 0 };
const maxScore = Math.max(rec.easy, rec.normal, rec.hard);
best.textContent = maxScore > 0 ? '최고 ' + maxScore + '점' : '기록 없음';
btn.appendChild(best);
```
- 테마 전환 시 재렌더 대상이 아님(카드 아바타만 재렌더). 단, `renderCharacterGrid`는 매번 오버레이 열릴 때 호출되므로 자동 최신화된다. 확인 필요.

### 5-3. 구현 가이드라인 (파일: `assets/css/game.css`)

`.game-overlay__stats` 바로 아래에 기록 전용 스타일 블록 추가(동일 톤으로):
- `.game-overlay__records` — `margin-top: 8px; display: flex; flex-direction: column; gap: 8px; text-align: center;`
- `.game-overlay__records-title` — `font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-dim);`
- `.game-overlay__records-list` — `.game-overlay__stats`와 동일 레이아웃 재사용(flex space-between, padding, border, `var(--brand-06)` bg).
- `.game-overlay__records-toggle` — `.game-btn--ghost` 기반, 모바일에서 누르기 쉽게 `min-height: 40px`.
- `.game-overlay__records-all.is-hidden { display: none }`.
- `.game-overlay__records-table` — `width: 100%; border-collapse: collapse;`, `th/td { padding: 6px 4px; font-size: 12px; color: var(--text-muted); text-align: center; font-variant-numeric: tabular-nums; border-bottom: 1px solid var(--border); }`.
- `.game-overlay__records-table tr.is-current { background: var(--brand-06); color: var(--text); font-weight: 700; }`.
- `.game-character-card__best` — `font-size: 10px; letter-spacing: 0.5px; color: var(--brand-light); margin-top: 2px;`.
- 520px 이하: `.game-overlay__records-title { font-size: 10px; }`, 테이블 `th/td { padding: 4px 2px; font-size: 10px; }`, `.game-character-card__best { font-size: 9px; }`.
- 색상은 전부 CSS 변수(`var(--brand-*)`, `var(--bg-card)`, `var(--border)`, `var(--text-*)`) 재사용. 하드코딩 금지.

### 5-4. 구현 가이드라인 (파일: `pages/game.html`)
- `#overlayEnd` 내부에 5-2-4에서 정의한 마크업을 **`<ul id="endStats">` 직후, `<p id="endStory">` 직전**에 삽입.
- 신규 DOM id: `endRecords`, `endRecordsMine`, `recMineEasy`, `recMineNormal`, `recMineHard`, `btnToggleAllRecords`, `endRecordsAll`, `endRecordsTbody`.
- 한국어 레이블은 정적 텍스트이므로 i18n 고려 없이 하드코딩 OK. 단, 캐릭터 이름은 `.js-nurse-name` 후크를 사용해 `applyNurseNameToDom`에 의해 자동 치환되도록 `<span class="js-nurse-name">김간호</span>` 패턴 사용.

### 엣지 케이스
- **구 데이터 존재하는 유저**: 처음 열 때 `pixelNurseBestByChar` 없음 + `pixelNurseBest` 있음 → `records.kim`으로 이관 후 즉시 `saveBest()`로 신규 키 생성. 이후부터 신규 키만 사용. 다른 4캐릭터는 0으로 초기화.
- **저장소 접근 불가**: `try/catch`로 감싸 런타임 에러 없이 기본 zero 객체로 계속 플레이.
- **정확도/신기록 판정**: `newRecord = state.score > state.best[state.characterId][state.difficulty]` 로 비교(캐릭터별). "신기록!" 표기는 해당 캐릭터 × 해당 난이도 기준.
- **기록 테이블 XSS**: `CHARACTERS` 배열의 이름과 `Number`로 캐스팅된 점수만 렌더하므로 안전. 그래도 `textContent` 사용 필수.

---

## 전체 주의사항

- `pages/game.html`은 루트 `index.html`과 별개 페이지다. 루트 본체 파일 3개(`index.html`, `assets/css/style.css`, `assets/js/main.js`)는 이번 변경에서 **수정 대상 아님**.
- `docs/css-rules.md`, `docs/js-rules.md`의 BEM/CSS 변수/네이티브 `&` 중첩/`esc`/`safeUrl` 규칙은 동일하게 적용.
- 새로 추가하는 토스트의 박스 텍스트는 모두 상수 → `fillText`(canvas) 또는 `textContent`(DOM)만 사용. `innerHTML` 금지.
- `prefers-reduced-motion`: 토스트 fade-out은 기존 AIRFORCE 토스트와 동일 수준으로 유지(이미 전역 `* { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }`로 덮인다). 별도 예외 블록 불필요.
- 접근성:
  - `#btnToggleAllRecords`에 `aria-expanded`/`aria-controls` 바인딩 필수.
  - `#endRecords` 섹션에 `aria-label` 또는 `<h3>` 내부 타이틀로 landmark 제공.
  - 청진기 토스트는 캔버스 내부라 SR에 읽히지 않음. 대체 수단으로 `hudTime`처럼 `aria-live="polite"` 영역이 이미 있으면 그대로 둔다(별도 추가 금지 — SPEC 범위 외 확대).
- 기존 기능과 충돌:
  - `state.best` 스키마 변경으로 "하드코딩으로 `state.best.easy` 같이 직접 접근한 라인"이 남아 있으면 전부 고쳐야 한다. grep으로 `state.best.` 전부 확인 필수.
  - 임간호 스킬 지속이 줄어도 쿨다운(25s)이 유지되므로 HUD 쿨다운 링 애니메이션은 자동으로 새 duration 반영. 추가 수정 불필요.
  - 청진기 스턴을 3초(토스트 1 + 스턴 2)로 연장하는 것은 게임 밸런스에 약간 영향을 준다. 이는 사용자 요청의 직접적 결과이므로 의도된 변화.
- 삭제할 코드 없음(모두 기존 값 수정/추가). 구 STORAGE_KEY 제거 금지(마이그레이션용으로 남긴다).
