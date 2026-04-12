# Velog/Brunch/GitHub 플랫폼 쇼케이스 카드 + 섹션 간격 축소

## 개요
현재 Writing 섹션의 Velog, Brunch, GitHub이 동일한 소형 `link-card` 패턴으로 나열되어 있어 Music 섹션의 풍부한 쇼케이스와 비교해 빈약하게 느껴진다. 각 플랫폼을 고유한 비주얼 언어를 가진 대형 쇼케이스 카드로 리디자인하고, 섹션 간 과도한 간격을 줄여 콘텐츠 밀도를 높인다.

## 변경 유형
디자인

## 디자인 언어 & 의도
각 플랫폼 쇼케이스가 "나만의 공간"으로 느껴지도록 설계한다. Velog는 터미널/코드의 정밀함, Brunch는 문학적 서정성, GitHub는 오픈소스 빌더의 활력을 시각적으로 전달한다. 전체적으로 사이트의 glassmorphism + 코럴핑크 정체성은 유지하면서, 각 카드가 해당 플랫폼의 색채를 은은하게 머금는 것이 목표다.

## Sprint 범위 계약
- **허용**: 쇼케이스 카드 구현에 필요한 기존 link-card 구조 변경, section 간격 조정, 관련 CSS 변수 추가
- **금지**: Music 쇼케이스 변경, Social 섹션 레이아웃 변경, 새 JS 기능 추가 (기존 fetchGitHub/fetchVelog 수정은 허용), 히어로/프로필/모달/푸터 변경
- **판단 기준**: "이 변경이 없으면 SPEC 기능이 제대로 동작하지 않는가?" → YES면 허용, NO면 금지

## 변경 범위

### index.html 변경사항

**Writing 섹션 (`#section-writing`) 내부 구조 교체:**

기존 `.links.links--section` 컨테이너 안의 3개 `link-card`를 각각 독립적인 플랫폼 쇼케이스 카드로 교체한다. 각 카드는 `.platform-showcase` 클래스와 `data-platform` 속성을 갖는다.

1. **Velog 쇼케이스** (`.platform-showcase[data-platform="velog"]`)
   - 헤더: 플랫폼 아이콘 + 이름 + 설명 텍스트 + 화살표
   - 콘텐츠: 최근 포스트 3개 목록 (`#velog-items` 유지 — fetchVelog 호환)
   - 헤더 링크: `https://velog.io/@hyungyugod/posts`

2. **Brunch 쇼케이스** (`.platform-showcase[data-platform="brunch"]`)
   - 헤더: 플랫폼 아이콘 + 이름 + 설명 텍스트 + 화살표
   - 콘텐츠: 기존 정적 에세이 3개 목록 (썸네일 + 제목)
   - 헤더 링크: `https://brunch.co.kr/@hyungyugood`

3. **GitHub 쇼케이스** (`.platform-showcase[data-platform="github"]`)
   - 헤더: 플랫폼 아이콘 + 이름 + 설명 텍스트 + 화살표
   - 콘텐츠: 최근 레포 3개 목록 (`#github-items` 유지 — fetchGitHub 호환)
   - 헤더 링크: `https://github.com/hyungyugod`

**구체적 HTML 구조 (각 카드 공통 패턴):**
```html
<div class="platform-showcase" data-platform="velog">
  <div class="platform-showcase__header">
    <a class="platform-showcase__link" href="..." target="_blank" rel="noopener">
      <div class="platform-showcase__icon icon--velog">
        <i class="fa-solid fa-code"></i>
      </div>
      <div class="platform-showcase__info">
        <h3 class="platform-showcase__title">Velog</h3>
        <p class="platform-showcase__desc">개발 블로그 & 기술 포스트</p>
      </div>
      <i class="fa-solid fa-arrow-right platform-showcase__arrow"></i>
    </a>
  </div>
  <div class="platform-showcase__divider"></div>
  <div class="platform-showcase__content" id="velog-items">
    <!-- 기존 featured-item 또는 로딩 스켈레톤 -->
  </div>
</div>
```

- `.links.links--section` 래퍼는 유지하되, 내부 `.link-card`들을 `.platform-showcase`로 교체
- `#velog-items`, `#github-items` ID는 반드시 유지 (JS fetchVelog/fetchGitHub가 참조)
- 모든 외부 링크에 `target="_blank" rel="noopener"` 유지

### assets/css/style.css 변경사항

**1. 섹션 간격 축소 (모바일)**
- `.links--section`: `margin-bottom: 56px` → `margin-bottom: 24px`
- `.social-grid`: `margin-bottom: 48px` → `margin-bottom: 24px`
- `.section-label`: `margin-top: 8px` → `margin-top: 0`; `margin-bottom: 8px` → `margin-bottom: 6px`

**2. 섹션 간격 축소 (데스크탑 900px+)**
- `.category-section`: `min-height: 100vh` → `min-height: auto`; padding 축소
- 각 섹션 사이의 자연스러운 간격을 위해 `padding-top: 48px; padding-bottom: 48px`로 통일

**3. 플랫폼 쇼케이스 카드 스타일 (`.platform-showcase`)**

공통 베이스:
- `background: var(--bg-card)`, `backdrop-filter: blur(14px) saturate(1.1)`
- `border: 1px solid var(--border)`, `border-radius: var(--radius)`
- `overflow: hidden`
- `opacity: 0; transform: translateY(24px)` (스크롤 reveal용, `.is-visible`로 등장)
- 호버: `translateY(-2px)`, `box-shadow` 플랫폼별 glow 색상 적용

**플랫폼별 고유 디자인 (호버 시 좌측 보더 악센트):**

새 CSS 변수:
- `--platform-velog: #20c997`
- `--platform-brunch: #333` (다크 모드 시 #999)
- `--platform-github: #58a6ff`

각 플랫폼:
- `&[data-platform="velog"]`: 호버 시 `border-left: 3px solid var(--platform-velog)`, glow
- `&[data-platform="brunch"]`: 호버 시 `border-left: 3px solid var(--platform-brunch)`, glow
- `&[data-platform="github"]`: 호버 시 `border-left: 3px solid var(--platform-github)`, glow

비호버 상태에서도 좌측에 얇은(1px) 플랫폼 색상 보더를 `opacity: 0.3`으로 표시

**4. 데스크탑 레이아웃 (900px+)**
- Writing 섹션: `.category-section[data-category="writing"] .links--section`에 `grid-template-columns: 1fr` 적용 (한 줄에 하나씩 풀너비)

**5. featured-item 크기 확대 (쇼케이스 내부):**
- `.platform-showcase .featured-item__thumb`: `aspect-ratio: 16/10`
- `.platform-showcase .featured-item__label`: `font-size: 13px`

**6. 반응형, prefers-reduced-motion, 라이트 테마** 대응

### assets/js/main.js 변경사항

**1. `initScrollReveal` 수정:**
- 셀렉터에 `'.platform-showcase'` 추가

**2. `applyFilter` 수정:**
- 셀렉터에 `.platform-showcase` 추가

**3. fetchGitHub, fetchVelog:**
- 변경 불필요. `#github-items`, `#velog-items` ID가 유지되므로 기존 로직 그대로 동작.

## 주의사항
- `#velog-items`, `#github-items` ID는 절대 변경하지 않는다
- `.featured-item` 클래스명과 내부 구조 유지
- Music 섹션의 기존 `music-showcase`와 `link-card`는 변경하지 않는다
- Social 섹션의 `social-grid`는 margin 축소만 적용, 레이아웃 변경 없음
