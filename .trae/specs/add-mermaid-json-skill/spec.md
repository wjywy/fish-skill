# Mermaid 图表 JSON 生成 Skill Spec

## Why
当前仓库缺少一个可将自然语言意图稳定转换为 Mermaid 图表 JSON 结构的专用 skill，导致生成图表前仍需要人工选择图表类型、补足节点关系与结构字段。
新增该 skill 可以把 Mermaid 的文本图表能力封装成可复用的结构化生成流程，降低文档制图与后续渲染接入成本。

## What Changes
- 新增一个 Mermaid JSON 生成 skill，用于把自然语言描述转换为标准化的 Mermaid 图表 JSON 结构
- 定义 skill 的触发条件、输入约束、输出格式与失败处理策略
- 约束 skill 优先产出可映射到 Mermaid 常见图表类型的结构化 JSON，而不是直接输出最终 Mermaid 文本
- 为 skill 增加示例与操作指引，覆盖流程图、时序图等高频图表场景

## Impact
- Affected specs: skills, structured-output, diagram-generation
- Affected code: `template/SKILL.md` 的技能模板约定、`skills/` 目录下的新 skill 目录与 `SKILL.md`

## ADDED Requirements
### Requirement: 自然语言到 Mermaid JSON 的结构化转换
系统 SHALL 提供一个 skill，使代理能够根据用户的自然语言描述生成 Mermaid 图表的 JSON 结构，并明确图表类型、核心元素和关系。

#### Scenario: 生成流程图 JSON
- **WHEN** 用户要求根据一段业务流程描述生成 Mermaid 图表结构
- **THEN** skill 输出包含图表类型、节点、连线和标签信息的 JSON 结构
- **AND** 输出内容足以被后续流程转换为 Mermaid flowchart 语法

#### Scenario: 生成时序图 JSON
- **WHEN** 用户要求根据交互过程描述生成 Mermaid 时序图结构
- **THEN** skill 输出包含参与者、消息顺序和备注信息的 JSON 结构
- **AND** 输出内容足以被后续流程转换为 Mermaid sequenceDiagram 语法

### Requirement: 图表类型判定与缺失信息补全
系统 SHALL 在用户未明确指定图表类型时，根据描述内容优先推断最合适的 Mermaid 图表类型，并在必要时做最小化合理补全。

#### Scenario: 自动推断图表类型
- **WHEN** 用户只提供“用户提交审批后通知财务打款”这类自然语言流程描述
- **THEN** skill 自动选择适合的图表类型
- **AND** 结果中说明所选图表类型或在 JSON 中显式标记该类型

#### Scenario: 最小化补全缺失字段
- **WHEN** 用户描述存在省略但整体意图清晰
- **THEN** skill 仅补全生成 JSON 所必需的最小字段
- **AND** 不凭空扩展与用户目标无关的业务步骤

### Requirement: 输出格式稳定且可校验
系统 SHALL 约束 skill 输出稳定的 JSON 模式，避免自然语言解释污染主输出。

#### Scenario: 返回纯结构化结果
- **WHEN** skill 完成图表结构生成
- **THEN** 主输出为单一、清晰、可解析的 JSON 结构
- **AND** 如需补充说明，应与 JSON 分离或放入约定字段

#### Scenario: 无法可靠生成时返回受控结果
- **WHEN** 用户输入过于模糊，无法可靠确定图表结构
- **THEN** skill 返回受控的错误或澄清导向结构
- **AND** 明确指出缺失的关键信息，例如图表类型、参与者或流程顺序
