# 자체 점검

## SPEC 기능 체크
- [x] **TARGET_SCORE 갱신**: `easy:50, normal:30, hard:40` — SPEC 표 그대로 반영
- [x] **DIFFICULTY 재배치**: 기존 hard 파라미터 → normal로 이동, 새 hard는 SPEC 강화 표(notes 4, noteTtl 2800, obstacles 6, maxObstacles 14, obsBaseSpeed 200→340, spawnInterval [0.8,0.25], throwBurst 4)로 덮어쓰기
- [x] **PROFESSOR 상수**: `patrolSpeed:70, throwInterval:[2.5,1.4], stethoSpeed:220, stethoMax:4, freezeDuration:2000`
- [x] **state.professor 객체**: 수간호사와 동일 구조 + active 토글
- [x] **state.stethoscopes 배열**: 청진기 투사체 풀
- [x] **state.player.frozenUntil**: 별도 필드 (stunUntil 보존)
- [x] **이교수 스프라이트**: SPEC 도트 패턴 16×20 정확 반영, dir별 변형(up/left/right) + 걷기 프레임 + 투척 자세
- [x] **getProfessorPalette + 캐시 + 테마 토글 무효화** (chiefPaletteCache 패턴 미러링)
- [x] **drawProfessor / drawStethoscope** — 후자는 ctx.save/translate/rotate/restore + reduced-motion 시 회전 비활성
- [x] **initProfessor** — 8자(figure-8) 패트롤, farthest-first 시작점, 첫 투척 3.0s 대기
- [x] **updateProfessor** — 패트롤 + 텔레그래프 0.4s + 투척 (drawNurseChief 패턴 미러링)
- [x] **spawnStethoscopeFromProfessor** — 발사 시점 플레이어 단위벡터 × 220 px/s, 12px 오프셋
- [x] **드로잉 텔레그래프(!)** — 코럴핑크(`#ff7b7b` / 라이트 `#e85a6a`)로 수간호사(빨강) 와 구분
- [x] **update() 입력 차단**: `frozen = now < p.frozenUntil` → `immobile = stunned || frozen` 로 OR 결합
- [x] **청진기 이동 + 벽/화면 밖 소멸** (관통 X)
- [x] **청진기 충돌 처리**: `frozenUntil = now + 2000`, 청진기 제거, 콤보 0, `playTone(440,0.08)` + 100ms 후 `playTone(220,0.15)`, **즉사/hits 증가 X**
- [x] **이교수 본체 충돌 즉사** (수간호사와 동일 처리)
- [x] **render()**: 이교수+텔레그래프, 청진기 회전 드로잉, frozen 깜빡임(80ms 주기) + 발 밑 코럴 청진기 인디케이터
- [x] **startGame()**: hard일 때만 `initProfessor()`, 그 외 `state.professor.active = false`. stethoscopes/frozenUntil 리셋
- [x] **btnBackToDifficulty**: stethoscopes/professor.active/frozenUntil 리셋 추가
- [x] **initNurseChief hard 분기 속도 80→100**
- [x] **renderPreview()**: hard 미리보기 시 이교수+청진기 추가 표시
- [x] **CSS :root + :root.light(html.light)** 양쪽에 prof-* 변수 11개 추가
- [x] **game.html 시작 오버레이 hint** 한 줄 추가

## 패턴 준수 확인
- **BEM 네이밍**: 신규 CSS 클래스 추가 없음 (SPEC: "새 CSS 클래스 금지" 준수). 기존 `.game-overlay__hint` 재사용
- **CSS 변수 사용**: 이교수 11개 변수 모두 :root 양쪽 정의, JS에선 `getComputedStyle(...).getPropertyValue('--prof-*')`로 읽기. 하드코딩 색상은 fallback과 텔레그래프(코럴) 한정
- **CSS 네이티브 중첩**: 신규 규칙 없으므로 해당 없음
- **반응형 520px**: 신규 시각 요소는 캔버스 내부(이교수/청진기/인디케이터)이므로 기존 캔버스 반응형 규칙에 자동 편승. CSS 변수만 추가
- **reduced-motion 대응**:
  - 청진기 회전 비활성 (`if (rot && !reducedMotion) ctx.rotate(rot);`)
  - 텔레그래프 깜빡임 비활성 (drawProfessorTelegraph)
  - 깜빡임 비활성 (`blinkVisible = reducedMotion || ...`)
  - frozen 메커닉 자체는 적용 (SPEC: "단 frozen 메커닉 자체는 적용")
- **esc()/safeUrl()**: 외부 데이터 주입 없음 (Canvas + 정적 hint 텍스트). 해당 없음
- **가드 클래스**: `if (!prof.active || !prof.patrolPath.length) return;` (updateProfessor)
- **DOMContentLoaded 등록**: 게임은 IIFE 즉시 실행 구조로 main.js의 DOMContentLoaded 패턴과 별개. 기존 패턴 그대로 유지
- **-webkit-backdrop-filter**: 신규 backdrop-filter 규칙 추가 없음
- **파일 간 정합성**:
  - `--prof-*` 변수 → CSS와 JS의 `readVar('--prof-*')` 키 정확 일치
  - `state.professor` 필드 → startGame/update/render/back-to-difficulty 모두 일관 참조
  - `PROFESSOR.freezeDuration` → SPEC `state.player.frozenUntil = now + 2000` 정확 반영
  - `pages/game.html` hint 추가 위치는 기존 `.game-overlay__hint` 클래스 재사용

## 범위 위반 검사
- **금지 항목 체크**: 제3 NPC X, 청진기 외 신규 투사체 X, 신규 컷씬/효과음 시스템 X, 게임시간/콤보/F 즉사 룰 변경 X, 신규 비주얼 효과 X
- **허용 항목으로 추가한 것**:
  - 청진기 충돌 처리 분기 (장애물 충돌 위에 별도 루프)
  - state 확장 + startGame/back-to-difficulty 리셋
  - renderPreview hard 분기 갱신 (SPEC 명시 항목)
  - DIFFICULTY normal/hard 두 분기 모두 갱신 (SPEC 표 그대로)
  - `drawProfessorTelegraph` — drawTelegraph 미러링이지만 색상만 코럴로 분리 (SPEC: "이교수 텔레그래프(!)는 코럴핑크로 표시 → 두 적 구분")

전략: 최초 구현이므로 Case 미해당 — SPEC 표/도트 패턴/타이밍 수치 정밀 적용.
