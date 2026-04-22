# 자체 점검

## SPEC 기능 체크

### 기능 1: "나는야 모범생" 단발 스킬
- [x] 게임당 1회 제한 — `tryActivateSkill` (game.js:3098)에서 `im && usedOnce` early return, 성공 시 `state.skill.usedOnce = true` + `readyAt = Infinity` (game.js:3103-3108)
- [x] 지속시간 1500ms — `SKILLS.im.durationMs: 1500` (game.js:166)
- [x] HUD에서 사용 완료 시 라벨 `—`, 링 비워짐(prog=0), `is-skill-cooling` 고정 — `updateSkillHud` 최우선 분기 (game.js:3293-3304)
- [x] 모바일 `keypadSkillBtn`도 동일 처리 (`applyUsedOnce`가 양쪽에 적용)
- [x] NaN 경로 차단 — `im && usedOnce` 분기를 `remaining/cd` 계산보다 먼저 배치

### 기능 2: 스킬명/지속시간 데이터 변경
- [x] SKILLS.im 수정 (game.js:166): name `나는야 모범생`, desc 갱신(+"게임당 1회" 명시), durationMs 1500, cooldownMs 0, abbr `모범`
- [x] 스킬 설명 오버레이는 기존 `renderSkillOverlay`가 SKILLS 맵을 그대로 읽으므로 자동 반영

### 기능 3: 박병장 등장 알림창 (일시정지형)
- [x] `#overlayAirforce` DOM 오버레이 추가 (game.html:138-147): `role="dialog"`, `aria-labelledby`, `aria-describedby`, `aria-live="assertive"`
- [x] `game-overlay--cutscene` + `game-overlay--airforce` 복합 클래스로 기존 컷씬 스타일(배경/애니메이션) 상속
- [x] `triggerAirforceEasterEgg`에서 `state.running=false`, `rafId` 취소, `state.keys` 초기화, `clearDpadPressed()` (game.js:2874-2900)
- [x] 제목/본문에 `AIRFORCE.title` / `AIRFORCE.subtitle` 상수 `textContent` 주입 (XSS 무관)
- [x] `#btnAirforceContinue.focus({ preventScroll: true })` 포커스 관리

### 기능 4: 비행기 출격 + 폭탄 낙하 연출
- [x] `onAirforceContinue` (game.js:2906-2936)에서 오버레이 닫고 비행기 스폰 + `pendingBombDrop = now + 300ms` 예약 + `startChiefFlee(now)` + 게임 루프 재개
- [x] `updateAirplane` (game.js:3004-3007)에서 `pendingBombDrop` 도달 시 `dropBomb(now)` 1회만 실행 (`bombDropped` 플래그 가드)
- [x] `dropBomb` (game.js:2943-2971): `.is-bomb-flash` 420ms + 파티클 22개 + `playTone(80, 0.4)` → 120ms 후 `playTone(55, 0.55)` + `.is-shake` 500ms
- [x] CSS `@keyframes gameBombFlash` + `.is-bomb-flash` (game.css:596-605)
- [x] `dt` 폭주 방지로 `state.lastTs = now` 갱신 + `nextSpawnAt` 컷씬 재개 패턴 보정

### 기능 5: 맵 위 F 전멸
- [x] `state.obstacles.filter((o) => o.type === 'A')` — F만 제거, A 보존 (game.js:2945)
- [x] flee 중 수간호사는 투척 불가 (기존 flee 로직 재사용) → 폭탄 낙하 후 신규 F 생성 원천 차단

### 기능 6: 수간호사 복귀 시 F 재시딩
- [x] `updateNurseChief` flee-end 블록 확장 (game.js:2199-2209): 난이도 기본 F 개수 × `respawnCountMultiplier` 까지 부족분 `spawnObstacle()` 호출
- [x] 복귀 효과음 `playTone(220, 0.08)` 추가
- [x] `spawnObstacle`는 플레이어 안전지대(4타일 avoid) + `findEmptyTile` 폴백 내장이라 불공정 즉사 방지

### 기능 7: 접근성 & 반응형
- [x] 신규 오버레이는 기존 `.game-overlay--cutscene` 스타일 체인을 상속해 520px 반응형 자동 대응
- [x] `@media (prefers-reduced-motion: reduce)` `.game-canvas-wrap.is-bomb-flash { animation: none; filter: none; }` (game.css:1667-1671)
- [x] JS 파티클은 `if (!reducedMotion)` 가드 (game.js:2956)
- [x] 수간호사 flee/F 재시딩 같은 게임 로직은 reduced-motion과 무관하게 동일 수행
- [x] `role="dialog"` + `aria-live="assertive"` + `aria-labelledby` + `aria-describedby`

## 범위 준수 확인

