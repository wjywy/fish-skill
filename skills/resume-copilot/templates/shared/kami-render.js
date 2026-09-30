/* ===== templates/shared/kami-render.js（Kami 共享结构渲染器）

   职责：把 Resume View（内容槽位：header / skills / sections）渲染成
   上游 tw93/Kami 的 DOM 结构，从而直接套用 shared/kami-family.css
   （该 CSS 是上游 <style> 的逐字节拷贝），让成品与 Kami 的样式完全一致。

   注意「槽位」与「样式」是两件事：
   - 内容槽位沿用本 skill 自己的模型（sections[].entries[].bullets / subBlocks / tags…），
     不改成 Kami 的 metrics / timeline / projects 结构。
   - 样式对齐通过类名映射实现：本渲染器把槽位内容放进 Kami 的类名里
     （.project / .proj-row / .skill-row / .edu-row…），而不是反过来改数据模型。

   槽位 → Kami DOM 映射
     header.name             → .name.serif（页头第 1 行左格）
     header.targetRole       → .role（页头第 1 行右格）
     header.educationInline  → .alias.edu-school + .alias.edu-years
                               （页头第 2、3 行左格；在最后一个 · 处拆成
                                「学校 · 专业」与「在校时间」，教育信息只到年份）
     header.contacts[]       → .contact.contact-N（页头第 2、3 行右格，逐行配对）
     header.avatar           → .avatar + .header-main（可选；文字块在左、头像在右）
     skills[]                → .skill-row > .skill-label + .skill-body
     sections[].title/range  → .section-title（+ .sub）
     entry.title             → .proj-name.serif（三段式标题左格：公司 / 项目名称）
     entry.link              → .proj-kind 内的短链接（站点/末段，如 github/qa-workbench），
                               与 entry.meta 同格，用「·」分隔
     entry.meta              → .proj-kind（三段式标题中格：岗位 · 地点）
     entry.time              → .proj-role（三段式标题右格：在职时间）
     entry.tags[]            → 不渲染（技术栈不上简历）
     entry.summaryBullets[]  → .proj-row，label = ·
     entry.bullets[]         → .proj-row，label = ·
     entry.subBlocks[]       → .proj-row，.proj-text > strong = `｜分组标题`
                               （全宽竖线直接和标题文字在同一个文字单元格）
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

  /* 访问链接的中格短文本：站点名 + 末段路径，
     github.com/zhangzhixing/qa-workbench → github/qa-workbench（href 仍是完整网址） */
  function linkShort(url) {
    const s = String(url == null ? "" : url).trim();
    let text = s.replace(/^https?:\/\//i, "").replace(/\/$/, "");
    const slash = text.indexOf("/");
    const host = slash >= 0 ? text.slice(0, slash) : text;
    const path = slash >= 0 ? text.slice(slash + 1) : "";
    const site = host.replace(/^www\./i, "").split(".")[0] || host;
    const last = path.split("/").filter(Boolean).pop() || "";
    return last ? `${site}/${last}` : site;
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

  /* 页头教育信息拆两行用：把「华东理工大学 · 软件工程 · 2021.9–2025.6」拆成
       { left: "华东理工大学 · 软件工程", years: "2021.9–2025.6" }
     只在「最后一个 · 的右半确实是年份段（含 4 位数字）」时才拆；
     否则整串留在第一行 —— 宁可少拆一行，也不去猜用户的分隔习惯。 */
  function splitEducation(text) {
    const s = String(text == null ? "" : text).trim();
    if (!s) return { left: "", years: "" };
    const i = s.lastIndexOf("·");
    if (i > 0) {
      const left = s.slice(0, i).trim();
      const years = s.slice(i + 1).trim();
      if (left && /\d{4}/.test(years)) return { left: left, years: years };
    }
    return { left: s, years: "" };
  }

  function renderHeader(h) {
    // 页头是一个 3×2 栅格（排布见 kami-layout.css）：
    //   第 1 行：姓名（左）        |  目标岗位（右）
    //   第 2 行：学校 · 专业（左）  |  联系方式 ①（右）
    //   第 3 行：在校时间（左）     |  联系方式 ②（右）
    //
    // 教育信息与联系方式**逐行配对**，而不是各占一整串挤在同一行：
    // 两串长文本同行时两端都会顶到边、字号又只有 9pt，读起来是"一整片"，
    // 中间还会出现一段说不清该不该有的空白。
    //
    // 实现方式：.alias 与 .contact 各自是一个"两行小栅格"（见 kami-layout.css），
    // 两边用同一个**绝对行高**，于是第 1 行对第 1 行、第 2 行对第 2 行天然对齐。
    // 这样不必给每一行起新类名 —— 渲染器输出的类名必须全部落在上游词表里
    // （T4.4），所以能靠结构解决的就不加类。
    const edu = splitEducation(h.educationInline);
    const contacts = h.contacts || [];
    const twoRows = Boolean(edu.years) || contacts.length > 1;

    const aliasRows = twoRows ? [edu.left, edu.years] : [edu.left];
    const contactRows = twoRows ? [contacts.slice(0, 1), contacts.slice(1)] : [contacts];

    // 一格里的多个联系方式才需要 · 分隔；拆到两行时每行只有一个。
    const contactCell = (list) => {
      if (!list || !list.length) return "";
      const parts = list.map((c) =>
        c.href ? `<a href="${esc(c.href)}">${esc(c.value)}</a>` : `<span>${esc(c.value)}</span>`
      );
      return `<span>${parts.join('<span class="sep">·</span>')}</span>`;
    };

    const alias = aliasRows.map((t) => `<span>${esc(t)}</span>`).join("");
    const contact = contactRows.map(contactCell).join("");

    const cells = `<div class="name serif">${esc(h.name)}</div>
  <div class="role">${esc(h.targetRole)}</div>
  <div class="alias">${alias}</div>
  <div class="contact">${contact}</div>`;

    // 头像在右：DOM 里排在文字块之后，flex 顺序自然落到右侧。
    // 有头像时文字块整体左移，且与头像等高（见 kami-layout.css）。
    if (h.avatar) {
      return `<div class="header">
  <div class="header-main">
  ${cells}
  </div>
  <img class="avatar" src="${esc(h.avatar)}" alt="${esc(h.name || "")}" />
</div>`;
    }

    return `<div class="header">
  ${cells}
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
    //   左 = 公司 / 项目名称（.proj-name）
    //   中 = 访问链接（entry.link，「站点/末段」短文本）与 项目类型 / 岗位 · 地点
    //        （entry.meta），两者都有时用「·」分隔；都没有则留空格
    //   右 = 时间（entry.time）
    // 三个格子始终输出（缺字段时留空格子），避免栅格错位。
    // 类名一律复用上游：.proj-name / .proj-kind / .proj-role。
    //
    // 时间放最右：它是三个里最不需要逐字读的，右对齐还能形成一条
    // 纵向可扫视的锚点。
    const name = `<span class="proj-name serif">${esc(entry.title)}</span>`;

    // 中格：访问链接 + 项目类型。链接显示「站点/末段」短形，点击跳完整网址；
    // meta 里直接写网址的旧数据仍渲染成链接。
    const mid = [];
    if (entry.link) {
      mid.push(`<a href="${esc(entry.link)}">${esc(linkShort(entry.link))}</a>`);
    }
    if (entry.meta) {
      mid.push(isUrl(entry.meta) ? linkAnchor(entry.meta) : esc(entry.meta));
    }
    const meta = mid.join(" · ");

    const rows = [];
    // 顶层概述：· 无序列表
    for (const b of entry.summaryBullets || []) rows.push(projRow("·", bulletText(b)));
    for (const b of entry.bullets || []) rows.push(projRow("·", bulletText(b)));

    // 分标题：把全宽 `｜` 和标题文字放进同一个文字单元格，二者自然基线齐平；
    // 不使用 label 单元格，否则竖线会和下面的 · 符号齐平，视觉位置会偏左。
    // 其下是该分标题对应的 · 列表。
    for (const sub of entry.subBlocks || []) {
      rows.push(projRow("", `｜${sub.title}`, true));
      for (const b of sub.bullets || []) rows.push(projRow("·", bulletText(b)));
    }

    return `  <div class="project">
    <div class="proj-head">
      ${name}
      <span class="proj-kind">${meta}</span>
      <span class="proj-role">${esc(entry.time || "")}</span>
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

  /* section.range 含 4 位年份（时间跨度）时不显示到标题行右侧：
     每一段经历自己都带 entry.time，标题行再写一遍就是重复。
     技术栈（AI / RAG）、开源社区名等标签一律不放 range ——
     样例数据已删掉这类字段，标题行右侧保持干净。 */
  function isDateRange(text) {
    return /\d{4}/.test(String(text == null ? "" : text));
  }

  function renderSection(section) {
    const isEducation = section.type === "education";
    const cls = isEducation ? ' class="no-break"' : "";
    const body = (section.entries || [])
      .map(isEducation ? renderEduEntry : renderEntry)
      .join("\n");
    const sub = isDateRange(section.range) ? null : section.range;
    return `<section${cls} data-section-type="${esc(section.type || "other")}">
  ${sectionTitle(section.title, sub)}
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
      renderSkills(data.skills),
      ...(data.sections || []).map(renderSection),
    ]
      .filter(Boolean)
      .join("\n\n");

    return target;
  }

  global.renderKamiResume = renderKamiResume;
})(typeof window !== "undefined" ? window : globalThis);
