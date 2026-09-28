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

- 普通业务名词，且与目标岗位能力无关
- 没有岗位判断价值的名词
- 已经覆盖的同义词
- 仅作为举例出现、且与 Target Role / JD 无关的技术
- 新节点已经完全脱离目标岗位要求

注意：**不能因为新节点离根 Claim / 根关键词较远就停止。**
只要它仍然属于目标岗位的核心或相关能力，就应继续递归。

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

## 深度策略

不再使用 LOW / MEDIUM / HIGH 对应固定层数作为停止条件。

每个新节点都评估岗位相关性：

```text
CORE        → 必须继续深入
RELATED     → 通常继续深入
CONTEXTUAL  → 仅在能解释上层判断时继续
OUT_OF_SCOPE→ 停止该分支
```

深度由以下因素动态决定：

```text
Expansion Value = Role Relevance × Claim Strength × Interview Risk × New Information Value
```

根 Claim 只决定起点；`Target Role / JD Requirements` 才决定知识树的外边界。

实现可以设置高位 `hardMaxDepth` 作为异常兜底，但不得用固定层数主动截断仍与岗位相关的追问。

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
