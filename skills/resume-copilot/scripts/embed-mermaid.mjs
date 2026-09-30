#!/usr/bin/env node
// 把 Markdown 里的 ```mermaid 围栏渲染成 Markdown 可直接预览的 PNG 图片。
//
//   为什么需要这个脚本：Mermaid 只有在「支持它的渲染器」里才是图，
//   在不支持的预览器（飞书导入、纯文本编辑器、部分 wiki）里只是一段代码。
//   每张图保留 Mermaid 源码，并紧跟标准 Markdown 图片引用；PNG 适用于
//   能解析相对图片路径的普通 Markdown 预览器，SVG 文件留作矢量版本。
//
// 用法：
//   node scripts/embed-mermaid.mjs 答案.md                 # 写入图片引用及 assets/*.png、*.svg
//   node scripts/embed-mermaid.mjs 答案.md --check         # 逐图检查引用和文件，不改文件
//   node scripts/embed-mermaid.mjs 答案.md --strip         # 移除已注入的图片引用块
//   node scripts/embed-mermaid.mjs 答案.md --mermaid-js ./vendor/mermaid.min.js
//
// 依赖：无 npm 依赖。需要一台 Chrome / Chromium（自动探测，或用 CHROME_PATH 指定），
// 以及 mermaid.min.js —— 查找顺序：--mermaid-js > scripts/vendor/mermaid.min.js > CDN。
//
// 幂等：注入的块带 <!-- mermaid-image:<hash> --> 标记，重跑是**替换**而不是追加；
// mermaid 源码改动后 hash 变化，旧块自动被顶掉。

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const VENDOR_JS = path.join(HERE, 'vendor', 'mermaid.min.js');
const CDN_JS = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';

/* ---------------- 参数 ---------------- */

function parseArgs(argv) {
  const out = { files: [], check: false, strip: false, theme: 'default', mermaidJs: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--emit-files') continue; // 旧参数兼容；现在始终生成图片文件
    else if (a === '--check') out.check = true;
    else if (a === '--strip') out.strip = true;
    else if (a === '--theme') out.theme = argv[++i];
    else if (a === '--mermaid-js') out.mermaidJs = argv[++i];
    else if (a.startsWith('--')) throw new Error(`未知参数：${a}`);
    else out.files.push(a);
  }
  if (!out.files.length) throw new Error('缺少要处理的 Markdown 文件');
  return out;
}

/* ---------------- Chrome ---------------- */

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

function findChrome() {
  for (const p of CHROME_CANDIDATES) {
    try {
      if (fs.existsSync(p)) return p;
    } catch (e) {
      /* ignore */
    }
  }
  throw new Error(
    '找不到 Chrome / Chromium。用 CHROME_PATH 指定，例如：\n' +
      '  CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \\\n' +
      '    node scripts/embed-mermaid.mjs 答案.md'
  );
}

function resolveMermaidJs(explicit) {
  const candidates = [explicit, fs.existsSync(VENDOR_JS) ? VENDOR_JS : null, CDN_JS].filter(Boolean);
  for (const c of candidates) {
    if (/^https?:\/\//i.test(c)) return { kind: 'cdn', src: c };
    const abs = path.resolve(c);
    if (fs.existsSync(abs)) return { kind: 'file', src: pathToFileURL(abs).href };
    if (explicit === c) throw new Error(`--mermaid-js 指向的文件不存在：${c}`);
  }
  return { kind: 'cdn', src: CDN_JS };
}

/* ---------------- 从 md 里切出 mermaid 围栏 ---------------- */

const FENCE_RE = /^([ \t]*)```mermaid[ \t]*\n([\s\S]*?)^\1```[ \t]*$/gm;

function extractBlocks(md) {
  const blocks = [];
  let m;
  FENCE_RE.lastIndex = 0;
  while ((m = FENCE_RE.exec(md)) !== null) {
    blocks.push({ start: m.index, end: m.index + m[0].length, source: m[2].replace(/\n+$/, '') });
  }
  return blocks;
}

/* ---------------- 渲染 ---------------- */

function decodeEntities(s) {
  return s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (whole, code) => {
    if (code[0] === '#') {
      const cp = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : whole;
    }
    const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
    return named[code.toLowerCase()] ?? whole;
  });
}

