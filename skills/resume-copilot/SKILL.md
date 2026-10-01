---
name: "resume-copilot"
description: "Builds defensible resumes from verified career facts through experience mining, claim verification, resume strategy, rendering, and deep interview preparation."
---

# Resume Copilot

Resume Copilot 将原始职业材料与当前代码仓库转成可追溯的职业事实，再按目标岗位生成简历，并从已验证 Claim 派生 Answer-driven 的深度面试知识链。

## 全局原则

1. **Target direction before final wording.** 生成正式 Resume Bullet / Resume View 前必须明确 Target Role / Target Direction；资料解析、仓库检查和 Fact 抽取不受此 Gate 阻塞。
2. **Source → Fact → Claim → Wording.** 原始材料先形成 Fact；正式简历表述只能来自已验证 Claim / Metric。
3. **Repository evidence is project evidence, not ownership evidence.** 仓库能证明项目能力，不能自动证明用户本人实现该能力。
4. **Never silently upgrade ownership.** 不把参与 / 协作 / 了解静默升级成负责 / 主导 / 设计。
5. **Metrics need provenance.** 数字必须有来源、口径和确认状态，不自动估算。
6. **Draft early, verify continuously.** 方向明确且已有足够事实时可以先给 provisional draft，但 Draft 不是事实源。
7. **Career Profile is the source of truth.** Markdown、HTML、PDF 都是输出视图，不反向成为职业事实。
8. **High-information bullets, not duty statements.** 正式 Bullet 优先表达动作、对象、机制、约束与结果。
9. **No standalone summary.** 简历省略独立个人简介 / summary；页头后直接进入专业技能、经历等内容。

## 架构与 Source of Truth

不同层只负责一种职责，避免同一规则在多个文件重复维护。

| 层 | 职责 | 不负责 |
| --- | --- | --- |
| `SKILL.md` | 路由、全局不变量、跨 Workflow 边界 | 具体执行算法、Renderer 细节 |
| `workflows/` | 某项任务按什么顺序执行、何时交接 | 重复定义 Policy 的判定规则 |
| `policies/` | 证据、写作、知识扩展、深度、展示等决策规则 | 任务编排、示例事实 |
| `schemas/` | 内部数据结构与机器可校验契约 | 写作风格与推理流程 |
| `examples/` | 展示规则如何落地 | 新增硬规则；示例永远不能覆盖 Policy |
| `renderers/` / `scripts/` / `templates/` | HTML/PDF 的视觉与构建实现 | 决定简历写什么 |

发生歧义时：用户明确要求优先；全局原则不可被下层静默覆盖；执行顺序看当前 Workflow；判定语义看对应 Policy；Schema 只约束结构；Example 仅用于示范。

## 能力与路由

- 原始输入接入：`workflows/input-intake.md`
- 当前仓库分析：`workflows/repository-inspection.md`
- 快速候选成稿：`workflows/resume-bootstrap.md`
- 经历验证与补全：`workflows/experience-mining.md`
- Resume Strategy：`workflows/resume-strategy.md`
- 正式简历生成：`workflows/resume-generation.md`
- 默认面试知识链：`workflows/interview-knowledge.md`
- 用户主动模拟面试：`workflows/mock-interview.md`

### Workflow 边界

```text
Raw Input
  ↓
Input Intake
  ↓
Fact / Repository Fact
  ↓
Bootstrap（可选：快速给可讨论 Draft）
  ↓
Experience Mining（验证 Ownership / Action / Result）
  ↓
Career Profile
  ↓
Resume Strategy（决定写什么）
  ↓
Resume Generation（决定怎么写成 Resume View）
  ↓
Renderer（决定长什么样）
```

- **Bootstrap 与 Mining 不互相替代。** Bootstrap 优先让用户早看到候选表达；Mining 负责把材料提升为可写入 Career Profile 的已验证事实。
- **Strategy 与 Generation 不互相替代。** Strategy 选 Claim 和内容预算；Generation 只能表达已选内容。
- **Generation 与 Renderer 不互相替代。** Generation 产出 Resume View；主题、头像交互、字体、打印与 HTML 构建细节由 Renderer / scripts 维护。

