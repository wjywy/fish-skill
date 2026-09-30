# Resume Copilot Templates

这里存放 `resume-copilot` 的 Kami family 模板资源。

**关键区分：内容槽位沿用本 skill 自己的模型，样式对齐上游 Kami。**
两者是分开的两件事——「样式一致」不代表「结构一致」。

- **内容槽位**：`schemas/resume-view.schema.json` 定义的
  `header / skills / sections[].entries[]`（含 `summaryBullets / bullets / subBlocks / tags`），
  这是 skill 一直以来的内容模型，没有改成 Kami 的 `metrics / timeline / projects`。
- **样式**：`shared/kami-family.css` 是上游 Kami resume 模板 `<style>` 块的**逐字节拷贝**，
  由 `shared/kami-render.js` 把上面的槽位映射进 Kami 的类名，从而原样套用。
  与上游不同的版式**全部**收在 `shared/kami-layout.css` 一个文件里
  （页头 2×2 栅格、可选头像、条目标题三段对齐、纸纹、打印规则），
  `kami-family.css` 保持冻结。

## 槽位 → Kami DOM 映射

| Resume View 槽位 | Kami 元素 |
| --- | --- |
| `header.name` | `.name.serif`（页头第 1 行左格） |
| `header.targetRole` | `.role`（页头第 1 行右格） |
| `header.educationInline` | `.alias`（内部拆成「学校 · 专业」和「在校时间」两行） |
| `header.contacts[]` | `.contact`（与教育信息逐行配对） |
| `header.avatar` | `.avatar` + `.header-main`（可选；文字块在左、头像在右） |
| `skills[].label` / `.description` | `.skill-row > .skill-label` / `.skill-body` |
| `sections[].title` / `.range` | `.section-title`（`range` 落在 `.sub`） |
| `entry.time` | `.proj-role`（条目标题行右格：时间；工作经历的重复时间会隐藏） |
| `entry.title` | `.proj-name.serif`（左格：公司 / 项目名称） |
| `entry.meta` | `.proj-kind`（中格：岗位 · 地点，居中） |
| `entry.link` | `.proj-name a`（跟在项目名后面的短标签超链接） |
| `entry.tags[]` | **不渲染**（技术栈不上简历，仅留在数据里备查） |
| `entry.summaryBullets[]` / `entry.bullets[]` | `.proj-row`，label = `·` |
| `entry.subBlocks[]` | `.proj-row`，label 留空；`.proj-text` 内以 `｜` + 加粗分标题，竖线与标题文字齐平；描述区不加下划线 |
| `subBlocks[].bullets[]` | `.proj-row`，label = `·`（列在分标题之下） |
| `sections[type=education]` | `.edu-row`（`.school` / `.major` / `.date`），外层 `.no-break` |

`T4.4` 会断言渲染器**只输出上游类名**（唯二例外是 `.avatar` / `.header-main`，
由 `kami-layout.css` 自己定义并覆盖），且每个类名都被样式表覆盖——
否则那部分内容会掉样式。该断言同时跑「无头像」与「有头像」两种页头。

## 版式差异之一：页头 2×2 栅格

上游 Kami 的页头是「`alias` 与姓名同行 + 两栏底部对齐」；本 skill 的页头改成
**2×2 栅格 + 两个内部两行块**：

```text
张知行                                          后端开发工程师 / AI 应用方向
华东理工大学 · 软件工程                         github.com/zhangzhixing
2021–2025                                      zhangzhixing@example.com
────────────────────────────────────────────────────────────────────
```

- 第 1 行：姓名（左）| 目标岗位（右）—— 底部对齐。
- 第 2 行内部：学校 · 专业（左）| 联系方式 ①（右）。
- 第 3 行内部：在校时间（左）| 联系方式 ②（右）。

**可选头像**（`header.avatar` 有值时）在文字块右侧加一列，页头变成
「文字块 + 头像」并排；头像固定在最右。

**两种页头对 5 套主题都生效**，因为主题只覆盖颜色变量、头像只改页头排布，
两者正交。每个主题页右上角都有一个**预览开关**（`shared/preview-avatar.js`），
可以当场在「有头像 / 无头像」之间切换对比；`avatar-demo.html` 是默认打开头像的入口页。

