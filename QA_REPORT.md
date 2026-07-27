# QA 검수 보고서 — Released Apps 탭/섹션

## UI 동작 검증 (Playwright, `npm run ui-check`, 7/9 통과)

| 체크 항목 | 결과 | 비고 |
|---|---|---|
| 테마 토글 | PASS | 다크→라이트→다크 정상 |
| 카테고리 필터 (writing) | PASS | 4개 섹션 숨김 |
| 카테고리 필터 (music) | PASS | 5개 섹션 숨김 |
| 카테고리 필터 (social) | PASS | 5개 섹션 숨김 |
| 카테고리 필터 (all) | PASS | 0개 숨김 (앱 섹션 포함 전체 표시) |
| 프로필 모달 | FAIL | **본 변경과 무관** — 테스트 환경 한계(fixed 요소 scrollIntoView 타임아웃). JS NO-OP이므로 회귀 불가. P2 |
| 링크카드 href | PASS | 3개 링크 유효 |
| 모바일 520px | PASS | 핵심 요소 3개 visible, 레이아웃 정상 |
| 콘솔 에러 | FAIL | 400 = `api.github.com` 외부 fetch 실패(레이트리밋 추정). 외부 fetch, JS 런타임 에러 아님. P2 |

두 FAIL 모두 `git diff`로 본 변경(앱 탭/섹션)과 인과관계 없음 실증(profile/modal/fetch/js 변경 0건, main.js 변경 0건).

## SPEC 기능 검증 (실증)

- **[PASS] 검증1 — 새 탭 버튼**: `data-filter="app"`인 `<button>`(`<a>` 아님). `initCategoryFilter`가 `.category-nav__btn` 순회, `if (btn.tagName === 'A') return;`에서 제외 대상 아님 → 자동 바인딩 확정.
- **[PASS] 검증2 — 새 섹션 매칭**: `data-category="app" id="section-app"`. `applyFilter`의 `sec.dataset.category === filter` 매칭 → 자동 표시/숨김. 'all' 필터 시 앱 섹션 포함 전체 표시 실증됨.
- **[PASS] 검증3 — 스크롤 리빌 게이팅**: 앱 카드 컨테이너 `.link-card`가 `initScrollReveal`·`applyFilter` 셀렉터에 포함 확인(grep). `.featured-item`은 두 목록 미포함이나 기존 Melon/SoundCloud 카드와 동일 패턴(부모 `.link-card` 리빌 시 자식 함께 표시) → opacity:0 버그 없음.
  - ⚠️ SPEC 자체 오류 포착: SPEC이 "`.featured-item`도 셀렉터에 포함"이라 서술했으나 실제 미포함. Generator가 SELF_CHECK에서 이 SPEC 오류를 정확히 식별하고 "컨테이너 `.link-card` 포함으로 결과 동일(NO-OP 유효)"이라 올바르게 판단(가점 요소).
- **[PASS] 검증4 — URL 정확/순서**: PopPath `id6785336260` → 김간호는 음악박사 `id6780122826`(퍼센트인코딩 decode 확인) → Lumark `id6776158784`. 순서·값 정확 일치.
- **[PASS] 검증5 — 이미지 경로**: `app-poppath.png`(34KB), `app-ganho.png`(116KB), `app-lumark.png`(45KB) 모두 `assets/img/`에 존재, src와 정확 매칭.
- **[PASS] 검증6 — CSS 변수화**: `--platform-app`/`--platform-app-14`/`--glow-app`이 `:root`+`html.light` 양쪽 정의. 기존 플랫폼 변수 삭제/변경 0건. `.icon--app`/`__source--app`/글로우 모두 변수 참조.
- **[PASS] 검증7 — 태그/중괄호 균형**: CSS `{`609 = `}`609. HTML 문법 깨짐 없음.
- **[PASS] 검증8 — main.js 무변경**: `git diff` 공란. NO-OP 확정.

## 검수 결과 요약

| 등급 | 건수 |
|---|---|
| P0 치명 | 0건 |
| P1 중요 | 0건 |
| P2 권장 | 2건 (모두 본 변경과 무관한 환경적 UI 체크 실패) |

## 통과 항목
- **보안**: 정적 신뢰 링크(esc/safeUrl 비대상), 전 외부링크 `rel="noopener"`+`target="_blank"`, 인라인 핸들러/eval/document.write 0건.
- **CSS 패턴**: 네이티브 `&` 중첩만(SCSS 0건), `!important` 0건, 하드코딩 색상 0건, BEM 준수, modifier가 올바른 부모 블록 내 배치.
- **접근성**: 모든 `<img>` 의미 있는 alt + `width/height 256`(CLS 방지) + `loading="lazy"`, 탭 `role="tab"`/`aria-selected`, SVG `aria-hidden`, 링크 `aria-label`.
- **AI 슬롭 회피**: 보라-청록 그라디언트/과대 그림자/임의 대형 radius 0건(22.37%는 iOS superellipse 비율 근거), 중복 scale 없음, 태그라인 담백.
- **Sprint 범위 준수**: SPEC 외 독립 기능 0건. 가짜 메타데이터·모달·캐러셀·신규 키프레임 없음.

## 채점 (혼합 → 기능 변경 기준 적용)
- **패턴 일관성 (40%): 10/10** — 기존 패턴 완벽 재사용, BEM/변수/네이티브중첩 전수 준수, SPEC 서술 오류까지 식별.
- **보안 & 접근성 (25%): 9/10** — 링크 보안 정당, rel=noopener 전수, aria/alt/CLS 완비. 모달 UI 체크 FAIL(무관) 형식 -1.
- **반응형 & UI 품질 (20%): 9/10** — 520px PASS, 신규 레이아웃 미발명, reduced-motion 커버, 정체성 유지.
- **기능 완성도 (15%): 10/10** — SPEC 3개 기능 전부 동작, URL/순서/이미지 정확, JS NO-OP 타당.

**가중 점수 = (10×0.4)+(9×0.25)+(9×0.2)+(10×0.15) = 9.55/10**

## 최종 판정: **합격**
- 9.55 ≥ 7.0, P0 0건 / P1 0건 → 합격.
- **구체적 개선 지시**: 없음. 추가 라운드 불필요.
