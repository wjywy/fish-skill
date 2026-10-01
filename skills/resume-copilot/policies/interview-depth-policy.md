# Interview Depth Policy

## 目的

控制 Interview Knowledge 与 Mock Interview 的递归边界。

核心原则：**追问深度不是固定层数，也不是技术主题白名单，而是由继续追问是否还能带来岗位判断信息决定。**

根 Claim 只决定起点；Target Role / JD 与当前 Claim 决定边界。

## 深度判定

每产生一个新的 Candidate Knowledge Node，调用 `./knowledge-expansion-policy.md` 的高价值判定流程。

只要节点仍满足：

- 对目标岗位有实质相关性，且
- 能继续解释当前 Claim，或
- 能显著增加对候选人能力的判断信息

就可以继续深入。

不要把 `FAILURE / CONCURRENCY / CONSISTENCY` 等类型本身当作继续追问理由。

## Role Relevance

内部可以记录：

- `CORE`
- `RELATED`
- `CONTEXTUAL`
- `OUT_OF_SCOPE`

但这是对判定结果的描述，而不是白名单。

### CORE

问题直接对应目标岗位的关键职责或 JD 明确能力。

### RELATED

不是岗位核心关键词，但回答会显著增强对岗位能力的判断。

### CONTEXTUAL

主要用于解释上层 Claim；是否继续取决于信息增益。

### OUT_OF_SCOPE

继续深入已经几乎不能改变对目标岗位能力的判断。

## 深入示例

目标岗位：Agent / 后端平台工程师

```text
Outbox
→ 为什么需要 Outbox
→ 双写一致性
→ 本地事务
→ Worker 重复执行
→ 幂等
→ 并发去重
→ 唯一约束
→ 事务隔离
```

这条链可以持续，因为每一步仍能增加对可靠性设计、数据一致性和工程实现能力的判断。

如果再进入：

```text
事务隔离
→ PostgreSQL WAL 二进制编码
→ page layout
→ B-Tree page split 内核实现
```

目标岗位不是数据库内核开发时，继续追问已经很难改变岗位判断，应停止。

## 停止条件

只在以下情况停止当前分支：

1. 高价值判定流程输出 DROP
2. 新问题已经不能增加岗位判断信息
3. 当前 Claim 已经可以被充分解释，新的节点也没有额外区分度
4. 节点已被其他问题实质覆盖
5. 出现语义环路
6. 无法生成可靠的通用技术答案（仅项目 Grounding 不足不属于该情况）
7. 达到实现层 `hardMaxDepth` 安全兜底

第 7 条只用于防止异常无限递归，不是推荐深度。


## Project Grounding 与深度无关

`VERIFIED / PARTIAL / INSUFFICIENT` 描述的是项目场景化程度，不直接决定是否继续追问。一个节点即使 `projectGrounding=INSUFFICIENT`，只要通用技术答案可靠且对岗位仍有信息增益，就可以继续展开；涉及项目细节时直接区分当前实现与假设方案，不输出单独旁白。
