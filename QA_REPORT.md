# QA 검수 보고서 — Sprint 3 (김간호 하늘색 바지)

## UI 동작 검증 (Playwright)

| 체크 항목 | 결과 | 비고 |
|---|---|---|
| 다크 테마 `--nurse-pants` CSS 변수 | PASS | `#9ec9e8` (SPEC 일치) |
| 라이트 테마 `--nurse-pants` CSS 변수 | PASS | `#7fb5d8` (SPEC 일치) |
| 다크 테마 김간호 바지 픽셀 렌더 | PASS | 80 픽셀이 `#9ec9e8`로 정확히 렌더 (좌표 x=402, y=188부터) |
| 라이트 테마 김간호 바지 픽셀 렌더 | PASS | 강제 리드로우 후 80 픽셀이 `#7fb5d8`로 렌더, `#9ec9e8` 잔존 0 |
| 수간호사 흰옷 팔레트 불변 | PASS | `#f4f0ee` 216 픽셀 정상, 하늘색 오염 없음 |
| 콘솔 에러 | PASS | 런타임 에러 없음 |
| 테마 토글 직후 프리뷰 자동 갱신 | (선행 조건) | Sprint 2 구조, Sprint 3 회귀 아님 |

스크린샷: `tests/screenshots/sprint3-dark.png`, `tests/screenshots/sprint3-light-redraw.png`

## SPEC 기능 검증

- **[PASS] 기능 1**: `assets/css/game.css:26` `:root { --nurse-pants: #9ec9e8; }` — SPEC 일치
- **[PASS] 기능 2**: `assets/css/game.css:41` `html.light { --nurse-pants: #7fb5d8; }` — SPEC 일치
- **[PASS] 기능 3**: `assets/js/game.js:371` `'P': readVar('--nurse-pants', '#9ec9e8'),` — SPEC 일치 (폴백 값도 다크 테마 값으로 일관)

## Sprint 범위 준수 검증

Sprint 1(수간호사 리디자인)과 Sprint 2(번 머리)의 uncommitted 변경을 제외하면:

| 항목 | Sprint 3 본인의 변경 여부 |
|---|---|
| `--nurse-pants` 변수 2쌍 | 예 (SPEC 지정) |
| `getNursePalette()` P 키 교체 (1줄) | 예 (SPEC 지정) |
| `nurseSprite` 행 문자열 | 아니오 (Sprint 2 소관) |
| `chief*` 계열 자산 | 아니오 (Sprint 1 소관, 전면 미접촉) |
| 김간호 다른 팔레트 키 (S/H/b/W/C/B/E/L/R/M) | 값 유지 |
| HTML / main.js / style.css | 미변경 |

**Sprint 3 독립 추가 변경: 없음.** SPEC 범위 계약을 엄격히 준수.

## 검수 결과 요약

| 등급 | 건수 |
|---|---|
| P0 치명 | 0건 |
| P1 중요 | 0건 |
| P2 권장 | 1건 |

## P2 — 권장 사항

### 1. `getNursePalette()` 주석 내용이 Sprint 3 변경과 불일치
- **파일**: `assets/js/game.js:356-357`
- **위반 규칙**: 코드-주석 일관성
- **현재 코드**:
  ```
  // 김간호 팔레트 빌더 — H/b만 CSS 변수에서 읽어 테마 반응형.
  // 나머지 키(S/W/C/P/B/E/L/R/M)는 하드코딩 유지 (테마와 무관한 고유 피부/옷/눈 색).
  ```
- **문제**: Sprint 3에서 P 키를 `readVar('--nurse-pants', ...)`로 변경했으나 주석은 여전히 "H/b만 CSS 변수" · "P는 하드코딩"이라 기재. 다음 Sprint에서 혼동 유발 가능.
- **수정 제안**:
  ```
  // 김간호 팔레트 빌더 — H/b/P가 CSS 변수에서 읽어 테마 반응형.
  // 나머지 키(S/W/C/B/E/L/R/M)는 하드코딩 유지 (테마와 무관한 고유 피부/옷/눈 색).
  ```
- **참고**: SPEC 범위 계약이 "P 키 한 줄 교체"로 극도로 좁게 지정되어 있었으므로 주석 미수정은 SPEC 엄수 관점에서 타당. **감점 없음, 기록만.**

## 통과 항목

- **보안(3-1)**: innerHTML/eval 미사용, 외부 데이터 없음 — 해당 없음
- **CSS 패턴(3-2)**: `:root` / `html.light` 대칭 구조 유지, `!important` 미사용, 기존 팔레트 정책 부합
- **JS 패턴(3-3)**: `readVar` 기존 헬퍼 재사용, 캐시 무효화 Sprint 2 핸들러에 이미 포함
- **HTML 구조(3-4)**: 변경 없음
- **반응형 & 접근성(3-5)**: 색상 토큰만 변경, 애니메이션/prefers-reduced-motion 영향 없음
- **파일 간 정합성(3-6)**: `--nurse-pants` 변수명이 game.css 2곳 + game.js 1곳에서 일관
- **Sprint 범위(3-7)**: SPEC 외 추가 변경 0건
- **검증 기준(SPEC 1-6)**: 다크 `#9ec9e8`, 라이트 `#7fb5d8`, 기타 영역 불변, 수간호사 불변, 애니메이션/로직 정상 — 모두 충족

---

## 채점

**항목별 점수**:
- 패턴 일관성: **10/10** (SPEC 규정 3줄을 정확히, 기존 패턴과 일관되게 적용)
- 보안 & 접근성: **10/10** (색상 토큰만 변경)
- 반응형 & UI 품질: **10/10** (다크/라이트 변수 쌍 대칭, 라이트에서 한 톤 어둡게 처리하여 콘트라스트 유지, 양쪽 실제 렌더 검증 완료)
- 기능 완성도: **10/10** (SPEC 6개 검증 기준 모두 충족, Playwright 픽셀 스캔으로 RGB 일치 확인)

**가중 점수**: (10×0.3 + 10×0.25 + 10×0.2 + 10×0.25) = **10.0 / 10**

## 최종 판정: **합격**

- 점수 기준: 10.0 ≥ 7.0 → 합격
- 이슈 건수 기준: P0 0건, P1 0건 → 합격 제약 없음
- 두 기준 모두 합격 → 최종 **합격**

**후속 권장** (차기 Sprint 편입 고려, 강제성 없음):
1. `assets/js/game.js:356-357` 주석을 "H/b/P" / "S/W/C/B/E/L/R/M"로 업데이트
2. 테마 토글 핸들러에 `renderPreview()` 호출 추가 (Sprint 1/2 소관, Sprint 3 회귀 아님)
