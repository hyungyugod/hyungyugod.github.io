# 박병장 출동 안내문(2단 토스트) — 석조무사 접촉 시 내러티브 강화

## 개요
현재 석조무사 접촉 시 "공군병장 박병장 출동!" 1줄 토스트만 1.2초 뜨고 곧장 비행기/도망 연출이 실행된다. 이를 **2단 구성(제목 + 본문)의 내러티브 안내 박스**로 확장하여, 석조무사가 학창시절 친구인 박병장을 호출해 실습생을 구해주는 "반전의 순간"을 플레이어가 확실히 읽을 수 있도록 한다. 게임 흐름은 절대 멈추지 않는다 — 안내는 캔버스 상단 오버레이로 페이드인/아웃되며 비행기가 날아오는 동안 함께 보여진다.

## 변경 유형
**기능** (텍스트/연출 추가가 있지만 로직 상수 확장과 렌더 분기 추가가 핵심이므로 기능 평가 기준 적용)

## 디자인 언어 & 의도
석조무사를 "수간호사의 부하 악역"으로 안내했다가 접촉 순간 "사실은 박병장을 불러주는 친구"였다는 반전을 **텍스트로 명시**하여, 플레이어가 위험한 실수라고 생각한 순간이 오히려 구원으로 뒤집히는 서사적 카타르시스를 전달한다. 안내는 게임을 멈추지 않고 비행기 퍼포먼스(2.4초)와 **시간적으로 동기화**되며, 기존 글래스모피즘 토스트의 문법(반투명 배경 박스 + 페이드 알파)을 유지해 UI 정체성을 깨뜨리지 않는다.

## Sprint 범위 계약
Generator가 SPEC 외 변경을 하려 할 때의 판단 기준:
- **허용**: (1) `AIRFORCE` 상수에 title/subtitle/폰트/박스 크기 관련 필드 추가, (2) 기존 토스트 렌더 블록(3510~3526)을 2단 박스로 재작성, (3) `AIRFORCE.toastDuration` 값 조정, (4) `prefers-reduced-motion`에서의 페이드 생략 분기
- **금지**: 
  - 기존 `triggerAirforceEasterEgg` / `startChiefFlee` / `updateAirplane` / `drawAirplane` 함수의 로직/타이밍 변경
  - `CUTSCENES.introStoneGuard`의 텍스트 변경 (여전히 게임 시작 직후 "경고 · 석조무사 출현" 안내로 그대로 유지)
  - `CUTSCENES` 사전 또는 `triggerCutscene` 기반 오버레이로 안내 전환 (게임을 멈추지 않기 위함)
  - 비행기 속도/좌표/도망 로직/파티클/엔진 사운드 변경
  - 석조무사 스프라이트/패트롤/hitbox 관련 변경
- **판단 기준**: "이 변경이 2단 안내 토스트 렌더와 동기화에 직접적으로 필요한가?" → YES면 허용, NO면 금지

## UX 선택 결정

**후보 비교**:
- (A) 기존 CUTSCENES 오버레이 재사용 (Enter/Space로 닫기, 게임 일시정지): **탈락**. 접촉 즉시 비행기가 이미 스폰되어 좌→우로 움직이기 시작하는데 오버레이가 게임을 멈추면 "비행기 등장 → 수간호사 도망" 연출의 템포가 깨진다. 또 introStoneGuard 컷씬과 형식이 겹쳐 별개 이벤트라는 느낌이 약해진다.
- (B) 캔버스 상단 2단 박스 토스트 (2~3초 자동 소멸, 게임 계속 진행): **선택**. 기존 토스트 문법을 그대로 계승하면서 제목+본문 2줄로 확장. 비행기 flyDuration(2400ms)과 동기화하면 비행기가 화면을 통과하는 동안 안내가 떠 있고, 마지막 300ms에 함께 페이드아웃.
- (C) 캔버스 중앙 큰 박스: **탈락**. 플레이어 캐릭터와 음표를 가려 조작성이 떨어진다.

**결정: 안 (B)**. 게임 흐름을 끊지 않고 비행기/도망 연출과 시각적으로 동기화.

## 새 안내문 상수화

