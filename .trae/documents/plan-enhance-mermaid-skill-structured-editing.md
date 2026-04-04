# Mermaid Skill 定向编辑增强计划

## Summary

在现有 `mermaid-json-generator` skill 基础上，补充“定向编辑 Mermaid 结构”的能力，让它不仅能从自然语言生成 Mermaid 源码，还能正确识别并执行对某个具体字段、节点、关系、类、实体、状态等元素的增删改请求。最终输出采用“修改后的完整 Mermaid 源码 + 差异列表”。

## Current State Analysis

- 当前实际生效的 skill 文件位于 `d:\front_many\AI+\skills\.trae\skills\mermaid-json-generator\SKILL.md`
- 仓库分发副本位于 `d:\front_many\AI+\skills\skills\mermaid-json-generator\SKILL.md`
- 当前两个文件内容一致，已支持：
  - 直接输出 Mermaid 源码
  - 支持 `flowchart`、`sequenceDiagram`、`classDiagram`、`erDiagram`、`stateDiagram-v2`
  - 在用户未指定图表类型时先询问，不自动猜测
- 当前 skill 仍缺少以下关键能力：
  - 没有定义“编辑已有 Mermaid 源码”的工作流
  - 没有定义如何识别用户指定的“某个字段与元素”
  - 没有定义名称定位与路径定位的解析规则
  - 没有定义定向编辑的操作集（新增、删除、更新）
  - 没有定义编辑请求的输出格式，当前只强调成功时返回单个 Mermaid 代码块

## Intent & Decisions

- 目标：让 skill 正确处理“生成 + 定向修改”两类 Mermaid 任务
- 成功标准：
  - 能识别基于已有 Mermaid 源码的编辑请求
  - 能识别基于自然语言的定向修改请求
  - 支持名称定位和路径定位两种指定方式
  - 支持增删改三类操作
  - 覆盖全部已支持图表类型：`flowchart`、`sequenceDiagram`、`classDiagram`、`erDiagram`、`stateDiagram-v2`
  - 编辑结果输出“完整 Mermaid 源码 + 差异列表”
- 范围内：
  - 更新 skill 的行为说明、输入模式、定位规则、编辑规则、输出格式、示例与自检要求
- 范围外：
  - 不新增独立脚本、解析器或运行时代码
  - 不改造历史 spec 文档，除非实施时发现其会直接影响当前 skill 使用

## Proposed Changes

### 1. 更新实际生效 skill 的定位与描述

文件：`d:\front_many\AI+\skills\.trae\skills\mermaid-json-generator\SKILL.md`

- 调整 frontmatter `description`
  - 由“生成 Mermaid 源码”扩展为“生成或定向修改 Mermaid 源码”
  - 明确调用场景：用户要新建 Mermaid 图、修改 Mermaid 图中的具体字段/元素、输出可渲染源码时调用
- 更新标题和开场说明
  - 将 skill 定位从单纯 source generator 扩展为 generator + structured editor

### 2. 新增“任务模式”章节

文件：`d:\front_many\AI+\skills\.trae\skills\mermaid-json-generator\SKILL.md`

- 增加明确的两类处理模式：
  - **生成模式**：从自然语言生成 Mermaid 图
  - **编辑模式**：对已有 Mermaid 图或已知图结构执行定向修改
- 为编辑模式定义两类输入来源：
  - 用户直接提供 Mermaid 源码
  - 用户不给源码，但通过自然语言引用已有图结构并要求定向修改
- 规定判定优先级：
  - 出现“改、删、加、替换、把 X 改成 Y、删除某字段/节点”等编辑意图时优先进入编辑模式
  - 若用户给了 Mermaid 源码，则默认视为编辑上下文

### 3. 新增“元素定位规则”章节

文件：`d:\front_many\AI+\skills\.trae\skills\mermaid-json-generator\SKILL.md`

- 定义名称定位规则
  - 支持通过实体名、类名、节点名、状态名、字段名、关系标签、参与者名等进行匹配
  - 当名称唯一时直接定位
  - 当名称冲突时要求 skill 发起澄清，而不是自行猜测
- 定义路径定位规则
  - 支持显式路径式引用，例如：
    - `entity.USER.fields.name`
    - `class.User.methods.manageUsers`
    - `node.Approval.label`
    - `relation.USER_ROLE.assigned_to`
    - `state.Pending`
    - `participant.订单服务`
- 规定名称优先级与冲突处理
  - 路径定位优先级高于自然语言名称定位
  - 当名称定位和路径定位冲突时，以路径为准
  - 无法唯一定位时必须先澄清

### 4. 新增“支持的编辑动作”章节

文件：`d:\front_many\AI+\skills\.trae\skills\mermaid-json-generator\SKILL.md`

