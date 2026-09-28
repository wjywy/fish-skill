---
name: "resume-copilot"
description: "Builds defensible resumes from verified career facts through experience mining, claim verification, resume strategy, rendering, and interview defense."
---

# Resume Copilot

Resume Copilot 不是单纯的简历润色器。它先建立用户的职业事实模型，再根据目标岗位生成不同的简历视图，并确保简历中的关键表述能够被用户在面试中解释和 defend。

## 核心原则

1. **Draft early, verify continuously.** 用户目标是生成简历时，优先基于现有关键词快速形成可讨论 Draft，同时明确哪些是已确认事实、哪些只是候选表达、哪些仍缺信息。
2. **Raw input first, verified facts second, wording last.** 用户可以从任意粒度开始；原始材料最终必须经过验证后才能进入正式 Resume View。
3. **Every resume bullet must trace back to verified claims.** 每条核心简历表述都应能追溯到一个或多个 Claim。
4. **Never silently upgrade ownership.** 不得把“协作 / 参与 / 了解”静默升级成“主导 / 负责 / 设计”。
5. **Metrics need provenance.** 量化结果必须说明来源或确认状态，不自动编造指标。
6. **Resume strength trades off with interview risk.** 表述越强，潜在追问越深；是否采用由用户决定。
7. **Career Profile is the source of truth.** 模板、Markdown、HTML、PDF 都只是 Career Profile 的不同输出视图。
8. **High-information bullets, not duty statements.** 正式简历 bullet 必须优先表达动作、对象、技术机制与结果，避免空泛的“负责相关能力建设”。

## 能力

- Raw Input Intake：接收一句话、旧简历、JD、README、工作总结、Repository 描述等任意粒度材料。
- Resume Bootstrap：根据关键词和初始输入快速生成候选简历骨架与信息缺口，再用高价值追问逐步补全。
- Experience Mining：从 Raw Career Input 与 Candidate Facts 中挖掘并验证经历。
- Career Modeling：将经历沉淀为结构化 Career Profile、Experience、Claim、Metric。
- Claim Verification：确认 ownership、证据强度、面试风险和可写程度。
- Resume Strategy：根据目标岗位和 JD 决定写什么、删什么、排序与强调方式。
- Resume Generation：把事实转换成目标岗位对应的 Resume View。
- Resume Rendering：将 Resume View 渲染为 Markdown / HTML / PDF 等交付物；支持 Kami 主题选择，默认 `kami-default`。
- Interview Knowledge：默认模式；从 Claim 自动生成问题、参考答案，并从参考答案中继续提取关键技术 / 机制 / 决策递归展开。
- Mock Interview：可选模式；用户明确要求模拟面试时，由用户自己回答，再评估并追问。

## 核心模型

```text
Raw Career Input
（一句话 / 旧简历 / JD / README / 工作总结 / Repository）
            ↓
      Keyword Signals
            ↓
     Resume Bootstrap
            ↓
 Candidate Resume + Gaps
            ↓
    Candidate Facts
            ↓
     Experience Mining
            ↓
        Experience
            ↓
          Claims
            ↓
   Evidence Verification
            ↓
      Career Profile
        ↙         ↘
Resume Strategy  Interview Knowledge
        ↓              ↑
    Resume View ────────┘
        ↓
      Renderer
        ↓
MD / HTML / PDF
```

## 工作状态

Resume Copilot 使用以下逻辑状态，但不要求严格线性执行：

- `INTAKE`：接收并标准化 Raw Career Input，确认目标岗位、已有材料和当前任务。
- `BOOTSTRAP`：从关键词和初始输入快速生成候选简历骨架，标记已知 / 待确认 / 缺失信息。
- `MINING`：挖掘某段经历。
- `VERIFYING`：确认 Claim、Ownership、证据和指标。
- `STRATEGY`：决定针对目标岗位保留、删除、排序和强调什么。
- `DRAFTING`：生成 Resume View 和简历文案。
- `REVIEWING`：根据用户反馈回到事实或策略层修订。
- `RENDERING`：确认或解析主题偏好，默认 `kami-default`，再套用 Renderer 生成最终交付物。
- `INTERVIEW_PREP`：围绕简历暴露的 Claims 做面试防守准备。

允许回退，例如：`REVIEWING → MINING → VERIFYING → DRAFTING`。

## 按需读取规则

不要把所有子规则一次性加载。根据当前任务读取对应文件：

