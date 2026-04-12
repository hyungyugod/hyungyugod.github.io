# 히어로 섹션 스플릿 레이아웃 리디자인

## 개요
히어로 섹션의 궤도 회전 카드(orbit-stage) 구조를 완전히 제거하고, 좌측 글래스모피즘 프로필 카드 + 우측 바이오/모토/타이핑 콘텐츠로 구성된 스플릿 레이아웃으로 교체한다. 배경에는 플로팅 키워드가 느리게 부유하며, 프로필 카드에는 마우스 트래킹 3D tilt 효과를 적용한다.

## 변경 유형
디자인

## 디자인 언어 & 의도
기존 궤도 카드의 기계적 회전 대신, 정적이면서도 깊이감 있는 스플릿 레이아웃으로 전환하여 방문자가 프로필을 직관적으로 읽을 수 있게 한다. 배경의 플로팅 키워드는 사이트 주인의 다면적 정체성(Code, Music, Essay, Philosophy)을 은은하게 암시하며, 3D tilt 카드는 마우스 인터랙션으로 "살아있는" 느낌을 준다. 전체적으로 glassmorphism + 코럴핑크 팔레트의 정체성을 유지하면서, 더 세련되고 읽기 쉬운 첫인상을 만드는 것이 목표다.

## Sprint 범위 계약
- **허용**: 히어로 섹션 내부 구조 변경에 필수적인 CSS/JS 수정, orbit 관련 코드 제거, hero-split 관련 신규 코드 추가
- **금지**: 히어로 섹션 외부(카테고리 탭, 링크 카드, 소셜 그리드, 모달, 푸터)의 디자인/기능 변경
- **판단 기준**: "이 변경이 없으면 히어로 스플릿 레이아웃이 제대로 동작하지 않는가?" → YES면 허용, NO면 금지

## 변경 범위

### index.html 변경사항

**제거할 요소:**
- `.orbit-stage` 전체 래퍼: SVG 트랙, `.orbit-stage__cards`, 6개 `.orbit-card` 링크
- `.orbit-stage` 내부의 `.profile` 섹션은 내용을 새 구조로 이전

**추가할 구조 (`.hero` 내부, theme-toggle 아래):**

