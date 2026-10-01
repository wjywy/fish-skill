# Resume Copilot

> 面向 Coding Agent 的简历生成与面试准备 Skill。

Resume Copilot 从用户提供的项目关键词、旧简历、工作材料或当前代码仓库中提取事实，经 Ownership / Evidence 验证后生成目标岗位简历，并从已验证 Claim 派生 Answer-driven 的深度面试知识链。

## 1. 核心链路

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

Resume Copilot 尽量保证：

- 项目事实可追溯；
- Ownership 不被静默放大；
- Metric 有来源和口径；
- Target Role 决定选材，而不是改变事实；
- 每个重要 Claim 都能继续展开成可学习的面试知识。

## 2. 架构分层

| 层 | 负责什么 |
| --- | --- |
| `SKILL.md` | 路由、全局不变量、跨 Workflow 边界 |
| `workflows/` | 某项任务按什么顺序执行 |
| `policies/` | 证据、Metric、写作、知识扩展、答案深度与 Presentation Planning |
| `schemas/` | 内部数据结构 |
| `examples/` | 行为示例，不承载硬规则 |
| `renderers/` / `scripts/` / `templates/` | HTML/PDF 视觉与构建实现 |

设计原则是 **Single Source of Truth**：

- 面试节点提取、Coverage、Expansion Queue / Root Queue、Sibling Gate → `policies/knowledge-expansion-policy.md`
- 面试答案完整度、DEEP_STUDY、Presentation Planning、递归停止边界 → `policies/interview-depth-policy.md`
- 证据 / Ownership / Execution Evidence → `policies/evidence-policy.md`
- Resume Bullet 写作 → `policies/resume-writing-policy.md`
- 数字可用条件 → `policies/metric-policy.md`
- Renderer 默认主题和视觉实现 → `renderers/kami/README.md` + `schemas/render-options.schema.json`

Examples 只能示范规则如何落地，不能新增一套规则。

## 3. Resume 主流程

### 3.1 Input Intake

接收项目 / 经历关键词、旧简历、JD、工作总结、Repository / 当前 Coding Agent Workspace。原始材料先形成 Fact，不直接变成最终简历句子。

### 3.2 Repository Inspection

```text
Repository Fact != User Ownership != Resume Claim
```

仓库可以证明项目能力，不能单凭代码证明“由用户独立设计并实现”。

### 3.3 Resume Bootstrap / Experience Mining

目标岗位已知且已有足够事实时，可以先生成 provisional draft；随后继续验证 Ownership、Action / Mechanism、Context / Problem、Result / Metric 与必要 Decision / Tradeoff。Bootstrap Draft 不是事实源。

### 3.4 Resume Strategy / Generation / Renderer

```text
Resume Strategy   → 决定写什么
Resume Generation → 把已选事实写成 Resume View
Renderer          → 决定长什么样、如何生成 HTML/PDF
```

简历不生成 standalone personal summary。Renderer 默认 public theme ID 为 `kami-default`；视觉实现细节不由 Generation 重复定义。

## 4. Interview Knowledge

默认链路：

```text
Claim
  ↓
Question
  ↓
DEEP_STUDY Generated Reference Answer
  ↓
Candidate Nodes
  ↓
Coverage + Value Evaluation
  ↓
Follow-up Question
  ↺
```

### 4.1 每一道已生成的问题都按 DEEP_STUDY 回答

Interview Knowledge 没有 QUESTION_BANK 式浅回答模式。一个 Question 一旦被物化，就必须先形成完整、可独立学习的参考答案，再允许从答案提取下一层节点。

问题数量和文档长度不是优化目标。后面还有多少题，不能成为缩短当前答案的理由。

### 4.2 Answer-driven，而不是预生成题库

正确：

```text
Question₀
→ Complete Answer₀
→ Candidate Nodes
→ Question₁
→ Complete Answer₁
```

不使用：

```text
Claim
→ 一次性列出 10 个平行问题
→ 再逐题填答案
```

