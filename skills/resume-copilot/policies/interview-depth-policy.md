# Interview Depth Policy

## 目的

Interview Depth 只约束两个问题：

1. **Answer Depth**：当前这道题本身要解释到什么程度才算完整，以及什么时候应该停止继续展开当前答案。
2. **Recursive Depth**：当前知识分支还应不应该继续追问。

用户可见答案如何组织与呈现统一由 `./answer-presentation-policy.md` 负责；Candidate Node 的产生、Coverage、价值判定与调度统一由 `./knowledge-expansion-policy.md` 负责。

核心原则：**当前答案既要有下界，也要有上界。** DEEP_STUDY 要求把当前问题讲透，但不要求穷尽当前问题周围的整个知识邻域。

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
- 哪些边界会改变当前结论；
- 项目当前实际做到哪里；
- 哪些内容只是通用原理或假设改造。

如果不能，先补当前答案，再提取 Candidate Node。

## 2. Internal Answer Slots != Visible Template

内部 `Generated Answer` 当前仍保留：

- `overview`：核心结论与必要项目落点；
- `principleDetail`：完整机制、Why Layer、walkthrough、边界、取舍与必要抽象。

这两个字段用于内部 completeness，不是最终 Markdown 的固定分栏。最终展示调用 `./answer-presentation-policy.md`。

## 3. Explanation Backbone First

在展开大量实现细节之前，先判断：

> 当前问题最小、最有解释力的主轴是什么？

Backbone 可以是：

- **Contrast / responsibility boundary**：`module-relative resource vs workspace-relative target`；
- **Causal chain**：哪一步使目标性质成立；
- **Layer model**：`structural validity → referential integrity → semantic evidence`；
- **State transition**：准备、提交、恢复；
- **Observation hierarchy**：source → artifact → runtime → delivery；
- **Decision frame**：目标、候选方案、判断标准、代价。

Backbone 的作用是组织理解，不是新的可见模板。简单事实 / 定义题如果直接自然回答更清楚，可以不显式输出 Backbone。

### Backbone 与 Knowledge Abstraction 的关系

Backbone 先回答“这一题主要围绕什么关系解释”；Knowledge Abstraction 再判断“这个关系是否值得抽象成可迁移的通用模型”。两者不重复：

```text
Question
→ identify explanatory backbone
→ explain current question
→ optionally abstract reusable principle
```

不要先堆大量实现细节，最后才补一个与正文脱节的“通用总结”。

## 4. Mechanism Chain

机制 / 实现 / 架构类问题，答案至少应覆盖真正影响结论的因果链：

```text
输入 / 前提
→ 关键参与者
→ 执行步骤
→ 状态或数据变化
→ 哪一步使结果成立
→ 会改变当前结论的必要失败边界 / 取舍
```

不要求把这些词机械写成小标题，但不能只罗列组件名。

例如：

```text
PostgreSQL + Redis + SSE + Outbox
```

不是完整解释。必须说明谁持久化状态、谁记录可靠事件、谁做跨实例广播、谁只是连接层，以及连接断开后为什么任务仍能继续。

## 5. No Terminology-as-Explanation

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

## 6. Why Layer

对于架构、数据模型、并发、一致性、Agent、检索、测试设计等非纯事实问题，仅说明“代码怎么做”通常不够。

当存在真实设计动机时，继续回答：

- 为什么需要这一层设计；
- 它解决的核心矛盾是什么；
- 去掉这一层会发生什么；
- 它对应什么通用工程原则。

纯定义、命令说明或简单事实题不强行补 Why Layer。

## 7. Knowledge Abstraction

当项目实现体现了可迁移的通用技术概念时，在 Project Grounding 后抽象一层知识模型。

例如：

```text
import.meta.url vs process.cwd()
→ module-relative resource vs workspace-relative resource

Schema + ID Check + Evidence Rule
→ structural validity vs referential integrity vs semantic validity

temp + rename + lock
→ preparation / visibility switch / critical section
```

抽象层用于帮助迁移理解，**不得反向写成项目已实现事实**。

不要为了形式统一而每题强行追加“通用原则”；只有抽象确实能提升迁移理解时才做。

## 8. Concrete Walkthrough

当问题涉及流程、竞态、状态机、解析、安全边界、测试判断或恢复时，至少提供一个能逐步推演的例子，例如：

- A / B 两个 Worker 的时间线；
- 一条 Task 的状态变化；
- 一份输入从解析到持久化的路径；
- 最小伪代码；
- 简短流程图。

