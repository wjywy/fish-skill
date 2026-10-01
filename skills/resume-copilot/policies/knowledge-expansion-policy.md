# Knowledge Expansion Policy

## 目标

控制 Interview Knowledge 中“从一个答案继续追问什么”的行为。

核心原则：**知识节点是否值得继续展开，不由它属于哪一种技术类别决定，而由它能否显著增加对目标岗位匹配程度，或对当前 Resume Claim 理解深度的判断信息决定。**

不要把 `并发 / 一致性 / 失败恢复 / 性能` 等主题写成默认白名单，也不要因为一个节点只是 `CONCEPT` 就默认低价值。节点类型只用于组织知识，不用于直接决定是否追问。

---

## 一、候选节点从哪里来

每个 Generated Answer 完成后，可以从四种来源产生 Candidate Knowledge Node：

### 1. Explicit

答案中明确出现、并承担关键解释作用的概念、机制、决策或实现。

例如：

```text
使用 reducer 合并多个 Agent 写入的 evidence。
```

候选：

- reducer
- evidence 共享状态
- Agent 输出合并

### 2. Implicit

虽然答案里没有直接写出某个术语，但当前机制天然会引出一个影响正确理解的工程问题。

例如：

```text
任务可以从 checkpoint 恢复执行。
```

可以合理推导：

- 恢复时节点是否会重复执行？
- 有副作用的节点如何处理？

这里不要求答案先出现“幂等”这个词，才允许追问重复执行问题。

### 3. Contrast

由某个技术选择自然引出的替代方案或选择依据。

例如：

```text
使用 SSE 返回长任务事件。
```

可以产生：

- 为什么用 SSE，而不是 WebSocket？

但只有当这个取舍对目标岗位或当前 Claim 有判断价值时才展开。

### 4. Boundary

由一个正常工作路径自然引出的边界条件、限制、异常或规模变化问题。

例如：

```text
多个 Agent 顺序执行并写入共享状态。
```

可以产生：

- 如果其中一个节点执行很慢，这种编排会产生什么影响？

重点是“这个问题是否揭示候选人的岗位能力”，而不是它是不是某个预设分类。

---

## 二、高价值节点判定流程

对每个 Candidate Knowledge Node 按下面流程判断。

```text
Candidate Node
      ↓
① Role Relevance
   它是否能帮助判断目标岗位能力？
      ├─ 否 → DROP
      └─ 是 / 可能 → 继续
      ↓
② Claim Dependency
   不理解它，会不会导致当前 Claim 讲不清、讲不完整或无法解释？
      ├─ 是 → 强候选
      └─ 否 → 继续
      ↓
③ Discriminative Power
   这个问题能否区分“只知道名词”和“真正理解 / 做过”？
      ├─ 否 → 降低优先级
      └─ 是 → 继续
      ↓
④ Information Gain
   问完之后，是否会获得新的有效判断信息？
      ├─ 否 → DROP / MERGE
      └─ 是 → 继续
      ↓
⑤ Novelty
   是否已经被之前的问题实质覆盖？
      ├─ 是 → MERGE / DROP
      └─ 否 → EXPAND
```

### 五个判断维度

#### Role Relevance

判断问题：

> 这个节点是否能帮助判断候选人是否满足目标岗位 / JD 的能力要求？

目标岗位决定外边界，根关键词不决定外边界。

#### Claim Dependency

判断问题：

> 如果把这个知识点从答案里删掉，当前 Resume Claim 是否仍然能被完整解释？

如果删除后会丢失关键实现、选择依据或核心原理，则依赖度高。

#### Discriminative Power

判断问题：

> 面试官问这个问题，能否区分候选人只是听过这个词，还是确实理解并能解释这个项目？

不要优先生成只有百科记忆价值的问题。

#### Information Gain

判断问题：

> 已经知道前面所有答案之后，再问这个问题，是否还能显著增加新的能力判断信息？

如果答案只会重复上层内容，就不要继续。

#### Novelty

判断问题：

> 这个问题是否已经被其他问题从实质上回答过？

语义重复要合并，不因为措辞不同重复创建节点。

---

## 三、简化决策测试

