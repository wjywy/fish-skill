#!/usr/bin/env node
/* ===== scripts/build-resume.mjs —— Resume View → 成品 HTML 生成器

   解决的问题：Renderer 是浏览器端 JS（kami-render.js + 主题页），此前没有
   「从 JSON 直接吐出成品 HTML」的命令，使用方被迫自己写组装拼接脚本。

   默认交付（约定）：**一个 index.html**，内置真实数据 + 主题选择器，
   用户在这个页面里选配色，再打印导出 PDF。

   用法：
     node build-resume.mjs --data resume.json                        # 默认：门户页 index.html
     node build-resume.mjs --data resume.json --out 我的简历.html
     node build-resume.mjs --data resume.json --theme kami-navy       # 指定主题：单文件成品
     node build-resume.mjs --data resume.json --mode linked           # 相对引用 shared/ 资产

   参数：
     --data    <path>  Resume View JSON（必填）
     --theme   <name>  kami-base | kami-mono | kami-navy | kami-copper | kami-seal
                       指定后按 --mode（默认 single）产出该主题的单文件/链接页；
                       不指定则产出 portal（主题选择门户页）
     --mode    <mode>  portal（默认）/ single（单文件自包含）/ linked（相对引用）
     --out     <path>  输出文件（portal 默认 ./index.html；其余默认 ./resume-<theme>.html）
     --title   <text>  覆盖 <title>（默认取 header.name + " · 简历"）

   产物说明：
     · portal：单文件，内嵌全部主题色板（属性选择器切换）+ 右上角主题选择器
       （@media print 隐藏，不进 PDF）；切换只改 CSS 变量，不重新渲染。
     · single：CSS（family + layout + 主题变量）与渲染器 JS 全部内联，产出即成品；
       @font-face 的 src 列表**原样保留**（本地路径 + CDN 兜底都在），不做任何改写 ——
       离线字体由 scripts/ensure-fonts.sh 负责。
     · linked：相对引用 templates/shared/ 下的资产，适合在仓库内预览。
     · 头像由 Resume View 的 header.avatar 控制（正式产物不含预览切换开关）。 ===== */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = resolve(SCRIPT_DIR, "..", "templates");
const SHARED_DIR = join(TEMPLATES_DIR, "shared");

const THEMES = ["kami-base", "kami-mono", "kami-navy", "kami-copper", "kami-seal"];
const THEME_LABELS = {
  "kami-base": "基础·藏青",
  "kami-mono": "极简黑白",
  "kami-navy": "冷调商务",
  "kami-copper": "暖调工匠",
  "kami-seal": "朱砂印",
};
const THEME_NOTES = {
  "kami-base": "上游原配色：羊皮纸底 + 藏青强调。默认回退款。",
  "kami-mono": "全家族唯一无彩色的一套；黑白打印零损耗，走灰度链路也稳。",
  "kami-navy": "深藏青 + 冷白纸，对比最硬、最正式；后端 / 基建岗位首选。",
  "kami-copper": "铜棕强调 + 最暖的羊皮纸；暖而不艳，适合强调动手与叙事。",
  "kami-seal": "唯一高饱和款：印章朱红 + 暖米白纸，记忆点最跳。",
};
const COLOR_VARS = [
  "--parchment",
  "--ivory",
  "--border",
  "--border-soft",
  "--near-black",
  "--dark-warm",
  "--olive",
  "--stone",
  "--brand",
  "--brand-tint",
];

/* ---------- CLI ---------- */
function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const key = argv[i];
    if (!key.startsWith("--")) throw new Error(`无法识别的参数：${key}（参数需以 -- 开头）`);
    const name = key.slice(2);
    const value = argv[i + 1];
    if (value === undefined || value.startsWith("--")) throw new Error(`参数 ${key} 缺少值`);
    args[name] = value;
    i++;
  }
  if (!args.data) throw new Error("缺少 --data <resume.json>");
  if (args.theme && !THEMES.includes(args.theme)) {
    throw new Error(`未知主题 ${args.theme}。可选：${THEMES.join(" / ")}`);
  }
  // 未指定主题 → 画廊入口页（约定交付：templates/index.html 那种形态）；
  // 指定主题 → 该主题的单文件/链接页
  args.mode = args.mode || (args.theme ? "single" : "gallery");
  if (!["gallery", "portal", "single", "linked"].includes(args.mode)) {
    throw new Error(`--mode 只支持 gallery / portal / single / linked，收到：${args.mode}`);
  }
  if (["single", "linked"].includes(args.mode) && !args.theme) {
    throw new Error(`--mode ${args.mode} 需要同时指定 --theme`);
  }
  args.out =
    args.out ||
    (args.mode === "gallery"
      ? join(TEMPLATES_DIR, "index.html")
      : args.mode === "portal"
        ? join(process.cwd(), "index.html")
        : join(process.cwd(), `resume-${args.theme.replace(/^kami-/, "")}.html`));
  return args;
}

