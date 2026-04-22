# 자체 점검

전략: Case A — 초회 구현 (QA_REPORT 없음)

## SPEC 기능 체크

- [x] **스킬 상수 추가** `SKILLS` 5종(kim/jung/geon/im/lee) + IM_SLOW_FACTOR/JUNG_DASH_*/GEON_MAGNET_RADIUS — game.js 상단 SPAWN_SAFE_DIST 아래.
- [x] **state 확장** `state.skill = { readyAt, activeUntil, lastUsedAt, flashUntil }` + `state.player.invincibleUntil` 추가.
- [x] **DOM 참조** `overlaySkill`, `skillCard`, `btnSkillBack`, `btnSkillStart`, `hudSkill`, `hudSkillLabel`, `hudSkillSlot`, `keypadSkillBtn` 선언.
- [x] **스킬 오버레이 HTML** `overlayCharacter` 뒤 `overlayCutscene` 앞에 삽입. 접근성 role/aria 부착.
- [x] **HUD 스킬 슬롯 HTML** Best 다음에 `.game-hud__slot--skill` 추가 (aria-live="polite").
- [x] **모바일 중앙 스킬 버튼 HTML** `.game-keypad__dpad` 안 5번째 버튼으로 `grid-column:2; grid-row:2`.
- [x] **컨트롤 힌트** `.game-controls`에 Shift 안내 추가.
- [x] **스킬 악센트 컬러** `.game-overlay__panel--skill[data-char="..."]` + HUD/키패드에도 동일 data-char 스코프로 `--skill-accent` 주입. 폴백: `--brand-light` + `--brand-20`.
- [x] **스킬 카드 스타일** glassmorphism + 악센트 보더/글로우, 64×80 아바타, 악센트 스킬명. `translateY(8px)→0` 페이드인.
- [x] **HUD 쿨다운 게이지** `conic-gradient(var(--skill-accent) calc(var(--skill-prog) * 360deg), var(--brand-08) 0)` 28×28. 상태 클래스 `is-skill-ready`(breath), `is-skill-cooling`(dim), `is-skill-flash`(0.4s scale+bright).
- [x] **모바일 중앙 스킬 버튼 스타일** 72×72 (380px 이하 60×60), 악센트 보더, breath 글로우 ready 시, 쿨다운 opacity 0.45.
- [x] **반응형 520px** 스킬 오버레이 패널 max-width 340px / 패딩 축소 / 아바타 폰트 축소 + HUD 링 24×24.
- [x] **prefers-reduced-motion** 카드 진입 animation none + breath/flash none + keypad transition none.
- [x] **renderSkillOverlay()** removeChild 루프 + createElement/textContent만 사용. `drawCharacterCardAvatar(canvas, state.characterId)` 재사용. 패널/HUD/키패드에 `data-char` 주입.
- [x] **플로우 전환** `btnCharacterConfirm` 핸들러에서 overlaySkill이 있으면 render+표시+btnSkillStart 포커스.
- [x] **btnSkillStart / btnSkillBack** 시작(→startGame) / 뒤로(→overlayCharacter 복귀 + active card focus).
- [x] **Esc 키** 스킬 오버레이에서 Back과 동일 동작.
- [x] **isAnyOverlayOpen()** `overlaySkill` 포함.
- [x] **startGame 초기화** `state.skill.{readyAt=now, activeUntil=0, lastUsedAt=0, flashUntil=0}`, `player.invincibleUntil=0`, `updateSkillHud(now)`.
- [x] **Shift 키 바인딩** 별도 keydown 리스너. `e.repeat` 무시, 오버레이/non-running 가드 + preventDefault + `tryActivateSkill()`.
- [x] **모바일 스킬 버튼 바인딩** `initKeypad()` 내부 pointerdown — 오버레이/non-running 가드 + 포인터 캡처 + is-pressed 토글.
- [x] **tryActivateSkill()** 쿨다운 체크 → executeSkill → 성공 시 readyAt/activeUntil/flashUntil 갱신, 사운드 2음, 파티클 12개, updateSkillHud 호출.
- [x] **executeSkill(id, now)**:
  - **kim**: `invincibleUntil = now + 1000`, return true
  - **jung**: 현재 dir 기준 TILE/2 간격 전진, `isWallAt` 체크, 경로 중 최근접 F 1개 (d < JUNG_BREAK_RADIUS=18) 제거 + 파티클, `invincibleUntil = now + 260`
  - **geon**: 플레이어 중심 거리 ≤ `GEON_MAGNET_RADIUS`(6×TILE) 음표 전원 수집 — 기존 콤보/gain/score/hud 공식 재실행, 사운드 1회, 각 위치 파티클 4. 수집 0 → false
  - **im**: activeUntil만 세팅(tryActivateSkill이 set), update()에서 imSlow로 반영, return true
  - **lee**: 전체 빈 타일 중 NPC/이교수로부터 SPAWN_SAFE_DIST 이상 + 플레이어 맨해튼 거리 최대 타일 선택, `x/y = 타일*TILE + 3`, `invincibleUntil = now + 500`, 출발/도착 파티클 2연
