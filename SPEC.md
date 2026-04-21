# SPEC.md

## 기능 변경 제목
게임 난이도 재조정 + 수간호사 시각화 + 프로필 HG 복구 + 즉사/재시작 흐름 개선

## 개요
이 변경은 6가지 요청을 하나의 스프린트로 묶는다. (1) 프로필 "HG" 타이틀이 그라디언트 텍스트 처리로 인해 렌더링되지 않는 문제를 안정된 폴백과 함께 복구하고, (2~6) 게임 `김간호는 음악박사`의 난이도 체감·스토리텔링·실패 처리·재시작 UX를 대대적으로 조정한다. 핵심은 `F = 즉사 장애물`이라는 규칙 변화와 `F를 던지는 주체인 수간호사 캐릭터의 실체화`이다. F가 이제는 하늘에서 떨어지는 오브젝트가 아니라 "수간호사가 실제로 던진 것"으로 보이도록 시각 인과관계를 만든다.

## 변경 유형
**혼합(기능 위주)** — 다수의 로직 변경(성공 기준, 즉사 처리, 재시작 흐름, 수간호사 스폰·투척 로직)과 시각 구현(수간호사 픽셀 스프라이트, 버튼 추가) 및 CSS 한 건(프로필 HG 폴백). 평가 기준은 **기능 변경 평가 기준**을 적용한다.

## 디자인 언어 & 의도
수간호사가 이제 "존재"한다. 맵 가장자리를 순찰하며 플레이어가 있는 방향으로 주기적으로 F를 투척하는 작은 픽셀 안타고니스트로, 게임의 위협이 더 이상 추상적이지 않다. 한 번이라도 F에 닿으면 즉시 게임 종료라는 룰은 긴장감을 극단까지 끌어올리고, 중·상 난이도의 F 속도·빈도 상승은 "그 짧은 45초를 숨죽이며 버티는 미션"의 감각을 만든다. 실패 후 바로 난이도 선택창으로 돌아갈 수 있는 버튼은 반복 플레이의 마찰을 제거해 사이트의 코럴핑크 정체성답게 "다시 한 번 숨을 고르는 공간"의 리듬을 지킨다.

## Sprint 범위 계약
Generator가 SPEC 외 변경을 하려 할 때의 판단 기준:
- **허용**
  - SPEC 기능 구현에 필수적인 최소 연동 변경 (예: 즉사 처리 도입으로 쓸모없어진 `p.stunUntil` 흐름은 남겨두되, 즉사 이후 사용하지 않는 스턴 후 밀어내기 코드가 불필요해지면 내부 분기에서만 생략)
  - 새 텍스트·버튼·스프라이트 추가에 필요한 HTML/CSS/JS 최소 구조
  - 기존 BEM/컬러 변수 체계에 맞춘 새 클래스·변수 추가
  - 수간호사 캐릭터의 시각적 일체감을 위한 색상 변수 추가 (기존 `--brand`, 코럴팔레트 범주 내)
- **금지**
  - SPEC에 없는 독립 기능 추가 (예: 리더보드, 새 난이도, 신규 사운드 모드)
  - 기존 `:root` CSS 변수 값 변경 또는 삭제
  - SPEC에서 언급되지 않은 카드/섹션·홈 스타일 수정
  - SCSS 문법 도입, 새 파일 생성
  - 게임 외 페이지(Velog/GitHub/Brunch/Music/Social) 수정
- **판단 기준**: "이 변경이 없으면 SPEC 6가지 요구사항 중 하나가 불완전하게 동작하는가?" → YES면 허용, NO면 금지.

---

## 변경 범위

### index.html 변경사항
- 수정 없음. (기존 `<h1 class="profile__name">HG</h1>`은 그대로 유지됨)

### pages/game.html 변경사항
- 종료 오버레이(`#overlayEnd`) 내 `.game-cta` 버튼 그룹에 **"난이도 다시 선택"** 버튼을 새로 추가한다.
  - 위치: 기존 `#btnReplay` 바로 오른쪽, `<a class="game-btn game-btn--ghost" href="/">홈으로</a>` 바로 왼쪽.
  - 구조: `<button class="game-btn game-btn--ghost" type="button" id="btnBackToDifficulty">난이도 다시 선택</button>`
  - 기존 3개 버튼 순서: `다시 플레이 | 난이도 다시 선택 | 홈으로`.
- 시작 오버레이 난이도 설명 문구(`#startGoal`의 strong)는 JS가 난이도별 목표값을 주입하므로 HTML은 그대로 둠.
- 시작 오버레이 `.game-overlay__desc` 문구의 "빨간 F를 던진다" 부분은 유지하되, 서사적 정확성을 위해 "**F에 닿으면 즉시 실패**"라는 경고를 한 줄 추가한다.

