# B5 · Interview Knowledge — user-visible output hygiene

> Fixture: `test/fixtures/behavioral/B5-output-hygiene.json`

## Objective

Verify the delivered Markdown is **revision-ready but free of internal execution metadata**.

The internal system may use Claim IDs, Evidence, Grounding, Knowledge Nodes, Coverage, queues and scheduler state. The user-facing document should only contain the useful interview material.

## Source of truth

- `workflows/interview-knowledge.md §用户可见 Markdown 输出`
- `workflows/interview-knowledge.md §默认禁止输出的内部信息`
- `policies/interview-depth-policy.md` for answer quality and CURRENT / PRINCIPLE / IMPROVEMENT boundaries
- `SKILL.md` only for the global output-hygiene invariant

## Input

```text
把刚才那条 Outbox 简历描述的面试准备整理成一份可以直接复习的 Markdown 文档。
```

## Expected behaviour

- `#` = core theme, never an internal Claim number.
- `##` = interview question.
- If answers were requested, each question is followed by `**直接回答**` and `**展开说明**`.
- `展开说明` may use steps, tables, timelines, code or diagrams when they improve understanding.
- Project facts, general principles and hypothetical improvements are distinguished **inside the relevant answer**, not exposed as debug labels.
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
| generation-mode or document-status notes | internal state |
| “建议补充验证” style debug gap list | internal to-do |

A technical answer may naturally mention words such as “risk”, “depth” or “claim” in ordinary English/Chinese meaning. The test is about leaking **internal field labels / control metadata**, not banning normal technical vocabulary by substring alone.

## Rubric

| ID | Criterion | Weight |
| --- | --- | ---: |
| B5-R1 | Zero internal execution metadata exposed | 3 |
| B5-R2 | Level-1 heading is a human-readable theme, not a Claim number | 2 |
| B5-R3 | Questions and requested answers are adjacent and revision-ready | 2 |
| B5-R4 | Project/current vs principle/improvement boundaries are expressed naturally, without debug labels | 2 |
| B5-R5 | No queue/scheduler transition commentary leaks into prose | 2 |

## Minimal passing shape

```markdown
# Outbox 可靠事件分发

## 为什么业务状态和 Outbox Event 要在同一个事务里提交？

**直接回答**

<直接回答问题，必要时落到已验证项目事实>

**展开说明**

<机制、Why、例子、边界；按题目选择结构>

## Outbox Worker 重复投递时，消费侧如何保证幂等？

**直接回答**
...
```

The visible document should **not** contain prose such as:

```text
该节点 roleRelevance=CORE，因此从 Expansion Queue 取出。
当前 sibling 处理完成后返回 Root Queue。
projectGrounding=PARTIAL。
```

Instead, if the project does not prove a specific implementation, write it naturally:

```text
当前仓库可以确认存在 Outbox / Worker 链路；具体消费侧是否采用唯一索引去重无法由现有证据确认。通用实现上可以……
```

## What this case proves

The skill can keep a rich internal knowledge graph while delivering a clean document that a candidate can actually study from, without exposing scheduler plumbing or turning evidence boundaries into debug output.
