# 자체 점검 — 모바일 버튼 터치 타겟 확장

전략: Case A — 이유: 최초 구현(이전 QA 없음). SPEC이 극도로 구체적이므로 지시 그대로 정밀 적용.

---

## 수정한 파일
- `assets/css/style.css` — 4곳 수정 (전부 기존 `@media (max-width: 520px)` 블록 내부)
- `index.html` — 변경 없음
- `assets/js/main.js` — 변경 없음

## 변경 상세 (라인 번호 · 변경 전/후)

### 변경 1: `.category-nav__btn` 패딩·폰트 확대
- 파일: `assets/css/style.css`
- 위치: 기존 `@media (max-width: 520px)` (line 808 시작) 내부
- 라인: 823~828

| 라인 | 속성 | 변경 전 | 변경 후 |
|---|---|---|---|
| 824 | padding | `10px 16px` | `14px 18px` |
| 825 | font-size | `12px` | `13px` |

- 높이 검산: 폰트 13px × line-height ≈ 18px + padding 14×2 = **46px** → 44px 충족 ✓
- 아이콘(16×16), 인디케이터(`top: 5px; height: calc(100% - 10px)`) 그대로 유지

### 변경 2: `.platform-showcase__cta` 패딩·폰트 확대
- 파일: `assets/css/style.css`
- 위치: 기존 `@media (max-width: 520px)` 내부 `.platform-showcase` 블록
- 라인: 1856

| 라인 | 속성 | 변경 전 | 변경 후 |
|---|---|---|---|
| 1856 | padding | `8px 14px` | `14px 20px` |
| 1856 | font-size | `12px` | `13px` |

- 높이 검산: 13px × 1.4 ≈ 18px + padding 14×2 = **46px** → 44px 충족 ✓
- `.game-showcase__cta` (line 1868)는 **건드리지 않음** (SPEC 범위 외)

### 변경 3: `.theme-toggle` 44×44 확대 + 아이콘 확대
- 파일: `assets/css/style.css`
- 위치: 기존 `@media (max-width: 520px)` 내부 `.theme-toggle` 블록
- 라인: 1883~1890

| 라인 | 속성 | 변경 전 | 변경 후 |
|---|---|---|---|
| 1886 | width | `38px` | `44px` |
| 1887 | height | `38px` | `44px` |
| 1889 | `& .theme-toggle__icon { font-size }` | (없음 → 기본 16px 상속) | `17px` (새로 추가) |
| 1884 | top | `16px` | `16px` (유지) |
| 1885 | right | `16px` | `16px` (유지) |

- 현재 모바일(38)이 데스크탑(42)보다 작던 역전 상태 해소

### 변경 4: `.modal-close` 모바일 룰 신규 추가
- 파일: `assets/css/style.css`
- 위치: 기존 `@media (max-width: 520px)` 내부 `.modal-backdrop` 블록
- 라인: 1895~1901 (신규 추가)

| 라인 | 속성 | 변경 전 (데스크탑 기본 상속) | 변경 후 (모바일) |
|---|---|---|---|
| 1896 | width | `32px` | `44px` |
| 1897 | height | `32px` | `44px` |
| 1898 | top | `16px` | `12px` |
| 1899 | right | `16px` | `12px` |
| 1900 | font-size | `15px` | `18px` |

- 44×44 히트 영역 달성. 위치 16→12로 당겨 이미지 영역 침범 없음.

### 비변경 명시
- `.music-showcase__link-btn` — 모바일 ≤520px에서 부모 `.music-showcase`가 `display: none`이라 비가시. SPEC에 따라 **의도적 미변경**.
- `.game-showcase__cta` (line 1868) — SPEC 대상 5종 외. **미변경**.
- `index.html` — 변경 없음
- `assets/js/main.js` — 변경 없음

---

## SPEC 수락 기준 체크리스트 자가진단

