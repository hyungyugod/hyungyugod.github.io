# 자체 점검

## SPEC 기능 체크
- [x] 기능 1 — 양쪽 4방향 D-pad: `.game-joycon--left`와 `.game-joycon--right` 양쪽 모두 up/left/right/down 4버튼으로 통일. 총 8버튼.
- [x] 기능 2 — 좌/우 동일 dir 중복 입력 정확 해제: 클로저 상단의 `dpadPressCount` 카운터로 +1/−1 하고, 0일 때만 `state.keys[dir] = false`.
- [x] 기능 3 — 오버레이 전환 시 안전 리셋: `clearDpadPressed()`에서 `.is-pressed` 제거 + `dpadPressCount` 네 방향 모두 0 리셋.

## 필수 연동 변경 (SPEC 허용 범위)
- HTML: 양쪽 조이콘 블록에 누락 키 추가 (좌측 right, 우측 left).
- CSS: `.game-joycon` 그리드 3×3 십자형으로 통합, 좌/우 전용 배치 블록 삭제.
- CSS: `max-width: calc(100vw - 280px)` → `calc(100vw - 340px)` (SPEC에서 명시적 허용).
- JS: `initDualDpad` 레퍼런스 카운팅 리팩터, `activePointerId` 중복 가드 유지.

## 범위 외 미구현
- 없음. 새 애니메이션/색/버튼 추가 없음. `initCanvasTapMove` 변경 없음. `prefers-reduced-motion`/`:focus-visible` 블록 건드리지 않음.

## 패턴 준수 확인
- BEM 네이밍: 준수 — 기존 `.game-joycon__btn--{up,down,left,right}` 그대로 사용.
- CSS 변수 사용: 준수 — 색/투명도 변형 변경 없음, 하드코딩 추가 없음.
- CSS 네이티브 중첩: 준수 — `.game-joycon { & .game-joycon__btn--... }` 형태의 네이티브 `&` 중첩.
- 반응형 520px: 준수 — 캔버스 가용 폭 조정은 `body.is-touch.is-landscape` 블록 내부. 기존 520px 미디어쿼리 수정 없음.
- reduced-motion: 준수 — 기존 `.game-joycon__btn` transition/pressed 처리 블록 그대로 유지.
- esc()/safeUrl(): 해당 없음 — 외부 데이터 innerHTML 주입 없음.
- 가드 클래스: 준수 — `if (!root) return;` 유지, 추가로 `if (activePointerId !== null) return;` 중복 포인터 가드.
- DOMContentLoaded 등록: 해당 없음 — `initDualDpad`는 기존대로 `initTouchControls` 경로에서 호출됨(변경 없음).
- -webkit-backdrop-filter: 해당 없음 — 새 backdrop-filter 추가 없음.
- 파일 간 정합성: HTML `data-dir` 값(`up|down|left|right`) ↔ CSS `--up/--down/--left/--right` ↔ JS `dpadPressCount[dir]` 키 모두 일치.

## 특기사항
- 키보드 경로(`state.keys[dir]` 직접 set)는 카운터를 거치지 않으므로 영향 없음. `clearDpadPressed()`의 카운터 리셋은 팬텀 입력 방지 측면에서 안전 측으로 동작(키보드 입력 중에는 오버레이가 열리면 게임 로직이 키 상태를 별도 관리).
- `pointerleave`로 인한 해제도 같은 `release()` 경로를 거쳐 카운터가 정확히 1만 감소한다(`activePointerId === e.pointerId` 일치 조건).
