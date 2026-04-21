# SPEC.md — 게임 화면 모바일 비율 정상화

## 개요
`pages/game.html`의 게임 캔버스가 모바일(≤520px)에서 레이아웃이 깨지는 문제를 수정한다. 현재 `#gameCanvas`의 내부 해상도는 640×400(16:10)으로 고정되어 있는데, 모바일 브레이크포인트에서 `.game-canvas-wrap`의 `aspect-ratio`가 `4/3`으로 바뀌면서 캔버스 픽셀 아트가 세로로 늘어나 왜곡된다. 또한 좁은 뷰포트에서 HUD 라벨/값 줄바꿈, D-pad와 캔버스가 세로로 합쳐져 뷰포트 높이를 초과하는 문제가 있다.

## 변경 유형
**디자인** (레이아웃·비율·반응형 조정만, 게임 로직·JS 동작 변경 없음)

## 디자인 언어 & 의도
픽셀 아트의 선명함과 정사각형 타일의 "원래 비율"을 지키는 것이 이 게임의 정체성이다. 모바일에서도 타일이 정확한 정방형으로 보이게 하고, 캔버스-HUD-D-pad가 뷰포트 안에서 한 호흡으로 읽히게 배치해 "작은 방에서 숨 고르기" 톤을 유지한다. 왜곡 없는 16:10 비율과 여유 있는 여백으로, 모바일에서도 데스크톱과 동일한 완성도를 느끼게 한다.

## Sprint 범위 계약
- **허용**: `pages/game.html`, `assets/css/game.css`의 레이아웃·반응형 CSS 수정, `viewport` 메타 태그 조정, 캔버스 래퍼 비율/여백/스케일링 관련 변경. HUD/D-pad 모바일 배치 미세 조정.
- **금지**: 게임 로직(`assets/js/game.js`) 변경, 새 기능 추가(스와이프 입력 등), 난이도·점수 시스템 수정, `index.html`·`assets/css/style.css`·`assets/js/main.js` 수정.
- **판단 기준**: "이 변경이 없으면 모바일에서 캔버스 비율이 여전히 깨지는가?" → YES면 허용, NO면 금지. 단, `user-scalable=no` 같은 접근성 저해 메타는 이번에 함께 교정한다(깨짐의 부수 원인).

## 변경 범위

### pages/game.html 변경사항
- `<meta name="viewport">` 콘텐츠에서 `user-scalable=no, maximum-scale=1` 제거 → `"width=device-width, initial-scale=1.0, viewport-fit=cover"`로 단순화. 접근성(사용자 확대) 보장 + iOS 자동 확대로 인한 레이아웃 틀어짐 방지.
- HTML DOM 구조·클래스는 변경하지 않는다.

### assets/css/game.css 변경사항

**1) `.game-canvas-wrap` — 캔버스 비율 16:10 통일**
- 기본 `aspect-ratio: 16 / 10` 유지.
- **@media (max-width: 520px) 내의 `aspect-ratio: 4 / 3` 오버라이드 제거** (왜곡의 직접 원인).

**2) `body.game-page` 모바일 여백 최적화**
- @media (max-width: 520px): `padding: 12px 10px 24px`, `gap: 12px`.

**3) `.game-stage` 모바일 패딩**
- @media (max-width: 520px): `padding: 10px`, `gap: 10px`.

**4) `.game-hud` 모바일**
- @media (max-width: 520px): `gap: 8px`, `padding: 6px 2px`.

**5) `.game-touchpad__dpad` 모바일 크기**
- 기본값 유지(확대 제거). @media (max-width: 520px)에서 192×192 오버라이드가 있으면 168×168로 낮춘다.

**6) 가로 모드 대응**
- `@media (max-width: 520px) and (orientation: landscape)` 신설:
  - `.game-header { display: none; }`
  - `.game-canvas-wrap { max-height: 60vh; aspect-ratio: 16 / 10; width: auto; margin-inline: auto; }`
  - `.game-touchpad__dpad { width: 128px; height: 128px; }`
  - `.game-stage { padding: 8px; gap: 8px; }`

### assets/js/game.js 변경사항
- **변경 없음**. 캔버스 내부 해상도(640×400)와 그리기 로직 보존.

## 주의사항
- **브레이크포인트 규칙 준수**: `@media (max-width: 520px)` 단일 브레이크포인트 원칙. landscape는 orientation 조합으로만 추가.
- **캔버스 내부 해상도 변경 금지**: 640×400 고정.
- **접근성**: `user-scalable=no` 제거.
- **하드코딩 색상 금지**: 기존 CSS 변수만 사용.
- **기능 보전**: 터치/포인터 이벤트, 클래스/ID 변경 금지.

관련 파일:
- `pages/game.html`
- `assets/css/game.css`
- `assets/js/game.js` (참조만)