`AIRFORCE` 상수에 다음 필드 추가 (기존 필드는 유지):
```
title: '나와라 박병장!',
subtitle: '석조무사가 학창시절 같은반 친구 박병장을 불러 실습생을 도와줍니다!',
```
기존 `toastText: '공군병장 박병장 출동!'` 필드는 **삭제한다** (새 2단 박스가 완전히 대체하며, 현재 이 필드는 `drawAirplane` 이후 토스트 렌더 블록 1곳에서만 사용됨 — game.js:3524).

`toastDuration`: `1200` → `2600` (ms). 비행기 flyDuration 2400ms보다 200ms 길게 설정해 비행기가 막 사라지는 순간 안내도 함께 자연스럽게 페이드아웃. 300ms fade-out은 기존 공식(`alpha = Math.min(1, remain / 300)`)을 재사용.

## 현재 코드의 관련 위치

| 항목 | 파일 | 라인 |
|---|---|---|
| `AIRFORCE` 상수 정의 | assets/js/game.js | 106~116 |
| `state.airplane` 초기 스키마 | assets/js/game.js | 1001~1007 |
| `triggerAirforceEasterEgg` | assets/js/game.js | 2666~2688 |
| 석조무사 접촉 → 이스터에그 트리거 | assets/js/game.js | 3261~3270 |
| 비행기 렌더 호출 | assets/js/game.js | 3437~3440 |
| **기존 1줄 토스트 렌더 블록 (교체 대상)** | assets/js/game.js | 3510~3526 |
| `CUTSCENES.introStoneGuard` (건드리지 말 것) | assets/js/game.js | 183~186 |
| `reducedMotion` 플래그 | assets/js/game.js | 189 |
| `isLightTheme` 사용 패턴 (참조용) | assets/js/game.js | 3502, 3505 |

## 변경 범위

### pages/game.html 변경사항
- **변경 없음**. DOM/HTML 구조 수정 불필요 (캔버스 렌더 영역에만 존재).

### assets/css/game.css 변경사항
- **변경 없음**. 캔버스 2D 렌더로 처리 — CSS 오버레이가 아니라 canvas context로 직접 그린다. 기존 토스트와 동일한 패턴을 유지한다.

### assets/js/game.js 변경사항

#### A. `AIRFORCE` 상수 (106~116행) 확장
기존 필드 유지 + 아래 필드 추가/변경:
- 추가: `title: '나와라 박병장!'`
- 추가: `subtitle: '석조무사가 학창시절 같은반 친구 박병장을 불러 실습생을 도와줍니다!'`
- 삭제: `toastText: '공군병장 박병장 출동!'` (새 2단 박스가 이를 대체)
- 변경: `toastDuration: 1200` → `toastDuration: 2600`
- 추가(권장): 박스 레이아웃 상수 (세부 튜닝용). 직접 숫자 하드코딩 대신 상수화:
  ```
  toastBoxW: 440,       // px — 박스 폭 (CANVAS_W 640 대비 안전)
  toastBoxH: 62,        // px — 2줄 높이
  toastBoxY: 24,        // px — 상단에서 y (화캉스 y=40과 분리, 충돌 회피)
  toastTitleSize: 18,   // px
  toastSubtitleSize: 13 // px
  ```

#### B. 3510~3526행 토스트 렌더 블록 교체
기존 1줄 토스트를 **2단 박스(제목 큰 글씨 + 본문 작은 글씨)** 로 교체. 의사코드:

```
if (state.airplane.active && now < state.airplane.toastUntil) {
  const remain = state.airplane.toastUntil - now;
  // reduced-motion: alpha 페이드 생략 (상수 1.0). 일반: 마지막 300ms 페이드아웃.
  const alpha = reducedMotion ? 1 : Math.min(1, remain / 300);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const cx = CANVAS_W / 2;
  const boxY = AIRFORCE.toastBoxY;
  const boxW = AIRFORCE.toastBoxW;
  const boxH = AIRFORCE.toastBoxH;

  // 그림자 (offset 2px)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(cx - boxW / 2, boxY + 2, boxW, boxH);

  // 본체 배경 — 테마별 (화캉스 토스트의 웜옐로우 대신 밀리터리/공군 톤 네이비)
  ctx.fillStyle = isLightTheme() ? '#e8edf5' : '#1a2238';
  ctx.fillRect(cx - boxW / 2 + 2, boxY, boxW - 4, boxH - 4);

  // 좌측 엣지 악센트 — 브랜드 코럴 4px 세로 라인 (글래스모피즘 포트폴리오 정체성 유지)
  ctx.fillStyle = isLightTheme() ? '#e85a6a' : '#ff7b7b';
  ctx.fillRect(cx - boxW / 2 + 2, boxY, 4, boxH - 4);

  // 제목
  ctx.fillStyle = isLightTheme() ? '#8a1a2a' : '#ffd0d4';
  ctx.font = `bold ${AIRFORCE.toastTitleSize}px "Pretendard", system-ui, sans-serif`;
  ctx.fillText(AIRFORCE.title, cx, boxY + 18);

  // 본문
  ctx.fillStyle = isLightTheme() ? '#2a2432' : '#e8eaf2';
  ctx.font = `${AIRFORCE.toastSubtitleSize}px "Pretendard", system-ui, sans-serif`;
  ctx.fillText(AIRFORCE.subtitle, cx, boxY + 42);

  ctx.restore();
}
```

