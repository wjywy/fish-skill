# Resume Strategy Workflow

## Required References

进入本流程后必须读取：

- `../schemas/resume-strategy.schema.json`
- `../examples/resume-strategy.example.json`
- `../policies/evidence-policy.md`
- `../policies/metric-policy.md`

示例只用于理解 Strategy 的组织方式，不得把其中岗位或 Claim 当作用户事实。

## 目标

Resume Strategy 只回答：**针对目标岗位，这份简历应该写什么、舍弃什么、各部分占多少内容。**

```text
Career Profile + Target Role / JD
            ↓
      Resume Strategy
            ↓
        Resume Plan
            ↓
      Resume Generation
            ↓
        Resume View
```

Strategy 不负责：

- 润色最终句子；
- 创造新的职业事实；
- HTML / PDF 排版；
- 主题、头像、字体等视觉决策。

## 输入

### Target Role 是硬性输入

启动 Strategy 前必须明确 `Target Role / Target Direction`。

若用户未提供，先询问；禁止根据技术栈猜岗位方向。JD 是可选输入，Target Role 不是。

至少读取：

- Target Role；
- Career Profile 中的 Experiences / Claims / Metrics / Skills；
- JD（若用户提供）；
- 用户约束，例如页数、语言、资历层级、希望突出或弱化的方向。

## JD 解析

如果提供 JD，将其拆成结构化 requirements，不做纯关键词匹配。

每条 requirement 至少包含：

- `category`：responsibility / skill / domain / architecture / collaboration / leadership / outcome；
- `statement`：归一化岗位要求；
- `importance`：MUST / IMPORTANT / NICE_TO_HAVE；
- `keywords`：显式技术词或领域词；
- `evidenceNeeded`：什么样的 Claim 才能支撑。

例如：

```text
JD：负责多 Agent 工作流的设计与落地，熟悉 LangGraph。

→ requirement:
  category = architecture
  importance = MUST
  statement = 具备多 Agent 工作流设计与落地经验
  keywords = [Multi-Agent, LangGraph]
  evidenceNeeded = 至少一个 DIRECT/OWNER 的工作流设计或实现 Claim
```

## Claim 候选过滤

先过滤，再比较。

默认排除：

- `resumeEligible = false`；
- `ownership = NONE`；
- `evidenceLevel = D`；
- 与目标岗位明显无关且占用有限篇幅的 Claim。

`OBSERVED`、`evidenceLevel = C`、`interviewRisk = HIGH` 不自动删除，但必须降低表达强度，并避免使用超过事实强度的动词。

涉及数字时读取 `metric-policy.md`，不要因为 Claim 强就自动认为关联 Metric 可写。

## Claim 选择判定

默认使用相对判定，不使用跨岗位固定权重公式。

对每个候选 Claim 至少判断：

1. **Requirement Relevance**：是否直接支撑重要岗位要求。
2. **Ownership Strength**：用户参与深度是否支撑表述强度。
3. **Evidence Confidence**：事实来源与确认程度是否可靠。
4. **Outcome Strength**：是否有可信结果、影响或明确完成状态。
5. **Differentiation**：是否有区分度。
6. **Redundancy**：是否与其他 Claim 重复证明同一能力。
7. **Space Cost**：是否值得占用有限简历空间。

选择原则：先满足核心 Requirement，再在同类 Claim 中优先 Ownership 更强、证据更可靠、结果更清晰、区分度更高且重复更少的项。

需要数值评分时，可以在当前 Target 下临时定义权重，但必须说明该权重为何适用于当前岗位，不把它当通用公式。

## 不是“JD 有什么就硬塞什么”

允许：

```text
JD Requirement → Search Existing Claims → Select / Reframe
```

禁止：

```text
JD Requirement → Invent Claim → Write Resume
```

如果 JD 要求 Kubernetes，而 Career Profile 没有对应 Claim，应记录 Coverage Gap，不得补写“熟悉 Kubernetes”。

## Experience 选择

Claim 选择后，再决定哪些 Experience 值得进入简历。

优先：

1. 包含多个高价值 Claim 的 Experience；
2. 直接覆盖 MUST requirements；
3. 有可信结果、规模、复杂度或 Ownership；
4. 能补足能力维度、避免内容单一。

不要因为某段经历技术词多就自动保留。

## Coverage 分析

输出：

- `covered`：已有强 Claim 支撑；
- `weaklyCovered`：有关联，但 Ownership / Evidence / Depth 较弱；
- `gap`：没有真实 Claim 支撑。

Gap 只用于：

- 判断是否还有遗漏经历值得继续 Mining；
- 帮助用户理解真实覆盖范围；
- 指导面试前补知识。

不得把补知识伪装成项目经历。

## Section Strategy

Strategy 决定内容预算：

- 哪个 section 在前；
- Skills、工作经历、项目经历、教育分别占多少；
- 每个 Experience 分配几条 bullet；
- 哪些 Skills 独立列出；
- 哪些 Claim 只保留为 interview context。

全局规则要求 **不生成独立个人简介 / Summary**。页头后直接进入专业技能或经历内容。

缺省的一页技术简历可以从以下区间开始，再按实际经历调整：

```text
Skills: 10–15%
Experience: 45–55%
Projects: 25–35%
Education / Other: 剩余空间
```

这只是内容预算起点，不是固定版式。若内容过多，应先减少低价值 Claim / Bullet，而不是交给 Renderer 压字号。

## 输出 Resume Strategy

输出至少包含：

- `targetId`
- `requirementCoverage`
- `selectedExperienceIds`
- `selectedClaimIds`
- `excludedClaimIds` + reason
- `sectionPlan`
- `emphasis`
- `coverageGaps`
- `riskNotes`

Resume Generation 必须以 Strategy 为输入，不得绕过 Strategy 重新遍历全部 Career Profile 随意选材。