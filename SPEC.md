# SPEC.md

## 개요
김간호는 음악박사 미니게임에서 **각 간호사 캐릭터가 상/중/하 난이도의 목표 점수를 모두 넘긴 순간**, 그 캐릭터 전용 "졸업장"을 모달 형태로 띄워 준다. 졸업장에는 해당 캐릭터의 픽셀 정면 스프라이트와 서사적 멘트가 새겨지고, 플레이어는 "이미지로 다운로드" 버튼 한 번으로 PNG를 저장할 수 있다. 이는 단순 최고기록판 이상의 **누적 성취 서사**를 남기는 보상 장치다.

## 변경 유형
**혼합** — 새 저장/판정 로직이 추가되므로 로직·기능 중심이지만, 졸업장 UI 자체는 글래스 + 픽셀 + 코럴 포인트로 세심하게 디자인되어야 하므로 디자인 비중도 작지 않다. 평가 기준은 "기능 변경 평가 기준"을 적용한다.

## 디자인 언어 & 의도
졸업장은 "실습생의 긴 여정이 끝나고 세상으로 나가는 순간"을 응축한 **한 장의 증명서**다. 게임의 픽셀 미학과 hgfolio의 코럴핑크(`--brand`) 정체성을 정면으로 잇고, 빛바랜 미색 종이 + 인장 스탬프 + 잔잔한 빛 번짐으로 "이건 진짜 기념품"이라는 감각을 준다. 다운로드된 PNG 파일은 그대로 인스타그램/카톡 프로필로 자랑할 수 있을 만큼 **독립된 완성품**이어야 한다.

## Sprint 범위 계약
Generator가 SPEC 외 변경을 하려 할 때의 판단 기준:
- **허용**: 졸업장 모달/트리거/다운로드 구현에 필수적인 연동 변경 (예: `endGame`에 졸업 판정 호출 1줄 추가, 캐릭터 선택 오버레이/엔딩 오버레이 내 "졸업장 다시 보기" 진입점 1개 추가)
- **금지**: SPEC에 없는 새로운 이스터에그·업적 시스템·SNS 공유 기능·추가 오디오/애니메이션·캐릭터 선택 그리드의 시각 개편 등
- **판단 기준**: "이 변경이 없으면 졸업장이 정상적으로 트리거/표시/다운로드되지 않는가?" → YES면 허용, NO면 금지

## 영향 파일
이 기능은 **게임 서브시스템 전용**이므로 루트 3개 파일(`index.html`, `assets/css/style.css`, `assets/js/main.js`)이 아니라 게임 3개 파일에만 변경을 가한다:

| 파일 | 역할 |
|---|---|
| `pages/game.html` | 졸업장 오버레이 DOM 뼈대 추가 |
| `assets/css/game.css` | 졸업장 스타일 추가 (기존 오버레이 BEM 패턴 `game-overlay__panel--*` 확장) |
| `assets/js/game.js` | 졸업 판정 · 누적 기록 저장 · 졸업장 렌더 · PNG 다운로드 로직 |

루트 3개 파일은 건드리지 않는다.

## 기존 저장 구조 분석 (이미 완료)
- `BEST_BY_CHAR_KEY = 'pixelNurseBestByChar'` → `{ version: 2, records: { kim:{easy,normal,hard}, jung:{...}, geon:{...}, im:{...}, lee:{...} } }`
- `TARGET_SCORE = { easy: 60, normal: 50, hard: 30 }` — 난이도별 성공 기준점
- `state.best[characterId][difficulty]` 에 역대 최고 점수가 이미 저장 중
- 엔딩 판정: `success = state.score >= TARGET_SCORE[state.difficulty]` (`endGame` 함수)
- 캐릭터 목록: `CHARACTERS = [{id:'kim',name:'김간호'}, {id:'jung',name:'정간호'}, {id:'geon',name:'건간호'}, {id:'im',name:'임간호'}, {id:'lee',name:'이간호'}]`

## 졸업장 트리거 조건
**판정 공식 (clear는 "역대 베스트 기준"):**
```js
function isGraduated(charId) {
  const rec = state.best[charId]; // 역대 베스트
  if (!rec) return false;
  return rec.easy   >= TARGET_SCORE.easy
      && rec.normal >= TARGET_SCORE.normal
      && rec.hard   >= TARGET_SCORE.hard;
}
```
즉 **과거에 한 번이라도** 해당 난이도 목표 점수를 넘긴 기록이 3개 난이도 모두에 있어야 졸업. 이번 라운드에서 전부 깨야 하는 것이 아니다.

