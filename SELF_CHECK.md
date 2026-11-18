# 자체 점검

전략: 최초 구현(R1) — SPEC의 마크업·CSS를 원문 그대로 이식, 범위 외 추가 없음

## SPEC 기능 체크
- [x] H1 캐시 버스팅: style.css / main.js 쿼리 `?v=20261118-1` (2건)
- [x] H2 Game 제거: `data-filter="game"` 탭 버튼(SVG 포함) + `#section-game` 섹션 전체 삭제. 탭 5개(all/writing/music/app/social), 섹션 4개(writing/music/app/social) 순서 일치
- [x] H3 Lumark 제거: `#section-app`에서 Lumark `.featured-item` 삭제 → PopPath, 김간호는 음악박사 2개(순서 유지)
- [x] H4 Instagram 정리: @hy_nxx9 카드 삭제, 지식산책 아이콘 `icon--instagram2` → `icon--instagram`, 푸터 Instagram 링크를 SPEC 문자열 그대로 교체(@knowledge_stroll, `aria-hidden` 포함). Social = 지식산책 → 네이버
- [x] H5 SoundCloud: SPEC 최종 마크업으로 카드 전체 교체 (`.link-card--embed`, `.embed-item` ×3, HI THERE → LIE → IOU, 헤더 href의 utm 파라미터 제거, 인라인 style·width/height/frameborder/scrolling 없음)
- [x] C1 토큰: `--embed-h: 300px` (:root, `--stack-gap` 아래) / `260px` (520px :root 재정의 블록 안). `--radius-lg` 주석만 갱신(값 유지)
- [x] C2 잔재 삭제: `&.link-card--feature` 블록, `:has(.icon--instagram2)`, `:has(.icon--game)`, `.icon--instagram2`, `.icon--game` 삭제. 탭바 주석을 5개 탭 기준으로 수정(규칙 유지)
- [x] C3 `.link-card--embed` (`--feature` 자리, `.is-visible:hover` 리프트 해제 포함)
- [x] C4 `.embed-item` 블록: Featured Items 블록 끝, `@keyframes shimmer-sweep` 바로 앞에 SPEC 원문 그대로 삽입
- [x] C5 `.link-card--app` 2칸 가운데 정렬 (C3 바로 아래, 520px 별도 규칙 없음)
- [x] C6 reduced-motion 블록에 `.embed-item__arrow` transform 해제 2셀렉터 추가
- [x] JS: 변경 없음 (아래 검증)
- [x] sitemap.xml: game.html `<url>` 블록 삭제, XML well-formed 확인
- [x] .claude/launch.json: `startPath` → `"/"`, JSON 유효 확인
- [x] docs/components.md, docs/css-rules.md: SPEC §문서 항목대로 갱신
- [x] 이미지 4개 삭제 완료

## 완료 검증 체크리스트 결과
1. `grep -n "game\|Game" index.html assets/css/style.css sitemap.xml .claude/launch.json` → **0건** (파일별 0/0/0/0)
2. `grep -n "instagram2\|hy_nxx9\|lumark\|Lumark\|link-card--feature\|utm_source\|frameborder\|scrolling=\|ff5500" index.html assets/css/style.css` → **1건**, 허용된 `style.css:1531 .icon--soundcloud { background: linear-gradient(135deg, #ff5500, #ff7700); ... }` 뿐. index.html 0건
3. `embed-item__frame` 3건 / iframe 블록 내 `loading="lazy"` 3건 / `allow="autoplay; encrypted-media"` 3건 / `title="… — HG SoundCloud 플레이리스트"` 3건 / `auto_play=false` 3건 / `color=%23b07068` 3건
4. `?v=20261118-1` → **2건** (44행 CSS, 516행 JS)
5. 정의 없는 `var(--…)` → **0건** (python 스크립트로 used − defined 비교). `--embed-h` 정의 확인. 중괄호 `{` 350 / `}` 350 균형
6. 탭: `all writing music app social` (5개) / 섹션: `writing music app social` (4개) → 순서 일치
7. `npm run ui-check` → **실행 불가**. Playwright 브라우저(chromium headless shell)가 이 VM에 없고 `npx playwright install` 다운로드가 네트워크에서 실패(code=1). 대신 python HTMLParser로 index.html 태그 균형 검사 → 미닫힘 0, 오류 0
8. 이미지: 삭제 전 `grep -rn "app-lumark\|cover-holdmetight\|cover-halis\|cover-need" --include=*.html --include=*.css --include=*.js . | grep -v node_modules | grep -v _archive` → **0건** 확인 후 `assets/img/app-lumark.png`, `cover-holdmetight.jpg`, `cover-halis.jpg`, `cover-need.jpg` 4개 삭제 완료 (삭제 대기 파일 없음)

