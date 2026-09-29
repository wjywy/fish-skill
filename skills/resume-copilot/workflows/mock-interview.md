# Mock Interview Workflow

## Required References

进入本流程后必须读取：

- `../policies/answer-assessment-policy.md`
- 已存在的 Interview Knowledge Pack（若有）

## 目标

Mock Interview 是可选模式。只有当用户明确要求“面试我 / 我来回答 / 不要先给答案”等场景时启用。

它与 Interview Knowledge 的区别：

```text
Interview Knowledge
问题 → 系统参考答案 → 递归知识扩展

Mock Interview
问题 → 用户回答 → 回答评估 → 针对薄弱点追问
```

Mock Interview 不负责创造 Career Claim，也不应把用户临场说出的知识自动写回简历事实库。

## 输入

优先读取：

- Interview Knowledge Pack
- Resume View 暴露的 Claim
- 当前 Claim Strength
- Target Role / JD
- 用户要求的模拟模式（快问快答 / 深挖 / 压力面）

如果尚未构建 Knowledge Pack，可以即时生成必要问题，但仍需保持 Generated Answer 与 User Answer 分离。

## 基本流程

```text
Select Question
   ↓
Ask User
   ↓
Capture User Answer
   ↓
Assess Answer
   ↓
Identify Missing Dimensions / Weak Nodes
   ↓
Generate Follow-up
   ↺
```

## Answer Assessment 维度

仅评估用户真实回答，不评估系统参考答案。

按问题类型选择适用维度：

- `CORRECTNESS`：核心事实是否正确
- `RELEVANCE`：是否回答了问题本身
- `MECHANISM`：是否解释了机制而非只报术语
- `PROJECT_GROUNDING`：是否能回到自己的项目
- `BOUNDARY`：是否知道失败、异常、限制
- `TRADEOFF`：是否能说明方案取舍
- `OWNERSHIP_CLARITY`：是否清楚自己的责任边界
- `METRIC_CLARITY`：指标口径是否清楚
- `COMMUNICATION`：表达是否结构化、可理解

## 状态

用户回答状态：

- `NOT_ANSWERED`
- `WEAK`
- `PARTIAL`
- `DEFENSIBLE`
- `NOT_OWNED`
- `INCORRECT`

不要因为用户提到了几个正确关键词就自动标记 `DEFENSIBLE`。

## Follow-up 生成

优先针对：

1. 用户回答中明显缺失的关键维度
2. 用户主动抛出的高风险关键词
3. 逻辑跳跃或矛盾点
4. 用户把通用知识误说成自己项目事实的地方
5. 强 Claim 与浅回答之间的不匹配

例如：

```text
Q: 为什么使用 Outbox？

User Answer:
“因为 Outbox 可以保证消息可靠。”
```

不要直接换题，应继续：

```text
Q: 它具体解决了数据库更新和消息发送之间的什么问题？
```

## Resume Feedback

Mock Interview 可以产生“建议”，但不能自动修改 Career Profile。

当出现：

- 用户确认不是自己做的
- 强措辞长期无法解释
- 指标无法说明来源
- Ownership 与简历文字不一致

可以生成：

```text
resumeReviewSuggestion
```

建议回到 `VERIFYING / STRATEGY` 检查表述强度。

## 输出

Mock Interview Session 至少记录：

- `questionId`
- `userAnswer`
- Assessment
- Missing Dimensions
- Follow-up Question
- Linked Knowledge Nodes
- Resume Review Suggestion（可选）