- [x] **임간호 슬로우 적용** `update()`에서 `imSlow = (characterId==='im' && now < activeUntil) ? 0.6 : 1`. F/청진기/`updateNurseChief`/`updateProfessor`에 `dtSlow = dt * imSlow` 전달. 플레이어 속도(pSpeed * dt) 원본 유지.
- [x] **무적 판정** F/수간호사/이교수/청진기 충돌 블록에 `now >= p.invincibleUntil` 가드 (블록 스킵).
- [x] **updateSkillHud(now)** abbr 라벨 + conic-gradient 진행률 + ready/cooling/flash 클래스 동기화. HUD와 keypadSkillBtn 동시. 매 프레임 호출 (update 말미).
- [x] **endGame 정리** skill 필드 0 + invincibleUntil 0 + HUD/keypad 클래스 제거.
- [x] **clearDpadPressed** keypadSkillBtn.is-pressed 제거 추가.
- [x] **테마 토글** overlaySkill 열려 있으면 `renderSkillOverlay()` 재호출 (아바타/악센트 재렌더).
- [x] **조이콘 매핑**: 현재 코드에 조이콘/gamepad 매핑 로직이 확인되지 않아 SPEC 지침대로 생략.

## 패턴 준수 확인

- **BEM 네이밍**: 준수 — `.game-overlay__panel--skill`, `.game-skill-card__{avatar,name,skill-name,desc,cooldown}`, `.game-hud__{skill,skill-ring,skill-label}`, `.game-keypad__skill`, `.game-hud__slot--skill`.
- **CSS 변수 사용**: 준수 — `--skill-accent` / `--skill-accent-glow` 스코프 변수로 팔레트 통제. 하드코딩은 5 팔레트 상수(kim/jung/geon/im/lee)에 한정 — SPEC이 값으로 명시한 캐릭터 악센트 컬러이므로 허용.
- **CSS 네이티브 중첩**: 준수 — `.game-keypad__skill` 내부 `&.is-skill-*`, `&:active`, `&:focus-visible` 등 `&` 문법만 사용. SCSS 문법 없음.
- **반응형 520px**: 대응 — 패널/아바타/링/폰트 축소.
- **reduced-motion**: 대응 — 카드 진입 애니메이션 / breath / flash / keypad transition 비활성.
- **esc()/safeUrl()**: 외부 데이터 미삽입 — SKILLS/CHARACTERS는 내부 정적 상수. `textContent`/`createElement`만 사용해 XSS 안전.
- **가드 클래스**: `if (!skillCard || !overlaySkill) return;`, `if (!btnSkillStart/btnSkillBack) {...}` 분기.
- **DOMContentLoaded 등록**: game.js는 IIFE 즉시 실행 패턴이므로 DOMContentLoaded 미사용은 기존 관례 준수 (main.js 규칙과 별개 파일).
- **-webkit-backdrop-filter**: 함께 작성 — `.game-skill-card`, `.game-keypad__skill`.
- **파일 간 정합성**: HTML `id` → JS getElementById, CSS 클래스 네이밍이 HTML/JS와 일치 확인.

## 범위 위반 방지 체크

- 스프라이트/팔레트/`nurseSprite`/`drawCharacterCardAvatar`: 수정 없음 (읽기/재사용만).
- `buildMap`: 수정 없음.
- 수간호사/이교수 AI (`updateNurseChief`/`updateProfessor` 본체): 수정 없음 — 호출부에서 `dtSlow` 스케일만 전달.
- `spawnObstacle`/`spawnObstacleFromChief`: 수정 없음.
- `DIFFICULTY` / `TARGET_SCORE`: 수정 없음.
- `CHARACTERS` 추가/삭제/이름 변경: 없음.
- `CUTSCENES` / `TOILET` / 콤보 점수 공식: 수정 없음 (geon 스킬은 기존 공식을 그대로 재실행).
- 테마 토글 / localStorage 키 / `KEY_MAP`: 기존 항목 불변 (Shift는 별도 keydown 리스너로 추가).

## 필수 연동 변경 (SPEC 외 수정)

- `themeBtn` 클릭 리스너에 스킬 오버레이 재렌더 로직 한 줄 추가 — SPEC 17번 지시에 따른 필수 연동.
- `selectCharacterCard` 함수 내 `updateSkillHud(now)` 호출 — 캐릭터 변경 시 HUD 악센트/abbr 즉시 반영. 이 호출이 없으면 스킬 오버레이 진입 전까지 HUD가 이전 캐릭터 상태로 남는 사이드 이펙트가 발생해 "필수 연동"으로 판단.
- 초기화 블록 `updateSkillHud(performance.now())` 1회 호출 — 페이지 로드 직후 HUD 라벨을 "회피" 등으로 초기 표시.