这处差异**只写在 `shared/kami-layout.css` 一个文件里**，`kami-family.css`
仍然是上游的干净拷贝（497 行，0 差异）。`T4.14` 断言上游规则未被改动、
且覆盖文件确实声明了这条差异；`T4.15` 断言头像版式只由 `header.avatar` 触发；
`T1.12` 断言预览开关装在每个主题页上、且不会出现在正式简历里。

## 版式差异之二：条目标题三段对齐

条目标题行（`.proj-head`）是三段栅格：

```text
某智能平台公司                  后端开发实习生 / 上海       2024.06 - 2024.09
某互联网公司                    服务端开发实习生 / 杭州       2023.07 - 2023.10
```

- 左：公司 / 项目名，左对齐；项目链接跟在项目名后面。
- 中：岗位 · 地点，**居中对齐**。
- 右：时间，右对齐。
- 工作经历下方已经有时间时，工作条目的右侧标题时间会隐藏，避免重复；项目 / 开源保留。

公司列下限 30mm，岗位列弹性，时间列按内容宽度。这样公司不会被截断，岗位不会贴着
公司名，时间也形成一条稳定的右侧锚点。

## 纸纹（GRAIN）

上游只给了一个纯色底（`--parchment #f5f4ed`）。它叫"羊皮纸"，但没有任何纸的质感 ——
看上去只是一块米色。`kami-layout.css` 叠了一层极淡的颗粒：

- 内联 data-URI 的 `feTurbulence`，**不依赖任何外部资源**（离线也生效）。
- `type='fractalNoise'` + `feColorMatrix saturate=0` + `opacity 5%`：
  连续噪声去色后只留纸纤维感，看不出噪点。
- 只挂在 `html` 上，并把 `body` 的底色让开（`transparent`）——
  否则 body 的不透明底色会盖掉颗粒；两边都挂又会在 body 区域叠出双倍密度、出现摩尔纹。

`T4.18` 断言颗粒存在，且 `kami-family.css` 里**没有**它（差异必须在覆盖层）。

## 打印（PRINT）

打印是这个工具最主要的交付路径（生成 HTML → 打印成 PDF → 投递），
有两个坑只在打印时暴露：

**① 纸感底色会丢。** Chrome 打印对话框的「背景图形 / Background graphics」
**默认关闭**，羊皮纸底会变成纯白，整套 Kami 的纸感归零。`kami-layout.css` 加了
`print-color-adjust: exact` 让浏览器尽量保留背景 —— 但这**不是万能药**：
用户仍需在打印对话框里手动勾选「背景图形」。（上游的 `@page { background }`
Chrome 并不支持，写了也是空的。）

**② 分隔线会消失。** 上游 `--border` 与纸底的对比度只有 **1.2–1.4:1**，
屏幕上是"若有若无"，灰度打印时基本看不见，区块划分随之丢失。打印时改用
`color-mix` 从**各主题自己的 `--olive`** 派生一条更深的线，5 套主题都留在自己的色系里：

```css
@media print {
  html:root {
    --border: color-mix(in srgb, var(--olive) 70%, transparent);
  }
}
```

70% 是实测的最小可行值：5 套主题全部 ≥3:1（最低 kami-base 3.15，最高 kami-mono 3.81），
再浅就压不到 3:1。**仅作用于打印**，屏幕上的细腻观感原样保留。用 `html:root` 而非
`:root`，是因为主题页的 `<style>` 在样式表**之后**加载，同特异度下它会赢。
不支持 `color-mix` 的浏览器会忽略整条声明，自动回退到主题原值。

## 字体依赖（重要）

`kami-family.css`（上游逐字节拷贝，冻结）里的 `@font-face` 只有两条来源：
本地 `../fonts/*.ttf`（仓库里刻意没有这个目录）和 jsDelivr CDN。
**开箱状态下只有联网才拿得到仓耳今楷。**

`kami-layout.css` 在后加载，用**同名 + 同字重的 `@font-face`** 整条替换掉 src。
这是可行的：实测同 family + weight + style 时**后者生效**——上游那两条在渲染后
status 始终是 `unloaded`（从未被请求），我方那两条是 `loaded`。
新的 src 顺序是：

```
local(PostScript 名) → 本地相对路径 → CDN → local(裸族名兜底)
```

### 为什么必须写 PostScript 名

实测（macOS + Chrome，2026-09-30）：

