# QA 검수 보고서 — 2회차 (원격 b8545e7 재정렬 + 점검 수정 13건)

변경 유형: **혼합** → 기능 변경 평가 기준 적용 (패턴 40 / 보안·접근성 25 / 반응형·UI 20 / 기능 15)
검수 대상: `git diff --cached origin/main` (31 files, +1237 / −623). SPEC.md 부록 A가 본문보다 우선.
검수 방식: 정적 검수 + 계산 재현. 이 VM에는 Playwright 브라우저가 없어 `npm run ui-check`를 실행하지 못했다(아래 표 참조).

## UI 동작 검증 (Playwright)

| 체크 항목 | 결과 | 비고 |
|---|---|---|
| 테마 토글 | 미실행 (오케스트레이터 PASS) | VM에 chromium 없음, `~/.cache/ms-playwright` 비어 있음. SELF_CHECK 표: `html.light` 복원·theme-color 전환 확인 |
| 카테고리 필터 (탭 4종 + all) | 미실행 (오케스트레이터 PASS) | 정적 확인: 탭 `writing,music,app,social` = 섹션 순서 일치 |
| 프로필 모달 | 미실행 (오케스트레이터 PASS) | 정적 확인: visibility 3상태 논리 정상 (아래 §재현 3) |
| 링크카드 href | 정적 PASS | 헤더 href 8개 모두 절대 https URL |
| 모바일 520px | 미실행 (오케스트레이터 PASS) | `--embed-h` 260px 재정의 확인 |
| 콘솔 에러 / CSP 위반 | 미실행 (오케스트레이터 0건) | 정적 확인: CSP 지시어 ↔ 실제 출처 전부 일치 |

`node --check assets/js/main.js tests/ui-check.js` → 둘 다 통과.

## 직접 재현한 항목

### 1. CSP 메타 — PASS
- 인라인 `<script>` 1개뿐(50행). 직접 계산한 sha256 = `xJ4EaEOHv88Cq0Hl3MvhAkMISahtSOv8y7wf/1fUnVM=` → 메타 값과 **일치**.
- `style="` 속성 0건, `on*=` 핸들러 0건, `<style>` 태그 0건. main.js의 innerHTML 템플릿에도 `style=` 없음(SVG `opacity`/`font-family`는 프레젠테이션 속성이라 CSP 대상 아님). JS의 `el.style.x =`(CSSOM)는 CSP가 막지 않음 — docs 기술과 일치.
- 출처 대조 (index.html + main.js에서 `https://` 전수 추출):

| 지시어 | 실제 사용 | 허용 여부 |
|---|---|---|
| script-src | `/assets/js/main.js`('self'), `static.cloudflareinsights.com/beacon.min.js`, 인라인 테마 스크립트(해시) | 전부 허용 |
| style-src | `/assets/css/style.css`, `fonts.googleapis.com` ×2, `cdnjs.cloudflare.com`(FA) | 전부 허용 |
| font-src | `fonts.gstatic.com`(Google Fonts), `cdnjs.cloudflare.com`(FA webfonts, 상대경로 → cdnjs) | 전부 허용 |
| connect-src | `api.github.com`, `api.rss2json.com`, `api.codetabs.com`, 비콘 전송 `cloudflareinsights.com`(또는 'self'의 `/cdn-cgi/rum`) | 전부 허용 |
| frame-src | `w.soundcloud.com` ×3 | 허용 |
| img-src | 'self' 이미지, Velog 썸네일(외부 https) | `'self' data: https:` 로 허용 |
- style.css에 `url(` / `@import` 0건 → 추가 출처 없음.
- 링크 전용 도메인(apps.apple.com, brunch, melon, instagram, naver 등)은 내비게이션이라 CSP 대상 아님.
- SRI 해시: VM 네트워크가 cdnjs를 403으로 막아 직접 재계산하지 못함. 오케스트레이터의 헤드리스 Chrome 검증(콘솔 오류 0, 아이콘 정상)으로 대체 — 해시가 틀렸다면 FA 전체가 로드 거부돼 콘솔 오류가 났을 것.

### 2. Velog 로더 — PASS
- 외부 값 경로: `title` → `esc()`, `link` → `safeUrl()` → `esc()`, `image` → `safeUrl()` → `esc()`, `date` → `toDateLabel()` → `esc()`, aria-label → `esc()`. 예외 없음.
- 흐름: rss2json 빈 배열 → `posts.length` 0이라 break 안 함 → codetabs 시도 ✔ / rss2json throw → `lastError` 기록 후 codetabs ✔ / 둘 다 실패 → `throw lastError` → 바깥 catch → `showFetchError` ✔ / 둘 다 빈 배열 → `Error('No items')` → "불러오기 실패" ✔.
- 처리되지 않는 거부: 로더 내부의 `res.json()`/`res.text()`/`DOMParser` 예외는 모두 안쪽 try에서 잡힘. `safeInit(fetchVelog)`가 반환 Promise를 버리지만 fetchVelog 본문 전체가 try/catch라 거부될 경로 없음 ✔.
- `toDateLabel`: Invalid Date 검사 후에만 `toISOString()` 호출 → RangeError 경로 없음 ✔.

