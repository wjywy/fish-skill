# Resume Strategy Workflow

## Required References

进入本流程后必须读取：

- `../schemas/resume-strategy.schema.json`
- `../examples/resume-strategy.example.json`

示例只用于理解 Strategy 的组织方式，不得把其中岗位或 Claim 当作用户事实。

## 1. 目标

Resume Strategy 负责回答“针对这个目标岗位，这份简历应该写什么”。

它位于 Career Profile 与 Resume Generation 之间：

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

Strategy 不负责润色句子，不负责 HTML/PDF 排版，也不得创造新的职业事实。

## 2. 输入

### Target Role 是硬性输入

Resume Strategy 启动前必须已经明确 `Target Role / Target Direction`。

如果用户没有提供：

> 先询问用户这份简历主要投什么方向，例如前端、后端、Agent、产品、全栈，或具体岗位名称。

禁止仅根据技术栈推断目标方向。JD 是可选输入，Target Role 不是。

至少读取：

- Target Role：目标岗位名称或明确方向。
- Career Profile：Experiences、Claims、Metrics、Skills。
- JD：若用户提供则解析；若未提供，则仅按目标岗位进行通用匹配，不假装知道具体公司要求。
- Constraints：页数、语言、资历层级、用户希望突出/弱化的方向。

## 3. JD 解析

如果提供 JD，将其拆成结构化 requirements，不要只做关键词匹配。

每条 requirement 至少包含：

- `category`：responsibility / skill / domain / architecture / collaboration / leadership / outcome。
- `statement`：归一化后的岗位要求。
- `importance`：MUST / IMPORTANT / NICE_TO_HAVE。
- `keywords`：显式技术词或领域词。
- `evidenceNeeded`：什么样的经历能证明满足这一要求。

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

## 4. Claim 候选过滤

先过滤，再排序。

默认排除：

- `resumeEligible = false`
- `ownership = NONE`
- `evidenceLevel = D`
- 与目标岗位明显无关且占用篇幅的 Claim

`OBSERVED`、`evidenceLevel = C`、`interviewRisk = HIGH` 不自动删除，但必须降低优先级，并避免使用超过事实强度的动词。

## 5. Claim 选择判定

Claim 选择默认使用**相对判定**，不使用跨岗位通用的固定权重公式。不同岗位对结果、Ownership、领域经验、协作或技术深度的重视程度不同，固定 35% / 20% 等权重会制造虚假的精确性。

对每个候选 Claim 至少判断：

1. **Requirement Relevance**：是否直接支撑 Target Role / JD 的重要要求。
2. **Ownership Strength**：用户本人参与深度是否足以支撑表述强度。
3. **Evidence Confidence**：事实来源与确认程度是否可靠。
4. **Outcome Strength**：是否有可信结果、影响或明确完成状态。
5. **Differentiation**：是否能体现相比普通候选人的区分度。
6. **Redundancy**：是否与其他 Claim 重复证明同一能力。
7. **Space Cost**：在有限篇幅中是否值得占用一条 bullet。

选择原则：先满足核心 Requirement，再在同类 Claim 中优先选择 Ownership 更强、证据更可靠、结果更清晰、区分度更高且重复更少的项。

如果某个具体场景确实需要数值评分，可以在当前 Target 下临时定义权重，但必须记录该权重为何适合该岗位；不得把一套固定权重当作所有岗位的通用真理。

## 6. 不是“JD 有什么就硬塞什么”

基于 JD 做 Strategy 时的底线：

```text
JD Requirement → Search Existing Claims → Select / Reframe
```

禁止：

```text
JD Requirement → Invent Claim → Write Resume
```

如果 JD 需要 Kubernetes，而 Career Profile 没有 Kubernetes 相关 Claim，应标记 Coverage Gap，而不是补写“熟悉 Kubernetes”。

## 7. Experience 选择

Claim 选择后，再决定哪些 Experience 值得进入简历。

优先保留：

1. 包含多个高分 Claim 的 Experience。
2. 能直接覆盖 MUST requirements 的 Experience。
3. 能体现结果、规模、复杂度或 ownership 的 Experience。
4. 能补足能力维度、避免简历单一化的 Experience。

不要因为某个 Experience 技术词很多就自动保留。

## 8. Coverage 分析

输出三类覆盖：

- `covered`：已有强 Claim 支撑。
- `weaklyCovered`：有关联，但 ownership / evidence / depth 较弱。
- `gap`：没有真实 Claim 支撑。

Gap 只用于提示用户：

- 是否有遗漏经历可以继续 Mining；
- 是否应该降低目标岗位匹配预期；
- 面试前需要补知识，但不能把补知识伪装成项目经历。

## 9. Section Strategy

Strategy 还需要决定内容预算：

- 哪个 section 在前；
- 工作经历与项目经历分别占多少；
- 每个 Experience 分配几条 bullet；
- 哪些 Skills 可以独立列出；
- 哪些 Claim 只能作为 interview context，不进入简历。

默认一页技术简历可先采用：

```text
Summary: 2–3 行
Experience: 45–55%
Projects: 25–35%
Skills: 10–15%
Education / Other: 剩余空间
```

这只是缺省预算，不是强制模板规则。

## 10. 输出 Resume Strategy

输出对象至少包含：

- `targetId`
- `requirementCoverage`
- `selectedExperienceIds`
- `selectedClaimIds`
- `excludedClaimIds` + reason
- `sectionPlan`
- `emphasis`
- `coverageGaps`
- `riskNotes`

生成 Resume View 前，Resume Generation 必须以该 Strategy 为输入，而不是直接遍历所有 Career Profile 数据。
