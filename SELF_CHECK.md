# 자체 점검

전략: Case A — 최초 구현 라운드. SPEC에 명시된 수정 범위와 금지 사항을 그대로 준수.

## SPEC 기능 체크
- [x] CSS 변수 추가: `:root`와 `html.light`에 `--stone-guard-*` 7종 팔레트 추가 (SPEC 기재 값 그대로)
- [x] 팔레트 캐시: `stoneGuardPaletteCache` 선언 + 테마 토글 핸들러에서 `null` 무효화
- [x] `STONE_GUARD` 상수 블록: `PROFESSOR` 바로 아래에 `{ patrolSpeed: 55, hitbox: 14 }` 추가
- [x] `state.stoneGuard` 객체: `state.professor` 옆에 추가 (x,y,dir,frameAcc,frame,patrolPath,patrolIdx,active)
- [x] `stoneGuardSprite(dir, frame)`: 16×20 도트. U/u/P/K/H/E/B 7종 CSS 변수 사용. 짧은 검정 머리 + 남색 교복 + 세로 단추 음영 + 검정 구두. 수간호사 캡/십자 없음, 이교수 안경/V자 라펠 없음. up/left/right 분기, frame 1/2 발 교차
- [x] `getStoneGuardPalette()`: CSS 변수 7개 readVar + 캐시
- [x] `drawStoneGuard()`: drawProfessor 단순판 (텔레그래프/투척팔 없음)
- [x] `initStoneGuard()`: 4지점 사각 순환 경로(leftX/rightX/topY/bottomY = TILE*4,COLS-5,4,ROWS-5). 벽 타일이면 가장 가까운 빈 셀 선형 탐색으로 클램프. 플레이어 spawn에서 farthest-first로 첫 진입 포인트 선택. `active=true`
- [x] `updateStoneGuard(dt, now)`: 순수 이동형. 투척/텔레그래프/타이머 없음. 목표점 이동 + dir 갱신 + `frameAcc > 0.22` 걷기 프레임 + reducedMotion 시 frame=0 고정
- [x] `startGame` 분기: `state.difficulty === 'normal'`이면 `initStoneGuard()`, 그 외는 `state.stoneGuard.active = false`
- [x] replay 리셋 블록: "난이도 다시 선택" 핸들러에 `state.stoneGuard.active = false` 추가
- [x] 메인 루프: `updateProfessor` 다음에 `updateStoneGuard(dtSlow, now)` 호출
- [x] 렌더: 이교수 드로잉 블록 다음에 `if (sg.active) drawStoneGuard(...)` 호출
- [x] 플레이어-석조무사 AABB 충돌: `invincibleUntil` 존중. `STONE_GUARD.hitbox=14`. 충돌 시 `state.hits++`, combo 리셋, 저음 2연타(110/82), 셰이크+비네트(reducedMotion 아닐 때), `gameoverReason='hit'`, `endGame()` + `return`
- [x] 음표 스폰 안전거리 필터: `spawnNote`의 `avoid` 배열에 `state.stoneGuard.active`일 때 석조무사 타일 추가 (SPAWN_SAFE_DIST=4 재사용)

## 범위 준수 확인
- easy/hard 밸런스 불변: `DIFFICULTY.easy/hard`, `TARGET_SCORE`, `PROFESSOR` 상수 미변경
- 기존 수간호사/이교수/임간호 "벼락치기"/F 즉사 로직 미변경
- `index.html`, `assets/js/main.js` 미변경
- 새 파일 생성 없음 — `game.js`/`game.css`만 수정
- 투척/청진기/텔레그래프/frozen 등 원거리 메커닉 추가 없음
- `DIFFICULTY.normal` 기존 필드 미변경 — 석조무사 정보는 전역 `STONE_GUARD`로만 표현
- CSS 신규 선택자/레이아웃 없음 — 팔레트 변수 7종만 `:root`/`html.light`에 추가
- 컷씬/엔딩 텍스트 미변경 — 기존 "수간호사에게 걸렸어요!" 재사용

## 패턴 준수 확인
- BEM 네이밍: 해당 없음 (캔버스 렌더)
- CSS 변수 사용: 모든 색상이 CSS 변수 읽기로 통일, 하드코딩된 값은 fallback뿐
- CSS 네이티브 중첩: 해당 없음 (변수만 추가)
- 반응형 520px: 해당 없음 (게임 캔버스는 기존 반응형 유지)
- reduced-motion: 걷기 프레임 정지(frame=0) + 셰이크 생략 처리
- esc()/safeUrl(): 해당 없음 (외부 데이터 없음)
- 가드 클래스: `updateStoneGuard`/`drawStoneGuard` 호출부에 `active` 가드 + 함수 내부 `!sg.active || !sg.patrolPath.length` early return
- DOMContentLoaded 등록: 해당 없음 (IIFE 내부 구조)
- -webkit-backdrop-filter: 해당 없음 (신규 글래스모피즘 없음)
- 파일 간 정합성: 7개 CSS 변수 이름이 getStoneGuardPalette의 readVar 호출과 1:1 일치

## 수용 기준 재검증
1. easy/hard 시작 시 `state.stoneGuard.active === false` 보장 (startGame else-branch)
2. normal 시작 시 1명 등장, 4지점 사각 순회
3. normal 접촉 시 endGame + 셰이크/비네트 + 수간호사 F 동일 엔딩 재사용
4. state.stethoscopes/obstacles에 석조무사 발 투사체 추가 없음
5. 기존 NPC/스킬 로직 불변
6. 테마 전환 시 `stoneGuardPaletteCache=null`로 재해석
7. replay(`btnReplay`) 경로는 `startGame`을 재호출하므로 initStoneGuard 분기가 재실행되어 올바르게 초기화; "난이도 다시 선택" 경로에도 `state.stoneGuard.active=false` 추가 완료
8. 음표 스폰 avoid 리스트에 석조무사 타일 포함 (SPAWN_SAFE_DIST=4 재사용)
9. reducedMotion 시 `sg.frame=0` 고정 + 셰이크 생략
