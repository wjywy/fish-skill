# Resume Copilot

> 面向 Coding Agent 的简历生成与面试准备 Skill。
>
> 从用户提供的项目关键词、历史简历、工作材料或当前代码仓库中提取事实，经过 Ownership / Evidence 验证后生成高信息密度的技术简历，并围绕简历中的 Claim 自动展开面试问题与参考答案。

## 1. Resume Copilot 是什么

Resume Copilot 不是简单的“简历润色器”。

它的核心目标是：

1. 从用户输入或当前代码仓库中提取可追溯的项目事实；
2. 区分“项目中存在某能力”和“用户本人实际负责某能力”；
3. 将确认后的事实组织为 Experience、Claim 和 Metric；
4. 在生成正式简历内容前确认目标岗位 / 方向；
5. 根据目标岗位选择更相关的 Claim；
6. 按技术简历的标准表达方式生成 Resume Bullet；
7. 使用 Kami 模板生成 HTML / PDF 简历；
8. 针对简历中的每个 Claim 自动生成面试问题、参考答案，并从答案中的关键知识点继续递归追问。

核心链路：

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

## 2. 适用场景

Resume Copilot 主要适合以下几种使用方式。

### 2.1 根据项目关键词生成简历

用户只需要明确“哪些关键词属于同一个项目 / 经历”，不需要填写复杂表单。

例如：

```text
项目：低代码平台
负责：页面编辑器、事件驱动器
关键词：Schema、页面编辑、实时预览
```

Skill 会围绕这一段经历生成候选简历内容，并只针对影响简历质量的关键信息继续追问。

### 2.2 结合当前代码仓库生成简历

这是 Resume Copilot 在 Coding Agent 中的重要使用方式。

例如：

```text
结合当前项目和 resume-copilot，帮我生成 3 条 Agent 应用开发工程师方向的简历内容。
```

Skill 会优先检查当前仓库中的 README、依赖、目录结构、核心源码、API、Workflow、数据模型等信息，抽取 Repository Fact。

需要注意：

```text
Repository Fact != User Ownership != Resume Claim
```

仓库能够证明“项目里存在 Outbox”，但不能自动证明“Outbox 是用户设计并实现的”。必要时 Skill 会向用户确认 Ownership。

### 2.3 优化已有简历

用户可以提供旧简历，并要求：

```text
结合 resume-copilot 帮我优化这份简历，重点投 Agent 应用开发工程师。
```

Skill 会解析已有内容，识别已有 Claim、弱表达、重复内容和信息缺口，再进行针对性改写。

### 2.4 根据 JD 调整简历

例如：

```text
这是目标岗位 JD，结合我的 Career Profile 帮我生成一版针对这个岗位的简历。
```

Resume Strategy 会根据目标岗位 / JD 的要求，从已经验证的 Claim 中选择更相关的内容，而不是根据 JD 编造新的项目经历。

### 2.5 面试准备

默认模式是 Interview Knowledge：

```text
Claim
  ↓
Question
  ↓
Generated Reference Answer
  ↓
从答案中提取关键知识点
  ↓
继续生成 Follow-up Q&A
```

例如参考答案中出现：

```text
事务 Outbox
Redis Pub/Sub
幂等
Event ID
```

Skill 会先判断这些节点在当前答案中的覆盖程度；只有“仍有高信息增益且尚未解释充分”的节点进入 Expansion Queue。最新答案产生的高价值后代优先于横向 Root Queue，从而形成一条主题内连续下钻的追问链。

这里的停止条件不是“离最初关键词越来越远”。根 Claim 只决定起点，目标岗位 / JD 与信息增益决定边界；如果当前答案已经充分解释一个节点，也不为了增加题量重复追问。项目 Grounding 不足只影响项目个性化旁白，不会阻止可靠的通用技术递归。固定 5 层、8 层之类的深度只能作为异常防护。

如果用户明确要求：

```text
你来模拟面试我，我自己回答，不要先给答案。
```

才会进入 Mock Interview 模式。

## 3. 核心原则

Resume Copilot 遵循以下原则：