**졸업 상태 스냅샷 영속 저장 (신설):**
- 새 localStorage 키 `pixelNurseGraduates` 추가
- 구조: `{ version: 1, graduated: { kim: '2026-04-22T13:45:00.000Z' | null, jung: null, ... } }`
- 최초로 `isGraduated(charId)`가 true가 되는 순간의 ISO 타임스탬프를 저장 → 졸업장에 "졸업일자"로 표기
- 이후 기록이 갱신되어도 최초 졸업일은 유지 (한 번 졸업하면 졸업일은 고정)
- 저장/로드 함수: `loadGraduates()` (초기화 시 `loadBest()` 직후 호출), `saveGraduates()`, `recordGraduationIfNew(charId)` (점수 저장 후 호출)

## 졸업장 표시 타이밍
1. **자동 트리거 (최우선)**: `endGame` 내부에서 `saveBest()` 직후 `recordGraduationIfNew(state.characterId)`를 호출. 이 호출로 **"방금 졸업이 확정된 경우"**(이전엔 미졸업, 이번 라운드로 졸업이 성립한 경우)를 감지한 경우에만 자동으로 엔딩 오버레이를 띄운 뒤 **0.9초 뒤** 졸업장 오버레이를 덮어쓰듯 표시.
2. **수동 재열람**: 엔딩 오버레이 CTA 영역에 "졸업장 보기" 버튼(`#btnShowCertificate`)을 추가. 해당 캐릭터가 이미 졸업한 상태일 때만 `is-hidden` 해제로 노출. 클릭 시 졸업장 오버레이 표시.
3. **캐릭터 선택 카드에서도 진입**: 각 `.game-character-card`의 최고 기록 라인 옆에 졸업 마크(🎓) 또는 "졸업" 뱃지를 조건부 추가. 뱃지는 표시 전용.

## 졸업장 UI 구성
오버레이 id: `overlayCertificate`, BEM: `.game-overlay--certificate` + `.game-overlay__panel--certificate`.

레이아웃 (위→아래):
1. **상단 장식선**: 코럴(`--brand`) 얇은 이중선 + 좌우 끝 별 모양(✦) 두 개
2. **영문 타이틀**: `CERTIFICATE OF GRADUATION` (Cormorant Garamond, letter-spacing 크게, `--text-dim`)
3. **한글 서브타이틀**: "실습 수료 증서" (Noto Sans KR, `--brand`)
4. **픽셀 캐릭터 캔버스** (`<canvas class="game-certificate__avatar" width="192" height="240">`, SCALE=12): `nurseSprite('down', 0, charId)` + `getNursePalette(charId)` 재사용
5. **본문 서사 영역** (`.game-certificate__body`):
   - "다사다난한 실습을 마치고 **○○간호**는 드디어 졸업하였다."
   - "이제 세상이라는 악보 위에 마음껏 노래를 부르며 자유롭게 살 것이다."
   - ○○ 부분만 `<strong>` + `--brand` 색상으로 강조
6. **서명 & 날짜 블록** (`.game-certificate__sign`):
   - 좌측: `발행 ` + 졸업일(YYYY년 M월 D일)
   - 우측: "hgfolio · 김간호는 음악박사" + 코럴 인장(`::after` 가상요소, `--brand-20` 배경 + `--brand` 테두리 + 작은 음표 글리프)
7. **하단 CTA (2버튼)**:
   - `#btnDownloadCertificate` — "이미지로 다운로드" (primary `.game-btn`)
   - `#btnCloseCertificate` — "닫기" (`.game-btn--ghost`)
8. **배경**: 기존 `.game-overlay` 블러 유지. 패널은 `--bg-card` 베이스 + 미세한 코럴 그라디언트 오버레이 + 4px 이중 테두리(바깥 `--brand-20`, 안쪽 `--border`)로 "증서 용지" 느낌.

## 멘트 템플릿
```js
const CERT_COPY = {
  title_en: 'CERTIFICATE OF GRADUATION',
  title_ko: '실습 수료 증서',
  body1: (name) => `다사다난한 실습을 마치고 ${name}는 드디어 졸업하였다.`,
  body2: '이제 세상이라는 악보 위에 마음껏 노래를 부르며 자유롭게 살 것이다.',
  issuer: 'hgfolio · 김간호는 음악박사'
};
```
- `name` 은 `CHARACTERS.find(c => c.id === charId).name` 을 직접 사용 (예: `김간호`, `정간호`)
- DOM 주입 시 **반드시 `textContent`** 사용. 본문 조립은 두 개의 `<p>` 로 분리(첫 번째 `<p>` 에 `<strong>` 요소를 `createElement`로 만들어 이름만 감싼다). `innerHTML` 금지.

