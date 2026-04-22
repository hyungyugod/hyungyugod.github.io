# SPEC.md

## 개요
중(normal) 난이도에 수간호사의 조무래기(부하) NPC인 **석조무사**(남학생)를 신규 투입한다. 투사체를 던지지 않고 맵을 단순 이동하며, 플레이어와 접촉하면 즉시 "붙잡힘" 엔딩으로 종료한다. 상(hard) 난이도의 이교수 구현을 기능 골격의 참고 모델로 쓰되, 청진기/텔레그래프/정지 디버프는 제거하고 **순수 이동형 위협**으로 단순화한다.

## 변경 유형
기능 (소량의 디자인 — 신규 16×20 픽셀 스프라이트 + 팔레트 CSS 변수 추가)

## 디자인 언어 & 의도
석조무사는 수간호사 밑에서 심부름하는 **남학생** 조무래기다. 플레이어(학생)와 같은 또래지만 교복 색/디테일을 달리해 "적 진영"임을 즉시 전달한다 — 어두운 남색/짙은 회색 남학생 교복, 짧은 검정 머리, 단호한 눈매로 수간호사 편임을 시각화한다. 움직임은 느리지만 꾸준하게(수간호사보다 느리고, 이교수보다도 느리게) — 플레이어가 "피할 수 있지만 방심하면 잡히는" 중난이도 특유의 긴장감을 만든다. 사운드/비주얼 연출은 수간호사 F 충돌과 동일 처리를 재사용하여 즉사의 무게감을 통일한다.

## Sprint 범위 계약

### 수정 파일
- **`assets/js/game.js`** — 주된 수정 대상
  - `STONE_GUARD` 상수 블록 추가 (PROFESSOR 옆)
  - `state.stoneGuard` 상태 객체 추가 (state.professor 옆)
  - `initStoneGuard()` / `updateStoneGuard(dt, now)` / `drawStoneGuard(x, y, dir, frame)` / `stoneGuardSprite(dir, frame)` / `getStoneGuardPalette()` 함수 추가
  - `startGame`에서 `state.difficulty === 'normal'`일 때만 `initStoneGuard()`, 그 외엔 `state.stoneGuard.active = false`
  - replay 리셋 블록에 `state.stoneGuard.active = false` 추가
  - 메인 루프에서 `updateStoneGuard(dtSlow, now)` 호출
  - 렌더 루프에서 `drawStoneGuard(...)` 호출 (이교수 드로잉 블록 인근)
  - 플레이어-석조무사 AABB 충돌 처리 (수간호사 본체 충돌 로직 복사 패턴)
  - 음표 스폰 안전거리 필터에 `stoneGuardTile` 추가

- **`assets/css/game.css`** — 팔레트 CSS 변수만 추가 (신규 선택자/레이아웃 없음)
  - `:root` 및 `html.light`에 `--stone-guard-*` 변수 세트 추가

### 허용되는 부수 변경
- 음표 스폰 안전 필터에 석조무사 타일 추가 (미추가 시 석조무사 바로 위 스폰으로 불공정 즉사 발생)
- `gameoverReason === 'hit'` 엔딩 텍스트에 석조무사 원인 분기(선택) — 불가하면 기존 "수간호사에게 걸렸어요!" 재사용 허용

### 금지 사항
- easy/hard 밸런스 변경 금지 (`DIFFICULTY.easy/hard`, `TARGET_SCORE`, `PROFESSOR` 불변)
- 기존 수간호사(`nurseChief`) / 이교수(`professor`) / 임간호 "벼락치기" 로직 변경 금지
- 새 파일 생성 금지
- 청진기·투사체·텔레그래프·정지(frozen) 등 원거리 메커닉 추가 금지
- DIFFICULTY.normal의 기존 필드 수정 금지 (석조무사 정보는 별도 `STONE_GUARD` 전역 상수로만 표현)
- CSS 테마 대규모 변경 금지 — 신규 변수 추가만
- `index.html`(게임 외 메인), `assets/js/main.js` 수정 금지 — 게임 전용 변경

### 판단 기준
"이 변경이 없으면 석조무사 기능이 제대로 동작하지 않는가?" → YES면 허용, NO면 금지.

## 변경 범위

### `assets/css/game.css` 변경사항
`:root` 블록에 추가 (남학생 교복 팔레트):
```
--stone-guard-uniform: #2a3550;     /* 남색 교복 상의 */
--stone-guard-uniform-dark: #1a2238; /* 교복 음영 */
--stone-guard-pants: #1f2533;       /* 짙은 회색 바지 */
--stone-guard-skin: #e8c9a6;        /* 피부 */
--stone-guard-hair: #1a1418;        /* 짧은 검정 머리 */
--stone-guard-eye: #2a2228;         /* 눈 */
--stone-guard-shoe: #0f0f12;        /* 검정 구두 */
```
`html.light` 블록에 추가:
```
--stone-guard-uniform: #23304a;
--stone-guard-uniform-dark: #141c30;
--stone-guard-pants: #181e2a;
--stone-guard-skin: #dcb894;
--stone-guard-hair: #0e0a0e;
--stone-guard-eye: #1a141a;
--stone-guard-shoe: #080808;
```

### `assets/js/game.js` 변경사항

1) 팔레트 캐시: `let stoneGuardPaletteCache = null;` 추가 + 테마 토글 핸들러에서 무효화.

