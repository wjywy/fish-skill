# B4 · Interview Knowledge — answer-driven depth & DEEP_STUDY answers

> Fixture: `test/fixtures/behavioral/B4-interview-depth.json`

## Objective

Verify Interview Knowledge has three independent guarantees:

1. **DEEP_STUDY per Question**：每个已物化问题都先独立讲透，不因为后续还有更多题而降级成摘要。
2. **Answer-driven expansion**：下一问从上一层 Answer 的高价值未覆盖节点产生，而不是预先生成平行题库。
3. **Adaptive presentation**：完整答案按问题类型组织，不固定套 `直接回答 / 展开说明`。

## Source of truth

- `policies/interview-depth-policy.md`
  - DEEP_STUDY / Answer Completeness Gate
  - Presentation Planning
  - Why Layer / Knowledge Abstraction
  - recursive depth bounded by role relevance and information gain
- `policies/knowledge-expansion-policy.md §六、Answer-first 执行算法与调度器`
  - Candidate Node / Coverage / queue / sibling scheduling
- `workflows/interview-knowledge.md`
  - execution order and user-visible output only
- `SKILL.md`
  - global invariants and routing only

## Input

```text
针对“使用 Transactional Outbox 保证长任务事件可靠记录与异步投递”这条简历描述，
帮我准备面试问题和参考答案。
```

Target role: Agent 应用开发工程师。

## Expected behaviour

1. Materialise one Root Question, then generate a complete DEEP_STUDY reference answer.
2. Before Node Extraction, the answer passes the Answer Completeness Gate:
   - direct conclusion;
   - causal mechanism;
   - concrete walkthrough when needed;
   - CURRENT / PRINCIPLE / IMPROVEMENT / EXECUTION boundaries;
   - Why / abstraction when they materially improve understanding.
3. Presentation is chosen by Question Shape rather than a fixed two-part template.
4. Extract all meaningful Candidate Nodes from that complete Answer.
5. Mark sufficiently explained nodes `COVERED`; retain every valuable `UNEXPANDED` sibling.
6. Execute one high-value node at a time; return to retained siblings after the current deep branch is exhausted.
7. Continue until role relevance / information gain is exhausted, not until a fixed layer count or question count.

## Anti-patterns

Any one of these is a failure:

- Pre-generating `主题 → Q1/Q2/Q3/Q4` and then filling answers.
- Treating Interview Knowledge as a question bank with shallow answers.
- Current Answer only says “通过 Outbox 保证可靠性” or lists terms without mechanism.
- Using a Follow-up to explain a mechanism that the current question itself required.
- Dropping non-chosen high-value siblings.
- Switching to Root Queue while `UNEXPANDED` nodes remain.
- Re-asking a node already `SUFFICIENT / COVERED` without a more specific new information need.
- Stopping only because depth reached 5/8 or because the document already has many questions.
- Presenting general best practice as current project implementation.
- Claiming a command/test was run successfully without current execution evidence.
- Forcing every visible answer into `直接回答 / 展开说明` regardless of question shape.

## Rubric

| ID | Criterion | Weight |
| --- | --- | ---: |
| B4-R1 | Current answer is independently complete at DEEP_STUDY depth | 3 |
| B4-R2 | Follow-up chain is Answer-driven | 3 |
| B4-R3 | Reaches mechanism depth while role-relevant | 3 |
| B4-R4 | Valuable siblings are retained and revisited | 2 |
| B4-R5 | No redundant questions for already-covered nodes | 2 |
| B4-R6 | Visible answer uses a structure appropriate to the question type | 3 |
| B4-R7 | CURRENT / PRINCIPLE / IMPROVEMENT / EXECUTION remain distinct | 2 |

## Minimal passing shape

```text
Q0 为什么业务状态和 Outbox Event 要在同一个事务提交？
A0 先直接回答，再完整解释双写窗口、本地事务、至少一次语义、具体失败例子与项目边界
   ↓
Candidate: 幂等 = PARTIAL / UNEXPANDED
Candidate: 多 Worker 领取 = PARTIAL / UNEXPANDED
   ↓
Q1 重复投递时消费侧怎么保证幂等？
A1 完整解释唯一键、原子写入点、check-then-act 竞态，并用并发时间线推演
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

The exact questions, answer headings and number of questions are not fixed. The invariant is:

```text
DEEP_STUDY Answer
→ Presentation Planning
→ extract all candidates
→ Coverage + Value
→ retain all valuable siblings
→ execute one next node
→ repeat
```

## What this case proves

B4 passes only when the Skill behaves like an **Answer-driven deep-study system**: every generated question is fully explained first, then the complete answer drives the next question.