JS 확인: `grep -n "game\|lumark\|instagram\|feature" assets/js/main.js` → game/lumark/instagram 0건. `feature`는 `featured-item` 클래스 문자열(83–92, 154–166행, GitHub/Velog 렌더링)만 매치 — 이번 범위와 무관, 변경 없음.

## 패턴 준수 확인
- BEM 네이밍: 준수 — `.embed-item` 블록 + `__frame/__caption/__link/__index/__title/__by/__arrow`, 모디파이어 `.link-card--embed`
- CSS 변수 사용: 준수 — 새 규칙의 색은 전부 기존 변수(`--brand-08/35`, `--brand-text`, `--brand`, `--text*`, `--border`, `--bg-dark`). 하드코딩 색 추가 0건 (iframe URL의 `%23b07068`은 SPEC D3 결정의 위젯 파라미터)
- CSS 네이티브 중첩: 준수 — `&.link-card--embed`, `&.is-visible:hover`, `& .embed-item__*` (`&--` 사용 없음)
- 반응형 520px: 대응 — `--embed-h` 260px를 기존 `:root` 재정의 블록 안에 추가. 앱 행 식은 토큰 기반이라 별도 규칙 불필요
- reduced-motion: 대응 — `.embed-item__arrow` transform 해제 추가. 카드 리프트는 기존 `.link-card:hover { transform:none }`로 처리됨
- esc()/safeUrl(): 해당 없음 — 임베드는 정적 HTML, JS 변경 없음
- 가드 클래스: 해당 없음 (JS 변경 없음)
- DOMContentLoaded 등록: 해당 없음 (새 init 함수 없음)
- -webkit-backdrop-filter: 해당 없음 (새 backdrop-filter 없음)
- 파일 간 정합성: HTML의 `link-card--embed`, `embed-item*` 클래스 ↔ CSS 정의 일치. `icon--instagram` 정의 존재. 삭제된 클래스(`icon--game`, `icon--instagram2`, `link-card--feature`)는 HTML/CSS 모두 0건

## 필수 연동 변경
- `docs/css-rules.md` §8의 "카테고리 탭바가 6개를 한 줄에" → "5개"로 수정. SPEC §문서에 명시는 없으나 탭 수 변경으로 낡은 사실 기술이 되어 문서 정합을 위해 1단어만 수정.
- `docs/components.md`의 main.js 줄 수 표기 `~640줄` → `~680줄` (실측 684줄, SPEC "실제 값으로" 지시)

## 하고 싶었으나 범위 외로 미구현
- 없음 (`tests/ui-check.js`의 낡은 데스크톱 분기 문구는 SPEC대로 손대지 않음)

---

## QA 합격 후 후속 정리 (오케스트레이터, 2026-11-18)

QA_REPORT.md R1 판정은 합격(가중 7.8). P2 권장 6건 중 사소하고 확실한 4건을 바로 반영했다.

| QA P2 | 처리 |
|---|---|
| 1. components.md 중복 문장 | 반영 — 한 문장으로 합침 |
| 2. components.md style.css 줄 수 | 반영 — `~2000줄` |
| 3. 캡션 링크 label-in-name | 반영 — aria-label에 `· HG` 포함 (SPEC.md 마크업도 동기화) |
| 5. `padding: 2px 2px` | 반영 — `padding: 2px` (SPEC.md도 동기화) |
| 4. 터치 기기 sticky hover 링 | 미반영 — 탭한 앨범에 링이 남는 것이 "지금 이 앨범" 의도와 어긋나지 않음 |
| 6. 앱 행 개수 하드코딩 | 미반영 — `repeat(2, …)`가 렌더 검증된 값. 앱 수가 바뀌면 주석대로 규칙을 지운다 |

렌더 검증(헤드리스 Chrome, 1280×900 / 390×844, 다크·라이트): 탭 5개·섹션 4개, 키보드 순환 정상, 앱 타일 폭이 다른 카드 썸네일과 동일, 임베드 높이 300px/260px, 임베드 카드 hover 시 transform 없음, 가로 넘침 0, 깨진 이미지 0, 콘솔 오류 0.

---

## 기준 커밋 재정렬 + 점검 수정 (오케스트레이터, 2026-11-18)

위 내용은 로컬 `c2c6462` 기준 작업 기록이다. 원격 `main`이 `b8545e7`까지 나가 있어 변경분을 그 위에 다시 얹었고, 이어서 사이트 점검에서 나온 문제를 고쳤다. 상세는 SPEC.md 부록 A.

