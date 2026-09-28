# Resume Bootstrap Workflow

## 目标

当用户已经按“项目 / 工作经历”为单位给出关键词或少量描述时，尽快生成一版可讨论的候选简历内容，并围绕最影响简历质量的缺口做少量追问。

Bootstrap 不负责自动把零散关键词聚类成多个项目，也不在信息不足时补完整故事。

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

默认优先：
1. Ownership
2. Action / Mechanism
3. Result / Metric
4. Context
5. Decision / Tradeoff
6. Timeline / Scope

每轮只追问 1–3 个最能提升简历质量的问题。

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
