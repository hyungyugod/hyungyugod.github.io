# 자체 점검

전략: Case A — 최초 구현, SPEC 지시를 정밀하게 따름

## SPEC 기능 체크
- [x] `.profile__motto` 3-열 그리드 카드 HTML 삽입: `<p class="profile__subtitle">` 직후, `<div class="profile__bio">` 직전에 정확히 배치
- [x] Consistency / Curiosity / Confrontation 세 항목: 각각 `.profile__motto-item` 내 letter/word/kr 스팬 구조로 구현
- [x] `aria-label="개인 모토"` 접근성 속성: `.profile__motto`에 부여
- [x] `aria-hidden="true"` 장식용 이니셜: `.profile__motto-letter`에 부여
- [x] `.profile__subtitle` margin-bottom 28px → 20px 변경: 완료
- [x] `.profile__motto` 그리드 CSS: `repeat(3,1fr)`, gap 8px, max-width 440px, margin 0 auto 24px
- [x] `.profile__motto-item` 글래스모피즘 카드: backdrop-filter + -webkit-backdrop-filter, border, border-radius var(--radius-sm)
- [x] `.profile__motto-item` 호버: translateY(-2px) + border-color var(--brand-25) + box-shadow 0 0 14px var(--brand-12)
- [x] `.profile__motto-letter` 브랜드 그라디언트 텍스트: brand-light → brand, -webkit-background-clip, -webkit-text-fill-color
- [x] 반응형 `@media (max-width: 520px)`: gap/padding/font-size 축소 규칙 `.profile` 블록 내에 추가
- [x] `@media (prefers-reduced-motion: reduce)`: `.profile__motto-item` transition 축소 + hover transform 제거

## 패턴 준수 확인
- BEM 네이밍: 준수 — `.profile__motto`, `.profile__motto-item`, `.profile__motto-letter`, `.profile__motto-word`, `.profile__motto-kr` 모두 BEM 규칙 따름
- CSS 변수 사용: 준수 — 색상 전량 CSS 변수 사용 (--bg-card, --border, --brand-25, --brand-12, --brand-light, --brand, --text-muted, --text-dim), 하드코딩 없음
- CSS 네이티브 중첩: 준수 — `.profile` 블록 내 `& .profile__motto` 형태로 중첩, `&:hover` 내부 중첩
- 반응형 520px: 대응 — `@media (max-width: 520px)` 블록의 `.profile` 규칙에 5개 motto 하위 클래스 대응
- reduced-motion: 대응 — `@media (prefers-reduced-motion: reduce)` 블록에 `.profile__motto-item` transform:none 처리
- esc()/safeUrl(): 해당 없음 (JS 변경 없음, 정적 HTML만 추가)
- 가드 클래스: 해당 없음 (JS 변경 없음)
- DOMContentLoaded 등록: 해당 없음 (JS 변경 없음)
- -webkit-backdrop-filter: 준수 — `.profile__motto-item`에 backdrop-filter와 -webkit-backdrop-filter 함께 작성
- 파일 간 정합성: 준수 — index.html의 클래스명과 style.css 셀렉터 완전 일치 확인

## Sprint 범위 계약 준수
- 허용 범위 내 변경: `.profile__subtitle` margin-bottom 조정 (28px→20px) — SPEC 명시
- 금지 항목 미구현: bio 카드 스타일, 프로필 버튼, JS 로직, 새 keyframe, 독립 효과 — 모두 손대지 않음
- 하고 싶었으나 범위 외로 미구현: 없음
