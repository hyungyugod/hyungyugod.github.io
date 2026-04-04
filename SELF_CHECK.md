# 자체 점검

## SPEC 기능 체크

### index.html
- [x] Google Fonts Cormorant Garamond 링크 추가: Inter/Noto Sans KR 링크 바로 아래에 추가 완료
- [x] HTML 구조 변경 없음: DOM 구조, 클래스명, ID, data 속성 일체 변경 없음

### assets/css/style.css

#### A. :root 변수 값 변경
- [x] --brand: #ff7b7b -> #c4847a
- [x] --brand-light: #ff9b9b -> #d4a49c
- [x] --brand-04 ~ --brand-60: 모든 10단계 투명도 변형 rgba(196,132,122,*) 로 변경
- [x] --brand-btn-text: rgba(212,164,156,0.85) 로 변경
- [x] --radius: 16px -> 10px
- [x] --radius-sm: 10px -> 6px
- [x] --transition: 0.38s -> 0.55s
- [x] --glow-velog/brunch/github/melon/soundcloud: 모두 절반 수준으로 뮤트화
- [x] --font-serif 새 변수 추가

#### B. html.light 변수 값 변경
- [x] --brand: #e05a5a -> #b07068
- [x] --brand-light: #d94444 -> #c48a82
- [x] --brand-04 ~ --brand-60: 모든 10단계 rgba(176,112,104,*) 로 변경
- [x] --glow-velog/brunch/github/melon/soundcloud: 모두 뮤트화

#### C. 세리프 폰트 적용
- [x] .profile__name: font-family: var(--font-serif), font-weight: 900->700
- [x] .profile__bio-quote strong: font-family: var(--font-serif) 추가
- [x] .modal-name: font-family: var(--font-serif), font-weight: 900->700
- [x] .section-label: font-family: var(--font-serif), letter-spacing: 2px->1.5px

#### D. 여백 확대
- [x] .profile margin-bottom: 72px -> 100px
- [x] .links--section margin-bottom: 32px -> 56px
- [x] .category-nav margin-bottom: 48px -> 64px
- [x] .social-grid margin-bottom: 32px -> 48px
- [x] .profile__bio padding: 28px 32px -> 32px 36px
- [x] .link-card__header padding: 18px 20px -> 20px 24px
- [x] .link-card__items padding: 14px 20px 18px -> 16px 24px 20px

#### E. 모션 제거/절제
- [x] avatar-wrap float-gentle 애니메이션 삭제
- [x] avatar-wrap::before spin-ring 애니메이션 삭제, opacity 0.5->0.35
- [x] link-card::before conic-gradient -> transparent, rotate-angle 삭제
- [x] link-card:hover::before opacity:1 규칙 삭제
- [x] link-card:hover::after glass-sweep 삭제
- [x] 카드 hover box-shadow: 0 8px 40px -> 0 6px 24px, icon scale 1.06->1.04, arrow 4px->3px
- [x] 카드 hover transform에서 rotate(0deg) 제거
- [x] odd/even 카드 회전 제거 (translateY(0)만 유지)
- [x] @keyframes float-gentle, glass-sweep, rotate-angle, @property --angle 삭제
- [x] 플랫폼별 glow box-shadow도 0 8px 40px -> 0 6px 24px 로 통일 (필수 연동 변경: hover shadow 일관성)

#### F. 라이트 테마 연동
- [x] html.light .link-card::after 블록 삭제
- [x] html.light .link-card:hover box-shadow -> 0 4px 20px rgba(0,0,0,0.08)
- [x] html.light .social-card:hover box-shadow -> 0 6px 24px rgba(0,0,0,0.08)

#### G. 반응형 (520px) 여백 비례 조정
- [x] .profile margin-bottom: 72px 추가
- [x] .link-card__header padding: 14px 16px -> 16px 18px
- [x] .link-card__items padding: 10px 16px 14px -> 12px 18px 16px
- [x] .profile__bio padding: 22px 20px -> 24px 24px

### assets/js/main.js
- [x] initCardTilt 함수 전체 삭제 (섹션 주석 포함)
- [x] initMagneticButtons 함수 전체 삭제 (섹션 주석 포함)
- [x] DOMContentLoaded에서 safeInit(initCardTilt, 'initCardTilt') 제거
- [x] DOMContentLoaded에서 safeInit(initMagneticButtons, 'initMagneticButtons') 제거

## 필수 연동 변경
- 플랫폼별 glow hover box-shadow 크기를 0 8px 40px -> 0 6px 24px 로 변경: E5에서 기본 hover shadow를 0 6px 24px로 줄였으므로, 플랫폼별 glow shadow도 동일 크기로 맞춰야 시각적 일관성이 유지됨

## 하고 싶었으나 범위 외로 미구현
- 없음

## 패턴 준수 확인
- BEM 네이밍: 준수 - 기존 BEM 클래스명 유지, 새 클래스 추가 없음
- CSS 변수 사용: 준수 - 모든 색상은 CSS 변수 사용, 하드코딩 없음
- CSS 네이티브 중첩: 준수 - & 문법 그대로 유지
- 반응형 520px: 대응 - G 항목 모두 반영 (profile margin-bottom, header/items padding, bio padding)
- reduced-motion: 대응 - 기존 블록 유지, 삭제된 애니메이션 관련 규칙도 방어적 유지
- esc()/safeUrl(): 해당 없음 - 이번 변경에 외부 데이터 처리 없음
- 가드 클래스: 해당 없음 - JS 함수 삭제만 수행
- DOMContentLoaded 등록: 준수 - 삭제된 함수의 호출만 제거, 나머지 유지
- -webkit-backdrop-filter: 기존 코드 그대로 유지
- 파일 간 정합성: 일치 - HTML 구조 변경 없음, CSS 클래스명 변경 없음, JS에서 삭제된 함수가 참조하던 CSS 클래스(.link-card, .social-card 등)는 여전히 존재
