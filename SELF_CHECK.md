# 자체 점검

## SPEC 기능 체크 (이번 라운드: CSS 비주얼 강화 10개 항목)
- [x] 변경 1: `.link-card:hover`에서 `background: var(--bg-card-hover)`와 `border-color: var(--border-hover)` 삭제 완료
- [x] 변경 2: `::after` glass sweep 의사요소 추가 — `.link-card::after`에 그라디언트 오버레이, hover 시 `glass-sweep` 애니메이션 트리거
- [x] 변경 3: `@keyframes glass-sweep` 추가 — translateX(-100%) -> translateX(100%) 스윕 효과
- [x] 변경 4: 라이트 테마 오버라이드 — `html.light .link-card::after`에 라이트 모드용 그라디언트 색상 적용
- [x] 변경 5: `.featured-item__label` 패딩 `10px` -> `8px 10px`, 폰트 크기 `11px` -> `10.5px` 변경
- [x] 변경 6: CSS counter 번호 뱃지 — `counter-reset: feat-counter` + `counter-increment` + `::before`로 1/2/3 번호 표시, hover 시 스프링 바운스로 등장
- [x] 변경 7: 디바이더 호버 그라디언트 — `.link-card:hover .link-card__divider`에 `linear-gradient(90deg, transparent, var(--brand-35), transparent)` 적용 + transition 추가
- [x] 변경 8: featured-item 호버 강화 — `translateY(-3px) scale(1.02)` + 강화된 box-shadow `0 8px 28px` + thumb `scale(1.08)`
- [x] 변경 9: 시차 트랜지션 웨이브 — `.featured-item` nth-child(1~3)에 0s/0.06s/0.12s transition-delay 적용
- [x] 변경 10: 모바일 반응형 업데이트 — 520px 이하에서 `.featured-item__label` 패딩 `6px 8px`/폰트 `9.5px` 축소, 카운터 뱃지 크기 `16px`/폰트 `8px` 축소

## 이전 SPEC 기능 (이미 구현됨, 유지 확인)
- [x] 기능 1~10 (모달 리뉴얼, 배경 애니메이션, 아바타 부유, 카드 그라디언트 보더, 플랫폼 글로우, 와이프 리빌, 카드 진입 다양화, 마그네틱 버튼, 푸터 호버 등) 모두 유지됨

## 패턴 준수 확인
- BEM 네이밍: 준수 — 기존 `.link-card__divider`, `.featured-item__label` 등 BEM 패턴 유지
- CSS 변수 사용: 준수 — 모든 색상에 `var(--brand-06)`, `var(--brand-35)`, `var(--brand-40)` 등 변수 사용, 하드코딩 없음
- CSS 네이티브 중첩: 준수 — `&:hover`, `&::after`, `&::before`, `&:nth-child()`, `&--loading` 등 모두 `&` 문법 사용
- 반응형 520px: 대응 완료 — featured-item label과 counter badge 모바일 크기 조정 추가
- reduced-motion: 대응 완료 — `.link-card:hover::after { animation: none; opacity: 0; }`, `.featured-item::before { display: none; }` 추가
- esc()/safeUrl(): 해당 없음 (CSS 전용 변경)
- 가드 클래스: 해당 없음 (JS 변경 없음)
- DOMContentLoaded 등록: 해당 없음 (JS 변경 없음)
- -webkit-backdrop-filter: 기존 코드에 이미 적용됨, 새 추가 사항에 backdrop-filter 없음
- 파일 간 정합성: 일치 — HTML 구조 변경 없음, 기존 클래스명 그대로 활용
- 기존 :root 변수 삭제/변경: 없음 (추가만 수행)
- loading skeleton 충돌 방지: `&--loading` 내부에 `&::before { display: none; }` 추가하여 counter badge 숨김
