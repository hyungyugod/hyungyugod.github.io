# 임간호 스킬 단발화 & 박병장 폭격 시퀀스

## 개요
임간호의 스킬을 **게임당 1회 · 1.5초 지속**으로 단축해 더 극적인 한 방 자원으로 재정의한다. 동시에 박병장 이스터에그를 **"석조무사 경고문"과 동일한 2단 박스 알림 → 일시정지 → 확인 버튼 → 폭격 연출 → F 전멸 → 수간호사 복귀 시 F 재시딩"**의 완결된 컷신 시퀀스로 승격시킨다.

## 변경 유형
**기능** (로직/상태 기계 재구성 중심, 신규 UI는 기존 컷씬 오버레이 패턴 재사용)

## 디자인 언어 & 의도
임간호의 스킬을 "언제 쓸지 목숨 걸고 고민하는 단 한 발의 카드"로 만들어, 다른 캐릭터의 쿨다운형 스킬과 체감 차이를 극대화한다. 박병장은 등장 자체가 서사의 클라이맥스 — 순간 정지되는 알림창이 플레이어의 숨을 멈추게 만들고, 확인 버튼을 누르는 순간 비행기 엔진음과 폭탄 낙하가 터지며 맵 위 F가 동시에 소멸한다. "석조무사를 피하라"던 경고와 대비되는 반전 쾌감을 극장 연출로 증폭시키는 것이 목표다.

## Sprint 범위 계약
Generator가 SPEC 외 변경을 하려 할 때의 판단 기준:
- **허용**:
  - 본 SPEC의 데이터 무결성을 위해 필요한 `state.skill` / `state.airplane` 필드 추가·리셋 (startGame/endGame/난이도 뒤로가기)
  - 기존 캔버스 상단 AIRFORCE 토스트 렌더 블록 제거 (오버레이가 동일 안내를 대체하므로 중복 제거)
  - 폭탄/폭발 시각화에 필요한 최소 파티클·사운드 추가 (기존 `spawnParticles`/`playTone` 재사용)
  - 이벤트 바인딩·HUD 업데이트 경로에서 `im && usedOnce` 분기 추가
- **금지**:
  - 다른 캐릭터(김/정/건/이)의 스킬 밸런스 변경 (지속·쿨다운·효과)
  - 수간호사/이교수/석조무사 본체 밸런스(속도·HP·투척 주기) 수정
  - 박병장 비행기 비주얼 대폭 재설계 (픽셀 스프라이트·속도·Y 위치 유지)
  - 신규 BGM, 신규 아이콘·이미지 에셋 추가
  - 기능 요청과 무관한 CSS 리팩토링이나 전역 테마 변수 조정
- **판단 기준**: "이 변경이 없으면 SPEC의 7가지 기능 중 하나가 정상 동작하지 않는가?" → YES면 허용, NO면 금지

---

## 변경 범위

### `pages/game.html` 변경사항
신규 오버레이 1개 추가. 기존 `#overlayCutscene` 구조 모방.

1. **박병장 경고 오버레이 추가** — `.game-canvas-wrap` 내부(기존 오버레이들 근처)에 추가:
   - 루트: `<div class="game-overlay game-overlay--cutscene game-overlay--airforce is-hidden" id="overlayAirforce" role="dialog" aria-labelledby="airforceTitle" aria-describedby="airforceText" aria-live="assertive">`
   - 패널: `<div class="game-overlay__panel game-overlay__panel--cutscene">`
   - 제목: `<h3 class="game-overlay__title" id="airforceTitle"></h3>` (textContent는 JS가 `AIRFORCE.title` 주입)
   - 본문: `<p class="game-overlay__text" id="airforceText"></p>` (`AIRFORCE.subtitle` 주입)
   - 고정 부제: `<p class="game-overlay__goal">📯 확인을 누르면 박병장이 출동합니다</p>`
   - CTA: `<button class="game-btn" type="button" id="btnAirforceContinue">확인</button>`

### `assets/css/game.css` 변경사항
1. **`.game-overlay--airforce` 악센트** — 기존 `.game-overlay--cutscene` 규칙 근처에 추가.
   - `.game-overlay--airforce .game-overlay__title { color: var(--brand); }` (기존 팔레트 재사용, 신규 색상 하드코딩 금지)
2. **폭탄 낙하 비네트** — `@keyframes gameBombFlash { 0%{filter:brightness(1)} 20%{filter:brightness(2.4) saturate(1.3)} 100%{filter:brightness(1)} }`
   - `.game-canvas-wrap.is-bomb-flash { animation: gameBombFlash 420ms ease-out 1; }`
   - `@media (prefers-reduced-motion: reduce) { .game-canvas-wrap.is-bomb-flash { animation: none; filter: none; } }`

### `assets/js/game.js` 변경사항

#### [A] 상수 변경

