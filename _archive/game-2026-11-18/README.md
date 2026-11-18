# 김간호는 음악박사 — 웹 미니게임 백업 (2026-11-18)

hgfolio.com 홈페이지에서 Game 섹션과 `/pages/game.html`을 내리면서 설계와 구현을 통째로 보관한 폴더.
폴더 이름이 `_`로 시작하므로 GitHub Pages(Jekyll) 빌드에서 제외되어 사이트에는 배포되지 않는다.
게임이 살아 있던 마지막 커밋은 git 태그 `archive/game-live-2026-11-18` (b8545e7).

## 무엇이 들어 있나

| 경로 | 원래 위치 | 내용 |
|---|---|---|
| `pages/game.html` | `/pages/game.html` | 게임 페이지 마크업 (HUD, 캔버스, 오버레이, 모바일 패드) |
| `assets/css/game.css` | `/assets/css/game.css` | 게임 전용 스타일. `style.css`의 `:root` 변수를 상속 |
| `assets/js/game.js` | `/assets/js/game.js` | 게임 로직 전체 (45초 타이머, 스프라이트, 충돌, 난이도, 최고점 저장) |
| `assets/img/cover-game.jpg` | `/assets/img/cover-game.jpg` | 홈페이지 Game 카드 커버 (818×740) |
| `tests/*.js` | `/tests/` | 게임 페이지용 Playwright 점검 스크립트 5개 |
| `snippets/index-nav-button.html` | `index.html` 카테고리 탭 | `data-filter="game"` 탭 버튼 |
| `snippets/index-section-game.html` | `index.html` | `#section-game` 섹션 (B 티어 `.link-card--feature` 카드) |
| `snippets/style-game-rules.css` | `assets/css/style.css` | `.link-card--feature`, `.icon--game`, 게임 카드 호버 글로우 |
| `snippets/sitemap-entry.xml` | `sitemap.xml` | 게임 페이지 URL 항목 |

iOS 버전 로드맵은 저장소 루트의 `iOS-game-roadmap.md`에 그대로 있다 (App Store 앱은 계속 서비스 중).

## 되살리는 법

1. `pages/`, `assets/`, `tests/` 안의 파일을 같은 상대 경로로 저장소 루트에 되돌린다.
2. `snippets/index-nav-button.html`을 `index.html`의 Music 탭 버튼 뒤에, `snippets/index-section-game.html`을 Music 섹션 뒤에 붙인다.
3. `snippets/style-game-rules.css`의 규칙을 `style.css`에 되돌린다 (피처 행은 `.link-card { }` 블록 안, 아이콘 색은 Platform Icon Colors 구역).
   지금 `style.css`에서는 그 자리에 `.link-card--embed`(SoundCloud 임베드 행)가 들어가 있다. 둘은 이름이 달라 함께 둘 수 있다.
4. `snippets/sitemap-entry.xml`을 `sitemap.xml`의 `<urlset>` 안에 넣는다.
5. `game.css`는 `--radius-lg` 등 `style.css`의 `:root` 변수에 의존한다. 그 사이 변수를 지웠다면 `game.css`의 `var()` 참조를 먼저 확인한다.

또는 `git checkout archive/game-live-2026-11-18 -- pages/game.html assets/css/game.css assets/js/game.js assets/img/cover-game.jpg` 로 파일만 되찾을 수 있다.
