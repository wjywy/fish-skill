# Resume Theme Selection Workflow

## 目标

在 Resume View 内容确定后、正式渲染前，让用户选择简历视觉主题。主题选择只影响展示，不允许反向修改 Career Profile、Claim、Resume Strategy 或正文事实。

## 默认行为

- 默认主题：`kami-default`。
- `kami-default` 是用户侧稳定名称，当前映射到 Kami 基线主题（`kami-base.html`）。
- 用户没有主题偏好、回复“默认 / 随便 / 直接生成 / 你决定”时，不继续追问，直接使用 `kami-default`。
- 用户已明确指定主题时，不重复询问。

## 什么时候询问

当同时满足以下条件时，可以在正式生成 HTML / PDF 前询问一次：

1. Resume View 已基本确定；
2. 用户要求生成可视化简历文件；
3. 用户尚未指定主题；
4. 当前交互允许询问而不会阻碍用户明确要求的立即生成。

推荐表达：

> 简历内容已经整理好。你可以选择 Kami 主题：Default、Ivory、Mono、Navy、Slate、Teal、Forest、Burgundy、Sepia、Copper。没有偏好的话我会使用 Default。

不要要求用户必须选择。

## 可选主题

用户侧主题 ID：

- `kami-default`（默认）
- `kami-ivory`
- `kami-mono`
- `kami-navy`
- `kami-slate`
- `kami-teal`
- `kami-forest`
- `kami-burgundy`
- `kami-sepia`
- `kami-copper`

## 解析规则

允许自然语言主题名，例如：

- “默认 / default” → `kami-default`
- “象牙白 / ivory” → `kami-ivory`
- “黑白 / mono / 极简黑白” → `kami-mono`
- “深蓝 / navy” → `kami-navy`
- “灰蓝 / slate” → `kami-slate`
- “青色 / teal” → `kami-teal`
- “森林绿 / forest” → `kami-forest`
- “酒红 / burgundy” → `kami-burgundy`
- “复古棕 / sepia” → `kami-sepia`
- “铜色 / copper” → `kami-copper`

如果用户只描述颜色但无法唯一映射到现有主题，可以给出最接近的 2–3 个选项；不要擅自创建不存在的主题。

## 数据写入

主题选择写入 `Resume View.renderOptions.theme`，而不是写入 Career Profile 或 Resume Strategy。

示例：

```json
{
  "renderOptions": {
    "renderer": "kami",
    "theme": "kami-default"
  }
}
```

## 边界

- Theme 决定颜色、纸张、线条、强调色等视觉变量。
- Resume View 决定章节、文本、顺序与信息密度。
- Renderer 不得因为某个主题空间不足而删除未经用户同意的事实；只能进行合法分页、字号与间距适配。
