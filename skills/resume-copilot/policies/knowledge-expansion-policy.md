# Knowledge Expansion Policy

## 目标

控制系统参考答案中的关键词如何继续递归展开，保证“深入但不发散”。

## 何时创建子节点

只有节点满足至少一项时创建：

- 直接解释当前 Resume Claim
- 影响方案正确性
- 影响失败恢复 / 一致性 / 并发
- 是核心设计决策或技术取舍
- 影响性能指标或扩展性
- 是目标岗位高频追问点
- 用户简历使用了强措辞，因此必须解释

## 不创建子节点

- 普通业务名词
- 没有技术判断价值的名词
- 与 Claim 关系弱的旁支知识
- 已经覆盖的同义词
- 仅作为举例出现的技术
- 继续深入只能变成百科知识

## 节点优先级

P0：
- DECISION
- TRADEOFF
- FAILURE
- RECOVERY
- CONSISTENCY
- CONCURRENCY
- IDEMPOTENCY

P1：
- IMPLEMENTATION
- ARCHITECTURE
- PERFORMANCE
- METRIC
- SECURITY

P2：
- MECHANISM
- PROTOCOL
- DATA_MODEL

P3：
- CONCEPT
- TECHNOLOGY
- ALTERNATIVE

P3 只有在其对 Claim 有明显解释价值时继续展开。

## 深度预算

深度预算由以下因素决定：

```text
Depth Budget = Claim Strength × JD Relevance × Interview Risk
```

建议：

- LOW：1–2 层
- MEDIUM：3–5 层
- HIGH：5–8 层

## Breadth Budget

默认单个节点最多展开 3 个直接子节点。

高风险架构节点最多可扩展到 5 个，但需分批生成，不一次性铺满。

## Shared Node

同一知识点可被多个 Claim 引用。

共享：
- 定义
- 通用机制

不共享：
- 项目为什么这样选
- 项目具体实现
- 项目故障处理
- 项目指标
