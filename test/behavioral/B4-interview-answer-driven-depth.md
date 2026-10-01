# B4 · Interview Knowledge — answer-driven depth & bounded DEEP_STUDY

> Fixture: `test/fixtures/behavioral/B4-interview-depth.json`

## Objective

Verify Interview Knowledge has four independent guarantees:

1. **DEEP_STUDY per Question**：每个已物化问题都先独立讲透，不因为后续还有更多题而降级成摘要。
2. **Bounded depth**：当前题讲透，但不穷尽整个相邻知识域；非必要但高价值内容保留给 Follow-up。
3. **Answer-driven expansion**：下一问从上一层 Answer 的高价值未覆盖节点产生，而不是预先生成平行题库。
4. **Presentation separation**：内部完整答案与可见 Explanation Shape 解耦，Presentation 不反向决定 Candidate Nodes。

## Source of truth

- `policies/interview-depth-policy.md`
  - Explanation Backbone First
  - DEEP_STUDY / Answer Completeness Gate
  - Necessary-for-Conclusion Test / Deep Study Boundary
  - Why Layer / Knowledge Abstraction
  - recursive depth bounded by role relevance and information gain
- `policies/answer-presentation-policy.md`
  - Explanation Shape
  - Natural Rendering Rules
  - Question Dimension != Explanation Shape
- `policies/knowledge-expansion-policy.md §六、Answer-first 执行算法与调度器`
  - Candidate Node / Coverage / queue / sibling scheduling
- `workflows/interview-knowledge.md`
  - execution order and policy handoffs only
- `SKILL.md`
  - global invariants and routing only

## Input

```text
针对“使用 Transactional Outbox 保证长任务事件可靠记录与异步投递”这条简历描述，
帮我准备面试问题和参考答案。
```

Target role: Agent 应用开发工程师。

## Expected behaviour

1. Materialise one Root Question, then identify an Explanation Backbone before expanding details.
2. Build a complete DEEP_STUDY reference answer and run Necessary-for-Conclusion Test on extra details.
3. Before Node Extraction, the answer passes the Answer Completeness Gate:
   - direct conclusion;
   - causal mechanism;
   - concrete walkthrough when needed;
   - CURRENT / PRINCIPLE / IMPROVEMENT / EXECUTION boundaries;
   - Why / abstraction when they materially improve understanding;
   - no unnecessary neighborhood exhaustion.
4. Extract all meaningful Candidate Nodes from the complete internal Answer, not from rendered Markdown.
5. Mark sufficiently explained nodes `COVERED`; retain every valuable `UNEXPANDED` sibling.
6. Render the same complete Answer using `answer-presentation-policy.md`; Question Dimension does not hard-code the visible Markdown structure.
7. Execute one high-value node at a time; return to retained siblings after the current deep branch is exhausted.
8. Continue until role relevance / information gain is exhausted, not until a fixed layer count or question count.

## Anti-patterns

Any one of these is a failure:

- Pre-generating `主题 → Q1/Q2/Q3/Q4` and then filling answers.
- Treating Interview Knowledge as a question bank with shallow answers.
- Current Answer only says “通过 Outbox 保证可靠性” or lists terms without mechanism.
- Using a Follow-up to explain a mechanism that the current question itself required.
- Expanding every related concept merely because it is interesting, until no meaningful Follow-up remains.
- Persisting `NECESSARY / INTERESTING` as a third Node state or Coverage taxonomy.
- Dropping non-chosen high-value siblings.
- Switching to Root Queue while `UNEXPANDED` nodes remain.
- Re-asking a node already `SUFFICIENT / COVERED` without a more specific new information need.
- Stopping only because depth reached 5/8 or because the document already has many questions.
- Presenting general best practice as current project implementation.
- Claiming a command/test was run successfully without current execution evidence.
- Forcing every visible answer into `直接回答 / 展开说明` or forcing every Backbone to render as `A != B` / `A → B → C`.
- Deriving Candidate Nodes from a compressed presentation instead of the complete internal Answer.

## Rubric

| ID | Criterion | Weight |
| --- | --- | ---: |
| B4-R1 | Current answer is independently complete at DEEP_STUDY depth | 3 |
| B4-R2 | Current answer respects the Necessary-for-Conclusion upper bound | 3 |
| B4-R3 | Follow-up chain is Answer-driven | 3 |
| B4-R4 | Reaches mechanism depth while role-relevant | 3 |
| B4-R5 | Valuable siblings are retained and revisited | 2 |
| B4-R6 | No redundant questions for already-covered nodes | 2 |
| B4-R7 | Presentation is downstream from the complete Answer and uses an appropriate Explanation Shape | 3 |
| B4-R8 | CURRENT / PRINCIPLE / IMPROVEMENT / EXECUTION remain distinct | 2 |

## Minimal passing shape

```text
Q0 为什么业务状态和 Outbox Event 要在同一个事务提交？
↓
Backbone: state change and event recording must share one commit boundary
↓
A0 完整解释双写窗口、本地事务、至少一次语义与一个具体失败例子
   但不顺手穷尽所有消费幂等实现
↓
Candidate: 幂等 = PARTIAL / UNEXPANDED
Candidate: 多 Worker 领取 = PARTIAL / UNEXPANDED
↓
Q1 重复投递时消费侧怎么保证幂等？
↓
A1 完整解释唯一键、原子写入点、check-then-act 竞态
↓
Candidate: 并发原子去重 = PARTIAL / UNEXPANDED
```

The exact questions, visible headings and number of questions are not fixed. The invariant is:

```text
Question
→ Explanation Backbone
→ bounded DEEP_STUDY Answer
→ Answer Completeness Gate
├─ Candidate Extraction / Coverage / Scheduling
└─ Answer Presentation / Natural Markdown
→ Follow-up
```

## What this case proves

B4 passes only when the Skill behaves like an **Answer-driven, bounded deep-study system**: every generated question is fully explained, adjacent high-value knowledge is preserved instead of prematurely exhausted, and presentation remains a downstream concern.