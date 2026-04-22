# SPEC.md

## 개요
픽셀 작곡 게임 "김간호는 음악박사"에 캐릭터별 능동 스킬 5종을 추가한다. 지금까지 5명 캐릭터는 외형·이름·속마음 대사만 달랐으나, 이번 업데이트로 각 캐릭터의 서사(곡괭이·책·공부·여행)가 게임 메카닉으로 번역된다. 캐릭터 확정 후 스킬 설명 오버레이를 거쳐 게임이 시작되며, 데스크톱은 Shift, 모바일은 십자키 중앙의 신규 원형 버튼으로 사용한다.

## 변경 유형
**혼합 (디자인 + 기능)** — 새 로직(스킬 시스템·쿨다운·캐릭터별 효과), 새 DOM(스킬 오버레이·스킬 HUD·중앙 스킬 버튼), 새 스타일(악센트 컬러·쿨다운 원형 게이지·모바일 버튼).

## 디자인 언어 & 의도
5명이 모두 "같은 스프라이트 다른 옷"이었던 상태에서, 각자의 서사가 손끝에서 발동되는 순간을 만든다. 스킬 오버레이는 기존 게임 오버레이(glassmorphism + 코럴핑크)와 동일 톤이되, 스킬별 악센트 글로우가 카드 테두리에 번지며 "이 캐릭터만의 색"을 각인한다. 인게임 HUD의 쿨다운 게이지는 HUD 시간 슬롯과 동일 서체·사이즈로, 십자키 중앙 스킬 버튼은 방향 버튼(코럴 `--brand`)과 대비되는 웜 옐로우 악센트로 "주역 버튼" 위계를 만든다.

## Sprint 범위 계약
Generator가 SPEC 외 변경을 하려 할 때의 판단 기준:
- **허용**: 스킬 시스템 동작에 필수적인 기존 코드 연동 — (a) `startGame()`에서 스킬 상태 초기화, (b) `update()` 루프에 스킬 효과 틱 추가, (c) `endGame()`에서 스킬 타이머 클린업, (d) 오버레이 플로우 전환(`btnCharacterConfirm` → 스킬 오버레이), (e) `isAnyOverlayOpen()` 새 오버레이 포함, (f) `clearDpadPressed()`에 스킬 버튼 포함.
- **금지**:
  - 캐릭터 스프라이트/팔레트/`nurseSprite`·`drawCharacterCardAvatar` 수정
  - 맵 생성(`buildMap`) 수정
  - 수간호사/이교수 AI 및 패트롤 경로 수정
  - F 투사체(`spawnObstacle`) 생성 로직 수정
  - 난이도 테이블(`DIFFICULTY`/`TARGET_SCORE`) 수치 변경
  - 캐릭터 추가/삭제, 이름·태그 변경
  - 컷씬(`CUTSCENES`)·화캉스 변기(`TOILET`)·콤보 점수 공식 수정
  - 테마 토글, localStorage 키, 기존 키 바인딩(`KEY_MAP`) 수정
- **판단 기준**: "이 변경이 없으면 SPEC 스킬이 발동·해제·렌더되지 못하는가?" → YES면 허용. 외적 재디자인·사이드 이펙트 확장은 금지.

---

## 변경 범위

### pages/game.html 변경사항

1. **스킬 설명 오버레이 추가** — `overlayCharacter`와 `overlayCutscene` 사이에 삽입:
```html
<div class="game-overlay is-hidden" id="overlaySkill">
  <div class="game-overlay__panel game-overlay__panel--skill" role="dialog" aria-labelledby="skillTitle" aria-describedby="skillDesc">
    <h2 class="game-overlay__title" id="skillTitle">특수 스킬</h2>
    <div class="game-skill-card" id="skillCard">
      <!-- JS가 채움: 아바타 canvas + 이름 + 스킬명 + 설명 + 쿨다운 + 키 안내 -->
    </div>
    <p class="game-overlay__hint" id="skillKeyHint">
      <span class="game-controls__key">Shift</span> · 모바일: 십자키 중앙 버튼
    </p>
    <div class="game-cta">
      <button class="game-btn game-btn--ghost" type="button" id="btnSkillBack">← 캐릭터 다시</button>
      <button class="game-btn" type="button" id="btnSkillStart">시작</button>
    </div>
  </div>
</div>
```

