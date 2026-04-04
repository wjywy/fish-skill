# Mermaid Skill 改造计划

## Summary

将现有 `mermaid-json-generator` skill 从“以结构化 JSON 为主输出”的模式，改为“以可直接渲染的 Mermaid 源码为主输出”的模式，同时扩展常见图表类型支持，并把“未指定图表类型时自动推断”改为“主动询问用户选择图表类型”。

## Current State Analysis

- 当前实际生效的 skill 文件位于 `d:\front_many\AI+\skills\.trae\skills\mermaid-json-generator\SKILL.md`
- 仓库分发副本位于 `d:\front_many\AI+\skills\skills\mermaid-json-generator\SKILL.md`
- 两个文件当前内容一致，均要求：
  - 主输出必须是单个 JSON 对象
  - 仅支持 `flowchart` 与 `sequence`
  - 用户未指定图表类型时自动推断
  - 不直接输出 Mermaid 源码
- 现有 `.trae/specs/add-mermaid-json-skill/spec.md` 记录的需求仍然是“生成 Mermaid JSON”，与本次新目标存在偏差，但该 spec 不是当前必须同步修改的运行入口

## Proposed Changes

### 1. 更新实际生效 skill

文件：`d:\front_many\AI+\skills\.trae\skills\mermaid-json-generator\SKILL.md`

- 调整 frontmatter `description`
  - 从“生成 Mermaid-ready JSON”改为“生成可直接渲染的 Mermaid 源码”
  - 明确触发条件：当用户要图表源码、Mermaid 代码块、文档可渲染图表时调用
- 重写正文定位与输出规则
  - 将主输出改为单个 Mermaid 代码块或纯 Mermaid 源码
  - 删除“主输出只能是 JSON 对象”的要求
  - 明确除非为必要澄清，否则不要在源码前后添加解释性 prose
- 修改类型判定策略
  - 删除“未指定时自动推断最合适图表类型”的默认策略
  - 改为：若用户未明确说明图表类型，先提出澄清问题，询问要生成哪一种 Mermaid 图
- 扩展支持范围
  - 在保留 `flowchart`、`sequence` 的基础上，补充常见 Mermaid 类型的使用边界与输出规则
  - 计划加入：`classDiagram`、`erDiagram`、`stateDiagram-v2`
- 为每种支持类型增加最小可用生成约束
  - flowchart：方向、节点、边、判断节点映射
  - sequence：participant/actor、消息顺序、reply/note
  - classDiagram：类、属性、方法、继承/关联
  - erDiagram：实体、字段、主外键风格、关系基数
  - stateDiagram-v2：状态、转移、起止状态
- 更新失败处理
  - 对“未指定图表类型”的情况返回澄清导向输出要求，而不是直接猜测
  - 对超出支持范围的 Mermaid 图类型，返回受控 unsupported 风格结果，但主导向仍是让代理先向用户确认
- 更新示例
  - 将现有 JSON 示例改成 Mermaid 源码示例
  - 至少覆盖 `flowchart`、`sequence`，并补充新增图表类型中的代表性示例
- 补充自检清单
  - 校验输出是否为合法 Mermaid 源码
  - 校验首行图表声明是否正确
  - 校验未指定图表类型时是否先询问而不是猜测

### 2. 同步仓库分发副本

文件：`d:\front_many\AI+\skills\skills\mermaid-json-generator\SKILL.md`

- 与 `.trae/skills/...` 中的改动保持一致
- 保证工作区直接使用版本与仓库分发版本不漂移，避免后续维护出现双份规范不一致

## Assumptions & Decisions

- 决策：最终主输出采用 Mermaid 源码，而不是 JSON
- 决策：未指定图表类型时，必须先询问用户，而不是自动推断
- 决策：本次改造不只保留现有两种图表，而是扩展到更多常见 Mermaid 类型
- 假设：当前 skill 主要通过修改 `SKILL.md` 指令来改变行为，不涉及额外脚本或运行时代码
- 假设：本次任务的核心是 skill 行为定义更新，不要求同步改写历史 spec 文档，除非实现后发现其已影响实际使用

## Verification

- 对两个 `SKILL.md` 做文本核对，确认内容一致
- 检查 frontmatter 仅包含 `name` 和 `description`
- 检查 `description` 同时描述“做什么”和“何时调用”
- 人工验证文档中每类示例都为 Mermaid 源码而非 JSON
- 人工验证规则中明确写出：
  - 未指定图表类型时先询问用户
  - 已指定图表类型时直接生成 Mermaid 源码
  - 对不支持类型进行受控处理
- 用至少一个简单请求做行为对照验证：
  - 指定图表类型时，预期输出 Mermaid 源码
  - 未指定图表类型时，预期先发起澄清