### 3. 모달 visibility — PASS (논리 정상)
- 닫힘(기본): `visibility: hidden`, 전환 `opacity .38s, visibility 0s 0.38s`.
- 열기: after-change 스타일 `.is-open`의 `transition-delay: 0s`(두 속성에 반복 적용) → visibility 즉시 visible → 같은 틱의 `getFocusable()[0].focus()`가 성공함 ✔.
- 닫는 중(`is-open` + `is-closing`): `.is-open` 규칙이 그대로라 visibility visible 유지, 박스·오버레이만 0.25s 페이드 ✔.
- 닫힘 복귀: 두 클래스 동시 제거 → after-change 스타일은 기본 → visibility는 0.38s 뒤 hidden(그 사이 pointer-events none), 포커스는 즉시 opener로 ✔.
- `open(e)`: click·keydown 모두 `e.currentTarget`이 트리거 요소 → 아바타/Profile 버튼 각각으로 복귀 ✔. 직접 호출 시 `?? avatar` 대체 ✔.

### 4. 탭 알약 가운데 정렬 — PASS (계산)
컬럼 콘텐츠 시작 x0, 폭 C, 알약 폭 W. `margin-left: 0`이므로 정적 왼쪽 끝 = x0 (W > C여도 ltr에서 동일). `left: 50%` → +C/2, `translateX(-50%)` → −W/2.
→ 알약 중심 = x0 + C/2 − W/2 + W/2 = **x0 + C/2 (컬럼 중심)**. W < C, W > C 모두 성립. 
수정 전(auto 마진): W < C일 때 왼쪽 끝 x0 + (C−W)/2 → 중심이 (C−W)/2만큼 오른쪽으로 밀림 — SELF_CHECK의 +31.9px와 부합.
`max-width: calc(100vw − 32px)`로 W ≤ 뷰포트−32 → 왼쪽 끝 ≥ 16px, 넘침 없음. 520px 이하 규칙은 `width: 100%`만 쓰고 left/transform이 없어 충돌 없음. `.category-nav`에 다른 transform/animation 없음.

### 5. 병합 잔재 — PASS
`<<<<<<<`/`>>>>>>>`/`=======` 0건(3파일·docs·tests·_config). `ripple|parallax|halo|scroll-hint|feat-counter|:has(.icon--…):hover|game|lumark|hy_nxx9|instagram2|link-card--feature` → index.html·style.css·main.js·sitemap.xml·launch.json에서 0건. 이미지 9개 모두 참조 ≥1, 미참조 0.

### 6. `_config.yml` — PASS
`yaml.safe_load` 정상(`exclude` 13항목). index.html, assets/, favicon.ico, CNAME, robots.txt, sitemap.xml 어느 것도 제외 목록에 없음. `_archive/`, `.claude/`, `.agents/`, `.codex/`, `.DS_Store`는 Jekyll 기본 규칙(`_`/`.` 접두)으로 제외. `node_modules/`를 명시해 Jekyll 3.x에서 기본 exclude가 대체되는 경우도 커버.

### 7. 정합성 / 문법
- CSS 중괄호 301/301 균형(주석 제거 후). 미정의 `var(--…)` 0건. HTML/JS 클래스 중 CSS 미정의 0, CSS 클래스 중 미사용 0. `getElementById` 8개 ID 전부 HTML에 존재.
- sitemap.xml well-formed, launch.json 유효 JSON.

## SPEC 기능 검증
- [PASS] Game 제거 — 탭 5개 / 섹션 4개, 순서 일치, sitemap·launch.json에서 game 경로 제거
- [PASS] Lumark 제거 + `.link-card--app` 2칸 가운데 정렬 (부록 A-1대로 수정자 재부착)
- [PASS] @hy_nxx9 제거, 지식산책 `icon--instagram`, 푸터 링크 교체
- [PASS] SoundCloud 임베드 ×3 — title / lazy / allow / `auto_play=false` / `color=%23b07068`, width·height·frameborder 속성 없음
- [PASS] 부록 A-1 조정 6건 (`&:hover { transform: none }`, `--bg-item`, `--card-glow` 목록, `--radius-lg` 주석, `cover-iou.jpg` 삭제, `--app` 재부착)
- [PASS] 부록 A-2 수정 13건 — 각각 코드에서 확인 (Velog 2단 로더, 탭 정렬, 모달 visibility, opener 복귀, `.modal-info__text`, theme-color 단일 메타+동기화, 스켈레톤 `var(--border)`, `role="group"` 2곳, FA SRI, CSP, `esc()`의 `'`, `_config.yml`, 빈 `finally` 제거·ui-check 갱신)

