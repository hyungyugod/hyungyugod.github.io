# PC 오빗 제거 + 프로필 전폭 재배치 + 섹션 간격 축소

## 개요
PC(데스크톱) 버전에서 히어로 섹션의 orbit 컴포넌트(궤도 트랙 SVG, 6개 orbit-card, orbit-stage 래퍼)를 제거하고, 프로필이 히어로 영역의 가로 전체를 활용하도록 재배치한다. 동시에 각 섹션(category-section, category-nav, links--section, footer 등)의 상하 마진/패딩을 현재의 약 절반으로 줄여 페이지 전체의 밀도를 높인다.

## 변경 유형
디자인

## 디자인 언어 & 의도
오빗 카드가 차지하던 공간을 해소하여 프로필이 화면 중앙에서 여유롭게 넓어지고, 방문자가 히어로에서 "한 사람의 이야기"에 더 집중할 수 있게 한다. 섹션 간격을 줄여 콘텐츠 밀도를 높이면서도 glassmorphism 카드 사이의 숨 쉴 공간은 유지하여, "정돈된 밀도감"을 만드는 것이 목표다.

## Sprint 범위 계약
- **허용**: 오빗 제거에 따라 히어로 레이아웃/높이 조정, 프로필 max-width 확장, 관련 JS init 호출 정리
- **금지**: 프로필 컴포넌트 내부 디자인 변경(모토 카드 리디자인, 바이오 스타일 변경 등), 새로운 애니메이션/효과 추가, 모바일 레이아웃 변경
- **판단 기준**: "이 변경이 없으면 오빗 제거 후 레이아웃이 깨지거나 섹션 간격 축소가 적용되지 않는가?" -> YES면 허용, NO면 금지

## 변경 범위

### index.html 변경사항
1. **오빗 관련 HTML 제거**:
   - `.orbit-stage` 래퍼(`<div class="orbit-stage" id="orbitStage">`)를 제거
   - 내부의 `<svg class="orbit-stage__track">` 제거
   - `<div class="orbit-stage__cards">` 및 내부 6개 `.orbit-card` 링크 모두 제거
   - **`.profile` 섹션은 보존**: orbit-stage 밖으로 빼내어 `.hero` 직접 자식으로 배치
   
2. **최종 히어로 구조**:
   ```html
   <section class="hero" id="hero">
     <button class="theme-toggle js-theme-toggle" ...>...</button>
     <section class="profile">
       <!-- 기존 프로필 내용 그대로 유지 -->
     </section>
     <div class="scroll-hint" ...>...</div>
   </section>
   ```

### assets/css/style.css 변경사항

1. **오빗 관련 CSS 전체 삭제**:
   - `.orbit-stage` 블록 전체 삭제
   - `.orbit-card`, `.orbit-card__icon`, `.orbit-card__label`, `.orbit-card__desc` 삭제
   - `html.light .orbit-card` 삭제
   - `html.light .orbit-stage__track` 삭제
   - `@media (max-width: 600px)` 내 orbit 관련 규칙 삭제
   - `:root`의 `--orbit-card-bg`, `--orbit-card-border` 변수는 **유지**
   - `html.light`의 orbit 관련 변수 오버라이드도 **유지**

2. **프로필 전폭 재배치** (`.hero` 내 `.profile`):
   - 기존 `.orbit-stage & .profile` 블록에서 설정하던 축소 스타일을 제거
   - `.profile`에 `max-width: 720px; width: 100%;` 추가하여 가로 전폭 활용 (데스크톱 기준)
   - `.profile__motto`의 `max-width`를 `640px`로 확장 (현재 540px)
   - `.profile__bio`의 `max-width`를 `640px`로 확장 (현재 540px)
   - 데스크톱(`@media (min-width: 900px)`) 내에서 `.profile`에 `max-width: 800px`으로 더 넓게

3. **섹션 간격 절반 축소** — 변경 대상과 값:

   | 대상 | 현재 값 | 변경 값 | 위치 |
   |---|---|---|---|
   | `.category-nav` margin-bottom | 64px | 32px | 기본 |
   | `.links--section` margin-bottom | 24px | 12px | 기본 |
   | `.category-section` padding-top/bottom | 48px (데스크톱) | 24px | `@media (min-width: 900px)` |
   | `.page-wrapper` padding-top | 48px (기본) / 60px (데스크톱) | 24px / 32px | 기본 + `@media (min-width: 900px)` |
   | `.footer` margin-top | 56px | 28px | 기본 |
   | `.social-grid` margin-bottom | 24px | 12px | 기본 |
   | `.music-showcase` margin-bottom | 24px (데스크톱) | 12px | `@media (min-width: 900px)` |

4. **반응형 대응** (`@media (max-width: 520px)`):
   - 모바일에서는 이미 orbit이 `display: none`이었으므로 레이아웃 영향 없음
   - 모바일 `.page-wrapper` padding-top: 40px -> 24px
   - 모바일 `.profile` margin-bottom: 72px -> 36px

### assets/js/main.js 변경사항

1. **`initOrbit` 함수 전체 삭제**: orbit-stage가 DOM에 존재하지 않으므로 불필요
2. **`DOMContentLoaded` 블록에서 `safeInit(initOrbit, 'initOrbit');` 호출 제거**
3. **`initHeroParallax` 수정**: `.orbit-stage` 참조 제거, `.profile`만 직접 선택

## 기능 상세

### 기능 1: 오빗 컴포넌트 제거
- 설명: 히어로 섹션에서 6개 플랫폼 링크가 궤도를 그리며 회전하는 orbit-card 컴포넌트를 완전히 제거한다
- 구현 위치: HTML(orbit 마크업 삭제), CSS(orbit 스타일 삭제), JS(initOrbit 함수 및 호출 삭제)

### 기능 2: 프로필 전폭 재배치
- 설명: orbit-stage 래퍼에서 해방된 프로필이 히어로 영역 가로를 넓게 활용하도록 max-width를 확장한다
- 구현 위치: HTML(profile을 hero 직접 자식으로 이동), CSS(max-width 확장)

### 기능 3: 섹션 간격 축소
- 설명: 모든 주요 섹션의 상하 마진/패딩을 현재의 약 절반으로 줄여 콘텐츠 밀도를 높인다
- 구현 위치: CSS(7개 spacing 값 조정)

## 주의사항
- 기존 기능 보전: orbit-card에 있던 플랫폼 링크는 하단 섹션에 모두 중복 존재하므로 접근 경로 유지됨
- `initHeroParallax`의 `.orbit-stage` 참조 반드시 수정
- `:root` CSS 변수: orbit 관련 변수는 삭제 금지 원칙에 따라 유지
- 모바일 영향 최소: 모바일에서는 이미 orbit이 숨겨져 있었으므로 레이아웃 변화 거의 없음
