# Tasks
- [x] Task 1: 设计 Mermaid JSON skill 的输出契约
  - [x] 明确支持的图表类型首批范围，至少覆盖流程图与时序图
  - [x] 定义统一 JSON 顶层字段，例如 `diagramType`、`title`、`elements`、`relations`、`notes` 或等价结构
  - [x] 规定无法可靠生成时的受控返回格式
  - [x] 规定超出首批支持范围时的 `unsupported` 受控返回格式

- [x] Task 2: 创建新的 skill 目录与 SKILL.md
  - [x] 在 `skills/` 下创建新的 Mermaid 相关 skill 目录
  - [x] 编写 frontmatter，描述 skill 能力与触发条件
  - [x] 编写正文，说明输入分析、图表类型判定、JSON 生成流程与输出约束

- [x] Task 3: 为高频场景补充示例
  - [x] 提供至少一个流程图自然语言输入到 JSON 输出的示例
  - [x] 提供至少一个时序图自然语言输入到 JSON 输出的示例
  - [x] 说明 JSON 如何映射回 Mermaid 常见语法，帮助后续代理衔接

- [x] Task 4: 完成技能质量验证
  - [x] 检查 SKILL.md frontmatter 是否仅包含必需字段
  - [x] 检查 description 是否同时覆盖“做什么”和“何时调用”
  - [x] 验证 skill 输出要求是否强调纯 JSON、稳定结构和最小化补全

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 2
- Task 4 depends on Task 3
