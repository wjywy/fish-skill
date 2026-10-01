# Knowledge Expansion Policy

## 目标

本 Policy 是 Interview Knowledge 中 **Candidate Node 产生、价值判定、Coverage、队列调度、去重与 sibling 切换**的唯一 Source of Truth。

它回答：

> 当前 Answer 讲透之后，下一题应该追什么？

它不负责判断“当前 Answer 是否已经讲透”；Answer Completeness 与递归外边界读取 `./interview-depth-policy.md`。

核心原则：**下一题由上一层 Answer 暴露出的高价值知识决定，而不是由预先规划的题库决定。**

---

## 一、Candidate Node 从哪里来

每个通过 Answer Completeness Gate 的 Generated Answer 都必须执行 Node Extraction。

Candidate Node 有四种来源：

### Explicit

答案中明确出现并承担关键解释作用的概念、机制、数据模型或实现。

```text
使用 reducer 合并多个 Agent 写入的 evidence。
→ reducer / shared state merge
```

### Implicit

答案没写出术语，但机制天然存在一个影响正确性的工程问题。

```text
任务从 checkpoint 恢复。
→ 恢复后副作用节点是否重复执行？
```

### Contrast

技术选择自然引出的替代方案或选型边界。

```text
使用 SSE 返回事件。
→ 在这个场景为什么不是 WebSocket？
```

只有替代方案对 Target Role / Claim 有判断价值时才保留。

### Boundary

正常路径自然引出的失败、规模、并发、恢复或安全边界。

```text
多个 Agent 顺序执行。
→ 某个节点超时后整个 Workflow 如何收敛？
```

不要把答案里的每个技术名词都变成节点。

---

## 二、先判断 Coverage

Candidate Node 在入队前先判断它在当前 Answer 中的覆盖程度：

- `MENTIONED`：只被提到，关键机制没解释。
- `PARTIAL`：解释了一部分，继续追问仍有明显信息增益。
- `SUFFICIENT`：当前答案已经足够，继续追问主要是重复。

Coverage 与价值是两个维度。

高价值但 `SUFFICIENT` 的节点应标记 `COVERED`，而不是为了增加题量继续追问。

---

## 三、高价值判定

对 `MENTIONED / PARTIAL` Candidate Node 依次判断：

### 1. Role Relevance

> 它是否帮助判断 Target Role / JD 需要的能力？

### 2. Claim Dependency

> 不理解它，当前 Claim 是否会讲不清、讲不完整或无法解释？

### 3. Discriminative Power

> 追问它能否区分“只听过名词”和“真正理解 / 做过”？

### 4. Information Gain

> 已知前面所有答案后，再问它还能增加新的有效判断信息吗？

### 5. Novelty

> 它是否已经被当前 Answer、祖先问题或其他节点实质覆盖？

简化决策：

```text
Role relevant?
  └─ no → DROPPED
        ↓ yes
Already sufficient / duplicate?
  └─ yes → COVERED / MERGED
        ↓ no
Adds discriminative information?
  └─ no → DROPPED
        ↓ yes
UNEXPANDED
```

节点类型如 `CONCURRENCY / FAILURE / CONCEPT / TRADEOFF` 只用于分类，**不得作为自动高价值白名单**。

---

## 四、状态模型

Knowledge Node 使用：

- `UNEXPANDED`：高价值，尚未生成对应追问与答案。
- `EXPANDED`：已经生成 Question，并完成 Generated Answer。
- `COVERED`：当前或其他答案已经充分解释，无需单独追问。
- `MERGED`：与已有节点语义重复，合并到已有节点。
- `DROPPED`：岗位无关、信息增益不足、形成环路或不值得继续。

每个 Node 应保留：

- `sourceAnswerId`
- 归一化概念 / context
- Coverage
- status
- `decisionReason`
- Parent / Claim 关系

`Expansion Queue` **从 `status = UNEXPANDED` 的节点运行时派生**，不要再持久化第二份权威 `unexpandedNodeIds`。

Root 层尚未执行的横向评估需求可以持久化为 `ROOT_PENDING` assessment intent，但不要提前保存完整未来问题文本。

---

## 五、一答多节点：Extraction 与 Execution 分离

正确关系：

```text
1 Answer
  ↓
Extract ALL meaningful Candidate Nodes
  ↓
0..N high-value UNEXPANDED siblings
  ↓
默认只选择 1 个继续执行
```

必须同时满足：

- **Extract all**：提取全部有意义 Candidate Nodes。
- **Retain all valuable siblings**：高价值且未充分覆盖的 sibling 全部保留。
- **Execute one at a time**：默认一次只展开一个。
- **Return to siblings**：当前深分支耗尽后回到其余 `UNEXPANDED` sibling。
- **Never silently discard**：未被本轮选择不等于 `DROPPED`。

例如：

```text
Outbox Answer
├── 至少一次投递 / 幂等          UNEXPANDED
├── SKIP LOCKED / 多 Worker       UNEXPANDED
├── retry / backoff               UNEXPANDED
└── dead letter                   UNEXPANDED
```

