# Interview Knowledge Workflow

## Required References

进入本流程后必须读取：

- `../policies/knowledge-expansion-policy.md`：Candidate Node、Coverage、去重、队列与调度的唯一 Source of Truth。
- `../policies/interview-depth-policy.md`：当前答案完整度、Presentation Planning 与递归停止边界的唯一 Source of Truth。
- `../examples/interview-expansion-examples.md`：展示 Answer-driven 扩展行为，不是规则来源。
- `../examples/interview-answer-examples.md`：展示不同题型如何自然组织答案，不是规则来源。
- `../examples/claim-graph.example.json`：展示内部图结构，不是用户项目事实。

Examples 只能帮助理解规则如何落地，不能新增 Policy，也不能把示例事实迁移到当前用户。

## 目标

Interview Knowledge 从已验证 Claim / Project Fact 出发，生成一条由完整答案驱动的面试知识链：

```text
Claim
  ↓
Question
  ↓
DEEP_STUDY Generated Reference Answer
  ↓
Candidate Knowledge Nodes
  ↓
Value / Coverage Evaluation
  ↓
Follow-up Question
  ↺
```

支持两种 Grounding 入口：

- `RESUME_GROUNDED`：围绕 Resume View 中实际暴露的 Claim 生成。
- `PROJECT_GROUNDED`：围绕当前 Repository / Project 已验证出的项目能力生成。

这两个入口只影响项目 Grounding，不影响每道题的答案深度。Repository Fact 只能证明项目存在某能力，不能自动证明用户 Ownership。

Interview Knowledge 默认交付完整 Q&A。不存在“只输出问题、内部生成答案”的 QUESTION_BANK 交付模式；问题数量不是优化目标，每个被物化的问题都必须先被完整回答。

## 生成前与交付前强制检查（Gate）

### Gate 1：Pre-flight

开始前：

1. 如果工作区存在历史面试文档、用户反馈、项目记忆或同目录旧版本，优先读取并对齐；不存在时继续，不依赖固定平台目录。
2. 确认使用 Answer-driven 流程，不预生成完整题纲。
3. 确认当前 Target Role / JD 边界；没有 JD 时使用用户明确的岗位方向，不虚构公司要求。

### Gate 2：Per-Answer Deep Study Gate

每个 Generated Reference Answer 完成后，先执行 `interview-depth-policy.md` 的 Answer Completeness Gate。

不通过：补写当前答案。

通过：才允许进入 Candidate Node Extraction。

硬约束：

- 当前题不能因为“后面还有很多题”而缩短答案；
- Follow-up 不得承担补完当前答案的职责；
- 当前 Question 一旦被物化，就必须形成可独立学习、可直接复习的完整解释。

### Gate 3：Before Transition / Output

切换 sibling、Root Theme、Claim 或结束当前主题前，执行 `knowledge-expansion-policy.md` 的 Sibling Transition / Exhaustion 判定。

交付前再检查：

- 是否是 Answer-driven 深链，而不是预先列好的平行题单；
- 每一道已物化问题是否都有 DEEP_STUDY 级答案；
- 是否仍有被静默丢弃的高价值 `UNEXPANDED` sibling；
- 是否因固定层数而过早停止；
- 用户可见文档是否泄露内部调度、Grounding 或存储字段；
- 答案是否按问题类型选择了合适结构，而不是机械套同一个模板。

不通过则修正后再交付。

## 输入

### RESUME_GROUNDED

读取：

- Resume View 中实际暴露的 `claimIds`；
- Claim 对应的 Experience / Metric / Ownership / Evidence；
- Target Role / JD Requirements；
- 已有 Interview Knowledge Graph（若存在）。

不要重新从最终简历文案猜事实；Resume View 只告诉你“最终暴露了哪些 Claim”。

### PROJECT_GROUNDED

读取：

