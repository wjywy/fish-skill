# Resume Copilot Templates

这里存放 `resume-copilot` 的 Kami family 模板资源。

**关键区分：内容槽位沿用本 skill 自己的模型，样式对齐上游 Kami。**
两者是分开的两件事——「样式一致」不代表「结构一致」。

- **内容槽位**：`schemas/resume-view.schema.json` 定义的
  `header / summary / skills / sections[].entries[]`（含 `summaryBullets / bullets / subBlocks / tags`），
  这是 skill 一直以来的内容模型，没有改成 Kami 的 `metrics / timeline / projects`。
- **样式**：`shared/kami-family.css` 是上游 Kami resume 模板 `<style>` 块的**逐字节拷贝**，
  由 `shared/kami-render.js` 把上面的槽位映射进 Kami 的类名，从而原样套用。
  页头排布与上游有一处刻意的差异（2×2 栅格 + 可选头像），
  收在 `shared/kami-layout.css` 一个文件里。

## 槽位 → Kami DOM 映射

| Resume View 槽位 | Kami 元素 |
| --- | --- |
| `header.name` | `.name.serif`（页头第 1 行左格） |
| `header.targetRole` | `.role`（页头第 1 行右格） |
| `header.educationInline` | `.alias`（页头第 2 行左格，教育信息只到年份） |
| `header.contacts[]` | `.contact`（页头第 2 行右格），`.sep` 分隔 |
| `header.avatar` | `.avatar` + `.header-main`（可选；头像在左、文字块在右） |
| `summary` | `.summary`（可省略，省略时不输出空块） |
| `skills[].label` / `.description` | `.skill-row > .skill-label` / `.skill-body` |
| `sections[].title` / `.range` | `.section-title`（`range` 落在 `.sub`） |
| `entry.time` | `.proj-role`（条目标题行左格：在职时间） |
| `entry.title` | `.proj-name.serif`（中格：公司 / 项目名称） |
| `entry.meta` | `.proj-kind`（右格：所在部门） |
| `entry.link` | `.proj-kind`（追加在 `meta` 之后，渲染成超链接） |
| `entry.tags[]` | **不渲染**（技术栈不上简历，仅留在数据里备查） |
| `entry.summaryBullets[]` / `entry.bullets[]` | `.proj-row`，label = `·` |
| `entry.subBlocks[]` | `.proj-row`，label = `|`，分标题加粗、单起一行 |
| `subBlocks[].bullets[]` | `.proj-row`，label = `·`（列在分标题之下） |
| `sections[type=education]` | `.edu-row`（`.school` / `.major` / `.date`），外层 `.no-break` |

`T4.4` 会断言渲染器**只输出上游类名**（唯二例外是 `.avatar` / `.header-main`，
由 `kami-layout.css` 自己定义并覆盖），且每个类名都被样式表覆盖——
否则那部分内容会掉样式。该断言同时跑「无头像」与「有头像」两种页头。

## 页头：与上游唯一的版式差异

上游 Kami 的页头是「`alias` 与姓名同行 + 两栏底部对齐」；本 skill 的页头改成
**2×2 栅格**：

```text
张知行                                          后端开发工程师 / AI 应用方向
华东理工大学 · 软件工程 · 2021–2025    github.com/zhangzhixing · …@example.com
────────────────────────────────────────────────────────────────────
```

- 第 1 行：姓名（左）| 目标岗位（右）—— 底部对齐。
- 第 2 行：教育信息（左）| 联系方式（右）—— 首行基线对齐。

**可选头像**（`header.avatar` 有值时）在文字块左侧再加一列，页头变成
「头像 + 文字块」并排；文字块与头像**等高**，第 1 行贴头像顶、第 2 行贴头像底。

**两种页头对 10 套主题都生效**，因为主题只覆盖颜色变量、头像只改页头排布，
两者正交。每个主题页右上角都有一个**预览开关**（`shared/preview-avatar.js`），
可以当场在「有头像 / 无头像」之间切换对比；`avatar-demo.html` 是默认打开头像的入口页。

这处差异**只写在 `shared/kami-layout.css` 一个文件里**，`kami-family.css`
仍然是上游的干净拷贝（497 行，0 差异）。`T4.14` 断言上游规则未被改动、
且覆盖文件确实声明了这条差异；`T4.15` 断言头像版式只由 `header.avatar` 触发；
`T1.12` 断言预览开关装在每个主题页上、且不会出现在正式简历里。

## Kami family 结构

- `shared/kami-family.css`
  - 上游 Kami resume 模板 `<style>` 块的逐字节拷贝（497 行，0 差异）。
  - 含 `@font-face "TsangerJinKai02"`（仓耳今楷 W04/W05，本地 `../fonts/` 优先、
    jsDelivr CDN 兜底）、`@page { size: A4; margin: 11mm 13mm }` 与全部上游规则。
  - **不要手改**：要改样式就同步上游，否则与 Kami 的一致性立刻丢失。
- `shared/kami-layout.css`
  - 本 skill 的版式微调，**必须在上游样式之后加载**。
  - 目前只有页头一处差异（见上）。
- `shared/kami-render.js`
  - 唯一的 HTML 骨架来源：把 Resume View 槽位映射到 Kami 的 DOM。
  - 改它即可同步影响 10 个主题页。
- `shared/sample-data.json`
  - 与 `schemas/resume-view.schema.json` 同结构的样例 Resume View。
