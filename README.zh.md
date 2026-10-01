# fish-skill

`fish-skill` 是一个面向 Coding Agent 的可复用 Skill 集合。仓库采用多 Skill Catalog 结构：

```text
skills/<skill-name>/SKILL.md
```

当前包含：

| Skill | 说明 |
| --- | --- |
| `resume-copilot` | 从项目关键词、历史简历、工作材料或当前代码仓库中提取事实，生成可追溯技术简历，并派生面试知识树。 |

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
- `policies/`：证据、Metric、写作、面试扩展和深度判定；
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

Renderer 的默认 public theme ID 为：

```text
kami-default
```

具体 theme 枚举、模板文件映射、头像、字体与打印实现以：

```text
skills/resume-copilot/schemas/render-options.schema.json
skills/resume-copilot/renderers/kami/README.md
```

为准。根 README 不复制主题列表，避免视觉实现调整后文档漂移。

## Interview Knowledge

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
Coverage + Value
  ↓
Follow-up Question
  ↺
```

### 当前答案先讲透

系统参考答案内部使用：

- `overview`：直接、可口述的核心回答；
- `principleDetail`：完整机制、Why Layer、具体推演、知识抽象与必要边界。

当前答案必须先完整，再从答案提取下一层节点；不能把当前问题本应解释清楚的核心机制推给下一道 Follow-up。

### Answer-driven 深链

不先生成完整题库。

```text
Question₀
→ Answer₀
→ Node₁
→ Question₁
→ Answer₁
→ Node₂
```

一个 Answer 可以产生多个高价值 sibling。全部保留，但默认一次只执行一个；当前深分支耗尽后再返回其他 sibling。

### 深度边界

递归停止由目标岗位相关性与信息增益决定，不按固定 5 层、8 层停止。项目 Grounding 不足只影响项目场景化，不阻止可靠的通用技术解释。

### 默认 Markdown

默认面试预设只展示问题：

```markdown
# 简历要点核心主题

## 面试问题

## 继续追问的问题
```

用户明确要求附答案时才显示：

```markdown
**直接回答**

**展开说明**
```

`展开说明` 可以根据题目使用步骤、表格、时间线、流程图或伪代码，不要求写成一个大段。

面试节点调度规则以：

```text
skills/resume-copilot/policies/knowledge-expansion-policy.md
```

为唯一 Source of Truth；答案完整度与递归边界以：

```text
skills/resume-copilot/policies/interview-depth-policy.md
```

为准。

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

只检查本次新增的架构护栏：

```bash
npm run test:architecture
```

architecture contract 会防止常见回归，例如：

- Interview Scheduler 被复制回 `SKILL.md` / Workflow；
- Example 重新承载硬规则；
- Generated Answer 重复持久化派生完成状态；
- `stopReason / decisionReason` 双字段复活；
- Resume Strategy 重新出现 standalone Summary；
- Resume Generation 重新维护 Renderer 的模板默认值或字体实现。

## 发布到 npm

发布前：

```bash
npm test
npm pack --dry-run
npm publish
```

包内 `bin/fish-skill.mjs` 会从 `skills/` 发现包含 `SKILL.md` 的目录，并将指定 Skill 完整复制到目标 Agent Skill 根目录。

## License

MIT
