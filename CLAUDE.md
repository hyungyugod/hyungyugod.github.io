# CLAUDE.md

Personal portfolio website at [hgfolio.com](https://hgfolio.com), hosted on GitHub Pages.
Zero-build static site — pure HTML, CSS, and JavaScript with no npm, bundlers, or frameworks.

## Development

```bash
python -m http.server 8000
# visit http://localhost:8000
```

Deploy by pushing to `main` — GitHub Pages serves files directly.

## Architecture

All code lives in three files:

| File | Role |
|---|---|
| `index.html` | Single HTML page. Category filtering shows/hides sections with JS. |
| `assets/css/style.css` | All styling (~1100 lines). CSS custom properties for dark/light theming. BEM naming. |
| `assets/js/main.js` | All client-side logic (~360 lines). Standalone functions in `DOMContentLoaded`. |

## Reference Docs

Detailed specs in `docs/` — Claude reads these on-demand when relevant:

- `docs/css-rules.md` — CSS conventions: native nesting, color system, BEM, glassmorphism, responsive
- `docs/js-rules.md` — JS patterns: DOM selection, async, security (`esc`/`safeUrl`), init pattern
- `docs/components.md` — Project structure, component inventory, theme system, work checklist

---

## Harness: 기능 변경 파이프라인

사용자가 **기능 변경/추가**를 요청하면, 아래 3-Agent 파이프라인을 자동 실행합니다.
(단순 질문, 설명 요청, 버그 수정 등은 하네스 없이 직접 처리)

```
[사용자 요청]
      ↓
 ① Planner    → SPEC.md
      ↓
 ② Generator  → 3개 파일 수정 + SELF_CHECK.md
      ↓
 ③ Evaluator  → QA_REPORT.md
      ↓
 ④ 판정: 합격 → 완료 / 불합격 → ②로 (최대 3회)
```

### 단계 0: 이전 산출물 초기화 (필수)

Planner 호출 **전에** 반드시 이전 파이프라인 산출물을 삭제한다.
```bash
rm -f SPEC.md SELF_CHECK.md QA_REPORT.md
```
이전 SPEC.md가 남아 있으면 Generator가 새 SPEC이 아닌 이전 SPEC을 읽고 엉뚱한 변경을 적용하는 사고가 발생한다.

### 단계 1: Planner 호출

subagent_type: `planner`

```
.claude/agents/evaluation_criteria.md 파일을 읽고 참고하라.
index.html, assets/css/style.css, assets/js/main.js를 읽고 현재 구조를 파악하라.

사용자 요청: [사용자가 준 프롬프트]

SPEC.md에 반드시 포함할 것:
1. 변경 유형: 디자인 / 기능 / 혼합 중 하나
2. 디자인 언어 & 의도: 이 변경이 만들 경험 (2~3문장)
3. Sprint 범위 계약: Generator가 SPEC 외 변경을 판단할 기준

결과를 SPEC.md 파일로 저장하라.
```

### 단계 2: Generator 호출

subagent_type: `generator`

최초 실행:
```
SPEC.md 파일을 읽고, 설계대로 구현하라.
완료 후 SELF_CHECK.md를 작성하라.
```

피드백 반영 (2회차+):
```
SPEC.md와 QA_REPORT.md를 읽어라.
QA 피드백의 "구체적 개선 지시"를 모두 반영하여 코드를 수정하라.
완료 후 SELF_CHECK.md를 업데이트하라.
```

### 단계 3: Evaluator 호출

subagent_type: `evaluator`

```
SPEC.md를 읽어라. 이것이 설계서다.
SELF_CHECK.md를 읽어라. 이것이 Generator의 자체 점검 결과다.
index.html, assets/css/style.css, assets/js/main.js를 읽어라. 이것이 검수 대상이다.

evaluation_criteria.md의 AI 슬롭 패턴과 Few-shot 기준선을 적용하여 채점하라.
SPEC.md의 Sprint 범위 계약을 확인하고 범위 위반을 검사하라.

결과를 QA_REPORT.md 파일로 저장하라.
```

### 단계 4: 판정 확인

QA_REPORT.md를 읽고:
- **합격** → 완료 보고
- **조건부/불합격** → Generator 재호출 시 가중 점수 기반 Case 명시:
  - 6.0 이상: "Case A: 같은 방향, 개선 지시 정밀 적용"
  - 5.0~5.9: "Case B: 낮은 점수 영역 접근법 재검토"
  - 5.0 미만: "Case C: 완전 방향 전환"
- 최대 **3회** 반복. 3회 후에도 불합격이면 현재 상태로 보고 + 미통과 원인 명시

### 완료 보고

```
## 하네스 실행 완료

**변경 내용**: [한 줄 요약]
**QA 반복**: X회
**최종 점수**: 패턴 X/10, 보안 X/10, UI X/10, 기능 X/10 (가중 X.X/10)

**실행 흐름**:
1. Planner: [한 줄]
2. Generator R1: [한 줄]
3. Evaluator R1: [한 줄]
...
```

### 주의사항

- **단계 0 필수**: Planner 호출 전 `rm -f SPEC.md SELF_CHECK.md QA_REPORT.md` 실행. 생략 시 이전 SPEC으로 인한 오염 사고 발생
- **Planner 완료 후 SPEC.md 검증**: Generator 호출 전에 SPEC.md가 존재하는지 확인하고, 첫 5줄을 읽어서 이번 요청과 일치하는지 확인. **파일이 존재하지 않으면 Planner가 저장에 실패한 것이므로 직접 SPEC.md를 작성**하고 재진행
- **Evaluator 완료 후 QA_REPORT.md 검증**: QA_REPORT.md가 존재하는지 확인. 파일이 없으면 Evaluator 결과를 기반으로 직접 작성하거나, Generator에 피드백을 프롬프트로 직접 전달
- Generator와 Evaluator는 반드시 **다른 서브에이전트**로 호출 (분리가 핵심)
- 각 단계 완료 후, 생성된 파일 존재 확인
- 에이전트들은 `docs/` 규칙 파일을 자체적으로 읽으므로 프롬프트에 규칙을 복사하지 않음
