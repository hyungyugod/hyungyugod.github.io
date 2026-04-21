# 자체 점검

전략: Case A — 이유: SPEC 본연의 `.profile__hint` 구현은 만점이었으므로 유지하고, QA_REPORT의 구체적 개선 지시 #1~#11을 문자 그대로 정밀 적용하여 Sprint 범위 위반 7개 영역을 원상 복구

## SPEC 기능 체크 (유지)
- [x] `.profile__hint` 요소 추가: `index.html`의 `.profile__avatar-wrap` 직후, `.profile__name` 바로 앞에 `<span class="profile__hint" aria-hidden="true">프로필 확인</span>` 삽입
- [x] `.profile__hint` 기본 스타일: font-size 11px, letter-spacing 2.4px, uppercase, `color: var(--text-muted)`, opacity 0.45, margin `-18px auto 18px`, pointer-events none
- [x] hover/focus-visible 강조: `.profile__avatar-wrap:hover + .profile__hint` 및 `.profile:has(.profile__avatar:focus-visible) .profile__hint` → opacity 0.75, letter-spacing 3px
- [x] Hero entrance 체인: hint 0.18s 신규 삽입, name 0.12→0.24s, subtitle 0.24→0.32s, motto 0.36→0.40s, bio 0.48→0.52s, btn 0.60→0.64s
- [x] 반응형 520px: font-size 10px, letter-spacing 2px, margin `-14px auto 14px`
- [x] prefers-reduced-motion: `.hero .profile__hint { animation: none; opacity: 0.45; transform: none; }`
- [x] JS 변경 없음 (SPEC 요구대로). 기존 모달 클릭 흐름은 `pointer-events: none`으로 보존

## QA 구체적 개선 지시 실행 체크 (#1~#13)
- [x] #1 `.page-wrapper`의 `background: var(--bg);` 한 줄 삭제 (style.css:313)
- [x] #2 `.hero` 기본 블록 `position: sticky; top: 0;` → `position: relative;` 복원 (style.css:633-635, 이제 `top: 0;` 한 줄도 함께 제거됨)
- [x] #3 데스크톱 `@media(min-width:900px)` 내 `.hero`의 `position: sticky;`, `top: 0;` 두 줄 삭제
- [x] #4 prefers-reduced-motion 블록 `.hero { position: static !important; }` 한 줄 삭제
- [x] #5 `.profile__motto`의 `align-items: stretch;` 한 줄 삭제
- [x] #6 `.profile__motto-item`의 `display: flex; flex-direction: column; min-height: 96px;` 3줄 삭제
- [x] #7 `.profile__motto-front`의 `justify-content: center; flex: 1 1 auto; width: 100%;` 3줄 삭제
- [x] #8 `.profile__motto-kr`의 `min-height: calc(1.4em * 2);` 한 줄 삭제
- [x] #9 모바일 `.profile__motto-item`의 `min-height: 82px;` 삭제 (padding만 유지)
- [x] #10 `.profile__subtitle + .profile__motto::before`의 `grid-column: 1 / -1;` 한 줄 삭제
- [x] #11 `@media(hover:none)` 내 `.profile__motto-item { min-height: auto; }` 블록 삭제
- [x] #12 `npm run ui-check` 실행 및 확인 — 아래 "UI 체크 재검증" 참조
- [x] #13 `git diff HEAD -- assets/css/style.css` 실제 실행 및 SPEC 허용 목록과 1:1 매핑 — 아래 "범위 계약 준수" 참조

## UI 체크 재검증 (#12)
worktree 경로는 `cd`가 리셋되므로 worktree 파일을 main checkout(`C:/Users/user/Desktop/hyungyugod.github.io`)에 동기화한 뒤 `npm run ui-check`를 실행했다.

```
=== Playwright UI Check ===
Server: http://localhost:8000 (managed: false)

[PASS] 테마 토글: 다크→라이트→다크 전환 정상
[PASS] 카테고리 필터 (writing): 2개 섹션 숨김 확인
[PASS] 카테고리 필터 (music): 2개 섹션 숨김 확인
[PASS] 카테고리 필터 (social): 2개 섹션 숨김 확인
[PASS] 카테고리 필터 (all): 0개 섹션 숨김 확인
[PASS] 프로필 모달 열기: #profileModal.is-open 추가 확인
[PASS] 프로필 모달 닫기: is-open 클래스 정상 제거
[PASS] 링크카드 href 유효성: 2개 링크 모두 유효
[PASS] 모바일 520px 뷰포트: 핵심 요소 3개 모두 visible
[PASS] 콘솔 에러: 0건

결과: 10/10 통과
```

