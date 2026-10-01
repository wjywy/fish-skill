# Interview Knowledge Expansion Examples

本文件只示范 `policies/knowledge-expansion-policy.md` 的 **Node Extraction / Coverage / Value / Scheduling** 行为，不是参考答案写作模板，也不新增规则。

下面出现的 `Answer 摘要` 为了说明节点来源会被刻意缩短。**真实 Generated Reference Answer 仍必须先通过 `policies/interview-depth-policy.md` 的 Answer Completeness Gate。**

示例不是用户项目事实来源，不得迁移其中技术栈、实现或结论。

---

## 示例 1：低代码平台——技术词不等于高价值节点

Resume Claim：

```text
设计并实现低代码事件驱动机制，将组件事件、触发条件与动作配置统一抽象至 Schema，通过事件解析与运行时执行链路支撑组件间交互。
```

Answer 中可能出现：

```text
Schema
JSON
事件解析
运行时执行
组件
```

### Schema → 高价值

原因：它直接决定事件与动作如何建模，既依赖 Claim，又能区分“会配 JSON”和“理解低代码运行时”。

可生成：

```text
Schema 在事件驱动系统里具体描述哪些信息？配置又是如何被运行时解释成真正动作的？
```

### JSON → 通常 DROPPED

如果 JSON 只是 Schema 的序列化格式，“JSON 是什么”不会增加对低代码平台能力的判断。

### 运行时执行 → 高价值

如果当前 Answer 只提到“运行时解析配置”但没有讲执行链，则 Coverage = `PARTIAL`，可以继续追：

```text
一个组件事件触发后，从 Schema 解析到目标动作执行，中间经历哪些步骤？
```

---

## 示例 2：Outbox——Answer-first，而不是预先列题

Resume Claim：

```text
使用 Transactional Outbox 保证业务状态与异步事件可靠记录。
```

Root Question：

```text
为什么业务状态和 Outbox Event 要在同一个事务里提交？
```

完整 Answer 通过 Gate 后，可能暴露：

```text
本地事务
至少一次投递
重复投递
幂等
```

Node Evaluation：

```text
重复投递 / 幂等 → UNEXPANDED
本地事务          → 如果本题已完整解释则 COVERED
JSON              → 若只作为存储格式则 DROPPED
```

下一题应优先来自 `UNEXPANDED`：

```text
Outbox Worker 重复投递时，消费侧如何保证幂等？
```

这个 Answer 又可能产生：

```text
eventId
唯一约束
条件更新
check-then-act 竞态
```

若“并发消费下的原子去重”仍为 `PARTIAL`：

```text
为什么“先查 eventId 是否存在，再执行业务写入”在两个 Worker 并发时仍可能重复执行？
```

链路是：

```text
Answer₀
→ Node₁
→ Question₁
→ Answer₁
→ Node₂
→ Question₂
```

而不是：

```text
Claim
→ 一次性列 10 个 Outbox 相关问题
```

---

## 示例 3：一个 Answer 可以产生多个 sibling，但一次只执行一个

假设某个 Outbox Answer 同时完整说明了：

```text
Worker 使用 SKIP LOCKED 领取记录
投递失败 retry / backoff
整体语义是 at-least-once
消费侧需要幂等
```

Node Extraction 可以得到：

```text
sourceAnswerId = a-outbox

├── 幂等 / 原子去重             UNEXPANDED
├── 多 Worker / SKIP LOCKED     UNEXPANDED
├── retry / backoff             UNEXPANDED
└── dead letter                 UNEXPANDED（若 Answer 提到但未解释终局）
```

下一步可以先选择价值最高的“幂等”：

```text
消费侧如何在并发重试下做原子去重？
```

但其他 sibling 必须继续保留。

当幂等深分支耗尽后，调度器重新查看 Expansion Queue，再决定是否进入：

```text
多个 Worker 同时扫描 Outbox 时，SKIP LOCKED 具体避免了什么竞争？
```

不能因为“当前只执行一个节点”，就把其余 sibling 丢掉。

---

## 示例 4：Coverage 防止机械重复追问

当前 Answer 已经说明：

```text
Worker 崩溃后，数据库行锁会随着事务回滚释放；
如果应用还维护 processing lease，则需要过期时间来回收僵死 lease。
```

Candidate：

```text
Worker crash recovery
```

如果当前问题只需要解释锁释放与 lease 回收，这个节点已经：

```text
Coverage = SUFFICIENT
Status   = COVERED
```

不要机械再问：

```text
Worker 崩溃怎么办？
```

但如果 Target Role 是高可靠后端，新的具体问题仍可能有信息增益：

```text
lease 需要续期时，如何避免慢 Worker 被误判过期，而新 Worker 又开始重复处理？
```

这是一个新的、更具体节点，不是重新打开同一个泛化问题。

---

## 示例 5：当前深分支优先于 Root Queue

目标方向：Agent 应用开发 / Agent 平台工程。

当前问题：

```text
为什么不让多个 Specialist 无限制并行执行？
```

完整 Answer 解释了：

```text
瞬时并发
上游限流
部分失败
取消传播
依赖分层
```

其中：

```text
部分失败如何收敛        UNEXPANDED
取消如何传播            UNEXPANDED
并发上限如何设计        UNEXPANDED
```

即使 Root Queue 还保留：

```text
评估 checkpoint 与业务 Task 的区别
```

此时也不能横跳 Root Queue。

应先沿当前 Answer 继续，例如：

```text
并行执行时，一个 Specialist 失败、其他节点已经成功，Supervisor 应整体失败还是带部分结果继续？
```

只有当前 Claim 下高价值 `UNEXPANDED` 节点都被 `EXPANDED / COVERED / MERGED / DROPPED` 后，才允许回到 Root Queue。

---

## 示例 6：岗位边界决定停止位置

同一个知识链：

```text
Outbox
→ 幂等
→ 并发去重
→ 唯一约束
→ 事务隔离
→ PostgreSQL WAL
→ page layout
```

如果目标岗位是 Agent / 后端平台工程师：

- 幂等、并发去重、唯一约束、事务隔离通常仍有岗位判断价值；
- WAL 是否继续取决于当前 Claim 与岗位要求；
- page layout 通常已经进入数据库内核细节，继续追问信息增益很低。

停止不是因为“已经第 N 层”，而是因为继续深入不再改变岗位能力判断。

---

## 反模式汇总

以下行为都不符合 Expansion Policy：

```text
1. Claim 一上来就生成 10 个平行问题
2. Answer 出现一个名词就机械创建 Follow-up
3. 当前 Answer 已经讲透的节点仍重复追问
4. 一个 Answer 产生多个高价值 sibling，但只保留最高分那个
5. Expansion Queue 还有节点，却横跳新的 Root Theme
6. 因为追到第 5 / 8 层就固定停止
```

正确目标始终是：

```text
完整 Answer
→ 提取全部有意义节点
→ Coverage + Value
→ 保留所有高价值 sibling
→ 一次执行一个
→ 当前分支耗尽后返回 sibling
→ 直到岗位信息增益耗尽
```