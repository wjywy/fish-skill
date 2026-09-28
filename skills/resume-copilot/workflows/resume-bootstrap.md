# Resume Bootstrap Workflow

## 目标

当用户已经按“项目 / 工作经历”为单位给出关键词或少量描述时，在目标岗位 / 方向明确的前提下，尽快生成一版可讨论的候选简历内容，并围绕最影响简历质量的缺口做少量追问。

Bootstrap 不负责自动把零散关键词聚类成多个项目，也不在信息不足时补完整故事。


## 前置条件：目标方向

生成 provisional bullet 前必须已知 `Target Role / Target Direction`。

- 已知：按该方向决定表达重点和术语侧重。
- 未知：先询问用户，不得根据技术关键词自行猜测。
- 未知时仍可抽取 Facts、列出缺口，但不要生成带岗位倾向的正式或半正式 Bullet。

同一段事实针对不同方向可以有不同表达重点，但不得改变事实本身。

## 典型输入

```text
项目：低代码平台
负责：页面编辑器、事件驱动器
关键词：页面编辑、实时预览、Schema
```

或：

```text
经历：新品发布系统
关键词：Go、MySQL、Redis Pipeline、17 万 Key、全量刷新改增量刷新、7h+ → 5min
```

用户负责说明哪些关键词属于同一段经历；Skill 负责组内理解、补全、验证和简历化。

## 核心链路

```text
User-defined Experience Input
      ↓
Extract Facts
      ↓
Generate Candidate Bullet / Skeleton
      ↓
Mark Known / Needs Confirmation / Missing
      ↓
Rank Information Gaps
      ↓
Ask 1–3 High-value Questions
      ↓
Verified Experience / Claims / Metrics
```

## Step 1：抽取事实

优先抽取：
- Context：为什么做、原始问题是什么
- Ownership：负责 / 主导 / 参与 / 协作
- Action：具体做了什么
- Mechanism / Technology：怎么做
- Decision：为什么这样设计
- Result / Metric：结果与量化数据
- Timeline / Scope：时间、规模和影响范围

每个事实保留来源；无法确认的 Ownership、Result、Metric 标为 `needs_confirmation`。

## Step 2：先生成可讨论 Draft

如果已有足够信息形成“动作 + 对象 + 技术机制”，可以先生成 provisional bullet，并明确尚未确认的部分。

如果信息不足，则输出候选骨架与缺口，不要用“负责 XX 相关能力建设”填空。

## Step 3：缺口优先级

默认追问顺序固定为：

1. **Ownership**：你在这件事里到底负责什么、做到哪一层。
2. **Action / Mechanism**：你具体做了什么，以及关键机制如何实现。
3. **Context / Problem**：为什么要做，原始问题或约束是什么。
4. **Result / Metric**：最终效果、规模、效率、性能或业务结果。
5. **Decision / Tradeoff**：只有存在真实取舍时，再追问为什么这样设计。
6. **Timeline / Scope**：仅在影响简历可信度或表达时补充。

每轮只追问 1–3 个最能提升简历质量的问题。不要跳过 Ownership 直接深入技术细节。


## Resume Ready 停止条件

以下条件满足后，Bootstrap 默认停止主动追问并进入正式 Claim / Resume 生成：

- Context / Problem 已知；
- Ownership 已知；
- 至少一个明确 Action；
- 至少一个具体 Mechanism / 技术实现；
- Result 已知，或用户明确暂无可靠量化结果；
- 已足以生成与 Target Role 对齐的高信息密度 Bullet。

不要为了补齐“所有可能的技术细节”继续追问。架构边界、故障恢复、技术取舍等深挖应留给 Interview Knowledge，除非它直接影响简历 Claim 的真实性或强度。

## Step 4：进入正式模型

当某个候选经历达到 Experience Ready：

```text
Facts
  ↓
Verification
  ↓
Experience / Claim / Metric
  ↓
Career Profile
```

Bootstrap Draft 不是事实源；最终 Resume View 仍必须由 Verified Claims / Metrics 生成。
