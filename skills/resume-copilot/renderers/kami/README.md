# Kami Renderer

Kami Renderer 负责把 `Resume View` 渲染成 A4 技术简历。它只负责展示，不决定事实、Claim、内容选择或正文措辞。

## 与上游 Kami 的关系

**内容槽位不变，样式对齐。** 这两件事分开：

- `Resume View` 沿用本 skill 自己的内容模型
  （`header / skills / sections[].entries[]`，见
  `../../schemas/resume-view.schema.json`），不改成 Kami 的
  `metrics / timeline / projects` 结构。
- 渲染器把上面的槽位**映射**进上游 Kami 的 DOM 类名，从而让
  `templates/shared/kami-family.css`（上游 `<style>` 的逐字节拷贝，497 行 0 差异）
  原样生效，成品样式与 Kami 完全一致。

槽位 → 类名的完整对照表见 `../../templates/README.md`。要点：

```text
header.name            → .name.serif           （页头第 1 行左格）
header.targetRole      → .role                 （页头第 1 行右格）
header.educationInline → .alias                （内部拆成「学校 · 专业」/「在校时间」两行）
header.contacts[]      → .contact              （与教育信息逐行配对）
header.avatar          → .avatar + .header-main（可选；文字块在左、头像在右）
skills[]               → .skill-row > .skill-label + .skill-body
sections[].title/range → .section-title (+ .sub；纯日期范围不重复显示）
entry.title            → .proj-name.serif      （左格：公司 / 项目名称）
entry.link             → `.proj-name a`        （紧跟名称的短标签超链接）
entry.meta             → .proj-kind            （中格：岗位 · 地点，居中）
entry.time             → .proj-role            （右格：时间；工作经历可按版式隐藏）
entry.tags[]           → 不渲染（技术栈不上简历）
entry.summaryBullets[] → .proj-row（label ·）
entry.bullets[]        → .proj-row（label ·）
entry.subBlocks[]      → .proj-row（label `|`，分标题加粗 + 极淡分组线）
subBlocks[].bullets[]  → .proj-row（label ·）
type=education         → .no-break + .edu-row
```

`T4.4` 断言渲染器只输出上游类名且每个类名都有样式覆盖——唯二例外是 `.avatar` /
`.header-main`，由版式覆盖文件自己定义并覆盖。该断言同时跑无头像与有头像两种页头。

### 与上游唯一的版式差异：页头

上游是「`alias` 与姓名同行 + 两栏底部对齐」，本 skill 改成 **2×2 栅格 + 两个内部两行块**：

```text
张知行                                          后端开发工程师 / AI 应用方向
华东理工大学 · 软件工程                         github.com/zhangzhixing
2021–2025                                      zhangzhixing@example.com
```

第 1 行是姓名 / 目标岗位；第 2 行内部是「学校 · 专业 / 联系方式 ①」，第 3 行内部是
「在校时间 / 联系方式 ②」。若 `header.avatar` 有值，文字块在左、头像在右，且文字块与
头像等高。

这处差异收在 `templates/shared/kami-layout.css` 一个文件里（必须在上游样式之后加载），
所以 `kami-family.css` 仍是上游的干净拷贝。`T4.14` / `T4.15` 会守住这一点。

### 页头与条目标题的版式规则

- 头像是可选的，但不再是生成前的阻塞问题：未提供时留空 `header.avatar`；交付入口可让用户自行预览主题。若填写，头像在**右侧**，文字块在左。
- 页头教育信息会拆为两行，按「学校 · 专业 ↔ 联系方式 ①」与「在校时间 ↔ 联系方式 ②」配对。
- 条目标题按「左公司 / 项目名 · 中岗位 / 地点 · 右时间」排列；中间岗位列居中。
- 工作经历的 `entry.time` 仍保留在数据中，但工作条目标题右侧的重复时间由 CSS 隐藏；项目 / 开源保留。
- 工作内容分组保留轻量 `|` 标记；后续分组保留极淡的低对比度分组线，再配合加粗标题 + 留白，避免表格感。

## 默认主题

用户侧默认主题 ID：`kami-default`，当前映射到 `templates/kami-base.html`。

可选主题：
- `kami-default`（→ `templates/kami-base.html`，上游原色）
- `kami-mono`（极简黑白）
- `kami-navy`（冷调商务）
- `kami-copper`（暖调工匠）
- `kami-seal`（朱砂印）

## 主题选择

