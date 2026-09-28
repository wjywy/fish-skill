# Experience Mining Workflow

## 目标

把 Raw Career Input 中抽取出的 Facts，连同用户的零散补充，转化为可以验证的 Experience、Claim 与 Metric，而不是直接润色成简历 bullet。

## 状态机

```text
DISCOVER
   ↓
CONTEXT
   ↓
OWNERSHIP
   ↓
ACTION
   ↓
DECISION
   ↓
RESULT
   ↓
DEPTH
   ↓
VERIFY
```

并非每次都必须完整走完所有状态；根据 Facts 与用户已经提供的信息跳过已确认部分。若输入仍很原始，先读取 `input-intake.md`。

## 1. DISCOVER

目标：确认用户说的关键词对应哪件真实事情。

优先识别：
- 项目 / 需求 / 故障 / 优化专项 / 平台 / 工具
- 时间范围
- 所属公司或团队

避免：刚听到一个技术名词就直接生成简历文案。

## 2. CONTEXT

确认：
- 为什么出现这个需求？
- 原来的状态或痛点是什么？
- 服务谁、影响什么链路？

## 3. OWNERSHIP

Ownership 使用独立维度：
- `OWNER`：主导方案或承担最终责任
- `DIRECT`：自己直接实现关键部分
- `COLLABORATIVE`：和别人共同完成
- `OBSERVED`：接触、联调、排查、旁观或了解
- `NONE`：无实际参与

不要仅根据动词猜 ownership；必要时直接确认。

## 4. ACTION

追问用户实际做过的动作：
- 改了什么模块 / 接口 / 数据结构 / 链路 / 配置 / 脚本
- 做了什么设计、排查、迁移、治理、优化、监控、压测
- 哪些内容是自己完成，哪些来自团队现有方案

Action 应尽量是可验证事实，不使用“提升能力”“赋能业务”这类空泛表述。

## 5. DECISION

只在存在真实技术取舍时追问：
- 为什么这么做？
- 是否比较过替代方案？
- 哪个约束导致最终选择？

不要为了显得高级而强行要求每个项目都有架构决策。

## 6. RESULT

优先确认：
- 性能、时延、成本、人力、错误率、覆盖率、上线周期、稳定性等量化结果
- 如果没有数字，确认可验证的定性结果
- 如果用户不记得，不编造数字；标记为 `unknown` 或 `unverified`

## 7. DEPTH

根据即将形成的 Claim 做自适应深挖，而不是固定问卷。

例如 Claim 涉及 `Outbox`，可以继续确认：
- 为什么需要 Outbox？
- 用户做到表结构、Worker、重试、幂等中的哪一层？
- 哪些是实际实现，哪些只是理解？

只有当该深度会影响简历表述或面试风险时才继续。

## 8. VERIFY

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
- Context 已知
- Ownership 已知
- ≥ 1 Action
- ≥ 1 Claim
- Result 已知或明确无可靠量化
- 关键 Claim 的 Interview Risk 已知

## 输出

阶段输出不是简历，而是已验证职业事实：
- Experience 草稿
- Claim 列表
- Metric 列表
- 未确认问题
- 是否 `resumeReady`
