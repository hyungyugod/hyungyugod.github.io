# QA 검수 보고서 — SoundCloud NEED → IOU EP 교체 + Quiet Glass 정비 (1회차)

변경 유형: 혼합 → 기능 변경 평가 기준 적용
(Evaluator는 쓰기 권한이 없어 응답으로 보고했고, 오케스트레이터가 요약 저장함)

## 최종 판정: 합격 — 가중 7.6/10
- 패턴 7.5 / 보안·접근성 7 / 반응형·UI 8 / 기능 8.5
- P0 0건 · P1 1건 · P2 6건 · 범위 위반 0건

## 실측 요약 (Playwright, HEAD 스냅샷 대조)
- `npm run ui-check` 10/10, JS 에러 0
- IOU: SoundCloud 1번째, href `https://soundcloud.com/user-928451677/sets/iou`, 순서 IOU → 악어 → Burn It Up. NEED 흔적 0
- 외부 링크 손실: `need-feat-sumin` 1건뿐 (SoundCloud 프로필은 utm만 제거)
- 카드 hover lift 등장 후 즉시 동작(-2px), 라이트 테마 플랫폼 글로우 정상, 스포트라이트 동작
- 320/360/375/520/900/1280px 오버플로 0, reduced-motion에서 히어로 텍스트가 배경 위, 테마 토글 z-index 정상
- 모달 닫기 버튼 전 폭에서 화면 안, 포커스 트랩·복귀 정상, radiogroup 키보드 정상
- 대비: HEAD 대비 회귀 0건 (라이트 일부는 개선)

## Generator SPEC 이탈 3건 — 모두 정당
1. label 하단 여백 padding → margin (line-clamp 3번째 줄 누수 방지)
2. reduced-motion 셀렉터 특이도 보정 (SPEC 원문대로면 무효)
3. 모바일 탭 중복 규칙 삭제 (계산값 동일)

## P1
1. 라이트 테마 `.profile__eyebrow`(4.31~4.38:1), `.profile__action--primary`(4.32~4.40:1) AA 미달.
   브랜드 틴트가 어두운 히어로 배경 위에 겹쳐서. → `linear-gradient(var(--brand-XX), var(--brand-XX)), var(--bg-card)`로 글래스 위에 틴트.

## P2
1. 900px+ 히어로가 1280×800·1440×900에서 탭을 첫 화면에 못 보여줌 (주석과 불일치)
2. reduced-motion 블록 무효/중복 규칙 (`.profile__action:hover` 특이도 부족 등)
3. `.section-label` transition의 불필요한 transform
4. `docs/css-rules.md` 호버 표 낡음
5. 라이트 `.profile__subtitle` 4.39~4.49:1 (기존 결함, 개선됨)
6. `.modal-info__sub` opacity 0.6로 다크 3.61 / 라이트 2.84:1 (기존 결함)

## 후속 처리 (오케스트레이터)
P1과 P2-1~6을 직접 적용 후 재실측 — 결과는 아래 절에 추가.
