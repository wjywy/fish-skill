# JD Tailoring Workflow

## 目标

将具体 JD 转换为结构化岗位要求，并交给 Resume Strategy 做内容选择。JD Tailoring 不直接生成简历 bullet。

## 流程

1. 读取 JD 原文。
2. 提取职责、必需能力、优先能力、业务语境和结果预期。
3. 将自然语言要求归一化为 `JDRequirement`。
4. 去除公司宣传、福利、重复描述等非筛选信息。
5. 将每条 Requirement 映射到已有 Claims。
6. 标记 `covered / weakly_covered / gap`。
7. 将 Requirement 集合交给 `workflows/resume-strategy.md`。

## 核心约束

- 不做纯关键词堆叠。
- 不因为 JD 出现某个技术名词就把它加入 Skills。
- 不从 JD 反向制造 Career Profile 中不存在的经历。
- 同一事实可以针对 JD 改变强调角度，但不能改变 ownership、metric 或技术事实。

## 无 JD 时

如果用户只提供目标岗位而没有 JD：

- 可以依据岗位名称做通用 Strategy；
- 明确这是 Role-level tailoring，而不是 Company/JD-level tailoring；
- 不虚构某公司的具体要求。
