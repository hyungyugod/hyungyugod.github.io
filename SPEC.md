# 게임 난이도 재배치 및 신규 적 캐릭터 '이교수' 추가

## 개요
현재 게임의 '상' 난이도가 새로운 '중' 난이도로 격하되고, 진짜 '상' 난이도는 새로운 적 캐릭터 **이교수(Professor Lee)**가 수간호사와 함께 등장하는 듀얼 보스 형태로 재설계된다. 이교수는 청진기 투사체를 던져 플레이어를 2초간 그 자리에 묶어두며, 그 사이 수간호사의 F가 더 위협적으로 다가오게 만들어 "협공 압박"이라는 새로운 게임 경험을 만든다. '하'와 '상'의 음표 목표치는 +10씩 상향되어 진입 곡선과 최종 도전치를 모두 강화한다.

## 변경 유형
**기능** (게임 로직·파라미터 재배치 + 신규 캐릭터 AI/투사체 시스템 + 디버프 상태 머신)

## 디자인 언어 & 의도
'상' 난이도가 단순한 수치 강화가 아닌 **두 명의 권위자에게 협공당하는 서사적 압박**으로 변모한다. 수간호사의 F가 직선적 폭격이라면, 이교수의 청진기는 "정지 → 회피 불가" 라는 정신적 공포를 더해 플레이어가 한순간도 멈출 수 없게 만든다. 픽셀 아트 스타일을 그대로 유지하되, 이교수의 검정 의상과 뽀글 장발이 흰 간호사복의 수간호사와 시각적으로 강한 대조를 이루어 화면에서 두 적의 역할이 즉시 식별되도록 한다.

## Sprint 범위 계약
Generator가 SPEC 외 변경을 하려 할 때의 판단 기준:
- **허용**:
  - 새로운 청진기 투사체 충돌 처리에 필요한 기존 obstacle 충돌 코드의 분기 추가
  - 이교수 추가에 따른 `state` 객체 확장 및 startGame/back-to-difficulty 리셋에 필요한 필드 정리
  - 시작 오버레이 목표 점수(`startGoal`) 표시 갱신 (TARGET_SCORE 변경에 따른 정상 동작 필수)
  - 미리보기 (`renderPreview`) 의 목표/기능 텍스트가 새 난이도와 일관되도록 한 단위만 갱신
- **금지**:
  - 새로운 적 캐릭터(예: 제3의 NPC) 추가
  - 청진기 외 새로운 투사체 타입 추가
  - SPEC에 없는 새로운 컷씬, 효과음, 파티클 시스템 변경
  - 게임 시간(45초), 콤보 시스템, 음표 수집 로직, F 즉사 룰의 변경
  - CSS 글래스모피즘 톤이나 코럴핑크 팔레트와 무관한 신규 비주얼 효과
- **판단 기준**: "이 변경이 없으면 SPEC 기능이 정상 동작하지 않는가?" → YES면 허용, NO면 금지

---

## 변경 범위

### `assets/js/game.js` 변경사항
1. `TARGET_SCORE` 상수 갱신: `easy: 50, normal: 30, hard: 40` (하 +10, 중 유지=구 상값 30, 상 +10)
2. `DIFFICULTY` 객체 재배치: 기존 `hard` 파라미터를 새 `normal`로 이동, 새 `hard`는 더 강화된 신규 파라미터 (아래 표)
3. 새 상수 `PROFESSOR` 도입: 이교수의 속도/투척 주기/청진기 속도/스턴 시간 보관
4. `state.professor` 객체 신규 추가 (수간호사와 동일 구조 + active 토글)
5. `state.stethoscopes` 배열 신규 추가 (청진기 투사체 풀)
6. `state.player.frozenUntil` 필드 신규 추가 (스턴 종료 시각, ms)
7. 신규 함수: `professorSprite(dir, frame, throwArm)`, `getProfessorPalette()`, `drawProfessor(...)`, `initProfessor()`, `updateProfessor(dt, now)`, `spawnStethoscopeFromProfessor()`, `drawStethoscope(x, y, rot)`
8. `startGame()`에서 hard일 때만 `initProfessor()` 호출, 그 외 난이도는 `state.professor.active = false`
9. `update(dt, now)` 내 추가:
   - `state.player.frozenUntil` 체크 → 키 입력 무시 (기존 `stunUntil`과 OR 조건)
   - `state.stethoscopes` 이동 + 벽 충돌 시 소멸 + 플레이어 충돌 시 `frozenUntil = now + 2000` 설정 후 청진기 제거 (즉사 X)
   - 이교수 본체와의 충돌도 처리 (수간호사와 동일하게 즉사)