function renderAll(chrome, sources, theme, mermaid) {
  // `</` 转义成 `<\/`：既是合法 JSON 转义，又保证这段字符串里不会出现 `</script>` 提前闭合。
  const payload = JSON.stringify({ sources, theme }).replace(/<\//g, '<\\/');

  const html = `<!doctype html><html><head><meta charset="utf-8"></head><body>
<pre id="OUT">PENDING</pre>
<script src="${mermaid.src}"></script>
<script>
(async function () {
  function fail(msg) { document.getElementById("OUT").textContent = "FATAL\\t" + msg; }
  try {
    if (typeof mermaid === "undefined") {
      fail("mermaid.min.js 未能加载（离线且无本地副本 → 用 --mermaid-js 指定）");
      return;
    }
    // payload 已是合法 JS 对象字面量（JSON 是其子集），不需要再 JSON.parse 一层
    var data = ${payload};
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: data.theme,
      flowchart: { htmlLabels: false, useMaxWidth: true },
      sequence: { useMaxWidth: true },
      fontFamily: "PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif"
    });
    var out = [];
    for (var i = 0; i < data.sources.length; i++) {
      try {
        var r = await mermaid.render("mmd" + i, data.sources[i]);
        // base64 输出：避免在 --dump-dom 的 HTML 序列化里被实体转义搞乱
        out.push("OK\\t" + btoa(unescape(encodeURIComponent(r.svg))));
      } catch (e) {
        out.push("ERR\\t" + String((e && e.message) || e).replace(/\\s+/g, " "));
      }
    }
    document.getElementById("OUT").textContent = out.join("\\n");
  } catch (e) {
    fail(String((e && e.message) || e));
  }
})();
</script>
</body></html>`;

  const tmp = path.join(os.tmpdir(), `mermaid-embed-${process.pid}-${Date.now()}.html`);
  fs.writeFileSync(tmp, html, 'utf8');
  let dom = '';
  try {
    dom = execFileSync(
      chrome,
      [
        '--headless=new',
        '--no-sandbox',
        '--disable-gpu',
        '--no-proxy-server',
        '--allow-file-access-from-files',
        `--virtual-time-budget=${20000 + 5000 * sources.length}`,
        '--dump-dom',
        pathToFileURL(tmp).href,
      ],
      { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }
    );
  } finally {
    try {
      fs.unlinkSync(tmp);
    } catch (e) {
      /* ignore */
    }
  }

  const m = /<pre id="OUT">([\s\S]*?)<\/pre>/.exec(dom);
  if (!m) throw new Error('渲染结果为空 —— Chrome 可能没跑完，重跑一次');
  const text = decodeEntities(m[1]);
  if (text.trim() === 'PENDING') throw new Error('渲染未完成（PENDING）—— 调大 virtual-time-budget 后重试');

  return text.split('\n').map((line) => {
    const idx = line.indexOf('\t');
    const status = idx < 0 ? line : line.slice(0, idx);
    const rest = idx < 0 ? '' : line.slice(idx + 1);
    if (status === 'OK') return { ok: true, svg: Buffer.from(rest.trim(), 'base64').toString('utf8') };
    if (status === 'FATAL') throw new Error(`mermaid 渲染失败：${rest}`);
    return { ok: false, error: rest };
  });
}

/* ---------------- 注入 ---------------- */

const begin = (id) => `<!-- mermaid-image:${id} -->`;
const endMark = (id) => `<!-- /mermaid-image:${id} -->`;
/* 任意 hash 的注入块都算「这个围栏的旧块」：一个 tail 区间只属于一个围栏，
   而源码改过之后 hash 会变 —— 按 hash 匹配会留下孤儿块（清不掉、还会重复注入）。 */
const ANY_BLOCK_RE = /<!-- (mermaid-svg|mermaid-image):([0-9a-f]+) -->[\s\S]*?<!-- \/\1:\2 -->\n?/g;

function hash(source) {
  return crypto.createHash('sha1').update(source).digest('hex').slice(0, 8);
}

/* 保留 mermaid 的根 id（内部 <style> 全靠 #mmdN 作用域，剥掉样式就全崩）。
   只清掉 100% 宽度限制和 XML 声明，让它嵌进 md 后行为可控。 */
function cleanSvg(svg) {
  return svg
    .replace(/<br\s*\/?>/g, '<br/>')
    .replace(/\s*style="max-width:[^"]*"/g, '')
    .replace(/^\s*<?xml[^>]*\?>\s*/i, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function buildBlock(id, imgRef) {
  return [begin(id), imgRef, endMark(id)].join('\n');
}

function renderPng(chrome, svg, outPath) {
  const box = /viewBox="([^"]+)"/.exec(svg);
  const dimensions = box?.[1].trim().split(/[\s,]+/).map(Number);
  const viewWidth = dimensions?.[2] > 0 ? dimensions[2] : 800;
  const viewHeight = dimensions?.[3] > 0 ? dimensions[3] : 450;
  const width = Math.min(1600, Math.max(800, Math.ceil(viewWidth * 2)));
  const height = Math.min(3000, Math.max(120, Math.ceil(viewHeight * width / viewWidth)));
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;padding:0;width:${width}px;height:${height}px;overflow:hidden;background:white}
svg{display:block;width:${width}px!important;height:${height}px!important;max-width:none!important}
</style></head><body>${cleanSvg(svg)}</body></html>`;
  const tmp = path.join(os.tmpdir(), `mermaid-png-${process.pid}-${Date.now()}.html`);
  fs.writeFileSync(tmp, html, 'utf8');
  try {
    execFileSync(chrome, [
      '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
      '--force-device-scale-factor=1', `--window-size=${width},${height}`,
      `--screenshot=${outPath}`, pathToFileURL(tmp).href,
    ], { stdio: ['ignore', 'ignore', 'ignore'] });
  } finally {
    fs.unlinkSync(tmp);
  }
  if (!fs.existsSync(outPath) || fs.statSync(outPath).size < 100) {
    throw new Error(`PNG 生成失败：${outPath}`);
  }
}

/* ---------------- 主流程 ---------------- */

function processFile(file, args, chrome, mermaid) {
  const abs = path.resolve(file);
  const md = fs.readFileSync(abs, 'utf8');
  const blocks = extractBlocks(md);
  const label = path.basename(abs);
  process.stdout.write(`${label}：${blocks.length} 个 mermaid 围栏\n`);
  if (!blocks.length) return 0;

  const ids = blocks.map((b) => hash(b.source));
  const assetsDir = path.join(path.dirname(abs), 'assets');
  const slug = path.basename(abs, path.extname(abs));

  if (args.strip) {
    const out = md.replace(ANY_BLOCK_RE, '');
    if (out !== md) fs.writeFileSync(abs, out, 'utf8');
    process.stdout.write('  已移除图片引用块（图片文件保留）\n');
    return 0;
  }

  if (args.check) {
    const stale = ids.filter((id, i) => {
      const stop = i + 1 < blocks.length ? blocks[i + 1].start : md.length;
      const tail = md.slice(blocks[i].end, stop);
      const rel = `assets/${slug}-${i + 1}.png`;
      return !tail.includes(`${begin(id)}\n![流程图 ${i + 1}](${rel})\n${endMark(id)}`) ||
        !fs.existsSync(path.join(assetsDir, `${slug}-${i + 1}.png`)) ||
        !fs.existsSync(path.join(assetsDir, `${slug}-${i + 1}.svg`));
    });
    if (stale.length) {
      process.stdout.write(`  ✗ ${stale.length} 张图缺少 / 未更新图片引用或文件\n`);
      return 1;
    }
    process.stdout.write('  ✓ 每张图都有对应的 PNG 引用、PNG 和 SVG 文件\n');
    return 0;
  }

  const results = renderAll(chrome, blocks.map((b) => b.source), args.theme, mermaid);

  // 按「围栏尾部 → 下一个围栏头部」分段重建，天然避免插入引起的偏移错位
  let out = md.slice(0, blocks[0].end);
  let code = 0;
  for (let i = 0; i < blocks.length; i++) {
    // 从第二个围栏起，先把围栏本体补回来（out 目前只推进到上一个围栏的结尾）
    if (i > 0) out += md.slice(blocks[i].start, blocks[i].end);
    const stop = i + 1 < blocks.length ? blocks[i + 1].start : md.length;
    let tail = md.slice(blocks[i].end, stop).replace(ANY_BLOCK_RE, '');
    const r = results[i];
    if (!r || !r.ok) {
      process.stdout.write(`  ✗ 图 ${i + 1} 渲染失败：${(r && r.error) || '未知错误'}\n`);
      code = 1;
      out += tail;
      continue;
    }
    fs.mkdirSync(assetsDir, { recursive: true });
    const base = `${slug}-${i + 1}`;
    fs.writeFileSync(path.join(assetsDir, `${base}.svg`), cleanSvg(r.svg) + '\n', 'utf8');
    renderPng(chrome, r.svg, path.join(assetsDir, `${base}.png`));
    const imgRef = `![流程图 ${i + 1}](assets/${base}.png)`;
    // 围栏匹配的结尾不含换行，先补一个，标记才能独占一行
    out += '\n' + buildBlock(ids[i], imgRef) + '\n' + tail.replace(/^\n+/, '');
  }

  fs.writeFileSync(abs, out, 'utf8');
  const ok = results.filter((r) => r && r.ok).length;
  process.stdout.write(`  已写入 Markdown 图片：${ok}/${blocks.length}（assets/*.png、*.svg）\n`);
  return code;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const needsRender = !args.check && !args.strip;
  const chrome = needsRender ? findChrome() : null;
  const mermaid = needsRender ? resolveMermaidJs(args.mermaidJs) : null;
  if (mermaid?.kind === 'cdn') {
    process.stderr.write(
      `提示：未找到本地 mermaid.min.js，本次走 CDN（需要联网）。\n` +
        `      想离线跑：curl -o scripts/vendor/mermaid.min.js ${CDN_JS}\n` +
        `      或：      node scripts/embed-mermaid.mjs 答案.md --mermaid-js /path/to/mermaid.min.js\n`
    );
  }

  let code = 0;
  for (const f of args.files) code = processFile(f, args, chrome, mermaid) || code;
  process.exit(code);
}

try {
  main();
} catch (e) {
  process.stderr.write(`embed-mermaid: ${e.message}\n`);
  process.exit(1);
}
