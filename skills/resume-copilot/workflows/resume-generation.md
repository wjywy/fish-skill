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

- **头像不再作为对话阻塞问题。** 生成简历时不必先反问用户是否需要头像。
  默认 Resume View 留空 `header.avatar`（标准页头）。**每个成品主题页的左上角都有
  头像控件**：`选择头像` 挑一张本地照片 → 页头立刻切成头像版式（文字块在左、
  头像在**右侧**）；`移除头像` 回到标准页头。控件 `@media print` 隐藏，不会进 PDF。
  若用户明确提供头像路径 / URL，才写入 `header.avatar`。
- **主题也不需要单独发问。** 生成后直接用生成脚本产出成品 HTML 并交付；
  用户想换主题时改 `--theme` 重跑即可。`templates/index.html` 仍是主题预览入口
  （4 套主题 + base），供用户自主浏览。`renderOptions.theme` 可用于用户已明确
  指定主题的场景，未指定时默认 `kami-base`。

生成完成时，交付顺序是：

1. Resume View / 数据文件（含可选 `header.avatar`）。
2. 运行生成脚本产出 **主题选择入口 `templates/index.html`**（无需用户或使用方自己组装拼接）：

   ```bash
   node ../scripts/build-resume.mjs --data resume-view.json
   ```

   产出的是入口页 + 同目录下 5 个主题页（base / mono / navy / copper / seal），
   **每个主题页都内嵌真实简历数据，只换配色**；用户在入口页点开想看的那套，
   再打印导出 PDF。原样例总览页会被自动备份为 `index.sample.html`。
   （用户已明确指定主题时，加 `--theme kami-navy` 直接出该主题的成品 HTML。）
3. 用户打开 `templates/index.html` → 点开某套主题 → 需要头像就在该页左上角用头像控件
   选一张本地照片（或点「移除头像」保持标准页头）→ 浏览器「打印 → 另存为 PDF」导出
   （勾选背景图形保留纸色；头像控件不会出现在 PDF 里）。

不要为了选择头像或配色而打断内容生成流程；这两个选择都属于交付阶段的视觉决策。

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
   - `skills`：能力方向 + 描述
   - `sections`：工作 / 项目 / 实习 / 开源 / 教育等；entry 内可含 `summaryBullets / bullets / subBlocks / tags`
   - `summaryBullets / bullets / subBlocks[].bullets` 使用结构化 Resume Bullet：`{ id, text, claimIds, metricIds }`；Renderer 只展示 `text`，追溯信息保留在 Resume View。
10. 需要主题强调色的技术词与指标，用 `**关键词**` 标记（渲染为 `<span class="hl">`）；每条内容至少一处，但不要整句高亮。
11. 如需 HTML / PDF，由 Renderer 解析 `renderOptions`；未指定主题则使用 `kami-default`。
12. 最后交给 Renderer。

## 字段口径

版式对字段写法有硬性要求，生成时必须遵守：

- `header.educationInline`：教育信息**精确到月份**，`-` 两侧带空格 ——
  `华东理工大学 · 软件工程 · 2021.9 – 2025.6`。Renderer 会把最后一个年份段拆到第二行：
  第 1 行「大学 · 专业」配第 1 个联系方式，第 2 行「在校时间」配第 2 个联系方式。
- `entry.time`：工作 / 项目 / 开源条目的时间**保留月份**（如 `2024.06 - 2024.09`），
  显示在标题行右侧。
- `entry.title` + `entry.meta`：条目标题行依次为「左：公司 / 项目名；中：岗位 · 地点 /
  访问链接（居中）；右：时间」。中间列全部条目共享同一条居中基线（时间列固定宽度）。
- `entry.meta`：工作条目写任职岗位与地点（`后端开发实习生 / 上海`）；开源条目写社区名。
- `entry.link`：项目地址，填**完整 URL**。Renderer 在中格显示「站点/末段」短文本
  （`github.com/xxx/yyy` → `github/yyy`），与 meta 并存时用「·」分隔；不要把网址塞进 `meta`。
- `entry.tags`：技术栈标签**不渲染**（简历上不出现技术栈清单），可留在数据里备查。
- `subBlocks[].title`：分组标题渲染为加粗的 `｜标题`（竖线与文字齐平）；
  工作经历与项目经历的描述区域**不画任何分组线/下划线**，层次只靠字重、
  主题色和组间留白表达。
- Resume View 与最终简历都**必须省略独立个人简介 / summary**；页头后直接进入专业技能，不生成同义的引言段落。
- 描述中的**数据类文字**（指标、百分比、耗时等）用 `**…**` 标记高亮。

## 渲染与分页

Resume Generation 只决定**内容槽位**（上面的 `sections / entries / bullets`），
不管版式怎么排——那是 Rendering 的职责。Renderer 会把这套槽位映射到上游 Kami 的
DOM 类名（`.project / .proj-row / .skill-row / .edu-row`…），套用 Kami 的样式表，
使成品样式与 Kami 一致。映射表见 `../renderers/kami/README.md`。

分页不做固定切分：内容在 A4 页面盒内自然流动，单个经历条目由 CSS 保证不被拆断。
页数由内容量决定，不强制 2 页。内容过多时**回到 Resume Strategy 重新取舍**，
不要靠改版式参数或压缩字号硬塞。

**字体**：模板的正文字体是仓耳今楷（`TsangerJinKai02`），仓库里不带字体文件，
默认从 CDN 取。若用户要**离线出稿**、或打印出的 PDF 里**搜不到简历上的字**
（回退到系统宋体会让汉字落到康熙部首码位，ATS 关键词匹配失败），
让用户执行一次 `../scripts/ensure-fonts.sh` 把字体装到本机即可。
不要为了绕开它去改 `kami-family.css`。

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
