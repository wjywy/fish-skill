# Resume Generation Workflow

## 目标

将 `Career Profile + Resume Strategy` 转换成目标岗位对应的 `Resume View`。

Resume Generation 回答“已经决定要写这些事实后，应该怎么组织和表达”。

## 输入

- Career Profile
- Resume Strategy
- 写作语言 / 长度 / 格式约束

如果存在 Strategy，不得绕过 Strategy 重新从全部 Claims 任意挑选内容。

## 顺序

1. 按 Strategy 读取 `selectedExperienceIds` 和 `selectedClaimIds`。
2. 根据 `sectionPlan` 分配内容位置和 bullet 数量。
3. 将相关 Claims 组合为 bullet。
4. 优先采用 `Context/Action/Decision/Result` 中对目标岗位最有区分度的信息。
5. 使用符合 Ownership 的动词。
6. Metric 只能引用 `metricIds` 对应、且符合 Metric Policy 的指标。
7. 去除重复 Claim 和重复技术词。
8. 检查每条 bullet 是否可追溯回 Claim。
9. 输出 Resume View。
10. 如需 HTML / PDF，由 Renderer 解析 `renderOptions`；未指定主题则使用 `kami-default`。
11. 最后交给 Renderer。

## Bullet 生成原则

生成正式 bullet 时必须读取 `policies/resume-writing-policy.md`。

默认目标结构：

```text
Action / Ownership
+ Scope / Object
+ Method / Mechanism
+ Problem / Constraint
+ Result / Metric
```

不要求机械包含所有字段，但正式 bullet 至少应有“动作 + 对象 + 具体技术机制”，并优先补充问题背景与结果。

禁止把“负责 XX 相关能力建设”“参与 XX 项目开发”这类低信息密度句子作为最终 bullet。

写作风格参考 `examples/resume-bullet-patterns.md`，只能学习信息组织方式，不得迁移用户未验证的事实。

## 三层职责

- **Resume Strategy：写什么。**
- **Resume Generation：怎么写。**
- **Rendering：长什么样。**

三者不得混合。
