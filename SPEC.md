# 화캉스 보너스 — 변기 아이템 (저확률) 추가

## 개요
맵에 낮은 확률로 등장하는 변기 모양 아이템을 추가한다. 플레이어가 수집하면 "화캉스 보너스!" 토스트가 잠깐 뜨고, 음표 2개어치 점수(현재 콤보 가산 포함)를 한 번에 얻는다. 12초에 한 번씩 저확률 판정, 맵에 최대 1개만 존재.

## 변경 유형
**기능 (+약간의 디자인)**

## 디자인 언어 & 의도
병동에서 몰래 작곡하던 와중 "화장실=잠깐의 해방"이라는 병맛 유머. 등장 자체가 희소 이벤트라 플레이어가 맵을 훑다가 발견하면 눈이 커지도록. 수집 시 화캉스 밈을 한 줄 토스트로 전달. 기존 음표 흐름을 깨지 않도록 최대 1개·짧은 TTL.

## Sprint 범위 계약
- **허용**:
  - 새 상태 배열 `state.toilets = []` (항목 `{x, y, born, bobSeed}`)
  - `spawnToilet()` 신규 함수 — 기존 `findEmptyTile` 재사용
  - `drawToilet(x, y, bob)` 신규 함수 — 12×12 픽셀 변기(물탱크+시트) 표현
  - 업데이트 루프에 "12초 주기 × 15% 확률" 스폰 시도 + TTL(8초) 만료 정리 + 최대 1개 상한
  - 수집 판정 — 음표 수집과 동일 히트박스 패턴, gain 계산은 "음표 1개분 × 2"로 (콤보 보너스도 반영, 콤보는 +2 증가)
  - "화캉스 보너스!" 토스트 — 기존 HUD 레이어 위 canvas 중앙 상단에 0.9초 표시 (reduced-motion 시에도 정적 표시)
  - 수집 사운드는 기존 `playTone` 재사용 (살짝 높은 음 2연타)
- **금지**:
  - 기존 음표/F/수간호사/이교수 로직 수정
  - 새 난이도 파라미터 키 추가(=기존 DIFFICULTY 스키마 수정)
  - 새 오버레이/모달/컷씬 추가
  - 기존 파일 외 신규 파일 생성
  - 테마 시스템·폰트·색상 변수 변경

## 변경 범위

### pages/game.html
변경 없음.

### assets/css/game.css
변경 없음. (토스트는 canvas에 그리므로 DOM/CSS 불필요.)

### assets/js/game.js

#### 1. 상수 추가 (DIFFICULTY 근처)
```js
const TOILET = {
  spawnInterval: 12,   // sec — 판정 주기
  spawnChance: 0.15,   // 15% — 주기마다 굴림
  ttl: 8000,           // ms — 미수집 시 자동 제거
  bonusMultiplier: 2,  // 음표 2개어치
  toastDuration: 900   // ms — "화캉스 보너스!" 표시 시간
};
```

#### 2. state 확장 (line ≈ 815)
```js
toilets: [],            // {x, y, born, bobSeed}
nextToiletAt: 0,        // 다음 스폰 판정 시각(ms)
toiletToastUntil: 0     // 토스트 만료 시각(ms), 0이면 비표시
```
초기화 지점(startGame, resetRound 등)에서 `state.toilets = []; state.nextToiletAt = now + TOILET.spawnInterval * 1000; state.toiletToastUntil = 0;`

#### 3. spawnToilet() 신규
```js
function spawnToilet() {
  if (state.toilets.length >= 1) return;
  const avoid = state.map ? [playerTile()] : [];
  const tile = findEmptyTile(state.map, Math.random, avoid);
  state.toilets.push({
    x: tile.c * TILE + (TILE - 12) / 2,
    y: tile.r * TILE + (TILE - 12) / 2,
    born: performance.now(),
    bobSeed: Math.random() * Math.PI * 2
  });
}
```

#### 4. drawToilet(x, y, bob) 신규
12×12 픽셀 변기. 간단 구성:
- 하단(시트): 흰색 타원 윤곽, 중앙에 검정 구멍 2×2
- 상단(물탱크): 흰색 사각 + 상단 회색 뚜껑 1px
- 외곽: 살짝 회색 섀도 1px (가독성)
- 포인트 색: 아주 옅은 파랑 하이라이트 1px (물)
- 색상은 라이트/다크 테마에서 모두 보이는 중립(흰 + 연회색 + 연파랑 + 검정)으로 고정