**중요 세부**:
1. 텍스트 폭 안전 검증: `AIRFORCE.subtitle`은 "석조무사가 학창시절 같은반 친구 박병장을 불러 실습생을 도와줍니다!" (약 34자). 13px 본문 + 1자당 약 11~12px로 약 400px → boxW=440 이내 1줄에 충분히 들어감. Generator는 구현 후 `ctx.measureText(AIRFORCE.subtitle).width`를 mental check해서 boxW-32 초과 시 subtitle을 2줄로 분리(예: "석조무사가 학창시절 같은반 친구 박병장을 불러" / "실습생을 도와줍니다!")하고 boxH를 78로 확장.
2. 박스 위치 `toastBoxY: 24`는 비행기 y=40(planeY)보다 위. 비행기가 안내 박스 아래쪽을 지나가도록 의도적 배치 (내러티브: 박병장이 날아가면서 실습생을 구한다 → 안내를 "위에서 내려다보는 공지"처럼 배치).
3. 화캉스 보너스 토스트(y=40)는 "일시적 보너스"이고 이 안내는 "서사 이벤트"이므로 둘이 겹치면 서사 안내가 위에 오도록 y를 더 위로.
4. `reducedMotion` 분기는 alpha만 생략 (박스는 계속 보이되 페이드인/아웃 없이 즉시 표시/소거).

#### C. 기타 삭제/정리
- `AIRFORCE.toastText` 참조는 오직 3524행 한 군데이므로 안전하게 제거 가능.
- `state.airplane.toastUntil` 필드는 **그대로 유지**. 새 안내도 같은 필드를 사용해 만료 관리.
- `triggerAirforceEasterEgg` 내부의 `state.airplane.toastUntil = now + AIRFORCE.toastDuration` (2675행) 라인 그대로 유지 — 단지 AIRFORCE.toastDuration 값만 2600으로 커진다.

## 기능 상세

### 기능 1: 박병장 2단 안내 토스트
- 설명: 석조무사 접촉 순간 캔버스 상단 y=24 위치에 제목+본문 2줄 박스가 2.6초간 표시됨
- 사용자 동작: 없음 — 자동 표시/자동 페이드아웃 (게임은 계속 조작 가능)
- 구현 위치: `render()` 함수 내부 3510~3526행 (기존 토스트 블록 교체)
- 세부 요소:
  - 제목 "나와라 박병장!" — 18px bold, 코럴 톤(브랜드 컬러 계열)
  - 본문 "석조무사가 학창시절 같은반 친구 박병장을 불러 실습생을 도와줍니다!" — 13px regular
  - 좌측 4px 코럴 세로 라인 (기존 컷씬 패널의 `border-left: 4px solid var(--brand)` 문법을 캔버스에서 재현)
  - 박스 배경: 다크=`#1a2238`(밀리터리 네이비), 라이트=`#e8edf5`
  - alpha 페이드: 마지막 300ms 선형 감쇠 (reduced-motion에서는 생략)

### 기능 2: 기존 비행기/도망 연출과의 동기화
- 설명: 안내 박스 표시 시간(2.6s)은 비행기 통과 시간(2.4s) + 여유 200ms
- 사용자 동작: 없음
- 구현 위치: `AIRFORCE.toastDuration` 값만 2600으로 조정
- 세부 요소:
  - 비행기 flyDuration 2400ms + 수간호사 fleeDuration 5000ms는 **일체 건드리지 않는다**
  - 토스트만 2600ms로 늘어나 "비행기가 지나간 직후 안내가 페이드아웃" 자연스러운 엔딩

