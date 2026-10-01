# Resume Copilot

> 面向 Coding Agent 的简历生成与面试准备 Skill。

Resume Copilot 从用户提供的项目关键词、旧简历、工作材料或当前代码仓库中提取事实，经 Ownership / Evidence 验证后生成目标岗位简历，并从已验证 Claim 派生面试知识树。

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

Resume Copilot 不是“把句子润色得更厉害”，而是尽量保证：

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
| `policies/` | 证据、Metric、写作、知识扩展、深度等判定规则 |
| `schemas/` | 内部数据结构 |
| `examples/` | 行为示例，不承载硬规则 |
| `renderers/` / `scripts/` / `templates/` | HTML/PDF 视觉与构建实现 |

设计原则是 **Single Source of Truth**：

- 面试节点提取、Coverage、Expansion Queue / Root Queue、Sibling Gate → `policies/knowledge-expansion-policy.md`
- 面试答案完整度、Why Layer、Knowledge Abstraction、递归停止边界 → `policies/interview-depth-policy.md`
- Resume Bullet 写作 → `policies/resume-writing-policy.md`
- 数字可用条件 → `policies/metric-policy.md`
- Renderer 默认主题和视觉实现 → `renderers/kami/README.md` + `schemas/render-options.schema.json`

Examples 只能示范规则如何落地，不能新增一套规则。

## 3. Resume 主流程

### 3.1 Input Intake

接收：

- 项目 / 经历关键词；
- 旧简历；
- JD；
- 工作总结；
- Repository / 当前 Coding Agent Workspace。

原始材料先形成 Fact，不直接变成最终简历句子。

### 3.2 Repository Inspection

当用户要求结合当前仓库时：

```text
Repository Fact != User Ownership != Resume Claim
```

仓库可以证明“项目存在 Outbox / Workflow / CLI”等能力，不能单凭代码证明“由用户独立设计并实现”。

### 3.3 Resume Bootstrap

目标岗位已知且已有足够事实时，可以先生成 provisional draft，让用户尽早看到候选表达。

Bootstrap Draft 不是事实源；未确认 Ownership、Result、Metric 不能因为 Draft 看起来合理就自动升级。

### 3.4 Experience Mining

继续验证：

```text
Ownership
→ Action / Mechanism
→ Context / Problem
→ Result / Metric
→ 必要的 Decision / Tradeoff
```

完成后形成可追溯 Experience / Claim / Metric。

### 3.5 Resume Strategy

Strategy 回答“写什么”：

- 哪些 Experience 保留；
- 哪些 Claim 与 Target Role / JD 最相关；
- 哪些内容因为证据弱、重复或空间成本高而舍弃；
- Skills / Experience / Projects / Education 如何分配内容预算。

JD 只用于选材：

```text
JD Requirement → Search Existing Claims → Select / Reframe
```

禁止：

```text
JD Requirement → Invent Claim → Write Resume
```

### 3.6 Resume Generation

Generation 回答“怎么写成 Resume View”：

- 按 Strategy 读取 selected Claims；
- 生成高信息密度 Bullet；
- 记录 `claimIds / metricIds`；
- 做追溯检查；
- 输出 Resume View。

简历不生成 standalone personal summary；页头后直接进入 Skills / Experience / Projects 等内容。

### 3.7 Renderer

Renderer 回答“长什么样、如何构建”。

默认 Renderer：`kami`

默认主题 ID：

```text
kami-default
```

当前映射、主题数量、头像交互、字体、打印与 HTML 构建细节只在 Renderer / template 文档维护，不由 Resume Generation 重复定义。

## 4. Interview Knowledge

默认链路：

```text
Claim
  ↓
Question
  ↓
Generated Reference Answer
  ↓
Candidate Nodes
  ↓
Coverage + Value Evaluation
  ↓
Follow-up Question
  ↺
```

### 4.1 Answer 先讲透，再追问

内部 Generated Answer 保留：

- `overview`：可口述的直接回答与必要项目落点；
- `principleDetail`：机制、Why Layer、具体推演、知识抽象、失败边界与取舍。

当前答案必须先通过 Answer Completeness Gate；Follow-up 不能用来补上一题本来就没解释清楚的核心机制。

### 4.2 Answer-driven，而不是预生成题库

正确：

