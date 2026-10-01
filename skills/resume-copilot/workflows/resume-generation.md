# Resume Generation Workflow

## Required References

进入本流程后必须读取：

- `../policies/resume-writing-policy.md`
- `../policies/evidence-policy.md`
- `../policies/metric-policy.md`
- `../examples/resume-bullet-patterns.md`
- `../schemas/resume-view.schema.json`
- `../renderers/kami/README.md`（仅用于字段到 Renderer 的接口约定）

## 目标

将 `Career Profile + Resume Strategy` 转换成目标岗位对应的 `Resume View`。

Resume Generation 只回答：**Strategy 已经决定写哪些事实后，如何把这些事实组织成可追溯的简历内容。**

它不负责：

- 重新选择被 Strategy 排除的 Claim；
- 创造项目事实；
- 主题设计、头像控件、字体加载、打印参数等 Renderer 实现；
- 通过压字号或改页面参数解决内容过多。

## 输入

- Career Profile
- Resume Strategy
- Target Role / Target Direction（必须明确）
- 写作语言 / 长度 / 格式约束

若 Target Role 缺失，停止正式文案生成并先确认方向。不得根据技术词自行推断。

如果已经存在 Resume Strategy，不得绕过 Strategy 重新从全部 Claims 任意挑选内容。

## 主流程

```text
Resume Strategy
  ↓
Selected Experience / Claim / Metric
  ↓
Content Composition
  ↓
Traceability Check
  ↓
Resume View
  ↓
Renderer Handoff
```

### Step 1：按 Strategy 取材

读取：

- `selectedExperienceIds`
- `selectedClaimIds`
- `sectionPlan`
- `emphasis`
- `coverageGaps / riskNotes`（只用于决策，不直接写进简历）

数字必须同时满足 `metric-policy.md`；Claim 被选中不代表关联 Metric 自动可写。

### Step 2：组合 Bullet

每条正式 Bullet 必须：

- 有稳定 `id`；
- 记录直接支撑它的 `claimIds`；
- 仅在实际使用指标时记录对应 `metricIds`；
- 使用符合 Ownership 的动词；
- 遵守 `resume-writing-policy.md`。

默认信息结构：

```text
Action / Ownership
+ Scope / Object
+ Method / Mechanism
+ Problem / Constraint
+ Result / Metric
```

不要求机械包含全部字段，但至少要有“动作 + 对象 + 具体技术机制”。

优先形成因果链，而不是关键词列表。

### Step 3：去重与压缩

检查：

- 多条 Bullet 是否重复证明同一个能力；
- 同一技术词是否无意义重复；
- 项目介绍是否混进个人贡献；
- 是否存在空泛职责句；
- 是否为了塞更多内容而牺牲事实完整性。

内容过多时返回 Resume Strategy 减少低价值 Claim / Bullet，不通过 Renderer 压缩字号解决。

### Step 4：追溯检查

每条 Bullet 逐段检查：

```text
Bullet
→ claimIds
→ Claim
→ factIds
→ Fact / Evidence
```

包含数字时额外检查：

```text
Bullet.metricIds
→ Metric
→ factIds
→ Fact
```

一句话里无法追溯的技术动作、Ownership 或指标必须删除、降级或回到 Mining 验证。

## Resume View 输出

输出必须符合 `../schemas/resume-view.schema.json`。

### Header

`header` 只承载页头事实，例如：

- 姓名
- Target Role
- `educationInline`
- 联系方式
- 可选 `avatar`

**不生成 standalone summary。** 页头后直接进入 Skills / Sections。

用户没有提供头像时，`header.avatar` 留空即可；头像的交互选择属于 Renderer。

### Skills

Skills 应围绕目标岗位组织能力方向，不把项目 Bullet 原样复制成技能描述，也不新增 Career Profile 中不存在的项目事实。

### Sections / Entries

`sections` 承载工作、项目、实习、开源、教育等。

Entry 可包含：

- `summaryBullets`
- `bullets`
- `subBlocks`
- `tags`

`summaryBullets / bullets / subBlocks[].bullets` 使用结构化 Resume Bullet：

```text
{ id, text, claimIds, metricIds }
```

Renderer 只展示 `text`，追溯信息保留在 Resume View。

## 字段口径

这些属于 **Resume View 与 Renderer 的接口契约**；如 Renderer README 后续修改，以 `../renderers/kami/README.md` 为准，本 Workflow 不复制视觉实现。

- `header.educationInline`：教育信息保留到月份，例如 `华东理工大学 · 软件工程 · 2021.9 – 2025.6`。
- `entry.time`：工作 / 项目 / 开源条目保留月份。
- `entry.meta`：职位、地点、社区等补充信息；不要把完整 URL 塞进 meta。
- `entry.link`：项目地址使用完整 URL。
- `entry.tags`：允许作为数据保留；是否渲染由 Renderer 决定。
- `subBlocks[].title`：表达条目内部的小分组。
- 数据类文字、重要技术词可用 `**…**` 标记强调，但不要整句高亮。
- Resume View 和最终简历都省略独立个人简介 / summary。

## Renderer Handoff

Resume Generation 完成 Resume View 后结束内容职责，并交给 Renderer。

```text
Resume View
→ renderOptions
→ Renderer / build script
→ HTML / PDF
```

Renderer 细节统一读取：

- `../renderers/kami/README.md`
- `../schemas/render-options.schema.json`
- 相关 `scripts/` / `templates/`

默认 Renderer 为 `kami`，默认主题 ID 为 `kami-default`；当前模板文件映射、主题数量、头像交互、字体加载和打印方式均只在 Renderer / templates 文档维护。

Generation 不重复维护这些实现细节，避免出现 `kami-base` / `kami-default`、主题数量或字体策略多处漂移。

## 三层职责

```text
Resume Strategy  → 写什么
Resume Generation → 怎么写成 Resume View
Renderer           → 长什么样、怎么构建
```

三层不得相互越权。