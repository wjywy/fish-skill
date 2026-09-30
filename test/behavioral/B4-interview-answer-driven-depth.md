# B4 · Interview Knowledge — answer-driven depth & two-part answers

> Fixture: `test/fixtures/behavioral/B4-interview-depth.json`

## Objective

Verify the default Interview Knowledge mode produces a **single answer-driven
chain that reaches the mechanism layer**, not a "topic → 4–5 parallel questions"
list, and that **each answer is split into two parts** — a short logic +
project-scenario paragraph, then a detailed principle section.

## Source of truth

- `SKILL.md §硬性执行约束` — no pre-generated outline; depth before breadth; Output Gate
- `SKILL.md §Interview expansion cardinality` — one answer may yield several siblings
- `workflows/interview-knowledge.md §生成前与交付前强制检查 (Gate)`
- `workflows/interview-knowledge.md §Generated Reference Answer` — two-part contract
- `policies/knowledge-expansion-policy.md §六 Answer-first 执行算法与调度器`
- `policies/interview-depth-policy.md` — depth bounded by role relevance, not layer count

## Input

```
针对“使用 Transactional Outbox 保证长任务事件可靠记录与异步投递”这条简历描述，
帮我准备面试问题和参考答案。
```

Target role: Agent 应用开发工程师.

## Expected behaviour

1. Materialise **one** root question, then answer it.
2. Extract candidate nodes from *that* answer; pick the highest-value one.
3. Each subsequent question must be justified by the previous answer.
4. Reach the mechanism layer (idempotency → concurrent dedup → unique
   constraint → transaction isolation).
5. Retain non-chosen siblings from an answer and return to them after the
   current branch is exhausted.
6. **Every answer sounds like a candidate**: directly answer, then explain the
   causal mechanism with a concrete example and clear project boundaries.

## Anti-patterns (the `反模式` explicitly named by the workflow)

- `主题A: Q1/Q2/Q3/Q4` style topic lists with independent questions.
- Switching topic while the current answer still has high-value unexpanded nodes.
- Depth stuck at "是什么 / 为什么要" (≤ 2 layers).
- An answer that lists conclusions or terms without a causal walkthrough.

## Rubric

| ID | Criterion | Weight |
| --- | --- | --- |
| B4-R1 | Constitutes one answer-driven chain | 3 |
| B4-R2 | Reaches the mechanism layer | 3 |
| B4-R3 | No independent parallel-sibling pile-up | 3 |
| B4-R4 | Reference answers detailed enough to revise from | 1 |
| B4-R5 | Each answer is natural to say aloud, with a direct opening and concrete mechanism | 3 |

## Recorded run

The record below predates the spoken-answer contract. Its `**原理详解**`
markers and recorded score are historical evidence, not the current output target;
rerun this fixture to score the revised rubric.

