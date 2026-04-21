# 프로필 아바타 하단 '프로필 확인' 마이크로카피 힌트

## 개요
프로필 아바타를 클릭하면 모달이 열린다는 사실이 현재 시각적으로 암시되지 않아 affordance가 부족하다. 아바타와 이름 사이에 조용하고 낮은 대비의 "프로필 확인" 마이크로카피를 추가하여, 강한 시각적 노이즈 없이 상호작용 가능성을 속삭이듯 전달한다.

## 변경 유형
디자인

## 디자인 언어 & 의도
사이트 전체의 차분하고 서정적인 글래스모피즘 톤(코럴핑크 + 낮은 밀도의 세리프 무드)에 맞춰, "외치지 않고 속삭이는" 힌트를 만든다. 방문자가 아바타를 바라볼 때 눈 밑에 살짝 떠 있는 캡션처럼 인식되어, 무의식적으로 "눌러볼 수 있겠구나"를 느끼게 하는 것이 목표다. 호버/포커스 시에만 살짝 또렷해져서, 평상시에는 배경으로 물러나고 관심을 보이는 순간에만 응답하는 조심스러운 정체성을 갖는다.

## Sprint 범위 계약
Generator가 SPEC 외 변경을 하려 할 때의 판단 기준:
- **허용**:
  - `index.html`의 `.profile__avatar-wrap` 바로 아래 / `.profile__name` 바로 위에 힌트 요소(`.profile__hint`) 1개 추가
  - `assets/css/style.css`에 `.profile__hint` 관련 스타일 규칙 추가 (hero entrance 애니메이션 연결, hover 연동, 반응형, prefers-reduced-motion 대응)
  - 기존 `.hero .profile__name` 등의 heroEntrance 딜레이 타이밍을 0.06~0.12s만큼 한 단계씩 뒤로 밀어 순서를 자연스럽게 맞추는 것은 허용 (아바타 → 힌트 → 이름 → 서브타이틀 순서 보장을 위한 최소 연동)
- **금지**:
  - 기존 `.profile__name`, `.profile__subtitle`, `.profile__motto`, `.profile__bio`, `.profile__btn`의 색상/폰트/간격/구조 변경
  - `assets/js/main.js` 수정 (새 JS 로직 추가 없이 해결)
  - 모달 로직(`initModal`), `js-open-profile` 동작 변경
  - 다른 섹션(Routine, Cover band, Category, Music, Social, Footer) 수정
  - `:root` CSS 변수 삭제/변경
  - 강한 색상 강조(브랜드 컬러 100% 사용, 큰 배경 박스 등) — "조용한 마이크로카피" 원칙 위배

## 변경 범위

### index.html 변경사항
- `section.profile` 내부, `.profile__avatar-wrap` 닫힘 직후, `<h1 class="profile__name">` 바로 앞에 다음 마크업 추가:
  ```html
  <span class="profile__hint" aria-hidden="true">프로필 확인</span>
  ```
- `aria-hidden="true"`: 장식적 affordance 힌트. 스크린리더는 아바타 alt "HG"와 하단 "프로필 보기" 버튼으로 이미 진입 경로 있음
- `tabindex` 없음, 이벤트 바인딩 없음 (순수 시각 힌트)

### assets/css/style.css 변경사항

**1) `.profile` 네이티브 중첩 내부, `& .profile__avatar` 다음·`& .profile__name` 앞에 추가**
```css
& .profile__hint {
  display: block;
  margin: -18px auto 18px;
  font-family: var(--font);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 2.4px;
  text-transform: uppercase;
  color: var(--text-muted);
  opacity: 0.45;
  transition: opacity var(--transition), letter-spacing var(--transition);
  pointer-events: none;
  user-select: none;
}
```

**2) 아바타 hover/focus 시 힌트 강조 (profile 블록 밖, 인접 형제 셀렉터)**
```css
.profile__avatar-wrap:hover + .profile__hint,
.profile:has(.profile__avatar:focus-visible) .profile__hint {
  opacity: 0.75;
  letter-spacing: 3px;
}
```
- 핵심 동작 요구: "아바타 hover 또는 focus-visible 시 hint opacity 0.45→0.75, letter-spacing 2.4→3px". 구체 셀렉터는 Generator가 DOM을 확인해 확정.

**3) Hero entrance 애니메이션 체인에 삽입**
- 신규: `.hero .profile__hint { opacity: 0; animation: heroEntrance var(--hero-entrance-duration) var(--ease-out-expo) 0.18s both; }`
- 기존 딜레이 조정 (최소 연동):
  - `.hero .profile__name` 0.12s → 0.24s
  - `.hero .profile__subtitle` 0.24s → 0.32s
  - `.hero .profile__motto` 0.36s → 0.40s
  - `.hero .profile__bio` 0.48s → 0.52s
  - `.hero .profile__btn` 0.60s → 0.64s

**4) 반응형 `@media (max-width: 520px)` 블록**
```css
& .profile__hint {
  font-size: 10px;
  letter-spacing: 2px;
  margin: -14px auto 14px;
}
```

**5) `@media (prefers-reduced-motion: reduce)` 블록**
```css
.hero .profile__hint { animation: none; opacity: 0.45; transform: none; }
```

### assets/js/main.js 변경사항
**변경 없음.** `pointer-events: none`이라 기존 아바타 클릭 흐름 그대로 유지.

## 수치 근거
- `font-size: 11px` — 사용자 요청 범위 하한
- `opacity: 0.45` — 사용자 요청 범위 중앙값
- `letter-spacing: 2.4px` + uppercase — `profile__subtitle(3px)`과 같은 캡션 언어이되 한 단계 조용
- `color: var(--text-muted)` — 테마 변수, 라이트/다크 자동 대응
- `margin-top: -18px` — 아바타 halo(`::before inset: -4px`)와 간섭 없음

## 주의사항
- **AI 슬롭 패턴 회피**: 그라디언트/박스섀도/과한 radius 없음, JS setTimeout 없음
- **접근성**: aria-hidden 장식, pointer-events: none으로 클릭 영역 보존, 아바타 focus-visible 시 힌트 강조되어 키보드 사용자도 affordance 인지 가능
- **보안**: 정적 한글 텍스트만 삽입, XSS 영향 없음
- **라이트 테마**: `--text-muted`이 테마 따라 전환. 대비 부족 시 Generator가 시각 확인 후 `html.light .profile__hint { opacity: 0.55; }` 추가 판단
