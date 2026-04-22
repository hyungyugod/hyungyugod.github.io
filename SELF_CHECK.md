# 자체 점검

전략: Case A — 이유: 최초 구현, SPEC 지시를 정밀 적용.

## 실제 수정 라인 범위

| 항목 | 파일 | 수정 전 라인 | 수정 후 라인 |
|---|---|---|---|
| `AIRFORCE` 상수 재정의 (title/subtitle/박스 크기 필드 추가, toastText 삭제, toastDuration 2600) | assets/js/game.js | 106~116 (11줄) | 106~122 (17줄) |
| 기존 1줄 토스트 블록 → 2단 박스 렌더 블록 교체 | assets/js/game.js | 기존 3510~3526 (17줄) | 수정 후 3516~3581 (66줄, measureText 2줄 분리 로직 포함) |

기타 파일(`pages/game.html`, `assets/css/game.css`, `index.html`, `assets/css/style.css`, `assets/js/main.js`) — 무변경.

## SPEC 기능 체크

- [x] 기능 1: 박병장 2단 안내 토스트 — 제목("나와라 박병장!") + 본문 2줄 박스를 `AIRFORCE.toastBoxY=24` 위치에 렌더. 좌측 4px 코럴 악센트 라인, 다크=`#1a2238` / 라이트=`#e8edf5` 배경, 제목 코럴 톤, 본문 뉴트럴 톤.
- [x] 기능 2: 기존 비행기/도망 연출과의 동기화 — `AIRFORCE.toastDuration` 1200 → 2600ms. `triggerAirforceEasterEgg`, `startChiefFlee`, `updateAirplane`, `drawAirplane` 로직 무변경. 비행기 flyDuration 2400ms + 200ms 여유.
- [x] 기능 3: `CUTSCENES.introStoneGuard` 보존 — 191~194행 텍스트("경고 · 석조무사 출현" / "수간호사의 충실한 부하 석조무사가 출현합니다! 마주치면 잡혀갑니다. 절대 만나지 마세요.") 원문 그대로 유지.

## 평가 기준 자체 점검 가이드 (SPEC 하단 체크박스)

- [x] `AIRFORCE.title`, `AIRFORCE.subtitle` 상수화 완료 (하드코딩 문자열 아님) — 110~111행에 상수 정의, 렌더 블록에서 `AIRFORCE.title` / `AIRFORCE.subtitle`만 참조.
- [x] `AIRFORCE.toastText` 필드 제거 및 모든 참조 제거 — Grep으로 확인, 프로젝트 내 `toastText` 참조 0건.
- [x] `AIRFORCE.toastDuration` 2600ms로 변경 — 109행 기준 `toastDuration: 2600`.
- [x] 기존 `triggerAirforceEasterEgg`(2674~), `startChiefFlee`(2703~), `updateAirplane`(2726~), `drawAirplane`(2738~) 로직 무변경 — Grep 검증.
- [x] `CUTSCENES.introStoneGuard` 텍스트 원문 유지 — 191~194행에 "경고 · 석조무사 출현" / "마주치면 잡혀갑니다" 포함 확인.
- [x] 2단 박스 렌더 순서가 화캉스 토스트 블록 뒤에 위치 — 화캉스 블록은 기존 3508행까지, 박병장 블록은 3516행부터 시작. 렌더 순서 상 박병장이 위 레이어.
- [x] `reducedMotion`에서 alpha 페이드 생략 — `const alpha = reducedMotion ? 1 : Math.min(1, remain / 300);` 분기 적용.
- [x] 다크/라이트 테마 모두 색상 지정 — 박스 배경, 좌측 악센트, 제목, 본문 모두 `isLightTheme()` 분기로 4가지 색상 쌍 정의.
- [x] subtitle 텍스트 폭이 boxW 이내 확인 (초과 시 2줄 분리) — `ctx.measureText(subtitle).width`를 `boxW - 32`와 비교해 초과 시 공백 기준 최적 분리점을 탐색, `boxH`를 62 → 78로 확장.
- [x] CSS/HTML 파일 무변경 — `assets/js/game.js` 단일 파일만 수정.