```text
# Outbox 可靠事件分发

## 为什么 Task 状态和 Outbox Event 要在同一个数据库事务里提交？

Task 状态更新与待投递事件必须原子化落库，否则会出现双写不一致：先提交业务状态再写消息会丢事件，先写消息再提交业务状态会让下游消费到不存在的任务。Transactional Outbox 把两者放进同一个本地事务，提交即代表同时持久化，再由 Worker 异步投递；由于投递是至少一次，消费侧还必须处理幂等。

**原理详解**

Transactional Outbox 要解决的是“数据库写入”与“消息投递”这两个独立系统之间无法共享事务的问题。

1. 双写窗口：任何“先写 A 再写 B”的流程，在两次写入之间崩溃都会造成不一致。Outbox 把消息降级为数据库中的一行记录，使两次写入变成同一次事务写入，从而消除窗口。
2. 投递语义：事务提交后由 Worker 扫描 Outbox 表并投递，投递成功再标记完成；由于“投递”与“标记”无法原子，正常语义是至少一次。
3. 并发领取：多个 Worker 同时扫描时，需要行级锁或 FOR UPDATE SKIP LOCKED 保证同一条记录不被两个 Worker 同时领取。
4. 失败与恢复：投递失败需要重试与退避，超过上限进入死信；Worker 崩溃时行锁随事务回滚释放。
5. 代价与取舍：引入额外一次写入与扫描延迟，换来不依赖分布式事务的最终一致；相比两阶段提交牺牲即时一致性但显著降低复杂度。

## Outbox Worker 重复投递时，消费侧如何保证幂等？

幂等的核心是让同一个业务事件重复到达时只产生一次有效副作用。实现上需要一个稳定的业务唯一键（通常是 eventId）和一个原子写入点，让“判断是否处理过”与“写入处理结果”发生在同一次原子操作里。

**原理详解**

幂等要解决的是“重复投递 × 副作用”的组合问题：投递语义通常是至少一次，同一条事件可能被消费多次，而业务副作用必须只发生一次。

1. 唯一键：eventId 必须由生产侧在事务内生成并保持稳定，不能依赖消费侧到达时间或自增序号。
2. 原子写入点：把“检查”和“写入”合并成一次依赖数据库原子性的操作——唯一索引 INSERT、INSERT ... ON CONFLICT DO NOTHING，或带条件的 UPDATE。
3. 竞态：仅靠“先查再写”会在并发下产生 check-then-act 竞态，两个事务的检查阶段互相不可见。
4. 隔离与锁：唯一约束由存储引擎在索引上加锁裁决，后到者冲突失败；MVCC 下冲突判定依赖索引锁等待而非快照可见性。
5. 边界：热点 eventId 会造成锁等待甚至死锁，需要控制事务粒度、统一加锁顺序或做更细分片。

## 两个 Worker 并发消费同一事件时，“先查再写”为什么仍可能重复执行？

因为查询与写入之间存在时间窗口：两个事务的检查阶段互相看不见对方的写入，都会认为“未处理过”，随后各自执行写入。要消除竞态，去重动作本身必须是原子的——让数据库的约束或行锁来裁决谁先成功。

**原理详解**

这是 check-then-act 竞态的典型形态：读-判-写不是一次原子操作，中间存在可被并发穿插的窗口。

1. 竞态条件：事务 A 与 B 都在快照中看不到对方的未提交写入，因此都通过“未处理过”的检查。
2. 收敛手段：把判定条件下沉到数据库约束——唯一索引让第二次写入直接失败；或用条件 UPDATE（WHERE processed = false）让受影响行数为 0 的一方感知失败。
3. 失败后的语义：冲突方不是“出错”，而是“这条事件已被处理”，应当按成功返回，否则会触发无意义的重试。
4. 隔离级别影响：READ COMMITTED 下唯一冲突仍会阻塞并失败；SERIALIZABLE 会用更大代价换取更强保证。

## 唯一约束在并发去重里是如何保证原子性的？隔离级别会带来什么影响？

唯一索引在写入时由存储引擎在索引项上加锁裁决，后到的事务命中冲突而失败，从而把并发的重复写入收敛为一次成功。在 MVCC 下，冲突判定依赖索引上的锁等待，而不是快照可见性——即使快照读不到对方，写入仍会阻塞并最终冲突。

**原理详解**

1. 加锁粒度：唯一索引在插入时对目标键加锁，锁的持有期是事务生命周期，直到提交或回滚。
2. MVCC 与唯一性：快照隔离解决的是“读一致性”，不解决“写冲突”；唯一性检查必须穿透快照读取最新状态，因此走锁等待路径。
3. 死锁成因：两个事务以不同顺序对同一组键加锁会形成环，需要统一加锁顺序或缩小事务范围。
4. 性能边界：高并发下热点键会把并发退化为串行等待，可通过分片键、批量合并或异步化缓解。

## 多个 Worker 同时扫描 Outbox 表时，FOR UPDATE SKIP LOCKED 如何避免同一条记录被重复领取？

（这是根答案中保留的另一个 sibling，在幂等分支耗尽后展开。）
SKIP LOCKED 让并发 Worker 在扫描时直接跳过已被其他事务加锁的行，每个 Worker 拿到的是互不相交的记录子集，因此不会重复领取同一条记录。

**原理详解**

1. 语义：FOR UPDATE 对选中行加排他锁，SKIP LOCKED 让被锁定的行不进入结果集，而不是等待。
2. 效果：N 个 Worker 的查询结果天然互斥，等价于一次原子的“认领”操作。
3. 崩溃恢复：行锁随事务回滚释放；若应用层额外维护 processing / lease 状态，则需设计超时回收，避免僵死租约。
4. 取舍：SKIP LOCKED 牺牲了全局有序领取，换来吞吐；对顺序敏感的场景需要额外设计。
```

## Score

| Criterion | Score | Note |
| --- | --- | --- |
| B4-R1 | 2 | Q2 justified by Q1's "至少一次→重复投递"; Q3 by Q2's "先查再写"; Q4 by Q3's "原子性" |
| B4-R2 | 2 | Reaches unique-constraint / MVCC / lock-wait mechanism layer (depth 4) |
| B4-R3 | 2 | The final question is an explicitly-labelled retained sibling, not a parallel list |
| B4-R4 | 2 | Each answer states principle, mechanism and boundary |
| B4-R5 | 2 | Every answer is overview + `**原理详解**`; the principle section is markedly longer |

Weighted: 24/24 = **100% → PASS**. No anti-pattern fired.

## What this proves

The skill honours its own hardest rule — no pre-generated outline, drilling the
same branch to the mechanism layer before returning to a retained sibling — and
delivers the revised two-part answer shape, with the principle section carrying
the detail.
