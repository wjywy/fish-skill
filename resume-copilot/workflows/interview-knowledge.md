# Interview Knowledge Workflow

## 目标

Interview Knowledge 是默认面试准备模式。它不要求用户先回答问题，而是围绕 Resume View 中暴露的 Claim 自动生成：

- 面试问题
- 参考答案
- 参考答案中新的可追问知识节点
- 下一层追问与回答
- 最终形成 Interview Knowledge Tree / Graph

核心链路：

```text
Resume Claim
   ↓
Root Question
   ↓
Generated Reference Answer
   ↓
Extract Drillable Knowledge Nodes
   ↓
Normalize / Deduplicate / Prioritize
   ↓
Generate Follow-up Question
   ↓
Generate Follow-up Answer
   ↺
```

默认模式下，**不得因为答案是系统生成的，就推断用户已经掌握这些内容**。

## 输入

优先读取：

- Resume View 中实际暴露的 `claimIds`
- Claim 对应的 Experience / Metric / Ownership / Evidence
- Target Role / JD Requirement
- 已存在的 Interview Knowledge Graph

不要重新从最终简历文案猜事实；简历文本只用于确定“用户最终暴露了什么”。

## Root Question 生成

每个核心 Claim 可以按需覆盖以下问题维度：

1. `DEFINITION`：是什么
2. `MOTIVATION`：为什么需要
3. `IMPLEMENTATION`：怎么做
4. `MECHANISM`：底层为什么成立
5. `FAILURE`：异常、失败、恢复
6. `CONSISTENCY`：一致性、顺序、幂等
7. `CONCURRENCY`：并发、竞态、锁
8. `PERFORMANCE`：吞吐、延迟、复杂度、指标
9. `TRADEOFF`：为什么选 A，不选 B
10. `SCALING`：规模扩大后怎么办
11. `METRIC`：指标怎么计算、来源是什么
12. `OWNERSHIP`：这个能力在项目中自己做到哪一层

不是每个 Claim 都机械生成全部维度。根据 Claim Strength、Target Role、JD 相关性决定覆盖范围。

## Generated Reference Answer

参考答案必须：

- 优先基于 Career Profile 中已验证事实
- 明确区分“项目事实”和“通用知识解释”
- 不得把通用知识自动写成用户实际做过
- 不得静默提高 Ownership
- 不得编造用户没有确认的指标、故障案例或架构细节

参考答案建议由两部分组成：

```text
项目回答：结合用户真实经历说明在项目里怎么做
通用补充：解释相关原理、边界和技术取舍
```

如果项目事实不足：

```text
projectGrounding = INSUFFICIENT
```

此时可以给通用参考答案，但必须标记“这是知识补充，不代表用户做过”。

## Answer-driven Knowledge Expansion

系统生成参考答案后，从答案中抽取具有面试价值的知识节点继续展开。

例如：

```text
Q: 为什么需要 Outbox？

A: 为了解决数据库状态更新与消息发送之间的双写一致性问题，
可以在同一个本地事务里同时更新 Task 和写入 Outbox Event，
之后由 Worker 异步投递。
```

可抽取：

- 双写一致性 → `CONSISTENCY`
- 本地事务 → `MECHANISM`
- Outbox Event → `DATA_MODEL`
- Worker 异步投递 → `IMPLEMENTATION`

继续生成：

```text
Q: 什么是双写一致性问题？
A: ...

Q: 为什么 Task 与 Outbox Event 要在同一个事务里？
A: ...

Q: Worker 重复投递怎么办？
A: ...
```

## Knowledge Node 类型

统一使用以下类型：

- `CONCEPT`：基础概念
- `TECHNOLOGY`：框架、中间件、数据库等技术
- `MECHANISM`：具体机制或原理
- `PROTOCOL`：HTTP、SSE、Webhook、JSON-RPC 等
- `DATA_MODEL`：Task、Event、Artifact、Version 等
- `IMPLEMENTATION`：具体实现方式
- `DECISION`：设计决策
- `TRADEOFF`：方案取舍
- `ALTERNATIVE`：替代方案
- `FAILURE`：失败模式
- `RECOVERY`：恢复机制
- `CONSISTENCY`：一致性语义
- `CONCURRENCY`：并发控制
- `IDEMPOTENCY`：幂等 / 去重
- `PERFORMANCE`：性能与复杂度
- `METRIC`：指标和口径
- `SECURITY`：权限、安全、隔离
- `ARCHITECTURE`：架构模式、状态机、DAG、Supervisor 等
- `OWNERSHIP`：项目责任边界

## Expansion Priority

当答案中出现多个节点时，按优先级展开：

```text
DECISION / TRADEOFF / FAILURE / RECOVERY
        ↓
CONSISTENCY / CONCURRENCY / IDEMPOTENCY
        ↓
IMPLEMENTATION / ARCHITECTURE / PERFORMANCE / METRIC
        ↓
MECHANISM / PROTOCOL / DATA_MODEL
        ↓
CONCEPT / TECHNOLOGY
```

同时考虑：

- 是否直接支撑当前 Claim
- 是否与 JD 高相关
- 是否属于强措辞暴露的责任
- 是否是面试官很可能继续追问的节点

默认每个父节点只扩展 1–3 个高价值子节点。

## 去重与环路控制

必须维护 Knowledge Node Registry。

建议语义唯一键：

```text
normalizedConcept + contextClaimId + questionDimension
```

停止重复创建的场景：

- 节点与祖先语义等价
- 只换了一种措辞
- 同一 Claim 下已经覆盖同一问题
- 新节点只会回到父节点
- 节点已经被共享知识节点覆盖

跨 Claim 可以共享知识节点，但必须保留不同 `projectContext`。

例如 `幂等` 的通用定义可以共享，但：

- Outbox Consumer 幂等
- 支付请求幂等

属于不同项目上下文问题。

## 停止条件

当前知识分支满足以下任一条件时停止：

1. 已覆盖：是什么 / 为什么 / 怎么做 / 边界 / 取舍 中当前 Claim 真正需要的维度
2. 继续展开已经偏离 Resume Claim
3. 已达到目标岗位合理面试深度
4. 进入源码、标准文档或学术细节，但简历并未暴露该深度
5. 节点已被其他分支充分覆盖
6. 新节点仅是普通名词，不产生新的面试判断价值
7. 达到 `maxDepth` 兜底限制

默认 `maxDepth = 8`，但不得把“追够 8 层”当目标。

## 输出

Interview Knowledge Pack 至少包含：

- `claimId`
- Root Questions
- Generated Reference Answers
- Extracted Knowledge Nodes
- Parent / Child Relationships
- Node Type
- Question Dimension
- Project Grounding Status
- Shared Knowledge References
- Expansion Depth
- Stop Reason

## 与 Mock Interview 的关系

Interview Knowledge 只负责“准备问题与答案”。

它不判断用户本人是否已经掌握。

只有用户明确进入模拟面试时，才把其中的问题交给 `workflows/mock-interview.md`。
