# 자체 점검

전략: Case A — 신규 기능 최초 구현 (QA 피드백 없음), SPEC 지시를 정밀 반영

## SPEC 기능 체크
- [x] TOILET 상수 추가 (spawnInterval 12s / chance 15% / ttl 8s / bonusMultiplier 2 / toastDuration 900ms) — `DIFFICULTY`·`PROFESSOR` 근처, 스키마 독립 전역 상수
- [x] state 확장: `toilets: []`, `nextToiletAt: 0`, `toiletToastUntil: 0`
- [x] 초기화 경로 2곳 모두 커버 — `startGame()` (line ~1324) + `btnBackToDifficulty` 클릭 핸들러 (line ~1080). 두 곳 모두 `toilets=[]` + `nextToiletAt = now + 12000` + `toiletToastUntil = 0` 세팅
- [x] `spawnToilet()` 신규 — 맵 상한 1개, `findEmptyTile` 재사용, `avoid=[playerTile()]`
- [x] `drawToilet(x, y, bob)` 신규 — 12×12 픽셀 변기 (물탱크 + 시트 + 물 하이라이트 + 중앙 구멍), 라이트/다크 공통 중립색(#fff / #cfd3da / #a9d6ef / #1a1a22)
- [x] 업데이트 루프: 음표 보충 직후에 TTL 필터 + 주기 판정(15%) 삽입
- [x] 수집 판정: 음표 수집 루프 바로 뒤, 히트박스 12×12. 콤보 +2회 순차 증가 + 각 단계 gain(콤보 3/5/7 보너스) 합산
- [x] 사운드 2연타: `playTone(SCALE_FREQS[i], 0.09)` + `setTimeout(..., 70)`으로 다음 음
- [x] 파티클 16개 (reduced-motion 시 스킵)
- [x] 토스트 "화캉스 보너스!" — canvas 중앙상단(cx=CANVAS_W/2, cy=40), 900ms, 마지막 300ms 페이드아웃, 라이트/다크 테마 색상 분기
- [x] TTL 말기 1초 깜빡임 (reduced-motion 시 비활성, 정적 표시)
- [x] reduced-motion: bob=0, 깜빡임 skip, 파티클 skip, 토스트는 정적으로 표시 (SPEC 요구사항 준수)

## 범위 계약 준수 확인
- [x] 기존 음표/F/수간호사/이교수 로직 **수정 없음** — 음표 수집 루프, obstacle 로직, 청진기 로직 전부 그대로 유지
- [x] `DIFFICULTY` 스키마 변경 없음 — `TOILET`는 독립 상수
- [x] 난이도별 차등 없음 (easy/normal/hard 동일 확률)
- [x] 새 오버레이/모달/컷씬 없음 — 토스트는 canvas 그림
- [x] 신규 파일 없음 — `assets/js/game.js` 단일 수정
- [x] `pages/game.html`, `assets/css/game.css` 변경 없음
- [x] 테마 시스템·폰트·색상 변수 변경 없음 — 토스트는 canvas이라 CSS 변수 불필요, drawToilet은 고정 중립색

## 패턴 준수 확인
- BEM/CSS 변수/네이티브 중첩: N/A (CSS 변경 없음)
- 반응형 520px: N/A (CSS 변경 없음)
- reduced-motion: 대응 — bob, blink, particles 가드 / 토스트는 정적으로 항상 표시
- esc()/safeUrl(): N/A — 토스트는 `ctx.fillText` + 하드코딩 상수 문자열로 XSS 무관, 동적 입력 없음
- 가드 클래스: `canvas` 참조·DOM 요소 모두 기존 참조 재사용, 신규 DOM 접근 없음
- DOMContentLoaded 등록: 기존 IIFE 내 유지, 신규 바인딩 없음
- -webkit-backdrop-filter: N/A (CSS 변경 없음)
- 파일 간 정합성: JS 내부 변경만 있어 HTML/CSS와 무관
- 정수 좌표/12×12 히트박스: drawNote 패턴 그대로 (`Math.round(x)`, `Math.round(y + bob)`)

## 검증 포인트
- `state.toilets.length >= 1` 가드로 다중 스폰 방지
- TTL 만료 → `filter` 제거 / 판정 주기 도달 → 15% 롤 → 스폰
- `bonusMultiplier=2`로 콤보 3/5/7 임계 돌파 시 보너스 자동 반영 (예: 콤보 2→4 전이 시 첫 루프에서 combo=3→gain=2, 두 번째 루프에서 combo=4→gain=2, 총 4점)
- 수집 사운드 인덱스는 업데이트된 `state.combo - 1` 기반, `freqIdx+1`은 상한 클램프
- 토스트는 render 마지막에 그려 파티클/HUD 위 레이어 보장
