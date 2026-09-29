/* ===== templates/shared/kami-render.js（Kami 共享结构渲染器）

   职责：把 Resume View（内容槽位：header / summary / skills / sections）渲染成
   上游 tw93/Kami 的 DOM 结构，从而直接套用 shared/kami-family.css
   （该 CSS 是上游 <style> 的逐字节拷贝），让成品与 Kami 的样式完全一致。

   注意「槽位」与「样式」是两件事：
   - 内容槽位沿用本 skill 自己的模型（sections[].entries[].bullets / subBlocks / tags…），
     不改成 Kami 的 metrics / timeline / projects 结构。
   - 样式对齐通过类名映射实现：本渲染器把槽位内容放进 Kami 的类名里
     （.project / .proj-row / .skill-row / .edu-row…），而不是反过来改数据模型。

   槽位 → Kami DOM 映射
     header.name             → .name.serif（页头第 1 行左格）
     header.educationInline  → .alias（页头第 2 行左格，教育信息只到年份）
     header.targetRole       → .role（页头第 1 行右格）
     header.contacts[]       → .contact（页头第 2 行右格）> a / span，.sep 分隔
     header.avatar           → .avatar + .header-main（可选；头像在左、文字块在右）
     summary                 → .summary（可省略，省略时不输出）
     skills[]                → .skill-row > .skill-label + .skill-body
     sections[].title/range  → .section-title（+ .sub）
     entry.time              → .proj-role（三段式标题左格：在职时间）
     entry.title             → .proj-name.serif（三段式标题中格：公司 / 项目名称）
     entry.meta              → .proj-kind（三段式标题右格：所在部门）
     entry.link              → .proj-kind（追加在 meta 之后，渲染成超链接）
     entry.tags[]            → 不渲染（技术栈不上简历）
     entry.summaryBullets[]  → .proj-row，label = ·
     entry.bullets[]         → .proj-row，label = ·
     entry.subBlocks[]       → .proj-row，label = |（分标题加粗、单起一行）
       subBlocks[].bullets[] → .proj-row，label = ·（列在分标题之下）
     sections[type=education] → .edu-row（.school / .major / .date）

   页头排布与上游不同（上游 alias 与姓名同行、两栏底部对齐），差异集中在
   shared/kami-layout.css，见该文件顶部说明。

   文本约定：描述类字段里的 **关键词** 会渲染为 <span class="hl">关键词</span>
   （主题强调色）——这是 Kami 版式里「关键技术词与指标高亮」的落地方式。

   分页：不做固定分页。内容按 A4 自然流动，条目内部由 CSS 的
   .project { break-inside: avoid } 与 .no-break 保证不被拆断。 ===== */