- [x] **금지 준수**: 다른 캐릭터(kim/jung/geon/lee) 스킬 밸런스 미변경 — `SKILLS.jung/geon/lee`는 원본 그대로 유지
- [x] **금지 준수**: 수간호사/이교수/석조무사 본체 밸런스(속도·HP·투척 주기) 미변경 — `DIFFICULTY`/`PROFESSOR`/`STONE_GUARD` 상수 그대로
- [x] **금지 준수**: 비행기 비주얼 미변경 — `planeSpeed/planeY/planeW/planeH` 유지, `airplaneSprite`/`drawAirplane` 건드리지 않음
- [x] **금지 준수**: 신규 BGM/아이콘/이미지 에셋 추가 없음
- [x] **금지 준수**: 전역 테마 변수 조정 없음 — `--brand` 등 기존 변수만 재사용
- [x] **허용 변경**: `state.skill.usedOnce` / `state.airplane.pendingBombDrop/bombDropped/pauseOverlayOpen` 필드 추가 (SPEC [B])
- [x] **허용 변경**: 캔버스 상단 AIRFORCE 토스트 렌더 블록 제거 (SPEC [H]) + `AIRFORCE.toast*` 상수 7개 제거
- [x] **허용 변경**: 폭탄 파티클(22개) + 폭발음 2연타 — 기존 `spawnParticles`/`playTone` 재사용
- [x] **필수 연동 변경**: `isAnyOverlayOpen()`에 `overlayAirforce` 포함 — 포함하지 않으면 Shift 키 입력이나 이동 키가 오버레이 중에도 처리되어 시퀀스가 깨짐
- [x] **필수 연동 변경**: `startGame`/`endGame`/난이도 뒤로가기 리셋 블록에 `skill.usedOnce/airplane.*/is-bomb-flash` 정리 로직 추가 — SPEC [E] 명시

## 패턴 준수 확인

- **BEM 네이밍**: `game-overlay--airforce` modifier, `game-overlay__title/text/goal` element — 기존 컷씬 패턴과 일관
- **CSS 변수 사용**: 제목 색상 `var(--brand)` 사용, 하드코딩 색 없음
- **CSS 네이티브 중첩**: 추가한 규칙은 단순 선택자라 중첩 불필요. 기존 중첩은 건드리지 않음
- **반응형 520px**: 기존 `.game-overlay--cutscene` 520px 미디어쿼리(game.css:1499-1520)를 `game-overlay--airforce`가 자동 상속 (복합 클래스 사용)
- **reduced-motion**: CSS `@media (prefers-reduced-motion: reduce)` 블록에 `.is-bomb-flash` 가드 추가 (game.css:1667-1671) + JS에서 `if (!reducedMotion) spawnParticles(...)` 가드
- **esc()/safeUrl()**: 외부 데이터 삽입 없음. 모든 텍스트는 상수 `AIRFORCE.title/subtitle`를 `textContent`로 주입 — XSS 무관
- **가드 클래스**: `onAirforceContinue`에서 `if (!overlay || overlay.classList.contains('is-hidden')) return;`, `triggerAirforceEasterEgg`에서 `if (titleEl) ...` 개별 null 체크
- **DOMContentLoaded 등록**: 기존 IIFE 스타일 유지 — 새 버튼 바인딩도 같은 스코프에 추가 (game.js:2033-2036)
- **-webkit-backdrop-filter**: 신규 규칙에 `backdrop-filter` 미사용이므로 해당 없음
- **파일 간 정합성**: `overlayAirforce`/`airforceTitle`/`airforceText`/`btnAirforceContinue` 4개 ID가 game.html ↔ game.js 일치. `is-bomb-flash` 클래스도 game.js ↔ game.css 일치

## 발견한 엣지케이스 처리

1. **오버레이 닫힘 시 dt 폭주**: `onAirforceContinue`에서 `state.lastTs = performance.now()` 갱신 (game.js:2931) — 기존 컷씬 재개 패턴(`resumeFromCutscene`, game.js:2016-2017)과 동일
2. **F 스폰 타이머 누적**: 오버레이 열려 있는 동안 `state.nextSpawnAt`이 흘러가지만, `onAirforceContinue`에서 `nextSpawnAt = now + intervalSec * 1000`로 보정 (game.js:2933-2934)
3. **이전 라운드 잔존 오버레이**: `startGame`/`endGame`/난이도 뒤로가기 3곳 모두 `overlayAirforce.classList.add('is-hidden')` 명시 안전망 추가
4. **`is-bomb-flash` 잔존 클래스**: `endGame`/`startGame`/`btnBackToDifficulty` 3곳 모두 `canvasWrap.classList.remove('is-bomb-flash')` 추가 — 폭탄 섬광 중 엔딩이 발생해도 다음 라운드로 새지 않음
5. **중복 폭탄 투하 방지**: `bombDropped` 플래그로 `updateAirplane`이 매 프레임 호출되어도 `dropBomb`은 1회만 실행
6. **입력 잔존 방지**: `triggerAirforceEasterEgg`에서 `state.keys = Object.create(null) + clearDpadPressed()` — 관성 이동 차단
7. **매혹 중 A 보존**: `dropBomb`의 filter가 `o.type === 'A'`만 남겨, 임간호 스킬로 전환된 A는 폭발 후에도 플레이어가 수집 가능 (SPEC 기능 5에 명시된 "플레이어 보상")
8. **포커스 관리**: `btn.focus({ preventScroll: true })` — 오버레이 열림 시 모바일/데스크톱 공통으로 버튼에 포커스 이동
9. **`isAnyOverlayOpen` 확장**: 이스터에그 시퀀스 중 Shift 키가 입력되면 `tryActivateSkill` 내부에서도 `isAnyOverlayOpen()` 체크로 차단됨 (game.js:3093)
10. **`f` 타입 캐스팅 없음**: `state.obstacles`의 `type` 필드는 기존 `'F'`/`'A'` 두 값만 가지므로 filter 안전
