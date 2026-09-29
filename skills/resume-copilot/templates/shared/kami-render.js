(function (global) {
  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function resolveTarget(target) {
    if (!target) return document.body;
    if (typeof target === "string") return document.querySelector(target);
    return target;
  }

  function bulletText(item) {
    if (item && typeof item === "object") return item.text || "";
    return item || "";
  }

  function list(items, className) {
    if (!items || !items.length) return "";
    return `<ul${className ? ` class="${className}"` : ""}>${items.map(x => `<li>${esc(bulletText(x))}</li>`).join("")}</ul>`;
  }

  function renderEntry(entry) {
    const subs = (entry.subBlocks || []).map(s => `
      <div class="sub-block">
        <div class="sub-title">${esc(s.title)}</div>
        ${list(s.bullets)}
      </div>`).join("");
    const tags = (entry.tags || []).length
      ? `<div class="entry-tags">${entry.tags.map(esc).join(" · ")}</div>`
      : "";

    return `<article class="entry">
      <div class="entry-head">
        <div class="time">${esc(entry.time || "")}</div>
        <div class="org">${esc(entry.title || "")}</div>
        <div class="dept">${esc(entry.meta || "")}</div>
      </div>
      ${list(entry.summaryBullets, "entry-summary")}
      ${list(entry.bullets)}
      ${subs}
      ${tags}
    </article>`;
  }

  function renderSection(section) {
    return `<section class="resume-section section-${esc(section.type)}">
      <div class="section-title-row">
        <h2>${esc(section.title)}</h2>
        ${section.range ? `<div class="section-range">${esc(section.range)}</div>` : ""}
      </div>
      ${(section.entries || []).map(renderEntry).join("")}
    </section>`;
  }

  function renderKamiResume(options = {}) {
    const target = resolveTarget(options.target);
    if (!target) throw new Error("renderKamiResume target not found");

    const data = options.data || global.KAMI_RESUME_DATA;
    if (!data || !data.header) {
      target.innerHTML = '<div class="resume-shell"><p>Missing Resume View data.</p></div>';
      return target;
    }

    const contacts = (data.header.contacts || []).map(c => c.href
      ? `<a href="${esc(c.href)}">${esc(c.value)}</a>`
      : `<span>${esc(c.value)}</span>`
    ).join('<span class="sep">·</span>');

    const skills = (data.skills || []).length ? `<section class="resume-section skills-section">
      <div class="section-title-row"><h2>专业技能</h2></div>
      <div class="skill-grid">${data.skills.map(s => `<div class="skill-row"><div class="skill-key">${esc(s.label)}</div><div class="skill-text">${esc(s.description)}</div></div>`).join("")}</div>
    </section>` : "";

    const summary = data.summary
      ? `<section class="resume-summary">${esc(data.summary)}</section>`
      : "";

    target.innerHTML = `<div class="resume-shell">
      <header class="resume-header">
        <div class="identity">
          <div class="name serif">${esc(data.header.name)}</div>
          <div class="education-inline">${esc(data.header.educationInline || "")}</div>
        </div>
        <div class="headline">
          <div class="role">${esc(data.header.targetRole)}</div>
          <div class="contact-line">${contacts}</div>
        </div>
      </header>
      ${summary}
      ${skills}
      ${(data.sections || []).map(renderSection).join("")}
    </div>`;

    return target;
  }

  global.renderKamiResume = renderKamiResume;
})(window);
