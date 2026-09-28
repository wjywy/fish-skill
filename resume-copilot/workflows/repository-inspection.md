# Repository Inspection Workflow

## 适用场景

用户明确要求结合当前代码仓库 / 工作区 / 某个项目生成简历内容时进入该模式。

## 核心边界

```text
PROJECT Fact != User Ownership != Resume Claim
```

仓库证据统一记录为 `Fact`：
- `sourceType = REPOSITORY`
- `subject = PROJECT`
- `ownership = UNVERIFIED`
- 保留 `evidenceLocations`

## 流程

```text
Current Workspace / Repository
          ↓
   Repository Inspection
          ↓
        Facts
          ↓
  Resume-value Prioritization
          ↓
  Ownership Verification
          ↓
 Verified Experience / Claims
          ↓
      Resume Generation
```

## 渐进式检查

### 第一层：项目画像

优先检查 README、依赖清单、顶层目录、构建 / 部署 / 配置文件，判断项目类型、技术栈和核心模块。

### 第二层：核心能力证据

围绕高简历价值能力检查核心源码、API / Protocol、Workflow / Agent、数据模型、事件 / Outbox / Webhook、缓存、前端性能、鉴权限流、容错恢复等。

### 第三层：结果与规模证据

仅在仓库实际存在时检查 benchmark、performance test、monitoring / metrics、changelog、migration docs、Git / PR / commit。代码中没有的业务收益和线上指标不得推断。

## Fact 要求

仓库事实至少记录：
- `statement`
- `category`
- `sourceType = REPOSITORY`
- `subject = PROJECT`
- `evidenceLocations`
- `confidence`
- `ownership = UNVERIFIED`

## Ownership Verification

只对准备进入 Resume Claim 的高价值事实确认参与程度：OWNER / DIRECT / COLLABORATIVE / OBSERVED / NONE。

用户当前对话已经明确 Ownership 时不重复询问。

## 停止条件

当已有足够证据支撑用户请求的简历条数后停止扫描。用户要 3 条 Bullet 时，优先收集支撑 3–5 个高价值 Claim 的证据，不无边界遍历整个仓库。