执行时可以使用两个快速测试。

### Test A：Removal Test

问：

> 如果从当前解释中移除这个知识点，是否会明显损害对 Claim 的理解？

- 会 → 值得进一步评估
- 不会 → 通常不优先追

### Test B：Assessment Test

问：

> 如果不追这个点，我是否已经足以判断候选人对当前 Claim 和目标岗位能力的掌握深度？

- 已经足够 → 不追
- 仍缺少关键判断信息 → 继续追

---

## 四、不要使用主题白名单

以下分类：

- `CONCEPT`
- `MECHANISM`
- `IMPLEMENTATION`
- `DECISION`
- `TRADEOFF`
- `FAILURE`
- `RECOVERY`
- `CONSISTENCY`
- `CONCURRENCY`
- `PERFORMANCE`
- `SECURITY`
- ...

只用于：

- 知识节点组织
- 问题覆盖分析
- 去重
- 输出内部图谱

**不得因为节点属于某个类型，就自动判定它高价值。**

例如 `CONCEPT` 节点中的 `MVCC` 对后端岗位可能非常有价值，而 `FAILURE` 类型的一个无关边缘异常对前端岗位可能没有价值。

---

## 五、展开优先级

多个节点都通过高价值判定后，再按下面规则决定先问谁：

1. 更贴近 Target Role / JD 核心能力
2. 更依赖于当前 Resume Claim
3. 更能区分候选人能力层级
4. 能产生更多新的有效信息
5. 与已有问题重复更少

一个父 Answer 可以产生多个高价值 sibling nodes，所有满足展开条件的节点都必须保留。调度时默认一次只执行其中 1 个最高价值节点；未被选择的 sibling 继续保持 `UNEXPANDED`，当前分支耗尽后必须返回处理。

不要为了覆盖数量而强行扩展低价值节点。

---

## 五点五、一答多问：保留 sibling，不等于一次全部执行

核心约束：

```text
1 Answer → 0..N high-value Candidate Nodes → 0..N Follow-up Questions
```

其中“0..N Follow-up Questions”可以按调度顺序逐步生成。不要把“默认下一步只展开 1 个”误解为“只允许这个 Answer 产生 1 个问题”。

必须同时满足：

- **Extract all**：从 Answer 中提取全部有意义的 Candidate Nodes。
- **Retain all valuable siblings**：所有高价值且未充分覆盖的 sibling 都保持 `UNEXPANDED`。
- **Execute one at a time**：默认一次只选择一个节点继续深入。
- **Return to siblings**：当前深分支耗尽后，回到仍未展开的 sibling。
- **Never silently discard**：未选中的 sibling 不能因为“不是最高分”而消失。

示例：

```text
Answer: Outbox Worker 通过 SKIP LOCKED 领取记录，失败会重试，最终是至少一次投递。

Candidate Nodes:
- SKIP LOCKED / 多 Worker 并发领取       → UNEXPANDED
- retry / backoff                        → UNEXPANDED
- 至少一次投递 / 幂等                     → UNEXPANDED

下一步可以先问“消费侧如何幂等？”，
但另外两个节点必须继续留在 Expansion Queue。
```

## 六、Answer-first 执行算法与调度器

高价值判定只是“值不值得追”的规则，真正执行时必须维护待展开状态与两个队列，避免答案里已经出现关键节点却直接跳到其他主题。

### 两个队列

```text
Expansion Queue = 由当前 Answer 产生的 HIGH-VALUE UNEXPANDED Nodes
Root Queue      = 尚未物化的 Claim 级横向问题候选
```

执行顺序必须是：

```text
Expansion Queue > Root Queue
```

只要 Expansion Queue 非空，就禁止从 Root Queue 取新问题。

### 禁止预生成完整题纲

可以预先识别 Resume Claims / Root Themes，但**不得预生成或预规划完整的 Interview Question Set**。

允许：

```text
Root Claims:
- Multi-Agent 编排
- 长任务状态
- Outbox 可靠投递
```

不允许在 Answer-driven expansion 之前就物化：

```text
Multi-Agent: Q1 / Q2 / Q3 / Q4
Outbox: Q1 / Q2 / Q3 / Q4
```

