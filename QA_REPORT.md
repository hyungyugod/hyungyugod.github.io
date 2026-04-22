# QA 검수 보고서 — 모바일 듀얼 D-Pad 조이콘

## UI 동작 검증
대상이 `pages/game.html`이며 SPEC이 스코프를 게임 파일로 한정. `npm run ui-check`는 포트폴리오 `index.html` 플로우 대상이므로 비적용 — **정적 분석만 수행**. (UI 체크 패널티 비적용.)

권장 수동 검증:
- 모바일 가로 520px 이하에서 좌/우 조이콘 6개 노출
- 동시 입력 시 대각선 이동
- 세로 모드 전환 시 조이콘 숨김 + 회전 안내 노출
- `pointerleave`에서 `is-pressed` 해제

## SPEC 기능 검증

| 기능 | 결과 | 증거 |
|---|---|---|
| 1. 듀얼 D-Pad 표시 | PASS | `pages/game.html:130-141` `#gameJoycons` + data-dir 6개 |
| 2. 터치→키 브릿지 | PASS | `game.js:1579-1616` Pointer Events → `state.keys[dir]` |
| 3. 시각적 피드백 | PASS | `game.css:710-717` `:active/.is-pressed` scale+glow |
| 4. 캔버스 축소 | PASS | `game.css:1015` `max-width: calc(100vw - 280px)` |
| 5. 조건부 가시성 | PASS | 기본 none → landscape flex, portrait `!important` 재숨김 |
| 구 `.game-touchpad` 제거 | PASS | HTML/CSS/JS 전수 grep 0건 |
| 오버레이 전환 press 정리 | PASS | `clearDpadPressed()` → `startGame:842`, `endGame:900` |

## 결과 요약
- P0 치명: 0건
- P1 중요: 0건
- P2 권장: 2건

## P2 권장
1. `game.js:1613` — `pointerleave`는 캡처 실패 환경 폴백. 현재 설계 의도와 일치하므로 유지 타당.
2. `game.css:666-668` — `.game-joycons` 내부 `&[hidden]` 중첩 중복. 기본 `display:none` 규칙이 있으므로 삭제 가능(사소).

## 통과 항목
- 보안: 외부 데이터 없음, esc/safeUrl 불필요, 인라인 핸들러/eval 없음
- CSS: BEM 준수(`--left/--right`, `__btn--up/left/right/down`), 네이티브 `&` 중첩, 토큰 재사용, `-webkit-backdrop-filter` 병기, `!important`는 reduced-motion 및 portrait 재숨김으로 정당화
- JS: 선언식 함수 + 화살표 콜백, 가드 클래스, `setPointerCapture` try/catch, DOMContentLoaded 흐름 재사용
- HTML: 한국어 aria-label 6개, `type="button"`, `aria-hidden`/`hidden` 초기값
- 반응형: 520px + orientation + 360px 높이 3단 분기, `prefers-reduced-motion` 대응, `:focus-visible` 아웃라인
- 정합성: `#gameJoycons`/`.game-joycon__btn`/`data-dir` HTML·CSS·JS 3-way 일치
- Sprint 범위: index.html/style.css/main.js 무변경, 게임 로직 무변경, 팔레트·폰트 미추가

## 채점 (기능 변경)
- 패턴 일관성: **9/10**
- 보안 & 접근성: **9/10**
- 반응형 & UI 품질: **9/10**
- 기능 완성도: **10/10**

**가중**: 9×0.4 + 9×0.25 + 9×0.2 + 10×0.15 = **9.15 / 10.0**

## 자기 검토
SPEC이 명확했고 Generator가 거의 문자 그대로 구현. 하드코딩 색상 없음, BEM 위반 없음, 포커스/reduced-motion 모두 처리, 범위 위반 없음. P2 2건은 실제로 사소. 점수 유지.

## 최종 판정: **합격**

현 상태로 머지 가능. 개선 지시는 모두 P2(선택).