| `local()` 实参 | 类型 | 是否命中 |
| --- | --- | --- |
| `PingFang SC` / `Songti SC` / `Hiragino Sans GB` | 族名 | ❌ |
| `PingFangSC-Regular` / `STSong` / `HiraginoSansGB-W3` | PostScript 名 | ✅ |
| `Songti SC Regular` | 全名 | ✅ |

**只写族名会静默失效**，所以第一个 `local()` 必须是 PostScript 名。
而仓耳今楷的 name 表里两个字重**共用同一个排版族名**，只有 id1 / id6 带权重后缀：

| 字段 | W04 | W05 |
| --- | --- | --- |
| id1 legacy family | `TsangerJinKai02 W04` | `TsangerJinKai02 W05` |
| id4 full name | 仅中文 `仓耳今楷02 W04` | 仅中文 `仓耳今楷02 W05` |
| id6 PostScript | `TsangerJinKai02-W04` | `TsangerJinKai02-W05` |
| id16 typo family | `TsangerJinKai02` | `TsangerJinKai02` ← **相同** |

裸族名会命中"该族的默认字面"，对 W05 来说就是**解析错**；加上族名本来就命中不了，
所以它被放到 CDN **之后**：联网时仍取到真正的 W05，断网时才退而求其次拿一个
仓耳字面（字形对、字重偏轻），总好过掉到 `--serif` 换一套字。

### 把字体装到本机

```
skills/resume-copilot/scripts/ensure-fonts.sh          # 检查 + 缺什么下什么 + 注册
skills/resume-copilot/scripts/ensure-fonts.sh --check  # 只看状态，不写盘
skills/resume-copilot/scripts/ensure-fonts.sh --uninstall
```

脚本机制沿用上游 tw93/Kami（`skills/kami/scripts/ensure-fonts.sh`）：

- **下载目标在 skill 目录之外** —— 默认 `${XDG_DATA_HOME:-~/.local/share}/fonts/kami`。
  上游这么设计的原话是 skill ZIP 会剔除大字体、下回 skill 目录会撑爆体积上限；
  对本 skill 同理：`install` 是整目录拷贝、`npm pack` 会带上 `skills/`。
- 官方源 `tsanger.cn` → `cdn.jsdmirror.com` → `cdn.jsdelivr.net` 依次回退。
- 每个候选都要过 **10 MB 体积校验**才会覆盖旧文件 —— 否则一个门户劫持页会被当成字体装上。
- 临时文件带本次运行的 PID，退出时 `trap` 清理：中断不留半包，并发不互相踩。

**一处与上游不同的地方**：上游 Kami 用 WeasyPrint 渲染，走 fontconfig，XDG 字体目录
本来就在它的扫描路径上。本 skill 是渲染成 HTML 由用户在浏览器里打印，而 **macOS 浏览器走
CoreText，不读 XDG 目录**。所以 macOS 上脚本会额外注册到 `~/Library/Fonts`：

| 注册方式 | CoreText 是否认 |
| --- | --- |
| 符号链接 | ❌ 所有 `local()` 探针全 false |
| **硬链接** | ✅ 同 inode、不占双份空间 |
| 复制 | ✅ 但多占 36 MB |

所以脚本用 `ln`（硬链接），失败才退到 `cp`。`--uninstall` 只会删自己建的那两个条目
（按 inode 判定），用户自己放的字体一律不动。

**为什么不把字体放进仓库**：上游两个字体实测 **18.9 MB + 18.9 MB ≈ 37.9 MB**，
本地化会把 npm 包从 376 kB 撑到约 38 MB（**100 倍**）。而且——
**仓耳今楷不是自由字体**：字体内部 name 表写明「无论您以何种方式使用该字体，
您必须事先获得北京仓耳文字技术有限公司的正式书面许可」，上游 Kami 的 README 也写着
"free for personal use only; commercial use requires a license"。**随包分发属于再分发，
在没有书面许可前不能做。** 脚本是「本机自己下载」，不是再分发。

### 打印成 PDF 时会发生什么（2026-09-30 实测）

用无头 Chrome `--print-to-pdf` 实测三种情况，再用 pypdf 读 PDF 的字体表与文字层：

