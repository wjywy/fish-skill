# Experience Mining Workflow

## Required References

进入本流程后必须读取：

- `../policies/evidence-policy.md`
- `../policies/metric-policy.md`

需要形成 Claim / Metric 时以对应 Schema 为约束。

## 目标

把 Raw Career Input 中抽取出的 Facts，连同用户的零散补充，转化为可以验证的 Experience、Claim 与 Metric，而不是直接润色成简历 bullet。

## 追问主流程

经历追问以简历信息价值为优先，不按技术知识树展开。默认顺序：

```text
DISCOVER
   ↓
OWNERSHIP
   ↓
ACTION / MECHANISM
   ↓
CONTEXT / PROBLEM
   ↓
RESULT / METRIC
   ↓
DECISION / TRADEOFF   (仅在真实存在取舍时)
   ↓
VERIFY
```

并非每次都必须完整走完所有步骤；根据已有 Facts 跳过已经确认的部分。

每轮默认只追问 **1–3 个最高价值问题**。优先补会影响简历 Claim 强度和表达准确性的缺口，不要把 Experience Mining 变成技术面试。

如果用户目标是生成简历，正式文案生成前必须已知 Target Role / Target Direction；目标未知时可以继续收集事实，但应先完成方向确认再进入正式 Resume Generation。

## 1. DISCOVER

目标：确认用户说的关键词对应哪件真实事情。

优先识别：
- 项目 / 需求 / 故障 / 优化专项 / 平台 / 工具
- 时间范围
- 所属公司或团队

避免：刚听到一个技术名词就直接生成简历文案。

## 2. OWNERSHIP

Ownership 使用独立维度：
- `OWNER`：主导方案或承担最终责任
- `DIRECT`：自己直接实现关键部分
- `COLLABORATIVE`：和别人共同完成
- `OBSERVED`：接触、联调、排查、旁观或了解
- `NONE`：无实际参与

不要仅根据动词猜 ownership；必要时直接确认。

## 3. ACTION / MECHANISM

追问用户实际做过的动作：
- 改了什么模块 / 接口 / 数据结构 / 链路 / 配置 / 脚本
- 做了什么设计、排查、迁移、治理、优化、监控、压测
- 哪些内容是自己完成，哪些来自团队现有方案

Action 应尽量是可验证事实，不使用“提升能力”“赋能业务”这类空泛表述。

## 4. CONTEXT / PROBLEM

确认：
- 为什么出现这个需求？
- 原来的状态或痛点是什么？
- 服务谁、影响什么链路？

Context 用于解释 Action 的价值，不需要写成长篇项目背景。

## 5. RESULT / METRIC

优先确认：
- 性能、时延、成本、人力、错误率、覆盖率、上线周期、稳定性等量化结果
- 如果没有数字，确认可验证的定性结果
- 如果用户不记得，不编造数字；标记为 `unknown` 或 `unverified`

## 6. DECISION / TRADEOFF

只在存在真实技术取舍，且该取舍会增强或改变简历 Claim 时追问：
- 为什么这么做？
- 是否比较过替代方案？
- 哪个约束导致最终选择？

不要为了显得高级而强行要求每个项目都有架构决策。更深的技术追问应留给 Interview Knowledge。

## 7. VERIFY

形成 Claim，并确认：
- statement
- ownership
- evidenceLevel
- confidence
- interviewRisk
- 是否允许写入简历

验证规则读取 `../policies/evidence-policy.md`。

## Resume Ready 停止条件

满足以下条件后，不再默认追问：
- Target Role / Target Direction 已知（当目标是生成简历时）；
- Context / Problem 已知；
- Ownership 已知；
- ≥ 1 Action；
- ≥ 1 具体 Mechanism / 实现方式；
- ≥ 1 Claim；
- Result 已知，或明确无可靠量化结果。

停止后进入 Resume Strategy / Generation。不要为了覆盖所有潜在面试问题继续深挖；技术递归属于 Interview Knowledge。

## 输出

阶段输出不是简历，而是已验证职业事实：
- Experience 草稿
- Claim 列表
- Metric 列表
- 未确认问题
- 是否 `resumeReady`
