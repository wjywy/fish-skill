# Resume Bootstrap Workflow

## 目标

当用户只提供关键词、岗位方向、少量项目名或零散工作描述时，不要求先完成完整经历采访，而是尽快生成一版可讨论的候选简历骨架，并用这版骨架驱动后续的高价值追问。

Bootstrap 的目标是“快速形成结构”，不是“在信息不足时补全事实”。

## 典型输入

- `前端 / React / SSR / 性能优化 / RAG`
- `想投 Agent 应用开发工程师，做过 LangGraph、RAG、SSE`
- `大疆电商前端，做过商城性能、AI 自动化、新品发布`
- 一段几十到几百字的工作总结
- 旧简历中的若干项目标题和技术词

## 核心链路

```text
Raw Career Input
      ↓
Extract Keyword Signals
      ↓
Normalize / Classify Signals
      ↓
Infer Candidate Resume Structure
      ↓
Generate Bootstrap Resume
      ↓
Mark Known / Unknown / Needs Verification
      ↓
Rank Information Gaps
      ↓
Ask Highest-value Questions
      ↓
Convert confirmed content into Career Profile
```

## Step 1：提取 Keyword Signals

关键词不是只有技术名词。需要分类：

- `TARGET_ROLE`：目标岗位，如 Agent 应用开发工程师、前端工程师
- `ORGANIZATION`：公司 / 团队 / 业务线
- `DOMAIN`：电商、支付、内容、推荐等业务领域
- `PROJECT`：项目或专项名称
- `TECHNOLOGY`：React、LangGraph、Redis、PostgreSQL
- `CAPABILITY`：RAG、Multi-Agent、SSR、性能优化
- `ACTION`：优化、迁移、搭建、设计、治理
- `RESULT`：明确结果或变化
- `METRIC`：数字、百分比、耗时、规模
- `OWNERSHIP`：负责、主导、参与、协作
- `TIMELINE`：时间信息

每个 Signal 必须记录来源文本，不允许从技术词反推出用户做过的具体实现。

## Step 2：关键词归一化

例如：

```text
React16 / React 16      → React 16
PG / PostgreSQL         → PostgreSQL
RAG 检索 / RAG          → RAG
Agent 编排 / multi agent → Multi-Agent Workflow
```

归一化只用于聚类与检索，不改变用户事实。

## Step 3：构建 Candidate Resume Structure

根据用户已知信息先判断可形成哪些区块：

```text
Profile / Summary
Experience
Projects
Skills
Education（若提供）
```

允许推断“区块应该存在”，但不允许推断区块里的事实。

例如用户输入：

```text
前端工程师，React、SSR、INP、RAG、LangGraph
```

可以形成：

```text
目标岗位：前端 / Agent 交叉方向
技能候选：React、SSR、INP、RAG、LangGraph
经历：未知
项目：未知
量化结果：未知
```

不能生成：

```text
主导 React SSR 性能专项，将 INP 提升 50ms
```

除非用户已经明确提供这些事实。

## Step 4：生成 Bootstrap Resume

Bootstrap Resume 中的内容分为三类：

### CONFIRMED

用户已经明确提供，可直接复述或轻度重写。

### PROVISIONAL

基于明确输入可以生成候选表达，但仍需要确认 ownership / result / metric。

### GAP

简历需要但当前缺失的信息。

示例：

```text
【候选项目】商城性能优化
状态：PROVISIONAL
已知：React 16、SSR、INP
缺失：原始问题、本人职责、具体动作、结果指标
```

## Step 5：优先生成“有依据的半成品”，不要编完整故事

允许：

```text
商城性能优化｜React 16 / SSR / INP
- 围绕移动端页面交互性能开展专项优化。（需确认具体职责与动作）
```

不允许：

```text
- 主导商城移动端 INP 专项，通过拆包、图片预解码和延迟调度将 INP 优化 50ms。
```

如果这些内容没有出现在 Raw Input / 已确认 Career Profile 中。

## Step 6：Information Gap Ranking

不要一次性问所有缺口。优先级：

1. `OWNERSHIP`：这是不是用户本人做的
2. `ACTION`：具体做了什么
3. `RESULT / METRIC`：产生了什么结果
4. `CONTEXT`：为什么做
5. `DECISION / TRADEOFF`：为什么这么设计
6. `TIMELINE / SCOPE`：时间和规模
7. 低价值背景字段

每轮优先问 1–3 个最能提升简历质量的问题。

## Step 7：从 Bootstrap 进入正式 Career Profile

当某个候选项目达到 Experience Ready 条件时：

```text
Bootstrap Candidate
      ↓
Candidate Facts
      ↓
Verification
      ↓
Experience / Claim / Metric
      ↓
Career Profile
```

已经进入 Career Profile 的事实不再以 PROVISIONAL 形式重复维护。

## 三种输入充足度

### SPARSE

只有岗位 + 几个关键词。

策略：
- 生成技能与项目候选骨架
- 不生成强动作型 bullet
- 立即追问最相关的一段经历

### PARTIAL

已经有项目名、技术、部分动作。

策略：
- 生成半成品 bullet
- 标记缺失 ownership / result
- 针对缺口追问

### RICH

已经包含 Context、Action、Result 或旧简历完整项目描述。

策略：
- 可以直接生成较完整 Draft
- 将高风险 Claim 标为 needs verification
- 只追问关键缺口

## 停止条件

Bootstrap 阶段不追求 Career Profile 完整。

满足任一条件即可离开：
- 已生成一版用户可以讨论的简历骨架；
- 已定位 1–3 个最高价值信息缺口；
- 至少一个 Candidate Experience 可以进入 Experience Mining；
- 用户明确要求直接继续生成 / 修改某一部分。

## 与最终简历的边界

Bootstrap Resume 是工作草稿，不是最终事实源。

```text
Bootstrap Resume != Resume View
Provisional Bullet != Verified Resume Bullet
Keyword Signal != Career Claim
```

最终 Resume View 仍必须由 Verified Claims / Metrics 生成。