/* ---------- 色板提取 ---------- */
function pickColorDecls(block) {
  const out = {};
  for (const name of COLOR_VARS) {
    const m = block.match(new RegExp(`${name}\\s*:\\s*([^;]+);`));
    if (m) out[name] = m[1].trim();
  }
  return out;
}

function declsToCss(decls, indent = "    ") {
  return Object.entries(decls)
    .map(([k, v]) => `${indent}${k}: ${v};`)
    .join("\n");
}

/* base 色板 = 上游 kami-family.css 的 :root（不覆盖时的默认值） */
function readBasePalette() {
  const css = readFileSync(join(SHARED_DIR, "kami-family.css"), "utf8");
  const m = css.match(/:root\s*\{([\s\S]*?)\}/);
  if (!m) throw new Error("kami-family.css 里没有找到 :root 色板");
  return pickColorDecls(m[1]);
}

/* 主题色板 = 主题页 <style> 里的 :root（kami-base 无覆盖，用上游默认值） */
function readThemePalette(theme) {
  if (theme === "kami-base") return readBasePalette();
  const html = readFileSync(join(TEMPLATES_DIR, `${theme}.html`), "utf8");
  const m = html.match(/<style>([\s\S]*?)<\/style>/);
  if (!m) throw new Error(`${theme}.html 里没有找到 <style> 色板块`);
  return pickColorDecls(m[1]);
}

/* 指定主题时嵌入的色板块：只取声明，不搬主题页里的开发注释
   （注释是给人看主题页源码用的，不该出现在成品里） */
function themeStyleBlock(theme) {
  if (theme === "kami-base") return "";
  const decls = readThemePalette(theme);
  return `<style>\n:root {\n${declsToCss(decls, "  ")}\n}\n</style>`;
}

/* ---------- 门户页：主题选择器 ---------- */
const SWITCHER_CSS = `
/* ===== 主题选择器（仅门户页） =====
   直角色块 + 发丝线，与"这是一张纸"的质感一致；打印时整体隐藏，不进 PDF。 */
.theme-bar {
  position: fixed;
  top: 14px;
  right: 14px;
  z-index: 99;
  display: flex;
  align-items: stretch;
  gap: 6px;
  font: 500 12px/1 var(--sans, sans-serif);
}
.theme-bar button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  cursor: pointer;
  background: var(--ivory);
  color: var(--dark-warm);
  border: 1px solid var(--border);
  border-radius: 0;
  font: inherit;
}
.theme-bar button:hover {
  border-color: var(--brand);
  color: var(--brand);
}
.theme-bar button[aria-pressed="true"] {
  border-color: var(--brand);
  color: var(--brand);
  box-shadow: inset 0 -2px 0 var(--brand);
}
.theme-bar button i {
  width: 10px;
  height: 10px;
  display: inline-block;
  border: 1px solid rgba(0, 0, 0, .12);
}
.theme-bar .hint {
  align-self: center;
  margin-right: 2px;
  color: var(--stone);
  font-weight: 400;
}
@media print {
  .theme-bar { display: none; }
}`;

const SWITCHER_JS = `
/* 主题切换：只改 CSS 变量，不重新渲染；选择记到 localStorage，刷新后保持。 */
(function () {
  var KEY = "kami-resume-theme";
  var root = document.documentElement;
  var bar = document.createElement("div");
  bar.className = "theme-bar";
  var hint = document.createElement("span");
  hint.className = "hint";
  hint.textContent = "主题";
  bar.appendChild(hint);

  var themes = __THEMES__;
  var swatches = __SWATCHES__;

  function apply(name) {
    root.setAttribute("data-theme", name);
    for (var i = 0; i < bar.buttons.length; i++) {
      var b = bar.buttons[i];
      b.setAttribute("aria-pressed", b.dataset.theme === name ? "true" : "false");
    }
    try { localStorage.setItem(KEY, name); } catch (e) {}
  }

  bar.buttons = themes.map(function (t) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.theme = t.id;
    var dot = document.createElement("i");
    dot.style.background = swatches[t.id];
    btn.appendChild(dot);
    btn.appendChild(document.createTextNode(t.label));
    btn.addEventListener("click", function () { apply(t.id); });
    bar.appendChild(btn);
    return btn;
  });

  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  document.body.appendChild(bar);
  apply(themes.some(function (t) { return t.id === saved; }) ? saved : "__DEFAULT__");
})();`;

