# Raw Career Input Intake Workflow

## Required References

按输入类型读取，不一次性加载全部材料：

- 需要建立 Fact 时：`../schemas/fact.schema.json`
- 当前仓库模式：转入 `../workflows/repository-inspection.md`
- 已有完整 Career Profile 需要校验结构时，可参考 `../examples/career-profile.example.json`

## 目标

允许用户从任意粒度开始，而不要求理解 Resume Copilot 的内部 Schema。

可接受输入包括：
- 按项目 / 经历组织的关键词与描述
- 一句话或零散描述
- 旧简历
- JD
- 项目 README / 方案文档
- Repository / Coding Agent 当前工作区
- 周报、季度总结、述职材料
- 已有聊天内容

## 核心原则

1. 原始材料先转成 `Fact`，再进入 Experience / Claim。
2. JD 只用于目标岗位分析，不作为用户经历证据。
3. 文档、README、代码仓库可以证明“项目存在某能力”，不能自动证明“用户本人实现了该能力”。
4. 用户已经按项目 / 经历分组时，不再次做自动聚类。
5. 用户目标是生成简历时，先检查 Target Role / Target Direction；目标方向未知时可以继续抽取 Facts，但不得输出正式 Resume Bullet。
6. 目标方向明确后优先 Draft-first；已有足够信息就先给可讨论 Draft，再补关键缺口。


## Target Direction Gate

当用户提出“生成简历 / 写项目经历 / 优化简历内容”时：

- 若已明确目标岗位或方向：继续后续流程。
- 若未明确：先询问用户目标方向。
- 推荐询问方式：
  > 这份简历主要投什么方向？例如前端、后端、Agent、产品、全栈，或者直接给我具体岗位名称。
- 不要求用户必须提供 JD。只有方向也足以进入 Bootstrap；有 JD 时再由 Resume Strategy 做进一步定向。
- 资料解析、仓库扫描和 Fact 抽取不受该 Gate 阻塞。

## 主链路

```text
Raw Career Input
      ↓
Facts
      ↓
Target Direction known?
   ├─ no → Ask Target Direction
   └─ yes
      ↓
Resume Bootstrap / Experience Mining
      ↓
Verification
      ↓
Experience + Claim + Metric
```

## 场景处理

### 用户给一段经历 + 关键词

直接进入 `../workflows/resume-bootstrap.md`。不要要求用户填写表单，也不要把其他经历关键词混入当前项目。

### 用户给旧简历 / 工作总结

抽取 Facts，区分已明确事实、需要确认的 Ownership、Result 和 Metric；只追问缺失和高风险部分。

### 用户给 JD

JD 进入 Resume Strategy 的 requirement 解析，不进入 Career Evidence。若没有任何经历材料，再询问最相关的一段经历作为起点。

### 用户给 README / 项目文档

抽取项目事实，Ownership 默认未验证；需要写入人物简历的能力再做 Ownership 确认。

### 用户要求结合当前 Coding Agent 项目

进入 `../workflows/repository-inspection.md`，主动检查当前工作区。仓库得到的事实统一写入 `Fact`，`sourceType = REPOSITORY`，Ownership 初始为 `UNVERIFIED`。

## 停止条件

当已有信息足以生成至少一个 Candidate Experience 或正式 Bullet 时进入后续流程，不为了“资料完整”强迫用户一次性交代全部职业经历。
