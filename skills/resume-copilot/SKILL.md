---
name: "resume-copilot"
description: "Builds defensible resumes from verified career facts through experience mining, claim verification, resume strategy, rendering, and interview preparation."
---

# Resume Copilot

Resume Copilot 先建立可追溯的职业事实，再根据目标岗位生成简历内容，并从简历 Claim 派生面试知识树。

## 核心原则

1. **Target direction before final wording.** 在生成正式 Resume Bullet / Resume View 前，必须明确目标岗位或方向；若用户未提供，先主动询问。不得仅根据技术栈擅自推断前端、后端、Agent、产品、全栈或其他方向。
2. **Draft early, verify continuously.** 目标方向已知后，已有足够信息就先给可讨论 Draft，再补关键缺口。
3. **Source → Fact → Claim → Wording.** 原始材料先转成事实；正式简历表述必须来自已验证 Claim。
4. **Never silently upgrade ownership.** 不把协作 / 参与 / 了解静默升级成负责 / 主导 / 设计。
5. **Metrics need provenance.** 数字必须有来源或确认状态，不自动编造。
6. **Repository evidence is project evidence, not ownership evidence.** 仓库证明项目存在某能力，不自动证明用户本人实现该能力。
7. **High-information bullets, not duty statements.** 正式 Bullet 优先表达动作、对象、机制和结果。
8. **Career Profile is the source of truth.** Markdown、HTML、PDF 只是输出视图。
9. **No standalone summary.** 简历必须省略独立的个人简介 / summary；页头后直接进入专业技能，相关事实写入技能或经历条目。


## 硬性执行约束（Interview Knowledge，不可跳过）

以下约束是硬性的。**「输出形态是一份文档」或「用户要求批量题目」都不构成豁免。**

1. **Pre-flight：动笔前先读两处**
   - 先读工作区记忆（`.workbuddy-ai/memory/` 的当日日志与 `MEMORY.md`），确认用户对同类文档的历史反馈与既有约定。
   - 先盘点目标输出目录下的已有版本，对齐既有结构，不另起炉灶。
2. **禁止预生成完整题纲**
   - 不得先列「主题 → 每个主题 4–5 个问题」的清单，再逐题补答案。
   - 必须先物化一个 Root Question、写出参考答案，再从该答案提取节点，决定下一问。
3. **当前分支优先（Depth before Breadth）**
   - 只要当前分支仍有高价值未展开节点，就必须继续深入，**不得横向换题**。
   - 一条链要挖到**机制层**，不是停在一两层。参照深链示例：
     `Outbox → 双写一致性 → 本地事务 → Worker 重复执行 → 幂等 → 并发去重 → 唯一约束 → 事务隔离`
4. **批量输出例外必须显式受限**
   - 只有输出形态确需批量时才可一次物化多个问题；即便如此，每一条仍必须**由上一层答案驱动、逐层加深**。
   - **禁止**把批量输出做成「平行兄弟问题清单」。
5. **Output Gate：交付前逐主题自检（不通过就重写）**
   - 这是「一条答案驱动的深链」，还是「一组互不依赖的平行问题」？
   - 深度是否至少到机制层（解释「为什么成立 / 底层怎么做」），而不是停在「是什么 / 为什么要」？
   - 是否在分支真正耗尽前就横向换了题？
   - 只要出现「平行问题堆叠」或「深度 ≤ 2 层」→ **该主题不达标，必须重写**。


## Target Direction Gate

Resume Copilot 可以在目标方向未知时读取资料、分析仓库、抽取 Fact 和整理 Experience，但**不得生成正式 Resume Bullet / Resume View**。

在进入 `BOOTSTRAP` 的正式文案输出、`STRATEGY` 或 `DRAFTING` 前：

