# QA 검수 보고서 (R2 재평가)

## 적용 평가 기준
SPEC 변경 유형 = 디자인 → 디자인 변경 평가 기준(D1~D5) 적용.

## UI 동작 검증 (Playwright)

worktree의 HTML/CSS/JS를 C:/Users/user/Desktop/hyungyugod.github.io 메인 체크아웃에 동기화 후 `npm run ui-check` 실행.

| 체크 항목 | 결과 | 비고 |
|---|---|---|
| 테마 토글 (다크↔라이트) | PASS | 전환 정상 |
| 카테고리 필터 (writing) | PASS | 2개 섹션 숨김 |
| 카테고리 필터 (music) | PASS | 2개 섹션 숨김 |
| 카테고리 필터 (social) | PASS | 2개 섹션 숨김 |
| 카테고리 필터 (all) | PASS | 0개 숨김 |
| 프로필 모달 열기 | PASS | #profileModal.is-open 추가 확인 |
| 프로필 모달 닫기 | PASS | is-open 제거 확인 |
| 링크카드 href 유효성 | PASS | 2개 링크 유효 |
| 모바일 520px 뷰포트 | PASS | 핵심 3요소 visible |
| 콘솔 에러 | PASS | 0건 |

결과: 10/10 PASS. R1에서 FAIL이었던 "프로필 모달 열기/닫기"가 PASS로 전환됨 → sticky hero + .page-wrapper 배경으로 인한 이벤트 차단이 해소되었음을 UI 레벨에서 재확인.

스크린샷: C:/Users/user/Desktop/hyungyugod.github.io/tests/screenshots

## R1 지적사항 원복 검증 (git diff HEAD 기준)

`git diff HEAD -- assets/css/style.css` 전수 검사 결과, 이번 라운드 변경은 4개 블록 60줄 내외에만 국한:

| R1 지적 항목 | 현재 상태 | 판정 |
|---|---|---|
| #1 .page-wrapper 에 background: var(--bg) 추가 | style.css:307-313 background 속성 없음. diff 無 | 복구 완료 |
| #2 .hero 기본 블록 position: sticky; top: 0 | style.css:624-636 position: relative 만 존재. diff 無 | 복구 완료 |
| #3 데스크톱 @media(min-width:900px) .hero sticky | grep "position: sticky" 0건 | 복구 완료 |
| #4 prefers-reduced-motion 의 .hero position: static !important | 그 위치에 diff 無 (기존 .social-card 의 static !important 는 이번 라운드 변경 아님) | 복구 완료 |
| #5 .profile__motto align-items: stretch | 해당 속성 grep 0건 | 복구 완료 |
| #6 .profile__motto-item 의 flex/min-height:96px | style.css:438-468 원래 구조 복원. diff 無 | 복구 완료 |
| #7 .profile__motto-front 의 justify-content/flex/width | style.css:470-477 원래 상태 | 복구 완료 |
| #8 .profile__motto-kr min-height: calc(1.4em * 2) | style.css:520-526 min-height 없음 | 복구 완료 |
| #9 모바일 .profile__motto-item min-height: 82px | style.css:1468 padding 만 존재 | 복구 완료 |
| #10 .profile__subtitle + .profile__motto::before grid-column: 1 / -1 | 이번 라운드 diff 無 | 복구 완료 |
| #11 @media(hover:none) .profile__motto-item min-height: auto | 이번 라운드 diff 無 | 복구 완료 |

8개 P1 Sprint 범위 위반이 모두 원복되었음을 `git diff HEAD`로 직접 검증 완료. 이번 라운드 diff에 포함된 CSS 변경은 오직:
1. .profile 중첩 내 `& .profile__hint` + hover/focus 인접 셀렉터 (SPEC 허용 ①)
2. `.hero .profile__hint` entrance + 기존 딜레이 0.08s 씩 지연 (SPEC 허용 ②③)
3. 모바일 `@media(max-width:520px)` 내 `& .profile__hint` 1줄 (SPEC 허용 ①)
4. `prefers-reduced-motion` 블록 내 `.hero .profile__hint` 1줄 (SPEC 허용 ①)

네 블록 모두 SPEC Sprint 범위 계약의 허용 목록에 명시적으로 대응됨. .page-wrapper, .hero 구조, .profile__motto*, main.js, 모달 로직, 다른 섹션, :root 변수에는 단 한 줄의 변경도 없음.

## SPEC 기능 검증 (이전 라운드 수준 유지 여부)