- Repository / Project 中已验证的 Facts、Experience 与 Claim；
- Target Role / JD Requirements；
- 已有 Interview Knowledge Graph（若存在）。

可以基于项目技术事实生成技术问题；如果答案要说“我负责 / 我设计 / 我实现”，必须有对应 Ownership 证据。

## Step 1：选择一个 Root Question

Root Question 只启动当前 Claim 的第一条有效深链，不负责预规划完整题库。

可参考的问题维度包括：

- `DEFINITION`
- `MOTIVATION`
- `IMPLEMENTATION`
- `MECHANISM`
- `FAILURE`
- `CONSISTENCY`
- `CONCURRENCY`
- `PERFORMANCE`
- `TRADEOFF`
- `SCALING`
- `METRIC`
- `OWNERSHIP`

维度只是视角，不是覆盖清单。

规则：

1. 一个 Claim 初始只物化当前最高价值 Root Question。
2. 尚未执行的横向需求可以保留为 assessment intent，但不要提前生成具体问题全文。
3. Root Answer 产生高价值后代后，后续执行顺序完全交给 `knowledge-expansion-policy.md`。

## Step 2：构建 DEEP_STUDY Generated Reference Answer

参考答案首先必须准确回答当前问题，然后才承担“产生可追问知识”的作用。

内部当前仍保留两个存储字段：

- `overview`：核心结论与必要项目落点；
- `principleDetail`：机制、Why Layer、具体推演、知识抽象、失败边界与取舍。

这两个字段只是内部 completeness slots，不是最终 Markdown 模板。答案质量、CURRENT / PRINCIPLE / IMPROVEMENT 边界、Execution Evidence、术语不得代替解释、Concrete Walkthrough 等规则全部读取对应 Policy，本 Workflow 不复制一套写作算法。

### 项目 Grounding

项目事实用于场景化答案，不决定通用技术问题“能不能回答”。

- Repository / Career Profile 能证明 → 可以写成 CURRENT。
- 通用原理可靠但项目未证明 → 解释 PRINCIPLE，不写成用户已实现。
- 尚未实现的演进 → 明确写“如果改造，我会……”等 IMPROVEMENT 语气。
- 只有本轮真实 Tool / Command Execution 支撑 → 才能写“我运行了 / 当前通过 / 实测成功”。

`projectGrounding = INSUFFICIENT` 不等于技术分支必须停止。

## Step 3：Answer Completeness Gate

调用 `interview-depth-policy.md`。

通过之前不得进入下一题。尤其检查：

- 当前问题是否已经自洽；
- 机制是否按因果链讲清；
- 是否只用技术名词替代解释；
- 需要时是否包含 Why Layer、可推演例子与通用抽象；
- 项目现状、通用原理、假设方案和本轮执行结果是否分清。

如果答案仍需要下一题才能把当前问题解释完整，说明当前 Answer 不合格，应先补写。

## Step 4：Presentation Planning

Answer Completeness 通过后、用户可见 Markdown 生成前，调用 `interview-depth-policy.md` 的 Presentation Planning。

先判断当前题最适合的解释形态，再组织最终答案。例如：

```text
DEFINITION       → 定义 + 边界 + 例子
MECHANISM        → 因果链 + walkthrough
PROCESS          → 编号步骤 / flow
COMPARISON       → 对比表 + 结论
CONCURRENCY      → 时间线 + race + atomic point
FAILURE/RECOVERY → failure scenario + recovery flow/state
ARCHITECTURE     → component relation + data/state flow + rationale
TRADEOFF         → criteria + alternatives + cost
VALIDATION       → claim + observation point + evidence strength
```

最终答案必须在开头自然、直接地回应问题，但**不要固定输出 `直接回答 / 展开说明`、`overview / principleDetail`、`coreAnswer / mechanism` 等内部字段名**。

Presentation Planner 只决定“怎么讲清楚”，不得删除 DEEP_STUDY 所需知识内容。

## Step 5：Candidate Node Extraction & Scheduling

