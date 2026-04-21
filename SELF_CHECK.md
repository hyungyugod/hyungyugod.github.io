# 자체 점검

전략: Case A — 이유: 최초 구현이므로 SPEC을 정밀하게 그대로 적용.

## SPEC 기능 체크
- [x] Game 탭을 `<a class="category-nav__btn--link">` → `<button data-filter="game" type="button">`로 교체 (index.html)
- [x] Social 섹션 바로 앞에 `#section-game` 카테고리 섹션 추가 (순서: Writing → Music → Game → Social)
- [x] `.game-showcase` 컴포넌트 마크업: thumb(좌) + body(우) + accent bar + Playable 배지 + meta 리스트 + CTA
- [x] `/pages/game.html`로 이동하는 두 링크(thumb, CTA) 각각 고유 `aria-label` 부여
- [x] `.game-showcase` 스타일: glassmorphism + brand-12 border + gradient accent + 16:10 thumb + retro 스캔라인 오버레이
- [x] hover: 박스 섀도우 brand 톤, 썸네일 scale(1.04), 아이콘 scale(1.08), 오버레이 opacity 연화, CTA 이동
- [x] scroll-reveal 호환: `opacity:0 → is-visible` 토글 + 트랜지션
- [x] 라이트 테마 대응: `html.light .game-showcase` 보더·섀도우 오버라이드
- [x] 반응형 520px: 1컬럼 전환 + 패딩/폰트 축소
- [x] `prefers-reduced-motion`: 기존 블록 셀렉터에 `.game-showcase` 추가 + thumb img transition 억제
- [x] `.category-nav__btn--link` 규칙 및 선행 주석 제거
- [x] main.js `initScrollReveal`와 `applyFilter` 셀렉터에 `.game-showcase` 추가
- [x] `<a>` 가드는 유지 (SPEC 권장대로 안전하게 남김)

## 패턴 준수 확인
- BEM 네이밍: 준수 (`.game-showcase__thumb`, `__body`, `__accent`, `__badge`, `__overlay` 등)
- CSS 변수 사용: 준수 (`--bg-card`, `--brand`, `--brand-08~40`, `--text-muted`, `--transition`, `--ease-out-expo`); 라이트 테마 오버라이드는 SPEC 지정 하드코딩 RGBA 사용
- CSS 네이티브 중첩: 준수 (`&`, `&:hover`, `& .child` 일관)
- 반응형 520px: 대응 (grid 1컬럼 + 크기 축소)
- reduced-motion: 대응 (기존 블록에 추가 + img transition 억제)
- esc()/safeUrl(): 해당 없음 (내부 정적 경로만 사용)
- 가드 클래스: `initCategoryFilter`의 `if (btn.tagName === 'A') return;` 유지
- DOMContentLoaded 등록: `initScrollReveal`, `initCategoryFilter` 기존 등록 그대로 사용 (신규 init 없음)
- -webkit-backdrop-filter: 컨테이너·배지 모두 함께 작성
- 파일 간 정합성: `.game-showcase` 클래스명 HTML/CSS/JS 일치, `data-category="game"` 섹션과 `data-filter="game"` 버튼 일치

## 범위 외 변경 없음
- `pages/game.html`, `game.css`, `game.js` 미수정
- `:root` 변수 추가/변경 없음
- 기존 `platform-showcase`/`music-showcase` 영향 없음
- `cover-band`에 게임 커버 추가 안 함
