# fish-skill

`fish-skill` 是一个面向 Coding Agent 的可复用 Skill 集合。仓库采用多 Skill Catalog 结构：

```text
skills/<skill-name>/SKILL.md
```

当前包含：

| Skill | 说明 |
| --- | --- |
| `resume-copilot` | 从项目关键词、历史简历、工作材料或当前代码仓库中提取事实，生成可追溯技术简历，并派生 Answer-driven 的深度面试知识链。 |

## 目录结构

```text
fish-skill/
├── package.json
├── README.zh.md
├── README.md
├── bin/
│   └── fish-skill.mjs
└── skills/
    └── resume-copilot/
        ├── SKILL.md
        ├── workflows/
        ├── policies/
        ├── schemas/
        ├── examples/
        ├── renderers/
        ├── scripts/
        └── templates/
```

## 安装方式

### 方式一：fish-skill CLI

```bash
npx fish-skill list
npx fish-skill install resume-copilot
```

默认安装到：

```text
.agents/skills/resume-copilot/
```

指定其他 Skill 根目录：

```bash
npx fish-skill install resume-copilot --target .claude/skills
```

已有同名目录时默认拒绝覆盖；用户明确接受替换时：

```bash
npx fish-skill install resume-copilot --force
```

### 方式二：支持多 Skill Catalog 的 skills CLI

仓库保持 `skills/<name>/SKILL.md` 结构，可由支持该目录发现方式的 Skill 工具按需安装单个 Skill，而不是把整个 monorepo 当成一个 Skill 目录。

例如：

```bash
npx skills add <owner>/fish-skill --skill resume-copilot
```

> 不要直接把整个 `fish-skill` 仓库 clone 成 `.agents/skills/resume-copilot`；`resume-copilot/SKILL.md` 实际位于仓库的 `skills/resume-copilot/` 子目录，整仓 clone 会多嵌套一层。

## Resume Copilot

### 核心事实链

```text
Raw Career Input / Repository
            ↓
           Fact
            ↓
        Experience
            ↓
          Claim
        ↙       ↘
Strategy      Interview Knowledge
   ↓
Resume View
   ↓
Renderer
```

核心边界：

```text
Repository Fact != User Ownership != Resume Claim
```

仓库能证明“项目里存在某能力”，不自动证明该能力由用户本人设计或实现。

### 架构职责

`resume-copilot` 将规则分层维护：

- `SKILL.md`：路由与全局不变量；
- `workflows/`：执行顺序；
- `policies/`：证据、Metric、写作、面试扩展、答案深度与用户可见呈现；
- `schemas/`：内部数据契约；
- `examples/`：行为示例，不新增硬规则；
- `renderers/ / scripts/ / templates/`：视觉与构建实现。

详见 `skills/resume-copilot/README.md`。

### Target Role

生成正式 Resume Bullet / Resume View 前必须明确目标岗位或方向。目标未知时仍可以扫描仓库、抽取 Fact 和整理信息缺口，但不根据 React、Go、LangGraph 等技术词自动猜岗位方向。

### Resume Strategy / Generation / Renderer

```text
Resume Strategy   → 决定写什么
Resume Generation → 把已选事实写成 Resume View
Renderer          → 决定长什么样、如何生成 HTML/PDF
```

简历默认不生成 standalone personal summary；页头后直接进入 Skills / Experience / Projects 等内容。

Renderer 的默认 public theme ID 为 `kami-default`。具体 theme 枚举、模板文件映射、头像、字体与打印实现以 `skills/resume-copilot/schemas/render-options.schema.json` 与 `skills/resume-copilot/renderers/kami/README.md` 为准。

## Interview Knowledge

默认链路：

```text
Claim
  ↓
Question
  ↓
DEEP_STUDY Generated Reference Answer
  ↓
Answer Completeness Gate
  ├───────────────┐
  ↓               ↓
Candidate Nodes   Answer Presentation
  ↓               ↓
Coverage + Value  Natural Markdown
  ↓
Follow-up Question
  ↺
```

### 每个问题都先完整回答