이전 라운드의 "프로필 모달 FAIL" (sticky hero + page-wrapper background로 인한 클릭 차단)이 해소됨을 확인. 10개 체크 전체 PASS.

## 범위 계약 준수 (#13)

실제 실행한 `git diff HEAD -- assets/css/style.css` 결과를 그대로 첨부:

```diff
@@ -379,6 +379,27 @@ html.light .social-card:hover {
     }
   }
 
+  & .profile__hint {
+    display: block;
+    margin: -18px auto 18px;
+    font-family: var(--font);
+    font-size: 11px;
+    font-weight: 500;
+    letter-spacing: 2.4px;
+    text-transform: uppercase;
+    color: var(--text-muted);
+    opacity: 0.45;
+    transition: opacity var(--transition), letter-spacing var(--transition);
+    pointer-events: none;
+    user-select: none;
+  }
+
+  & .profile__avatar-wrap:hover + .profile__hint,
+  &:has(.profile__avatar:focus-visible) .profile__hint {
+    opacity: 0.75;
+    letter-spacing: 3px;
+  }
+
   & .profile__name {
     font-family: var(--font-serif);
     font-size: var(--hero-name-size);
@@ -624,29 +645,34 @@ html.light .social-card:hover {
   animation: heroEntrance var(--hero-entrance-duration) var(--ease-out-expo) 0s both;
 }
 
+.hero .profile__hint {
+  opacity: 0;
+  animation: heroEntrance var(--hero-entrance-duration) var(--ease-out-expo) 0.18s both;
+}
+
 .hero .profile__name {
   opacity: 0;
-  animation: heroEntrance var(--hero-entrance-duration) var(--ease-out-expo) 0.12s both;
+  animation: heroEntrance var(--hero-entrance-duration) var(--ease-out-expo) 0.24s both;
 }
 
 .hero .profile__subtitle {
   opacity: 0;
-  animation: heroEntrance var(--hero-entrance-duration) var(--ease-out-expo) 0.24s both;
+  animation: heroEntrance var(--hero-entrance-duration) var(--ease-out-expo) 0.32s both;
 }
 
 .hero .profile__motto {
   opacity: 0;
-  animation: heroEntrance var(--hero-entrance-duration) var(--ease-out-expo) 0.36s both;
+  animation: heroEntrance var(--hero-entrance-duration) var(--ease-out-expo) 0.40s both;
 }
 
 .hero .profile__bio {
   opacity: 0;
-  animation: heroEntrance var(--hero-entrance-duration) var(--ease-out-expo) 0.48s both;
+  animation: heroEntrance var(--hero-entrance-duration) var(--ease-out-expo) 0.52s both;
 }
 
 .hero .profile__btn {
   opacity: 0;
-  animation: heroEntrance var(--hero-entrance-duration) var(--ease-out-expo) 0.60s both;
+  animation: heroEntrance var(--hero-entrance-duration) var(--ease-out-expo) 0.64s both;
 }
 
 /* ---- Scroll Hint ---- */
@@ -1434,6 +1460,7 @@ html.light .social-card:hover {
     margin-bottom: 36px;
     & .profile__name         { font-size: var(--hero-name-size-mobile); }
     & .profile__avatar       { width: 96px; height: 96px; }
+    & .profile__hint         { font-size: 10px; letter-spacing: 2px; margin: -14px auto 14px; }
     & .profile__bio          { padding: 24px 24px; }
     & .profile__bio-quote    { font-size: 14px; }
     & .profile__bio-kr       { font-size: 12px; }
@@ -1784,6 +1811,7 @@ html.light .social-card:hover {
   .hero .profile__motto,
   .hero .profile__bio,
   .hero .profile__btn { animation: none; opacity: 1; transform: none; }
+  .hero .profile__hint { animation: none; opacity: 0.45; transform: none; }
   .hero__scroll-hint { animation: none; opacity: 1; }
   .hero__scroll-arrow { animation: none; opacity: 0.6; }
 }
```

