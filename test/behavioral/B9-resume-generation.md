# B9 · Resume Generation — Strategy compliance & bullet traceability

> Fixture: `test/fixtures/behavioral/B9-resume-generation.json`
> Golden output: `test/fixtures/valid/resume-view.agent.json` (asserted by T3.5)

## Objective

Verify `resume-generation.md` builds the Resume View as a *projection of an
already-made selection*, not as a fresh act of authorship. The Strategy has
decided which Claims are in scope; generation must not re-open that decision, and
every bullet it emits must carry the provenance that makes it auditable.

This is the case that closes the last untested surface: `resume-generation.md`,
`resume-strategy.md` and `resume-writing-policy.md` previously had **zero** test
references. T7 covers bullet *phrasing*; B9 covers bullet *provenance*.

## Source of truth

- `workflows/resume-generation.md §顺序 1–12` — the ordered build procedure
- `workflows/resume-generation.md §渲染与分页` — slots vs. styling, adaptive flow
- `workflows/resume-generation.md §三层职责` — Generator ≠ Renderer
- `schemas/resume-view.schema.json §$defs.resumeBullet` — `claimIds` is required
- `policies/evidence-policy.md §写入原则` — evidence gates what may be written
- `policies/metric-policy.md §可用条件` — only `confirmed` metrics are usable

## Input

```
按这个 Strategy 生成 Resume View。
```

Preconditions (in the fixture):

| Claim | Ownership | Evidence | `resumeEligible` | Strategy decision |
| --- | --- | --- | --- | --- |
| `claim-selected-1` | OWNER | A | true | **selected** |
| `claim-selected-2` | DIRECT | A | true | **selected** |
| `claim-excluded-risk` | OBSERVED | C | false (`interviewRisk: HIGH`) | **excluded** |

| Metric | Confidence | `resumeEligible` |
| --- | --- | --- |
| `metric-confirmed` | confirmed | true |
| `metric-inferred` | inferred | false |

## Expected behaviour

1. Emit one bullet per selected Claim, each with a stable `id`, `claimIds`, and
   the `metricIds` it actually uses.
2. Use **only** `selectedClaimIds` — never reach past the Strategy into the full
   Claim pool.
3. Reference **only** `confidence = confirmed` metrics; drop `metric-inferred`.
4. Organise `summary` / `sections` / `subBlocks` into the Resume View schema shape,
   leaving rendering entirely to the Renderer.
5. Mark the terms that deserve the theme accent with `**keyword**`, without
   highlighting whole sentences.

## Anti-patterns

- Using `claim-excluded-risk` (it is `resumeEligible: false` and HIGH risk).
- Citing `metric-inferred` because it "sounds better" than the confirmed one.
- Emitting a bullet with no `claimIds` (schema-invalid, but also a policy break).
- Duplicating a Claim across bullets, or repeating a tech term to pad the page.
- Inventing content to fill out the resume instead of cutting it (policy Rule 5).
- Letting the Renderer invent structure or content (three-layer duty confusion).

## Rubric

| ID | Criterion | Weight |
| --- | --- | --- |
| B9-R1 | Every bullet has a stable `id` + `claimIds` + `metricIds` | 3 |
| B9-R2 | No unselected Claim used (Strategy not bypassed) | 3 |
| B9-R3 | Metrics limited to `confirmed` + `resumeEligible` | 2 |
| B9-R4 | No duplicate Claim / duplicate tech term | 2 |

## Recorded run

```text
Resume View · view-agent-001
targetId: target-agent  ·  targetRole: Agent 应用开发工程师

header     示例用户 · Agent 应用开发工程师
summary    关注 Multi-Agent 编排与长任务可靠通信链路。
skills     2 项（Agent 应用 / 可靠性工程）

sections
└─ project 「项目经历」
   └─ A2A Agent 平台（核心开发）        tags: LangGraph · PostgreSQL · Outbox
      · b-1  claimIds=[claim-selected-1]  metricIds=[]
            基于 LangGraph 构建 Supervisor + Specialist 多 Agent Workflow，
            通过共享状态传递与 Supervisor 动态路由完成任务拆解、上下文传递与结果聚合。
      · b-2  claimIds=[claim-selected-2]  metricIds=[metric-confirmed]
            围绕 long-running Task 设计可恢复的异步事件链路，将 Task / Status /
            Artifact 事件按任务顺序持久化至事务 Outbox，并支持断线重订阅；
            任务事件投递延迟由秒级抖动收敛至稳定 P99 < 200ms。

provenance audit
  · 使用的 Claim      : claim-selected-1, claim-selected-2        ✓ ⊆ selectedClaimIds
  · 未使用            : claim-excluded-risk                        ✓ 被正确排除
  · 使用的 Metric      : metric-confirmed                          ✓ confidence=confirmed
  · 未使用            : metric-inferred                           ✓ 被正确排除
  · 无 claimIds 的 bullet: 0
  · 重复 Claim / 重复技术词: 0
```

The exact JSON is frozen at `fixtures/valid/resume-view.agent.json`; T3.5 asserts
that every `claimId` in it is Strategy-selected and every `metricId` is confirmed,
so the golden output is *machine-checked*, not just eyeballed.

## Score

| Criterion | Score | Note |
| --- | --- | --- |
| B9-R1 | 3 | Both bullets carry `id` + `claimIds` + explicit `metricIds` (empty array, not omitted) |
| B9-R2 | 3 | Only the two selected Claims appear; `claim-excluded-risk` is absent |
| B9-R3 | 2 | Only `metric-confirmed` is cited; `metric-inferred` dropped |
| B9-R4 | 2 | One Claim per bullet, no repeated tech term |

Weighted: 20/20 = **100% → PASS**. No anti-pattern fired.

## What this proves

Generation is a *deterministic projection*, not a second round of selection. The
Strategy's decision survives intact into the Resume View, provenance is preserved
on every bullet, and the confirmed/inferred metric boundary holds under pressure
to look impressive. Because the golden output is also a T-suite fixture, a future
regression in generation logic breaks a deterministic test rather than silently
degrading an example.

Note what this case deliberately does *not* assert: how the resume is laid out.
Generation owns the content slots (`sections / entries / bullets`); the Renderer
maps those onto the upstream Kami DOM purely for styling. Keeping those two
concerns apart is what lets the layout change without touching this case.