1. **SKILLS.im 수정** (약 line 166):
   ```js
   im: { name: '나는야 모범생', desc: '수간호사를 매혹시켜 F 대신 A를 던지게 한다. A를 먹으면 점수 2배. (게임당 1회)', durationMs: 1500, cooldownMs: 0, abbr: '모범' }
   ```
   - 스킬명 `벼락치기` → `나는야 모범생`
   - 지속시간 `2500` → `1500`
   - 쿨다운 `25000` → `0`
   - abbr `매혹` → `모범`

2. **AIRFORCE 확장** (약 line 107–125):
   - 유지: `flyDuration`, `planeSpeed`, `planeY`, `planeW`, `planeH`, `fleeDuration`, `fleeSpeed`, `title`, `subtitle`
   - 추가:
     - `bombDropDelay: 300` (ms — 오버레이 닫힘 → 폭탄 투하까지)
     - `bombFlashDuration: 420` (ms)
     - `bombY: 140` (폭탄 낙하 y 기준점)
     - `respawnCountMultiplier: 1.0` (수간호사 복귀 시 F 재시딩 비율)
   - 캔버스 토스트 상수(`toastDuration`, `toastBoxW/H/Y`, `toastTitleSize`, `toastSubtitleSize`) — 사용 코드가 모두 제거되므로 상수 자체도 제거 권장.

#### [B] state 확장

1. **`state.skill.usedOnce: false`** 추가. `im` 캐릭터 전용 게임당 1회 플래그.
2. **`state.airplane` 확장**:
   - `pendingBombDrop: 0` (폭탄 투하 예정 타임스탬프)
   - `bombDropped: false` (중복 방지)
   - `pauseOverlayOpen: false` (일시정지 상태 플래그)

#### [C] 단발 스킬 로직 — `tryActivateSkill`

기존 `if (now < state.skill.readyAt) return;` 바로 아래에:
```js
if (state.characterId === 'im' && state.skill.usedOnce) return;
```

성공 분기에서 `im`일 때:
```js
if (state.characterId === 'im') {
  state.skill.usedOnce = true;
  state.skill.readyAt = Number.POSITIVE_INFINITY;
} else {
  state.skill.readyAt = now + def.cooldownMs;
}
```
`state.skill.activeUntil = now + def.durationMs;` 유지 (1500ms).

#### [D] HUD — `updateSkillHud`

`im` + `usedOnce === true`일 때 최우선 분기:
- label `—` 표시
- conic-gradient `prog = 0`
- `is-skill-ready` 제거 + `is-skill-cooling` 유지(시각적 비활성화)
- 모바일 `keypadSkillBtn` 동일 처리
- 반드시 NaN 경로(`remaining/cd` 계산)를 타지 않도록 이 분기가 우선.

#### [E] 초기화 지점 3곳에서 `state.skill.usedOnce = false`
1. `startGame` (약 line 1714)
2. `endGame` (약 line 1799)
3. 난이도 뒤로가기/재플레이 리셋 (약 line 1324)

#### [F] 박병장 등장 시퀀스 재작성 — `triggerAirforceEasterEgg`

3단계 상태 기계:

```
[1: 접촉] triggerAirforceEasterEgg(now)
  - state.stoneGuard.active = false
  - state.running = false
  - cancelAnimationFrame(state.rafId); state.rafId = null
  - state.keys = Object.create(null)
  - state.airplane.pauseOverlayOpen = true
  - #overlayAirforce 열기 (is-hidden 제거)
      · #airforceTitle.textContent = AIRFORCE.title
      · #airforceText.textContent = AIRFORCE.subtitle
      · #btnAirforceContinue.focus({preventScroll: true})

[2: 확인 버튼] onAirforceContinue()
  - #overlayAirforce.classList.add('is-hidden')
  - state.airplane.pauseOverlayOpen = false
  - 비행기 스폰: x=-planeW, y=planeY, active=true, expiresAt=now+flyDuration
  - state.airplane.pendingBombDrop = now + AIRFORCE.bombDropDelay
  - state.airplane.bombDropped = false
  - 수간호사 flee 시작 (기존 startChiefFlee / chief.fleeUntil = now + fleeDuration)
  - 엔진음: playTone 2연타
  - 게임 루프 재개:
      state.running = true
      state.lastTs = performance.now()
      nextSpawnAt 보정
      state.rafId = requestAnimationFrame(loop)

[3: 폭탄 낙하] 업데이트 루프 내 체크
  조건: state.airplane.active && !state.airplane.bombDropped && now >= state.airplane.pendingBombDrop
  - state.airplane.bombDropped = true
  - dropBomb(now) 호출 (신규 함수):
      · state.obstacles = state.obstacles.filter(o => o.type === 'A')   // F만 제거, A 보존
      · canvasWrap.classList.add('is-bomb-flash'); 420ms 후 remove
      · (reduced-motion 가드) 파티클 20~25개 bombY 중심
      · playTone(80, 0.4) + setTimeout(()=>playTone(55, 0.55), 120)
      · canvasWrap.classList.add('is-shake'); 500ms 후 remove (기존 셰이크 재사용)
```

#### [G] 수간호사 복귀 시 F 재시딩 (약 line 2167)