- [PASS] .profile__hint 마크업: index.html:54, .profile__avatar-wrap 직후 / .profile__name 앞. aria-hidden="true", 텍스트 "프로필 확인"
- [PASS] 기본 스타일: style.css:382-395, font-size 11px, letter-spacing 2.4px, uppercase, color: var(--text-muted), opacity 0.45, margin -18px auto 18px, pointer-events: none, user-select: none, transition 포함 — SPEC 수치 정확 일치
- [PASS] hover/focus 강조: style.css:397-401, `.profile__avatar-wrap:hover + .profile__hint` 및 `&:has(.profile__avatar:focus-visible) .profile__hint` → opacity 0.75, letter-spacing 3px
- [PASS] Hero entrance 체인: style.css:648-676, hint 0.18s, name 0.24s, subtitle 0.32s, motto 0.40s, bio 0.52s, btn 0.64s — SPEC 명시 수치 정확 일치
- [PASS] 반응형 520px: style.css:1463, font-size 10px, letter-spacing 2px, margin -14px auto 14px
- [PASS] prefers-reduced-motion: style.css:1814, `.hero .profile__hint { animation: none; opacity: 0.45; transform: none; }`
- [PASS] JS 변경 없음: `git diff HEAD -- assets/js/main.js` 결과 공백. 모달/필터/테마 토글 로직 그대로 보존 — UI 체크 10/10으로 재확인

→ R1에서도 SPEC 본연 기능은 만점이었고, R2에서 해당 코드가 변경 없이 유지되었음을 grep/line-range로 교차 확인. 이전 라운드 수준 100% 유지.

## 검수 결과 요약

| 등급 | 건수 |
|---|---|
| P0 치명 | 0건 |
| P1 중요 | 0건 |
| P2 권장 | 1건 |

## P0 — 치명적 이슈
없음.

## P1 — 중요 이슈
없음. R1의 8개 P1 위반이 전부 원복되었고, 신규 P1은 발견되지 않음.

## P2 — 권장 사항

### 1. 라이트 테마 가독성 사전 점검
- 파일: assets/css/style.css:390
- 현재: `color: var(--text-muted); opacity: 0.45;` 한 가지 값
- 관찰: SPEC 주의사항에서 "라이트 테마 대비 부족 시 `html.light .profile__hint { opacity: 0.55; }` 조건부 추가" 언급. 현재 이 옵션은 도입되지 않았고, Generator는 "범위 최소화 원칙"으로 판단. 다크/라이트 테마에서 `--text-muted × 0.45`의 가독성이 유사하게 "조용한 캡션" 톤을 유지하는지 한 차례 육안 확인 권장.
- 등급 사유: SPEC이 선택 사항으로 명시했고 UI 체크도 통과이므로 P2. 후속 모니터링 포인트.

## 통과 항목

- 보안 (3-1): 정적 한글 텍스트만 삽입. innerHTML/eval/인라인 핸들러 신규 없음. esc()/safeUrl() 필요 사례 아님
- CSS 패턴 (3-2): BEM profile__hint 정확, `& .profile__hint` 네이티브 중첩 사용, `&:has(...)` 사용, SCSS 문법 없음. 하드코딩 색상 0건 (var(--text-muted), var(--font), var(--transition), var(--hero-entrance-duration), var(--ease-out-expo)). !important 신규 사용 없음.
- JS 패턴 (3-3): 변경 없음. 가드/fetch/init 패턴 원본 유지
- HTML 구조 (3-4): aria-hidden="true" 장식 표기 적절. 기존 target="_blank" + rel="noopener" 훼손 없음. 인라인 스타일 없음. #profileAvatar 등 기존 ID 보존
- 반응형 & 접근성 (3-5): @media (max-width: 520px) 대응, prefers-reduced-motion 대응. pointer-events: none 으로 아바타 클릭 영역 보존 → 키보드 사용자도 아바타 focus 시 힌트 opacity/letter-spacing 이 강조되어 affordance 인지 가능
- 파일 간 정합성 (3-6): .profile__hint 클래스 HTML/CSS 동일. 미사용 CSS/JS 없음. .profile__avatar-wrap, .profile__avatar, .profile__name 등 기존 셀렉터 그대로 참조
- Sprint 범위 준수 (3-7): git diff HEAD 가 SPEC 허용 목록 4개 블록과 1:1 매핑. 금지 영역에 0줄 변경. R1 대비 완전 준수