| 情况 | PDF 里嵌入的字体 | PDF 体积 | 关键词能否被提取 |
| --- | --- | --- | --- |
| **联网**（CDN 可达） | `TsangerJinKai02-W04/W05` 子集 | 808 KB | ✅ `张知行` `工具` `调用` `一起` `方向` `工作经历` 全部命中 |
| **拿不到字体**（断网 / CDN 被墙） | 回退 `STSongti-SC` | 353 KB | ❌ **全部 6 个关键词都命中不了** |
| 本地 woff2 子集（验证用） | `TsangerJinKai02-W04/W05` 子集 | 790 KB | ✅ 全部命中 |
| **跑过 `ensure-fonts.sh` 后断网** | 从本机 `local()` 取，同样子集化嵌入 | 与联网版同量级 | ✅ 全部命中 |

**结论一：字体进了 PDF，就不会掉。** 浏览器会把用到的字形**子集化后嵌进 PDF**
（实测 W05 = 285 KB、W04 = 515 KB）。所以 PDF 发给别人、或对方电脑没装这个字体，
显示都正常。

**结论二：拿不到字体时，坏的远不只是字形。** 回退到 macOS 系统宋体后，
PDF 的文字层会把部分汉字映射到**康熙部首码位** —— `行`→`⾏`(U+2F98)、`工`→`⼯`(U+2F00)、
`大`→`⼤`、`用`→`⽤`、`方`→`⽅`、`一`→`⼀`。字形看着一样，但 **Unicode 码位不同**，
于是「张知行」在 PDF 里搜不到。**ATS / 简历解析系统按关键词匹配时会失败** ——
对一个简历工具来说，这比"字距变松"严重得多。

**所以：要么联网打印，要么先跑一次 `scripts/ensure-fonts.sh`。**
后者把字体装到本机，`local()` 立刻生效，之后断网打印也不会掉 —— 而且因为
`local()` 排在 src 最前，装好之后**连联网都不会再请求 CDN**。

如果既不能联网、又不方便装字体（比如在别人机器上临时出一份），
还有一条路：把字体子集化后随 HTML 一起交付 —— 实测
「常用一级字 + 标点 + ASCII」共 4177 字的 **woff2 子集只有 0.99 MB + 1.00 MB = 2.00 MB**
（原体积的 1/18），技术上完全可行，但**必须先解决授权问题**。

需要手工接管 src 时，改的也永远是 `kami-layout.css` 而不是 `kami-family.css`：
上游拷贝必须保持逐字节一致，同名 `@font-face` 在覆盖层重声明即可（后加载的生效）。

## 权威关系：本目录是唯一基准

**`skills/resume-copilot/templates/` 是简历版式的唯一权威来源。** 仓库根目录下的
`.preview/upstream/` 只是**本地只读参照物**，不是模板、不参与渲染，也不进版本库：

| | `skills/resume-copilot/templates/` | `.preview/upstream/` |
| --- | --- | --- |
| 性质 | 本 skill 的产物（模板 + 渲染器 + 样式） | 上游 tw93/Kami 的原件，只读 |
| 谁在用 | 生成简历时实际加载的就是它 | **没有任何代码引用**，只供人工比对 |
| 进 git | 是 | 否（`.preview/` 已在 `.gitignore`，且从未提交过） |
| 冲突时 | **以它为准** | 被参照，不被执行 |

上游原件渲染出来当然是**上游版式**（`alias` 与姓名同行、条目没有三段式标题、
没有 `|` 分标题、没有头像槽位）—— 这些正是本 skill 刻意改掉的地方。
所以两者"看起来不一样"是预期的：`.preview/upstream/` 代表**改之前**的样子，
用来核对 `kami-family.css` 是否仍是上游 `<style>` 的逐字节拷贝（497 行、0 差异）。

`.preview/upstream/` 里的四个文件：

- `.preview/upstream/resume-cn-template.html` —— 上游中文简历模板原件，`kami-family.css` 的来源。
- `.preview/upstream/demo-musk-resume-en.html` —— 上游英文简历示例。
- `.preview/upstream/resume-writing.md` —— 上游的简历写作指南。
- `.preview/upstream/resume.json` —— 上游的简历内容契约。

## Kami family 结构

- `shared/kami-family.css`
  - 上游 Kami resume 模板 `<style>` 块的逐字节拷贝（497 行，0 差异）。
  - 含 `@font-face "TsangerJinKai02"`（仓耳今楷 W04/W05，本地 `../fonts/` 优先、
    jsDelivr CDN 兜底）、`@page { size: A4; margin: 11mm 13mm }` 与全部上游规则。
  - **不要手改**：要改样式就同步上游，否则与 Kami 的一致性立刻丢失。