```text
Question₀
→ Answer₀
→ Node₁
→ Question₁
→ Answer₁
→ Node₂
```

不推荐：

```text
Claim
→ 一次性列出 10 个平行问题
→ 再逐题填答案
```

### 4.3 一答多节点

一个 Answer 可以产生多个高价值 sibling：

```text
Outbox Answer
├── 幂等
├── SKIP LOCKED
├── retry / backoff
└── dead letter
```

全部高价值 sibling 都保留，但默认一次只执行一个。当前深分支耗尽后再返回其余 sibling。

### 4.4 深度由岗位决定

停止不是因为“已经第 5 层 / 第 8 层”，而是因为继续追问已不能增加对 Target Role / Claim 的判断信息。

例如 Agent / 后端岗位可以继续：

```text
Outbox
→ 幂等
→ 并发去重
→ 唯一约束
→ 事务隔离
```

但进入与岗位无关的数据库内核页布局时通常应停止。

### 4.5 默认输出

默认 Interview Knowledge 只交付问题；内部仍生成答案用于驱动下一层。

用户明确要求附答案时，每题外层展示：

```text
**直接回答**
**展开说明**
```

其中展开说明可按问题使用步骤、表格、时间线、流程图或伪代码，不要求两个大段。

系统 Generated Answer 不代表用户已掌握，也不自动变成新的 Career Claim。

## 5. Mock Interview

只有用户明确要求“你来面试我 / 我自己回答 / 评估我的回答”时进入 Mock Interview。

Interview Knowledge 生成系统参考问题与答案；Mock Interview 读取并评估用户实际回答。两者不能混淆。

## 6. Bullet 原则

正式技术简历 Bullet 优先表达：

```text
Action / Ownership
+ Scope / Object
+ Method / Mechanism
+ Problem / Constraint
+ Result / Metric
```

至少包含：

```text
动作 + 对象 + 具体技术机制
```

避免：

```text
负责 XX 相关能力建设。
参与 XX 项目开发。
```

详细规则：

- `policies/resume-writing-policy.md`
- `examples/resume-bullet-patterns.md`

## 7. 安装

`fish-skill` 是一个多 Skill 仓库，`resume-copilot` 实际位于：

```text
skills/resume-copilot/
```

因此**不要把整个仓库直接 clone 成 `.agents/skills/resume-copilot`**；那样 `SKILL.md` 会多嵌套一层。

### Codex 项目级安装

仓库自带 CLI，会把正确的子目录复制到目标位置：

```bash
npx fish-skill install resume-copilot
```

默认结果：

```text
<project>/.agents/skills/resume-copilot/SKILL.md
```

指定其他 Agent 目录：

```bash
npx fish-skill install resume-copilot --target .claude/skills
```

查看可安装 Skill：

```bash
npx fish-skill list
```

已有同名目录时默认拒绝覆盖；只有用户明确传 `--force` 才替换。

## 8. 目录结构

```text
skills/resume-copilot/
├── SKILL.md
├── README.md
├── workflows/
├── policies/
├── schemas/
├── examples/
├── renderers/
├── scripts/
└── templates/
```

不要只复制 `SKILL.md`，因为 Workflow 会按需读取 Policy / Schema / Example / Renderer 文档。

## 9. 推荐调用方式

### 从一段项目经历开始

```text
使用 resume-copilot 帮我整理下面这个项目的简历内容。
目标岗位：Agent 应用开发工程师。
项目：低代码平台
负责：页面编辑器、事件驱动器
关键词：Schema、页面编辑、实时预览
```

### 结合当前仓库

```text
结合当前代码仓库和 resume-copilot，
帮我生成这个项目的简历内容。
目标岗位：后端开发工程师。
```

### 面试问题 + 参考答案

```text
使用 resume-copilot，针对这份简历生成面试问题和完整参考答案，
并继续追问答案中尚未解释充分的高价值技术点。
```

### 模拟面试

```text
使用 resume-copilot 模拟面试我。
不要先给参考答案，我自己回答，你根据我的回答继续追问。
```

## 10. 设计目标

Resume Copilot 更接近：

```text
Career Knowledge System
+ Resume Generator
+ Interview Copilot
```

目标不是把经历“包装得更强”，而是把真实经历组织成信息密度高、目标明确、证据可追溯，并且面试时能继续解释的职业知识系统。