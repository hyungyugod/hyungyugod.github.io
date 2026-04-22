# 모바일 버튼 터치 타겟 확장

## 개요
모바일(≤520px)에서 주요 인터랙션 버튼들이 WCAG 2.5.5 권장 최소 터치 타겟 44×44 px에 미달하거나 간신히 충족하는 상태다. 손가락 탭 실패와 오터치를 줄이기 위해 각 버튼을 모바일 전용 미디어쿼리 안에서만 넉넉히 키운다. 데스크탑 경험·색상·그림자·보더는 일체 건드리지 않는다.

## 변경 유형
**디자인** (확정)

## 디자인 언어 & 의도
모바일 접근성과 누르기 쉬움을 위한 "여유의 확장"이다. 데스크탑은 건드리지 않고 ≤520px 브레이크포인트에서만 패딩·크기·폰트를 키워, 한 손 조작 중에도 버튼이 손가락 아래로 확실히 들어오게 한다. 글래스모피즘·코럴핑크 팔레트·라운드 형태 등 사이트 정체성은 그대로 두고, 오직 "만질 수 있는 표면적"만 넓힌다.

## Sprint 범위 계약

Generator가 SPEC 외 변경을 시도할 때의 판단 기준:

- **허용 (최소 연동 변경)**:
  - `@media (max-width: 520px)` 블록 **안에서만** 대상 버튼의 `width`, `height`, `min-width`, `min-height`, `padding`, `font-size`, `gap`, `border-radius`, 자식 아이콘(`i`, `svg`) 크기, `top`/`right`(고정 위치 버튼의 위치 보정) 조정
  - 기존 `@media (max-width: 520px)` 블록 내에서 이미 해당 셀렉터가 존재하면 그 블록 안에 값을 **수정**하고, 존재하지 않으면 같은 기존 미디어쿼리 블록 내부에 새 룰 추가
- **금지**:
  - 데스크탑 기본 규칙(미디어쿼리 밖의 `.theme-toggle`, `.category-nav__btn`, `.platform-showcase__cta`, `.music-showcase__link-btn`, `.modal-close` 선언부) 수정
  - `@media (min-width: 900px)` 내부 선언 수정 (데스크탑 레이아웃 손상 금지)
  - 색상/배경/보더 색/그림자/블러/트랜지션/애니메이션 등 **비크기 속성** 변경
  - `--bg-card`, `--border`, `--brand*` 등 CSS 변수 값 변경
  - `button, .platform-showcase__cta, .music-showcase__link-btn { user-select, touch-action … }` (style.css 114~124줄 "Touch hardening for interactive chrome" 블록) 수정
  - 대상 5종 외 버튼·링크·카드 요소 변경
  - 새 CSS 변수 추가 (수치 직접 기입)
  - HTML 구조 변경, 클래스 추가/제거
  - JS 변경
  - 새 미디어쿼리 브레이크포인트(예: 480px, 600px 등) 추가
- **판단 기준**: "이 변경이 없으면 SPEC의 모바일 버튼 확장이 제대로 동작하지 않는가?" → YES면 허용, NO면 금지

## 조사 결과: 현재 값

### 기존 반응형 브레이크포인트 전수 조사
| 라인 | 브레이크포인트 | 목적 |
|---|---|---|
| 808 | `@media (max-width: 520px)` | 카테고리 나브 모바일 (scroll-snap 스크롤) |
| 842 | `@media (prefers-reduced-motion: reduce)` | 카테고리 나브 접근성 |
| 1803 | `@media (max-width: 520px)` | 메인 레이아웃 모바일 (profile, link-card, platform-showcase, game-showcase, featured-item, theme-toggle, modal, social-grid) |
| 2168 | `@media (prefers-reduced-motion: reduce)` | 전역 접근성 |
| 2240 | `@media (min-width: 900px)` | 데스크탑 풀 레이아웃 (music-showcase 포함 이 안에서만 노출) |
| 2857 | `@media (max-width: 520px)` | streaks 모바일 |
| 2871 | `@media (prefers-reduced-motion: reduce)` | streaks 접근성 |
| 2936 | `@media(max-width:900px)` | cover-band 전용 |
| 2940 | `@media(max-width:720px)` | cover-band 전용 |

**결론: 모바일 표준 브레이크포인트는 `@media (max-width: 520px)`. 이번 작업은 이 기존 브레이크포인트를 그대로 재사용한다. 신규 브레이크포인트 추가 금지.**

### 버튼별 현재값 vs 목표값

