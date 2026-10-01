# Interview Depth Policy

## 目的

Interview Depth 同时约束三个不同问题：

1. **Answer Depth**：当前这道题本身要解释到什么程度才算完整。
2. **Presentation Planning**：完整答案用什么结构呈现最容易理解。
3. **Recursive Depth**：当前知识分支还应不应该继续追问。

这三件事必须分开判断。`knowledge-expansion-policy.md` 负责“从答案产生哪些节点、如何评估与调度”；本文件负责“当前答案是否讲透”“怎么自然呈现”以及“递归何时停止”。

---

# 一、Answer Depth：每题默认 DEEP_STUDY

## 1. 当前答案先完整，再进入 Follow-up

Follow-up Question 用于进一步深化、验证或扩展当前答案，**不得承担“补完上一题本应解释清楚的核心机制”的职责**。

Interview Knowledge 不提供 QUESTION_BANK 式浅回答模式。每一个被物化的 Question 都按 DEEP_STUDY 标准回答：问题数量、文档长度、尚未执行的节点数量都不能成为压缩当前答案的理由。

在 Node Extraction 前先做 Answer Completeness Check。只看当前这道题，读者是否已经能理解：

- 核心结论是什么；
- 关键机制为什么成立；
- 为什么采用这一设计（如果存在真实设计动机）；
- 能否用一个具体例子或过程推演；
- 哪些边界会改变结论；
- 项目当前实际做到哪里；
- 哪些内容只是通用原理或假设改造。

如果不能，先补当前答案，再提取 Candidate Node。

## 2. Internal Answer Slots != Visible Template

内部 `Generated Answer` 当前仍保留：

- `overview`：核心结论与必要项目落点；
- `principleDetail`：完整机制、Why Layer、walkthrough、边界、取舍与必要抽象。

这两个字段用于内部 completeness，不是最终 Markdown 的固定分栏。

用户可见答案：

- 开头必须自然、直接回答当前问题；
- 不固定显示 `直接回答 / 展开说明`；
- 不显示 `overview / principleDetail`；
- 不因为内部只有两个字段，就把所有内容压成两个大段。

## 3. Mechanism Chain

机制 / 实现 / 架构类问题，答案至少应覆盖真正影响结论的因果链：

```text
输入 / 前提
→ 关键参与者
→ 执行步骤
→ 状态或数据变化
→ 哪一步使结果成立
→ 会改变结论的失败边界 / 取舍
```

不要求把这些词机械写成小标题，但不能只罗列组件名。

例如：

```text
PostgreSQL + Redis + SSE + Outbox
```

不是完整解释。必须说明谁持久化状态、谁记录可靠事件、谁做跨实例广播、谁只是连接层，以及连接断开后为什么任务仍能继续。

## 4. No Terminology-as-Explanation

不得用一个技术名词替代机制解释。

以下都不完整：

```text
通过 Outbox 保证可靠性。
通过 MVCC 保证一致性。
通过 Checkpoint 实现恢复。
通过 Redis 做分布式协调。
通过 Reranker 提升检索效果。
```

一旦结论依赖某个机制，至少继续解释：

- 该机制实际保存 / 比较 / 更新 / 传递什么；
- 哪一步带来了目标性质；
- 在什么条件下会失效或需要额外保护。

## 5. Why Layer

对于架构、数据模型、并发、一致性、Agent、检索、测试设计等非纯事实问题，仅说明“代码怎么做”通常不够。

当存在真实设计动机时，继续回答：

- 为什么需要这一层设计；
- 它解决的核心矛盾是什么；
- 去掉这一层会发生什么；
- 它对应什么通用工程原则。

纯定义、命令说明或简单事实题不强行补 Why Layer。

## 6. Knowledge Abstraction

当项目实现体现了可迁移的通用技术概念时，在 Project Grounding 后抽象一层知识模型。

例如：

