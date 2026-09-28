# Kami Resume Built-in

Kami 是 Resume Copilot 内置 HTML Renderer family。

## 结构

Kami 9 个主题共享 `templates/shared/kami-render.js` 中的统一主体结构。当前默认结构采用标准中文技术简历组织方式：页头、专业技能、工作经历、项目经历、实习经历、开源经历以及可选教育背景。

主题包装页仅负责覆盖 `--kami-*` CSS 变量，因此更改共享结构不会破坏主题配色。

## 数据职责

Kami 只消费已经生成好的 Resume View。简历内容选择、Claim 选择、指标真实性、JD Tailoring 等逻辑均应在 Renderer 之前完成。
