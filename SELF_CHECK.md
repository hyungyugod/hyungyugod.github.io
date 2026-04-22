# 자체 점검

## SPEC 기능 체크
- [x] HTML: `#rotateHint` 회전 안내 오버레이 추가 (role=dialog, aria-labelledby, 초기 hidden)
- [x] HTML: 시작 오버레이 힌트 문구 "모바일 방향패드" → "모바일: 화면을 터치한 방향으로 이동"
- [x] HTML: `.game-touchpad` 블록은 그대로 유지 (CSS로 모바일에서 숨김)
- [x] CSS: `.game-rotate-hint` glassmorphism 패널 + `gameRotateSpin` keyframes
- [x] CSS: `@media (max-width:520px) and (orientation: portrait)` — `.game-touchpad { display: none !important; }`
- [x] CSS: `@media (max-width:520px) and (orientation: landscape)` — topbar/header/footer/controls/touchpad 숨김, shell padding 최소화, 캔버스 `max-height: calc(100dvh - 60px)` + vh fallback, `touch-action: none; cursor: pointer;`
- [x] CSS: `prefers-reduced-motion: reduce`에서 `.game-rotate-hint__icon` animation 제거
- [x] JS: `initTouchControls()` 리팩터 — D-pad 버튼 루프 제거, `pad.hidden = false` 제거, `canvas touchmove preventDefault` 유지, `initCanvasTapMove()` 호출
- [x] JS: `initCanvasTapMove()` 신규 — pointerdown/move/up/cancel/leave, rect 기반 좌표 환산, `TILE * 0.4` 데드존, 우세 축 4방향, 오버레이 활성 시 early-return, 드래그 중 실시간 갱신
- [x] JS: `initOrientationHint()` 신규 — `matchMedia('(max-width: 520px) and (orientation: portrait)')` 초기 1회 + change 리스너, `hidden`/`aria-hidden`/`.is-visible` 토글
- [x] JS: `if (isTouchDevice()) initTouchControls();` 유지 + `initOrientationHint();` 무조건 호출
- [x] JS: 데스크탑 키보드 경로(`KEY_MAP`, keydown/keyup) 변경 없음

## 패턴 준수 확인
- BEM 네이밍: 준수 — `.game-rotate-hint`, `__panel`, `__icon`, `__title`, `__desc`, 상태 클래스 `is-visible`
- CSS 변수 사용: 준수 — `--bg-card`, `--border`, `--brand-40`, `--brand-12`, `--brand-14`, `--brand-light`, `--text`, `--text-muted`, `--radius`, `--font-serif` 사용. 하드코딩은 오버레이 배경 `rgba(9,8,15,0.88)` / `rgba(245,244,248,0.88)`뿐 (기존 `.game-overlay`가 동일 패턴으로 하드코딩 사용 중이어서 일관성 유지)
- CSS 네이티브 중첩: 준수 — `& .game-rotate-hint__panel`, `&[hidden]` 등 `&` 문법
- 반응형 520px: 대응 — portrait/landscape 미디어쿼리 양쪽 분기 완비
- reduced-motion: 대응 — `.game-rotate-hint__icon { animation: none; }` 추가
- esc()/safeUrl(): 해당 없음 (외부 데이터 삽입 없음)
- 가드 클래스: 적용 — `if (!canvas) return;`, `if (!hint) return;`, `if (!p) return null;`, `if (rect.width === 0 ...)`
- DOMContentLoaded 등록: N/A — game.js는 IIFE 구조로 초기화 블록에서 `initOrientationHint()` 호출
- -webkit-backdrop-filter: `.game-rotate-hint`와 `__panel` 모두 `-webkit-backdrop-filter` 함께 작성
- 파일 간 정합성: `#rotateHint`, `#gameCanvas`, `.game-canvas-wrap`, `.game-touchpad` 클래스/ID 모두 HTML·CSS·JS 간 일치

## 범위 준수
- Sprint 범위 계약 준수 — SPEC에 없는 제스처(스와이프/더블탭/핀치), 게임 로직 변경, 키보드 경로 변경, orientation lock API 사용 없음
- 메인 사이트 파일(`index.html`, `style.css`, `main.js`) 건드리지 않음

## 주의한 부분
- `activePointerId`로 멀티터치에서 첫 포인터만 추적 (두 손가락 충돌 방지)
- `isAnyOverlayOpen()`을 재사용하여 시작/컷씬/종료 오버레이 모두 대응 (SPEC 요구 3개 오버레이 커버)
- `pointermove`에서도 `isAnyOverlayOpen()` 체크 후 `clearKeys()` 호출 — 오버레이가 도중에 열리면 이동 즉시 정지
- `100dvh` 주 규칙 뒤에 `100vh` fallback을 같은 속성에 중복 선언 (오래된 브라우저 폴백)