## 이미지 다운로드 구현 방식
**외부 라이브러리 금지** → 순수 Canvas API로 구현.

### 알고리즘
1. `#btnDownloadCertificate` 클릭 → `generateCertificateImage(charId)` 호출
2. 내부에서 오프스크린 `<canvas>` 생성: `width=720`, `height=1000` (3:4 비율)
3. DPR 보정: `canvas.width = 720 * dpr; canvas.height = 1000 * dpr; ctx.scale(dpr, dpr);`
4. 배경: `--bg-card` 색상으로 fill → 가장자리 16px 여백에 코럴 테두리(`--brand-20` 4px) + 안쪽 1px 라인 → 상/하단에 `--brand` 1px 장식선
5. 상단 텍스트:
   - `ctx.font = "700 22px 'Cormorant Garamond', serif"` → `CERTIFICATE OF GRADUATION`
   - `ctx.font = "500 14px 'Noto Sans KR', sans-serif"` → `실습 수료 증서`
6. 픽셀 캐릭터: 기존 `nurseSprite('down', 0, charId)` + `getNursePalette(charId)` 를 재사용하여 **SCALE=14**로 16×20→224×280 렌더
   - `ctx.imageSmoothingEnabled = false` 필수
7. 본문: 줄바꿈 수동 처리, `ctx.font = "500 18px 'Noto Sans KR'"`, `textAlign='center'`
   - 이름 포함 첫 줄은 `--brand` 색, 두 번째 줄은 `--text` 색으로 단순화 허용
8. 서명 블록: 좌하 날짜(`YYYY.MM.DD`) + 우하 "hgfolio · 김간호는 음악박사" (`--text-dim`, 12px)
9. 인장: 우하 끝에 `arc`로 원(`--brand-20` 채움 + `--brand` 2px 스트로크) + 원 안에 `♪` 문자
10. `canvas.toDataURL('image/png')` → 가상 `<a>` 생성 → `download` 속성에 `pixel-nurse-certificate-${charId}-${YYYYMMDD}.png` 부여 → `.click()` → DOM에서 제거

### 색상 읽기
`getComputedStyle(document.documentElement).getPropertyValue('--brand').trim()` 패턴 사용.

### 폰트 로드 타이밍
`Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))])` 패턴으로 최대 1.5초 대기 후 렌더 진행.

## 접근성 & 보안
- **텍스트 주입**: 모든 동적 텍스트는 `textContent` 만 사용. `innerHTML` 금지.
- **role/aria**: 오버레이는 `role="dialog"` + `aria-modal="true"` + `aria-labelledby="certTitle"` + `aria-describedby="certBody"`.
- **키보드 닫기**: `keydown` 이벤트로 `Escape` 감지 → `closeCertificate()`. 졸업장이 열려 있을 때만 활성.
- **포커스 트랩**: 오버레이 오픈 시 다운로드 버튼에 `focus()`, 닫을 때 이전 포커스로 복귀.
- **reduced motion**: 진입 애니메이션은 `@media (prefers-reduced-motion: reduce)`에서 즉시 표시.
- **다운로드 파일명 안전성**: charId(화이트리스트 5개)만 사용하므로 경로 조작 불가.

## 변경 범위

