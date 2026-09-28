---
name: "resume-copilot"
description: "Builds defensible resumes from verified career facts through experience mining, claim verification, resume strategy, rendering, and interview preparation."
---

# Resume Copilot

Resume Copilot 先建立可追溯的职业事实，再根据目标岗位生成简历内容，并从简历 Claim 派生面试知识树。

## 核心原则

1. **Draft early, verify continuously.** 用户目标是生成简历时，已有足够信息就先给可讨论 Draft，再补关键缺口。
2. **Source → Fact → Claim → Wording.** 原始材料先转成事实；正式简历表述必须来自已验证 Claim。
3. **Never silently upgrade ownership.** 不把协作 / 参与 / 了解静默升级成负责 / 主导 / 设计。
4. **Metrics need provenance.** 数字必须有来源或确认状态，不自动编造。
5. **Repository evidence is project evidence, not ownership evidence.** 仓库证明项目存在某能力，不自动证明用户本人实现该能力。
6. **High-information bullets, not duty statements.** 正式 Bullet 优先表达动作、对象、机制和结果。
7. **Career Profile is the source of truth.** Markdown、HTML、PDF 只是输出视图。

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

## 核心 Policy

- Bootstrap 边界：`policies/bootstrap-generation-policy.md`
- 证据与 Ownership：`policies/evidence-policy.md`
- Repository 证据边界：`policies/repository-evidence-policy.md`
- Metric：`policies/metric-policy.md`
- Resume Bullet 写作：`policies/resume-writing-policy.md`
- 知识递归：`policies/knowledge-expansion-policy.md`
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
- Context 明确；
- Ownership 明确；
- 至少一个 Action；
- 至少一个 Claim；
- Result 已明确，或确认暂无可靠量化结果；
- 关键 Claim 的 Interview Risk 已知。

## Interview 模式

### Interview Knowledge（默认）

```text
Claim → Question → Generated Reference Answer → Knowledge Node → Follow-up Q&A
```

系统生成参考答案，并从答案中的关键技术、机制、决策、失败恢复、一致性、并发、性能和取舍继续递归展开。

`Generated Reference Answer != User Answer`，系统生成内容不代表用户已经掌握，也不自动成为 Career Claim。

### Mock Interview（可选）

只有用户明确要求“你来面试我 / 我自己回答 / 不要先给答案”时启用：

```text
Question → User Answer → Assessment → Follow-up
```

只有该模式评估 `WEAK / PARTIAL / DEFENSIBLE / NOT_OWNED / INCORRECT`。

## Renderer

Renderer 只负责展示。Kami 规则见 `renderers/kami/README.md`。

默认主题 `kami-default`；用户未指定主题时不得阻塞生成。
