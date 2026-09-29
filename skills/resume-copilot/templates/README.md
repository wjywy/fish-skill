# Resume Copilot Templates

这里存放 `resume-copilot` 的 Kami family 模板资源。Kami family 采用 **共享结构 + 主题变量** 的方式维护。

## 当前共享结构

Kami 的结构以标准中文技术简历为主，并参考用户提供的实际简历组织方式：

1. 页头：姓名、教育信息、目标岗位、联系方式
2. 专业技能
3. 工作经历
4. 项目经历
5. 实习经历
6. 开源经历
7. 教育背景（可选；若已在页头体现，可删除）

工作/实习经历统一使用：

- `entry-head`：时间 / 公司或项目 / 部门或类型
- `entry-summary`：总体职责（可选）
- `sub-block`：同一经历下的专项、方向或子项目
- `ul > li`：具体动作、结果与指标

模板不再强制使用旧版的 Metrics、个人简介、Timeline、角色/动作/结果项目卡片、AI 判断与行动、对外影响力等固定模块。这些内容若确实有价值，可作为可选扩展 section 插入，但不属于 Kami 默认结构。

## Kami family 结构

- `shared/kami-render.js`
  - 9 个 Kami 主题共享的唯一 HTML 骨架来源。
  - 修改它即可同步修改所有主题的结构。
- `shared/kami-family.css`
  - 共享排版、A4 打印、经历条目、技能行、专项标题等样式。
  - 使用 `--kami-*` CSS 变量承接主题差异。
- `./kami-base.html`
  - 基线 / 兼容入口。
- 9 个主题：
  - `./kami-ivory.html`
  - `./kami-mono.html`
  - `./kami-navy.html`
  - `./kami-slate.html`
  - `./kami-teal.html`
  - `./kami-forest.html`
  - `./kami-burgundy.html`
  - `./kami-sepia.html`
  - `./kami-copper.html`

9 个主题只覆盖颜色变量，不维护独立主体结构。

## 模板约束

- 默认面向 A4 中文技术简历。
- 主题和结构解耦：结构只改 `kami-render.js`，主题只改 `kami-*.html` 的 CSS 变量。
- section 必须可以按用户实际内容删除或增减，不要求固定模块数量。
- 不强制固定 2 页或 3 页；优先保证信息密度和可读性。
- 不为了视觉结构自动创造内容。
- 项目与工作经历的 bullet 必须来自 Resume View 中已选 Claim / Metric。

## 内容组织建议

- 专业技能使用“能力方向 + 描述”，避免只堆关键词。
- 工作经历中，同一公司存在多个专项时，使用 `sub-block` 聚合，避免拆成多个重复公司条目。
- 独立项目直接作为 `entry` 展示，不强制转换成三段卡片。
- 有明确数字结果时，使用主题强调色突出关键技术词与指标，但避免整句高亮。

## 预览入口

- 统一总览页：`./index.html`

## 用户主题选择

Resume Copilot 对用户暴露 `kami-default` 作为默认主题名。当前解析关系：

```text
kami-default -> kami-base.html
```

其他 9 个主题保持原有 ID。主题选择属于 Render Options，不属于 Resume Strategy；用户不选择时必须回退到 `kami-default`。

## Resume View 对接

Kami 共享渲染器不再输出占位符骨架；它直接消费 `Resume View`。`./shared/sample-data.json` 与 `schemas/resume-view.schema.json` 使用同一结构，避免模板示例与正式数据模型漂移。