### 기능 3: `CUTSCENES.introStoneGuard` 보존
- 설명: 게임 시작 후 첫 석조무사 등장 시 뜨는 "경고 · 석조무사 출현 / 마주치면 잡혀갑니다" 안내는 **원문 그대로 유지**
- 사용자 동작: Enter/Space로 닫기 (기존 컷씬 동작 유지)
- 구현 위치: `CUTSCENES.introStoneGuard` (game.js 183~186) — **변경 금지**
- 세부 요소:
  - 이것이 있어야 "위협으로 안내했지만 사실은 친구였다"는 반전이 성립한다
  - 이 컷씬이 사라지거나 텍스트가 바뀌면 SPEC 위반

## 주의사항

### 기존 기능과 충돌 가능성
- **화캉스 보너스 토스트(y=40)와 동시 출현 가능성**: 석조무사 접촉과 변기 수집이 동시에 일어나는 경우 두 토스트가 겹칠 수 있다. 박병장 박스 y=24, 화캉스 y=40 → 수직 위치 분리로 시각 겹침 회피. 박스 높이 62px이므로 y=24부터 y=86까지 점유 → 화캉스(y=40, 32px height: y=24~56)와 겹치지만, 박병장이 위 레이어에 그려지므로(렌더 순서상 나중) 가독성 우선됨. Generator는 박병장 박스가 렌더 순서상 화캉스 토스트 **뒤에** 그려지도록 유지 (기존 블록 순서가 그렇다).
- **드로 순서 유지**: 박병장 토스트 렌더 블록은 반드시 `if (now < state.toiletToastUntil) {...}` 블록 **다음**에 위치해야 한다 (최상위 레이어).

### 삭제/수정해야 할 기존 코드
- `AIRFORCE.toastText` 필드 삭제 (3524행의 `ctx.fillText(AIRFORCE.toastText, ...)`가 새 렌더로 교체되면서 더 이상 참조 없음)
- 기존 3510~3526행 블록을 새 2단 박스 블록으로 통째 교체

### 접근성/보안 고려사항
- **보안**: `AIRFORCE.title`, `AIRFORCE.subtitle`은 상수 문자열이고 `ctx.fillText`로 canvas에 직접 그리므로 XSS 무관. `esc()`/`safeUrl()` 불필요.
- **접근성 — prefers-reduced-motion**: 
  - 기존 `reducedMotion` 플래그(game.js:189) 참조
  - alpha 페이드 공식 `alpha = Math.min(1, remain / 300)` → `reducedMotion ? 1 : Math.min(1, remain / 300)`로 변경
  - 박스 자체는 표시해야 한다(내러티브 정보 전달이 목적). 단지 페이드 애니메이션만 생략.
- **스크린리더**: canvas 2D 렌더는 스크린리더에 노출되지 않지만, 기존 토스트(`AIRFORCE.toastText`)도 동일한 한계를 가졌으므로 현재 SPEC 범위 밖. 추후 개선 과제.
- **테마 대응**: `isLightTheme()` 분기로 다크/라이트 색상 모두 지정. 하드코딩 hex는 캔버스 렌더의 기존 관례(`'#ff7b7b'` 등)를 따르며, 글로벌 CSS 변수에 영향 없음.

### 평가 기준 자체 점검 가이드
Generator는 구현 후 SELF_CHECK.md에 아래를 확인:
- [ ] `AIRFORCE.title`, `AIRFORCE.subtitle` 상수화 완료 (하드코딩 문자열 아님)
- [ ] `AIRFORCE.toastText` 필드 제거 및 모든 참조 제거
- [ ] `AIRFORCE.toastDuration` 2600ms로 변경
- [ ] 기존 `triggerAirforceEasterEgg`, `startChiefFlee`, `updateAirplane`, `drawAirplane` 로직 무변경
- [ ] `CUTSCENES.introStoneGuard` 텍스트 원문 유지 ("경고 · 석조무사 출현" / "마주치면 잡혀갑니다" 포함)
- [ ] 2단 박스 렌더 순서가 화캉스 토스트 블록 뒤에 위치
- [ ] `reducedMotion`에서 alpha 페이드 생략
- [ ] 다크/라이트 테마 모두 색상 지정
- [ ] subtitle 텍스트 폭이 boxW 이내 확인 (초과 시 2줄 분리)
- [ ] CSS/HTML 파일 무변경