2) 상수 블록 (PROFESSOR 아래):
```
const STONE_GUARD = {
  patrolSpeed: 55,
  hitbox: 14
};
```

3) state 추가:
```
stoneGuard: { x:0, y:0, dir:'down', frameAcc:0, frame:0, patrolPath:[], patrolIdx:0, active:false }
```

4) `initStoneGuard()` — initProfessor 패턴 미러링(투척 필드 제외). 4지점 사각 순환 경로, farthest-first로 플레이어 spawn 가장 먼 포인트 선택, 벽 타일이면 인접 빈 셀로 클램프.

5) `updateStoneGuard(dt, now)` — updateProfessor에서 투척 타이머/텔레그래프 블록 전체 제거. 패트롤 이동 + dir 업데이트 + 걷기 프레임(frameAcc > 0.22) + reducedMotion 분기.

6) `stoneGuardSprite(dir, frame)` — 16×20 픽셀. 코드: U(교복) u(교복 음영) P(바지) K(피부) H(머리) E(눈) B(구두). 짧은 검정 머리 + 네모난 얼굴 + 날카로운 눈 + 남색 교복 상의(가슴에 세로 단추 1~2개 음영 라인) + 짙은 회색 바지 + 검정 구두. 수간호사 캡/십자 없음, 이교수 안경/자켓 V자 라펠 없음. 방향별 up/left/right 분기, frame 1/2 발 교차.

7) `getStoneGuardPalette()` — CSS 변수 7개(U/u/P/K/H/E/B) 읽어 캐시.

8) `drawStoneGuard(x, y, dir, frame)` — drawProfessor의 단순 버전.

9) startGame 분기:
```
if (state.difficulty === 'normal') { initStoneGuard(); }
else { state.stoneGuard.active = false; }
```

10) replay 리셋: `state.stoneGuard.active = false;`.

11) 메인 루프: `updateStoneGuard(dtSlow, now);`.

12) 렌더: `if (state.stoneGuard.active) drawStoneGuard(...);`.

13) 플레이어 충돌 (이교수 본체 충돌 다음 삽입):
```
if (state.stoneGuard.active && now >= p.invincibleUntil) {
  const sg = state.stoneGuard;
  const HB = STONE_GUARD.hitbox;
  const cx = sg.x - HB/2, cy = sg.y - HB/2;
  if (p.x < cx+HB && p.x+p.w > cx && p.y < cy+HB && p.y+p.h > cy) {
    state.hits += 1; state.combo = 0; updateComboHud(false);
    playTone(110, 0.25); setTimeout(() => playTone(82, 0.35), 100);
    if (canvasWrap && !reducedMotion) {
      canvasWrap.classList.remove('is-shake');
      void canvasWrap.offsetWidth;
      canvasWrap.classList.add('is-shake', 'is-gameover');
    }
    state.gameoverReason = 'hit';
    endGame();
    return;
  }
}
```

14) 음표 스폰 안전거리에 석조무사 타일 추가.

### 스토리/컷씬 텍스트
- normal intro 텍스트 현행 유지. 수정 금지(범위 최소화).
- renderPreview도 현행 유지.

## 기능 상세

### 기능 1: 난이도 게이팅
normal에서만 스폰. easy/hard는 비활성. startGame 분기 + active 플래그 일괄 가드.

### 기능 2: 순찰 이동 (투척 없음)
4지점 사각 순환 55 px/s. 플레이어 추적 없음. 이교수 이동 로직 재사용, 투척 타이머/텔레그래프 없음.

### 기능 3: 접촉 즉사
14×14 AABB 겹치면 즉시 endGame(`gameoverReason = 'hit'`). 수간호사 F 즉사와 동일 연출. invincibleUntil 존중. 기존 "수간호사에게 걸렸어요!" 엔딩 재사용.

### 기능 4: 픽셀 아트 식별성
남색 교복 + 짧은 검정 머리 + 날카로운 눈 + 검정 구두. 수간호사·이교수·플레이어 학생과 즉시 구분되도록 남색 교복 톤을 유지. 테마 전환 시 팔레트 캐시 무효화.

## 수용 기준
1. easy/hard 시작 시 석조무사 미렌더 + `state.stoneGuard.active === false`.
2. normal 시작 시 석조무사 1명 등장, 패트롤 경로 이동.
3. normal에서 접촉 시 즉시 endGame + 종료 오버레이 + 셰이크/비네트.
4. 투사체 미생성 (`state.stethoscopes`/`state.obstacles`에 추가 금지).
5. 수간호사/이교수/벼락치기/청진기 정지 기존 로직 불변.
6. 테마 전환 시 석조무사 색상 재해석.
7. replay 및 "난이도 다시 선택" 흐름에서 상태 올바르게 초기화.
8. 음표가 석조무사 타일 주변 SPAWN_SAFE_DIST(4) 내 생성 안 됨.
9. prefers-reduced-motion 시 걷기 프레임 고정 + 셰이크 생략.

## 주의사항
- 초기 4지점 중 벽 타일이면 가장 가까운 빈 셀로 클램프.
- endGame 문구는 기존 재사용(범위 최소화).
- reducedMotion 분기 이교수와 동일 패턴.
- 외부 데이터 렌더 없음 — esc/safeUrl 불필요.
- STORAGE_KEY 스키마 불변.