## 범위 검사
부록 A-2가 main.js·ui-check.js·js-rules.md·_config.yml을 허용 목록에 추가했다. 스테이징된 변경은 모두 SPEC 본문 + 부록 A 항목에 대응한다. `_archive/game-2026-11-18/**`는 SPEC 개요의 "이미 백업·이동" 단계 산출물. 미추적 `.agents/ .codex/ AGENTS.md iOS-game-roadmap.md`는 스테이징되지 않음. **범위 위반 없음.**

## 검수 결과 요약

| 등급 | 건수 |
|---|---|
| P0 치명 | 0건 |
| P1 중요 | 0건 |
| P2 권장 | 7건 |

## P0 — 치명적 이슈
없음.

## P1 — 중요 이슈
없음.

## P2 — 권장 사항

### 1. 모달 닫힘 끝에 오버라이가 다시 번쩍인다 (기존 결함, 이번 diff가 만든 것은 아님)
- **파일**: `assets/css/style.css:1521-1547`, `1763-1776`
- **문제**: `is-closing` 동안 `.modal-overlay`만 opacity 0으로 가고 `.modal-backdrop`은 opacity 1이다. `onEnd()`가 `is-open`·`is-closing`을 함께 지우면 오버라이는 transition 없이 opacity 1로 즉시 돌아오고, 그다음 backdrop이 0.38s에 걸쳐 사라진다 → 0.25s 페이드아웃 뒤 어두운 블러 막이 한 번 더 나타났다 사라진다. origin/main에도 같은 구조가 있다.
- **수정 제안**: `&.is-closing { opacity: 0; transition: opacity 0.25s ease-in, visibility 0s linear 0.25s; }`를 backdrop 레벨에 추가해 전체가 한 번에 사라지게 하거나, `.modal-overlay`에 `transition: opacity 0.25s ease-in`을 기본으로 둔다.

### 2. docs의 CSP 해시 계산 명령이 실제 스크립트에서 깨진다
- **파일**: `docs/js-rules.md:124`
- **문제**: `printf '%s' '<스크립트 내용>' | openssl …` — 테마 스크립트에 작은따옴표(`'theme'`, `'light'`)가 들어 있어 셸 인용이 끊긴다. 문서대로 하면 틀린 해시가 나와 테마 스크립트가 조용히 차단되고 FOUC가 돌아온다.
- **수정 제안**: 파일에서 직접 뽑는 명령으로 교체 — `python3 -c "import hashlib,base64,re;s=open('index.html',encoding='utf-8').read();m=re.search(r'<script>(.*?)</script>',s,re.S);print(base64.b64encode(hashlib.sha256(m.group(1).encode()).digest()).decode())"`

### 3. Velog 오류 문구가 실패 원인과 어긋날 수 있다
- **파일**: `assets/js/main.js:186-196, 224`
- **문제**: rss2json이 시간 초과(AbortError)로 던지고 codetabs가 정상 응답했지만 항목이 0개면 `lastError`가 AbortError로 남아 "응답 시간 초과"가 표시된다.
- **수정 제안**: 로더가 빈 배열을 돌려주면 `lastError = new Error('No items')`로 갱신한다(`if (posts.length) break; lastError = new Error('No items');`).

### 4. theme-color 값이 JS에 하드코딩돼 `--bg`와 이중 관리
- **파일**: `assets/js/main.js:479`
- **문제**: `'#f5f4f8' : '#0f0e15'`가 `style.css:4, 82`의 `--bg`를 복제. components.md §4가 "함께 바꿀 것"이라고 적어 두었지만 동기화가 사람 손에 달렸다.
- **수정 제안**: `getComputedStyle(root).getPropertyValue('--bg').trim()`로 읽는다(클래스 토글 직후 동기 호출이면 새 값이 나온다).

### 5. `safeUrl()`은 http 이미지를 통과시키지만 CSP `img-src`는 막는다
- **파일**: `assets/js/main.js:202-206`, `index.html:8`
- **문제**: 중계 응답의 썸네일이 `http://`면 깨진 이미지 + CSP 콘솔 오류가 된다(SVG 대체 썸네일로 가지 않음).
- **수정 제안**: 이미지에 한해 `imgUrl.startsWith('https:')`일 때만 `<img>`를 쓰고 나머지는 SVG 대체로.