/* ---------- 画廊入口页（gallery 模式） ---------- */
const GALLERY_CSS = `
html { background: #f5f4ed; }
body {
  margin: 0;
  padding: 40px 24px 64px;
  color: #141413;
  font: 400 15px/1.85 "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
}
.gallery { max-width: 900px; margin: 0 auto; }
h1 { margin: 0; font-size: 28px; font-weight: 500; letter-spacing: .5pt; }
.hero p { margin: 12px 0 0; max-width: 76ch; color: #4a4a45; }
.section-head { margin: 34px 0 12px; color: #6b6a64; font-size: 13px; letter-spacing: .1em; }
.themes { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
.theme {
  border: 1px solid #e8e6dc;
  border-radius: 0;
  background: #faf9f5;
  padding: 14px 16px 16px;
}
.theme h2 { margin: 10px 0 6px; font-size: 15px; font-weight: 600; }
.chip { display: inline-flex; gap: 4px; }
.chip i { width: 22px; height: 12px; display: inline-block; border: 1px solid #e8e6dc; }
.theme .note { margin: 0; font-size: 13px; line-height: 1.7; color: #6b6a64; }
.theme a { display: inline-block; margin-top: 10px; font-size: 13px; color: #1b365d; }
.foot { margin-top: 30px; padding-top: 14px; border-top: 1px solid #e8e6dc; color: #6b6a64; font-size: 13px; }
`;

