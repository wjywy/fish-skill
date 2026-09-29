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

默认用户可见输出使用简洁 Markdown，每个参考答案固定两部分：

```text
# 一条简历描述的核心主题
## 面试问题
第一部分：一段话的逻辑与项目场景
**原理详解**
第二部分：展开的通用原理
## 递归追问
第一部分：一段话的逻辑与项目场景
**原理详解**
第二部分：展开的通用原理
```

第一部分保持简洁（一段话，给结论、机制主线和项目落点）；第二部分 `**原理详解**` 承担详细度，展开原理、机制、边界与取舍。

Claim、证据路径、项目 Grounding 状态、Node Type、depth、停止条件等仅用于内部推理，除非用户明确要求，否则不得输出。递归知识树可以在内部保持树结构，但最终 Markdown 默认按一级主题下的二级问题扁平展示。

### Mock Interview（可选）

只有用户明确要求“你来面试我 / 我自己回答 / 不要先给答案”时启用：

```text
Question → User Answer → Assessment → Follow-up
```

只有该模式评估 `WEAK / PARTIAL / DEFENSIBLE / NOT_OWNED / INCORRECT`。

## Renderer

Renderer 只负责展示。Kami 规则见 `renderers/kami/README.md`。

默认主题 `kami-default`；用户未指定主题时不得阻塞生成。

**生成前必须先问一句：要不要个人头像。** 头像对应两套页头版式 —— `header.avatar`
有值时为「头像在左 + 文字块在右」，留空则为标准页头。这是版式差异而非文案差异，
不能替用户默认。

字段写法与版式强相关（页头教育信息只到年份、项目地址写 `entry.link`、技术栈不渲染等），
见 `workflows/resume-generation.md` 的「字段口径」一节。

### Interview expansion cardinality

在 Interview Knowledge 中，一个 Generated Answer 可以产生多个高价值 Follow-up Nodes。必须提取并保留所有有价值的 sibling；默认一次只执行其中一个，当前分支耗尽后再返回其余 sibling。不要把“one-at-a-time execution”误解为“one-answer-one-question”。
