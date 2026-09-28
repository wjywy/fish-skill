# Resume Writing Policy

## 目标

将已验证的 Experience / Claim / Metric 写成高信息密度、技术事实明确、面试可追溯的技术简历 bullet。

Resume Writing 不负责发明事实，也不负责决定“写什么”；它只负责把 Resume Strategy 已选中的事实写成专业简历语言。

## 核心公式

技术简历 bullet 优先遵循：

```text
Action / Ownership
+ Scope / Object
+ Method / Mechanism
+ Problem / Constraint
+ Result / Metric
```

不要求每条都包含全部五项，但至少应包含：

```text
动作 + 对象 + 技术方案
```

并优先补充：

```text
问题 / 约束 + 结果 / 指标
```

## Rule 1：一句只表达一个核心主题

一条 bullet 只围绕一个主能力展开，例如：

- 页面编辑器
- 事件驱动机制
- Schema 建模
- 性能优化
- 发布链路
- 检索优化

不要把多个无直接因果关系的能力堆进一句话。

### Bad

> 负责页面编辑器、事件系统、物料平台、权限、发布和性能优化。

### Good

> 设计并实现低代码事件驱动机制，将组件事件、触发条件与动作配置统一抽象至 Schema，通过事件解析与运行时执行链路支撑组件间交互，降低页面交互逻辑的硬编码成本。

## Rule 2：避免空泛职责句

以下表达信息密度过低，不应作为正式 bullet 的最终形态：

- 负责 XX 相关能力建设
- 参与 XX 项目开发
- 完成 XX 功能
- 熟悉并使用 XX 技术
- 负责日常需求迭代

如果当前只有这些信息，应继续追问“具体做了什么 / 怎么做 / 解决什么问题 / 结果是什么”。

## Rule 3：优先使用“动作 + 技术机制”而不是“技术名词堆叠”

### Bad

> 使用 LangGraph、Redis、SSE、PostgreSQL、Outbox。

### Good

> 围绕 long-running Task 设计可恢复的异步通信链路，将 Task / Status / Artifact / Message 事件按任务顺序持久化至 PostgreSQL 快照与事务 Outbox，并通过 Redis Pub/Sub 完成跨实例广播，支持 SSE 断线重订阅与 Webhook 异步通知。

技术名词必须服务于一个明确动作或机制。

## Rule 4：优先写“为什么 / 解决什么问题”

当 Claim 中存在明确背景或约束时，应把它融入 bullet，而不是只写实现。

### Pattern

```text
针对 <problem/constraint>，通过 <method> 实现 <capability>，解决 <problem> / 达成 <result>。
```

### Example

> 针对电商页面结构频繁变化、传统爬虫维护成本高的问题，基于 LangChain 构建统一的 AI 页面识别能力，实现页面结构自动识别与数据清洗，每月节约运营人力约 10 PD。

## Rule 5：结果优先具体，不虚构数字

结果优先顺序：

1. 可验证量化指标
2. 明确技术效果
3. 明确业务效果
4. 明确工程收益
5. 无可靠结果时，只写可验证 Action / Mechanism

禁止为了“看起来像简历”自动补充百分比、耗时、规模、DAU、QPS 等数字。

## Rule 6：Ownership 决定动词强度

### OWNER

可使用：

- 负责
- 主导
- 设计
- 推动
- 规划

### DIRECT

可使用：

- 实现
- 开发
- 构建
- 重构
- 优化
- 搭建
- 抽象

### COLLABORATIVE

优先使用：

- 参与
- 协同
- 共建
- 配合完成

不得将 COLLABORATIVE 静默写成“主导 / 负责”。

## Rule 7：一条 bullet 内部优先形成因果链

好的 bullet 不是信息并列，而是形成：

```text
问题 → 方法 → 机制 → 结果
```

或：

```text
目标 → 设计 → 实现 → 效果
```

### Example

