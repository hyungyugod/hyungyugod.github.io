# SPEC.md — "Quiet Luxury" 디자인 리뉴얼

## 개요
현재 코럴 핑크 + 글래스모피즘 + 풍부한 모션의 "테크 대시보드" 정체성을 세리프 타이포그래피 + 뮤트 로즈 컬러 + 절제된 모션의 "에디토리얼 럭셔리"로 전환한다.

## 변경 유형
디자인

## 디자인 언어 & 의도
과잉 모션과 강렬한 코럴을 걷어내고, 뮤트 로즈와 세리프 서체가 주는 절제된 품격을 입힌다. 카드가 회전하고 기울어지는 "놀이터" 분위기를 벗어나, 인쇄 매거진처럼 콘텐츠 자체에 시선이 머무는 정적인 아름다움을 목표로 한다. 호버 시에도 과장 없이, 미세한 그림자와 작은 움직임만으로 반응하여 "조용히 고급스러운" 인상을 남긴다.

## Sprint 범위 계약
- **허용**: SPEC에 명시된 CSS 변수 값 변경, 폰트 추가, 여백 조정, 모션 제거/절제, JS 함수 삭제. 이들의 정상 동작에 필수적인 최소 연동 변경.
- **금지**: SPEC에 없는 새 컴포넌트, 새 인터랙션, 새 섹션, 레이아웃 구조 변경, 기존 기능 로직 변경.
- **판단 기준**: "이 변경이 없으면 SPEC 기능이 제대로 동작하지 않는가?" YES면 허용, NO면 금지.
- **css-rules.md 예외 선언**: css-rules.md 9조의 "기존 :root CSS 변수 값 변경 금지" 규칙은 이 SPEC에 한해 명시적으로 해제한다. 본 SPEC은 사이트 전체 디자인 리뉴얼이며, :root 및 html.light 블록의 브랜드/레이아웃 변수 값 변경이 핵심 범위에 포함된다. 단, 변수의 삭제는 여전히 금지이며, 값 변경만 허용한다.

---

## 변경 범위

### index.html 변경사항

1. **Google Fonts 추가**: 기존 Inter/Noto Sans KR `<link>` 태그 바로 아래에 Cormorant Garamond 폰트 추가:
   ```html
   <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
   ```

2. **HTML 구조 변경 없음**: DOM 구조, 클래스명, ID, data 속성은 일체 변경하지 않는다.

### assets/css/style.css 변경사항

#### A. :root 변수 값 변경

| 변수 | 현재 값 | 새 값 |
|---|---|---|
| `--brand` | `#ff7b7b` | `#c4847a` |
| `--brand-light` | `#ff9b9b` | `#d4a49c` |
| `--brand-04` | `rgba(255,123,123,0.04)` | `rgba(196,132,122,0.04)` |
| `--brand-06` | `rgba(255,123,123,0.06)` | `rgba(196,132,122,0.06)` |
| `--brand-08` | `rgba(255,123,123,0.08)` | `rgba(196,132,122,0.08)` |
| `--brand-12` | `rgba(255,123,123,0.12)` | `rgba(196,132,122,0.12)` |
| `--brand-14` | `rgba(255,123,123,0.14)` | `rgba(196,132,122,0.14)` |
| `--brand-20` | `rgba(255,123,123,0.20)` | `rgba(196,132,122,0.20)` |
| `--brand-25` | `rgba(255,123,123,0.25)` | `rgba(196,132,122,0.25)` |
| `--brand-35` | `rgba(255,123,123,0.35)` | `rgba(196,132,122,0.35)` |
| `--brand-40` | `rgba(255,123,123,0.40)` | `rgba(196,132,122,0.40)` |
| `--brand-60` | `rgba(255,123,123,0.60)` | `rgba(196,132,122,0.60)` |
| `--brand-btn-text` | `rgba(255,160,160,0.85)` | `rgba(212,164,156,0.85)` |
| `--radius` | `16px` | `10px` |
| `--radius-sm` | `10px` | `6px` |
| `--transition` | `0.38s cubic-bezier(...)` | `0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94)` |
| `--glow-velog` | `rgba(32, 201, 151, 0.35)` | `rgba(32, 201, 151, 0.18)` |
| `--glow-brunch` | `rgba(100, 100, 100, 0.25)` | `rgba(100, 100, 100, 0.15)` |
| `--glow-github` | `rgba(236, 236, 236, 0.3)` | `rgba(236, 236, 236, 0.18)` |
| `--glow-melon` | `rgba(0, 205, 60, 0.35)` | `rgba(0, 205, 60, 0.18)` |
| `--glow-soundcloud` | `rgba(255, 85, 0, 0.35)` | `rgba(255, 85, 0, 0.18)` |

**새 변수 추가** (:root 블록 하단):
```css
--font-serif: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
```

#### B. html.light 변수 값 변경

