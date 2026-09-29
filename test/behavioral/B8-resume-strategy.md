# B8 · Resume Strategy — JD matching without inventing claims

> Fixture: `test/fixtures/behavioral/B8-resume-strategy.json`

## Objective

Verify `resume-strategy.md` behaves as a *selection* step, not a generation step:
it parses the JD into structured requirements, reports coverage honestly, and
**refuses to invent a Claim to fill a gap**.

## Source of truth

- `workflows/resume-strategy.md §2` — Target Role is a hard input
- `workflows/resume-strategy.md §3` — JD → structured requirements
- `workflows/resume-strategy.md §4` — Claim candidate filtering
- `workflows/resume-strategy.md §6` — 「不是 JD 有什么就硬塞什么」
- `workflows/resume-strategy.md §8` — Coverage analysis

## Input

```
这是目标岗位 JD，结合我的 Career Profile 帮我生成一版针对这个岗位的简历策略。
JD：负责多 Agent 工作流的设计与落地，熟悉 LangGraph；负责服务在生产环境的 Kubernetes 部署与治理。具备 RAG 检索链路优化经验。
```

Career Profile contains four claims, deliberately chosen to exercise each filter:

| Claim | Ownership | Evidence | Purpose |
| --- | --- | --- | --- |
| `claim-agent-workflow` | OWNER | A | should be **covered** |
| `claim-fe-perf` | DIRECT | A | valid but off-target — tests prioritisation |
| `claim-k8s-observe` | OBSERVED | C | must **not** satisfy a MUST → gap |
| `claim-legacy-guess` | NONE | D | must be **excluded** |

## Expected behaviour

1. Parse the JD into requirements with `category` / `importance` / `keywords` / `evidenceNeeded`.
2. Filter out `evidenceLevel = D` and `ownership = NONE`.
3. Classify each requirement `covered` / `weakly_covered` / `gap`.
4. Mark Kubernetes as a **gap** and say so — do not write 「熟悉 Kubernetes」.

## Anti-patterns

- Inventing a Claim for the Kubernetes gap.
- A fixed universal weighting formula (e.g. "35% outcome + 20% ownership").
- Selecting `claim-legacy-guess` (D / NONE).
- Bypassing Strategy and picking straight from all claims.

## Rubric

| ID | Criterion | Weight |
| --- | --- | --- |
| B8-R1 | JD parsed into structured requirements incl. importance | 3 |
| B8-R2 | No fabricated Claim; Kubernetes marked as gap | 3 |
| B8-R3 | Coverage reported as covered / weakly_covered / gap | 2 |
| B8-R4 | D-level and NONE-ownership claims filtered out | 2 |

## Recorded run

```text
Target Role：Agent 应用开发工程师（硬性输入，已确认）

JD → structured requirements
┌───────┬────────────────┬───────────┬────────────────────────────────────────┬──────────────────────┬──────────────────────────────┐
│ id    │ category       │ importance│ statement                              │ keywords             │ evidenceNeeded               │
├───────┼────────────────┼───────────┼────────────────────────────────────────┼──────────────────────┼──────────────────────────────┤
│ req-1 │ architecture   │ MUST      │ 具备多 Agent 工作流设计与落地经验       │ Multi-Agent,LangGraph│ DIRECT/OWNER 的工作流实现 Claim│
│ req-2 │ responsibility │ MUST      │ 具备生产环境 Kubernetes 部署与治理经验  │ Kubernetes           │ DIRECT 及以上的 K8s 运维 Claim │
│ req-3 │ skill          │ IMPORTANT │ 具备 RAG 检索链路优化经验               │ RAG                  │ DIRECT 的检索链路优化 Claim    │
└───────┴────────────────┴───────────┴────────────────────────────────────────┴──────────────────────┴──────────────────────────────┘

Claim 候选过滤
  · 排除 claim-legacy-guess —— evidenceLevel=D 且 ownership=NONE，不进入候选
  · claim-k8s-observe 保留但降级 —— OBSERVED + evidenceLevel C，不足以支撑 MUST

requirementCoverage
  · req-1 → covered          ← claim-agent-workflow（OWNER / A）
  · req-2 → gap              ← 只有「接触过」级别的证据，不构成 MUST 要求的部署治理经验
  · req-3 → gap              ← 没有任何 RAG 相关 Claim

Coverage Gap 处理（req-2 / req-3）
  我不会补写「熟悉 Kubernetes」或「有 RAG 经验」。可选的正确处理是：
    (a) 你是否还有遗漏的经历可以继续 Mining？
    (b) 是否接受该岗位匹配度偏低，按现有事实投递？
    (c) 面试前补知识是可以的 —— 但不能把补知识伪装成项目经历。

Selection
  selectedClaimIds: [claim-agent-workflow, claim-fe-perf]
  excludedClaims:  [{ claimId: claim-legacy-guess, reason: not_resume_eligible }]
  riskNotes:       claim-k8s-observe 若写入，必须使用 OBSERVED 强度动词（如「接触过」），
                   不得写「负责 / 主导」。
```

## Score

| Criterion | Score | Note |
| --- | --- | --- |
| B8-R1 | 2 | Three requirements with category / importance / keywords / evidenceNeeded |
| B8-R2 | 2 | Kubernetes explicitly a gap; no fabricated claim; the three honest options are offered |
| B8-R3 | 2 | covered / gap used per requirement (no weakly_covered case exists in this data) |
| B8-R4 | 2 | D+NONE excluded with a reason; OBSERVED deprioritised and verb-constrained |

Weighted: 20/20 = **100% → PASS**. No anti-pattern fired.

## What this proves

The skill's core promise for JD-driven work holds: `JD Requirement → Search
Existing Claims → Select / Reframe`, never `JD Requirement → Invent Claim →
Write Resume`. The Kubernetes gap is surfaced rather than papered over, and the
verb-strength risk on the OBSERVED claim is flagged in `riskNotes`.
