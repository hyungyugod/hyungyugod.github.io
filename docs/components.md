# 컴포넌트 & 프로젝트 구조

이 문서는 프로젝트의 파일 구조, 현재 컴포넌트 목록, 테마 시스템을 정의합니다.

---

## 1. 파일 구조

```
/ (루트)
├── index.html              ← 메인 (유일한) 페이지
├── assets/
│   ├── css/style.css       ← 스타일 단일 파일 (~1100줄)
│   ├── js/main.js          ← 스크립트 단일 파일 (~360줄)
│   └── img/                ← 이미지 에셋
├── pages/                  ← 향후 서브페이지 (현재 비어 있음)
└── favicon.ico
```

### 파일 접근 권한

| 파일 | 수정 가능 |
|---|---|
| `index.html` | O |
| `assets/css/style.css` | O |
| `assets/js/main.js` | O |
| `assets/img/*` | 읽기만 |
| `pages/*.html` | O (서브페이지 생성 시) |

### 핵심 제약

- 새 CSS/JS 파일을 만들지 않는다. **단일 파일 구조를 유지**한다.
- 외부 라이브러리/프레임워크를 추가하지 않는다 (바닐라 JS, 네이티브 CSS).

---

## 2. 컴포넌트 목록

| 컴포넌트 | HTML 클래스 | JS 함수 | 설명 |
|---|---|---|---|
| 프로필 섹션 | `.profile` | — | 아바타, 이름, 소개, 버튼 |
| 카테고리 탭 | `.category-nav` | `initCategoryFilter()` | All/Writing/Music/Social 필터 |
| Velog 카드 | `.link-card` `#velog-items` | `fetchVelog()` | RSS → 최근 3개 포스트 |
| Brunch 카드 | `.link-card` | — | 정적 3개 아이템 |
| GitHub 카드 | `.link-card` `#github-items` | `fetchGitHub()` | API → 최근 3개 레포 |
| Melon 카드 | `.link-card` | — | 정적 3개 아이템 |
| SoundCloud 카드 | `.link-card` | — | 정적 3개 아이템 |
| 소셜 그리드 | `.social-grid` | — | Instagram, 지식산책, 네이버 |
| 프로필 모달 | `.modal-backdrop` | `initModal()` | 사진, 학력, 자격, 활동 |
| 푸터 | `.footer` | — | 소셜 아이콘 + 저작권 |

### 유틸리티 함수

`esc()` · `safeUrl()` · `fetchWithTimeout()` · `showFetchError()`

---

## 3. 카테고리 필터 시스템

`.category-section` 요소에 `data-category` 속성을 부여하여 탭 필터링:

| 탭 | data-category |
|---|---|
| All | 전체 표시 |
| Study & Dev | `study` |
| Music | `music` |
| Social | `social` |

GitHub/Velog 카드는 런타임에 동적 생성, 나머지는 정적 HTML.

---

## 4. 테마 시스템

`<html>` 태그의 `data-theme` 속성으로 전환:
- `data-theme="light"` — 라이트 모드
- `data-theme="dark"` — 다크 모드

`:root`와 `[data-theme="dark"]` 블록에 CSS 변수로 구현.
`localStorage`에 사용자 선택을 저장하여 유지.

---

## 5. 작업 체크리스트

새 기능을 구현할 때 아래 순서를 따른다:

### 작업 전
- [ ] 관련 파일을 **Read로 읽어** 기존 패턴 확인
- [ ] 수정할 영역의 주변 코드 파악

### HTML 작업
- [ ] 기존 컴포넌트와 일관된 구조 사용
- [ ] BEM 클래스명 + `js-` 후크 클래스 (필요 시)
- [ ] 동적 컨테이너에 고유 `id` 부여
- [ ] `target="_blank"` 외부 링크에 `rel="noopener"` 포함
- [ ] 접근성 속성 (`aria-label`, `role`, `tabindex` 등)

### CSS 작업
- [ ] 색상은 CSS 변수 사용 (새 색상은 `:root`에 추가)
- [ ] CSS 네이티브 중첩 `&` 문법
- [ ] 호버: `translateY` + `box-shadow` + `border-color` 조합
- [ ] 트랜지션: `var(--transition)`
- [ ] 글래스모피즘: `backdrop-filter` + `-webkit-` 접두사
- [ ] 간격: `gap` 속성 사용
- [ ] `@media (max-width: 520px)` 반응형 대응
- [ ] `@media (prefers-reduced-motion: reduce)` 접근성 대응

### JS 작업
- [ ] `function init기능명()` 또는 `async function fetch기능명()` 패턴
- [ ] `DOMContentLoaded` 블록에 호출 추가
- [ ] 가드 클래스 (`if (!el) return;`)
- [ ] 외부 데이터: `esc()` + `safeUrl()` 필수
- [ ] API: `fetchWithTimeout()` + `try/catch/finally`
- [ ] 에러: `console.warn()` + `showFetchError()`
- [ ] JSDoc 주석 + 섹션 구분선
- [ ] 코드 배치 순서 준수

### 작업 후
- [ ] 3개 파일 간 클래스명/ID 일관성 확인
- [ ] 모바일 520px 이하 대응 확인
