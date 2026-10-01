# B5 · Interview Knowledge — user-visible output hygiene

> Fixture: `test/fixtures/behavioral/B5-output-hygiene.json`

## Objective

Verify the delivered Markdown is **revision-ready, DEEP_STUDY, naturally structured, locally grounded, and free of internal execution metadata**.

The internal system may use Claim IDs, Evidence, Grounding, Knowledge Nodes, Coverage, queues, `overview / principleDetail`, Explanation Backbone, Explanation Shape and scheduler state. The user-facing document should only contain useful interview material.

## Source of truth

- `workflows/interview-knowledge.md §用户可见 Markdown 输出`
- `workflows/interview-knowledge.md §默认禁止输出的内部信息`
- `policies/interview-depth-policy.md` for DEEP_STUDY, Backbone, Deep Study Boundary and CURRENT / PRINCIPLE / IMPROVEMENT / EXECUTION boundaries
- `policies/answer-presentation-policy.md` for Explanation Shape, Natural Rendering and Citation Locality
- `SKILL.md` only for global invariants

## Input

```text
把刚才那条 Outbox 简历描述的面试准备整理成一份可以直接复习的 Markdown 文档。
```

## Expected behaviour

- `#` = core theme, never an internal Claim number.
- `##` = interview question.
- Every generated question is immediately followed by its complete DEEP_STUDY answer.
- The answer begins by directly addressing the question, then uses the most suitable Explanation Shape: prose, causal chain, sequence, comparison matrix, timeline, state transition, component flow, evidence chain or decision frame.
- Question Dimension does not mechanically decide the visible Markdown structure.
- Explanation Backbone may remain implicit; it is not forced into a visible `A != B` / `A → B → C` pattern.
- Fixed visible headings such as `直接回答 / 展开说明` are not required and should not be mechanically repeated.
- Project facts, general principles, hypothetical improvements and current execution results are distinguished inside the relevant answer, not exposed as debug labels.
- When the environment provides citations/provenance, factual project/execution claims keep that evidence adjacent instead of defaulting to a detached evidence appendix.
- No scheduler commentary such as “next node”, “return to sibling”, “Expansion Queue” appears in the document.

## Anti-patterns — internal metadata must not leak

| Must not appear as internal metadata | Why |
| --- | --- |
| `claimId` / `Claim 1` | internal identity |
| evidence paths / repository file paths used only as provenance | internal evidence plumbing |
| `VERIFIED` / `PARTIAL` / `INSUFFICIENT` | grounding status |
| graph `depth` | internal graph metadata |
| Node Type tokens used as labels | internal graph taxonomy |
| `roleRelevance` | internal ranking metadata |
| internal risk level | scheduler / review metadata |
| Knowledge Node / Parent / Child / Shared Node | graph structure |
| Expansion Queue / Root Queue | scheduler state |
| Sibling Transition Gate | scheduler state |
| `decisionReason` | internal decision trace |
| `overview / principleDetail` | internal answer storage fields |
| Explanation Backbone / Explanation Shape labels | internal planning fields |
| `NECESSARY / INTERESTING` | transient drafting decision |
| generation-mode or document-status notes | internal state |
| “建议补充验证” style debug gap list | internal to-do |

## Rubric

| ID | Criterion | Weight |
| --- | --- | ---: |
| B5-R1 | Zero internal execution/planning metadata exposed | 3 |
| B5-R2 | Level-1 heading is a human-readable theme, not a Claim number | 2 |
| B5-R3 | Every question and its DEEP_STUDY answer are adjacent and revision-ready | 3 |
| B5-R4 | Presentation uses a suitable Explanation Shape without fixed-template coupling | 3 |
| B5-R5 | Project/current vs principle/improvement/execution boundaries are expressed naturally | 2 |
| B5-R6 | Factual evidence/citations are local to the claims they support when available | 2 |
| B5-R7 | No queue/scheduler transition commentary leaks into prose | 2 |

## Minimal passing shape

```markdown
# Outbox 可靠事件分发

## 为什么业务状态和 Outbox Event 要在同一个事务里提交？

如果状态更新和事件记录分两次提交，中间任何一次崩溃都会形成双写不一致……

1. 没有 Outbox 时……
2. 引入同事务 Outbox 后……
3. 事务提交后 Worker 如何继续……

<必要的失败例子 / 边界>

## Outbox Worker 重复投递时，消费侧如何保证幂等？

幂等的核心不是“多查一次”，而是把竞争收敛到一个原子写入点……

```text
T1 A 检查
T2 B 检查
T3 A 写入
T4 B 冲突
```
```

The visible document should **not** contain prose such as:

```text
该节点 roleRelevance=CORE，因此从 Expansion Queue 取出。
当前 sibling 处理完成后返回 Root Queue。
projectGrounding=PARTIAL。
overview: ...
principleDetail: ...
Explanation Shape: TIMELINE
NECESSARY: unique constraint
```

If the project does not prove a specific implementation, write it naturally in the answer instead of exposing metadata.

## What this case proves

The skill can keep a rich internal knowledge graph and planning model while delivering a clean deep-study document whose visible structure follows the actual knowledge relationship, not internal taxonomies or fixed answer templates.