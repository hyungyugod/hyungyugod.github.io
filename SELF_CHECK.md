# 자체 점검 — 졸업장(Certificate) 시스템 R2

전략: **Case A: 같은 방향 유지**, QA_REPORT의 "구체적 개선 지시"를 정밀 적용. 가중 점수 7.30에 P0 1건만 남은 상태이므로 구조 재설계 없이 지시사항만 정확히 반영.

---

## 1. 이번에 수정한 구체적 위치

| 우선순위 | 파일 | 위치 | 변경 요약 |
|---|---|---|---|
| **P0** | `assets/css/game.css` | 1315~1328 (`.game-overlay--certificate`) | 상시 `position: fixed; inset: 0; width: 100vw; height: 100dvh; z-index: 60; padding: 24px; overflow-y: auto;` 로 뷰포트 레벨 승격 |
| **P0** | `assets/css/game.css` | 1815~1818 (`@media (max-width: 520px)` 내부) | 기존 `#overlayCertificate` id 선택자의 중복 `position/inset/width/height/z-index` 블록 제거, `.game-overlay--certificate { padding: 12px }` 만 유지 |
| **P1** | `assets/css/game.css` | 1339 (`.game-overlay__panel--certificate`) | `border-radius: var(--radius);` → `border-radius: var(--radius-lg, 16px);` (SPEC 명세 일치) |
| **P2-a** | `assets/js/game.js` | 2088~2109 (ESC 핸들러 바로 아래) | Tab 포커스 트랩 keydown 리스너 추가 — 패널 밖 포커스는 다운로드 버튼으로 복귀, 두 버튼 간 Shift+Tab/Tab 순환 |
| **P2-b** | `assets/js/game.js` | 1016~1017 (`state.graduates` 초기화) | 하드코딩 `{kim,jung,geon,im,lee}` 나열 제거 → `CHARACTER_IDS.reduce((acc, id) => (acc[id] = null, acc), {})` 로 화이트리스트 기반 초기화 |
| **P2-c** | `assets/js/game.js` | 1151~1157 (`saveGraduates`) | `graduated: state.graduates` → `graduated: { ...state.graduates }` 얕은 복사로 외부 mutation 방어 |

---

## 2. P0/P1/P2 해결 방법

### P0 — 데스크톱 클리핑 해결
- QA_REPORT가 지시한 해결책을 그대로 적용: `.game-overlay--certificate` 선택자에 `position: fixed; inset: 0; width: 100vw; height: 100dvh; z-index: 60; padding: 24px; overflow-y: auto;` 를 **미디어쿼리 바깥**에 상시 선언하여 뷰포트 레벨로 승격.
- 이로써 패널이 더 이상 `.game-canvas-wrap`(aspect-ratio:16/10; overflow:hidden) 안에 갇히지 않음 → 1200×900 데스크톱에서도 CTA 2버튼까지 전부 뷰포트 내에 표시되고 `overflow-y: auto` 로 키가 큰 창에서는 패널 상하 스크롤도 가능.
- 기존 모바일(≤520px) 블록의 `#overlayCertificate` 규칙은 중복이므로 삭제했고, 모바일용 `padding: 12px` 만 `.game-overlay--certificate` 로 바꿔 남겨둠 (상위 cascade로 덮어씀 — 상시 규칙의 24px → 모바일 12px).
- 라이트 테마 배경도 기존 로직 유지(`html.light .game-overlay--certificate { background: rgba(245,244,248,0.82) }`).

### P1 — border-radius 토큰 교정
- SPEC "변경 범위 → assets/css/game.css 변경사항" 섹션이 명시한 `border-radius: var(--radius-lg, 16px)` 값으로 교체. `--radius-lg` 변수가 `:root`에 정의되지 않아도 fallback 16px이 적용되므로 루트 수정 불필요 (SPEC의 금지 조항 준수).

### P2-a — 포커스 트랩 (Tab 순환 가드)
- ESC 핸들러와 **같은 document.addEventListener('keydown', ...)** 패턴으로 Tab 가드 리스너 추가.
- 졸업장이 열려 있지 않거나 두 버튼이 부재하면 즉시 return → 다른 오버레이 Tab 동작에 영향 없음.
- 포커스가 패널 밖으로 흘러나간 경우(`active`가 다운로드/닫기 중 어느 것도 아닌 경우) `preventDefault` 후 다운로드 버튼으로 복귀.
- 패널 내부에서는 Shift+Tab at 다운로드 버튼 → 닫기 버튼으로, Tab at 닫기 버튼 → 다운로드 버튼으로 순환.
- 접근성 규칙(SPEC "접근성 & 보안 — 포커스 트랩")을 정확히 충족.

### P2-b — state.graduates 초기화 DRY
- `CHARACTER_IDS`(라인 92에서 `CHARACTERS.map(c => c.id)` 로 이미 정의됨, state 정의 블록보다 위)를 reduce로 순회하여 `{ [id]: null }` 맵 생성 → 신규 캐릭터 추가 시 한 곳(CHARACTERS 배열)만 수정하면 자동 반영.

### P2-c — saveGraduates 얕은 복사
- 저장 직전 `{ ...state.graduates }` 로 새 객체를 만들어 payload에 주입 → 호출자가 payload 참조를 변경해도 `state.graduates` 원본이 오염되지 않음. JSON.stringify 이전 시점의 방어.