## 按需加载规则

不要启动时一次性读取全部文件。

```text
SKILL.md
  ↓
选择一个 Workflow
  ↓
读取该 Workflow 的 Required References
  ↓
执行
```

若工作区存在项目记忆、历史输出或约定文件，应在相关任务开始时优先复用；**不存在时不得阻塞流程，也不得假设固定存在 `.workbuddy-ai/memory/` 等某个平台专属目录。**

## Target Direction Gate

当用户目标是生成、改写或定向优化简历时：

1. 已知 Target Role / Target Direction → 继续。
2. 未知 → 在生成正式 Resume Bullet / Resume View 前询问一次。
3. 不得仅根据 React、Go、LangGraph、Redis 等技术词猜目标方向。
4. JD 可选；只有岗位方向也可以进入 Bootstrap / Strategy。

目标方向未知时仍可做资料解析、Repository Inspection、Fact 抽取和缺口整理。

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

## Resume Ready

Experience Mining 判断某段经历是否可进入 Strategy / Generation。典型条件：

- Target Role 已知（当目标是生成简历时）；
- Context / Problem 明确；
- Ownership 明确；
- 至少一个具体 Action；
- 至少一个具体 Mechanism；
- 至少一个可验证 Claim；
- Result 已知，或明确暂无可靠量化结果。

不要为了准备所有潜在面试追问而延长 Resume Mining；技术递归属于 Interview Knowledge。

## 硬性执行约束（Interview Knowledge，不可跳过）

Interview Knowledge 的执行算法以 `workflows/interview-knowledge.md` 为入口，并分别读取：

- `policies/interview-depth-policy.md`：当前题讲什么、讲多深、讲到哪里停，以及递归边界；
- `policies/answer-presentation-policy.md`：完整答案怎么组织成用户可见结构；
- `policies/knowledge-expansion-policy.md`：下一问从哪些 Candidate Nodes 产生、如何评估和调度。

这里仅保留全局不变量：

1. **Answer-driven, not outline-driven.** 不先生成完整题纲再补答案；先生成当前 Question 的完整 Generated Reference Answer，再从答案提取下一层节点。
2. **Deep Study per question.** 每一个被物化的 Question 都必须按 DEEP_STUDY 标准完整回答；问题数量、文档长度或尚未执行的候选节点都不能成为降低当前答案深度的理由。
3. **Complete the question, not the whole neighborhood.** 当前答案必须独立完整，但非必要的高价值相邻知识应保留给后续 Follow-up，不因“越详细越好”而提前穷尽。
4. **Backbone before detail.** 展开大量细节前先找到当前问题最小、最有解释力的主轴；Backbone 是内部规划，不是新的固定可见模板。
5. **Depth before breadth.** 当前分支仍有高价值 `UNEXPANDED` 节点时，不横跳到新的 Root Theme。
6. **No silent sibling loss.** 一个 Answer 可以产生多个高价值 sibling；未被本轮选择的节点必须保留。
7. **Role-bounded depth.** 停止依据是岗位相关性与信息增益，不是固定层数或固定题型。
8. **Adaptive presentation.** 内部知识结构与用户可见结构分离；Question Dimension 不等于 Markdown Template，最终呈现由 Answer Presentation Policy 选择 Explanation Shape。
9. **Output hygiene.** 内部 Knowledge Graph、Grounding、Backbone、Explanation Shape、队列和调度信息默认不暴露给用户。
10. **Execution claims need execution evidence.** 只有本轮实际执行工具/命令并获得结果，才可以写“我运行了 / 当前通过 / 实测成功”；静态测试代码、README 或历史报告不能冒充本轮运行结果。

预检查时，如果工作区存在历史面试文档或用户反馈则读取并对齐；不存在时继续执行，不把环境专属文件当硬依赖。

### Interview expansion cardinality