| 변수 | 현재 값 | 새 값 (기반: `#b07068`) |
|---|---|---|
| `--brand` | `#e05a5a` | `#b07068` |
| `--brand-light` | `#d94444` | `#c48a82` |
| `--brand-04` | `rgba(224,90,90,0.04)` | `rgba(176,112,104,0.04)` |
| `--brand-06` | `rgba(224,90,90,0.06)` | `rgba(176,112,104,0.06)` |
| `--brand-08` | `rgba(224,90,90,0.08)` | `rgba(176,112,104,0.08)` |
| `--brand-12` | `rgba(224,90,90,0.12)` | `rgba(176,112,104,0.12)` |
| `--brand-14` | `rgba(224,90,90,0.14)` | `rgba(176,112,104,0.14)` |
| `--brand-20` | `rgba(224,90,90,0.20)` | `rgba(176,112,104,0.20)` |
| `--brand-25` | `rgba(224,90,90,0.25)` | `rgba(176,112,104,0.25)` |
| `--brand-35` | `rgba(224,90,90,0.35)` | `rgba(176,112,104,0.35)` |
| `--brand-40` | `rgba(224,90,90,0.40)` | `rgba(176,112,104,0.40)` |
| `--brand-60` | `rgba(224,90,90,0.60)` | `rgba(176,112,104,0.60)` |
| `--glow-velog` | `rgba(32, 201, 151, 0.25)` | `rgba(32, 201, 151, 0.15)` |
| `--glow-brunch` | `rgba(100, 100, 100, 0.15)` | `rgba(100, 100, 100, 0.10)` |
| `--glow-github` | `rgba(10, 10, 10, 0.2)` | `rgba(10, 10, 10, 0.12)` |
| `--glow-melon` | `rgba(0, 205, 60, 0.25)` | `rgba(0, 205, 60, 0.15)` |
| `--glow-soundcloud` | `rgba(255, 85, 0, 0.25)` | `rgba(255, 85, 0, 0.15)` |

#### C. 세리프 폰트 적용

다음 4개 셀렉터에 `font-family: var(--font-serif)` 추가:

1. `.profile__name`: `font-family: var(--font-serif); font-weight: 700;` (기존 900→700)
2. `.profile__bio-quote strong`: `font-family: var(--font-serif);` 추가
3. `.modal-name`: `font-family: var(--font-serif); font-weight: 700;` (기존 900→700)
4. `.section-label`: `font-family: var(--font-serif); letter-spacing: 1.5px;` (기존 2px→1.5px)

#### D. 여백 확대

| 셀렉터 | 속성 | 현재 | 새 값 |
|---|---|---|---|
| `.profile` | `margin-bottom` | `72px` | `100px` |
| `.links--section` | `margin-bottom` | `32px` | `56px` |
| `.category-nav` | `margin-bottom` | `48px` | `64px` |
| `.social-grid` | `margin-bottom` | `32px` | `48px` |
| `.profile__bio` | `padding` | `28px 32px` | `32px 36px` |
| `.link-card__header` | `padding` | `18px 20px` | `20px 24px` |
| `.link-card__items` | `padding` | `14px 20px 18px` | `16px 24px 20px` |

#### E. 모션 제거/절제

1. **avatar-wrap float-gentle 제거**: `.profile__avatar-wrap`에서 `animation: float-gentle 6s ease-in-out infinite;` 삭제
2. **avatar-wrap ::before spin-ring 제거**: `animation: spin-ring 8s linear infinite;` 삭제, `opacity: 0.5` → `opacity: 0.35` (링 비주얼은 정적 유지)
3. **link-card::before conic-gradient 회전 보더 제거**: `background: conic-gradient(...)` → `background: transparent;`, `animation: rotate-angle 4s linear infinite;` 삭제, `&:hover::before { opacity: 1; }` → 삭제 또는 `opacity: 0`
4. **link-card:hover::after glass-sweep 제거**: `animation: glass-sweep 0.6s ease-out forwards;` 삭제
5. **카드 hover 단순화**: `box-shadow: 0 8px 40px rgba(0,0,0,0.35)` → `0 6px 24px rgba(0,0,0,0.25)`, icon scale `1.06→1.04`, arrow `4px→3px`
6. **odd/even 카드 회전 제거**: `rotate(0.5deg)` / `rotate(-0.5deg)` → 제거 (translateY(0)만 유지)
7. **불필요 keyframes 삭제 권장**: `@keyframes float-gentle`, `@keyframes glass-sweep`, `@keyframes rotate-angle`, `@property --angle`

#### F. 라이트 테마 연동

- `html.light .link-card::after` 블록 삭제 (glass-sweep 제거로 불필요)
- `html.light .link-card:hover` box-shadow → `0 4px 20px rgba(0,0,0,0.08)`
- `html.light .social-card:hover` box-shadow → `0 6px 24px rgba(0,0,0,0.08)`

#### G. 반응형 (520px) 여백 비례 조정

| 셀렉터 | 새 값 |
|---|---|
| `.profile` margin-bottom | `72px` 추가 |
| `.link-card__header` padding | `16px 18px` (기존 14px 16px) |
| `.link-card__items` padding | `12px 18px 16px` (기존 10px 16px 14px) |
| `.profile__bio` padding | `24px 24px` (기존 22px 20px) |

### assets/js/main.js 변경사항

1. `initCardTilt` 함수 전체 삭제 (섹션 주석 포함)
2. `initMagneticButtons` 함수 전체 삭제 (섹션 주석 포함)
3. DOMContentLoaded에서 `safeInit(initCardTilt, 'initCardTilt');` 제거
4. DOMContentLoaded에서 `safeInit(initMagneticButtons, 'initMagneticButtons');` 제거

---

## 주의사항
- 모달의 `border-radius: 24px`은 하드코딩이므로 `--radius` 변경에 영향 없음 (의도적 유지)
- `--spring-bounce` easing은 유지 (모달/버튼에서 적절)
- `@keyframes fadeInUp, blink-caret, shimmer-sweep, pulse-glow, gradient-shift, ripple-expand`는 모두 유지
- `prefers-reduced-motion` 블록은 방어적으로 유지