#### 1. `.theme-toggle` (우상단 고정 테마 전환 원형 버튼)
| 속성 | 데스크탑 현재값 (line 128~) | 모바일 현재값 (line 1883~) | 모바일 목표값 | 터치 타겟 |
|---|---|---|---|---|
| width | 42px | **38px** | **44px** | 44×44 ✓ |
| height | 42px | **38px** | **44px** | |
| top | 24px | 16px | 16px (유지) | — |
| right | 24px | 16px | 16px (유지) | — |
| 아이콘 font-size | 16px | (상속 16px) | 17px | — |

처리: line 1883~1888의 기존 `.theme-toggle` 모바일 블록 안의 값을 **수정** (38 → 44). 아이콘 크기는 `& .theme-toggle__icon { font-size: 17px; }` 한 줄 추가. 현재 모바일이 오히려 데스크탑(42px)보다 작아서 손가락 탭 난이도가 높다 — 역전 해소.

#### 2. `.category-nav__btn` (카테고리 필터 탭)
| 속성 | 데스크탑 현재값 (line 753~) | 모바일 현재값 (line 823~) | 모바일 목표값 | 터치 타겟 |
|---|---|---|---|---|
| padding | 12px 22px | **10px 16px** | **14px 18px** | 높이 약 44px+ ✓ |
| font-size | 14px | **12px** | **13px** | (가독성 개선) |
| gap | 8px | (상속 8px) | 8px (유지) | — |
| icon width/height | 18px | **16px** | 16px (유지, 라벨 비율) | — |
| border-radius | 999px (pill) | (상속) | 유지 | — |

높이 검산: 폰트 13px × line-height ≈ 18px + padding 14×2 = **46px** → 44px 충족.
처리: line 823~833의 기존 `.category-nav__btn` 모바일 블록 안의 padding과 font-size만 **수정**. 아이콘 크기는 유지(라벨 대비 비율 깨짐 방지). 인디케이터 top/height는 padding 변경에 맞춰 재확인:
- 현재 `top: 5px; height: calc(100% - 10px);` 유지 가능 (pill 형태라 상대값)
- 필요 시 `top: 6px; height: calc(100% - 12px);` 로만 미세 조정 (데스크탑 값과 동일 복귀 — 모바일 블록의 `top: 5px` 오버라이드를 제거하거나 6px로 수정)

#### 3. `.platform-showcase__cta` (Velog/Brunch/GitHub "더 보기" CTA)
| 속성 | 기본 현재값 (line 1234~) | 데스크탑 현재값 (line 2309~, `@media min-width:900px`) | 모바일 현재값 (line 1856) | 모바일 목표값 | 터치 타겟 |
|---|---|---|---|---|---|
| padding | 10px 18px | 12px 24px | **8px 14px** | **14px 20px** | 높이 약 46px+ ✓ |
| font-size | 13px | 14px | **12px** | **13px** | — |
| gap | 8px | (상속) | (상속 8px) | 8px (유지) | — |
| border-radius | 8px | (상속) | (상속) | 유지 | — |
| 내부 `i` 아이콘 | 11px | (상속) | (상속) | 유지 | — |

높이 검산: 폰트 13px × 1.4 ≈ 18px + padding 14×2 = **46px** → 44px 충족.
처리: line 1856의 `& .platform-showcase__cta { padding: 8px 14px; font-size: 12px; }` 를 **수정** (`padding: 14px 20px; font-size: 13px;`). 현재 모바일 패딩은 거의 데스크탑의 절반인데 오히려 화면이 좁은 모바일에서 더 작다는 역전 상태 — 해소.

#### 4. `.music-showcase__link-btn` (Melon / SoundCloud 버튼)
| 속성 | 현재값 (line 2458~, `@media min-width:900px` 내부) | 모바일 대응 |
|---|---|---|
| padding | 10px 20px | **없음** — 모바일에선 부모 `.music-showcase`가 `display: none`이라 화면에 노출되지 않음 |
| font-size | 13px | — |
| 노출 조건 | ≥900px에서만 렌더 | 모바일은 그 아래 `.links--section`의 `.link-card`(Melon, SoundCloud)가 대체 렌더됨 |

**결론: 모바일 ≤520px에서는 `.music-showcase__link-btn`이 실제로 렌더되지 않으므로 터치 타겟 문제가 발생하지 않는다. 모바일 스타일 추가 불필요.** 단, SPEC 체크리스트에 "본 요소는 모바일 비가시이므로 의도적으로 스타일 미추가"임을 기록하여 Generator가 실수로 건드리지 않도록 명시.