问题必须在调度器允许时逐个物化。

### Step 1：分析当前 Answer（强制）

**每个 Generated Answer 完成后都必须执行本步骤。**立即从该 Answer 产生 Candidate Nodes，并记录 `sourceAnswerId`。

在所有 Candidate Node 完成 `UNEXPANDED / MERGED / DROPPED` 判定之前，不得进入下一道问题。全部完成后将当前 Generated Answer 标记为 `candidateEvaluationComplete=true`；未标记时 Sibling Transition Gate 必须保持 BLOCKED。

不得先批量生成完整问题清单，再回头补答案。主要递归链必须是：

```text
Answer → Node → Question → Answer → Node
```

### Step 2：先判断 Answer Coverage，再判定是否入队

对每个 Candidate Node 先判断它在当前 Answer 中是：

- `MENTIONED`：仅被提到。
- `PARTIAL`：解释了一部分，但仍缺关键判断信息。
- `SUFFICIENT`：当前答案已经充分覆盖，继续追问只会重复。

然后执行前述五维判定：

- 高价值 + `MENTIONED/PARTIAL` 且继续追问有信息增益 → `UNEXPANDED`
- 高价值但 `SUFFICIENT`，或当前答案已经足以完成该层判断 → `COVERED`
- 与已有节点等价 → `MERGED`
- 价值不足 / 越界 / 环路 → `DROPPED`

Expansion Queue 由所有 `status=UNEXPANDED` 节点动态派生；不要额外持久化第二份 `unexpandedNodeIds`。

### Step 3：当前分支优先消费 Expansion Queue

默认采用“当前分支优先”：如果最新 Answer 产生高价值 `UNEXPANDED` 后代，先从这些后代里选择价值最高的 1 个继续追问；只有当前分支已经耗尽，才回到更早的 Expansion sibling。

这不是固定 DFS：如果当前后代信息增益明显更低，可以选择队列中更高价值节点。核心目标是避免刚进入一个高价值机制就过早横跳。

先将当前 Answer 产生的**全部**高价值、未充分覆盖节点保留为 `UNEXPANDED`。然后按动态价值选择其中 1 个节点生成下一层问题。注意：选择 1 个只是“下一步执行谁”，不是“只留下谁”。生成问题和答案后：

```text
UNEXPANDED → EXPANDED
```

随后必须立刻分析新的 Generated Answer，继续产生节点。

### Step 4：Sibling Transition Gate

准备切换到 Expansion sibling、Root Queue 或下一个 Claim 前，必须通过强制 Gate：

```text
是否仍存在高价值 UNEXPANDED Node？
```

- 最新 Answer 仍有高价值后代 `UNEXPANDED` → `BLOCK transition`，优先继续当前分支
- 当前分支耗尽但 Claim 中仍有其他高价值 `UNEXPANDED` → 继续消费 Expansion Queue
- 没有 → 检查是否还有 Candidate Node 等待判定；全部完成后才允许访问 Root Queue

### Step 5：Root Queue 只作为补充

当 Expansion Queue 已耗尽且 Gate 通过后，才允许从 Root Queue 读取一个 `assessmentIntent`，并在当下结合 Claim、已覆盖内容和 Target Role 现场生成具体问题。Root Queue 不得保存未来问题全文。

这个新问题回答完成后，调度器立即回到 Step 1；如果产生新的 Expansion Queue，Root Queue 再次暂停。

因此默认优先级是：

```text
Answer-driven vertical expansion
> Claim-driven horizontal expansion
```

这里的 `>` 表示执行顺序，不是 Knowledge Node 类型的固定优先级。

### Scheduler 伪代码

```text
while claim.active:
  if expansionQueue.hasHighValueUnexpanded():
    node = expansionQueue.dequeueHighestValue()
    q = generateQuestion(node)
    a = generateAnswer(q)
    evaluateAll(extractCandidates(a))
    node.status = EXPANDED
    continue

  if not siblingTransitionGatePasses():
    continue

  if rootQueue.hasPending():
    root = rootQueue.dequeue()
    q = materializeRootQuestion(root)
    a = generateAnswer(q)
    evaluateAll(extractCandidates(a))
    continue

  break
```

