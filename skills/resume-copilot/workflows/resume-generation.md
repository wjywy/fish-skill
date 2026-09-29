# Resume Generation Workflow

## Required References

进入本流程后必须读取：

- `../policies/resume-writing-policy.md`
- `../examples/resume-bullet-patterns.md`
- `../schemas/resume-view.schema.json`
- `../renderers/kami/README.md`（两页槽位与文本强调约定）

## 目标

将 `Career Profile + Resume Strategy` 转换成目标岗位对应的 `Resume View`。

Resume Generation 回答“已经决定要写这些事实后，应该怎么组织和表达”。

## 输入

- Career Profile
- Resume Strategy
- Target Role / Target Direction（必须明确）
- 写作语言 / 长度 / 格式约束

若 Target Role / Target Direction 缺失，停止正式文案生成并先询问用户。不得根据已有技术词自行推断。

如果存在 Strategy，不得绕过 Strategy 重新从全部 Claims 任意挑选内容。

## 生成前必须确认

- **是否需要个人头像。** 头像对应两套页头版式：填写 `header.avatar` 时渲染为
  「头像在左 + 文字块在右」，留空则用标准页头。这是版式差异、不是文案差异，
  不能替用户默认，必须在开始生成前问一句。
- 主题（`renderOptions.theme`）用户未指定时按 `kami-default` 处理，不必单独发问。

## 顺序

1. 按 Strategy 读取 `selectedExperienceIds` 和 `selectedClaimIds`。
2. 根据 `sectionPlan` 分配内容位置和 bullet 数量。
3. 将相关 Claims 组合为 bullet；每条 bullet 必须生成稳定 `id`，并记录直接支撑它的 `claimIds` 与实际使用的 `metricIds`。
4. 优先采用 `Context/Action/Decision/Result` 中对目标岗位最有区分度的信息。
5. 使用符合 Ownership 的动词。
6. Metric 只能引用 `metricIds` 对应、且符合 Metric Policy 的指标。
7. 去除重复 Claim 和重复技术词。
8. 检查每条 bullet 是否可追溯回 Claim。
9. 输出符合 `../schemas/resume-view.schema.json` 的 Resume View：
   - `header`：姓名、目标岗位、教育简述（`educationInline`）、联系方式，
     以及可选的 `avatar`（用户要头像时才填）
   - `summary`：个人简介（可省略）
   - `skills`：能力方向 + 描述
   - `sections`：工作 / 项目 / 实习 / 开源 / 教育等；entry 内可含 `summaryBullets / bullets / subBlocks / tags`
   - `summaryBullets / bullets / subBlocks[].bullets` 使用结构化 Resume Bullet：`{ id, text, claimIds, metricIds }`；Renderer 只展示 `text`，追溯信息保留在 Resume View。
10. 需要主题强调色的技术词与指标，用 `**关键词**` 标记（渲染为 `<span class="hl">`）；每条内容至少一处，但不要整句高亮。
11. 如需 HTML / PDF，由 Renderer 解析 `renderOptions`；未指定主题则使用 `kami-default`。
12. 最后交给 Renderer。

## 字段口径

版式对字段写法有硬性要求，生成时必须遵守：

- `header.educationInline`：教育信息**只精确到年份**，不写月份 ——
  `华东理工大学 · 软件工程 · 2021–2025`。页头第 2 行空间有限，月份会挤掉联系方式的位置。
- `entry.time`：工作 / 项目 / 开源条目的时间**保留月份**（如 `2024.06 - 2024.09`），
  它落在条目标题行的左格，不与页头共用空间。
- `entry.meta`：条目标题行右格的说明文字，工作经历写所在部门（`后端开发实习生 / 上海`）。
- `entry.link`：项目地址，填**完整 URL**。Renderer 会渲染成超链接、显示文字取站点短名
  （`github.com/xxx/yyy` → `github`）。不要把它写成裸网址塞进 `meta`。
- `entry.tags`：技术栈标签**不渲染**（简历上不出现技术栈清单），可留在数据里备查。
- `summary`：可省略；省略时页头下方不留空块。

## 渲染与分页

Resume Generation 只决定**内容槽位**（上面的 `sections / entries / bullets`），
不管版式怎么排——那是 Rendering 的职责。Renderer 会把这套槽位映射到上游 Kami 的
DOM 类名（`.project / .proj-row / .skill-row / .edu-row`…），套用 Kami 的样式表，
使成品样式与 Kami 一致。映射表见 `../renderers/kami/README.md`。

分页不做固定切分：内容在 A4 页面盒内自然流动，单个经历条目由 CSS 保证不被拆断。
页数由内容量决定，不强制 2 页。内容过多时**回到 Resume Strategy 重新取舍**，
不要靠改版式参数或压缩字号硬塞。

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