#### 5. `.modal-close` (프로필 모달 닫기 X 버튼)
| 속성 | 데스크탑 현재값 (line 1978~) | 모바일 현재값 | 모바일 목표값 | 터치 타겟 |
|---|---|---|---|---|
| width | 32px | **(없음, 32px 상속)** | **44px** | 44×44 ✓ |
| height | 32px | **(없음, 32px 상속)** | **44px** | |
| top | 16px | — | 12px | — |
| right | 16px | — | 12px | — |
| font-size (X 아이콘) | 15px | — | 18px | — |

처리: 현재 `@media (max-width: 520px)` 내부 line 1890~1892의 `.modal-backdrop` 블록에 `& .modal-box { max-width: 92vw; }` 만 있음. 이 블록 안에 `& .modal-close { ... }` **새 룰 추가**. 위치를 16→12로 살짝 당겨 44px로 커져도 이미지 영역을 가리지 않게 한다.

## 변경 범위

### index.html 변경사항
**없음.** HTML 구조·클래스·ID·aria 속성 일체 변경하지 않는다.

### assets/css/style.css 변경사항

모든 변경은 기존 `@media (max-width: 520px)` 블록(line 1803~1908) **안에서만** 수행. 새 미디어쿼리 블록을 만들지 않는다.

1. **`.theme-toggle` 모바일 블록 수정 (기존 line 1883~1888 내)**
   - `width: 38px;` → `width: 44px;`
   - `height: 38px;` → `height: 44px;`
   - `top: 16px;`, `right: 16px;` 유지
   - 블록 안에 `& .theme-toggle__icon { font-size: 17px; }` 한 줄 추가

2. **`.category-nav__btn` 모바일 블록 수정 (기존 line 808~839의 `@media (max-width: 520px)` 내부 line 823~828)**
   - `padding: 10px 16px;` → `padding: 14px 18px;`
   - `font-size: 12px;` → `font-size: 13px;`
   - `scroll-snap-align: center; flex-shrink: 0;` 유지
   - `.category-nav__icon { width: 16px; height: 16px; }` 유지 (라벨 대비 비율 유지 목적)
   - `.category-nav__indicator { top: 5px; height: calc(100% - 10px); }`는 padding 변경으로 인해 pill 높이가 커지지만 상대 계산이므로 그대로 동작 — **수정하지 않음**

3. **`.platform-showcase__cta` 모바일 규칙 수정 (기존 line 1856)**
   - `& .platform-showcase__cta { padding: 8px 14px; font-size: 12px; }`
   - → `& .platform-showcase__cta { padding: 14px 20px; font-size: 13px; }`
   - `.game-showcase__cta`는 **건드리지 않는다** (SPEC 대상 아님)

4. **`.music-showcase__link-btn` — 변경 없음**
   - 이유: 모바일 ≤520px에서 부모가 `display: none`이라 렌더되지 않음. 명시적 비변경.

5. **`.modal-close` 모바일 규칙 신규 추가 (기존 line 1890~1892 `.modal-backdrop` 블록 내부)**
   - 기존:
     ```
     .modal-backdrop {
       & .modal-box { max-width: 92vw; }
     }
     ```
   - 추가 후:
     ```
     .modal-backdrop {
       & .modal-box { max-width: 92vw; }
       & .modal-close {
         width: 44px;
         height: 44px;
         top: 12px;
         right: 12px;
         font-size: 18px;
       }
     }
     ```

#### 새 필요 CSS 변수
**없음.** 수치를 모바일 블록 내부에 직접 기입한다 (기존 모바일 블록도 변수 없이 리터럴 수치 사용 중 — 패턴 일관).

#### 반응형 대응
- 기존 `@media (max-width: 520px)` 재사용. 신규 브레이크포인트 금지.
- 신규 브레이크포인트 추가·기존 브레이크포인트 변경 모두 금지.

### assets/js/main.js 변경사항
**없음.** JS 로직 변경 없음.

## 기능 상세

### 기능 1: theme-toggle 44px 확대
- 설명: 우상단 고정 테마 토글 버튼을 모바일에서 38×38 → 44×44로 확장
- 사용자 동작: 손가락으로 더 쉽게 탭 가능
- 구현 위치: `assets/css/style.css` line 1883~ 기존 `.theme-toggle` 모바일 블록
- 세부 요소: width/height 44px, 아이콘 font-size 17px

### 기능 2: 카테고리 필터 탭 확대
- 설명: 카테고리 네비 탭의 세로 패딩을 10px → 14px로, 폰트를 12→13px로
- 사용자 동작: scroll-snap 스와이프 중에도 탭 선택이 쉬움
- 구현 위치: `assets/css/style.css` line 808~ 기존 `.category-nav` 모바일 블록 내 `.category-nav__btn`
- 세부 요소: padding 14px 18px, font-size 13px, 아이콘 크기 유지