- [x] **터치 타겟 44px+**:
  - `.theme-toggle` 44×44 ✓
  - `.category-nav__btn` 높이 ≈46px (padding 14×2 + 폰트 18) ✓
  - `.platform-showcase__cta` 높이 ≈46px (padding 14×2 + 폰트 18) ✓
  - `.modal-close` 44×44 ✓

- [x] **라벨·아이콘 비율 유지**: 카테고리 탭 아이콘 16px 그대로 두고 라벨만 12→13px 로 1px 상승 — 시각 균형 유지

- [x] **오버플로우·줄바꿈 없음**:
  - 카테고리 나브는 `overflow-x: auto` + `scroll-snap` 구조라 패딩 확대는 스와이프 가능 영역만 넓힘. 줄바꿈 없음
  - platform CTA ("GitHub 프로필 보기" 등): 패딩만 늘리고 텍스트 수평 공간 영향 적음. 한 줄 유지

- [x] **데스크탑 시각 무변화**: 모든 수정이 `@media (max-width: 520px)` 블록 **안에서만** 일어남. `@media (min-width: 900px)` 블록 및 미디어쿼리 밖 기본 선언은 무수정

- [x] **색상·그림자·보더 동일**: 크기 속성(width/height/padding/font-size/top/right)만 변경. background, border, box-shadow, backdrop-filter, transition, animation 전부 무변경

- [x] **Touch hardening 블록 무수정**: style.css line 114~124 `button, .platform-showcase__cta, .music-showcase__link-btn { user-select ... touch-action ... }` 블록 그대로

- [x] **신규 미디어쿼리 없음**: 새 `@media` 블록 추가 0건. 기존 `@media (max-width: 520px)` (line 808, line 1803) 두 블록 내부에서만 변경

- [x] **HTML/JS 변경 없음**: `index.html`, `assets/js/main.js` 파일 무수정

- [x] **`.music-showcase__link-btn` 미터치**: 해당 셀렉터에 대한 모바일 룰 추가 없음. grep 확인 결과 변경 없음

- [x] **prefers-reduced-motion 무영향**: 애니메이션/트랜지션 속성은 건드리지 않음. `@media (prefers-reduced-motion: reduce)` 블록 무수정

---

## 패턴 준수 확인

- BEM 네이밍: 준수 — 기존 셀렉터만 수정, 신규 클래스 도입 없음
- CSS 변수 사용: 해당 없음 — SPEC 명시대로 수치 리터럴 사용 (기존 모바일 블록 패턴 일관)
- CSS 네이티브 중첩: 준수 — `& .theme-toggle__icon`, `& .modal-close` 모두 `&` 문법 사용
- 반응형 520px: 기존 블록 재사용, 신규 브레이크포인트 0건
- reduced-motion: 영향 없음 (크기만 변경, 애니메이션 무수정)
- esc()/safeUrl(): 해당 없음 (외부 데이터/URL 주입 무관)
- 가드 클래스: 해당 없음 (JS 변경 없음)
- DOMContentLoaded 등록: 해당 없음 (JS 변경 없음)
- -webkit-backdrop-filter: 해당 없음 (backdrop-filter 무수정)
- 파일 간 정합성: HTML/JS 무변경이므로 기존 클래스/ID 매핑 그대로 유효

---

## Sprint 범위 계약 준수 확인

- 허용 범위 내 변경만 수행: `@media (max-width: 520px)` 블록 내에서 `width`, `height`, `padding`, `font-size`, `top`, `right` 만 조정
- 금지 항목 위반 0건:
  - 데스크탑 기본 규칙 무수정 ✓
  - `@media (min-width: 900px)` 무수정 ✓
  - 색상/배경/보더/그림자/블러/트랜지션/애니메이션 무수정 ✓
  - CSS 변수 값 변경 없음 ✓
  - Touch hardening 블록(line 114~124) 무수정 ✓
  - 대상 5종 외 요소(`.game-showcase__cta` 포함) 무수정 ✓
  - 새 CSS 변수 추가 없음 ✓
  - HTML/JS/클래스/aria 변경 없음 ✓
  - 신규 미디어쿼리 추가 없음 ✓