## 패턴 준수 확인

- **BEM 네이밍**: 해당 없음 (캔버스 2D 렌더, DOM 클래스 추가 없음).
- **CSS 변수 사용**: 해당 없음 (캔버스 렌더는 기존 관례대로 hex 하드코딩 — 기존 `'#ff7b7b'`, `'#fff5d6'` 등과 동일 패턴).
- **CSS 네이티브 중첩**: 해당 없음 (CSS 파일 무변경).
- **반응형 520px**: 해당 없음 (캔버스 고정 크기 640×(WALL_*)에서 렌더, 기존 토스트와 동일 범위). 캔버스 자체의 반응형은 기존 CSS가 담당.
- **reduced-motion**: 대응 — `reducedMotion` 플래그(189행) 참조해 alpha 페이드만 생략, 박스 표시는 유지하여 내러티브 정보 전달 보장.
- **esc()/safeUrl()**: 불필요 — `AIRFORCE.title`/`subtitle`은 상수 문자열, `ctx.fillText`로 canvas에 직접 그리므로 XSS 무관. SPEC 176~177행과 일치.
- **가드 클래스**: 기존 패턴 유지 — `if (state.airplane.active && now < state.airplane.toastUntil)` 가드 보전.
- **DOMContentLoaded 등록**: 해당 없음 — 렌더 블록은 기존 `render()` 함수 내부에 위치, 등록 경로 무변경.
- **-webkit-backdrop-filter**: 해당 없음 (CSS 파일 무변경).
- **파일 간 정합성**: `assets/js/game.js` 단일 파일만 수정. `pages/game.html` · `assets/css/game.css` 무변경이므로 클래스/ID 변동 없음.

## Sprint 범위 계약 준수

- **허용 범위**: (1) `AIRFORCE` 상수 확장, (2) 3510~3526 토스트 렌더 블록 2단 박스로 재작성, (3) `toastDuration` 값 조정, (4) reduced-motion 페이드 생략 분기 — 4가지 모두 SPEC 14행의 "허용" 목록에 정확히 해당.
- **금지 범위 위반 0건**: `triggerAirforceEasterEgg`/`startChiefFlee`/`updateAirplane`/`drawAirplane` 로직 무변경, `CUTSCENES.introStoneGuard` 무변경, `CUTSCENES` 오버레이 전환 안 함, 비행기 수치(속도/좌표/fleeDuration/파티클/엔진) 무변경, 석조무사 스프라이트/패트롤/hitbox 무변경, CHARACTERS/SKILLS 무변경, `pages/game.html` / `assets/css/game.css` 무변경.
- **추가 변경 0건**: SPEC에 없는 독립 기능/애니메이션/색상 토큰 추가 없음.

## 구현 상 주의 판단

1. **subtitle 2줄 분리 로직**: SPEC 126~127행이 "mental check 후 초과 시 2줄 분리"를 요구. 13px Pretendard에서 한글 34자의 실제 폭은 환경/폰트 가용성에 따라 달라질 수 있으므로 **런타임에 `ctx.measureText`로 실측 후 동적 분리**하는 방어적 구현을 채택. 폰트 미로드 시 system-ui 폴백이 더 넓을 가능성에 대응.
2. **2줄 분리 시 boxH=78**: SPEC 127행 지시 그대로 적용.
3. **제목 y 위치 `boxY + 18`**: SPEC 의사코드 그대로. 2줄 분리 시에도 제목 위치는 일관.
4. **본문 y 위치**: 1줄 시 `boxY + 42` (SPEC 의사코드), 2줄 시 `boxY + 40` / `boxY + 58` — 78px 박스 안에서 제목(18px @ y=18) 아래 여백을 고려해 세로 중앙 근처 배치.
5. **렌더 순서**: SPEC 170행 "화캉스 토스트 블록 다음" 요건을 기존 블록 순서 그대로 유지하여 충족.