- `shared/sample-data.js`
  - 上面 JSON 的经典 `<script>` 版本，挂到 `window.KAMI_RESUME_DATA`。
  - 存在的唯一原因是 `file://` 下浏览器会拦截 `fetch()`；主题页靠它才能双击直接预览。
- `shared/preview-avatar.js`
  - **预览专用**：主题页右上角的「显示头像 / 隐藏头像」开关，用来对比两种页头。
  - 只在数据是样例（`id === "resume-view-sample"`）时挂载 —— 换成真实 Resume View 后
    开关不会出现；打印时由 `@media print` 自动隐藏，不会占用 A4 页面。
  - 生成正式简历时把页面里那一行 `<script src="shared/preview-avatar.js"></script>` 删掉。
- `./kami-base.html`
  - 默认主题（`kami-default`），即上游原版配色，不做任何变量覆盖。
- `./avatar-demo.html`
  - 带头像的版式演示页（与 `kami-base` 同款样式），只多一步：渲染前给
    `window.KAMI_RESUME_DATA.header.avatar` 赋值。
  - 命名**不能**叫 `kami-*.html`：`T6.3` 会把目录里所有 `kami-*.html`
    当作主题文件、与 `render-options.schema.json` 的 theme 枚举比对，多一个就报错。
- `shared/avatar-sample.jpg` / `shared/avatar-placeholder.svg`
  - 头像占位图（真实照片 / 通用人形剪影），演示页用前者。
- 9 个主题（只覆盖颜色变量，不维护独立结构）：
  - `./kami-ivory.html`、`./kami-mono.html`、`./kami-navy.html`、`./kami-slate.html`
  - `./kami-teal.html`、`./kami-forest.html`、`./kami-burgundy.html`
  - `./kami-sepia.html`、`./kami-copper.html`

主题覆盖的是**上游变量名**（`--parchment / --ivory / --border / --border-soft / --near-black /
--dark-warm / --olive / --stone / --brand / --brand-tint`），10 个变量必须齐全，
且必须用分号分隔——用逗号会把整段 `:root` 解析成一条声明，其余变量全部失效。

## 分页

不做固定分页，内容在 A4 页面盒内自然流动：

- `@page { size: A4 }` 定义页面盒。
- `.project { break-inside: avoid }` 保证单个经历条目不被拆断。
- `sections[type=education]` 用 `.no-break`（`break-inside: avoid`）整体保持在一页内。
- 页数由内容量决定，不强制 2 页；需要压缩时可在 `<body>` 上手动加 `resume--dense`
  启用上游的紧凑变体（字号 9pt、行距收紧）。
- 内容过多时优先删内容（回到 Resume Strategy 重新取舍），不要改字号或页边距。

## 模板约束

- 默认面向 A4 中文技术简历。
- 结构只改 `kami-render.js`，主题只改 `kami-*.html` 的 `:root` 变量，
  与上游不同的版式只改 `kami-layout.css`；`kami-family.css` 不要动。
- section 可以按用户实际内容增删，不要求固定模块数量。
- 不为了视觉结构自动创造内容。
- 项目与工作经历的每条 bullet 都必须来自 Resume View 中已选 Claim / Metric。

## 内容组织建议

- 专业技能使用「能力方向 + 描述」，避免只堆关键词。
- 同一公司存在多个专项时用 `subBlocks` 聚合，避免拆成多个重复公司条目。
- 独立项目直接作为 `entry` 展示，项目地址写进 `entry.link`（完整 URL）。
- 页头教育信息（`header.educationInline`）**只到年份**；条目时间（`entry.time`）保留月份。
- 技术栈不要写进 `tags` 指望它显示——`tags` 按约定不渲染。
- 用 `**关键词**` 标记需要主题强调色的技术词与指标，渲染为 `<span class="hl">`
  （`skills` 里渲染为 `.em-brand`）；每条内容至少一处强调，但避免整句高亮。

## 预览入口

- 统一总览页：`./index.html`
- 单主题页：直接打开 `./kami-*.html`，用右上角开关切换有无头像
- 带头像入口：`./avatar-demo.html`（默认已打开头像，也可关掉对比）

## 生成正式简历时的替换规则

模板页里的这一行是**预览专用**：

```html
<!-- 预览用样例数据。生成正式简历时把这一行换成真实 Resume View。 -->
<script src="shared/sample-data.js"></script>
```

生成正式简历时**必须**把它替换为真实 Resume View 数据（内联
`window.KAMI_RESUME_DATA = {...}` 或换成真实数据文件），否则交付的简历会渲染样例内容。

模板页里还有一行也是**预览专用**：

```html
<!-- 预览专用：页头头像开关。生成正式简历时删掉这一行（非样例数据下它也不会出现）。 -->
<script src="shared/preview-avatar.js"></script>
```

生成正式简历时把它删掉。即使忘了删，它也会因为数据不再是样例而自动不挂载 ——
但那属于兜底，不要依赖。

生成时另一件必做的事：**先问用户要不要个人头像**。要就把图片路径写进
`header.avatar`，不要就留空 / 省略 —— 这决定交付的是哪一套页头版式。

## 用户主题选择

Resume Copilot 对用户暴露 `kami-default` 作为默认主题名。当前解析关系：

```text
kami-default -> kami-base.html
```

其他 9 个主题保持原有 ID。主题选择属于 Render Options，不属于 Resume Strategy；
用户不选择时必须回退到 `kami-default`。
