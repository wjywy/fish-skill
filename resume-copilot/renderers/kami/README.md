# Kami Renderer

Kami Renderer 负责把 `Resume View` 渲染成 A4 技术简历。它只负责展示，不决定事实、Claim、内容选择或正文措辞。

## 默认主题

用户侧默认主题 ID：`kami-default`，当前映射到 `templates/kami-base.html`。

可选主题：
- `kami-default`
- `kami-ivory`
- `kami-mono`
- `kami-navy`
- `kami-slate`
- `kami-teal`
- `kami-forest`
- `kami-burgundy`
- `kami-sepia`
- `kami-copper`

## 主题选择

主题只在渲染阶段解析：
- 用户已指定主题：直接使用。
- 用户说“默认 / 随便 / 直接生成 / 你决定”：使用 `kami-default`。
- 用户无偏好：不得阻塞生成，使用 `kami-default`。
- 生成 HTML / PDF 前可以询问一次主题偏好，但用户不需要必须选择。

主题自然语言映射：Default / 默认、Ivory / 象牙白、Mono / 黑白、Navy / 深蓝、Slate / 灰蓝、Teal / 青色、Forest / 森林绿、Burgundy / 酒红、Sepia / 复古棕、Copper / 铜色。

## 数据契约

```json
{
  "renderOptions": {
    "renderer": "kami",
    "theme": "kami-default",
    "format": "html"
  }
}
```

缺少 `renderOptions` 或 `theme` 时使用 `kami-default`。

## 结构与主题分离

- `templates/shared/kami-render.js`：共享结构。
- `templates/shared/kami-family.css`：共享排版。
- `templates/kami-*.html`：主题变量入口。

主题只控制颜色与视觉变量；不得修改 Career Profile、Resume Strategy、Claim 或 Metric。