```html
<!-- 플로팅 키워드 배경 -->
<div class="hero-keywords" aria-hidden="true">
  <span class="hero-keywords__item" style="--kw-x: 8%; --kw-y: 15%; --kw-duration: 22s; --kw-delay: 0s; --kw-size: 1.1;">Code</span>
  <span class="hero-keywords__item" style="--kw-x: 75%; --kw-y: 10%; --kw-duration: 28s; --kw-delay: -4s; --kw-size: 0.8;">Music</span>
  <span class="hero-keywords__item" style="--kw-x: 20%; --kw-y: 70%; --kw-duration: 25s; --kw-delay: -8s; --kw-size: 0.9;">Essay</span>
  <span class="hero-keywords__item" style="--kw-x: 85%; --kw-y: 65%; --kw-duration: 30s; --kw-delay: -2s; --kw-size: 1.0;">Philosophy</span>
  <span class="hero-keywords__item" style="--kw-x: 50%; --kw-y: 85%; --kw-duration: 26s; --kw-delay: -12s; --kw-size: 0.7;">Create</span>
  <span class="hero-keywords__item" style="--kw-x: 35%; --kw-y: 25%; --kw-duration: 24s; --kw-delay: -6s; --kw-size: 0.85;">Think</span>
  <span class="hero-keywords__item" style="--kw-x: 65%; --kw-y: 45%; --kw-duration: 27s; --kw-delay: -10s; --kw-size: 0.75;">Produce</span>
  <span class="hero-keywords__item" style="--kw-x: 12%; --kw-y: 50%; --kw-duration: 23s; --kw-delay: -14s; --kw-size: 0.95;">Dev</span>
  <span class="hero-keywords__item" style="--kw-x: 90%; --kw-y: 35%; --kw-duration: 29s; --kw-delay: -7s; --kw-size: 0.65;">Write</span>
  <span class="hero-keywords__item" style="--kw-x: 45%; --kw-y: 5%; --kw-duration: 31s; --kw-delay: -3s; --kw-size: 0.7;">Learn</span>
</div>

<!-- 스플릿 레이아웃 -->
<div class="hero-split" id="heroSplit">
  <!-- 좌: 프로필 카드 -->
  <div class="hero-split__card" id="heroCard">
    <div class="hero-split__card-inner">
      <div class="profile__halo" aria-hidden="true"></div>
      <div class="profile__avatar-wrap">
        <img class="profile__avatar js-open-profile" id="profileAvatar" src="/assets/img/15.jpg" alt="HG" tabindex="0">
      </div>
      <h1 class="profile__name">HG</h1>
      <p class="profile__subtitle">Developer · Producer · Writer</p>
      <div class="hero-social">
        <a class="hero-social__link" href="https://velog.io/@hyungyugod/posts" target="_blank" rel="noopener" aria-label="Velog">
          <span class="hero-social__icon icon--velog"><i class="fa-solid fa-code"></i></span>
        </a>
        <a class="hero-social__link" href="https://brunch.co.kr/@hyungyugood" target="_blank" rel="noopener" aria-label="Brunch">
          <span class="hero-social__icon icon--brunch"><i class="fa-solid fa-pen-nib"></i></span>
        </a>
        <a class="hero-social__link" href="https://github.com/hyungyugod" target="_blank" rel="noopener" aria-label="GitHub">
          <span class="hero-social__icon icon--github"><i class="fa-brands fa-github"></i></span>
        </a>
        <a class="hero-social__link" href="https://www.melon.com/artist/timeline.htm?artistId=4347369" target="_blank" rel="noopener" aria-label="Melon">
          <span class="hero-social__icon icon--melon"><i class="fa-solid fa-music"></i></span>
        </a>
        <a class="hero-social__link" href="https://soundcloud.com/user-928451677" target="_blank" rel="noopener" aria-label="SoundCloud">
          <span class="hero-social__icon icon--soundcloud"><i class="fa-brands fa-soundcloud"></i></span>
        </a>
        <a class="hero-social__link" href="https://www.instagram.com/hy_nxx9/" target="_blank" rel="noopener" aria-label="Instagram">
          <span class="hero-social__icon icon--instagram"><i class="fa-brands fa-instagram"></i></span>
        </a>
      </div>
    </div>
  </div>

  <!-- 우: 콘텐츠 -->
  <div class="hero-split__content">
    <div class="profile__motto" aria-label="개인 모토">
      <div class="profile__motto-item">
        <div class="profile__motto-front">
          <span class="profile__motto-letter" aria-hidden="true">C</span>
          <span class="profile__motto-word">Consistency</span>
          <span class="profile__motto-kr">흘러가지 않게 함</span>
        </div>
        <div class="profile__motto-back">
          <span class="profile__motto-back-text">매일, 어제보다 한 줄 더</span>
        </div>
      </div>
      <div class="profile__motto-item">
        <div class="profile__motto-front">
          <span class="profile__motto-letter" aria-hidden="true">C</span>
          <span class="profile__motto-word">Curiosity</span>
          <span class="profile__motto-kr">어디서든 의미를 찾음</span>
        </div>
        <div class="profile__motto-back">
          <span class="profile__motto-back-text">왜?라는 질문이 시작점</span>
        </div>
      </div>
      <div class="profile__motto-item">
        <div class="profile__motto-front">
          <span class="profile__motto-letter" aria-hidden="true">C</span>
          <span class="profile__motto-word">Confrontation</span>
          <span class="profile__motto-kr">자신을 잃지 않음</span>
        </div>
        <div class="profile__motto-back">
          <span class="profile__motto-back-text">도망치지 않는 용기</span>
        </div>
      </div>
    </div>
    <div class="profile__bio">
      <p class="profile__bio-quote">
        <strong>Once. Everything.</strong><br>
        In this one life, I want to keep being moved.<br>
        To experience widely, to learn steadily,<br>
        and to ride the waves as they come.
      </p>
      <div class="profile__bio-divider"></div>
      <p class="profile__bio-kr">
        한번 뿐인 삶에서 저는 꾸준히 흔들리고 싶습니다.<br>
        하여 다양하게 경험하고, 꾸준히 배우며,<br>
        인생의 파도를 한번 타보려합니다.
      </p>
      <p class="profile__bio-attr"><span class="typing" id="typingText"></span><span class="typing-cursor">|</span></p>
    </div>
    <button class="profile__btn js-open-profile" type="button">
      <i class="fa-regular fa-id-card"></i> 프로필 보기
    </button>
  </div>
</div>
```

**주의**: `.scroll-hint`는 기존 위치 유지 (`.hero` 직속 자식).

### assets/css/style.css 변경사항

**제거할 CSS:**
- `.orbit-stage` 블록 전체 (line 652~689)
- `.orbit-card` 관련 전체 (line 691~739)
- `html.light .orbit-card` (line 742~747)
- `html.light .orbit-stage__track` (line 749~751)
- `@media (max-width: 600px)` 내 orbit 관련 룰 (line 754~778)
- `@media (prefers-reduced-motion)` 내 `.orbit-card` 룰
- `:root`에서 `--orbit-card-bg`, `--orbit-card-border` 변수는 **유지** (삭제 금지 원칙)

**추가할 CSS 변수 (`:root` 블록에 추가):**
```css
--hero-split-gap: 60px;
--card-tilt-perspective: 800px;
```

**추가할 CSS 블록:**

