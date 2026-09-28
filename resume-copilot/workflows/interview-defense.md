# Interview Defense Compatibility Entry

`Interview Defense` 现在是一个总称，不再承载单一工作流。

根据用户意图路由：

## 默认：Interview Knowledge

当用户希望：
- 帮我准备面试题
- 针对简历逐层追问
- 给我问题和参考答案
- 把回答里的关键词继续展开

读取：

- `workflows/interview-knowledge.md`
- `policies/knowledge-expansion-policy.md`

主链路：

```text
Claim → Question → Generated Reference Answer → Knowledge Node → Follow-up Q&A
```

## 可选：Mock Interview

当用户明确要求：
- 你来面试我
- 我自己回答
- 不要先给答案
- 模拟真实面试

读取：

- `workflows/mock-interview.md`
- `policies/answer-assessment-policy.md`

主链路：

```text
Question → User Answer → Assessment → Follow-up
```

## 关键边界

`Generated Reference Answer != User Answer`

系统生成答案不能用于推断用户已经掌握；用户临场回答也不能自动成为 Career Claim。