### 3.1 Target direction before final wording

生成正式 Resume Bullet / Resume View 前必须明确目标岗位或方向。

如果用户没有提供，Skill 会主动询问，例如：

```text
这份简历主要投什么方向？例如前端、后端、Agent、产品、全栈，或者直接给我具体岗位名称。
```

不会仅根据 React、Go、LangGraph、Redis 等技术关键词自行猜测岗位方向。

目标方向未知时仍然可以读取旧简历、扫描仓库、抽取 Facts；只是不进入正式岗位定向文案生成。

### 3.2 Draft early, verify continuously

当已有信息足够形成候选简历时，先输出 Draft，再补关键缺口，不把用户困在长问卷里。

### 3.3 Source → Fact → Claim → Wording

正式简历内容必须能够追溯到 Fact 和 Claim。

### 3.4 Never silently upgrade ownership

不能把：

```text
参与 / 协作 / 使用 / 了解
```

静默改写成：

```text
负责 / 主导 / 设计 / 架构
```

### 3.5 Metrics need provenance

数字必须来源于用户确认、历史材料、仓库证据或其他可靠来源，不能为了让简历更好看自动编造。

### 3.6 Repository evidence is project evidence, not ownership evidence

代码仓库只能证明项目中存在某项能力，不自动代表用户本人完成了该实现。

### 3.7 High-information bullets, not duty statements

优先生成：

```text
动作 / Ownership
+ 对象 / Scope
+ 技术方案 / Mechanism
+ 问题 / Constraint
+ 结果 / Metric
```

而不是：

```text
负责 XX 相关工作。
参与 XX 项目建设。
```

## 4. 技术简历 Bullet 示例

推荐：

> 设计并实现低代码事件驱动机制，将组件事件、触发条件与动作配置统一抽象至 Schema，通过事件解析与运行时执行链路支撑组件间交互，降低页面交互逻辑的硬编码成本。

不推荐：

> 负责低代码平台事件相关能力建设。

Resume Copilot 内置了多类写作 Pattern，包括：

- 机制 / 架构建设型；
- 性能优化型；
- 工程效率型；
- 数据 / RAG 检索链路型；
- 大规模系统处理型；
- 协议 / 异步通信型。

规则见：

```text
policies/resume-writing-policy.md
examples/resume-bullet-patterns.md
```

## 5. Kami 简历模板

Resume Copilot 内置 Kami Renderer。

默认主题：

```text
kami-default
```

用户也可以选择：

```text
kami-ivory
kami-mono
kami-navy
kami-slate
kami-teal
kami-forest
kami-burgundy
kami-sepia
kami-copper
```

用户没有指定主题时，默认使用 `kami-default`，不会阻塞简历生成。

主题只影响视觉呈现，不影响 Resume Strategy 和 Resume Content。

## 6. 目录结构

```text
resume-copilot/
├── README.md
├── SKILL.md
│
├── workflows/
│   ├── input-intake.md
│   ├── repository-inspection.md
│   ├── resume-bootstrap.md
│   ├── experience-mining.md
│   ├── resume-strategy.md
│   ├── resume-generation.md
│   ├── interview-knowledge.md
│   └── mock-interview.md
│
├── policies/
│   ├── bootstrap-generation-policy.md
│   ├── evidence-policy.md
│   ├── repository-evidence-policy.md
│   ├── metric-policy.md
│   ├── resume-writing-policy.md
│   ├── knowledge-expansion-policy.md
│   ├── interview-depth-policy.md
│   └── answer-assessment-policy.md
│
├── schemas/
│   ├── raw-career-input.schema.json
│   ├── fact.schema.json
│   ├── experience.schema.json
│   ├── claim.schema.json
│   ├── metric.schema.json
│   ├── career-profile.schema.json
│   ├── resume-strategy.schema.json
│   ├── resume-view.schema.json
│   └── ...
│
├── examples/
│   ├── resume-bullet-patterns.md
│   ├── repository-project-mode.example.md
│   └── ...
│
├── renderers/
│   └── kami/
│       └── README.md
│
└── templates/
    ├── kami-base.html
    ├── kami-navy.html
    ├── kami-teal.html
    └── ...
```

