# 김간호 게임 — 성공 시 실제 작곡 링크 & 수간호사 직접 충돌 즉사

## 개요
김간호가 작곡에 성공(점수 >= TARGET_SCORE)한 경우, 종료 오버레이에 "HG가 실습때 만든 노래 들으러가기" 외부 링크 버튼을 노출하여 플레이의 감정적 보상을 실제 결과물(YouTube 트랙)로 연결한다. 동시에 지금까지 투척된 F에만 피격 판정이 있던 것을 확장하여, 플레이어가 수간호사(head nurse) 본체와 직접 접촉해도 즉시 실패 처리한다.

## 변경 유형
기능 (로직 동작 변경 2건 + 소폭의 조건부 UI 추가)

## 디자인 언어 & 의도
게임의 서사 "김간호는 몰래 작곡한다"를 완성시키는 마지막 퍼즐 — 성공 엔딩에서 실제 HG가 실습 기간에 만든 곡으로 이어지는 "실존하는 보상"이 등장하면, 3분짜리 픽셀 게임이 포트폴리오 본체로 자연스럽게 회수된다. 수간호사 본체 충돌 즉사 규칙은 현재 "F만 피하면 된다"는 한쪽으로 치우친 회피 부담을, "수간호사 경로 자체를 읽어야 한다"는 공간 긴장으로 확장하여, 순찰 NPC가 단순 투척기가 아닌 실제 위협으로 승격된다.

## Sprint 범위 계약
Generator가 SPEC 외 변경을 하려 할 때의 판단 기준:
- **허용**: 종료 오버레이 CTA 레이아웃 재조정(4버튼 수용), endGame의 success 변수 재활용, 수간호사-플레이어 AABB 충돌 분기 추가에 필요한 최소 연동
- **금지**: 새 난이도 추가, 새 사운드 추가, 새 파티클/이펙트 추가, 수간호사 스프라이트 재디자인, 기존 F 투척 로직/패트롤 경로 변경, 점수 기준/시간 기준 재조정, 새 best 기록 키 추가
- **판단 기준**: "이 변경이 없으면 성공 시 링크 노출 또는 수간호사 직접충돌 즉사가 제대로 동작하지 않는가?" → YES면 허용, NO면 금지

---

## 현재 구조 분석 (Generator가 이해할 출발점)

### 성공/실패 판정 흐름 (game.js `endGame()`, L886~958)
1. `state.timeLeft <= 0` 또는 F 피격 시 `state.gameoverReason`을 `'time'` / `'hit'`으로 지정하고 `endGame()` 호출.
2. `endGame()`에서 `target = TARGET_SCORE[state.difficulty]` (easy:40, normal:30, hard:30)와 `state.score`를 비교.
3. 분기:
   - `hitEnd && !success` → 제목 "수간호사에게 걸렸어요!" + fail 스타일
   - `success` → 제목 "노래를 무사히 만들었어요!" + 성공 톤 (`playTone(988, 0.22)`)
   - 그 외 (시간초과 + 미달) → "수간호사에게 붙잡혔어요…" + fail 스타일
4. 통계(`statMaxCombo`, `statHits`, `statAccuracy`), 점수, newRecord 뱃지 갱신 후 `overlayEnd.classList.remove('is-hidden')`.

→ 본 SPEC은 이 **`success` 분기** 안에서만 링크 버튼을 노출하도록 요구한다.

### 수간호사(head nurse) 스프라이트 현재 상태
- **스프라이트 드로잉**: `drawNurseChief(x, y, dir, frame, throwArm)` (L551) — 16×20 픽셀 스프라이트를 SCALE=2로 렌더. 렌더 앵커는 `ox = x - 8, oy = y - 24`.
- **데이터 모델**: `state.nurseChief = { x, y, dir, frame, patrolPath, patrolIdx, throwTimer, telegraphUntil, throwArmUntil, active, speed }` (L613~625).
- **이동**: `updateNurseChief(dt, now)` (L1111) — 난이도별 `patrolPath` 포인트를 `chief.speed` (easy:40 / normal:60 / hard:80 px/s)로 선형 이동. 도달 시 다음 인덱스로 순환.
- **현재 플레이어 상호작용**: 수간호사는 **오직 F를 투척**(`spawnObstacleFromChief()`)만 하고, 플레이어와 직접 겹쳐도 **아무런 판정도 일어나지 않는다**. 즉 현재 수간호사 본체는 비충돌 오브젝트다. (F 투사체는 L1374 블록에서 별도 즉사 판정됨)

→ 본 SPEC은 수간호사 본체에 **새로운 AABB 충돌 분기**를 추가하여, F 충돌과 동등한 "즉시 실패"로 처리하게 한다.