```text
1 complete Generated Answer
  ↓
0..N valuable Candidate Nodes
  ↓
保留所有高价值 UNEXPANDED siblings
  ↓
默认一次执行 1 个
  ↓
当前深分支耗尽后返回其余 sibling
```

具体节点提取、覆盖判定、Expansion Queue / Root Queue 与 Sibling Transition Gate 只在 `policies/knowledge-expansion-policy.md` 定义，其他文件不得复制一套不同算法。

## Interview 输出模式

### Interview Knowledge（默认）

内部链路：

```text
Claim
→ Question
→ Deep Generated Reference Answer
→ Answer Completeness Gate
→ Candidate Node Expansion + Answer Presentation
→ Follow-up Q&A
```

Interview Knowledge **默认就是完整问答模式**，不存在为了覆盖题量而降低答案深度的 QUESTION_BANK 模式。每个 Question 一旦被物化，就必须生成并展示完整参考答案；下一 Question 只能在当前答案通过 Completeness Gate 后，由当前 Answer 的高价值未覆盖节点驱动产生。

内部 `Generated Answer` 当前仍保留 `overview` 与 `principleDetail` 两个存储字段，用于保证核心结论和机制展开都不缺失；它们是内部知识槽位，不是用户可见 Markdown 栏目：

- `overview`：当前问题的核心结论与必要项目落点。
- `principleDetail`：机制、Why Layer、可推演例子、边界、取舍与必要抽象。

当前答案先由 Depth Policy 完成 Explanation Backbone、Necessary-for-Conclusion Test 与 Answer Completeness；之后 Expansion 和 Presentation 从同一个 complete Answer 分叉：

```text
complete internal Answer
├─ Knowledge Expansion → Candidate Nodes / next Question
└─ Answer Presentation → Explanation Shape / natural Markdown
```

**Node Extraction 不从渲染后的 Markdown 反推；Presentation 也不得通过删内容或补无关知识改变 Answer Depth。**

`Generated Reference Answer != User Answer`；系统生成内容不代表用户已经掌握，也不自动成为 Career Claim。

### Mock Interview

只有用户要求模拟面试、逐题作答或评估回答时，进入 `workflows/mock-interview.md`。Mock Interview 评估的是用户答案，不把系统 Generated Answer 当作用户掌握证明。

## 核心 Policy

- Bootstrap 边界：`policies/bootstrap-generation-policy.md`
- 证据与 Ownership / Execution Evidence：`policies/evidence-policy.md`
- Repository 证据边界：`policies/repository-evidence-policy.md`
- Metric：`policies/metric-policy.md`
- Resume Bullet 写作：`policies/resume-writing-policy.md`
- 面试答案深度、Explanation Backbone、Deep Study Boundary 与递归边界：`policies/interview-depth-policy.md`
- 面试答案 Explanation Shape 与用户可见呈现：`policies/answer-presentation-policy.md`
- 面试节点扩展与调度：`policies/knowledge-expansion-policy.md`
- Mock Interview 回答评估：`policies/answer-assessment-policy.md`

## Examples

- Repository 模式：`examples/repository-project-mode.example.md`
- Resume Bullet：`examples/resume-bullet-patterns.md`
- Resume Strategy：`examples/resume-strategy.example.json`
- Career Profile：`examples/career-profile.example.json`
- Claim Graph：`examples/claim-graph.example.json`
- 面试扩展：`examples/interview-expansion-examples.md`
- 面试答案：`examples/interview-answer-examples.md`

Examples 只示范，不承载硬规则，不得作为用户项目事实来源。

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

## Rendering Handoff

Resume Generation 只产出符合 Resume View Schema 的内容模型；视觉与构建细节读取 `renderers/kami/README.md` 与相关 scripts/templates。

默认 Renderer 为 `kami`，默认主题 ID 为 `kami-default`。具体映射（当前指向 `templates/kami-base.html`）、主题数量、头像控件、字体与 PDF 打印要求只在 Renderer / template 文档维护，避免在多个 Workflow 重复定义。