10. `render(now)` 내 추가:
    - 이교수 active 시 drawProfessor 호출 (수간호사 다음 층)
    - 청진기 배열 순회하며 drawStethoscope (회전 애니메이션)
    - 플레이어가 frozen 상태일 때 발 밑에 정지 인디케이터 (작은 흰 원호 또는 청진기 잔상)
11. `btnBackToDifficulty` 핸들러 내 리셋에 `state.stethoscopes = []`, `state.professor.active = false`, `state.player.frozenUntil = 0` 추가
12. `chiefPaletteCache`와 같은 패턴으로 `professorPaletteCache` 모듈 변수 추가, 테마 토글 시 함께 무효화
13. `renderPreview()`에서 hard 미리보기 시 이교수 스프라이트도 함께 그려 신규 적 존재를 시각적으로 예고

### `pages/game.html` 변경사항
1. `id="startGoal"`의 숫자는 JS의 `updateStartGoal()`이 갱신하므로 HTML 자체 변경 불요. 단, 시작 오버레이 패널에 `<p class="game-overlay__hint">` 한 줄 추가:
   - "**상 난이도**: 이교수의 청진기에 맞으면 2초간 움직일 수 없다."
   - 신규 메커닉의 사전 고지 (접근성/UX 필수)

### `assets/css/game.css` 변경사항
1. `:root` (다크 테마) CSS 변수 신규 추가:
   ```
   --prof-hair: #1a1216;
   --prof-hair-shadow: #0c080a;
   --prof-hair-curl: #2a1e22;
   --prof-coat: #181418;
   --prof-coat-shadow: #0a0608;
   --prof-coat-accent: #3a2e34;
   --prof-glass-frame: #1f1a1f;
   --prof-stethoscope: #c8c8d0;
   --prof-stethoscope-tube: #2a2228;
   --prof-stethoscope-bell: #d8d4dc;
   ```
2. `:root.light` 테마 변형 동일 키 추가 (밝은 환경에서도 식별되도록 살짝 톤업)
3. **새 CSS 클래스 금지** (Canvas 렌더링이므로 CSS는 변수만 추가)

---

## 난이도별 정확한 파라미터 표

| 항목 | 하 (Easy) | 중 (Normal, **구 Hard**) | 상 (Hard, **신규 강화**) |
|---|---|---|---|
| `notes` (동시 음표 수) | 5 | 4 | 4 |
| `noteTtl` (음표 만료 ms) | Infinity | 3500 | 2800 |
| `obstacles` (초기 F) | 1 | 5 | 6 |
| `maxObstacles` (F 상한) | 2 | 10 | 14 |
| `obsBaseSpeed` → `obsMaxSpeed` | 60 → 110 | 170 → 290 | 200 → 340 |
| `baseSpeed` → `maxSpeed` (플레이어) | 140 → 210 | 160 → 250 | 160 → 250 |
| `spawnInterval` (수간호사 투척 주기 sec) | [3.5, 2.0] | [1.0, 0.35] | [0.8, 0.25] |
| `throwBurst` (수간호사 동시 투척) | 1 | 3 | 4 |
| 수간호사 patrol 속도 (px/s) | 40 | 80 | 100 |
| **이교수 등장 여부** | × | × | **○** |
| 이교수 patrol 속도 (px/s) | — | — | 70 |
| 이교수 청진기 투척 주기 (sec) | — | — | [2.5, 1.4] (시간 경과 보간) |
| 청진기 속도 (px/s) | — | — | 220 |
| 청진기 동시 투척 수 | — | — | 1 |
| 청진기 stun 시간 (ms) | — | — | 2000 |
| `map` | 'easy' | 'hard' | 'hard' |
| `TARGET_SCORE` | **50** (40+10) | **30** (변경 없음) | **40** (30+10) |

> **주의**: `map: 'normal'` 케이스는 더 이상 사용되지 않지만 `buildMap()` 내 `kind === 'normal'` 분기는 **그대로 둔다**. Generator는 분기 삭제 금지.

