# Kami Renderer

Kami Renderer 负责把 `Resume View` 渲染成 A4 技术简历。它只负责展示，不决定事实、Claim、内容选择或正文措辞。

## 默认主题

用户侧默认主题 ID：`kami-default`。

当前内部映射：

```text
kami-default -> templates/kami-base.html
```

`kami-default` 是稳定 API 名称；即使未来内部基线模板文件发生变化，也应优先保持用户侧 ID 不变。

## 可选主题

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

主题解析规则见 `workflows/theme-selection.md`。

## 数据契约

Renderer 读取：

```json
{
  "renderOptions": {
    "renderer": "kami",
    "theme": "kami-default",
    "format": "html"
  }
}
```

如果 `renderOptions` 或 `theme` 缺失，应使用 `kami-default`，不得因为主题缺失中断渲染。

## 结构与主题分离

- `templates/shared/kami-render.js`：共享结构。
- `templates/shared/kami-family.css`：共享排版。
- `templates/kami-*.html`：主题变量入口。

主题只控制颜色与视觉变量；不得修改 Career Profile、Resume Strategy、Claim 或 Metric。