例子的目的不是增加字数，而是让“为什么成立”可验证。

## 9. Deep Study Boundary：Necessary-for-Conclusion Test

DEEP_STUDY 的目标是 **complete the current question, not the entire neighborhood**。

生成答案时，对准备继续展开的每个知识点执行 Necessary-for-Conclusion Test。只有满足至少一项时，才应在当前答案中完整展开：

1. 不解释它，当前核心结论无法成立；
2. 不解释它，读者无法理解当前关键因果链；
3. 不解释它，当前 walkthrough / example 无法被正确推演；
4. 不解释它，会让读者对当前结论产生实质性错误理解；
5. 它是会直接改变当前结论正确性的必要 boundary / trade-off。

如果都不满足，则该知识点不属于当前答案的必要深度。

### Necessary vs Interesting 是瞬时决策，不是 Node 状态

在 Answer Construction 期间使用：

```text
Candidate Detail
↓
Necessary for current conclusion?
├─ yes → EXPAND NOW
└─ no
    ↓
High future value?
├─ yes → MENTION LIGHTLY / leave evidence for Candidate Extraction
└─ no → OMIT
```

`NECESSARY / INTERESTING` **不得**写入 Knowledge Node Schema，也不得成为 Coverage / status 的第三套权威状态。

Node Extraction 后仍统一使用 `knowledge-expansion-policy.md` 的：

```text
MENTIONED / PARTIAL / SUFFICIENT
UNEXPANDED / EXPANDED / COVERED / MERGED / DROPPED
```

### 示例

问题：

> 唯一临时目录为什么不能解决两个安装进程的并发竞态？

当前答案必须讲清：

```text
unique temp dir isolates preparation
!=
commit arbitration on the shared target
```

并用 A / B 时间线解释为什么正式路径仍会竞争。锁 / 原子条件提交可以作为解决方向。

如果进一步想到 lease 过期后的 stale holder 与 fencing token：

- 它很有价值；
- 但不是解释“临时目录为什么挡不住提交竞态”的必要条件；
- 当前题可以点出“租约锁还会引出 stale holder 问题”；
- 不在这里完整讲完 fencing token；
- 交给后续 Candidate Node / Follow-up。

## 10. CURRENT / PRINCIPLE / IMPROVEMENT / EXECUTION

答案始终区分：

- `CURRENT`：Repository / Career Profile 可以证明当前已实现；
- `PRINCIPLE`：可靠的通用技术原理，不代表项目已落地；
- `IMPROVEMENT`：尚未实现的改造方案，使用“如果改造，我会……”等假设语气；
- `EXECUTION`：本轮真实 Tool / Command Execution 得到的结果，例如“刚运行 `npm test` 为 78/78”。

只有存在本轮实际执行证据时才能写 EXECUTION 类断言。静态读取测试代码、README、package manifest 或历史测试报告，只能证明“仓库定义 / 历史记录了什么”，不能写成“我刚运行通过”。

不要求把这些标签原样展示，但语义不能混淆。

## 11. Answer Completeness Gate

每个 Generated Answer 在 Node Extraction 前逐项检查：

1. 是否直接回答了当前问题，而不是只给背景或术语？
2. 是否先识别了一个足以组织当前解释的 Backbone，或确认当前题简单到无需显式 Backbone？
3. 是否把影响结论的关键因果链讲清？
4. 如果机制抽象，是否给了可推演例子？
5. 如果存在设计动机，是否解释 Why Layer？
6. 如果存在可复用工程概念，是否做了必要抽象？
7. 会改变当前结论正确性的失败边界 / trade-off 是否已说明？
8. CURRENT / PRINCIPLE / IMPROVEMENT / EXECUTION 是否分清？
9. 是否删除了“面试时我会怎么说”“这体现我的能力”等答题策略旁白？
10. 如果只看这一题，是否已经足以独立学习，而不是必须读下一题才能补全核心机制？
11. 是否对额外展开内容执行了 Necessary-for-Conclusion Test，避免把“相关且有趣”误当成“当前题必须讲完”？
12. 是否为后续 Answer-driven Follow-up 保留了非必要但高价值的相邻知识，而不是提前穷尽？

任一关键项不满足就补写或收敛当前答案。不要通过增加 Follow-up 来补当前题，也不要通过无限扩写当前题来消灭 Follow-up。

---

# 二、Recursive Depth

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