# SELF_CHECK

## 구현 요약
- Hero에 Velog/GitHub 중심 카피, 주요 CTA, 활동 요약 칩을 추가했다.
- `page-wrapper` 상단에 `focus-board`를 추가해 Velog 최신 글과 GitHub 최신 레포를 가장 먼저 크게 보여주도록 재편했다.
- 기존 Velog/GitHub 중복 카드는 Study 섹션에서 제거하고, Brunch는 보조 글쓰기 아카이브로 유지했다.
- `fetchVelog()`/`fetchGitHub()` 렌더링을 새 카드에 맞게 보강해 source pill, 날짜/언어/star 메타를 표시했다.
- CSS/JS 링크에 버전 쿼리를 추가해 정적 배포와 로컬 확인에서 캐시된 이전 파일이 남는 문제를 줄였다.

## 파일별 점검
- `index.html`: `velog-items`, `github-items` ID는 각 1개만 존재한다. 외부 링크는 `target="_blank" rel="noopener"`를 유지했다.
- `assets/css/style.css`: focus board, profile CTA/stat, featured item meta, 모바일 520px 대응, reduced motion 대응을 추가했다.
- `assets/js/main.js`: 기존 fetch 흐름을 유지하며 `esc()`/`safeUrl()`을 사용해 동적 문자열과 URL을 처리했다.

## 검증
- `node --check assets/js/main.js` 통과.
- 브라우저에서 CSS/JS 버전 쿼리 로드 확인.
- 브라우저 DOM 기준 가로 overflow 없음.
- 브라우저에서 Velog RSS와 GitHub API가 각각 최근 3개 항목을 렌더링하는 것 확인.
- 카테고리 필터에서 Music 선택 시 writing/focus board 숨김, All 복귀 시 전체 노출 확인.

## 남은 리스크
- Browser screenshot 캡처 API가 시간 초과되어 이미지 파일 기반 스크린샷은 남기지 못했다. 대신 DOM 치수, 클릭 동작, 렌더링 텍스트 기준으로 검증했다.
