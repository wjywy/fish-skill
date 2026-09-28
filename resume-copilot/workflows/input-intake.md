# Raw Career Input Intake Workflow

## 目标

允许用户从任意粒度开始，而不是要求用户先准备结构化工作经历。

可接受输入包括：
- 一句话或零散描述
- 旧简历
- JD
- 项目 README / 方案文档
- GitHub / Repository 描述
- 周报、季度总结、述职材料
- 已有聊天内容

## 原则

1. 用户只负责提供材料，不需要理解 Resume Copilot 的 Schema。
2. 不直接把原始材料当作事实源；先抽取 Candidate Facts。
3. 从文件或文档抽取出的强表述，若 ownership / result / metric 未被用户确认，默认 `needs_confirmation`。
4. JD 只用于目标岗位分析，不得作为用户经历证据。
5. README / 代码仓库可以证明“项目存在某能力”，但不能自动证明“用户本人实现了该能力”。

## 流程

用户目标是“生成简历”时，优先采用 Draft-first Bootstrap，而不是先完成整套采访。

```text
Raw Career Input
      ↓
Extract Keyword Signals
      ↓
Resume Bootstrap
      ↓
Candidate Resume Skeleton + Gaps
      ↓
Extract Candidate Facts
      ↓
Targeted Questions
      ↓
Confirmed Facts
      ↓
Experience + Claim + Metric
```

具体规则见 `workflows/resume-bootstrap.md`。

## Candidate Fact 抽取

从原始输入中优先抽取：
- Context：为什么做、原始问题是什么
- Role / Ownership：用户扮演什么角色
- Action：实际做了什么
- Decision：是否存在技术取舍
- Result：产生了什么结果
- Metric：是否存在量化数据
- Technology：涉及哪些技术
- Timeline / Scope：时间与影响范围

每个 Candidate Fact 必须保留 `sourceInputIds`，确保后续可追溯。

## 输入场景处理

### 1. 用户只给一句话

例如：`我做过一个 RAG 项目。`

不要要求用户填写结构化表单。

如果用户目标是“帮我生成简历”，先进入 `resume-bootstrap.md`：
- 提取 RAG / 项目等 Keyword Signals；
- 生成候选项目骨架；
- 明确缺失的 Context / Ownership / Action / Result；
- 再进入 `experience-mining.md` 对最高价值缺口追问。

如果用户只是想讲经历或整理事实，可以直接进入 Experience Mining。

### 2. 用户给旧简历

先提取 Candidate Facts，并区分：
- 已经明确的事实
- 需要用户确认 ownership 的表述
- 需要确认来源的 metric
- 疑似润色而非事实的表述

只追问缺失和高风险部分，不从头重新采访。

### 3. 用户给 JD

JD 进入 Target / Requirement 模型，不进入 Career Evidence。
若只有 JD 没有经历材料，则进入 INTAKE，询问最相关的一段经历作为起点。

### 4. 用户给项目 README / Repository

可抽取 Candidate Facts，但必须把“项目能力”和“用户 ownership”分开。
例如 README 写 `支持 Outbox`，只能得到：
`项目存在 Outbox 能力`。
只有用户确认后，才能形成：
`用户直接实现 Outbox Worker`。

## 停止条件

当已有信息足以生成至少一个 Candidate Experience 时，转入 `experience-mining.md`；不要为了完整性强迫用户一次性交代全部职业经历。