기존:
```js
if (chief.fleeUntil > 0 && now >= chief.fleeUntil) {
  chief.fleeUntil = 0;
  chief.throwTimer = DIFFICULTY[state.difficulty].spawnInterval[0];
}
```

변경:
```js
if (chief.fleeUntil > 0 && now >= chief.fleeUntil) {
  chief.fleeUntil = 0;
  chief.throwTimer = DIFFICULTY[state.difficulty].spawnInterval[0];
  const targetCount = Math.round(DIFFICULTY[state.difficulty].obstacles * AIRFORCE.respawnCountMultiplier);
  const existingF = state.obstacles.filter(o => o.type === 'F').length;
  const toSpawn = Math.max(0, targetCount - existingF);
  for (let i = 0; i < toSpawn; i++) spawnObstacle();
  playTone(220, 0.08);
}
```
`spawnObstacle()`은 이미 플레이어 회피 + `findEmptyTile` 안전 로직 포함.

#### [H] 캔버스 상단 토스트 렌더 제거

기존 "박병장 2단 안내 박스" 캔버스 렌더 블록 전체 삭제. `state.airplane.toastUntil` 관련 라인도 정리.

#### [I] DOM 이벤트 바인딩

기존 `btnCutsceneContinue` 바인딩 근처:
```js
const btnAirforceContinue = document.getElementById('btnAirforceContinue');
if (btnAirforceContinue) btnAirforceContinue.addEventListener('click', onAirforceContinue);
```
ESC 키/외부 클릭으로 닫히지 않음 (컷씬과 동일, 강제 진행).

---

## 기능 상세

### 기능 1: "나는야 모범생" 단발 스킬
- 사용자 동작: Shift 키 또는 모바일 중앙 스킬 키패드로 1회 발동. 사용 후 HUD 라벨 `—`, 링 비어있는 상태로 고정.
- 구현: SKILLS.im / tryActivateSkill / updateSkillHud / 초기화 3지점.

### 기능 2: 스킬명/지속시간 데이터 변경
- SKILLS.im.name/desc/durationMs/cooldownMs/abbr 수정. 설명 오버레이는 `renderSkillOverlay`가 자동 반영.

### 기능 3: 박병장 등장 알림창 (일시정지형)
- 석조무사 접촉 시 캔버스 토스트 대신 DOM 오버레이, `state.running = false`로 완전 정지.
- 제목 "나와라 박병장!" / 본문 AIRFORCE.subtitle 원문 그대로 / 확인 버튼 포커스.
- `role="dialog"`, `aria-live="assertive"`.

### 기능 4: 비행기 출격 + 폭탄 낙하 연출
- 오버레이 닫힘 즉시 비행기 스폰 + 300ms 후 폭탄 투하.
- 섬광(`.is-bomb-flash`) + 파티클 + 저음 2연타 폭발음 + 셰이크.
- `prefers-reduced-motion` 가드 (CSS + JS 양쪽).

### 기능 5: 맵 위 F 전멸
- `state.obstacles.filter(o => o.type === 'A')`로 F만 제거. 매혹 중 생성된 A는 보존(플레이어 보상).
- 비행기 활성 중 수간호사는 flee 상태 → 신규 F 투척 원천 차단.

### 기능 6: 수간호사 복귀 시 F 재생성
- `chief.fleeUntil` 만료 순간 난이도별 기본 F 개수만큼 `spawnObstacle()` 보충.
- 복귀 효과음 `playTone(220, 0.08)`.

### 기능 7: 접근성 & 반응형
- 신규 오버레이는 기존 컷씬과 동일 포커스 관리·aria 속성·520px 반응형 스타일 상속.
- `prefers-reduced-motion` 시 섬광·파티클·셰이크 스킵하되 게임 로직(F 제거/복구)은 동일 수행.

---

## 주의사항

- **충돌 가능성**:
  - 캔버스 상단 AIRFORCE 토스트 잔존 시 오버레이와 이중 안내 → 반드시 제거.
  - `state.skill.readyAt = Infinity` 설정 시 HUD의 `(remaining/cd)` 계산이 NaN → `im && usedOnce` 분기를 **HUD 헬퍼 최우선**으로 배치.
  - 오버레이 닫힘 시 `lastTs = performance.now()` 갱신 누락 시 dt 폭주로 타이머 순간 삭제 → 컷씬 재개 패턴 엄수.

- **삭제/수정 대상**:
  - `game.js` 박병장 캔버스 2단 박스 렌더 블록 전체
  - AIRFORCE.toastDuration / toastBoxW/H/Y / toastTitleSize / toastSubtitleSize 상수
  - state.airplane.toastUntil 관련 라인
  - `triggerAirforceEasterEgg` 본문 전체 교체

- **보안/접근성**:
  - 오버레이 텍스트는 상수 기반 `textContent` 주입 → XSS 무관.
  - ESC/외부 클릭 닫힘 비활성화 (강제 컷씬).
  - 모바일 스킬 버튼도 `usedOnce` 시 비활성 시각 (`is-skill-cooling` 재활용).