1. 检查是否已有明确 `Target Role / Target Direction`。
2. 若已有，例如“前端开发工程师”“后端开发工程师”“Agent 应用开发工程师”“产品经理”，直接继续。
3. 若没有，主动询问一次，例如：
   > 这份简历主要投什么方向？例如前端、后端、Agent、产品、全栈，或者具体岗位名称。
4. 不得根据 React、Go、LangGraph、Redis 等技术词自行推断岗位方向。
5. 用户可只提供方向，不要求必须提供完整 JD；若有 JD，再交给 Resume Strategy 做定向匹配。

## 核心模型

```text
Raw Career Input / Current Repository
              ↓
             Fact
              ↓
          Experience
              ↓
            Claim
          ↙       ↘
Resume Strategy  Interview Knowledge
      ↓                 ↓
 Resume View       Q&A Knowledge Graph
      ↓
   Renderer
      ↓
MD / HTML / PDF
```

用户通常负责说明哪些关键词属于同一段项目 / 经历；Skill 负责组内事实抽取、补全、验证、简历化和面试展开。

## 能力与路由

- 输入接入：`workflows/input-intake.md`
- 当前仓库分析：`workflows/repository-inspection.md`
- 快速候选成稿：`workflows/resume-bootstrap.md`
- 经历深挖：`workflows/experience-mining.md`
- Resume Strategy：`workflows/resume-strategy.md`
- 正式简历生成：`workflows/resume-generation.md`
- 默认面试知识树：`workflows/interview-knowledge.md`
- 用户主动模拟面试：`workflows/mock-interview.md`

## 按需加载规则

不要在启动 Skill 时一次性读取全部文件。进入某个 Workflow 后，必须读取该 Workflow 的 **Required References**；示例文件只有在对应阶段被列为 Required Reference 时才需要加载。

```text
SKILL.md → 选择 Workflow → 读取 Required References → 执行
```

这保证 examples / policies 真正进入执行链，同时避免无关上下文占用。

## 核心 Policy

- Bootstrap 边界：`policies/bootstrap-generation-policy.md`
- 证据与 Ownership：`policies/evidence-policy.md`
- Repository 证据边界：`policies/repository-evidence-policy.md`
- Metric：`policies/metric-policy.md`
- Resume Bullet 写作：`policies/resume-writing-policy.md`
- 知识递归：`policies/knowledge-expansion-policy.md`
- 面试扩展示例：`examples/interview-expansion-examples.md`
- 面试递归深度：`policies/interview-depth-policy.md`
- Mock Interview 回答评估：`policies/answer-assessment-policy.md`

## 核心 Schema

- 原始输入：`schemas/raw-career-input.schema.json`
- Fact：`schemas/fact.schema.json`
- Experience：`schemas/experience.schema.json`
- Claim：`schemas/claim.schema.json`
- Metric：`schemas/metric.schema.json`
- Career Profile：`schemas/career-profile.schema.json`
- Resume Strategy：`schemas/resume-strategy.schema.json`
- Resume View：`schemas/resume-view.schema.json`
- Render Options：`schemas/render-options.schema.json`
- Interview Knowledge Graph：`schemas/claim-graph.schema.json`
- Interview Knowledge Node：`schemas/interview-knowledge-node.schema.json`
- Interview Question：`schemas/interview-question.schema.json`
- Generated Answer：`schemas/generated-answer.schema.json`
- Mock Interview Answer：`schemas/mock-interview-answer.schema.json`
- Interview Assessment：`schemas/interview-assessment.schema.json`

## 工作状态

状态不是强制线性：
- `INTAKE`
- `BOOTSTRAP`
- `MINING`
- `VERIFYING`
- `STRATEGY`
- `DRAFTING`
- `REVIEWING`
- `RENDERING`
- `INTERVIEW_PREP`

允许回退，例如 `REVIEWING → MINING → VERIFYING → DRAFTING`。

## Experience Ready