### 기능 3: 플랫폼 쇼케이스 CTA 확대
- 설명: Velog/Brunch/GitHub "모든 X 보기" CTA 버튼을 패딩 8→14, 14→20, 폰트 12→13으로 확대
- 사용자 동작: 블로그 외부 링크로 이동하는 주 진입점이므로 실수 탭 감소
- 구현 위치: `assets/css/style.css` line 1856 (`.platform-showcase` 모바일 블록 내)
- 세부 요소: padding 14px 20px, font-size 13px

### 기능 4: 모달 닫기 버튼 44px 확대
- 설명: 프로필 모달의 X 닫기 버튼을 모바일에서 32×32 → 44×44로 확장
- 사용자 동작: 모달 오버레이 오탭 없이 닫기 가능
- 구현 위치: `assets/css/style.css` line 1890~ `.modal-backdrop` 모바일 블록 내 신규 룰
- 세부 요소: width/height 44px, top/right 12px, font-size 18px

### 비적용 명시: music-showcase__link-btn
- 설명: ≤520px에서 부모 `.music-showcase`가 `display: none`이라 노출되지 않음
- 대응: 모바일 스타일 추가 없음. Generator가 이 요소를 건드리지 않도록 본 SPEC에 명시.

## 수락 기준 (체크리스트)

Evaluator가 확인할 항목:

- [ ] **터치 타겟 44px+**: `.theme-toggle`, `.category-nav__btn`, `.platform-showcase__cta`, `.modal-close` 네 요소가 모바일에서 최소 44×44 px 히트 영역을 가진다
- [ ] **라벨·아이콘 비율 유지**: 카테고리 탭의 아이콘(16px) 과 라벨(13px) 의 시각 균형이 깨지지 않는다
- [ ] **오버플로우·줄바꿈 없음**: 패딩·폰트 확대로 인해 카테고리 나브 가로 스크롤이 과하게 늘어나거나, CTA 버튼 텍스트가 2줄로 꺾이지 않는다 (특히 "GitHub 프로필 보기" 한 줄 유지 확인)
- [ ] **데스크탑 시각 무변화**: ≥521px에서 5개 버튼 모두 현재와 동일하게 보인다 (데스크탑 DevTools 521px/900px/1200px 비교 시 변화 없음)
- [ ] **색상·그림자·보더 동일**: 비크기 속성이 하나도 바뀌지 않았다
- [ ] **Touch hardening 블록 무수정**: style.css line 114~124 "Touch hardening for interactive chrome" 블록이 그대로다
- [ ] **신규 미디어쿼리 없음**: 새 `@media` 블록이 추가되지 않았고, 기존 `@media (max-width: 520px)` 블록 안에서만 변경됨
- [ ] **HTML/JS 변경 없음**: index.html, main.js 가 변경되지 않았다
- [ ] **`.music-showcase__link-btn` 미터치**: 모바일에서 비가시이므로 의도적으로 건드리지 않았다
- [ ] **prefers-reduced-motion 무영향**: 크기만 바뀌었고 애니메이션/트랜지션은 건드리지 않아 접근성 블록 추가 작업 불필요

## 주의사항

- **기존 모바일 블록이 데스크탑보다 작게 설정된 역전 상태**: `.theme-toggle`(42→38), `.platform-showcase__cta`(10/18 → 8/14) 두 요소는 현재 모바일이 오히려 더 작다. 이번 변경이 이 비정상 역전을 해소한다.
- **카테고리 나브 인디케이터**: `.category-nav__indicator`의 `top`/`height`는 `calc(100% - 12px)` 상대 계산으로 자동 적응하므로 수정 불필요. Generator가 괜히 인디케이터 값을 건드리지 않도록 주의.
- **모달 닫기 버튼 위치 보정**: 32 → 44로 커지면서 기본값 `top:16 right:16`이면 시각 여백이 부족해 보임 → 모바일만 `top:12 right:12`로 살짝 당김. 이미지 영역 침범 없음 확인.
- **라이트 테마 별도 작업 불필요**: 모든 변경이 크기 속성이라 `html.light` 오버라이드가 영향받지 않는다.
- **보안/접근성 고려사항**: 이번 변경은 외부 데이터·사용자 입력·URL 주입과 무관하므로 `esc()`/`safeUrl()` 해당 없음. 포커스 가시성(`:focus-visible`)은 기존 규칙이 그대로 유지되므로 별도 조치 불필요.
- **Generator 유의**: `.game-showcase__cta`도 line 1868에 유사한 모바일 규칙(`padding: 8px 14px; font-size: 12px;`)이 있지만 이번 SPEC의 대상 5종이 아니므로 **건드리지 않는다**. SPEC 범위 위반 판정 대상.