### assets/css/style.css 변경사항
- **프로필 HG 복구** (파일 내 라인 402 부근 `.hero & .profile__name` 규칙):
  - 현 상태: `background-clip: text; -webkit-text-fill-color: transparent;`만 있어 gradient 클립이 실패하면 텍스트가 아예 보이지 않는다.
  - 조치: 해당 규칙 내부에 **폴백 `color: var(--brand-light);`**을 한 줄 추가한다(gradient 적용 라인 이전에).
  - 그리고 `@supports not (-webkit-background-clip: text)` 가드를 추가해, background-clip을 지원하지 않는 환경에서는 `-webkit-text-fill-color: currentColor;`로 복원되게 한다.
  - `html.light .profile__name` 블록(라인 186 부근)에도 동일 폴백(`color: var(--text);`)을 선두에 추가한다.

### assets/css/game.css 변경사항
- `:root` 내부에 수간호사 캐릭터용 추가 색상 변수:
  - `--nurse-chief-hair: #8a7a8a;` (백발/잿빛)
  - `--nurse-chief-glass: #2a1f25;`
  - `--nurse-chief-uniform: #d4b8a0;`
  - `--nurse-chief-accent: var(--brand);`
  - `--nurse-chief-uniform-shadow: #b89884;`
- **즉사 이펙트 강화**: 새 클래스 `.game-canvas-wrap.is-gameover`: 빨간 비네트 오버레이(`box-shadow: inset 0 0 80px var(--game-danger-20)`) 0.6s 후 종료 오버레이 표시와 동시에 해제.

### assets/js/game.js 변경사항

1. **목표 점수 상수 교체** (라인 34 부근 `TARGET_SCORE`):
   - 기존: `{ easy: 22, normal: 16, hard: 12 }`
   - 신규: `{ easy: 80, normal: 60, hard: 60 }`

2. **난이도 파라미터 재조정** (라인 37 부근 `DIFFICULTY`):

   | 키 | easy | normal (신규) | hard (신규) |
   |---|---|---|---|
   | `notes` | 5 | **5** (4→5) | **4** (3→4) |
   | `noteTtl` | Infinity | **5500** (6000→) | **3500** (4000→) |
   | `obstacles` | 1 | **3** (2→) | **5** (3→) |
   | `obsBaseSpeed` | 60 | **120** (90→) | **170** (120→) |
   | `obsMaxSpeed` | 110 | **210** (160→) | **290** (210→) |
   | `spawnInterval` | [3.5,2.0] | **[1.6,0.6]** | **[1.0,0.35]** |
   | `maxObstacles` | 2 | **6** (4→) | **10** (6→) |
   | `throwBurst` (신규) | 1 | 2 | 3 |

3. **수간호사 캐릭터(NPC) 구현**:
   - `state.nurseChief = { x, y, dir, frameAcc, frame, patrolPath, patrolIdx, throwTimer, telegraphUntil, active }`.
   - 난이도별 패트롤:
     - easy: 느린 좌우 왕복(40 px/s)
     - normal: 대각 이동(60 px/s)
     - hard: 4모서리 순환(80 px/s)
   - F 투척: 타이머 만료 → 0.4s 텔레그래프(`!`) → 수간호사 위치에서 플레이어 방향 벡터로 `throwBurst`만큼 동시 투척 (±15° 랜덤 스프레드)
   - 픽셀 스프라이트: 기존 `nurseSprite`와 차별화 — 백발+안경+베이지 상의

4. **F 즉사 처리** (update 내 장애물 충돌 판정 블록):
   - 기존 스턴+감점 로직 제거
   - 신규:
     ```
     state.hits += 1;
     state.combo = 0;
     playTone(110, 0.25); setTimeout(() => playTone(82, 0.35), 100);
     if (canvasWrap && !reducedMotion) canvasWrap.classList.add('is-shake', 'is-gameover');
     state.gameoverReason = 'hit';
     endGame();
     return;
     ```

5. **엔딩 문구 분기 확장** (`endGame` 내부):
   - `state.gameoverReason` ∈ {`'time'`, `'hit'`}
   - `hit` + 미달: 제목 "수간호사에게 걸렸어요!" / 문구 "F 한 장에 노래가 멈췄다. 김간호는 오늘만큼은 작곡을 포기하고 차트를 정리한다."
   - `time` 분기는 기존 로직 유지

6. **"난이도 다시 선택" 버튼 바인딩**:
   - overlayEnd 숨김 → overlayStart 표시 → 상태 초기화 → 캔버스 프리뷰 재그리기

7. **spawnObstacleFromChief()**:
   - `chief.x/y` 기준으로 플레이어 방향 벡터 생성
   - `throwBurst`만큼 루프, ±15° 스프레드