### 검증 (헤드리스 Chrome · 실제 Inter/Cormorant 글꼴 · 외부 API는 가짜 응답)
| 항목 | 결과 |
|---|---|
| 탭 5개 ↔ 섹션 4개, 키보드 순환(→ ×5) | 일치, `writing → music → app → social → all` |
| 탭 알약 가운데 정렬 (1280 / 700 / 390px) | 수정 전 데스크톱 +31.9px → 수정 후 0 / 0 / 0 |
| 앱 타일 폭 = 다른 카드 썸네일 폭 | 208.7 / 187.3 / 101.3px 동일, 좌우 여백 대칭 |
| 임베드 높이 | 300px (모바일 260px), 가로 넘침 0 |
| 임베드 카드 hover | transform 없음, 주황 글로우 유지. 다른 카드는 -2px 리프트 유지 |
| 닫힌 모달 | `visibility: hidden`, 닫기 버튼에 `focus()` 불가 |
| 모달 포커스 | 열면 닫기 버튼 → Shift+Tab은 마지막 링크 → Esc 후 연 트리거(Profile 버튼 / 아바타)로 복귀 |
| 테마 | 토글·새로고침 후 `html.light` 복원(인라인 스크립트가 CSP 아래 실행됨), `theme-color` `#0f0e15` ↔ `#f5f4f8` |
| CSP 위반 (`securitypolicyviolation`) | 0건 (정상 / rss2json 실패 / 전부 실패 시나리오 모두) |
| 주입 테스트 — GitHub·rss2json·codetabs 응답에 `<script>`, `onerror=`, `javascript:`, 따옴표 탈출 삽입 | 실행 0건, `on*` 속성 0개, 삽입된 `<script>`·`<img>` 0개, `javascript:` 링크는 `#`으로 대체 |
| Velog 대체 경로 | rss2json 실패 → codetabs 결과 표시 / 둘 다 실패 → 오류 문구 표시 |
| 정적 검사 | 죽은 CSS 클래스 0, 미정의 변수 0, 미사용 keyframes 0, 중복 id 0, 미사용 이미지 0, 없는 에셋 참조 0 |

운영 사이트에서 직접 확인한 것: Velog 프록시 무응답(15초 타임아웃 2회), rss2json 정상 응답(200, 10건), 작업 문서 배포(`/SPEC.html` 등 200), HTTPS 인증서 불일치(`ERR_CERT_COMMON_NAME_INVALID`).

하지 못한 것: 저장소의 `npm run ui-check`는 이 환경에 Playwright 브라우저가 없어 원본 그대로는 실행하지 못했다.

### QA R2(합격, 가중 8.0) 뒤 반영한 권장 사항
QA_REPORT.md R2의 P2 7건을 모두 반영하고 같은 검증을 다시 돌렸다.

| QA P2 | 처리 | 재검증 |
|---|---|---|
| 1. 모달 닫힘 끝에 오버레이가 다시 번쩍임 (기존 결함) | `.is-closing`에서 backdrop 전체를 내림 | 닫힘 0.33s 시점 backdrop opacity 0.00 |
| 2. docs의 CSP 해시 명령이 따옴표에서 깨짐 | 파일에서 직접 읽는 python 한 줄로 교체 | 명령 결과 = 메타의 해시 |
| 3. Velog 오류 문구가 원인과 어긋날 수 있음 | 빈 결과면 `lastError`를 'No items'로 갱신 | — |
| 4. theme-color 색을 JS에 중복 기재 | 현재 테마의 `--bg`를 읽어 씀 | `#0f0e15` ↔ `#f5f4f8` 동일하게 동작 |
| 5. http 썸네일이 CSP에 막혀 깨진 이미지가 됨 | https가 아니면 대체 썸네일(SVG) | http 썸네일 응답 → `<img>` 없음 |
| 6. `firstImageSrc()`가 엔티티를 풀지 않음 | 정규식 → DOMParser(비활성 문서) | `?a=1&amp;b=2` → `?a=1&b=2`, 본문 `<img onerror>`는 실행·삽입 0건 |
| 7. docs ↔ 코드 사소한 불일치 | 화살표 3px, `--bg-item` 추가, `safeInit`을 함수 선언식으로 유틸리티 구역에, `fetchWithTimeout` JSDoc | — |

`npm run ui-check`: 시스템 Chrome으로 대신 실행해 13개 중 12개 통과. 남은 1개(콘솔 에러)는 검증 환경이 외부 망을 막아 생긴 `ERR_TUNNEL_CONNECTION_FAILED`로, 사이트 결함이 아니다.