```text
import.meta.url vs process.cwd()
→ module-relative resource vs workspace-relative resource

Schema + ID Check + Evidence Rule
→ structural validity vs referential integrity vs semantic validity

temp + rename + lock
→ preparation / atomic visibility / critical section
```

抽象层用于帮助迁移理解，**不得反向写成项目已实现事实**。

不要为了形式统一而每题强行追加“通用原则”；只有抽象确实能提升迁移理解时才做。

## 7. Concrete Walkthrough

当问题涉及流程、竞态、状态机、解析、安全边界、测试判断或恢复时，至少提供一个能逐步推演的例子，例如：

- A / B 两个 Worker 的时间线；
- 一条 Task 的状态变化；
- 一份输入从解析到持久化的路径；
- 最小伪代码；
- 简短流程图。

例子的目的不是增加字数，而是让“为什么成立”可验证。

## 8. CURRENT / PRINCIPLE / IMPROVEMENT / EXECUTION

答案始终区分：

- `CURRENT`：Repository / Career Profile 可以证明当前已实现；
- `PRINCIPLE`：可靠的通用技术原理，不代表项目已落地；
- `IMPROVEMENT`：尚未实现的改造方案，使用“如果改造，我会……”等假设语气；
- `EXECUTION`：本轮真实 Tool / Command Execution 得到的结果，例如“刚运行 `npm test` 为 78/78”。

只有存在本轮实际执行证据时才能写 EXECUTION 类断言。静态读取测试代码、README、package.json 或历史 test report，只能证明“仓库定义 / 历史记录了什么”，不能写成“我刚运行通过”。

不要求把这些标签原样展示，但语义不能混淆。

## 9. Answer Completeness Gate

每个 Generated Answer 在 Node Extraction 前逐项检查：

1. 是否直接回答了当前问题，而不是只给背景或术语？
2. 是否把影响结论的关键因果链讲清？
3. 如果机制抽象，是否给了可推演例子？
4. 如果存在设计动机，是否解释 Why Layer？
5. 如果存在可复用工程概念，是否做了必要抽象？
6. 会改变正确性的失败边界 / trade-off 是否已说明？
7. CURRENT / PRINCIPLE / IMPROVEMENT / EXECUTION 是否分清？
8. 是否删除了“面试时我会怎么说”“这体现我的能力”等答题策略旁白？
9. 如果只看这一题，是否已经足以独立学习，而不是必须读下一题才能补全核心机制？

任一关键项不满足就补写当前答案。不要通过增加 Follow-up 来绕过这个 Gate。

---

# 二、Presentation Planning

## 核心原则

**内部知识结构与用户可见结构分离。**

完成 DEEP_STUDY Answer 后，先判断当前问题属于什么解释类型，再选择最合适的信息结构。Presentation Planner 只能改变“怎么讲”，不能删掉已经通过 Completeness Gate 的知识内容。

## 1. Question Shape Classification

不要求把分类标签展示给用户。常见形态：

- `DEFINITION`：是什么、概念边界是什么；
- `MECHANISM`：为什么能工作、哪一步使结果成立；
- `PROCESS`：完整执行流程是什么；
- `COMPARISON`：多个方案 / 层级有什么区别；
- `CONCURRENCY`：并发交错、竞态、原子点在哪里；
- `FAILURE_RECOVERY`：哪里会失败、怎么恢复；
- `ARCHITECTURE`：组件职责、数据流、状态流、设计动机；
- `TRADEOFF`：为什么选 A 不选 B、成本是什么；
- `VALIDATION`：一个结论究竟被什么观察点 / 证据证明。

一个问题可以同时包含多个形态，选主形态组织，必要时组合。

## 2. Explanation Shape

推荐映射：