- 明确定义三类操作：
  - **更新**：改名、改标签、改字段值、改关系文案、改方向、改类型标记
  - **新增**：新增节点、字段、关系、参与者、类、实体、状态、转移
  - **删除**：删除节点、字段、关系、参与者、类、实体、状态、转移
- 规定编辑边界：
  - 仅修改用户明确指定的目标及其必要依赖
  - 不得顺带重写整张图的命名体系或结构风格
  - 若删除会破坏 Mermaid 基本结构，需要同时清理最小必需依赖并在差异列表中说明

### 5. 为各图表类型补充“可编辑元素映射”

文件：`d:\front_many\AI+\skills\.trae\skills\mermaid-json-generator\SKILL.md`

- `flowchart`
  - 支持编辑节点、节点标签、关系、方向、判断分支标签
- `sequenceDiagram`
  - 支持编辑 actor/participant、消息文本、消息方向、Note
- `classDiagram`
  - 支持编辑类、属性、方法、继承/关联关系
- `erDiagram`
  - 支持编辑实体、字段、PK/FK 标识、关系基数、关系标签
- `stateDiagram-v2`
  - 支持编辑状态、转移、起止状态、转移标签
- 每种类型补充“用户如何指定目标”的示例表达

### 6. 更新澄清策略

文件：`d:\front_many\AI+\skills\.trae\skills\mermaid-json-generator\SKILL.md`

- 保留“未指定图表类型时先询问”的规则
- 额外补充编辑相关澄清场景：
  - 用户说要改某字段，但图中存在多个同名字段
  - 用户只说“改一下这个节点”，但未给名称、路径或上下文
  - 用户要求删除某元素，但会影响多个关系且目标不唯一
- 明确：编辑歧义优先澄清，不允许猜改

### 7. 修改成功输出规则

文件：`d:\front_many\AI+\skills\.trae\skills\mermaid-json-generator\SKILL.md`

- 将当前“成功时只返回 Mermaid 代码块”的规则，扩展为区分两种输出：
  - 生成模式：仍返回单个 Mermaid 代码块
  - 编辑模式：返回“更新后的 Mermaid 代码块 + 简洁差异列表”
- 差异列表应至少覆盖：
  - 操作类型：新增 / 删除 / 更新
  - 目标元素：实体、字段、节点、关系等
  - 变更内容：从什么变成什么，或新增/删除了什么
- 规定差异列表保持简洁，不输出冗长解释

### 8. 增加编辑示例

文件：`d:\front_many\AI+\skills\.trae\skills\mermaid-json-generator\SKILL.md`

- 为至少三类图表新增“输入意图 → 输出结果”示例：
  - `erDiagram`：把 `USER.name` 改成 `username`
  - `flowchart`：给节点 `审批` 新增一条到 `归档` 的连线
  - `classDiagram`：删除 `Admin.manageUsers()` 方法
- 示例输出使用“完整 Mermaid 源码 + 差异列表”格式
- 至少包含一个“名称冲突需要澄清”的例子

### 9. 同步仓库分发副本

文件：`d:\front_many\AI+\skills\skills\mermaid-json-generator\SKILL.md`

- 与 `.trae/skills/...` 的新规则保持一致
- 保证工作区实际版本与仓库分发版本无漂移

## Assumptions & Decisions

- 决策：不新建第二个 skill，而是在现有 `mermaid-json-generator` 上增强
- 决策：同一个 skill 同时支持“生成”和“定向编辑”
- 决策：编辑模式支持两种输入来源：已有 Mermaid 源码、纯自然语言编辑指令
- 决策：目标定位同时支持名称定位和路径定位，且路径优先级更高
- 决策：编辑动作覆盖新增、删除、更新
- 决策：编辑能力覆盖全部当前已支持 Mermaid 图类型
- 决策：编辑模式输出“完整 Mermaid 源码 + 差异列表”
- 假设：本次需求仍可通过更新 `SKILL.md` 规则完成，无需额外脚本或程序

## Verification

- 检查两个 `SKILL.md` 是否都包含以下新增内容：
  - 任务模式区分
  - 元素定位规则
  - 增删改操作定义
  - 各图类型的可编辑元素映射
  - 编辑模式下的输出格式
  - 编辑歧义的澄清规则
- 检查 frontmatter 仍只包含 `name` 和 `description`
- 检查 `description` 同时说明能力和触发时机
- 人工核对两个文件内容保持一致
- 用示例验证规则完整性：
  - “把 USER.name 改成 username” 应被识别为字段更新
  - “删除 Admin.manageUsers” 应被识别为方法删除
  - “给审批节点新增到归档的连线” 应被识别为关系新增
  - 同名目标冲突时，应先澄清而不是直接修改