> **수간호사 patrol 갱신**: `initNurseChief()` 내 분기는 그대로 작동하되 hard 분기 속도(80→100)만 조정.

---

## 이교수 스프라이트 디자인 가이드

**픽셀 그리드**: 16×20 (수간호사와 동일 사이즈)

**팔레트 글자 매핑**:
- `.` = 투명
- `S` = 피부 `#f5d5c0`
- `N` = 피부 음영 `#c08878`
- `H` = 검정 뽀글머리 본체 `var(--prof-hair)` = `#1a1216`
- `h` = 머리 음영 `var(--prof-hair-shadow)` = `#0c080a`
- `c` = 뽀글 컬 하이라이트 `var(--prof-hair-curl)` = `#2a1e22`
- `G` = 안경테 `var(--prof-glass-frame)` = `#1f1a1f`
- `g` = 안경 렌즈 안 `#e8c8b8`
- `M` = 입 (얇은 한 줄) `#5a3030`
- `J` = 검정 자켓 본체 `var(--prof-coat)` = `#181418`
- `j` = 자켓 음영 `var(--prof-coat-shadow)` = `#0a0608`
- `A` = 자켓 칼라/V넥 안쪽 `var(--prof-coat-accent)` = `#3a2e34`
- `W` = 흰 셔츠 `#e8e4e8`
- `B` = 검정 구두 `#0a0608`

**기본 자세 (dir='down', frame=0) 도트 패턴 (16칸 폭)**:
```
................   row 0
....HHHHHHHH....   row 1
...HcHHHHHHcH...   row 2
..HcHHHHHHHHcH..   row 3
..HHHSSSSSSHHH..   row 4
..HHSSSSSSSSHH..   row 5
..HhSGGSSGGShH..   row 6
..HhSGgSSgGShH..   row 7
..HhSSNSSNSShH..   row 8
..HhSSSMMSSShH..   row 9
..HhhSNNNNShhH..   row 10
...JJAAWWAAJJ...   row 11
..JJJJAWWAJJJJ..   row 12
..JjjjAWWAjjjJ..   row 13
..JJJJJJJJJJJJ..   row 14
...JJJJJJJJJJ...   row 15
....JJJ..JJJ....   row 16
....JJJ..JJJ....   row 17
....BB....BB....   row 18
....BB....BB....   row 19
```

**핵심 특징**:
1. 머리 폭이 row 3에서 14칸까지 부풀어 "뽀글한" 인상
2. 머리가 row 10까지 어깨로 흘러내림 (긴 머리)
3. 얇은 입 한 줄(`MM`)로 깐깐한 인상
4. V넥 자켓 안쪽 흰 셔츠(`W`)가 살짝 보여 권위적 정장
5. 검정 머리+검정 자켓 = 수간호사(흰옷+백발)와 명확 대비

**방향별 변형**:
- `up`: 뒷머리만 (안경/입 제거)
- `left`/`right`: 안경테/입 위치 좌우 편향

**걷기 프레임**: 수간호사와 동일 — row 18, 19의 `BB` 좌우 교차

**투척 자세 (throwArm=true)**: row 10~11에 검정(J) 소매 한 줄 어깨 위로

---

## 청진기 투사체 스프라이트와 동작

### 스프라이트 (14×8 픽셀, 충돌 박스 12×12)
```
..tt......tt..   t=튜브 검정 var(--prof-stethoscope-tube)
..tt......tt..
..tt......tt..
...tt....tt...
....tttttt....
....tBBBBt....   B=청진기 머리 var(--prof-stethoscope-bell)
....BBBBBB....
.....mmmm.....   m=금속 림 var(--prof-stethoscope)
```

### 회전 애니메이션
- 비행 중 자체 회전: `rotation = (now / 100) % (Math.PI * 2)`
- `ctx.save() → translate → rotate → 픽셀 드로잉 → restore()`
- **reduced-motion**: 회전 비활성

### 이동 동작
- `spawnStethoscopeFromProfessor()` 객체: `{ x, y, dx, dy, born: now }`
- `dx`/`dy`는 발사 시점 플레이어 중심 향한 단위 벡터 × 220 px/s
- 벽/화면 밖 도달 시 소멸 (직선 투사체)
- 동시 최대 4개

