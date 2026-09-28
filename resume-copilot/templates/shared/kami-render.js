(function (global) {
  const KAMI_SKELETON = String.raw`
<!-- =====================================================================
Kami family · structured resume skeleton

结构原则：
- 以常见中文技术简历结构为主：页头 / 专业技能 / 工作经历 / 项目经历 / 实习经历 / 开源经历 / 教育背景
- 所有 {{变量}} 替换为实际内容
- 每个经历由 entry-head + bullets + 可选 sub-block 组成
- 删除不适用的 section，不强制保留全部模块
- 允许根据内容密度自然分页；不要为了固定页数压缩可读性
- 主题颜色由 kami-*.html 的 CSS 变量覆盖，结构不随主题改变
===================================================================== -->

<div class="resume-shell">
  <header class="resume-header">
    <div class="identity">
      <div class="name serif">{{姓名}}</div>
      <div class="education-inline">{{学校}}（{{教育时间}}）</div>
    </div>
    <div class="headline">
      <div class="role">{{目标岗位}}</div>
      <div class="contact-line">
        <a href="{{GITHUB_URL}}">GitHub</a>
        <span class="sep">·</span>
        <a href="{{BLOG_URL}}">{{博客/语雀}}</a>
        <span class="sep">·</span>
        <a href="tel:{{PHONE}}">{{PHONE}}</a>
        <span class="sep">·</span>
        <a href="mailto:{{EMAIL}}">{{EMAIL}}</a>
      </div>
    </div>
  </header>

  <section class="resume-section skills-section">
    <div class="section-title-row">
      <h2>专业技能</h2>
    </div>
    <div class="skill-grid">
      <div class="skill-row"><div class="skill-key">{{技能方向 1}}</div><div class="skill-text">{{技能描述 1}}</div></div>
      <div class="skill-row"><div class="skill-key">{{技能方向 2}}</div><div class="skill-text">{{技能描述 2}}</div></div>
      <div class="skill-row"><div class="skill-key">{{技能方向 3}}</div><div class="skill-text">{{技能描述 3}}</div></div>
      <div class="skill-row"><div class="skill-key">{{技能方向 4}}</div><div class="skill-text">{{技能描述 4}}</div></div>
      <!-- 按需增删技能行 -->
    </div>
  </section>

  <section class="resume-section">
    <div class="section-title-row">
      <h2>工作经历</h2>
      <div class="section-range">{{工作经历总时间范围}}</div>
    </div>

    <article class="entry">
      <div class="entry-head">
        <div class="time">{{时间}}</div>
        <div class="org">{{公司}}</div>
        <div class="dept">{{部门 / 团队}}</div>
      </div>
      <ul class="entry-summary">
        <li>{{工作范围 / 总体职责}}</li>
      </ul>

      <div class="sub-block">
        <div class="sub-title">{{方向 / 专项 1}}</div>
        <ul>
          <li>{{要点 1}}</li>
          <li>{{要点 2}}</li>
          <li>{{要点 3}}</li>
        </ul>
      </div>

      <div class="sub-block">
        <div class="sub-title">{{方向 / 专项 2}}</div>
        <ul>
          <li>{{要点 1}}</li>
          <li>{{要点 2}}</li>
        </ul>
      </div>

      <!-- 同一公司下可以继续增加 sub-block；多家公司则复制 article.entry -->
    </article>
  </section>

  <section class="resume-section">
    <div class="section-title-row">
      <h2>项目经历</h2>
      <div class="section-range">{{项目方向 / 时间}}</div>
    </div>

    <article class="entry project-entry">
      <div class="entry-head">
        <div class="time">{{项目时间}}</div>
        <div class="org accent">{{项目名称}}</div>
        <div class="dept">{{项目类型 / 链接}}</div>
      </div>
      <ul>
        <li>{{项目要点 1}}</li>
        <li>{{项目要点 2}}</li>
        <li>{{项目要点 3}}</li>
        <li>{{项目要点 4}}</li>
      </ul>
    </article>
    <!-- 可复制多个项目 -->
  </section>

  <section class="resume-section">
    <div class="section-title-row">
      <h2>实习经历</h2>
      <div class="section-range">{{实习总时间范围}}</div>
    </div>

    <article class="entry">
      <div class="entry-head">
        <div class="time">{{时间}}</div>
        <div class="org">{{公司}}</div>
        <div class="dept">{{部门 / 业务}}</div>
      </div>
      <ul class="entry-summary">
        <li>{{总体职责 / 结果}}</li>
      </ul>
      <div class="sub-block">
        <div class="sub-title">{{项目 / 专项}}</div>
        <ul>
          <li>{{要点 1}}</li>
          <li>{{要点 2}}</li>
        </ul>
      </div>
    </article>
    <!-- 可复制多个实习 entry -->
  </section>

  <section class="resume-section">
    <div class="section-title-row">
      <h2>开源经历</h2>
      <div class="section-range">{{开源社区 / 项目范围}}</div>
    </div>

    <article class="entry open-source-entry">
      <div class="entry-head">
        <div class="time">{{时间 / 类型}}</div>
        <div class="org">{{开源项目}}</div>
        <div class="dept">{{社区 / 组织}}</div>
      </div>
      <ul>
        <li>{{项目简介}}</li>
        <li>{{主要贡献}}</li>
      </ul>
    </article>
    <!-- 可复制多个开源 entry -->
  </section>

  <section class="resume-section optional-section">
    <div class="section-title-row">
      <h2>教育背景</h2>
      <div class="section-range">{{教育时间}}</div>
    </div>
    <article class="entry compact-entry">
      <div class="entry-head">
        <div class="time">{{时间}}</div>
        <div class="org">{{学校}}</div>
        <div class="dept">{{专业 / 学位}}</div>
      </div>
      <ul>
        <li>{{可选补充：奖项 / GPA / 课程 / 竞赛}}</li>
      </ul>
    </article>
  </section>
</div>
`;

  function resolveTarget(target) {
    if (!target) return document.body;
    if (typeof target === "string") return document.querySelector(target);
    return target;
  }

  function renderKamiResume(options = {}) {
    const target = resolveTarget(options.target);
    if (!target) throw new Error("renderKamiResume target not found");
    target.innerHTML = KAMI_SKELETON.trim();
    return target;
  }

  global.renderKamiResume = renderKamiResume;
})(window);