> 基于 Playwright 注入 Event Timing API 自建实验室度量，按加载期、hydration 期、滚动期三段归因，定位 hydration 长任务、滚动期长任务与加载期交互排队等核心病灶，为后续 INP 优化提供可复现的测量与归因依据。

## Rule 8：技术动作要足够具体

优先描述：

- 抽象了什么
- 如何持久化
- 如何路由
- 如何拆分
- 如何恢复
- 如何批处理
- 如何做一致性 / 幂等 / 并发控制
- 如何测量 / 归因 / 验证

弱表达：

> 优化 RAG 效果。

强表达：

> 针对历史问题归因场景优化 RAG 检索链路，通过语义切片、查询改写与多查询扩展扩大召回覆盖，并结合向量召回、去重与相关性排序优化候选集。

## Rule 9：Bullet 长度以信息完整为准，不机械套 STAR

不要为了“标准格式”强行把每条写成四句。中文技术简历更适合 1 个完整长句或 2 个逻辑紧密的分句。

优先：

```text
动作 + 机制 + 结果
```

而不是：

```text
背景一句。任务一句。动作一句。结果一句。
```

## Rule 10：项目介绍与个人贡献分开

项目简介回答“这个项目是什么”。
Bullet 回答“你做了什么”。

不要把：

> A2A 是一种 Agent 通信协议。

当作个人贡献 bullet。

## Rule 11：技术词首次出现时可保留英文，避免解释性赘述

简历不是教材。除非解释本身就是贡献，不要写：

> Redis 是一个高性能内存数据库……

直接写它在方案中的作用。

## Rule 12：最终 Bullet 必须可追溯

每条正式 bullet 必须能追溯到：

- 一个或多个 Claim
- 可选 Metric
- 对应 Experience

如果一句话中的某个技术动作无法追溯到已验证 Claim，应删除或降级为待确认表达。

---

# 常用 Bullet Pattern

## Pattern A：机制 / 架构建设型

```text
设计并实现 <mechanism>，将 <objects> 统一抽象 / 持久化 / 路由至 <model>，通过 <runtime/process> 支撑 <capability>，解决 <problem>。
```

适合：事件系统、工作流、权限、消息链路、渲染机制、Schema、平台治理。

## Pattern B：性能优化型

```text
针对 <performance problem>，基于 <measurement/tool> 完成 <diagnosis>，通过 <optimizations> 解决 <bottleneck>，最终 <metric/result>。
```

## Pattern C：工程效率型

```text
针对 <manual/engineering problem>，构建 <tool/system>，通过 <automation mechanism> 替代 / 简化 <old process>，使 <efficiency result>。
```

## Pattern D：数据 / 检索链路型

```text
针对 <retrieval/data problem>，通过 <stage1>、<stage2>、<stage3> 优化 <pipeline>，提升 <quality/result>。
```

## Pattern E：大规模系统处理型

```text
面向 <scale> 场景，通过 <batch/concurrency/cache mechanism> 控制 <resource/latency constraint>，将 <before> 优化至 <after>。
```

## Pattern F：协议 / 异步链路型

```text
围绕 <task/protocol scenario> 设计 <async/recoverable mechanism>，将 <events/state> 通过 <persistence> 持久化，并结合 <broadcast/stream/webhook> 支撑 <recovery/cross-instance capability>。
```

---

# Final Checklist

生成正式简历 bullet 前逐条检查：

- [ ] 是否有明确动作，而不是只有职责名词？
- [ ] 是否说明了具体对象 / 系统 / 模块？
- [ ] 是否至少包含一个具体技术机制？
- [ ] 是否能看出为什么做或解决了什么问题？
- [ ] 如果有结果，是否真实且可追溯？
- [ ] 是否只表达一个核心主题？
- [ ] 是否存在技术名词堆砌？
- [ ] 动词是否符合 Ownership？
- [ ] 是否可追溯到 Claim / Metric？
- [ ] 删除这条中的任意技术词后，是否仍能说明用户真正做了什么？若不能，说明这条可能只是关键词堆叠。