### 충돌 처리
- 플레이어 충돌 시:
  1. `state.player.frozenUntil = now + 2000`
  2. 청진기 배열에서 제거 (1회용)
  3. **즉사 X**
  4. `state.combo = 0`, `updateComboHud(false)`
  5. 효과음: `playTone(440, 0.08)` 후 100ms 뒤 `playTone(220, 0.15)`
  6. **`state.hits` 증가시키지 않음**

---

## 2초 정지 효과 구현 방식

### 상태 변수
- `state.player.frozenUntil` (ms 타임스탬프, 기본 0)
- 기존 `state.player.stunUntil`과 별개 필드

### 입력 차단 로직
`update()` 내:
```
const stunned = now < p.stunUntil;
const frozen = now < p.frozenUntil;
const immobile = stunned || frozen;
```
이후 키 입력 분기에서 `immobile` 사용.

### 시각 피드백
1. **플레이어 깜빡임**: stunned 80ms 주기 깜빡임 로직에 frozen OR 추가. 단 frozen은 코럴핑크(`var(--brand)`) 외곽선
2. **발 밑 정지 인디케이터**: 작은 청진기 아이콘(8×4) 발 아래 표시
3. **카운트다운 표시 금지** (HUD 복잡도 회피)

### 컷씬·오버레이 호환
- 게임 종료 시 state 리셋으로 자연 소멸
- back-to-difficulty 시 명시 리셋

### 접근성
- `prefers-reduced-motion`: 회전+깜빡임 비활성, 단 frozen 메커닉 자체는 적용

---

## 기능 상세

### 기능 1: 난이도 파라미터 재배치
- `DIFFICULTY` 객체와 `TARGET_SCORE` 객체 갱신
- `initNurseChief()` 내 hard 분기 속도 80→100

### 기능 2: 음표 목표치 +10 (하/상)
- `TARGET_SCORE.easy: 50`, `TARGET_SCORE.hard: 40` (normal 30 유지)
- `updateStartGoal()` 기존 동작에 의존

### 기능 3: 이교수 NPC (상 난이도 전용)
- `state.professor` 객체 (active 플래그 포함)
- patrol speed 70, 첫 투척 대기 3.0s
- 본체 충돌 시 즉사 (수간호사와 동일)
- easy/normal에서 active=false
- 이교수 텔레그래프(!)는 코럴핑크(`var(--brand)`)로 표시 → 두 적 구분

### 기능 4: 청진기 투사체
- `state.stethoscopes` 배열, 동시 최대 4개
- 벽/화면 밖 도달 시 소멸
- 충돌 시 청진기 사라짐 (관통 X)

### 기능 5: 2초 정지 디버프
- `state.player.frozenUntil` 사용
- 코럴핑크 깜빡임 + 발 밑 청진기 인디케이터

### 기능 6: 시작 오버레이 신규 메커닉 안내
- `pages/game.html` 시작 오버레이에 한 줄 hint 추가

### 기능 7: 미리보기 갱신
- `renderPreview()`의 hard 분기에서 이교수 스프라이트도 표시

---

## 주의사항

### 기존 기능과 충돌
- `state.player.stunUntil`은 dead 필드지만 보존, **별도 frozenUntil 추가**
- `DIFFICULTY.normal` / `buildMap('normal')` / `initNurseChief` normal 분기는 **삭제 금지**

### 삭제/수정해야 할 기존 코드
- `TARGET_SCORE`: 객체 통째 교체
- `DIFFICULTY.normal`의 모든 키 → 기존 `hard`의 키로 덮어쓰기
- `DIFFICULTY.hard`의 모든 키 → 새 강화 값으로 덮어쓰기
- `initNurseChief()` hard 분기 속도 80→100

### 접근성/보안
- 이교수 첫 진입 위치: 플레이어 spawn에서 가장 먼 점 (farthest-first 재사용) — 첫 프레임 즉사 방지
- 이교수와 수간호사 겹침 시 render 순서로 이교수가 위에
- 청진기 회전은 reduced-motion 시 비활성
- localStorage 저장 키 `pixelNurseBest` 그대로 (마이그레이션 불요)
- XSS 무관 (Canvas + 정적 텍스트만)