## 7. 安装

Resume Copilot 推荐通过 Git 仓库直接分发和安装，而不是让用户手动下载 ZIP。

> 发布前请将下文中的 `<GITHUB_USER>/<REPOSITORY>` 替换为 Resume Copilot 的实际 GitHub 仓库地址。

### 7.1 快速安装（推荐）

如果 Skill 已发布到 GitHub，可直接通过 `skills` CLI 联网安装：

```bash
npx skills add <GITHUB_USER>/<REPOSITORY>
```

例如仓库最终为：

```text
https://github.com/<GITHUB_USER>/<REPOSITORY>
```

则安装命令为：

```bash
npx skills add <GITHUB_USER>/<REPOSITORY>
```

这种方式适合 Claude Code、Codex 等支持 Agent Skills 的环境；Skill 的完整目录会从网络仓库获取，而不是只复制单个 `SKILL.md`。

### 7.2 直接让 Coding Agent 安装

也可以直接告诉 Coding Agent：

```text
请帮我安装 github.com/<GITHUB_USER>/<REPOSITORY> 中的 resume-copilot Skill。
```

如果 Agent 具备联网、GitHub 访问和本地文件写入能力，应优先直接从仓库获取完整 Skill。

### 7.3 Codex 项目级安装

如果只希望当前项目使用 Resume Copilot，可以直接通过网络将仓库安装到项目的 `.agents/skills` 下。Codex 会扫描该目录中的 Skill。

```bash
mkdir -p .agents/skills
git clone https://github.com/<GITHUB_USER>/<REPOSITORY>.git \
  .agents/skills/resume-copilot
```

安装后的结构应类似：

```text
<project>/
└── .agents/
    └── skills/
        └── resume-copilot/
            ├── SKILL.md
            ├── workflows/
            ├── policies/
            ├── schemas/
            ├── examples/
            ├── renderers/
            └── templates/
```

不要只下载 `SKILL.md`，因为 Resume Copilot 会按需读取 `workflows/`、`policies/`、`schemas/`、`examples/` 和 `templates/`。

### 7.4 更新 Skill

如果通过 Git 安装，可以直接更新仓库：

```bash
cd .agents/skills/resume-copilot
git pull
```

如果通过 `skills` CLI 安装，则使用对应 CLI 的更新机制重新拉取最新版本。

## 8. 发布要求

为了让用户能够通过网络直接安装，建议将 Resume Copilot 作为一个独立 Git 仓库发布，并让 `SKILL.md` 位于仓库根目录：

```text
resume-copilot/
├── README.md
├── SKILL.md
├── workflows/
├── policies/
├── schemas/
├── examples/
├── renderers/
└── templates/
```

这样用户只需要知道 GitHub 仓库地址，就可以直接执行：

```bash
npx skills add <GITHUB_USER>/<REPOSITORY>
```

而不需要再经历“下载压缩包 → 解压 → 手动复制”的流程。

## 9. 推荐调用方式

### 9.1 从一段项目经历开始

```text
使用 resume-copilot 帮我整理下面这个项目的简历内容。

项目：低代码平台
负责：页面编辑器、事件驱动器
关键词：Schema、页面编辑、实时预览
```

### 9.2 使用当前 Coding Agent 项目

```text
结合当前代码仓库和 resume-copilot，帮我生成这个项目的简历内容。
目标岗位：Agent 应用开发工程师。
生成 3 条 Bullet。
```

### 9.3 完整生成一份简历

```text
使用 resume-copilot，根据下面这些工作经历和项目经历帮我生成一份完整简历。
目标岗位：前端开发工程师。
使用 kami-navy 主题。
```

如果不指定主题：

```text
使用 resume-copilot 帮我生成完整 HTML 简历。
```

默认使用 `kami-default`。

### 9.4 针对简历准备面试

```text
使用 resume-copilot，针对这份简历生成完整的面试问题和参考答案，并继续追问参考答案中出现的重要技术点。
```

### 9.5 模拟面试