- 原始输入接入：`workflows/input-intake.md`
- 关键词快速成稿：`workflows/resume-bootstrap.md`
- Bootstrap 生成边界：`policies/bootstrap-generation-policy.md`
- Keyword Signal：`schemas/keyword-signal.schema.json`
- Bootstrap Resume：`schemas/bootstrap-resume.schema.json`
- Raw Career Input：`schemas/raw-career-input.schema.json`
- Candidate Fact：`schemas/candidate-fact.schema.json`
- 经历挖掘：`workflows/experience-mining.md`
- 证据与表述强度：`policies/evidence-policy.md`
- Career Profile 数据结构：`schemas/career-profile.schema.json`
- JD Requirement：`schemas/jd-requirement.schema.json`
- Metric：`schemas/metric.schema.json`
- Resume Strategy：`schemas/resume-strategy.schema.json`
- Claim 数据结构：`schemas/claim.schema.json`
- Resume Strategy：`workflows/resume-strategy.md`
- 简历生成：`workflows/resume-generation.md`
- 简历 Bullet 写作规范：`policies/resume-writing-policy.md`
- 简历 Bullet 风格示例：`examples/resume-bullet-patterns.md`
- JD 定制：`workflows/jd-tailoring.md`
- 面试总入口（兼容）：`workflows/interview-defense.md`
- 默认面试知识树：`workflows/interview-knowledge.md`
- 模拟面试：`workflows/mock-interview.md`
- 知识递归规则：`policies/knowledge-expansion-policy.md`
- 用户回答评估：`policies/answer-assessment-policy.md`
- 面试递归深度：`policies/interview-depth-policy.md`
- Interview Knowledge Node：`schemas/interview-knowledge-node.schema.json`
- Interview Question：`schemas/interview-question.schema.json`
- Generated Reference Answer：`schemas/generated-answer.schema.json`
- Mock Interview User Answer：`schemas/mock-interview-answer.schema.json`
- Interview Assessment：`schemas/interview-assessment.schema.json`
- Claim Graph：`schemas/claim-graph.schema.json`
- 主题选择：`workflows/theme-selection.md`
- Render Options：`schemas/render-options.schema.json`
- Kami Renderer：`renderers/kami/README.md`

## Experience Ready 停止条件

不要无限追问。某段经历满足以下条件后，默认可以停止主动深挖并进入验证或生成阶段：

- Context 已明确：为什么做、解决什么问题。
- Ownership 已明确：Owner / Direct / Collaborative / Observed / None。
- 至少一个 Action 已明确。
- 至少一个 Claim 已形成。
- Result 已明确，或已确认“暂无可靠量化结果”。
- 关键 Claim 的 Interview Risk 已知。

用户主动要求继续深挖时除外。

## 输出对象

根据任务需要输出一个或多个对象：

1. `Raw Career Input`：用户提供的原始材料记录。
2. `Keyword Signals`：从初始输入中提取并归一化的岗位、项目、技术、动作、结果等信号。
3. `Bootstrap Resume`：基于当前已知信息生成的候选简历骨架，明确区分 CONFIRMED / PROVISIONAL / GAP。
4. `Candidate Facts`：从原始材料中抽取、等待确认或已确认的候选事实。
5. `Career Profile`：已验证职业事实源。
6. `Resume Strategy`：针对目标岗位的内容选择、覆盖与篇幅计划。
7. `Resume View`：按 Strategy 生成的目标岗位内容视图。
8. `Resume Artifact`：Markdown / HTML / PDF。
9. `Interview Defense Pack`：由 Claims 派生的递归面试问题、Answer 中的新追问节点、Coverage、风险与回答准备。


## 面试准备模式

Resume Copilot 将面试准备严格拆成两种模式。

### Interview Knowledge（默认）

```text
Resume Claim
    ↓
Question
    ↓
Generated Reference Answer
    ↓
Extract Knowledge Nodes
    ↓
Follow-up Q&A
    ↺
```

系统自动生成参考答案；参考答案中的关键技术、机制、设计决策、一致性、失败恢复、指标和取舍继续递归展开。

系统生成答案只代表“建议如何回答”，**不代表用户已经掌握，也不自动升级为 Career Claim**。

### Mock Interview（可选）

仅当用户明确要求“面试我 / 我自己回答 / 不要先给答案”等场景时启用。

```text
Question
    ↓
User Answer
    ↓
Assessment
    ↓
Follow-up
```

只有这里才评估 `WEAK / PARTIAL / DEFENSIBLE / NOT_OWNED / INCORRECT`。

关键数据边界：

```text
Generated Reference Answer != User Answer
Interview Knowledge Node != Career Claim
```

递归必须有去重、环路检测、宽度预算和语义停止条件；默认 `maxDepth=8` 仅作为兜底。

## Renderer 原则

Renderer 只负责展示，不负责决定职业事实和内容策略。

当前内置 Kami family：

- 用户侧默认主题：`kami-default`，当前映射到 `kami-base.html`。
- 9 个可选主题：`kami-ivory`、`kami-mono`、`kami-navy`、`kami-slate`、`kami-teal`、`kami-forest`、`kami-burgundy`、`kami-sepia`、`kami-copper`。
- `kami-base` 是内部基线 / 兼容入口；用户不需要知道该实现名。
- 在生成 HTML / PDF 前，如果用户尚未指定主题，可以询问一次；用户无偏好时不得阻塞，直接使用 `kami-default`。

模板实现和使用规则见 `renderers/kami/README.md`。
