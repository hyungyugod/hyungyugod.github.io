# 자체 점검

전략: Case A — 이유: 최초 구현이며, SPEC 범위가 정확히 3줄 수정으로 극도로 좁음.

## SPEC 기능 체크
- [x] 기능 1: `:root`에 `--nurse-pants: #9ec9e8;` 추가 (다크 테마 하늘색)
- [x] 기능 2: `html.light`에 `--nurse-pants: #7fb5d8;` 추가 (라이트 테마 한 톤 진한 하늘색)
- [x] 기능 3: `getNursePalette()` `P` 키를 `readVar('--nurse-pants', '#9ec9e8')`로 교체

## 변경 위치 정확성
- `assets/css/game.css` `:root` 블록 내부 `--nurse-bun-shadow` 아래 한 줄 추가 → 김간호 팔레트 그룹 유지
- `assets/css/game.css` `html.light` 블록 내부 `--nurse-bun-shadow` 아래 한 줄 추가 → 대칭 구조 유지
- `assets/js/game.js` 라인 371 `P` 키 한 줄만 교체 → 주석 컬럼 정렬 유지

## Sprint 범위 계약 준수
- 수간호사 관련 자산(`--nurse-chief-*`, `nurseChiefSprite`, `drawNurseChief`, `getChiefPalette`, `chiefPaletteCache`): 전혀 건드리지 않음
- 김간호의 다른 팔레트 키(`S/H/b/W/C/B/E/L/R/M`): 값 그대로 유지
- `nurseSprite` 행 문자열(픽셀 배치): 미수정
- HTML/`main.js`/`style.css`: 미수정
- 그 외 추가/수정 없음

## 패턴 준수 확인
- BEM 네이밍: 해당 없음 (CSS 변수만 추가)
- CSS 변수 사용: 준수 (테마 반응형 색상을 `:root`/`html.light`에 변수로 정의)
- CSS 네이티브 중첩: 해당 없음 (기존 블록에 변수 1줄씩만 추가)
- 반응형 520px: 해당 없음 (색상 토큰 추가)
- reduced-motion: 해당 없음 (애니메이션 변경 없음)
- esc()/safeUrl(): 해당 없음 (외부 데이터 주입 없음)
- 가드 클래스: 해당 없음
- DOMContentLoaded 등록: 해당 없음 (기존 함수 내부 값 교체)
- -webkit-backdrop-filter: 해당 없음
- 파일 간 정합성: `--nurse-pants` 변수명이 `game.css` 2곳과 `game.js` `readVar` 호출에서 동일하게 사용됨 (확인 완료)
- 캐시 무효화: `nursePaletteCache = null`이 테마 토글에 이미 존재 (SPEC 명시, 추가 작업 불필요)

## 검증 기준 대응
1. 다크에서 `#9ec9e8` 렌더링: `:root --nurse-pants` + `readVar` 연동으로 보장
2. 라이트 전환 시 `#7fb5d8`: `html.light --nurse-pants` + 기존 테마 토글의 `nursePaletteCache = null` 무효화 연동
3. 김간호의 기타 영역 색 불변: `S/H/b/W/C/B/E/L/R/M` 9개 키 원본 유지
4. 수간호사 픽셀 불변: `chief-*` 계열 파일 내 어떤 줄도 미수정
5. 걷기 애니메이션/방향 전환: 로직/스프라이트 미변경
6. 게임 로직 영향: 색상만 바뀜, 밸런스/충돌 코드 미접촉