- `shared/kami-layout.css`
  - 本 skill 的版式微调，**必须在上游样式之后加载**（`T1.8` 强制这个顺序）。
  - 承载五件事：字体 `local()` 兜底、页头 2×2 栅格 + 可选头像、条目标题三段对齐、
    纸纹、打印规则。
  - 字体那部分靠「同名同字重 `@font-face` 后者覆盖」接管上游 src，是唯一一处
    触碰字体声明的文件；`T4.20` 守住 `local()` 排第一且上游两条来源不被删。
- `shared/common.css`
  - **只服务 `./index.html`（总览页）**，简历页一个都不加载它。
  - 2026-09-30 审查删掉了里面 **0 引用**的历史残留：`.resume-page` / `.item-title-row` /
    `.bullet-list` / `.tag-list`，以及 14 个页面级变量（`--page-*` / `--text-*` /
    `--paper*` / `--accent-*`）。`.section-title` 也曾与 `kami-family.css` 重复
    （真正生效的是后者）。现在只剩 `box-sizing` 重置与总览页的字体栈。`T1.13` 防止复活。
- `shared/kami-render.js`
  - 唯一的 HTML 骨架来源：把 Resume View 槽位映射到 Kami 的 DOM。
  - 改它即可同步影响 5 个主题页。
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
- 4 个主题（**只覆盖颜色变量，不维护独立结构**）+ `kami-base` 上游原色：
  - `./kami-mono.html`（极简黑白）、`./kami-navy.html`（冷调商务）
  - `./kami-copper.html`（暖调工匠）、`./kami-seal.html`（朱砂印）

**这 5 套是同一套版式的 5 种配色，不是 5 种不同的设计** —— 早期有过 10 套，
实测它们的 `--brand` 明度全部落在 16%–39%、饱和度 0%–67%，都是"深色 + 中低饱和"的
安全色，差别小到撑不起"10 种设计"的说法，所以收敛成 4 套差异真正可感知的 + 1 套上游原色。
`index.html` 每张卡片都标出了该主题的实际纸色与强调色（以及 S/L 数值），
就是为了让这一点一眼可见 —— 不要用"适合长期主义""强调叙述张力"这类
脱离颜色的说辞去描述它们，那是在替色相编故事。

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

- 主题选择入口：`./index.html`（由生成脚本写入，卡片指向下面这批成品页）
- 成品主题页：`./resume-base.html`、`./resume-mono.html`、`./resume-navy.html`、
  `./resume-copper.html`、`./resume-seal.html`
  —— 每页内嵌**真实**简历数据，只换配色；左上角有头像控件（打印时隐藏）
- 样例总览（旧）：`./index.sample.html`（生成脚本覆盖 `index.html` 前的自动备份）
- 单主题样例页：直接打开 `./kami-*.html`，用右上角开关切换有无头像
- 带头像入口：`./avatar-demo.html`（默认已打开头像，也可关掉对比）

## 成品生成脚本

`scripts/build-resume.mjs` 把 Resume View JSON 直接编译成上面的成品页，
使用方**不需要自己组装拼接**。默认 `gallery` 模式就是「入口页 + 每主题一份」：

```bash
node scripts/build-resume.mjs --data resume-view.json        # gallery（默认）
node scripts/build-resume.mjs --data resume-view.json --mode portal
node scripts/build-resume.mjs --data resume-view.json --theme kami-navy --out 我的简历.html
```

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

头像**不在对话里反问**，而是在成品页里选：每个成品页左上角都有
`选择头像` / `移除头像` 控件，选一张本地照片就切成「文字块在左 + 头像在右」的版式，
移除就回到标准页头；控件 `@media print` 隐藏，不会进 PDF。
用户若直接给了图片路径 / URL，写进 `header.avatar` 即可，生成时直接是头像版式。

## 用户主题选择

Resume Copilot 对用户暴露 `kami-default` 作为默认主题名。当前解析关系：

```text
kami-default -> kami-base.html
```

另外 4 个主题保持原有 ID（`kami-mono` / `kami-navy` / `kami-copper` / `kami-seal`）。主题选择属于 Render Options，不属于 Resume Strategy；
用户不选择时必须回退到 `kami-default`。