2. **인게임 HUD 스킬 슬롯 추가** — 기존 `.game-hud` 내부 Best 슬롯 다음:
```html
<div class="game-hud__slot game-hud__slot--skill" id="hudSkillSlot">
  <span class="game-hud__label">Skill</span>
  <span class="game-hud__skill" id="hudSkill" aria-live="polite">
    <span class="game-hud__skill-ring" aria-hidden="true"></span>
    <span class="game-hud__skill-label" id="hudSkillLabel">—</span>
  </span>
</div>
```

3. **모바일 중앙 스킬 버튼 추가** — `.game-keypad__dpad` 내부, `data-dir` 4버튼 뒤:
```html
<button class="game-keypad__btn game-keypad__skill"
        type="button"
        id="keypadSkill"
        aria-label="스킬 사용">
  <span class="game-keypad__skill-label" aria-hidden="true">SK</span>
</button>
```
grid 중앙(`grid-column: 2; grid-row: 2;`)에 위치.

4. **컨트롤 힌트 업데이트** — 기존 `.game-controls` 끝에 추가:
```html
<span>스킬 <span class="game-controls__key">Shift</span></span>
```

### assets/css/game.css 변경사항

> **주의**: 스킬 관련 스타일은 `game.css`에 추가한다 (게임 전용 파일). `style.css`는 건드리지 않음. 만약 game.css가 없다면 기존 게임 CSS 위치에 추가.

1. **스킬 악센트 컬러** — `.game-overlay__panel--skill` 및 `.game-keypad__skill`에 `data-char` 속성으로 스코프 변수:
   - kim: `#d4a49c` (브랜드 라이트 — 기본)
   - jung: `#b8a87a` (산·흙 웜 골드)
   - geon: `#9ab5c4` (책·잉크 쿨 블루그레이)
   - im: `#c9a8d4` (공부·집중 소프트 라벤더)
   - lee: `#e8c588` (여행·햇살 웜 옐로우)
   - 공통 글로우: `--skill-accent-glow: color-mix(in srgb, var(--skill-accent) 30%, transparent)` (폴백 `var(--brand-20)`)

2. **`.game-overlay__panel--skill`** — 기존 `.game-overlay__panel--character` 레이아웃과 동일 폭·패딩:
```css
.game-overlay__panel--skill {
  max-width: 520px;
  text-align: center;
  & .game-skill-card { /* glassmorphism + border */ }
  & .game-skill-card__avatar { /* 64px, drawCharacterCardAvatar 재사용 */ }
  & .game-skill-card__skill-name { color: var(--skill-accent); text-shadow: 0 0 12px var(--skill-accent-glow); }
  & .game-skill-card__desc { color: var(--text-muted); }
}
```
카드 진입 `translateY(8px)` → `0` 페이드인, reduced-motion에서 즉시.

3. **`.game-hud__slot--skill`** — 원형 쿨다운 게이지 (`conic-gradient(var(--brand) calc(var(--skill-prog) * 360deg), var(--brand-08) 0)`), 28×28px. 상태 클래스: `.is-skill-ready`(풀차+브레싱), `.is-skill-cooling`(회색+부분), `.is-skill-flash`(0.4s 플래시).

4. **`.game-keypad__skill`** — 중앙 원형 버튼:
```css
.game-keypad__skill {
  grid-column: 2; grid-row: 2;
  width: 72px; height: 72px; border-radius: 50%;
  border: 1px solid var(--skill-accent, var(--brand-40));
  background: var(--bg-card);
  color: var(--skill-accent, var(--brand-light));
  font-weight: 800;
  &.is-skill-cooling { opacity: 0.45; color: var(--text-dim); }
  &.is-skill-ready { box-shadow: 0 0 18px var(--skill-accent-glow); }
}
@media (max-width: 380px) {
  .game-keypad__skill { width: 60px; height: 60px; font-size: 15px; }
}
```
터치 타겟 72/60px (둘 다 48px 이상).

5. **반응형** — `@media (max-width: 520px)`에 패널 폭/패딩 축소.

6. **접근성** — `prefers-reduced-motion: reduce`에서 브레싱/플래시/카드 진입 transition 비활성.

### assets/js/game.js 변경사항