## 七、节点状态与追溯

每个 Knowledge Node 至少应记录：

- `sourceAnswerId`：它由哪一个 Generated Answer 产生
- `candidateSource`：`EXPLICIT / IMPLICIT / CONTRAST / BOUNDARY`
- `status`：`UNEXPANDED / EXPANDED / MERGED / DROPPED`
- `mergedIntoNodeId`：若重复，被合并到哪个节点
- `decisionReason`：为什么展开、合并或丢弃

这样可以回答：

> “这个追问为什么出现？”

而不是只知道它属于某种 Node Type。

## 八、示例

### 示例 A：低代码 Schema

Resume Claim：

```text
基于 Schema 驱动低代码页面编辑与运行时渲染。
```

参考答案中出现：

- Schema
- JSON
- 组件属性
- 运行时解析

#### Schema：EXPAND

原因：

- 与低代码 / 前端平台岗位高度相关
- 当前 Claim 的实现方式直接依赖它
- 能区分“会用配置”与“理解 Schema 驱动设计”
- 可以继续问 Schema 描述什么、如何演进、如何兼容

可追问：

```text
Schema 在这个低代码系统里描述了哪些信息？为什么要使用 Schema 驱动？
```

#### JSON：DROP

如果它只是 Schema 的序列化格式，那么问：

```text
JSON 是什么？
```

通常：

- 对目标岗位判断贡献低
- 不影响当前 Claim 的核心理解
- 区分度低
- 信息增益低

因此不追。

---

### 示例 B：Outbox 深入到事务隔离

目标岗位：Agent / 后端平台工程师

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

虽然 `事务隔离` 已经离 `Outbox` 字面很远，但：

- 仍然影响并发去重是否正确
- 能显著判断后端工程能力
- 是上层 Claim 的合理依赖链

因此可以继续。

如果再进入：

```text
PostgreSQL WAL 二进制编码
→ page layout
→ B-Tree page split 内核实现
```

而目标岗位并不要求数据库内核开发，则这些节点对岗位判断几乎没有新增信息，停止。

---

### 示例 C：React 性能优化

Resume Claim：

```text
通过精简状态订阅降低 React 页面交互阶段的长任务。
```

候选节点：

- React
- 状态订阅
- mapStateToProps
- JavaScript

不要因为 `React` 是目标岗位核心技术就一定问“React 是什么”。

更高价值的问题是：

```text
为什么状态订阅范围过大会放大交互阶段的渲染成本？你是怎么定位并缩小订阅范围的？
```

它同时具备：

- 高 Claim Dependency
- 高岗位相关性
- 高区分度
- 高信息增益

---

### 示例 D：产品岗位

Resume Claim：

```text
通过 AB 实验验证新的转化路径并推动方案上线。
```

候选节点：

- AB Test
- 实验指标
- 显著性
- JavaScript 埋点实现

如果目标岗位是产品经理，优先追：

```text
为什么选择这个指标作为实验成功标准？如何避免指标提升但真实业务价值下降？
```

而不是因为“埋点”是技术实现就优先深入 SDK 内部实现。

说明该判定流程必须跨岗位成立，不能依赖技术主题白名单。

---

## 七、停止条件

当前分支在以下情况停止：

1. 节点无法继续帮助判断 Target Role / JD 匹配程度
2. 节点不再帮助解释当前或上游 Resume Claim
3. 新问题的区分度或信息增益接近于零
4. 已被其他问题充分覆盖
5. 形成语义环路
6. 缺少可靠知识，无法生成准确答案
7. 触发实现层异常递归兜底

**不得因为“离根关键词太远”而停止。**


## 七、项目 Grounding 不是递归停止条件

项目仓库无法证明某个实现细节，只影响答案的项目场景化，不自动降低该知识节点的技术价值。

- 通用技术知识可靠 → 正常回答、正常继续价值判定。
- 项目细节不足 → 只在答案涉及该细节时，用技术句子区分当前实现与假设方案；不输出单独旁白。
- 只有通用答案本身也无法可靠生成，或继续追问没有岗位信息增益时，才停止。