### pages/game.html 변경사항
- `#overlayEnd` 블록 **바로 다음**에 졸업장 오버레이 DOM 추가:
  ```html
  <div class="game-overlay game-overlay--certificate is-hidden" id="overlayCertificate" role="dialog" aria-modal="true" aria-labelledby="certTitle" aria-describedby="certBody">
    <div class="game-overlay__panel game-overlay__panel--certificate">
      <div class="game-certificate__deco game-certificate__deco--top" aria-hidden="true">✦ ✦</div>
      <h2 class="game-certificate__title-en" id="certTitle">CERTIFICATE OF GRADUATION</h2>
      <p class="game-certificate__title-ko">실습 수료 증서</p>
      <div class="game-certificate__avatar-wrap">
        <canvas class="game-certificate__avatar" id="certAvatar" width="192" height="240" aria-hidden="true"></canvas>
      </div>
      <div class="game-certificate__body" id="certBody">
        <p class="game-certificate__body-line game-certificate__body-line--lead" id="certLine1"></p>
        <p class="game-certificate__body-line">이제 세상이라는 악보 위에 마음껏 노래를 부르며 자유롭게 살 것이다.</p>
      </div>
      <div class="game-certificate__sign">
        <span class="game-certificate__date" id="certDate"></span>
        <span class="game-certificate__issuer">
          hgfolio · 김간호는 음악박사
          <span class="game-certificate__seal" aria-hidden="true">♪</span>
        </span>
      </div>
      <div class="game-certificate__deco game-certificate__deco--bottom" aria-hidden="true">✦ ✦</div>
      <div class="game-cta">
        <button class="game-btn" type="button" id="btnDownloadCertificate">이미지로 다운로드</button>
        <button class="game-btn game-btn--ghost" type="button" id="btnCloseCertificate">닫기</button>
      </div>
    </div>
  </div>
  ```
- `#overlayEnd` 의 CTA 영역(`.game-cta`)에 `#btnReplay` **앞**으로 다음 버튼 추가:
  ```html
  <button class="game-btn game-btn--ghost is-hidden" type="button" id="btnShowCertificate" aria-label="졸업장 보기">🎓 졸업장 보기</button>
  ```

### assets/css/game.css 변경사항
- **새 BEM 블록 `.game-certificate__*`** 추가:
  - `.game-overlay__panel--certificate`: max-width 420px, 패딩 28px, `border: 4px double var(--brand-20)`, 코럴 그라디언트 오버레이, `border-radius: var(--radius-lg, 16px)`
  - `.game-certificate__title-en`: Cormorant Garamond 24px weight 700, letter-spacing 0.2em, color `--text-dim`, text-align center
  - `.game-certificate__title-ko`: Noto Sans KR 14px weight 500, color `--brand`, letter-spacing 0.08em
  - `.game-certificate__avatar-wrap`: flex center + 부드러운 radial `--brand-10` 배경 후광
  - `.game-certificate__avatar`: `image-rendering: pixelated`, width 192px, height 240px
  - `.game-certificate__body`: text-align center, gap 10px
  - `.game-certificate__body-line--lead strong`: color `--brand`, font-weight 700
  - `.game-certificate__sign`: flex space-between, 12px, `--text-dim`, 상단 `1px solid var(--border)`
  - `.game-certificate__seal`: inline-block 원형, `background: var(--brand-20)`, `border: 2px solid var(--brand)`, `color: var(--brand)`
  - `.game-certificate__deco`: 중앙정렬, `--brand` 색
- **진입 애니메이션**: `@keyframes certIn` 180ms
- **reduced-motion**: `@media (prefers-reduced-motion: reduce) { .game-overlay__panel--certificate { animation: none; } }`
- **반응형 (520px 이하)**: 패널 max-width 92vw, 캐릭터 캔버스 144×180
- `.game-character-card__grad { color: var(--brand); font-size: 11px; }` 뱃지

### assets/js/game.js 변경사항

#### 1. 상수 추가
```js
const GRADUATES_KEY = 'pixelNurseGraduates';
const CERT_COPY = {
  title_en: 'CERTIFICATE OF GRADUATION',
  title_ko: '실습 수료 증서',
  body1: (name) => `다사다난한 실습을 마치고 ${name}는 드디어 졸업하였다.`,
  body2: '이제 세상이라는 악보 위에 마음껏 노래를 부르며 자유롭게 살 것이다.',
  issuer: 'hgfolio · 김간호는 음악박사'
};
```

#### 2. state에 graduates 필드 추가
```js
graduates: { kim: null, jung: null, geon: null, im: null, lee: null },
```

#### 3. 신규 함수 (loadBest/saveBest 아래)
- `loadGraduates()`
- `saveGraduates()`
- `isGraduated(charId)`
- `recordGraduationIfNew(charId)` — 신규 졸업이면 `true` 반환

#### 4. DOM 참조 추가
```js
const overlayCertificate = document.getElementById('overlayCertificate');
const btnDownloadCertificate = document.getElementById('btnDownloadCertificate');
const btnCloseCertificate = document.getElementById('btnCloseCertificate');
const btnShowCertificate = document.getElementById('btnShowCertificate');
const certAvatar = document.getElementById('certAvatar');
const certLine1 = document.getElementById('certLine1');
const certDate = document.getElementById('certDate');
```