1. **스킬 상수**:
```js
const SKILLS = {
  kim:  { name: '응급 회피',    desc: '잠깐 무적 상태가 되어 F를 흘려보낸다.',            durationMs: 1000, cooldownMs: 18000, abbr: '회피' },
  jung: { name: '곡괭이 돌진',  desc: '바라보는 방향으로 3타일 돌진하며 F 1개를 분쇄한다.', durationMs: 260,  cooldownMs: 22000, abbr: '돌진' },
  geon: { name: '북클럽 소집',  desc: '주변 6타일 안의 음표를 한번에 끌어와 수집한다.',      durationMs: 0,    cooldownMs: 20000, abbr: '소집' },
  im:   { name: '벼락치기',    desc: '2초간 F와 수간호사의 속도를 40% 느려지게 한다.',      durationMs: 2000, cooldownMs: 25000, abbr: '집중' },
  lee:  { name: '워프',        desc: '가장 먼 빈 타일로 순간 이동하고 0.5초 착지 무적.',     durationMs: 500,  cooldownMs: 22000, abbr: '워프' }
};
const IM_SLOW_FACTOR = 0.6;
const JUNG_DASH_TILES = 3;
const JUNG_DASH_PX = JUNG_DASH_TILES * TILE;
const JUNG_BREAK_RADIUS = 18;
const GEON_MAGNET_RADIUS = 6 * TILE;
```

2. **state 확장**:
```js
skill: { readyAt: 0, activeUntil: 0, lastUsedAt: 0, flashUntil: 0 }
```
`state.player`에 `invincibleUntil: 0` 추가.

3. **DOM 참조 추가**: `overlaySkill`, `skillCard`, `btnSkillBack`, `btnSkillStart`, `hudSkill`, `hudSkillLabel`, `hudSkillSlot`, `keypadSkillBtn`.

4. **`renderSkillOverlay()`** — `skillCard`를 removeChild로 비우고 DOM API로 재구성 (innerHTML 금지). canvas + `drawCharacterCardAvatar(canvas, state.characterId)` 재사용. panel에 `data-char="${state.characterId}"` 설정.

5. **플로우 전환** — `btnCharacterConfirm` 핸들러 수정:
```js
btnCharacterConfirm.addEventListener('click', () => {
  saveCharacter();
  applyNurseNameToDom();
  if (overlayCharacter) overlayCharacter.classList.add('is-hidden');
  if (overlaySkill) {
    renderSkillOverlay();
    overlaySkill.classList.remove('is-hidden');
    if (btnSkillStart) btnSkillStart.focus({ preventScroll: true });
  } else {
    startGame();
  }
});
```
`btnSkillStart` → startGame / `btnSkillBack` → 캐릭터 오버레이 복귀 / Esc → Back.

6. **`isAnyOverlayOpen()` 확장** — `overlaySkill` 포함.

7. **`startGame()` 초기화 추가**:
```js
state.skill.readyAt = performance.now();
state.skill.activeUntil = 0;
state.skill.lastUsedAt = 0;
state.skill.flashUntil = 0;
state.player.invincibleUntil = 0;
updateSkillHud(performance.now());
```

8. **키 바인딩** — keydown 핸들러:
```js
if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight') && !e.repeat) {
  if (isAnyOverlayOpen() || !state.running) return;
  e.preventDefault();
  tryActivateSkill();
}
```

9. **모바일 스킬 버튼 바인딩** — `initKeypad()` 끝에 pointerdown으로 `tryActivateSkill()` 호출.

10. **`tryActivateSkill()`**:
```js
function tryActivateSkill() {
  const now = performance.now();
  if (now < state.skill.readyAt) return;
  const def = SKILLS[state.characterId] || SKILLS.kim;
  const fired = executeSkill(state.characterId, now);
  if (!fired) return;
  state.skill.lastUsedAt = now;
  state.skill.readyAt = now + def.cooldownMs;
  state.skill.activeUntil = now + def.durationMs;
  state.skill.flashUntil = now + 400;
  playTone(660, 0.08);
  setTimeout(() => playTone(880, 0.1), 70);
  if (!reducedMotion) spawnParticles(state.player.x + 7, state.player.y + 7, 12);
  updateSkillHud(now);
}
```