Interview Knowledge 不提供 QUESTION_BANK 式浅回答模式。每一个被物化的 Question 都必须先形成完整、可独立学习的答案，再从 Answer 提取下一层节点。

问题数量和文档长度不是优化目标；不能为了后面还有更多题而压缩当前答案。

### Explanation Backbone + Deep Study Boundary

当前答案在展开大量细节前先识别最小、最有解释力的主轴，例如：

```text
module-relative vs workspace-relative
structural validity → referential integrity → semantic evidence
preparation → commit → recovery
```

但 DEEP_STUDY 不等于穷尽整个知识邻域。额外内容只有在当前结论、因果链、walkthrough 或必要 boundary 依赖它时才完整展开；非必要但高价值的知识留给 Candidate Node / Follow-up。

### Answer-driven 深链

不先生成完整题库：

```text
Question₀
→ Complete Answer₀
→ Candidate Nodes
→ Question₁
→ Complete Answer₁
```

一个 Answer 可以产生多个高价值 sibling。全部保留，但默认一次只执行一个；当前深分支耗尽后再返回其他 sibling。

### Answer Presentation Policy

内部仍可以使用 `overview / principleDetail` 保证答案知识完整，但它们不是用户可见栏目。

Question Dimension 描述“想考察什么”；Explanation Shape 描述“答案怎么组织”。二者不建立一一映射。

可见答案由 `skills/resume-copilot/policies/answer-presentation-policy.md` 选择主 Shape，例如：

```text
PROSE
CAUSAL_CHAIN
SEQUENCE
COMPARISON_MATRIX
TIMELINE
STATE_TRANSITION
COMPONENT_FLOW
EVIDENCE_CHAIN
DECISION_FRAME
```

最终答案不固定展示 `直接回答 / 展开说明`，也不强制把 Backbone 渲染为 `A != B` 或 `A → B → C`。

### 深度边界

递归停止由目标岗位相关性与信息增益决定，不按固定 5 层、8 层停止，也不因为已经生成很多问题而停止。项目 Grounding 不足只影响项目场景化，不阻止可靠的通用技术解释。

### Execution Evidence / Citation Locality

只有当前任务中真实执行命令并取得结果，才可以写“我刚运行通过 / 当前 78/78 / 实测成功”。读取测试代码、README、package manifest 或历史测试报告不能冒充本轮执行结果。

当运行环境支持 citation / provenance 时，引用应尽量靠近它实际支持的项目事实或本轮执行 Claim，而不是默认堆成独立证据列表。

### 默认 Markdown

Interview Knowledge 默认就是完整 Q&A：

```markdown
# 核心主题

## 面试问题

<完整 DEEP_STUDY Answer，经 Answer Presentation Policy 自然渲染>

## 根据上一层 Answer 产生的 Follow-up

<该题自己的完整 DEEP_STUDY 答案>
```

面试节点调度规则以 `skills/resume-copilot/policies/knowledge-expansion-policy.md` 为唯一 Source of Truth；答案深度与 Deep Study Boundary 以 `skills/resume-copilot/policies/interview-depth-policy.md` 为准；用户可见呈现以 `skills/resume-copilot/policies/answer-presentation-policy.md` 为准。

只有用户明确要求“模拟面试我 / 我自己回答”时才进入 Mock Interview。系统 Reference Answer 不代表用户已经掌握，也不自动成为 Career Claim。

## 开发检查

检查 Skill 可发现性：

```bash
npm run check
```

运行 deterministic tests + Resume Copilot architecture contract：

```bash
npm test
```

只检查架构护栏：

```bash
npm run test:architecture
```

architecture contract 用来防止常见回归，例如：Scheduler 被复制回入口层、Presentation 重新塞回 Depth Policy、Question Dimension 与 Markdown Template 再次绑定、Necessary/Interesting 被持久化成 Node 状态、Example 重新承载硬规则、Interview 重新退化成 question-only / 固定两段式输出等。

## 发布到 npm

发布前：

```bash
npm test
npm pack --dry-run
npm publish
```

## License

MIT
