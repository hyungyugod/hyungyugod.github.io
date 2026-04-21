# 자체 점검

## SPEC 기능 체크
- [x] **viewport 메타 정상화**: `pages/game.html`의 viewport를 `"width=device-width, initial-scale=1.0, viewport-fit=cover"`로 단순화. `user-scalable=no, maximum-scale=1` 제거(접근성 확보, iOS 자동 확대 회피).
- [x] **모바일 4/3 aspect-ratio 오버라이드 제거**: `@media (max-width: 520px)` 블록 내부의 `.game-canvas-wrap { aspect-ratio: 4 / 3 }` 제거. 이제 기본 `16 / 10`이 모바일에서도 유지되어 640×400 캔버스 픽셀 아트 왜곡 없음.
- [x] **body.game-page 모바일 여백**: `padding: 12px 10px 24px; gap: 12px;`로 조정.
- [x] **.game-stage 모바일**: `padding: 10px; gap: 10px;`.
- [x] **.game-hud 모바일**: `gap: 8px; padding: 6px 2px;`.
- [x] **.game-touchpad__dpad 모바일**: 192×192 → 168×168로 축소(기본값과 동일화, 오버라이드만 168로 명시).
- [x] **landscape 미디어쿼리 신설**: `@media (max-width: 520px) and (orientation: landscape)` — header 숨김, 캔버스 `max-height: 60vh` + `16/10` 재지정 + `width: auto` + `margin-inline: auto`, d-pad 128×128, stage padding/gap 8px.

## 패턴 준수 확인
- BEM 네이밍: 준수 (기존 클래스만 사용, 신규 클래스 없음)
- CSS 변수 사용: 준수 (하드코딩 색상 없음, 수치 값만 조정)
- CSS 네이티브 중첩: 준수 (새 중첩 블록 추가 없음, 기존 `&` 패턴 그대로)
- 반응형 520px: 준수 (단일 브레이크포인트 원칙, landscape는 orientation 조합으로만 추가)
- reduced-motion: 기존 블록 유지(동작 변경 없음)
- esc()/safeUrl(): 해당 없음 (외부 데이터 주입 없음)
- 가드 클래스: 해당 없음 (JS 변경 없음)
- DOMContentLoaded 등록: 해당 없음 (JS 변경 없음)
- -webkit-backdrop-filter: 기존 블록 유지 (이번 변경에서 backdrop-filter 신규 없음)
- 파일 간 정합성: 클래스명/ID 변경 없음. `pages/game.html` DOM 그대로, `assets/js/game.js` 미변경.

## 범위 준수
- SPEC에 명시된 파일(`pages/game.html`, `assets/css/game.css`)만 수정.
- `assets/js/game.js`, `index.html`, `assets/css/style.css`, `assets/js/main.js` 미변경.
- SPEC 외 변경 없음.