一个 Answer 可以产生多个高价值 sibling；全部保留，但默认一次只执行一个。当前深分支耗尽后再返回其他 sibling。

### 4.3 当前题先讲透

内部 Generated Answer 当前仍使用：

- `overview`：核心结论和必要项目落点；
- `principleDetail`：机制、Why Layer、具体推演、知识抽象、失败边界与取舍。

它们是内部 completeness slots，不是用户可见栏目。Follow-up 不能用来补上一题本来就没解释清楚的核心机制。

### 4.4 Presentation Planning

最终答案不固定输出：

```text
直接回答
展开说明
```

而是先直接回应问题，再按题型选择最合适的解释结构：

| 题型 | 常见结构 |
| --- | --- |
| 定义 | 定义 → 边界 / 反例 → 例子 |
| 机制 | 因果链 → walkthrough → 边界 |
| 流程 | 编号步骤 / flow → 状态变化 |
| 对比 | 核心差异 → 对比表 → 如何选择 |
| 并发 | 时间线 → race → atomic point |
| 失败恢复 | failure scenario → 中间状态 → recovery |
| 架构 | 组件关系 → data/state flow → Why |
| 验证 | Claim → Observation Point → Evidence Boundary |

内部字段名不出现在最终 Markdown。

### 4.5 深度由岗位决定

停止不是因为“已经第 5 层 / 第 8 层”，也不是因为“已经生成很多题”，而是因为继续追问已不能增加对 Target Role / Claim 的判断信息。

### 4.6 Execution Evidence

读取测试代码、README、历史报告只能说明“仓库定义 / 历史记录了什么”。只有本轮真实执行命令并拿到结果，才可以写“我刚运行通过 / 当前 78/78 / 实测成功”。

### 4.7 默认可见输出

Interview Knowledge 默认就是完整 Q&A：

```markdown
# 核心主题

## 问题

<自然开头直接回答；随后按题型完整展开>

## 由上一层 Answer 产生的 Follow-up

<该题自己的完整 DEEP_STUDY 答案>
```

系统 Generated Answer 不代表用户已掌握，也不自动变成新的 Career Claim。

## 5. Mock Interview

只有用户明确要求“你来面试我 / 我自己回答 / 评估我的回答”时进入 Mock Interview。Interview Knowledge 生成系统参考问题与答案；Mock Interview 读取并评估用户实际回答。两者不能混淆。

## 6. Bullet 原则

正式技术简历 Bullet 优先表达：

```text
Action / Ownership
+ Scope / Object
+ Method / Mechanism
+ Problem / Constraint
+ Result / Metric
```

详细规则：`policies/resume-writing-policy.md` 与 `examples/resume-bullet-patterns.md`。

## 7. 安装

`fish-skill` 是一个多 Skill 仓库，`resume-copilot` 位于 `skills/resume-copilot/`。不要把整个仓库直接 clone 成 `.agents/skills/resume-copilot`。

推荐：

```bash
npx fish-skill install resume-copilot
```

默认结果：

```text
<project>/.agents/skills/resume-copilot/SKILL.md
```

## 8. 推荐调用方式

### 简历

```text
结合当前代码仓库和 resume-copilot，帮我生成这个项目的简历内容。
目标岗位：后端开发工程师。
```

### 面试知识

```text
使用 resume-copilot，针对这份简历生成完整的面试问题和参考答案，并根据每个答案继续深挖高价值技术点。
```

### 模拟面试

```text
使用 resume-copilot 模拟面试我。
不要先给参考答案，我自己回答，你根据我的回答继续追问。
```

## 9. 设计目标

Resume Copilot 更接近：

```text
Career Knowledge System
+ Resume Generator
+ Interview Deep-Study Copilot
```

目标不是把经历“包装得更强”，而是把真实经历组织成信息密度高、目标明确、证据可追溯，并且面试时真正能深入理解和解释的职业知识系统。