#### 5. `endGame` 내부 수정 (`saveBest()` 직후)
```js
const justGraduated = recordGraduationIfNew(state.characterId);
if (btnShowCertificate) {
  btnShowCertificate.classList.toggle('is-hidden', !isGraduated(state.characterId));
}
if (justGraduated) {
  setTimeout(() => openCertificate(state.characterId), 900);
}
```

#### 6. 신규 함수들
- `openCertificate(charId)`: 날짜/이름 주입 → `drawCertificateAvatar(certAvatar, charId)` → 오버레이 오픈 → focus
- `closeCertificate()`: 오버레이 닫기 → 이전 포커스 복귀
- `generateCertificateImage(charId)`: 오프스크린 캔버스에 전체 졸업장 렌더 후 dataURL 반환
- `drawCertificateAvatar(canvas, charId)`: 픽셀 스프라이트만 그리는 헬퍼
- `downloadCertificate(charId)`: 파일명 구성 → `<a>` 클릭

#### 7. 이벤트 바인딩
```js
btnDownloadCertificate?.addEventListener('click', () => downloadCertificate(state.characterId));
btnCloseCertificate?.addEventListener('click', closeCertificate);
btnShowCertificate?.addEventListener('click', () => openCertificate(state.characterId));
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!overlayCertificate || overlayCertificate.classList.contains('is-hidden')) return;
  closeCertificate();
});
```

#### 8. `initCharacterGrid` 내부 — 졸업 뱃지 추가
```js
if (isGraduated(ch.id)) {
  const gradBadge = document.createElement('span');
  gradBadge.className = 'game-character-card__grad';
  gradBadge.textContent = '🎓 졸업';
  gradBadge.setAttribute('aria-label', '졸업 완료');
  btn.appendChild(gradBadge);
}
```

#### 9. 초기화 (`loadBest();` 다음)
```js
loadGraduates();
```

## 기능 상세

### 기능 1: 졸업 상태 영속 저장
- 설명: 캐릭터별로 상/중/하 모두 목표 점수를 넘긴 "졸업" 상태와 그 최초 달성 일자를 localStorage에 영속.
- 구현 위치: `assets/js/game.js` (`loadGraduates`/`saveGraduates`/`isGraduated`/`recordGraduationIfNew`)

### 기능 2: 졸업장 자동 표시
- 설명: 새로 졸업이 확정된 순간 엔딩 오버레이를 보여준 뒤 0.9초 후 졸업장 오버레이가 덮어씀.
- 구현 위치: `endGame` 내부 (game.js)

### 기능 3: 졸업장 수동 재열람
- 설명: 이미 졸업한 캐릭터는 언제든 엔딩 오버레이의 🎓 "졸업장 보기" 버튼으로 재열람.

### 기능 4: 졸업장 렌더
- 설명: 선택된 캐릭터의 픽셀 스프라이트 + 이름 치환된 서사 멘트 + 졸업일자 + 코럴 인장을 모달에 표시.
- 세부 요소: `textContent` 주입, 기존 `nurseSprite`/`getNursePalette` 재사용

### 기능 5: PNG 다운로드
- 설명: Canvas API로 720×1000 PNG를 생성하여 파일로 내려받는다.
- 세부 요소: DPR 보정, `imageSmoothingEnabled = false`, `document.fonts.ready` 대기, `a.download` 활용

### 기능 6: 캐릭터 선택 카드 졸업 뱃지
- 설명: 캐릭터 선택 오버레이에서 졸업한 캐릭터는 🎓 뱃지로 구분.

## 주의사항
- **기존 `endGame` 로직 보전**: `saveBest()` 호출 위치/순서를 바꾸지 말고 졸업 판정은 그 직후에 삽입.
- **신규 졸업 타이밍**: `recordGraduationIfNew`는 `saveBest()`가 `state.best`를 실제로 반영한 **이후**에 호출.
- **키보드 ESC 충돌 방지**: 졸업장이 열린 경우에만 반응하도록 가드.
- **XSS**: 모든 텍스트는 `textContent` 전용.
- **팔레트 캐시 무효화**: 테마 전환 시 졸업장이 열려 있으면 `drawCertificateAvatar` 재호출.
- **폰트 로드 실패**: `Promise.race` 패턴으로 최대 1.5초 대기.
- **3개 파일 제약**: 게임 서브시스템 3파일(`pages/game.html` + `assets/css/game.css` + `assets/js/game.js`)에만 변경. 루트 3파일은 건드리지 않는다.