### SPEC 허용 목록과 1:1 매핑

| diff 블록 | 내용 | SPEC 허용 조항 |
|---|---|---|
| @@ -379 (line 379 부근) | `.profile` 중첩 내부에 `& .profile__hint` 기본 스타일 추가 + hover/focus 인접 셀렉터 추가 | 허용 ①: `.profile__hint` 관련 스타일 규칙 추가 (hover 연동) |
| @@ -624 (line 645 부근) | `.hero .profile__hint` entrance 규칙 신규 + name/subtitle/motto/bio/btn 딜레이 0.12→0.24, 0.24→0.32, 0.36→0.40, 0.48→0.52, 0.60→0.64 | 허용 ②: hero entrance 애니메이션 연결 / 허용 ③: 기존 heroEntrance 딜레이를 한 단계씩 뒤로 미는 최소 연동 |
| @@ -1434 (line 1460 부근) | 모바일 `@media(max-width:520px)` 블록 내 `& .profile__hint` 한 줄 추가 | 허용 ①: 반응형 대응 |
| @@ -1784 (line 1811 부근) | `prefers-reduced-motion` 블록 내 `.hero .profile__hint` 한 줄 추가 | 허용 ①: prefers-reduced-motion 대응 |

**diff에 포함되지 않은 것(= 이전 라운드의 Sprint 외 변경이 전부 되돌려졌음을 증명)**:
- `.page-wrapper` 관련 변경 없음 → #1 복구 완료
- `.hero` 기본/데스크톱/reduced-motion의 position 관련 변경 없음 → #2/#3/#4 복구 완료
- `.profile__motto`, `.profile__motto-item`, `.profile__motto-front`, `.profile__motto-kr` 관련 변경 없음 → #5/#6/#7/#8 복구 완료
- 모바일 `.profile__motto-item`의 min-height 변경 없음 → #9 복구 완료
- `.profile__subtitle + .profile__motto::before`의 grid-column 변경 없음 → #10 복구 완료
- `@media(hover:none)` 내 `.profile__motto-item` 블록 추가 없음 → #11 복구 완료

→ **diff 전 항목이 SPEC 허용 목록 내에 있으며, SPEC 금지 영역(.profile__motto*, .hero 구조, .page-wrapper, main.js, 모달 로직, 다른 섹션, :root 변수)에는 단 한 줄의 변경도 없음. "SPEC 외 변경 없음"을 diff로 직접 검증 완료.**

## 패턴 준수 확인
- BEM 네이밍: 준수 (`profile__hint`)
- CSS 변수 사용: 준수 (`var(--text-muted)`, `var(--font)`, `var(--transition)`, `var(--hero-entrance-duration)`, `var(--ease-out-expo)`). 하드코딩 색상 없음
- CSS 네이티브 중첩: 준수 (`.profile` 블록 내부에서 `& .profile__hint` 사용, hover/focus 셀렉터도 `&` 기반)
- 반응형 520px: 대응 (기존 `.profile` 반응형 블록 내부에 추가)
- reduced-motion: 대응 (hero entrance 애니메이션 무효화 + opacity 0.45 유지)
- esc()/safeUrl(): 해당 없음 (정적 한글 텍스트, 외부 데이터 삽입 아님)
- 가드 클래스: 해당 없음 (JS 변경 없음)
- DOMContentLoaded 등록: 해당 없음 (JS 변경 없음)
- -webkit-backdrop-filter: 해당 없음 (새 backdrop-filter 추가 없음)
- 파일 간 정합성: `profile__hint` 클래스명이 HTML과 CSS에서 동일. `.profile__avatar-wrap`, `.profile__avatar`, `.profile__name` 등 기존 셀렉터 그대로 참조

## 시각 검증 참고
- 다크 테마에서 `--text-muted` × opacity 0.45 → 아바타(강한 원형)와 `.profile__name`(serif 큰 글자) 사이에서 배경으로 물러남
- 라이트 테마에서 대비 부족이 관찰되면 SPEC §주의사항에 따라 `html.light .profile__hint { opacity: 0.55; }` 조건부 추가 가능 — 이번 라운드에서는 범위 최소화 원칙에 따라 추가하지 않음(SPEC 원안 수치 우선)