#### 5. 업데이트 루프에 스폰·만료 삽입 (음표 보충 바로 뒤)
```js
// 변기 TTL 만료
state.toilets = state.toilets.filter(t => (now - t.born) < TOILET.ttl);
// 주기 판정
if (now >= state.nextToiletAt) {
  state.nextToiletAt = now + TOILET.spawnInterval * 1000;
  if (Math.random() < TOILET.spawnChance) spawnToilet();
}
```

#### 6. 수집 판정 (음표 수집 루프 바로 뒤)
```js
for (let i = state.toilets.length - 1; i >= 0; i--) {
  const t = state.toilets[i];
  if (p.x < t.x + 12 && p.x + p.w > t.x &&
      p.y < t.y + 12 && p.y + p.h > t.y) {
    state.toilets.splice(i, 1);
    // 음표 2개어치 — 콤보 2 증가, 각 단계의 gain 합산
    let totalGain = 0;
    for (let k = 0; k < TOILET.bonusMultiplier; k++) {
      state.combo += 1;
      if (state.combo > state.maxCombo) state.maxCombo = state.combo;
      state.collected += 1;
      let gain = 1;
      if (state.combo >= 7) gain += 3;
      else if (state.combo >= 5) gain += 2;
      else if (state.combo >= 3) gain += 1;
      totalGain += gain;
    }
    state.score += totalGain;
    hudScore.textContent = String(state.score);
    updateComboHud(true);
    // 사운드 2연타
    const freqIdx = Math.min(state.combo - 1, SCALE_FREQS.length - 1);
    playTone(SCALE_FREQS[freqIdx], 0.09);
    setTimeout(() => playTone(SCALE_FREQS[Math.min(freqIdx + 1, SCALE_FREQS.length - 1)], 0.09), 70);
    // 파티클
    if (!reducedMotion) spawnParticles(t.x + 6, t.y + 6, 16);
    // 토스트
    state.toiletToastUntil = now + TOILET.toastDuration;
  }
}
```

#### 7. 렌더 — 음표 그리기 루프 다음에 변기 + 토스트 추가
```js
for (const t of state.toilets) {
  const bob = reducedMotion ? 0 : Math.sin((now / 220) + t.bobSeed) * 1.2;
  // TTL 말기 깜빡임
  const left = TOILET.ttl - (now - t.born);
  if (left < 1000 && !reducedMotion && Math.floor(now / 120) % 2 === 0) continue;
  drawToilet(t.x, t.y, bob);
}
```
토스트(render 마지막, HUD보다 위):
```js
if (now < state.toiletToastUntil) {
  const remain = state.toiletToastUntil - now;
  const alpha = Math.min(1, remain / 300); // 마지막 300ms 페이드아웃
  ctx.save();
  ctx.globalAlpha = alpha;
  const text = '화캉스 보너스!';
  ctx.font = 'bold 18px "Pretendard", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const cx = CANVAS_W / 2;
  const cy = 40;
  // 외곽 그림자
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(cx - 110, cy - 18, 220, 36);
  // 본체 배경
  ctx.fillStyle = isLightTheme() ? '#fff5d6' : '#3a2a10';
  ctx.fillRect(cx - 108, cy - 16, 216, 32);
  // 텍스트
  ctx.fillStyle = isLightTheme() ? '#8a5a00' : '#ffd580';
  ctx.fillText(text, cx, cy);
  ctx.restore();
}
```

## 기능 상세
- **스폰 확률**: 12초마다 15% 굴림 → 기대 간격 ≈ 80초 (45초 플레이에서 0~1개 등장, 대부분 없거나 한 번)
- **맵 상한**: 1개
- **TTL**: 8초, 마지막 1초 깜빡임
- **보상**: 음표 2개어치 = 콤보 +2 + 각 단계 gain 합산 (콤보 3/5/7 보너스 자동 반영)
- **피드백**: 파티클 16개 + 사운드 2연타 + "화캉스 보너스!" 토스트 0.9초
- **초기화**: 새 게임 시작·재시작 시 toilets 비움 + nextToiletAt 재설정

## 주의사항
- 토스트는 textContent 대상 아님 (canvas 직접 그리기). 동적 입력 없음 → XSS 무관.
- 기존 state 초기화 경로(startGame, 재시작 분기)를 모두 찾아 3개 필드 초기화 누락 없도록.
- `spawnInterval/ttl/chance`는 상수로만 조정 — 난이도별 차등 금지(Sprint 범위).
- 반응형/저사양: reduced-motion은 깜빡임과 bob·파티클만 차단, 토스트 자체는 정적으로 표시.
- 픽셀 일관성: drawNote처럼 정수 좌표 + 12×12 히트박스 유지.