### 6. `firstImageSrc()`가 HTML 엔티티를 풀지 않는다
- **파일**: `assets/js/main.js:117-119`
- **문제**: description HTML의 `src="…?a=1&amp;b=2"`가 그대로 추출돼 `esc()`에서 `&amp;amp;`가 되고, 쿼리가 있는 이미지 URL이 깨진다. 보안 문제는 아님.
- **수정 제안**: 추출 후 `new DOMParser().parseFromString(src,'text/html').documentElement.textContent`로 디코드하거나 `.replace(/&amp;/g,'&')`.

### 7. docs ↔ 코드 사소한 불일치 (대부분 기존)
- `docs/css-rules.md` §5 표: 화살표 `translateX(4px)` ↔ 코드 `style.css:958` `translateX(3px)`.
- `docs/css-rules.md` §2 배경 목록에 원격이 도입한 `--bg-item`이 없다(이번 임베드 판이 이 토큰을 쓴다).
- `docs/js-rules.md` §4·§9는 `safeInit`을 유틸리티(함수 선언식, 2번 위치)로 분류하지만 코드는 `const` 화살표로 초기화 섹션(`main.js:238`)에 있다.
- `main.js:36-41` `fetchWithTimeout` JSDoc에 `opts` 파라미터 누락.

## 통과 항목
- 보안: innerHTML 3경로(GitHub·Velog·showFetchError) 전부 `esc()`, href/src 전부 `safeUrl()`+`esc()`, `esc()`가 `& < > " '` 5종 처리, eval/document.write 0건, 인라인 핸들러 0건, CSP 해시·출처 일치, `object-src 'none'`·`base-uri 'self'`·`form-action 'none'`.
- 접근성: 닫힌 모달 visibility hidden, 포커스 트랩·Esc·opener 복귀, `role="group"` 2곳, iframe `title`, 캡션 링크 label-in-name, 장식 아이콘 `aria-hidden`, reduced-motion 블록에 임베드 화살표 포함.
- CSS: 네이티브 중첩 `&.block--mod` 준수, 새 규칙 하드코딩 색 0, `!important`는 reduced-motion 내부만, 새 backdrop-filter 없음, 토큰 기반 520px 대응.
- JS: function 선언식 init/유틸, 가드 클래스, `console.warn`만 사용, 빈 `finally` 제거, `safeInit` 등록 유지.
- 파일 정합성·문법·병합 잔재·_config.yml·sitemap·launch.json 모두 이상 없음.
- 1회차 P2 6건: 4건 반영 확인(components.md 문장/줄 수, aria-label `· HG`, `padding: 2px`), 2건은 사유와 함께 보류 — 타당.

---

## 채점

**항목별 점수**:
- 패턴 일관성: 8/10 → 규칙 준수. theme-color 색 이중 관리, JSDoc 누락 등 P2 수준만 남음
- 보안 & 접근성: 8/10 → CSP·SRI·esc 강화·모달 visibility까지 2차 방어선이 갖춰짐. http 썸네일 처리·SRI 직접 재계산 불가가 감점 요인
- 반응형 & UI 품질: 8/10 → 탭 정렬을 계산으로 확인, 임베드 토큰 대응. 모달 닫힘 끝의 오버라이 재등장(기존 결함)은 남아 있음
- 기능 완성도: 8/10 → SPEC + 부록 A 19건 전부 구현, Velog 대체 경로 정상. 이 환경에서 ui-check를 실행하지 못해 −1 (검증은 오케스트레이터 렌더 결과로 대체)
- **가중 점수**: 8×0.4 + 8×0.25 + 8×0.2 + 8×0.15 = **8.0/10**

> 8.0 이상이라 관대하게 본 것은 아닌지 다시 확인했다. P1 후보였던 오버라이 재등장은 origin/main에 이미 있던 구조라 이번 diff의 회귀가 아니다. docs 해시 명령은 코드가 아니라 문서 결함이다. 그래서 둘 다 P2로 유지했다. 점수는 9점대가 아니라 8점에 묶어 두었다.

## 최종 판정: 합격

(P0 0건, P1 0건, 가중 8.0 ≥ 7.0)

**구체적 개선 지시** (선택 — 합격에는 필요 없음):
1. `docs/js-rules.md:124` 해시 명령을 파일에서 직접 계산하는 python 한 줄로 교체 (P2-2). 다음에 테마 스크립트를 고칠 사람이 그대로 따라 하다 막힌다.
2. `style.css` `.modal-backdrop.is-closing`에 backdrop 레벨 `opacity: 0`과 `visibility 0s linear 0.25s`를 추가해 닫힘 끝 오버라이 재등장을 없앤다 (P2-1).
3. `main.js:191` 빈 배열일 때 `lastError`를 `No items`로 갱신 (P2-3).
4. Playwright 브라우저가 있는 환경에서 `npm run ui-check`를 한 번 돌려 결과를 이 보고서에 덧붙인다.