主题只在渲染阶段解析：
- 用户已指定主题：直接使用。
- 用户说“默认 / 随便 / 直接生成 / 你决定”：使用 `kami-default`。
- 用户无偏好：不得阻塞生成，使用 `kami-default`。
- 生成 HTML / PDF 前可以询问一次主题偏好，但用户不需要必须选择。

主题自然语言映射：Default / 默认、Ivory / 象牙白、Mono / 黑白、Navy / 深蓝、Slate / 灰蓝、Teal / 青色、Forest / 森林绿、Burgundy / 酒红、Sepia / 复古棕、Copper / 铜色。

## 数据契约

Kami Renderer 直接消费 `../../schemas/resume-view.schema.json`。核心结构：

```text
Resume View
├── header            { name, targetRole, educationInline, avatar?, contacts[] }
├── skills[]          { label, description }
├── sections[]        { type, title, range }
│   └── entries[]     { time, title, meta, link? }
│       ├── summaryBullets[]   { id, text, claimIds, metricIds }
│       ├── bullets[]          { id, text, claimIds, metricIds }
│       ├── subBlocks[]        { title, bullets[] }
│       └── tags[]             （保留在数据里，不渲染）
└── renderOptions
```

两条与版式强相关的字段口径：

- `header.avatar`：**决定页头版式**（有值 = 头像版，留空 = 标准版）。生成阶段不反问；
  用户交付预览时可自行选择主题，若已提供头像则填写该字段，头像显示在右侧。
- `entry.link`：项目地址，渲染成紧跟项目名的超链接，显示文字取站点短名
  （`github.com/xxx/yyy` → `github`），`href` 是完整 URL。网址写在 `meta` 里
  也能识别（旧数据兼容），但新数据应写进 `link`。

每条 bullet 都带 `claimIds`（用到指标时带 `metricIds`），所以
Fact → Claim → Resume View 的追溯链在样式对齐之后依然完整。
`highlightClaimIds` / `notes` / `renderOptions` 属于内部元数据，不渲染。

## 分页

不做固定分页，内容在 A4 页面盒内自然流动：

- `@page { size: A4 }`（上游样式）定义页面盒。
- `.project { break-inside: avoid }` 保证单个经历条目不被拆断。
- `sections[type=education]` 用 `.no-break` 保持在一页内。
- 页数由内容决定，不强制 2 页。需要压缩时可在 `<body>` 上加 `resume--dense`
  启用上游的紧凑变体。
- 内容溢出时优先删内容（回到 Resume Strategy），**不要**改 CSS 字号或页边距。

## 文本强调约定

描述类字段里用 `**关键词**` 标记需要主题强调色的词：

```json
{ "text": "把刷新耗时由 **7h+** 降至约 **5min**。" }
```

渲染器先转义再解析，输出 `<span class="hl">关键词</span>`（`skills[].description` 里输出
`<span class="em-brand">`，与上游模板惯例一致）。标记本身无法注入 HTML，也不会以字面
`**` 泄漏到页面上。**每条内容至少保留一处强调，但不要整句高亮。**

## 调用

```js
renderKamiResume({ target: "#kami-root", data: resumeView });
```

`../../templates/shared/sample-data.json` 与 Resume View Schema 保持一致，可用于开发预览；
`../../templates/shared/sample-data.js` 是它的经典 `<script>` 版本，让主题页在 `file://`
下也能直接渲染。缺少 `renderOptions` 或 `theme` 时使用 `kami-default`。

## 结构与主题分离

- `templates/shared/kami-render.js`：唯一的骨架来源（槽位 → Kami DOM 映射）。
- `templates/shared/kami-family.css`：上游样式逐字节拷贝。
- `templates/shared/kami-layout.css`：与上游不同的版式微调（页头 2×2 栅格 + 可选头像）。
- `templates/shared/preview-avatar.js`：**预览专用**的页头头像开关，只在样例数据下挂载。
- `templates/kami-*.html`：主题变量入口，只写 `:root { --parchment: …; }` 覆盖。
- `templates/avatar-demo.html`：带头像版式的入口页（非主题，故不叫 `kami-*`）。

主题与头像正交：主题只控制颜色变量，头像只改页头排布，所以**每套主题都支持
「有头像 / 无头像」两种页头**。每个主题页都装了 `preview-avatar.js`，
可以当场切换对比；`T1.12` 守住「装在每个主题页上」且「不会进正式简历」这两点。

主题只控制颜色与视觉变量；不得修改 Career Profile、Resume Strategy、Claim 或 Metric。