## AI 슬롭 패턴 검사
- 보라-청록 그라디언트 사용 없음 OK
- 과대 박스섀도 없음 OK (opacity, letter-spacing 트랜지션만)
- 임의 border-radius: 20px 없음 OK (radius 속성 자체 미사용)
- setTimeout 타이밍 해킹 없음 OK (CSS transition 만)
- SPEC 외 독립 기능 추가 없음 OK (R1 대비 Sprint 범위 위반 완전 해소)

---

## 채점

### D1. 디자인 품질 (30%) = 8/10
- glassmorphism 톤 유지: 캡션 계열(--text-muted + uppercase + letter-spacing)이 기존 .profile__subtitle(3px) 와 언어적으로 호응하되 한 단계 조용(2.4px, opacity 0.45)
- hover/focus 상태 명확: opacity 0.45→0.75, letter-spacing 2.4→3px 의 미묘한 두 축 변화로 "속삭이듯 응답"이라는 SPEC 의도 구현
- 다크/라이트 모두 대응: --text-muted 테마 변수 사용. 다만 라이트 테마에서 대비 미세 부족 가능성(P2 언급) — SPEC 이 선택 조항으로 열어둔 영역
- 0.08s 딜레이 단차로 entrance 체인이 자연스럽게 확장되며 기존 리듬 깨뜨리지 않음

### D2. 독창성 (30%) = 8/10
- 사이트 정체성(glassmorphism + 조용한 세리프 무드)에 특화된 "속삭이는 affordance" 아이디어. 일반적인 툴팁풍 버블이 아니라 캡션 언어의 농도만 조절하는 방식
- `:has(.profile__avatar:focus-visible)` 활용으로 키보드 사용자에게도 동일 효과를 CSS 만으로 부여
- 인접 형제(+) + :has() 두 셀렉터를 조합해 JS 없이 힌트-아바타 연동 달성 — 사이트에 이전에 없던 패턴

### D3. 패턴 일관성 (20%) = 9/10
- BEM profile__hint 정확, 5종 CSS 변수 활용, 하드코딩 색상 0건, 네이티브 중첩 `&` 전면 사용
- hero entrance 블록은 기존 컨벤션 (.hero .profile__xxx 형식) 그대로 확장
- P2 1건만 있고 코드 규칙 위반 없음

### D4. 반응형 & 접근성 (15%) = 9/10
- 520px 대응, prefers-reduced-motion 대응, pointer-events: none 으로 아바타 이벤트 보존
- `:focus-visible` + `:has()` 로 키보드 사용자 affordance 제공
- aria-hidden="true" 로 스크린리더 중복 읽기 방지

### D5. 기능 보전 (5%) = 10/10
- Playwright 10/10 PASS. R1 FAIL 이었던 프로필 모달 PASS 로 전환. main.js 변경 0바이트.

### 가중 점수
= (8 × 0.30) + (8 × 0.30) + (9 × 0.20) + (9 × 0.15) + (10 × 0.05)
= 2.40 + 2.40 + 1.80 + 1.35 + 0.50
= 8.45 / 10.0

### 이슈 건수 기준
- P0 0건, P1 0건 → 강제 하락 없음

## 최종 판정: 합격

판정 사유:
- 가중 점수 8.45 (7.0 이상 합격선 초과)
- P0/P1 이슈 0건
- R1 의 8개 Sprint 범위 위반이 git diff 로 검증 가능한 수준에서 모두 원복
- SPEC 본연 기능은 이전 라운드 만점 수준 그대로 유지 (hint 마크업·스타일·hover·entrance·반응형·reduced-motion 6개 체크포인트 모두 PASS)
- UI 체크 10/10, 그 중 R1 FAIL 이었던 프로필 모달이 실제로 회복됨

관대 검토 2회차 재확인:
- R2 diff 가 SPEC 허용 목록 4개 블록에 완전히 국한되고 금지 영역에 0줄이라는 objective 한 근거로 합격 판정.
- 8.45 점수에 대한 경계심: D1/D2 를 9점이 아닌 8점으로 보수적으로 매겼고, P2 1건을 실제로 반영했으며, 라이트 테마 사전 검증 누락을 감점 사유로 명시함. 관대화 경향 억제됨 판단.

후속 권장 (합격 후 차기 스프린트 고려 사항):
1. 라이트 테마에서 .profile__hint 실사용 가독성 육안 확인 → 부족 시 `html.light .profile__hint { opacity: 0.55; }` 1줄 추가 가능 (SPEC 원안 수치 유지 원칙과 충돌하지 않음)