### 종료 오버레이 CTA 현재 상태
- game.html L113~117:
  ```html
  <div class="game-cta">
    <button class="game-btn" type="button" id="btnReplay">다시 플레이</button>
    <button class="game-btn game-btn--ghost" type="button" id="btnBackToDifficulty">난이도 다시 선택</button>
    <a class="game-btn game-btn--ghost" href="/">홈으로</a>
  </div>
  ```
- game.css L586~598 (데스크톱 #overlayEnd 스코프)와 L905~916 (모바일 스코프)에서 `.game-cta`를 `display: grid; grid-template-columns: repeat(3, 1fr);`로 3열 고정. "스크롤 없이 fit" 규약이 이미 성립되어 있음(`#overlayEnd { overflow: hidden; padding: 10px; }`, 모바일에서도 `overflow: hidden`).

→ 본 SPEC은 성공 시에만 4번째 버튼이 추가되는 **조건부 4버튼**이므로, 4열 강제 전환보다는 **성공 시 grid를 2x2로 재구성**하여 세로 공간을 추가로 1행만 먹도록 설계한다.

---

## 변경 범위

### pages/game.html 변경사항
1. `#overlayEnd` 내 `.game-cta` 컨테이너에 **정적 숨김 앵커 엘리먼트** 추가(기존 3개 버튼 **맨 앞**에 삽입).
   ```html
   <div class="game-cta">
     <a class="game-btn game-btn--listen is-hidden"
        id="btnListenTrack"
        href="https://www.youtube.com/watch?v=_lIkCnyABVA&list=LL&index=27"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="HG가 실습때 만든 노래 새 탭에서 듣기">
       🎵 HG가 실습때 만든 노래 듣기
     </a>
     <button class="game-btn" type="button" id="btnReplay">다시 플레이</button>
     <button class="game-btn game-btn--ghost" type="button" id="btnBackToDifficulty">난이도 다시 선택</button>
     <a class="game-btn game-btn--ghost" href="/">홈으로</a>
   </div>
   ```
   - 이유: 동적 innerHTML 대신 정적 DOM + `is-hidden` 토글 → XSS 공격면 0.
   - `target="_blank"`에는 **반드시** `rel="noopener noreferrer"` 동반.
   - 삽입 위치를 CTA 그룹 맨 앞으로 두는 이유: 성공 엔딩에서 가장 눈에 띄어야 하는 CTA이기 때문.

### assets/css/game.css 변경사항
1. `.game-btn--listen` modifier 추가 — 성공 CTA임을 시각적으로 강조. CSS 변수만 사용:
   ```css
   .game-btn {
     &--listen {
       background: var(--brand-20);
       border-color: var(--brand-60);
       color: var(--brand-light);
       box-shadow: 0 0 14px var(--brand-14);

       &:hover {
         background: var(--brand-35);
         border-color: var(--brand);
         box-shadow: 0 0 22px var(--brand-20);
       }
     }
   }
   ```
2. `.game-btn.is-hidden { display: none; }` 유틸리티 추가(기존 `.game-overlay.is-hidden`만으로는 커버 불가).
3. **CTA 4버튼 레이아웃 — no-scroll fit 유지**
   - 기본(실패 3버튼): 변경 없음, 기존 3열 그대로.
   - 성공 시: `.game-cta--success` 토글 → 2열 + listen 버튼 전폭:
     ```css
     #overlayEnd .game-overlay__panel--end .game-cta {
       &.game-cta--success {
         grid-template-columns: repeat(2, 1fr);
         grid-auto-rows: auto;
       }
       &.game-cta--success .game-btn--listen {
         grid-column: 1 / -1;
       }
     }
     ```
   - 모바일 스코프(@media max-width:520px)에도 동일 규칙 추가.
   - 결과 레이아웃:
     ```
     [ 🎵 HG가 실습때 만든 노래 듣기  (전폭)  ]
     [ 다시 플레이      ] [ 난이도 다시 선택 ]
     [ 홈으로           ] [  (빈 칸)        ]
     ```
   - Generator는 iPhone SE(375×667)에서 4버튼 성공 상태도 스크롤 없이 표시되는지 확인. 넘치면 성공 상태 한정으로 `gap: 5px→4px` 또는 `stats padding -1px` 정도만 튜닝 허용.

### assets/js/game.js 변경사항

#### A. DOM 참조 추가
```js
const btnListenTrack = document.getElementById('btnListenTrack');
const endCta = overlayEnd ? overlayEnd.querySelector('.game-cta') : null;
```

#### B. `endGame()` 내부 — 성공 분기 확장
기존 `success` 분기에 추가:
```js
if (btnListenTrack) btnListenTrack.classList.remove('is-hidden');
if (endCta) endCta.classList.add('game-cta--success');
```
`endGame()` 초입(매 호출 시 기본은 숨김으로 리셋):
```js
if (btnListenTrack) btnListenTrack.classList.add('is-hidden');
if (endCta) endCta.classList.remove('game-cta--success');
```

#### C. `btnBackToDifficulty` 핸들러 & `startGame()` — 오버레이 닫을 때/시작 시 숨김 리셋
```js
if (btnListenTrack) btnListenTrack.classList.add('is-hidden');
if (endCta) endCta.classList.remove('game-cta--success');
```

#### D. 수간호사 직접 충돌 즉사 — `update(dt, now)` 내 `updateNurseChief` 직후, F 충돌 루프 직전 삽입
```js
if (state.nurseChief.active) {
  const chief = state.nurseChief;
  const CHIEF_HB = 14;
  const cx = chief.x - CHIEF_HB / 2;
  const cy = chief.y - CHIEF_HB / 2;
  if (p.x < cx + CHIEF_HB && p.x + p.w > cx &&
      p.y < cy + CHIEF_HB && p.y + p.h > cy) {
    state.hits += 1;
    state.combo = 0;
    updateComboHud(false);

    playTone(110, 0.25);
    setTimeout(() => playTone(82, 0.35), 100);

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
- 히트박스 14×14 (플레이어와 동일 크기, 발 기준 중앙)
- `return`으로 즉시 프레임 종료
- F 충돌 블록은 절대 수정 금지

---

## 기능 상세

### 기능 1: 성공 시 "HG 실습 작곡 노래 듣기" 외부 링크
- **노출 조건**: endGame 내 `success === true`
- **숨김 조건**: 실패 / hit 사망 / endGame 초입 / startGame / btnBackToDifficulty
- **DOM**: 정적 앵커 + `is-hidden` 토글 방식
- **URL**: `https://www.youtube.com/watch?v=_lIkCnyABVA&list=LL&index=27`
- **접근성**: `aria-label="HG가 실습때 만든 노래 새 탭에서 듣기"`, `rel="noopener noreferrer"`, `target="_blank"`
- **레이블**: `🎵 HG가 실습때 만든 노래 듣기`

### 기능 2: 수간호사 본체 직접 충돌 즉사
- 플레이어 히트박스(14×14)와 수간호사 히트박스(14×14) AABB 겹침 감지
- F 충돌과 동일한 후처리: hits++, combo=0, 저음 2연타, 셰이크+비네트, `gameoverReason='hit'`, endGame(), return
- 엔딩 제목: 기존 `hitEnd && !success` 분기가 "수간호사에게 걸렸어요!" 표시 — 서사 정합
- `active === false`일 땐 체크 스킵

---

## 수용 기준 체크리스트

### 기능 1
- [ ] 점수 >= target 타임오버 → listen 버튼 노출
- [ ] 점수 < target 타임오버 → 미노출
- [ ] F 피격 즉사(점수 미달) → 미노출
- [ ] F 피격이지만 점수 >= target → success 분기 진입으로 **노출**(기존 구조 유지)
- [ ] 버튼 클릭 → 새 탭 열림
- [ ] `rel="noopener noreferrer"` + `target="_blank"` 동시 설정
- [ ] `aria-label` 존재
- [ ] 다시 플레이/난이도 재선택 → 상태 잔존 없음

### 기능 2
- [ ] 수간호사에 겹침 → 즉시 endGame
- [ ] F 피격과 동일 연출 (셰이크, 저음 2연타, 비네트)
- [ ] "수간호사에게 걸렸어요!" 제목
- [ ] `gameoverReason === 'hit'`, `state.hits += 1`
- [ ] 초기 스폰 시 플레이어/수간호사 미겹침 확인
- [ ] reduced-motion에서도 판정은 동작(시각만 생략)

### 레이아웃
- [ ] 데스크톱 성공 4버튼 no-scroll fit
- [ ] 모바일 375×667 성공 4버튼 no-scroll fit
- [ ] Tab 키 첫 포커스 = listen 버튼(시각 순서 일치)

### 보안 & 패턴
- [ ] URL HTML 정적만, innerHTML 사용 0
- [ ] `rel="noopener noreferrer"` 누락 없음
- [ ] 하드코딩 색상 0건, `--brand-*` 재사용
- [ ] BEM modifier 준수 (`.game-btn--listen`, `.game-cta--success`)
- [ ] 네이티브 중첩 `&` 사용
- [ ] TARGET_SCORE, GAME_DURATION 등 기존 상수 미변경

## 주의사항
- **기존 F 충돌 블록 변경 금지** — 수간호사 충돌은 신규 블록으로 F 루프 **앞**에 추가
- **endGame 후 return 필수** — 누락 시 동프레임 F 중복 hit
- **URL은 HTML 정적 기록** — 동적 생성 금지
- **성공 CTA 리셋 3곳**: endGame 초입, startGame, btnBackToDifficulty — 상태 잔존 0
- **수간호사 히트박스 보정**: 렌더 결과 대비 1~4px 내 조정 가능, 과한 조정 금지
- **스크롤 없이 fit 규약(#overlayEnd overflow:hidden) 유지 확인**
