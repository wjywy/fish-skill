# Resume Writing Policy

## 目标

将已验证的 Experience / Claim / Metric 写成高信息密度、技术事实明确、面试可追溯的 Resume Bullet。

本 Policy 只定义**写作硬规则**。具体优秀 / 反例与 Pattern 统一放在 `../examples/resume-bullet-patterns.md`，避免 Policy 与 Example 重复维护。

Resume Writing 不负责：

- 发明事实；
- 决定哪些 Claim 应该入选；
- Renderer 排版。

## 核心公式

优先形成：

```text
Action / Ownership
+ Scope / Object
+ Method / Mechanism
+ Problem / Constraint
+ Result / Metric
```

不要求每条包含全部五项，但正式 Bullet 至少应有：

```text
动作 + 对象 + 具体技术机制
```

并在事实存在时优先补充问题 / 约束与结果 / 指标。

## Rule 1：一句只表达一个核心主题

一条 Bullet 围绕一个主能力形成因果链。

不要把多个没有直接因果关系的模块、技术和结果堆进一句话。

如果一句里存在两个可以独立回答“你具体做了什么”的主题，应优先拆分。

## Rule 2：避免空泛职责句

以下表达不能作为正式 Bullet 的最终形态：

```text
负责 XX 相关能力建设
参与 XX 项目开发
完成 XX 功能
熟悉并使用 XX 技术
负责日常需求迭代
```

如果当前只有职责名词，应继续补“具体动作 / 对象 / 机制 / 问题 / 结果”，而不是润色空句。

## Rule 3：技术名词必须服务于动作和机制

禁止把技术栈列表直接当作贡献：

```text
使用 LangGraph、Redis、SSE、PostgreSQL、Outbox。
```

技术词需要说明：

- 它处理什么对象；
- 在链路中承担什么职责；
- 与其他组件怎么形成因果关系。

## Rule 4：存在真实背景时，说明为什么做

当 Claim 有明确 Problem / Constraint 时，应把它融入 Bullet。

优先形成：

```text
问题 / 目标
→ 动作 / 设计
→ 机制
→ 结果
```

不要为了显得高级而凭空创造背景或设计动机。

## Rule 5：结果具体，但不虚构 Metric

结果优先级：

1. 已验证量化指标；
2. 明确技术效果；
3. 明确业务效果；
4. 明确工程收益；
5. 无可靠结果时，只写可验证 Action / Mechanism。

Metric 是否可写统一读取 `./metric-policy.md`。

禁止自动补百分比、QPS、DAU、耗时、覆盖率等数字。

## Rule 6：Ownership 决定动词强度

默认：

- `OWNER`：主导、负责、设计、推动、规划；
- `DIRECT`：实现、开发、构建、重构、优化、搭建、抽象；
- `COLLABORATIVE`：参与、协同、共建、配合完成；
- `OBSERVED`：协助、接入、联调、排查、熟悉。

这不是机械词典。最终动词仍要和具体 Fact 对齐，但不得静默升级 Ownership。

## Rule 7：Bullet 内部优先形成因果链

优先：

```text
问题 → 方法 → 机制 → 结果
```

或：

```text
目标 → 设计 → 实现 → 效果
```

避免把背景、技术、结果作为互不关联的并列信息。

## Rule 8：技术动作要足够具体

优先描述真正发生的工程动作，例如：

- 抽象了什么；
- 如何持久化；
- 如何路由；
- 如何拆分；
- 如何恢复；
- 如何批处理；
- 如何处理一致性 / 幂等 / 并发；
- 如何测量 / 归因 / 验证。

“优化 RAG 效果”“提升系统性能”这类结果性概述不能代替实现机制。

## Rule 9：长度以信息完整为准，不机械套 STAR

中文技术简历更适合一个完整长句或两个逻辑紧密的分句。

不要为了模板机械拆成：背景一句、任务一句、动作一句、结果一句。

也不要为了塞更多关键词写成无法口述的超长句。

## Rule 10：项目介绍与个人贡献分开

项目简介回答：

> 这个项目是什么？

Bullet 回答：

> 你具体做了什么？

技术定义、协议百科、产品介绍不能直接当个人贡献。

## Rule 11：技术词无需教材式解释

简历不是知识文档。

除非“抽象 / 机制解释”本身就是贡献，不写：

```text
Redis 是一个高性能内存数据库……
```

直接说明 Redis 在当前方案中的作用。

## Rule 12：最终 Bullet 必须可追溯

每条 Bullet 必须追溯到：

```text
Bullet
→ Claim
→ Fact
```

含数字时：

```text
Bullet
→ Metric
→ Fact
```

一句话中的技术动作、Ownership、Result 或 Metric 无法追溯时，应删除、降级或返回 Mining 验证。

---

# Final Checklist

- [ ] 是否有明确动作，而不是只有职责名词？
- [ ] 是否说明了对象 / 系统 / 模块？
- [ ] 是否至少包含一个具体机制？
- [ ] 若有真实背景，是否能看出为什么做？
- [ ] Result / Metric 是否真实可追溯？
- [ ] 是否只表达一个核心主题？
- [ ] 是否存在技术名词堆砌？
- [ ] 动词是否符合 Ownership？
- [ ] 是否可追溯到 Claim / Metric / Fact？
- [ ] 是否把 Example 中的事实误迁移成用户事实？

具体 Pattern 与 Weak → Strong 示例读取 `../examples/resume-bullet-patterns.md`。