调用 `knowledge-expansion-policy.md`，不要在本 Workflow 复制算法。

该 Policy 负责：

- Explicit / Implicit / Contrast / Boundary Candidate Node；
- Role Relevance / Claim Dependency / Discriminative Power / Information Gain / Novelty；
- `MENTIONED / PARTIAL / SUFFICIENT` Coverage；
- `UNEXPANDED / EXPANDED / COVERED / MERGED / DROPPED`；
- Expansion Queue / Root Queue；
- 一答多节点 sibling 保留；
- 当前分支优先；
- Sibling Transition Gate；
- 去重、环路与 Root Question 补充。

本 Workflow 只消费该 Policy 的结果：得到下一节点就生成下一 Question，并回到 Step 2。

## Step 6：Recursive Depth Check

每轮继续 / 停止边界读取 `interview-depth-policy.md`。

不要因为以下原因停止：

- 已经离根关键词较远；
- 已追问固定层数；
- 已覆盖一个预设问题模板；
- 文档已经比较长；
- 已经生成了很多问题；
- Project Grounding 不足，但通用技术知识仍可靠。

只有岗位相关性、信息增益、重复 / 环路、知识可靠性或异常 `hardMaxDepth` 触发停止。

## Generated Reference Answer 与用户掌握的关系

```text
Generated Reference Answer != User Answer
```

Generated Answer 是系统为知识扩展与复习生成的参考内容：

- 不证明用户已经掌握；
- 不自动升级 Career Claim；
- 不改变 Ownership；
- 不作为新的职业事实来源。

只有用户进入 Mock Interview 并实际作答时，才由 `workflows/mock-interview.md` 评估用户回答。

## 用户可见 Markdown 输出

默认就是完整 Q&A：

```markdown
# <一条 Claim / 知识链的核心主题>

## <Root Question>

<自然开头直接回答问题；随后按题型组织完整 DEEP_STUDY 内容>

## <由上一层 Answer 产生的 Follow-up Question>

<该问题自己的完整 DEEP_STUDY 答案>
```

输出结构原则：

- 一级标题：一条 Claim / 简历描述的核心主题，不写 `Claim 1`。
- 二级标题：面试问题；Root 与 Follow-up 默认同级扁平展示。
- 默认不输出题号；用户明确要求时再编号。
- 每个二级问题后立即给完整答案。
- 答案可按需使用自然段、步骤、表格、时间线、流程图、伪代码或代码片段。
- 不固定出现“直接回答 / 展开说明”等模板标题。
- 内部图很复杂，用户输出保持可读、可复习。

如果答案确实需要 Mermaid 流程图，并且最终交付 Markdown 文件，可使用现有 `../scripts/embed-mermaid.mjs` 生成图片资源；流程图是表达工具，不是每题必需格式。

## 默认禁止输出的内部信息

除非用户明确要求查看分析依据，否则最终 Markdown 不输出：

- `claimId` / 内部对象 ID；
- Repository 证据路径和内部证据清单；
- `VERIFIED / PARTIAL / INSUFFICIENT`；
- `depth`；
- Node Type；
- `roleRelevance`；
- Knowledge Node / Parent / Child / Shared Node 元数据；
- Expansion Queue / Root Queue；
- Scheduler State / Transition Gate；
- `decisionReason` / Stop Reason；
- `overview / principleDetail` 等内部 Answer 字段；
- “建议补充验证”等内部缺口旁白。

项目事实不足时，在答案对应位置直接区分 CURRENT / PRINCIPLE / IMPROVEMENT，不把内部 Grounding 状态暴露成调试报告。

## 与 Mock Interview 的关系

Interview Knowledge 负责生成问题与 DEEP_STUDY 系统参考答案。

Mock Interview 负责：

- 向用户提问；
- 读取用户真实回答；
- 评估回答；
- 根据用户回答继续追问。

两者不得混淆。