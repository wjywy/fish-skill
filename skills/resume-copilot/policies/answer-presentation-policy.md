# Answer Presentation Policy

## 目的

本 Policy 是 Interview Knowledge 中 **用户可见答案如何组织与呈现** 的唯一 Source of Truth。

它只回答：

> 当前问题已经被完整理解后，应该用什么解释形态把答案讲清楚？

它不负责：

- 当前答案要讲多深：读取 `./interview-depth-policy.md`；
- 哪些 Candidate Node 值得继续追问：读取 `./knowledge-expansion-policy.md`；
- Repository / Ownership / Execution Evidence 是否成立：读取对应 Evidence Policy。

核心原则：**内部知识结构与最终 Markdown 展示结构分离。** Presentation 只能决定“怎么讲”，不能通过删减内容绕过 Answer Completeness，也不能为了结构化而额外发明项目事实。

---

## 一、Question Dimension != Explanation Shape

Interview Workflow 中的 Question Dimension 描述“这道题想考察什么”，例如：

```text
DEFINITION
MOTIVATION
IMPLEMENTATION
MECHANISM
FAILURE
CONSISTENCY
CONCURRENCY
PERFORMANCE
TRADEOFF
SCALING
METRIC
OWNERSHIP
```

本 Policy 的 Explanation Shape 描述“答案应该怎么组织”。两者不是同一 taxonomy，禁止用 Question Dimension 直接决定可见 Markdown 模板。

例如：

- 一个 `CONCURRENCY` 问题可能最适合 `TIMELINE`；
- 一个 `CONCURRENCY` 问题也可能只是比较两种并发控制方案，此时更适合 `COMPARISON_MATRIX`；
- 一个 `OWNERSHIP` 问题可能最适合普通 `PROSE`，而不是任何固定图表。

---

## 二、Explanation Shape

先根据当前答案真正需要解释的关系选择主 Shape。常见 Shape：

- `PROSE`：简单定义、短事实或不需要额外结构的解释；
- `CAUSAL_CHAIN`：解释“为什么成立 / 哪一步带来结果”；
- `SEQUENCE`：解释有明确先后关系的流程；
- `COMPARISON_MATRIX`：多个对象、层级或方案需要按相同维度横向比较；
- `TIMELINE`：并发交错、race、先后顺序决定结果；
- `STATE_TRANSITION`：失败、恢复、生命周期或状态机问题；
- `COMPONENT_FLOW`：组件职责、数据流、状态流或架构关系；
- `EVIDENCE_CHAIN`：Claim、Observation Point、Evidence Strength、证明边界；
- `DECISION_FRAME`：选型、trade-off、成本收益与适用条件。

Explanation Shape 是内部规划结果，不要求把名称展示给用户。

一个答案可以组合辅助 Shape，但默认只选择一个主 Shape。不要因为“更结构化”而同时堆表格、流程、时间线和多个小标题。

---

## 三、Shape 选择原则

### PROSE

适用于简单定义、直接事实、短边界说明。

优先结构：

```text
直接结论
→ 必要解释
→ 一个边界或例子（确有帮助时）
```

### CAUSAL_CHAIN

适用于机制、可靠性、一致性、安全等“为什么能工作”的问题。

优先结构：

```text
核心结论
→ 关键前提
→ 因果链
→ 哪一步使结果成立
→ 必要失败边界
```

### SEQUENCE

适用于安装、发布、恢复、数据处理等有顺序的过程。

优先使用编号步骤或简短 flow；步骤必须体现状态 / 数据发生了什么变化，而不是只列函数名。

### COMPARISON_MATRIX

适用于多个对象按统一维度比较，例如：

```text
Schema vs Referential Integrity vs Semantic Evidence
Fact vs Experience vs Claim vs Resume View
```

先用一句话指出最重要的区别，再在确有多个公共比较维度时使用表格。

### TIMELINE

适用于并发交错和竞态。

优先展示：

```text
初始状态
A 动作
B 动作
冲突点
原子 / 仲裁点
```

时间线服务于解释 race，不要把后续所有锁、lease、fencing 等相邻概念都自动展开。

### STATE_TRANSITION

适用于失败 / 恢复 / 生命周期。

展示关键中间状态与恢复规则，重点回答：

```text
系统现在处于什么状态？
下一步允许做什么？
如何回到可继续状态？
```

### COMPONENT_FLOW

适用于架构问题。

先说明整体关系，再解释组件职责和 data/state flow；Why 只在真实设计动机存在时展开。

### EVIDENCE_CHAIN

适用于“如何证明 / 测试能说明什么 / 证据够不够”。

优先结构：

```text
Claim
→ Observation Point
→ Evidence / Assertion
→ Bounded Conclusion
```

Execution Evidence 与静态仓库 Evidence 不得混淆。

### DECISION_FRAME

适用于 trade-off / 选型。

优先结构：

```text
决策目标
→ alternatives
→ decision criteria
→ cost / benefit
→ 适用边界
```

---

## 四、Natural Rendering Rules

最终答案：

1. 第一段或第一句自然、直接回应当前问题；
2. 后续按主 Explanation Shape 组织，不固定“两段式”；
3. 允许自然使用小标题，但小标题来自真实知识结构，不得使用内部字段名；
4. 表格只在存在稳定比较维度时使用；
5. 编号列表只在顺序本身有意义时使用；
6. 时间线 / flow / state 图只在它们比纯文字更容易推演时使用；
7. 真实代码、伪代码、JSON、SQL 等才使用对应代码块；
8. 不为“看起来详细”机械堆结构，也不把整题压成一个高密度长段；
9. 不输出 `直接回答 / 展开说明 / overview / principleDetail / coreAnswer / mechanism / rationale / walkthrough / boundary / abstraction` 等内部组织字段；
10. Explanation Backbone 可以显式展示，也可以只作为内部规划。简单问题如果直接自然回答更清楚，不要强行输出 `A != B` 或 `A → B → C` 模板。

---

## 五、Citation Locality

当当前运行环境支持文件 / Repository / Execution 引用时，provenance 应尽量靠近它支持的事实性陈述。

正确方向：

```text
当前 CLI 的 --force 是先删除目标目录再复制，因此不提供失败回滚。<citation>
```

而不是默认把普通面试答案改造成：

```text
证据列表
- file A
- file B
- file C
```

规则：

- 引用只支持它实际证明的 Claim；
- 项目事实、当前实现、本轮执行结果优先局部引用；
- 通用技术解释不因为项目引用而伪装成项目已实现；
- 用户明确要求证据报告 / 审计清单时，才单独组织 provenance section。

---

## 六、Presentation Completeness Boundary

Presentation Policy 不决定内容是否“够深”。如果渲染时发现某个 Shape 需要的信息根本不存在，例如并发题没有可解释的交错过程，应返回 `interview-depth-policy.md` 补当前答案，而不是用格式填空。

反过来，Presentation Policy 也不得为了填满某个 Shape 而引入当前题不需要的新知识。比如选择 `TIMELINE` 不意味着必须继续解释 lease / fencing；选择 `COMPARISON_MATRIX` 不意味着必须人为补齐所有可能比较维度。

---

## 最小不变量

```text
Complete Answer
→ choose one primary Explanation Shape
→ render naturally
→ keep internal planning fields hidden
→ keep evidence adjacent to supported factual claims
```

任何“Question Dimension 直接等于 Markdown 模板”“固定输出直接回答 / 展开说明”“为了表格完整而补写无关知识”“把内部字段名暴露给用户”的实现都不符合本 Policy。