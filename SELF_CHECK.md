# 자체 점검

전략: Case A — 이유: 초기 구현이므로 SPEC 지시를 정밀 적용.

## SPEC 기능 체크

### 기능 1: 성공 시 "HG 실습 작곡 노래 듣기" 외부 링크
- [x] `pages/game.html` #overlayEnd `.game-cta` **맨 앞**에 정적 `<a id="btnListenTrack" class="game-btn game-btn--listen is-hidden">` 삽입.
- [x] `href="https://www.youtube.com/watch?v=_lIkCnyABVA&list=LL&index=27"`, `target="_blank"`, `rel="noopener noreferrer"`, `aria-label="HG가 실습때 만든 노래 새 탭에서 듣기"`.
- [x] 레이블 `🎵 HG가 실습때 만든 노래 듣기` (정적 텍스트).
- [x] `endGame()` success 분기에서 `btnListenTrack.classList.remove('is-hidden')` + `endCta.classList.add('game-cta--success')`.
- [x] `endGame()` 초입, `startGame()`, `btnBackToDifficulty` 3곳에서 숨김 + layout 리셋 (잔존 0).
- [x] Playwright로 iPhone SE(375×667)에서 4버튼 no-scroll fit 확인: `overlayEnd.scrollHeight === clientHeight === 667`, `overflow-y: hidden` 유지.
- [x] 데스크톱에서 Tab 첫 포커스 = listen 버튼 (DOM 순서 일치 확인).
- [x] 실패 분기(is-hidden 유지 + success 토글 제거) → `display: none`, 그리드 3열 복귀 확인.

### 기능 2: 수간호사 본체 직접 충돌 즉사
- [x] `update(dt, now)` 내 F 충돌 루프 **직전**에 신규 블록 삽입 (F 루프 자체는 변경 없음).
- [x] `state.nurseChief.active` 가드 → 초기/비활성 상태에선 검사 스킵.
- [x] 히트박스 14×14 (SPEC 지정), 중앙 앵커 (`cx = chief.x - 7, cy = chief.y - 7`).
- [x] AABB 겹침 시 hits+1, combo=0, `updateComboHud(false)`, 저음 2연타(`playTone(110,0.25)` + 100ms 후 `playTone(82,0.35)`), 셰이크 + 비네트 (reduced-motion 스킵), `state.gameoverReason='hit'`, `endGame()`, `return`.
- [x] `gameoverReason='hit' && !success` 기존 분기가 "수간호사에게 걸렸어요!" 제목을 자동으로 표시 — 서사 정합.

## 패턴 준수 확인
- **BEM 네이밍**: 준수. `.game-btn--listen`, `.game-cta--success` 모두 block__element--modifier 패턴.
- **CSS 변수 사용**: 준수. `--brand-20 / --brand-60 / --brand-light / --brand-14 / --brand-35 / --brand` 만 사용. 하드코딩 색상 0.
- **CSS 네이티브 중첩**: 준수. `&--listen`, `&.is-hidden`, `&.game-cta--success`, `&.game-cta--success .game-btn--listen` 모두 `&` 문법.
- **반응형 520px**: 대응. `@media (max-width:520px)` 스코프에도 `.game-cta--success` 규칙 동일 적용 (gap 5px→4px로 1px 단축 허용 범위 내).
- **reduced-motion**: 기존 규칙이 `canvas-wrap.is-shake / is-gameover` 애니메이션을 비활성화하고 있음 — 수간호사 충돌도 동일 클래스를 사용하므로 자동 상속. `!reducedMotion` 가드로 시각 효과만 생략(판정은 동작).
- **esc() / safeUrl()**: 해당 없음 — 이번 SPEC은 외부 데이터 삽입이 없으며, URL은 HTML 정적 기록 + `innerHTML` 사용 0건.
- **가드 클래스**: 적용. `if (btnListenTrack)`, `if (endCta)`, `if (state.nurseChief.active)` 모두 early return / 조건부.
- **DOMContentLoaded 등록**: 기존 파일이 최상위 IIFE 안에 있으며 새 기능은 기존 endGame/startGame/btnBackToDifficulty 내부에 주입되므로 별도 등록 불필요.
- **-webkit-backdrop-filter**: 이번 SPEC은 `backdrop-filter` 신규 사용 없음 — 기존 `.game-overlay`, `.game-overlay__panel` 규칙을 그대로 재사용.
- **파일 간 정합성**:
  - HTML `id="btnListenTrack"` ↔ JS `document.getElementById('btnListenTrack')` 일치.
  - HTML class `.game-btn--listen` ↔ CSS `.game-btn { &--listen }` 일치.
  - JS 토글 클래스 `is-hidden` / `game-cta--success` ↔ CSS `.game-btn { &.is-hidden }` / `#overlayEnd .game-overlay__panel--end .game-cta { &.game-cta--success }` 일치.

## 범위 준수
- SPEC "허용" 범위 내 변경만 수행: CTA 레이아웃 재조정(4버튼 수용), endGame success 분기 재활용, 수간호사-플레이어 AABB 충돌 분기 추가.
- "금지" 변경 없음: 난이도/사운드/파티클/수간호사 스프라이트/F 투척 로직/점수·시간 상수/새 best 키 건드리지 않음.
- 기존 F 충돌 블록(L1374~) 수정 0 — 신규 블록을 **앞에** 추가하는 방식.
- 기존 `:root` CSS 변수 삭제/변경 0건 (이번에는 새 변수도 추가하지 않았음 — 기존 brand 팔레트로 충분).

## 프리뷰 브라우저 검증 결과 (Playwright + localhost:3000)
- iPhone SE (375×667) 성공 상태: listen 버튼 full-width(310px), 2×2 grid(153px×153px), overlayEnd scroll 0, pageerror 0.
- Desktop (1280×800) 성공 상태: 2-col grid(168px×168px), listen `grid-column: 1 / -1` (342px), Tab 첫 포커스 = btnListenTrack.
- 실패 상태: listen `display:none`, CTA 3열(110px×3) 복귀.
- `href / target / rel / aria-label` 전부 SPEC 스펙 그대로 적용 확인.