先追幂等，不代表另外三个节点消失。

---

## 六、Answer-first 执行算法与调度器

调度只维护两个逻辑来源：

```text
Expansion Queue = 当前 Claim 下所有高价值 UNEXPANDED Nodes
Root Queue      = 当前 Claim 尚未覆盖的 ROOT_PENDING assessment intents
```

执行优先级：

```text
Current-branch descendants
        >
Expansion Queue
        >
Root Queue
```

`>` 表示执行顺序，不是技术类型的永久价值排序。

### Step 0：Answer Gate

当前 Generated Answer 必须先通过 `interview-depth-policy.md` 的 Answer Completeness Gate。

未通过时继续补当前答案，不做 Node Extraction。

### Step 1：Extract All

从当前 Answer 提取 Explicit / Implicit / Contrast / Boundary Candidate Nodes，并记录 `sourceAnswerId`。

### Step 2：Normalize / Deduplicate

建议语义键：

```text
normalizedConcept + contextClaimId + questionDimension
```

与祖先或已有节点实质重复时 `MERGED`；形成语义环路时 `DROPPED`。

### Step 3：Coverage + Value Evaluation

先判断 `MENTIONED / PARTIAL / SUFFICIENT`，再执行五维价值判定。

所有 Candidate Node 必须在进入下一题前得到明确状态。

### Step 4：Choose Next Node

优先最新 Answer 的高价值后代；没有时从 Expansion Queue 取当前最高价值节点。

多个节点价值接近时，优先：

1. 更贴近 Target Role / JD；
2. 对当前 Claim 依赖更强；
3. 区分度更高；
4. 信息增益更高；
5. 与已有内容重复更少。

### Step 5：Materialize Question Just-in-time

只有节点真正被调度执行时，才生成对应 Question 文本。

禁止先把整个 Root / sibling 问题集写出来再逐题补答案。

Question 得到 Answer 后，立刻回到 Step 0。

### Step 6：Sibling Transition Gate

准备切换 sibling、Root Queue、下一个 Claim 或结束当前主题之前，检查：

```text
Any Candidate waiting for evaluation?
  └─ yes → BLOCK

Any high-value UNEXPANDED node in current Claim?
  └─ yes → BLOCK and continue Expansion

No pending candidate and no UNEXPANDED node?
  └─ allow Root Queue / next Claim / stop
```

不能因为“文档已经有很多问题”就绕过这个 Gate。

---

## 七、Root Queue 的职责

Root Queue 只补充 Answer 链没有自然覆盖、但对当前 Claim 仍重要的横向评估维度。

允许保存：

```text
评估失败恢复
评估性能瓶颈
评估 Ownership 边界
```

不要提前保存：

```text
如果 Worker 崩溃，Redis 锁什么时候释放？
```

只有 Expansion Queue 清空、Sibling Transition Gate 通过后，才从一个 `ROOT_PENDING` intent 现场生成具体 Root / sibling Question。

新 Question 的 Answer 一旦产生高价值后代，Root Queue 立即再次让位给 Expansion Queue。

---

## 八、Coverage 防止“无限拆题”

Answer-driven 不等于“答案出现一个词就问一次”。

例如当前 Answer 已完整说明：

```text
Worker 崩溃时数据库行锁随事务回滚释放；
若应用额外维护 lease，则僵死 lease 需要超时回收。
```

此时：

```text
Worker crash recovery → SUFFICIENT → COVERED
```

不要再问泛化的“Worker 崩溃怎么办？”。

只有更具体的新问题仍有信息增益，例如“lease 续期与误回收之间怎么处理竞态”，才创建新节点。

---

## 九、去重、共享与环路

停止重复创建：

- 与祖先语义等价；
- 只是换措辞；
- 同一 Claim 已充分覆盖；
- 新节点只会回到父节点；
- 已由共享知识节点覆盖且不存在新的 context-specific 差异。

跨 Claim 可以共享通用知识，但保留不同 `projectContext`。

例如“幂等”的定义可以共享，但 Outbox Consumer 幂等和支付请求幂等仍是不同上下文。

---

## 十、与 Recursive Depth 的边界

本 Policy 决定“哪个节点值得追、先追谁”。

`interview-depth-policy.md` 决定“继续深入是否仍在岗位边界内、当前答案需要解释多深”。

不要在这里再维护固定层数、Why Layer、答案写作模板或 `hardMaxDepth` 规则。

如果一个节点仍高价值，但继续追问已经进入 `OUT_OF_SCOPE`，以 Depth Policy 的岗位边界为准停止。

---

## 最小执行不变量

每轮必须满足：

```text
Question
→ complete Answer
→ Extract ALL candidates
→ Coverage + Value Evaluation
→ assign status to every candidate
→ retain all valuable siblings
→ choose one next node
→ materialize next Question just-in-time
```

任何“先列完整题纲”“只保留一个 sibling”“当前答案没讲透就靠下一题补”“Expansion Queue 未清空就横跳 Root Theme”的实现都不符合本 Policy。