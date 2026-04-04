# 히어로 섹션 개인 모토 카드 그리드 추가

## 변경 유형
디자인

## 디자인 언어 & 의도
세 개의 "C"가 나란히 놓인 글래스 카드 그리드는 방문자가 사이트 주인의 가치관을 한눈에 읽을 수 있는 시각적 선언문 역할을 한다. 코럴핑크 brand gradient로 강조된 이니셜과 glassmorphic 카드 배경이 히어로 섹션의 절제된 긴장감을 유지하면서도 포트폴리오의 개성을 선명하게 각인시킨다. hover 시 카드가 살짝 떠오르며 brand 테두리가 빛나는 방식은 사이트 전반의 "반응하는 유리 표면" 언어와 정확히 일치한다.

## Sprint 범위 계약
- **허용**: `.profile__subtitle`의 `margin-bottom` 조정, SPEC 스타일 렌더링에 필수적인 최소 CSS 컨텍스트 수정
- **금지**: bio 카드 스타일 수정, 프로필 버튼 변경, JS 로직 추가, 새 keyframe 추가, SPEC에 없는 독립 효과 추가
- **판단 기준**: "이 변경이 없으면 SPEC 기능이 제대로 동작하지 않는가?" → YES면 허용, NO면 금지

## 변경 범위

### index.html
`<p class="profile__subtitle">` 바로 다음, `<div class="profile__bio">` 바로 앞에 삽입:

```html
<div class="profile__motto" aria-label="개인 모토">
  <div class="profile__motto-item">
    <span class="profile__motto-letter" aria-hidden="true">C</span>
    <span class="profile__motto-word">Consistency</span>
    <span class="profile__motto-kr">흘러가지 않게 함</span>
  </div>
  <div class="profile__motto-item">
    <span class="profile__motto-letter" aria-hidden="true">C</span>
    <span class="profile__motto-word">Curiosity</span>
    <span class="profile__motto-kr">어디서든 의미를 찾음</span>
  </div>
  <div class="profile__motto-item">
    <span class="profile__motto-letter" aria-hidden="true">C</span>
    <span class="profile__motto-word">Confrontation</span>
    <span class="profile__motto-kr">자신을 잃지 않음</span>
  </div>
</div>
```

### assets/css/style.css

**기존 수정**: `.profile__subtitle`의 `margin-bottom: 28px` → `margin-bottom: 20px`

**신규 규칙 추가** (`.profile` 블록 내, `.profile__subtitle` 규칙 직후):

```css
& .profile__motto {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  max-width: 440px;
  margin: 0 auto 24px;
}

& .profile__motto-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px 10px;
  background: var(--bg-card);
  backdrop-filter: blur(14px) saturate(1.1);
  -webkit-backdrop-filter: blur(14px) saturate(1.1);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  transition: transform var(--transition), border-color var(--transition), box-shadow var(--transition);

  &:hover {
    transform: translateY(-2px);
    border-color: var(--brand-25);
    box-shadow: 0 0 14px var(--brand-12);
  }
}

& .profile__motto-letter {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  background: linear-gradient(135deg, var(--brand-light) 0%, var(--brand) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

& .profile__motto-word {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--text-muted);
}

& .profile__motto-kr {
  font-size: 9px;
  color: var(--text-dim);
  letter-spacing: 0.2px;
  text-align: center;
  line-height: 1.4;
}
```

**반응형** (`@media (max-width: 520px)` 블록에 추가):
```css
& .profile__motto { gap: 6px; }
& .profile__motto-item { padding: 10px 6px 8px; }
& .profile__motto-letter { font-size: 22px; }
& .profile__motto-word { font-size: 9px; letter-spacing: 1px; }
& .profile__motto-kr { font-size: 8px; }
```

**모션 감소** (`@media (prefers-reduced-motion: reduce)` 블록에 추가):
```css
.profile__motto-item {
  transition: border-color var(--transition), box-shadow var(--transition);
  &:hover { transform: none; }
}
```

### assets/js/main.js
변경 없음.