11. **`executeSkill(id, now)`** — 실패 시 false 반환:
- **kim**: `invincibleUntil = now + 1000` → true
- **jung**: player.dir 벡터, `JUNG_DASH_PX`를 TILE/2 간격으로 쪼개 `isWallAt` 체크하며 전진. 경로 중 F 가장 가까운 1개가 `< JUNG_BREAK_RADIUS`면 제거 + 파티클. `invincibleUntil = now + 260` → true
- **geon**: 플레이어 중심 거리 ≤ `GEON_MAGNET_RADIUS`인 음표 수집 — 기존 음표 수집 공식(combo++, gain, hudScore, updateComboHud) 재실행. 사운드는 마지막 1회만, 파티클 각 위치 4개. 수집 0개면 false (발동 실패).
- **im**: `activeUntil = now + 2000` → true
- **lee**: 맵 전 칸 중 `m[r][c]===0`이고 수간호사/이교수로부터 `SPAWN_SAFE_DIST` 이상인 칸들 중 플레이어로부터 맨해튼 거리 최대 칸. `player.x/y = 타일좌상단 + 3`. `invincibleUntil = now + 500`. 파티클 출발·도착 2연. → true

12. **임간호 슬로우 적용** — `update()` 내:
```js
const imSlow = (state.characterId === 'im' && performance.now() < state.skill.activeUntil) ? IM_SLOW_FACTOR : 1;
```
F 이동 `dt * imSlow`, 청진기 `dt * imSlow`, `updateNurseChief(dt * imSlow, now)`, `updateProfessor(dt * imSlow, now)`. **플레이어 속도는 원본 dt 유지**.

13. **무적 판정** — F/수간호사/이교수/청진기 충돌 블록 진입 직후:
```js
if (performance.now() < state.player.invincibleUntil) return; // 블록 스킵
```

14. **`updateSkillHud(now)`**:
- `hudSkillLabel.textContent = def.abbr`
- `prog = 1 - Math.max(0, Math.min(1, (state.skill.readyAt - now) / def.cooldownMs))`
- `hudSkill.style.setProperty('--skill-prog', String(prog))`
- 상태 클래스 토글 (`is-skill-ready/cooling/flash`) — HUD와 keypadSkillBtn 동시.
- 매 프레임 호출 (update 말미).

15. **`endGame()` 정리** — skill 필드 초기화 + HUD 클래스 제거.

16. **`clearDpadPressed()`에 keypadSkillBtn is-pressed 제거 추가**.

17. **테마 토글 시** — `overlaySkill`이 열려 있으면 `renderSkillOverlay()` 재호출하여 아바타 재렌더.

18. **조이콘 매핑** — 기존 매핑이 확인되면 남는 버튼 하나 할당, 없으면 생략.

---

## 밸런스 (게임 45초 기준)

| 캐릭터 | CD | 평균 사용 | 강도 | 리스크 |
|---|---|---|---|---|
| kim | 18s | 2~3회 | 중 | 점수 이득 없음 |
| jung | 22s | 2회 | 상 | F 1개 확정 분쇄 but 짧은 거리 |
| geon | 20s | 2회 | 상 | 음표 0개면 실패(쿨다운 미소모) |
| im | 25s | 1~2회 | 상 | 광역 디버프 → CD 최장 |
| lee | 22s | 2회 | 중상 | 불확정 워프 |

기존 F 즉사 룰·TARGET_SCORE 불변이므로 난이도 곡선 유지.

---

## 수락 기준

1. 5개 캐릭터 각각 의도한 스킬이 작동한다.
2. 쿨다운 동작: 연타 방지, 18~25s 이후 재사용 가능.
3. 오버레이 플로우: 난이도 → 캐릭터 → **스킬 설명** → 게임. 뒤로가기 왕복 가능.
4. 모바일 중앙 버튼으로 스킬 사용 가능 (터치 타겟 48px+).
5. 데스크톱 Shift/좌우 모두 스킬 사용 가능.
6. HUD 쿨다운 게이지 시각 반영.
7. **기존 게임플레이 전부 동일**: 이동/F 회피/음표 수집/콤보/변기/컷씬/엔딩/테마 토글.
8. `prefers-reduced-motion`에서 애니메이션 비활성.
9. XSS 없음: `innerHTML`에 동적 주입 금지, 모두 `textContent`/createElement.

---

## 주의

- **범위 위반 방지**: 스프라이트·맵·AI·F 스폰·콤보 공식·난이도 수치 수정 금지.
- **시그니처 보존**: `updateNurseChief`/`updateProfessor` 본체 불변, 호출부에서 `dt * imSlow`만 스케일.
- **팬텀 입력**: `clearDpadPressed`에 스킬 버튼 포함.
- **보안**: `skillCard` 렌더는 `createElement` + `textContent`만 사용.
- **파일 경로**: `pages/game.html`, `assets/css/game.css` (없으면 기존 게임 CSS 위치), `assets/js/game.js`.
