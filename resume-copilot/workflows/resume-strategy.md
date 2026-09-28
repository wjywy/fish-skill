# Resume Strategy Workflow

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

至少读取：

- Target Role：目标岗位名称。
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

## 5. Claim 选择评分

评分的目的不是伪装成绝对数学真理，而是让 Agent 的选择可解释、稳定。

建议使用 0–100 的内部评分：

```text
ClaimScore =
  35% Requirement Relevance
+ 20% Ownership Strength
+ 15% Evidence Confidence
+ 15% Outcome Strength
+ 10% Differentiation
+  5% Recency
- Risk Penalty
- Redundancy Penalty
```

### Requirement Relevance（0–100）

Claim 与目标岗位 / JD requirement 的语义匹配程度。

- 100：直接证明 MUST requirement
- 80：直接证明 IMPORTANT requirement
- 60：对岗位核心能力有强支撑
- 30：弱相关
- 0：无关

### Ownership Strength

- OWNER = 100
- DIRECT = 90
- COLLABORATIVE = 65
- OBSERVED = 30
- NONE = 0

### Evidence Confidence

- A + confirmed = 100
- B + confirmed/inferred = 80
- C = 45
- D = 0

### Outcome Strength

- 有确认的业务 / 性能 / 效率结果 = 100
- 有明确非量化结果 = 70
- 只有动作无结果 = 40
- 只有技术名词 = 10

### Differentiation

衡量是否能让候选人与普通简历形成区分。例如复杂架构权衡、规模、跨团队影响、可复用方法论等。

### Risk Penalty

- LOW = 0
- MEDIUM = 5
- HIGH = 15

若 HIGH Risk 同时为 `OBSERVED` 或 Evidence C，则可额外扣分。

### Redundancy Penalty

若多个 Claim 证明同一件事，只保留最强证据，避免简历重复堆技术名词。

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