```text
使用 resume-copilot 模拟面试我。
不要给参考答案，我自己回答，你根据我的回答继续追问。
```

## 10. Repository Project Mode

当用户明确说：

```text
当前项目
这个仓库
结合代码
结合当前 workspace
```

Skill 应优先进入 Repository Inspection，而不是要求用户重新描述项目技术栈。

推荐分析顺序：

```text
README / manifest / 目录结构
        ↓
核心源码 / API / Workflow / DB Model
        ↓
高价值机制：Agent / Event / Cache / Performance / Reliability
        ↓
必要时再查看测试、Benchmark、Git 信息
```

分析到已经能够支撑目标 Resume Bullet 后应该停止，不需要为了写几条简历扫描整个大型仓库。

## 11. Resume Strategy

Resume Strategy 解决的不是“句子怎么写”，而是：

```text
这份简历针对什么岗位？
哪些经历应该保留？
哪些 Claim 应该重点展示？
内容顺序怎么排？
每一段应该强调什么？
```

例如，同一个项目可能同时包含：

```text
LangGraph
Outbox
SSE
RBAC
Performance
React
```

投 Agent 应用开发工程师时，会优先展示 Agent Workflow、长任务、RAG、异步通信等 Claim；投前端开发工程师时，则可能更强调实时交互、性能和工程化能力。

事实不变，Resume View 不同。

## 12. 面试知识递归

Resume Copilot 默认不是只生成一层面试题。

例如：

```text
Q：为什么使用 Outbox？

A：为了解决数据库更新和消息发送之间的双写一致性问题……
```

回答中出现：

```text
双写一致性
本地事务
Worker
幂等
```

Skill 会继续生成：

```text
什么是双写一致性？
为什么 Task 和 Outbox Event 要放在同一个事务？
Worker 重复投递怎么办？
如何实现幂等？
```

只递归有面试价值的节点，避免出现无意义的无限知识展开。

## 13. 设计目标

Resume Copilot 希望解决的不是：

> “怎么把简历写得更厉害？”

而是：

> “怎么从真实经历中生成一份信息密度高、针对目标岗位、并且每一个技术 Claim 都可以继续展开解释的简历？”

因此 Resume Copilot 更接近：

```text
Career Knowledge System
+ Resume Generator
+ Interview Copilot
```

而不仅仅是一个 Resume Writer。


## Interview Knowledge 默认 Markdown 格式

面试准备默认输出为可直接复习的 Markdown。每个参考答案固定分两部分：先一段话的逻辑与项目场景，再一节展开的通用原理。

```markdown
# 简历要点核心主题

## 面试问题

第一部分：一段话的逻辑与项目场景

**原理详解**

第二部分：分层展开的通用原理、机制、边界与取舍

## 继续追问的问题

第一部分：一段话的逻辑与项目场景

**原理详解**

第二部分：分层展开的通用原理、机制、边界与取舍
```

第一部分保持简洁：给出结论、机制主线，以及它在本项目中的落点。
第二部分 `**原理详解**` 承担详细度，是可直接复习的主体。

内部使用的 Claim、Evidence、项目 Grounding 状态、Node Type、depth、停止条件等信息默认不会出现在最终文档中。


### Interview Knowledge 答案原则

面试问题的参考答案优先保证技术内容准确完整，再结合已验证的项目背景做场景化说明。

- **第一部分（逻辑与项目场景）** 用一段话回答“是什么 / 为什么 / 在本项目里怎么落地”，项目场景只能来自已验证事实。
- **第二部分（原理详解）** 不依赖项目个性化事实，必须完整、准确地展开通用原理。
- 项目证据不足时仍应输出完整的两部分内容，只对无法确认的项目实现、选型动机或实际效果增加简短旁白提醒，不输出内部证据状态。


## Interview Scheduler

Interview Knowledge 使用 Answer-driven 调度：`Expansion Queue > Root Queue`。每个 Generated Answer 都必须完成 Candidate Node 提取与判定；只要存在高价值 `UNEXPANDED` 节点，Sibling Transition Gate 就阻止横向切题。