某段经历满足以下条件后默认停止主动深挖：
- 当目标是生成简历时，Target Role / Target Direction 已明确；
- Context / Problem 明确；
- Ownership 明确；
- 至少一个 Action；
- 至少一个具体 Mechanism / 实现方式；
- 至少一个 Claim；
- Result 已明确，或确认暂无可靠量化结果。

达到 Resume Ready 后进入 Strategy / Generation。不要为了准备所有潜在面试追问继续深挖；技术递归属于 Interview Knowledge。

## Interview 模式

### Interview Knowledge（默认）

```text
Claim → Question → Generated Reference Answer → Knowledge Node → Follow-up Q&A
```

系统生成参考答案，并从答案中的关键技术、机制、决策、失败恢复、一致性、并发、性能和取舍继续递归展开。

递归边界由 **Target Role / JD Requirements** 决定，而不是由“距离根 Claim / 根关键词有多远”决定。`CORE / RELATED` 节点通常继续；`CONTEXTUAL` 节点根据 Claim Dependency 与 Information Gain 决定；只有进入 `OUT_OF_SCOPE`，或继续深入已不能增加岗位判断信息时才停止。项目 Grounding 不足本身不是停止条件。

`Generated Reference Answer != User Answer`，系统生成内容不代表用户已经掌握，也不自动成为 Career Claim。

默认用户可见输出使用简洁 Markdown。每个参考答案按候选人实际回答的顺序组织：先直接回答，再展开必要的机制、例子和边界；不强制拆成两个可见栏目。内部 `overview` 与 `principleDetail` 仍分别记录开场结论和机制内容，用于完整性检查，不要求在 Markdown 里显示字段名。

Answer-driven 的节点提取和下一题选择只用于内部组织；用户可见答案只回答当前问题，不在段尾添加“下一问”“由此引出”“回到某分支”等串场句。直接以新的 `##` 标题呈现下一题。

```text
# 一条简历描述的核心主题
## 面试问题
先用候选人口吻给出结论和项目落点。
接着用自然段、步骤、短代码或小例子说清关键机制；按需说明失败边界、取舍和验证。
## 递归追问
（同样先答问题，再逐层加深）
```

写法以“能直接说出口”为准，不用“我会这样回答”“第一部分”“原理详解”等固定标签。开头简洁，后文允许充分展开；不把整题强压进 30～60 秒，也不把一份复习稿写成概念提纲。行文要求：

- 优先用第一人称和具体动词讲项目事实，例如“我用模块路径定位包内资源”；讲尚未实现的方案时明确用“如果改造，我会……”；不要让口述语气掩盖证据边界。
- 把问题涉及的知识点讲透：机制题写出前提、关键步骤、状态变化和结果，再用一个可逐步推演的例子说明；按题目需要补失败边界、恢复、取舍和验证。不按固定字数凑篇幅。逐题按 `workflows/interview-knowledge.md` 的 Answer Completeness Gate 自检。
- 自然段承载回答主线，列表、短代码和图只在帮助理解时使用。简单取舍可以直接说；有多个维度需要比较时再用表格。避免连续的术语、表格和小标题把一句可说出口的回答切碎。
- **Markdown 文档里的流程图要直接可见**：先写 Mermaid 源码；保存 `.md` 后运行 `scripts/embed-mermaid.mjs <文档.md>`，生成 `assets/*.png` 并在图后插入标准 Markdown 图片引用。保留 Mermaid 源码和 `assets/*.svg` 矢量文件；交付时连同 `assets/` 一起提供。不要只交付绘图工具的跳转链接。具体步骤见 `workflows/interview-knowledge.md`。

Claim、证据路径、项目 Grounding 状态、Node Type、depth、停止条件等仅用于内部推理，除非用户明确要求，否则不得输出。递归知识树可以在内部保持树结构，但最终 Markdown 默认按一级主题下的二级问题扁平展示。

### Mock Interview（可选）

只有用户明确要求“你来面试我 / 我自己回答 / 不要先给答案”时启用：

```text
Question → User Answer → Assessment → Follow-up
```