1. **플로팅 키워드 배경**:
```css
.hero-keywords {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;

  & .hero-keywords__item {
    position: absolute;
    left: var(--kw-x);
    top: var(--kw-y);
    font-family: var(--font-serif);
    font-size: calc(var(--kw-size, 1) * 18px);
    font-weight: 600;
    color: var(--brand);
    opacity: 0.06;
    letter-spacing: 2px;
    text-transform: uppercase;
    animation: kw-float var(--kw-duration, 25s) ease-in-out var(--kw-delay, 0s) infinite;
    will-change: transform;
  }
}

@keyframes kw-float {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  25%      { transform: translate(15px, -20px) rotate(2deg); }
  50%      { transform: translate(-10px, 15px) rotate(-1deg); }
  75%      { transform: translate(20px, 10px) rotate(1.5deg); }
}

html.light .hero-keywords__item { opacity: 0.05; }
```

2. **스플릿 레이아웃**:
```css
.hero-split {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: var(--hero-split-gap);
  width: 100%;
  max-width: 900px;
  padding: 0 24px;
}

.hero-split__card {
  flex: 0 0 340px;
  perspective: var(--card-tilt-perspective);

  & .hero-split__card-inner {
    background: var(--bg-card);
    backdrop-filter: blur(20px) saturate(1.2);
    -webkit-backdrop-filter: blur(20px) saturate(1.2);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 40px 32px 32px;
    text-align: center;
    position: relative;
    transition: transform 0.15s ease-out, box-shadow 0.3s ease;
    transform-style: preserve-3d;
    will-change: transform;
    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  }

  & .profile__avatar-wrap { margin-bottom: 16px; }
  & .profile__avatar { width: 140px; height: 140px; }
  & .profile__name { margin-bottom: 6px; }
  & .profile__subtitle { margin-bottom: 20px; }
  & .profile__halo { width: 320px; height: 320px; transform: translate(-50%, -50%); top: 35%; left: 50%; }
}

html.light .hero-split__card-inner {
  background: rgba(255, 255, 255, 0.75);
  box-shadow: 0 8px 32px rgba(0,0,0,0.08);
}
```

3. **히어로 소셜 아이콘**:
```css
.hero-social {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 4px;
}

.hero-social__link {
  text-decoration: none;
  transition: transform 0.25s var(--spring-bounce);
  &:hover { transform: translateY(-3px) scale(1.1); }
}

.hero-social__icon {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  transition: box-shadow 0.25s ease;
  &:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.3); }
}
```

4. **우측 콘텐츠 영역**:
```css
.hero-split__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  & .profile__motto { max-width: 100%; margin: 0 0 8px; }
  & .profile__bio { max-width: 100%; margin: 0; }
  & .profile__btn { align-self: flex-start; }
}
```

5. **반응형 (520px 이하)** 기존 블록에 추가:
```css
.hero-split { flex-direction: column; gap: 24px; padding: 0 16px; }
.hero-split__card { flex: none; width: 100%; max-width: 320px; }
.hero-split__card .hero-split__card-inner { padding: 32px 24px 24px; }
.hero-split__card .profile__avatar { width: 110px; height: 110px; }
.hero-split__content { text-align: center; }
.hero-split__content .profile__btn { align-self: center; }
.hero-keywords__item { font-size: calc(var(--kw-size, 1) * 14px); }
```

6. **prefers-reduced-motion** 기존 블록에 추가:
```css
.hero-keywords__item { animation: none; }
.hero-split__card-inner { transition: none; }
```

### assets/js/main.js 변경사항

**제거:**
- `initOrbit()` 함수 전체
- `safeInit(initOrbit, 'initOrbit');` 호출

**수정:**
- `initHeroParallax()` 내 셀렉터: `.orbit-stage` → `.hero-split`

**추가 — `initCardTilt()` 함수:**
```javascript
function initCardTilt() {
  const card = document.getElementById('heroCard');
  if (!card) return;
  const inner = card.querySelector('.hero-split__card-inner');
  if (!inner) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(hover: none)').matches) return;

  const MAX_TILT = 8;

  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateY = (x - 0.5) * MAX_TILT * 2;
    const rotateX = (0.5 - y) * MAX_TILT * 2;
    inner.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }, { passive: true });

  card.addEventListener('mouseleave', () => {
    inner.style.transform = '';
  });
}
```

**DOMContentLoaded:** `safeInit(initOrbit, ...)` → `safeInit(initCardTilt, 'initCardTilt');`

## 주의사항
- `initNameShine()`은 변경 불필요 (`.profile__name`은 여전히 `.hero` 내부)
- `initMottoReveal()`은 변경 불필요 (전역 셀렉터 사용)
- `#profileAvatar` ID 유지 필수 (모달 포커스 복귀)
- `.js-open-profile` 클래스 아바타+버튼 모두 유지
- `--orbit-card-bg`, `--orbit-card-border` 변수 삭제 금지
- 소셜 링크 `rel="noopener"` 필수
- `.hero-keywords`에 `aria-hidden="true"` 필수