function buildGalleryHtml(name, cards) {
  const cardHtml = cards
    .map(
      (c) => `        <article class="theme">
          <span class="chip"><i style="background: ${c.brand}"></i><i style="background: ${c.paper}"></i></span>
          <h2>${c.id}</h2>
          <p class="note"><strong>${c.label}</strong> —— ${c.note}</p>
          <a href="${c.file}">打开</a>
        </article>`
    )
    .join("\n\n");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${name} · 简历主题选择</title>
<meta name="generator" content="Kami Family (build-resume.mjs · gallery)">
<style>${GALLERY_CSS}</style>
</head>
<body>
<main class="gallery">
  <section class="hero">
    <h1>${name} · 简历</h1>
    <p>下面每套主题都是<b>同一份真实简历内容</b>，只换配色。点开任意一套，
       用浏览器「打印 → 另存为 PDF」即可导出（建议勾选「背景图形」保留纸色）。</p>
  </section>

  <p class="section-head">主题</p>
  <section class="themes">
${cardHtml}
  </section>

  <p class="foot">
    共 ${cards.length} 套主题。每套页面左上角都有<strong>头像控件</strong>：
    可选择本地照片或移除头像（该控件打印时自动隐藏，不会出现在 PDF 里）。<br />
    想换回样例预览页，见 <code>index.sample.html</code>。
  </p>
</main>
</body>
</html>
`;
}

/* ---------- 头像控件（生成页用，打印时隐藏） ----------
   头像属于交付阶段的视觉决策：不在对话里反问，交给用户在页面上决定。
   选择本地图片后写成 data URL 塞回 Resume View 再重渲染；可随时移除。 */
const AVATAR_CSS = `
.avatar-bar {
  position: fixed;
  top: 14px;
  left: 14px;
  z-index: 99;
  display: flex;
  align-items: center;
  gap: 8px;
  font: 500 12px/1 "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
}
.avatar-bar button,
.avatar-bar label {
  display: inline-flex;
  align-items: center;
  padding: 7px 10px;
  cursor: pointer;
  background: var(--ivory, #faf9f5);
  color: var(--dark-warm, #3d3d3a);
  border: 1px solid var(--border, #e8e6dc);
  border-radius: 0;
  font: inherit;
}
.avatar-bar button:hover,
.avatar-bar label:hover {
  border-color: var(--brand, #1b365d);
  color: var(--brand, #1b365d);
}
.avatar-bar input[type="file"] { display: none; }
.avatar-bar .tip { color: var(--stone, #6b6a64); font-weight: 400; }
@media print {
  .avatar-bar { display: none; }
}`;

const AVATAR_JS = `
(function () {
  var bar = document.createElement("div");
  bar.className = "avatar-bar";

  var label = document.createElement("label");
  label.textContent = "选择头像";
  var input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  label.appendChild(input);
  bar.appendChild(label);

  var remove = document.createElement("button");
  remove.type = "button";
  remove.textContent = "移除头像";

  var tip = document.createElement("span");
  tip.className = "tip";

  function render() {
    renderKamiResume({ target: "#kami-root", data: window.KAMI_RESUME_DATA });
    var has = !!window.KAMI_RESUME_DATA.header.avatar;
    remove.style.display = has ? "" : "none";
    tip.textContent = has ? "" : "未设置头像（标准页头）";
  }

  input.addEventListener("change", function () {
    var f = input.files && input.files[0];
    if (!f) return;
    var reader = new FileReader();
    reader.onload = function () {
      window.KAMI_RESUME_DATA.header.avatar = String(reader.result);
      render();
    };
    reader.readAsDataURL(f);
  });

  remove.addEventListener("click", function () {
    delete window.KAMI_RESUME_DATA.header.avatar;
    input.value = "";
    render();
  });

  bar.appendChild(remove);
  bar.appendChild(tip);
  document.body.appendChild(bar);
  render();
})();`;

/* ---------- 通用片段 ---------- */
function safeInline(code, tag) {
  return code.replace(new RegExp(`</\\s*${tag}`, "gi"), `<\\\\/${tag}`);
}

function safeJson(json) {
  return json.replace(/<\//g, "<\\/");
}

function build(args) {
  const data = JSON.parse(readFileSync(resolve(args.data), "utf8"));
  if (!data || !data.header) throw new Error("Resume View 缺少 header，无法渲染");

  const familyCss = readFileSync(join(SHARED_DIR, "kami-family.css"), "utf8");
  const layoutCss = readFileSync(join(SHARED_DIR, "kami-layout.css"), "utf8");
  const rendererJs = readFileSync(join(SHARED_DIR, "kami-render.js"), "utf8");

  const title = args.title || `${data.header.name || "简历"} · 简历`;
  const dataScript = `<script>\nwindow.KAMI_RESUME_DATA = ${safeJson(JSON.stringify(data, null, 2))};\n</script>`;
  const renderCall = `<script>\n  renderKamiResume({ target: "#kami-root", data: window.KAMI_RESUME_DATA });\n</script>`;

  let head;
  let extraBody = "";
  let rendererPart;

  if (args.mode === "portal") {
    const base = readBasePalette();
    // 只输出带声明的 [data-theme] 块，不输出空占位（空 :root 块只带来噪音）
    const blocks = THEMES.map((t) => {
      const decls = t === "kami-base" ? base : readThemePalette(t);
      return `[data-theme="${t}"] {\n${declsToCss(decls)}\n}`;
    }).join("\n\n");

    const swatches = {};
    for (const t of THEMES) swatches[t] = readThemePalette(t)["--brand"] || "#888";

    head = `    <style>\n${familyCss}\n    </style>\n    <!-- 本 skill 的版式微调，必须在上游样式之后加载 -->\n    <style>\n${layoutCss}\n    </style>\n    <!-- 全部主题色板：切换只改 data-theme，不重新渲染 -->\n    <style>\n${blocks}\n    </style>\n    <style>${SWITCHER_CSS}\n${AVATAR_CSS}\n    </style>`;
    extraBody = `
<div class="theme-bar" hidden></div>
<!-- 主题选择器：页面内直接换配色，打印时自动隐藏，不进 PDF -->`.trim();
    const switcherJs = SWITCHER_JS.replace(
      "__THEMES__",
      JSON.stringify(THEMES.map((t) => ({ id: t, label: THEME_LABELS[t] })))
    )
      .replace("__SWATCHES__", JSON.stringify(swatches))
      .replace("__DEFAULT__", args.theme || "kami-base");
    rendererPart =
      `<script>\n${safeInline(rendererJs, "script")}\n</script>\n${renderCall}\n<script>${switcherJs}\n${AVATAR_JS}\n</script>`;
  } else {
    const themeStyle = themeStyleBlock(args.theme);
    const avatarStyle = `<style>\n${AVATAR_CSS}\n</style>`;
    head =
      args.mode === "single"
        ? `    <style>\n${familyCss}\n    </style>\n    <!-- 本 skill 的版式微调，加载顺序必须在上游样式之后 -->\n    <style>\n${layoutCss}\n    </style>\n    ${themeStyle}\n    ${avatarStyle}`
        : `    <link rel="stylesheet" href="shared/kami-family.css" />\n    <!-- 本 skill 的版式微调，必须在上游样式之后加载 -->\n    <link rel="stylesheet" href="shared/kami-layout.css" />\n    ${themeStyle}\n    ${avatarStyle}`;
    rendererPart =
      args.mode === "single"
        ? `<script>\n${safeInline(rendererJs, "script")}\n</script>\n${renderCall}\n<script>${AVATAR_JS}\n</script>`
        : `<script src="shared/kami-render.js"></script>\n${renderCall}\n<script>${AVATAR_JS}\n</script>`;
  }

  const avatarSlot = data.header.avatar
    ? `\n<!-- 头像已由 header.avatar 提供：${data.header.avatar} -->`
    : "\n<!-- 未设置 header.avatar：标准页头（无头像）。需要头像时在数据里加 header.avatar 后重新生成。 -->";

  const html = `<!DOCTYPE html>
<html lang="zh-CN"${args.mode === "portal" ? ' data-theme="' + (args.theme || "kami-base") + '"' : ""}>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="author" content="${data.header.name || ""}">
<meta name="generator" content="Kami Family (build-resume.mjs · ${args.mode}${args.theme ? " · " + args.theme : ""})">
${head}
</head>
<body>
<main id="kami-root"></main>
${avatarSlot}
<!-- 正式数据（Resume View）。换数据重跑：node build-resume.mjs --data <json> -->
${dataScript}
${rendererPart}
${extraBody}
<!-- 导出 PDF：浏览器打开本文件 → 打印 → 另存为 PDF（勾选背景图形可保留纸色）。
     字体：@font-face 按本机已装字体 → 本地路径 → CDN 的顺序解析；
     离线出稿或 PDF 搜索问题见 scripts/ensure-fonts.sh。 -->
</body>
</html>
`;

  return { html, data };
}

/* ---------- main ---------- */
try {
  const args = parseArgs(process.argv);
  const outPath = resolve(args.out);
  mkdirSync(dirname(outPath), { recursive: true });

  /* 画廊模式：入口页 + 每个主题一份带真实数据的成品页 */
  if (args.mode === "gallery") {
    // 原样例总览页先备份，避免被真实简历覆盖后找不回来
    if (existsSync(outPath)) {
      const cur = readFileSync(outPath, "utf8");
      const backup = join(dirname(outPath), "index.sample.html");
      if (cur.includes("模板总览") && !existsSync(backup)) {
        writeFileSync(backup, cur, "utf8");
        console.log(`已备份原样例总览页：${backup}`);
      }
    }
    const { data } = build({ ...args, mode: "single", theme: args.theme || "kami-base" });
    const name = data?.header?.name || "简历";
    const cards = THEMES.map((t) => {
      const file = join(dirname(outPath), `resume-${t.replace(/^kami-/, "")}.html`);
      const { html } = build({ ...args, mode: "single", theme: t, out: file });
      writeFileSync(file, html, "utf8");
      const p = readThemePalette(t);
      return {
        id: t,
        file: `resume-${t.replace(/^kami-/, "")}.html`,
        label: THEME_LABELS[t],
        note: THEME_NOTES[t],
        brand: p["--brand"] || "#888",
        paper: p["--parchment"] || "#f5f4ed",
      };
    });
    writeFileSync(outPath, buildGalleryHtml(name, cards), "utf8");
    console.log(`已生成入口页：${outPath}`);
    console.log(`已生成主题页：${cards.map((c) => c.file).join(" / ")}`);
    console.log(data?.header?.avatar ? "头像：已启用（header.avatar）" : "头像：未设置（标准页头）");
    console.log("用户流程：打开入口页 → 选主题打开 → 打印 → 另存为 PDF（勾选背景图形）");
    process.exit(0);
  }

  const { html, data } = build(args);
  writeFileSync(outPath, html, "utf8");
  console.log(`已生成：${outPath}`);
  console.log(data?.header?.avatar ? "头像：已启用（header.avatar）" : "头像：未设置（标准页头）");
  if (args.mode === "portal") {
    console.log(
      `模式：门户页（内置 ${THEMES.length} 套主题，页面右上角切换，打印时自动隐藏）`
    );
    console.log(
      "用户流程：打开该文件 → 右上角选主题色 → 打印 → 另存为 PDF（勾选背景图形保留纸色）"
    );
  } else {
    console.log(`主题：${args.theme} · 模式：${args.mode}`);
    console.log("导出 PDF：浏览器打开该文件 → 打印 → 另存为 PDF（勾选背景图形可保留纸色）。");
  }
} catch (err) {
  console.error(`生成失败：${err.message}`);
  process.exit(1);
}
