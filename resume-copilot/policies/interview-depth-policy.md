# Interview Depth Policy

## 目的

控制 Interview Knowledge 与 Mock Interview 的追问深度。

## 两种模式

### Interview Knowledge

深度代表系统为某个 Resume Claim 准备知识树的展开深度。

```text
Claim → Q&A → Knowledge Node → Follow-up Q&A
```

### Mock Interview

深度代表根据用户真实回答继续追问的层数。

```text
Question → User Answer → Assessment → Follow-up
```

两者共用风险判断，但不得混用 Answer 状态。

## Risk Heuristics

HIGH：
- “设计 / 架构 / 主导 / 保证 / 高可用 / 一致性 / 性能提升”等强措辞
- 分布式系统、并发、一致性、事务、恢复机制
- 核心量化指标

MEDIUM：
- 自己直接实现的标准技术方案
- 目标岗位核心框架 / 协议

LOW：
- 辅助技术
- 与目标岗位关联弱
- 简历中只弱暴露

## 推荐深度

- LOW：1–2 层
- MEDIUM：3–5 层
- HIGH：5–8 层

深度不是完成指标。优先使用语义停止条件。

## 停止

- 已解释当前 Claim 必要的核心机制
- 已覆盖关键失败与取舍
- 继续深入明显偏离简历暴露程度
- 节点被其他分支覆盖
- 新问题只剩百科细节
- 达到最大深度兜底
