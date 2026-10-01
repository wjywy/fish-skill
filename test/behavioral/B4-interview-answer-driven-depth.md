# B4 · Interview Knowledge — answer-driven depth & complete answers

> Fixture: `test/fixtures/behavioral/B4-interview-depth.json`

## Objective

Verify Interview Knowledge has two independent guarantees:

1. **Answer quality**：当前答案先独立讲透，不靠下一问补完核心机制。
2. **Answer-driven expansion**：下一问从上一层 Answer 的高价值未覆盖节点产生，而不是预先生成平行题库。

## Source of truth

- `policies/interview-depth-policy.md`
  - Answer Completeness Gate
  - Why Layer / Knowledge Abstraction
  - recursive depth bounded by role relevance and information gain
- `policies/knowledge-expansion-policy.md §六、Answer-first 执行算法与调度器`
  - Candidate Node / Coverage / queue / sibling scheduling
- `workflows/interview-knowledge.md`
  - execution order and user-visible output only
- `SKILL.md`
  - global invariants and routing only

The workflow and `SKILL.md` must not redefine a competing scheduler or answer-depth algorithm.

## Input

```text
针对“使用 Transactional Outbox 保证长任务事件可靠记录与异步投递”这条简历描述，
帮我准备面试问题和参考答案。
```

Target role: Agent 应用开发工程师。

## Expected behaviour

1. Materialise one Root Question, then generate a complete reference answer.
2. Before Node Extraction, the answer passes the Answer Completeness Gate:
   - direct conclusion;
   - causal mechanism;
   - concrete walkthrough when needed;
   - CURRENT / PRINCIPLE / IMPROVEMENT boundaries;
   - Why / abstraction when they materially improve understanding.
3. Extract **all meaningful Candidate Nodes** from that Answer.
4. Mark sufficiently explained nodes `COVERED`; retain every valuable `UNEXPANDED` sibling.
5. Execute one high-value node at a time; return to retained siblings after the current deep branch is exhausted.
6. Continue until role relevance / information gain is exhausted, not until a fixed layer count.
7. Visible answers use `**直接回答**` + `**展开说明**`; the second part may contain steps, tables, timelines or diagrams instead of one dense paragraph.

## Anti-patterns

Any one of these is a failure:

- Pre-generating `主题 → Q1/Q2/Q3/Q4` and then filling answers.
- Current Answer only says “通过 Outbox 保证可靠性” or lists terms without mechanism.
- Using a Follow-up to explain a mechanism that the current question itself required.
- Dropping non-chosen high-value siblings.
- Switching to Root Queue while `UNEXPANDED` nodes remain.
- Re-asking a node already `SUFFICIENT / COVERED` without a more specific new information need.
- Stopping only because depth reached 5 or 8.
- Presenting general best practice as current project implementation.

## Rubric

| ID | Criterion | Weight |
| --- | --- | ---: |
| B4-R1 | Current answer is independently complete | 3 |
| B4-R2 | Follow-up chain is Answer-driven | 3 |
| B4-R3 | Reaches mechanism depth while role-relevant | 3 |
| B4-R4 | Valuable siblings are retained and revisited | 2 |
| B4-R5 | No redundant questions for already-covered nodes | 2 |
| B4-R6 | Visible answer is natural to say aloud and structurally readable | 2 |
| B4-R7 | CURRENT / PRINCIPLE / IMPROVEMENT remain distinct | 2 |

## Minimal passing shape

The exact questions are not fixed, but a valid run can resemble:

```text
Q0 为什么业务状态和 Outbox Event 要在同一个事务提交？
A0 完整解释双写窗口、本地事务、至少一次语义与项目边界
   ↓
Candidate: 幂等 = PARTIAL / UNEXPANDED
Candidate: 多 Worker 领取 = PARTIAL / UNEXPANDED
   ↓
Q1 重复投递时消费侧怎么保证幂等？
A1 完整解释唯一键、原子写入点、check-then-act 竞态
   ↓
Candidate: 并发原子去重 = PARTIAL / UNEXPANDED
   ↓
Q2 为什么“先查再写”仍会并发穿透？
...
   ↓
当前深分支耗尽
   ↓
返回“多 Worker 领取” sibling
```

The important property is not the exact wording or number of questions. It is the invariant:

```text
complete Answer
→ extract all candidates
→ Coverage + Value
→ retain all valuable siblings
→ execute one next node
→ repeat
```

## What this case proves

B4 passes only when the Skill behaves like a **knowledge-expansion system with complete per-question explanations**, not a topic-list generator and not a repository-summary generator.