(function (global) {
  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /* 先转义，再把 **…** 变成强调 span，标记本身无法注入 HTML */
  function inline(value) {
    return esc(value).replace(/\*\*([^*]+)\*\*/g, '<span class="hl">$1</span>');
  }

  /* skill-body 里按模板惯例使用 .em-brand（与 .hl 同色，仅语义区分） */
  function inlineBrand(value) {
    return inline(value).replace(/<span class="hl">/g, '<span class="em-brand">');
  }

  /* meta 填的是网址时渲染成超链接（项目地址）；否则按普通文字处理。 */
  function isUrl(value) {
    return /^https?:\/\//i.test(String(value == null ? "" : value).trim());
  }

  /* 链接的显示文字取站点名：github.com/xxx/yyy → github（href 仍是完整网址） */
  function linkLabel(url) {
    const s = String(url == null ? "" : url).trim();
    let host = "";
    try {
      host = new URL(s).hostname;
    } catch (e) {
      host = s.replace(/^https?:\/\//i, "").split(/[/?#]/)[0];
    }
    host = host.replace(/^www\./i, "");
    return host.split(".")[0] || host || s;
  }

  /* 超链接：显示站点短名，点击跳完整网址 */
  function linkAnchor(url) {
    return `<a href="${esc(url)}">${esc(linkLabel(url))}</a>`;
  }

  function resolveTarget(target) {
    if (!target) return document.body;
    if (typeof target === "string") return document.querySelector(target);
    return target;
  }

  function sectionTitle(text, sub) {
    const s = sub ? `<span class="sub">${esc(sub)}</span>` : "";
    return `<div class="section-title">${esc(text)}${s}</div>`;
  }

  /* Resume Bullet 允许是 { id, text, claimIds, metricIds } 或纯字符串 */
  function bulletText(bullet) {
    if (bullet && typeof bullet === "object") return bullet.text || "";
    return bullet || "";
  }

  function projRow(label, text, bold) {
    const body = bold ? `<strong>${inline(text)}</strong>` : inline(text);
    return `      <div class="proj-row">
        <div class="proj-label">${esc(label)}</div>
        <div class="proj-text">${body}</div>
      </div>`;
  }

  /* ---------------- PAGE 1 ---------------- */

  function renderHeader(h) {
    // 页头是一个 2×2 栅格（排布见 kami-layout.css）：
    //   第 1 行：姓名（左）  |  目标岗位（右）      —— 两格底部对齐
    //   第 2 行：教育信息（左）|  联系方式（右）      —— 两格首行基线对齐
    // 四个块用 grid-column/grid-row 定位，所以即使没有 educationInline，
    // 联系方式也不会错位到左列。
    // 头像（可选）：header.avatar 存在时最左再加一列头像，文字块整体右移，
    // 且文字块与头像等高（第 1 行贴头像顶、第 2 行贴头像底）。
    const parts = [];
    (h.contacts || []).forEach((c, i) => {
      if (i > 0) parts.push('<span class="sep">·</span>');
      parts.push(c.href ? `<a href="${esc(c.href)}">${esc(c.value)}</a>` : `<span>${esc(c.value)}</span>`);
    });

    const alias = h.educationInline ? `\n  <div class="alias">${esc(h.educationInline)}</div>` : "";

    const cells = `<div class="name serif">${esc(h.name)}</div>
  <div class="role">${esc(h.targetRole)}</div>${alias}
  <div class="contact">
    ${parts.join("\n    ")}
  </div>`;

    // 无头像：四格直接挂在 .header 下（.header 本身就是栅格）；
    // 有头像：再包一层 .header-main，让头像与文字块并排。
    if (h.avatar) {
      return `<div class="header">
  <img class="avatar" src="${esc(h.avatar)}" alt="${esc(h.name || "")}" />
  <div class="header-main">
  ${cells}
  </div>
</div>`;
    }

    return `<div class="header">
  ${cells}
</div>`;
  }

  function renderSummary(summary) {
    if (!summary) return "";
    return `  <div class="summary">
    ${inline(summary)}
  </div>`;
  }

  function renderSkills(skills) {
    if (!skills || !skills.length) return "";
    const rows = skills.map(
      (s) => `  <div class="skill-row">
    <div class="skill-label">${esc(s.label)}</div>
    <div class="skill-body">${inlineBrand(s.description)}</div>
  </div>`
    );
    return `<section>
  ${sectionTitle("专业技能")}
${rows.join("\n")}
</section>`;
  }

  /* ---------------- sections ---------------- */

  function renderEntry(entry) {
    // 条目标题行三段式（排布见 kami-layout.css 的 .proj-head）：
    //   左 = 在职时间   中 = 公司 / 项目名称   右 = 所在部门（meta · tags）
    // 三个格子始终输出（缺字段时留空格子），避免栅格错位。
    // 类名一律复用上游：.proj-role / .proj-name / .proj-kind。
    const time = `<span class="proj-role">${esc(entry.time || "")}</span>`;
    const name = `<span class="proj-name serif">${esc(entry.title)}</span>`;
    // 右格：所在部门（meta）· 项目地址（link，超链接）。
    // 技术栈标签（entry.tags）不显示。
    const rightBits = [];
    if (entry.meta) {
      // 兼容：meta 里直接写网址时也渲染成链接（旧数据用 meta 存过项目地址）。
      rightBits.push(isUrl(entry.meta) ? linkAnchor(entry.meta) : esc(entry.meta));
    }
    if (entry.link) rightBits.push(linkAnchor(entry.link));
    const kind = `<span class="proj-kind">${rightBits.join(" · ")}</span>`;

    const rows = [];
    // 顶层概述：· 无序列表
    for (const b of entry.summaryBullets || []) rows.push(projRow("·", bulletText(b)));
    for (const b of entry.bullets || []) rows.push(projRow("·", bulletText(b)));

    // 分标题：| + 加粗，单起一行；其下是该分标题对应的 · 列表
    for (const sub of entry.subBlocks || []) {
      rows.push(projRow("|", sub.title, true));
      for (const b of sub.bullets || []) rows.push(projRow("·", bulletText(b)));
    }

    return `  <div class="project">
    <div class="proj-head">
      ${time}
      ${name}
      ${kind}
    </div>
    <div class="proj-lines">
${rows.join("\n")}
    </div>
  </div>`;
  }

  function renderEduEntry(entry) {
    const bits = [entry.meta, ...(entry.bullets || []).map(bulletText)].filter(Boolean);
    const tail = bits.length ? `<span class="major">　· ${bits.map(esc).join(" · ")}</span>` : "";
    return `  <div class="edu-row">
    <div>
      <span class="school serif">${esc(entry.title)}</span>${tail}
    </div>
    <div class="date">${esc(entry.time || "")}</div>
  </div>`;
  }

  function renderSection(section) {
    const isEducation = section.type === "education";
    const cls = isEducation ? ' class="no-break"' : "";
    const body = (section.entries || [])
      .map(isEducation ? renderEduEntry : renderEntry)
      .join("\n");
    return `<section${cls}>
  ${sectionTitle(section.title, section.range)}
${body}
</section>`;
  }

  /* ---------------- entry ---------------- */

  function renderKamiResume(options = {}) {
    const target = resolveTarget(options.target);
    if (!target) throw new Error("renderKamiResume target not found");

    const data = options.data || global.KAMI_RESUME_DATA;
    if (!data || !data.header) {
      target.innerHTML = "<p>Missing Resume View data.</p>";
      return target;
    }

    target.innerHTML = [
      renderHeader(data.header),
      renderSummary(data.summary),
      renderSkills(data.skills),
      ...(data.sections || []).map(renderSection),
    ]
      .filter(Boolean)
      .join("\n\n");

    return target;
  }

  global.renderKamiResume = renderKamiResume;
})(typeof window !== "undefined" ? window : globalThis);