8. **수간호사 업데이트 루프** (`updateNurseChief(dt, now)`):
   - 패트롤 포인트 간 선형 보간
   - 투척 타이머 만료 → 텔레그래프 400ms → 실제 투척

9. **렌더링 루프에 수간호사 추가**: 플레이어 그리기 이전에 `drawNurseChief()`, 조건부 `drawTelegraph()`.

10. **startGame에서 수간호사 초기화**: 난이도별 `patrolPath` 분기, `state.gameoverReason = null;`.

11. **reduced-motion 대응**: 텔레그래프 깜빡임·팔 올림·비네트 모두 `reducedMotion` 가드.

---

## 기능 상세

### 기능 1: 프로필 "HG" 복구
- `.profile__name`의 gradient 텍스트가 렌더링 실패 시에도 반드시 보이도록 폴백 컬러 추가.
- **구현 위치**: `assets/css/style.css` 라인 402 `.hero & .profile__name` 블록, 라인 186 `html.light .profile__name` 블록.
- `color: var(--brand-light);` 폴백 + `@supports not` 가드.

### 기능 2: 성공 기준 변경 (easy 80 / normal 60 / hard 60)
- `TARGET_SCORE` 상수 교체.
- `updateStartGoal()`이 자동 반영.

### 기능 3: 수간호사 캐릭터 직접 등장 + F 투척 시각화
- `state.nurseChief` 객체, 패트롤 이동, 텔레그래프, `spawnObstacleFromChief()`.
- 16×20 픽셀 스프라이트 (백발+안경+베이지 상의).
- 투척 시 팔 올림 프레임 + 느낌표 텔레그래프 0.4s.

### 기능 4: 중/상 난이도 상승
- normal/hard의 F 속도·빈도·초기 스폰·동시 투척 수 상향. easy는 동일.

### 기능 5: "난이도 다시 선택" 버튼
- `pages/game.html` 종료 오버레이에 버튼 추가.
- 버튼 순서: `다시 플레이 | 난이도 다시 선택 | 홈으로`.
- 클릭 시 overlayStart 재표시 + 상태 초기화 + 프리뷰 재렌더.

### 기능 6: F 즉사 처리
- 충돌 즉시 `endGame()`, `state.gameoverReason = 'hit'`.
- 저음 2연타 + 셰이크 + `is-gameover` 비네트.
- 종료 오버레이 실패 스타일.

---

## 주의사항

### 기존 기능 충돌 가능성
- **스턴 로직 미사용화**: 즉사 도입으로 `p.stunUntil` 관련 코드는 죽은 분기가 된다. 섣불리 삭제하지 말 것 — 렌더 루프에서 참조되므로 남겨두면 영향 없음.
- **콤보 보너스**: 목표 점수가 80/60/60으로 높아져 콤보 유지가 필수가 된다. 즉사 룰과 겹쳐 긴장감 극대화 (의도된 설계).
- **초기 스폰**: `startGame` 내 초기 장애물 배치는 기존 "플레이어 안전지대 밖 랜덤 타일" 유지 권장(수간호사가 "이미 던져놓은 것"으로 해석). 주기 스폰부터는 수간호사 기반.
- **버튼 포커스**: 신규 `#btnBackToDifficulty`는 tab order 자연 처리.

### 삭제/수정해야 할 기존 코드
- update 함수 내 장애물 충돌 블록의 스턴 처리 전체 교체
- update 루프의 주기 스폰 호출을 `spawnObstacleFromChief()` + 텔레그래프 지연으로 재배치

### 접근성/보안
- `#btnBackToDifficulty`는 `type="button"`, 명시적 라벨.
- 텍스트 주입은 `textContent`만 사용.
- `prefers-reduced-motion` 가드 일관 적용.
- 순수 캔버스 렌더링 — XSS 리스크 없음.
- CSS 변수 추가만 허용, 기존 `:root` 값 변경 금지.
- 게임 외 페이지는 HG 폴백 외 어떤 변경도 없음.

---

**관련 파일 절대 경로**:
- `C:\Users\user\Desktop\hyungyugod.github.io\index.html` (수정 없음)
- `C:\Users\user\Desktop\hyungyugod.github.io\assets\css\style.css` (라인 186, 402 부근)
- `C:\Users\user\Desktop\hyungyugod.github.io\assets\js\main.js` (수정 없음)
- `C:\Users\user\Desktop\hyungyugod.github.io\pages\game.html` (종료 오버레이 버튼 추가)
- `C:\Users\user\Desktop\hyungyugod.github.io\assets\css\game.css` (신규 변수/비네트 클래스)
- `C:\Users\user\Desktop\hyungyugod.github.io\assets\js\game.js` (주요 수정 대상)
