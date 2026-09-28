# Repository Project Mode Example

## 用户输入

> 结合当前 a2a-platform 项目，用 resume-copilot 帮我生成 3 条 Agent 工程师简历内容。

## Skill 行为

### 1. 主动读取仓库

发现：
- `@a2a-js/sdk`
- Task / Status / Artifact / Message 模型
- PostgreSQL Outbox
- Redis Pub/Sub
- SSE endpoint
- LangGraph workflow
- Supervisor / Specialist agents

### 2. 形成 Repository-sourced Facts

```text
RF-01 项目基于 @a2a-js/sdk 接入远端 Agent Card。
RF-02 项目将任务事件写入 PostgreSQL Outbox。
RF-03 项目使用 Redis Pub/Sub 做跨实例事件广播。
RF-04 项目使用 LangGraph 编排 Supervisor + Specialist Agent。
```

所有 Ownership 初始均为 `UNVERIFIED`。

### 3. 只确认高价值 Ownership

> A2A 协议接入、Outbox 长任务链路、LangGraph Workflow 这三部分分别是你主导、直接实现还是协作完成？

用户：
> 都是我自己设计和主要实现的。

### 4. 转为 Facts / Claims

允许使用 `OWNER / DIRECT` 强度形成 Claim。

### 5. 生成 Bullet

- 基于 `@a2a-js/sdk` 接入远端 Agent Card，统一 HTTP+JSON / JSON-RPC / SSE 协议调用链路，覆盖消息发送、流式通信及 Task 查询、取消与重订阅等核心能力。
- 围绕 long-running Task 设计可恢复异步通信链路，将 Task / Status / Artifact / Message 事件写入 PostgreSQL 快照与事务 Outbox，并通过 Redis Pub/Sub + SSE 支撑跨实例实时分发与断线恢复。
- 基于 LangGraph + Postgres Checkpoint 构建有状态 Multi-Agent Workflow，通过 Supervisor + Specialist Agent 编排实现任务拆解、动态路由、参数补全、上下文传递与结果聚合。

## 核心边界

如果用户没有确认 Ownership，则只能先输出：
- 仓库能力摘要
- 候选简历方向
- 待确认的问题

不能直接使用“设计并实现 / 主导”等人物表述。