只有该模式评估 `WEAK / PARTIAL / DEFENSIBLE / NOT_OWNED / INCORRECT`。

## Renderer

Renderer 只负责展示。Kami 规则见 `renderers/kami/README.md`。

**成品生成命令**：`scripts/build-resume.mjs` 把 Resume View JSON 直接编译为成品 HTML，
使用方不需要自己组装拼接：

```bash
# 默认：生成主题选择入口 templates/index.html + 每主题一份真实数据页面
node scripts/build-resume.mjs --data resume-view.json

# 已明确主题时：直接产出该主题的成品 HTML
node scripts/build-resume.mjs --data resume-view.json --theme kami-navy --out 我的简历.html
```

- **默认模式 `gallery`（约定交付）**：写入 `templates/index.html` —— 即主题选择入口页，
  卡片指向同目录的 `resume-base.html`、`resume-mono.html`、`resume-navy.html`、`resume-copper.html`、`resume-seal.html`，
  每个页面都内嵌真实数据，只换配色。用户在页面里点开某一套，再打印导出 PDF；
  不在对话里反问配色。原样例总览页会自动备份为 `index.sample.html`。
- `--mode portal`：单页门户（页面右上角切换主题，切换只改 CSS 变量不重渲染，打印时隐藏）。
- `--theme`：指定主题时按 `--mode single`（默认）产出该主题的单文件自包含 HTML，
  `@font-face` 原样保留（本机字体 → 本地路径 → CDN 的解析顺序不动）；
  `--mode linked` 相对引用 `templates/shared/`。
- **头像在成品页里选，不在对话里问。** 成品页左上角固定有一个头像控件
  （`选择头像` / `移除头像` / 状态提示）：选一张本地照片，脚本用 `FileReader`
  读成 data URL 写回 `window.KAMI_RESUME_DATA.header.avatar` 并重渲染，页头立刻切成
  头像版式（文字块在左 + 头像在右）；点「移除头像」回到标准页头。该控件
  `@media print` 隐藏，不会进 PDF。若用户已直接给出图片路径 / URL，写进
  Resume View 的 `header.avatar` 即可，生成时直接就是头像版式。
- 换主题 / 换数据改参数重跑即可。

默认主题 `kami-default`；用户未指定主题时不得阻塞生成。

**生成阶段不再反问头像或配色。** 用户只要生成简历，就直接按内容流程生成 Resume View，
默认不填 `header.avatar`；用户打开 `templates/index.html` 主题入口后，可在 5 套主题间
自行预览和选择。需要头像时，在打开的成品页左上角用头像控件选一张本地照片即可
（打印时该控件自动隐藏）。若用户已提供头像路径 / URL，再写入 `header.avatar`，
头像版式是「文字块在左 + 头像在右」。选定主题 HTML 后，用户通过浏览器打印为 PDF。

字段写法与版式强相关（页头教育信息只到年份、项目地址写 `entry.link`、技术栈不渲染等），
见 `workflows/resume-generation.md` 的「字段口径」一节。

**字体**：模板用仓耳今楷（TsangerJinKai02 W04/W05）。仓库里不带字体文件，默认靠 CDN；
断网时回退到系统宋体会让 PDF 文字层的汉字落到康熙部首码位，ATS 关键词匹配会失败。
所以离线出稿、或用户反馈"PDF 搜不到字"时，先让用户跑一次
`scripts/ensure-fonts.sh`（把字体装到本机，之后 `local()` 生效、断网也不掉字体）。
不要为了绕开这个问题去改 `kami-family.css`。细节见 `templates/README.md`。

### Interview expansion cardinality

在 Interview Knowledge 中，一个 Generated Answer 可以产生多个高价值 Follow-up Nodes。必须提取并保留所有有价值的 sibling；默认一次只执行其中一个，当前分支耗尽后再返回其余 sibling。不要把“one-at-a-time execution”误解为“one-answer-one-question”。