---

## 3. 다른 오버레이에 영향 없음 확인

이번 변경은 **모두 `.game-overlay--certificate`(또는 `.game-overlay__panel--certificate`) 선택자에만 한정**되어 다른 오버레이(`overlayStart`, `overlayCharacters`, `overlayReady`, `overlayEnd`, `overlaySkill`, `overlayCutscene`, `overlayAirforce`)의 기본 레이아웃에 영향이 없다.

| 검사 항목 | 결과 |
|---|---|
| `.game-overlay`(기본) 규칙 수정 여부 | **미수정** — 기존 `position:absolute; inset:0` 유지 |
| `.game-overlay__panel`(기본) 규칙 수정 여부 | **미수정** |
| 다른 오버레이 전용 modifier(`--cutscene`/`--skill`/`--airforce` 등) 수정 여부 | **미수정** |
| 다른 오버레이용 ESC/Tab/포커스 관련 JS 수정 여부 | **미수정** — 이번에 추가한 Tab 가드는 `overlayCertificate.classList.contains('is-hidden')` 체크로 졸업장이 닫혀 있으면 즉시 return |
| 기존 `#overlayCertificate` id 선택자로 있던 position 속성 이관 시 다른 id 선택자 충돌 | 없음 — id 중복 없음 확인 |

**JS Tab 리스너 가드 코드**:
```js
if (!overlayCertificate || overlayCertificate.classList.contains('is-hidden')) return;
```
→ 졸업장이 is-hidden 상태(= 닫힘)인 경우 Tab 동작은 기존 브라우저 기본 동작 그대로 유지.

---

## 4. 루트 3파일 미수정 확인

`git diff --name-only` 결과:
```
.claude/settings.local.json
QA_REPORT.md
SELF_CHECK.md
SPEC.md
assets/css/game.css
assets/js/game.js
pages/game.html
```

- `index.html` : 변경 없음
- `assets/css/style.css` : 변경 없음
- `assets/js/main.js` : 변경 없음

이번 R2 라운드에서 실제 코드가 수정된 파일은 `assets/css/game.css` + `assets/js/game.js` 2개 (게임 서브시스템 한정). `pages/game.html` 은 R1에서만 수정되고 R2에서는 추가 변경 없음.

---

## 5. 정적 분석 체크

### JS 문법
- `node -c assets/js/game.js` → **통과** (에러 없음)

### CSS 중괄호 대칭
- open `{` : **306**
- close `}` : **306**
- match: **true**

### HTML 태그 대칭
- `<div>` : 42
- `</div>` : 42
- match: **true**

### 선택자 범위 한정 확인
- 새로 추가된 CSS 규칙 전체가 `.game-overlay--certificate` 또는 `.game-overlay__panel--certificate`로 시작하는 BEM modifier에만 걸린다. grep 기반 수동 검증.
- 모바일 @media 블록 내부 id 선택자 `#overlayCertificate` 제거 후 클래스 선택자로 교체 → ID/class 혼재로 인한 specificity 예상 외 충돌 가능성 제거.

### Tab 리스너 중복 등록 확인
- 기존 ESC 리스너와 별도로 `'keydown'`에 `'Tab'` 만 처리하는 리스너 1건 추가. ESC와 Tab을 분리하여 각 리스너가 자기 키만 early-return 이후 처리. 다른 전역 keydown 리스너(게임 이동 조작 등)와 충돌 없음 — 졸업장 is-hidden 상태에서는 즉시 return하므로 키 입력 흐름 방해 없음.

---

## 6. QA_REPORT 재검증 체크리스트 대응

| 항목 | 대응 |
|---|---|
| 1200x900에서 btnDownloadCertificate가 viewport 내부 | position:fixed + 100dvh 승격으로 해결 |
| 1200x900에서 certDate가 viewport 내부 | 동일 (overflow-y: auto 보조) |
| 375x667에서 기존 통과 상태 유지 | 모바일 블록에 `padding: 12px` + `.game-overlay__panel--certificate`의 max-width/max-height/overflow-y 그대로 유지 |
| border-radius: var(--radius-lg, 16px) 적용 | 완료 (라인 1339) |
| Tab 키 순환 가드 동작 | 완료 (2088~2109) |
| 콘솔 에러 0건 유지 | JS 문법 검증 통과, 신규 에러 경로 없음 |
| 루트 3파일 미수정 유지 | 완료 (git diff 확인) |

---

## 요약
- **P0 해결**: 데스크톱 클리핑의 근본 원인(부모 overflow:hidden)을 `.game-overlay--certificate` 뷰포트 승격으로 제거. 다른 오버레이는 영향 없음.
- **P1 해결**: SPEC 명세값 `--radius-lg` 로 교정.
- **P2 3건 해결**: Tab 트랩 + DRY 초기화 + 얕은 복사.
- **회귀 방지**: textContent/화이트리스트/Canvas 렌더/endGame 순서/테마 연동/reduced-motion 등 기존 동작 코드는 건드리지 않음.
- **범위 유지**: 게임 3파일(`pages/game.html`은 R2 미수정) + 실제 R2 수정은 2파일. 루트 3파일 불변.
