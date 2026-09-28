# fish-skill

`fish-skill` 是一个面向 Coding Agent 的可复用 Skill 集合。仓库采用多 Skill 目录结构，每个 Skill 都是一个独立目录，并以 `SKILL.md` 作为入口。

当前包含：

| Skill | 说明 |
| --- | --- |
| `resume-copilot` | 从项目关键词、历史简历、工作材料或当前代码仓库中提取事实，生成技术简历，并派生面试知识树。 |

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
        └── templates/
```

以后新增 Skill 时，继续放在：

```text
skills/<skill-name>/SKILL.md
```

不需要改变根目录结构。

## 安装方式

### 方式一：通过 npm 包安装并复制指定 Skill

发布到 npm 后，可以直接：

```bash
npx fish-skill list
npx fish-skill install resume-copilot
```

默认会安装到当前项目：

```text
.agents/skills/resume-copilot/
```

也可以指定 Agent 的 Skill 目录：

```bash
npx fish-skill install resume-copilot --target .claude/skills
npx fish-skill install resume-copilot --target .codex/skills
```

如果目标目录已经存在，需要明确覆盖：

```bash
npx fish-skill install resume-copilot --force
```

> npm 上的最终包名如果不是 `fish-skill`，将上面的命令替换为实际发布包名即可。

### 方式二：使用 skills CLI 从 GitHub 仓库安装

仓库保持 `skills/<name>/SKILL.md` 结构后，也兼容 `skills` CLI 的仓库发现方式。`skills` CLI 会扫描仓库的 `skills/` 目录寻找 Skill。可使用：

```bash
npx skills add <owner>/fish-skill --skill resume-copilot
```

安装全部 Skill：

```bash
npx skills add <owner>/fish-skill --all
```

这与 `baoyu-skills` 的多 Skill 仓库使用方式一致：仓库作为 Skill Catalog，用户按需安装单个 Skill，而不是把所有 Skill 一次性塞进 Agent 上下文。

## Resume Copilot

### 根据一段项目关键词生成简历

```text
项目：低代码平台
负责：页面编辑器、事件驱动器
关键词：Schema、页面编辑、实时预览

结合 resume-copilot 帮我生成简历内容。
```

### 结合当前代码仓库生成简历

```text
结合当前项目和 resume-copilot，帮我生成 3 条 Agent 应用开发工程师方向的简历内容。
```

Skill 会先读取仓库事实，但遵守：

```text
Repository Fact != User Ownership != Resume Claim
```

即代码证明项目里存在某项能力，不等于自动认定该能力由用户设计或实现。

### 生成完整简历

内容确定后，Resume Copilot 可以使用 Kami Renderer 输出 HTML / PDF。默认主题为 `kami-default`，也可以选择 Navy、Teal、Forest、Burgundy、Sepia、Copper 等主题。

### 面试准备

默认使用 Interview Knowledge 模式：

```text
Resume Claim
  ↓
问题
  ↓
参考答案
  ↓
提取答案中的高价值知识节点
  ↓
继续递归生成追问与答案
```

只有用户明确要求模拟面试时，才进入 Mock Interview，让用户自己回答并评估回答质量。

## 开发新的 Skill

创建目录：

```bash
mkdir -p skills/my-skill
```

并至少提供：

```text
skills/my-skill/
└── SKILL.md
```

`SKILL.md` 应包含 YAML frontmatter：

```md
---
name: my-skill
description: 描述这个 Skill 做什么，以及什么时候应该使用。
---
```

检查仓库中可发现的 Skill：

```bash
npm run check
# 或
npx fish-skill check
```

## 发布到 npm

发布前先检查打包内容：

```bash
npm pack --dry-run
```

登录 npm：

```bash
npm login
```

发布：

```bash
npm publish
```

之后用户即可通过：

```bash
npx fish-skill install resume-copilot
```

安装指定 Skill。

## 为什么同时支持 npm 与 GitHub

GitHub / `npx skills add` 更适合公开 Skill Catalog 和发现；npm 包更适合版本管理、企业私有 Registry、锁定版本以及把 Skill 分发纳入现有 Node.js 工具链。

例如可以锁定 npm 版本：

```bash
npx fish-skill@0.1.0 install resume-copilot
```

## License

MIT
