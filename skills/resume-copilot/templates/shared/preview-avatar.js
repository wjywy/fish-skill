/* ===== templates/shared/preview-avatar.js（预览专用：页头头像开关）

   用途：在模板预览页右上角加一个开关，用来当场对比「有头像 / 无头像」两种页头。

   为什么 5 套主题都适用：主题只覆盖颜色变量，头像只改页头排布，两者正交 ——
   渲染器读 header.avatar，版式覆盖层（kami-layout.css）负责排布，
   所以每套主题都天然支持两种页头。这个开关只是把「都兼容」这件事变得看得见。

   自动降级（两道保险）：
   1. 只有数据是样例（id === "resume-view-sample"）时才挂载开关；
      生成正式简历时数据换成真实 Resume View，开关不会出现。
   2. 生成正式简历时仍建议把下面这一行删掉：
        <script src="shared/preview-avatar.js"></script>

   打印 / 导出 PDF 时开关自动隐藏（@media print），不会占用页面。 ===== */
(function (global) {
  var SAMPLE_ID = "resume-view-sample";
  var PLACEHOLDER = "shared/avatar-sample.jpg";
  var TARGET = "#kami-root";

  /* 只有预览样例才挂开关；真实 Resume View 不挂。 */
  function isPreview(data) {
    return !!data && data.id === SAMPLE_ID;
  }

  /* 在「有头像 / 无头像」之间切换，返回新值（不修改入参）。 */
  function nextAvatar(current) {
    return current ? null : PLACEHOLDER;
  }

  function injectStyle(doc) {
    if (doc.getElementById && doc.getElementById("__preview-avatar-style")) return;
    var style = doc.createElement("style");
    style.id = "__preview-avatar-style";
    style.textContent =
      ".preview-bar{position:fixed;top:14px;right:14px;z-index:99;" +
      "font:500 12px/1 system-ui,-apple-system,'PingFang SC','Microsoft YaHei',sans-serif}" +
      ".preview-bar button{display:inline-flex;align-items:center;padding:8px 14px;cursor:pointer;" +
      "border:1px solid var(--border);border-radius:999px;background:var(--ivory);color:var(--dark-warm);" +
      "box-shadow:0 2px 10px rgba(0,0,0,.08)}" +
      ".preview-bar button:hover{border-color:var(--brand);color:var(--brand)}" +
      "@media print{.preview-bar{display:none}}";
    (doc.head || doc.body).appendChild(style);
  }

  function mount(data, render, target) {
    if (!isPreview(data)) return null;
    var doc = global.document;
    if (!doc || !doc.body || typeof render !== "function") return null;
    injectStyle(doc);

    var bar = doc.createElement("div");
    bar.className = "preview-bar";
    var btn = doc.createElement("button");
    btn.type = "button";

    function sync() {
      btn.textContent = data.header.avatar ? "隐藏头像" : "显示头像";
    }

    btn.addEventListener("click", function () {
      data.header.avatar = nextAvatar(data.header.avatar);
      sync();
      render({ target: target || TARGET, data: data });
    });

    sync();
    bar.appendChild(btn);
    doc.body.appendChild(bar);
    return bar;
  }

  function autoMount() {
    if (global.KAMI_RESUME_DATA && typeof global.renderKamiResume === "function") {
      mount(global.KAMI_RESUME_DATA, global.renderKamiResume, TARGET);
    }
  }

  if (global.document) {
    if (global.document.readyState === "loading" && global.document.addEventListener) {
      global.document.addEventListener("DOMContentLoaded", autoMount);
    } else {
      autoMount();
    }
  }

  global.KAMI_PREVIEW_AVATAR = { isPreview: isPreview, nextAvatar: nextAvatar, mount: mount };
})(typeof window !== "undefined" ? window : globalThis);