| Question Shape | 优先表达结构 |
| --- | --- |
| Definition | 直接定义 → 边界 / 反例 → 一个具体例子 |
| Mechanism | 核心结论 → 因果链 → walkthrough → 边界 |
| Process | 核心目标 → 编号步骤 / flow → 关键状态变化 |
| Comparison | 先点核心区别 → 对比表 → 如何选择 |
| Concurrency | 先指出 race → 时间线 → 原子点 / 锁 / 约束 → 边界 |
| Failure / Recovery | failure scenario → 中间状态 → recovery rule |
| Architecture | 总体关系图 / 文字模型 → 组件职责 → data/state flow → Why |
| Tradeoff | 决策目标 → alternatives → cost / benefit → 适用条件 |
| Validation | Claim → observation point → assertion/evidence → 证明边界 |

## 3. Visible Answer Rules

最终答案：

- 第一段或第一句必须直接回应问题；
- 后续结构按题型选择，不固定“两段式”；
- 可以自然使用小标题，但小标题必须来自知识结构，例如“竞态是怎么发生的”“为什么唯一约束能收敛并发”，而不是内部字段名；
- 表格、流程图、时序、代码只在它们能降低认知成本时使用；
- 不为“看起来结构化”机械堆小标题；
- 不把整题压成一个高密度长段；
- 不输出 `直接回答 / 展开说明 / overview / principleDetail / coreAnswer / mechanism` 等内部模板字段。

---

# 三、Recursive Depth

## 核心原则

递归深度不是固定层数，也不是技术主题白名单；只要继续追问仍能增加对 Target Role / JD 或当前 Claim 的判断信息，就可以继续。

根 Claim 只决定起点；Target Role / JD 与当前 Claim 决定边界。

每个 Candidate Node 的价值判定、Coverage、去重和队列调度统一调用 `./knowledge-expansion-policy.md`，本文件不复制其算法。

## Role Relevance

内部可以记录：

- `CORE`
- `RELATED`
- `CONTEXTUAL`
- `OUT_OF_SCOPE`

它们描述相关程度，不是自动白名单。

- `CORE`：直接对应岗位关键职责或 JD 明确能力。
- `RELATED`：不是核心关键词，但明显增加岗位能力判断。
- `CONTEXTUAL`：主要帮助解释上层 Claim；是否继续取决于信息增益。
- `OUT_OF_SCOPE`：继续深入已几乎不能改变岗位判断。

## 深入示例

目标岗位：Agent / 后端平台工程师。

```text
Outbox
→ 双写一致性
→ 本地事务
→ Worker 重复执行
→ 幂等
→ 并发去重
→ 唯一约束
→ 事务隔离
```

这条链可以持续，因为每一步仍增加对可靠性、数据一致性和并发控制能力的判断。

如果继续进入：

```text
事务隔离
→ PostgreSQL WAL 二进制编码
→ page layout
→ B-Tree page split 内核实现
```

目标岗位不是数据库内核开发时，应停止。

## 停止条件

当前分支只在以下情况停止：

1. 节点被 `knowledge-expansion-policy.md` 判定为无继续价值；
2. 新问题已不能增加岗位或 Claim 判断信息；
3. 内容已被其他问题充分覆盖；
4. 新节点与祖先语义等价，形成环路；
5. 无法生成可靠的通用技术答案；
6. 触发 `hardMaxDepth` 异常兜底。

以下不是正常停止理由：

- 已远离根关键词；
- 已经追问 5 层或 8 层；
- 已经生成很多问题；
- 文档已经很长；
- 已覆盖固定题型；
- Project Grounding 不足，但通用技术答案仍可靠。

`hardMaxDepth` 默认值由 Claim Graph Schema 定义（当前为 20），只防止异常无限递归，不代表推荐深度。

## Project Grounding 与递归深度

`VERIFIED / PARTIAL / INSUFFICIENT` 描述项目场景化程度，不直接决定技术递归是否停止。

```text
General Knowledge 足够 + Project Grounding 不足
→ 完整解释 PRINCIPLE
→ 项目处明确区分 CURRENT / IMPROVEMENT
→ 仍可产生新的高价值 Candidate Node
```

只有通用知识本身也不可靠，或继续追问已经没有信息增益时才停止。