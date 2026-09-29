# resume-copilot · Test Report

**Date:** 2026-09-30
**Scope:** `skills/resume-copilot` + `bin/fish-skill.mjs`
**Runner:** `node test/run-tests.mjs` (Node ≥ 18, zero dependencies, offline)

---

## 1. Executive summary

| Layer | Result | Meaning |
| --- | --- | --- |
| Deterministic (T1–T7) | **70 / 70 pass** | Layout, schemas, refs, renderer, CLI, consistency, resume content lint |
| Behavioural (B1–B9) | **9 / 9 pass**, 0 anti-patterns | Skill follows its own hard rules under realistic input |

All previously reported findings are now closed (§5). The suite is fully green
and exits 0, so it can be wired straight into CI.

**Verdict: healthy.**

---

## 2. What was tested and why

`resume-copilot` is a *spec* skill: its logic is prose (`SKILL.md`, `workflows/`,
`policies/`) plus a small machine surface (JSON schemas, an HTML/JS renderer, a
CLI). The suite therefore splits into:

- **Deterministic cases** — everything checkable by reading bytes and running
  code. 70 assertions across 7 suites.
- **Behavioural cases** — whether an agent following the prose actually obeys the
  constraints. 9 conformance scenarios, each with a weighted rubric and an
  explicit anti-pattern list.

Full case-by-case detail: `test/cases/README.md` and `test/behavioral/README.md`.

---

## 3. Results

### 3.1 Deterministic suites

| Suite | Checks | Pass | Fail | Notes |
| --- | --- | --- | --- | --- |
| T1 · Package & structure | 12 | 12 | 0 | Frontmatter, all 8 workflows, 8 policies, 15 schemas, 6 examples, 10 themes, shared assets (incl. layout delta + preview data + avatar toggle), theme `:root` validity, CLI wiring |
| T2 · Schema validation | 13 | 13 | 0 | 6 positive + 6 negative + the two-part answer contract |
| T3 · Cross-reference integrity | 5 | 5 | 0 | `career-profile.min.json` and both shipped examples fully consistent; golden resume view respects Strategy selection |
| T4 · Kami renderer contract | 16 | 16 | 0 | Slot → Kami DOM mapping, class-vocabulary + stylesheet coverage (both header variants), header layout delta, optional photo header, short-label entry links, XSS escaping, emphasis convention, adaptive pagination, education block |
| T5 · CLI | 8 | 8 | 0 | list/check/install/force/unknown, full-tree copy |
| T6 · Internal spec consistency | 10 | 10 | 0 | Ownership vocabulary, theme enum ⇄ files, doc refs, two-part contract across schema + 4 docs |
| T7 · Resume content lint | 6 | 6 | 0 | Rule 2 (vague duty statements) encoded as a lint; golden fixture + shipped sample both clean |

### 3.2 Behavioural scenarios

| ID | Scenario | Score | Verdict |
| --- | --- | --- | --- |
| B1 | Target Direction Gate (mixed React + Go signals) | 100% | ✅ PASS |
| B2 | Repository evidence ≠ ownership | 100% | ✅ PASS |
| B3 | Metric provenance ("提升很多") | 100% | ✅ PASS |
| B4 | Answer-driven depth + two-part answers | 100% | ✅ PASS |
| B5 | Interview output hygiene (deny-list scan) | 100% | ✅ PASS |
| B6 | Mock Interview assessment | 100% | ✅ PASS |
| B7 | Resume bullet quality (duty-statement bait) | 100% | ✅ PASS |
| B8 | Resume Strategy (JD matching, no invented Claim) | 100% | ✅ PASS |
| B9 | Resume generation (Strategy compliance) | 100% | ✅ PASS |

---

## 4. Changes in this cycle

### 4.1 Two-part reference answers

**Request.** The general-principle part of an interview answer should be written
in more detail, split into two parts: (1) the existing one-paragraph logic +
project scenario, and (2) a detailed principle explanation.

**Implemented as a rule** in five places, so the prose, the data contract and the
examples stay in sync:

| Artefact | Change |
| --- | --- |
| `workflows/interview-knowledge.md` | `Generated Reference Answer` rewritten as a fixed two-part contract; `Answer Detail Standard` states part 1 is concise and part 2 carries the detail; the visible-Markdown template gained the `**原理详解**` marker |
| `SKILL.md` | §Interview 模式 output template updated to the two-part shape |
| `skills/resume-copilot/README.md` | Default Markdown format + 答案原则 updated |
| `README.zh.md` | Same, at the repo level |
| `schemas/generated-answer.schema.json` | `canonicalAnswer` + `projectContext` → **`overview` (required)** + **`principleDetail` (required)**; `projectAside` retained |

**Example updated.** `examples/claim-graph.example.json` now carries real
`overview` / `principleDetail` content. While updating it, two previously
reported defects were also fixed:

- **F1 (was: HIGH)** — `nodes[4]` used `type` instead of `nodeType`, was missing
  `depth`, and carried a non-schema `answerCoverage` property → **fixed**.
- **F2 (was: HIGH)** — `nodes[4]` pointed at a non-existent parent
  (`node-outbox-root`) and a mismatched `claimId` (`claim-outbox`) → **fixed**.

**Enforced by tests.** New assertions stop the contract from silently drifting:

- `T2.10` — every generated answer has a non-empty `overview` **and**
  `principleDetail`, no legacy `canonicalAnswer`, and the principle section is
  the longer of the two.
- `T6.10` — the schema requires both fields, `canonicalAnswer` is gone, and all
  four documents mention the `原理详解` section.

### 4.2 Resume-generation coverage (T7, B7–B9)

**Gap found.** A coverage audit showed `workflows/resume-generation.md`,
`workflows/resume-strategy.md` and `policies/resume-writing-policy.md` had **zero**
test references — the entire resume-writing half of the skill was unverified,
while the interview half had six behavioural scenarios.

**Closed on both layers:**

| Layer | Added | Covers |
| --- | --- | --- |
| Deterministic | **T7** (6 checks) + `lib/resume-lint.mjs` | Rule 2 duty statements encoded as a lint; golden fixture and shipped sample must both be clean; weak-ownership bullets must not use strong verbs |
| Deterministic | **T3.5** + `fixtures/valid/resume-view.agent.json` | The golden B9 output is machine-checked: every `claimId` is Strategy-selected, every `metricId` is confirmed |
| Behavioural | **B7** bullet quality | A "负责 XX" input must not yield a finished duty-statement bullet |
| Behavioural | **B8** Strategy / JD matching | JD requirements parsed; gaps reported honestly; no invented Claim |
| Behavioural | **B9** generation | Generation must not re-open the Strategy's selection |

**Defect found and fixed.** `templates/shared/sample-data.json` — the renderer
sample shipped to users and the most likely thing they copy as a template —
contained a Rule 2 violation: `参与策略服务与 AI 应用能力建设。`. It was rewritten
to a high-information bullet, and **T7.6** now fails if the sample ever regresses.

### 4.3 Kami styling alignment (T1.9–T1.10, T4.4, T4.9–T4.13)

**Request.** The generated resume must *look* exactly like upstream
`tw93/Kami`'s resume, with the nine themes as a colour-only extension on top.

**Kept separate on purpose.** "Styling matches" is not "structure matches". The
Resume View keeps this skill's own content slots
(`header / summary / skills / sections[].entries[]` with
`summaryBullets / bullets / subBlocks / tags`) — that data model was **not**
rewritten into Kami's `metrics / timeline / projects` shape. Instead the renderer
maps the slots onto Kami's DOM, so the stylesheet applies unchanged.

| Artefact | Change |
| --- | --- |
| `templates/shared/kami-family.css` | Replaced with the **verbatim** upstream `<style>` block (497 lines, 0 diff against the upstream template) — 仓耳今楷 `@font-face`, `@page { size: A4 }`, all upstream rules |
| `templates/shared/kami-render.js` | Rewritten as a slot → Kami DOM mapper (`.project` / `.proj-row` / `.skill-row` / `.edu-row` …). Also parses `**keyword**` into `.hl` / `.em-brand` |
| `templates/kami-base.html` + 9 themes | Regenerated: valid `:root` overrides of the 10 upstream tokens; each page wires `shared/sample-data.js` so it renders instead of showing a blank page |
| `templates/shared/sample-data.js` | New. Classic-`<script>` form of `sample-data.json` (works over `file://`, unlike `fetch`) |
| `templates/index.html` | Gallery gained the missing `kami-base.html` card |
| `templates/README.md`, `renderers/kami/README.md`, `workflows/resume-generation.md` | Rewritten around the slot → DOM mapping table, the emphasis convention, and adaptive pagination |

**Pagination is adaptive, not forced.** The renderer emits no hard page break;
content flows inside the A4 box and the upstream CSS keeps individual entries from
splitting (`.project { break-inside: avoid }`, `.no-break` on education). Page
count follows content volume. `resume--dense` remains available as an opt-in
compression variant.

**New assertions.**

- `T1.9` — every one of the 9 themes defines all 10 upstream tokens using real
  CSS (semicolons, not commas).
- `T1.10` — `sample-data.js` stays byte-equal to `sample-data.json`.
- `T4.4` — the renderer emits **only** upstream class names (the photo-header
  classes `.avatar` / `.header-main` are the sole additions, defined by the
  override file), and every class it emits is matched by a rule in
  `kami-family.css` + `kami-layout.css`. Checked for **both** header variants.
- `T4.9` — `**keyword**` becomes `.hl` / `.em-brand`, with no literal `**` left.
- `T4.10` — no hard page break is emitted.
- `T4.11` — `sections[type=education]` maps to `.no-break` + `.edu-row`.
- `T4.12` — `summaryBullets` / `bullets` / `subBlocks` all survive the mapping
  without content loss; tech-stack `tags` are dropped by design.
- `T4.13` — the stylesheet still ships the A4 `@page`, `.no-break`,
  `resume--dense` and 仓耳今楷 font-face.

### 4.4 Header layout: 2×2 grid + optional photo (T4.1, T4.14, T4.15)

**Requests, in three rounds.**

1. The education line must sit on its own row **under the name**, and the target
   role must stack **above** the contacts on the right.
2. `name` and `role` must be **bottom-aligned**; `educationInline` and the
   contacts must read as **the same line**.
3. With a photo, the text block must span the photo: row 1 flush with the photo's
   top, row 2 flush with its bottom.

**Kept as an overlay, not an edit to the copy.** `kami-family.css` must stay a
verbatim copy of the upstream `<style>` block, so the delta lives in a separate
file loaded **after** it:

| Artefact | Change |
| --- | --- |
| `templates/shared/kami-layout.css` | New. Holds only this skill's layout delta: `.header` / `.header-main` become a 2×2 grid (`grid-template-columns: max-content 1fr`, `align-items: end`), row 1 uses `align-self: end`, row 2 uses `align-self: baseline`, and the photo variant switches `.header` to flex with `align-items: stretch` + `align-content: space-between` |
| `templates/shared/kami-render.js` | `renderHeader` emits the four cells (`.name` / `.role` / `.alias` / `.contact`) as direct grid children, and wraps them in `.header-main` beside `<img class="avatar">` when `header.avatar` is set |
| `templates/kami-base.html` + 9 themes | Each page links `shared/kami-family.css` then `shared/kami-layout.css` (order enforced by T1.8) |
| `templates/avatar-demo.html` | New. Same theme, photo variant — sets `header.avatar` before rendering. Not named `kami-*` because T6.3 treats every `kami-*.html` as a theme file |
| `templates/shared/avatar-sample.jpg`, `avatar-placeholder.svg` | Placeholder photos for the demo page |

**Why the photo variant needed its own geometry.** A photo column costs ~83px, so
the right column drops from 411px to 305px and the contacts wrap to two lines —
with bottom alignment that dragged the education line down to the contacts'
*second* line. Two changes fixed it together: the avatar-side gaps were tightened
(4mm / 5mm) so the sample contacts fit on one line again (they need 313px), and
row 2 switched to baseline alignment so a wrapped contact block can never drag
the education line down.

**New assertions.**

- `T4.1` — header structure: `name` closes before `alias`, `alias` is its own
  block, and `role` is block-level (so it stacks above the contacts).
- `T4.14` — the delta is isolated: `kami-family.css` still contains the upstream
  `align-items: flex-end`, while `kami-layout.css` declares the grid, the two row
  alignments and the photo-variant switch — proving the copy stayed clean.
- `T4.15` — the photo layout is gated by `header.avatar`: no `.avatar` /
  `.header-main` when the slot is empty, and the same name / education / contacts
  survive when it is set.

### 4.5 Entry format: three-part titles, sub-headings, project links (T4.3, T4.12, T4.16)

**Requests.**

- Work / project titles split into **three parts**: time (left), company or
  project name (centre), department or project address (right).
- The description area uses **sub-headings** — a `|` marker plus a bold heading on
  its own line — with a `·` bullet list underneath.
- The project address must be a **hyperlink with a short label**
  (`github.com/zhangzhixing/qa-workbench` → `github`).
- The tech stack must **not** appear on the resume.
- The header education period is **year-only** (`2021–2025`), while entry times
  keep their months.

| Artefact | Change |
| --- | --- |
| `schemas/resume-view.schema.json` | `header.avatar` added (optional, string/null); `entry.link` added (optional, string/null) — previously the project URL had to be smuggled through `entry.meta` |
| `templates/shared/kami-render.js` | `renderEntry` emits the three-part `.proj-head` (`.proj-role` / `.proj-name` / `.proj-kind`), maps `summaryBullets` / `bullets` to `·` rows and `subBlocks` to a `|` + bold heading row, renders `entry.link` (and a URL in `meta`, for older data) as an `<a>` labelled with the site name, and drops `tags` |
| `templates/shared/kami-layout.css` | `.proj-head` becomes `1fr auto 1fr` so the title sits on the page centre line; `.proj-label` narrows to 4mm; sub-heading rows get extra top padding |
| `templates/shared/sample-data.json` + `.js` | Sample grew to 4 sections / 5 entries (a second job plus an 开源经历 section), education shortened to `2021–2025`, project URL moved to `link` |
| `workflows/resume-generation.md` | New 「生成前必须确认」 section (ask about the photo first) and a 「字段口径」 section pinning down `educationInline`, `entry.time`, `entry.meta`, `entry.link`, `entry.tags` and `summary` |
| `SKILL.md` | §Renderer states the photo question and points at the field conventions |
| `templates/README.md`, `renderers/kami/README.md`, `test/cases/README.md` | Slot → DOM tables, header description and case index brought in line with the new format |

**New / rewritten assertions.**

- `T4.3` — `summary` is now optional: an empty slot must render **no** block, and
  an injected one must still map to `.summary`.
- `T4.12` — rewritten for the new format: `·` rows for bullets, `|` + `<strong>`
  for sub-headings, and `tags` asserted **absent** from the title row.
- `T4.16` — `entry.link` renders as `<a href="…">github</a>`; a plain `meta` stays
  text; a URL left in `meta` still becomes a link (backward compatibility).

### 4.6 Both header variants in every theme (T1.8, T1.12)

**Question raised.** "Every one of these templates should handle both the
with-photo and the without-photo header, right?" Architecturally yes: the theme
layer only overrides colour variables and the photo only changes header layout,
so the two are orthogonal and all ten themes already render both. But only
`kami-base` shipped a photo page, so the other nine could not be *seen* in that
variant — the capability existed without being demonstrable.

**Fix.** A preview-only toggle, wired into all ten theme pages plus
`avatar-demo.html`:

| Artefact | Change |
| --- | --- |
| `templates/shared/preview-avatar.js` | New. Mounts a screen-only 「显示头像 / 隐藏头像」 button that flips `header.avatar` and re-renders. Styles itself from the theme tokens, and is hidden by `@media print` so it never reaches the A4 sheet |
| `templates/kami-*.html` (10) + `avatar-demo.html` | One marked preview-only `<script>` line each |
| `templates/index.html` | Gallery now states that the photo choice is a layout difference independent of the theme |

**Two guards keep it out of delivered resumes.** The toggle only mounts while the
page still shows the shipped sample (`id === "resume-view-sample"`), and the
generation rules say to delete the line regardless — the guard is a fallback, not
the primary mechanism.

**New assertions.**

- `T1.12` — the toggle is wired on all 11 preview pages, mounts for the sample and
  **not** for a generated view, flips `header.avatar` both ways, and carries an
  `@media print` rule.
- `T1.8` now also requires the toggle line on every theme page, so a new theme
  cannot be added without it.

---

## 5. Findings — all closed

| ID | Severity | Finding | Status |
| --- | --- | --- | --- |
| F1 | HIGH | `claim-graph.example.json` violated its own schema | ✅ fixed |
| F2 | HIGH | `claim-graph.example.json` had dangling internal refs | ✅ fixed |
| F3 | LOW | `career-profile.example.json` had a dangling `experienceId` | ✅ fixed |
| F4 | LOW | `sample-data.json` shipped a vague duty statement | ✅ fixed |
| F5 | HIGH | All 9 theme `:root` blocks used commas instead of semicolons — every theme palette was dead | ✅ fixed |
| F6 | MEDIUM | All 10 theme pages rendered blank (`KAMI_RESUME_DATA` never assigned) | ✅ fixed |
| F7 | MEDIUM | `**keyword**` emphasis leaked literal asterisks into the output | ✅ fixed |

### F5 — theme `:root` blocks used commas (HIGH, fixed)

Each of the nine theme files declared its palette as
`--parchment: #f6f0e2, --ivory: #fbf7ee, …`. CSS parses that as a **single**
custom-property declaration whose value swallows every following token, so only
`--parchment` was ever defined and the other nine variables fell back to the
upstream defaults. Every theme was therefore visually identical to `kami-base` —
the "nine themes" were effectively one. Fixed to semicolons; **T1.9** now asserts
each theme defines all 10 upstream tokens with real CSS.

### F6 — theme pages rendered blank (MEDIUM, fixed)

All ten `kami-*.html` pages called
`renderKamiResume({ data: window.KAMI_RESUME_DATA })`, but nothing in the skill
ever assigned `KAMI_RESUME_DATA` — only a comment mentioned it — so the renderer's
guard emitted the "Missing Resume View data" placeholder. Opening any theme page
showed an empty sheet. Added `shared/sample-data.js` (a classic `<script>` that
loads over `file://`, where `fetch()` is blocked) and wired it into all ten pages;
**T1.8** asserts the wiring and **T1.10** asserts it stays in sync with
`sample-data.json`. The gallery was also missing its `kami-base.html` entry.

### F7 — literal `**` leaked into the rendered resume (MEDIUM, fixed)

`templates/README.md` promised theme-accent emphasis and `kami-family.css` shipped
`.hl` / `.em-brand`, but the old renderer escaped text without parsing markers, so
a user following the documented convention saw raw asterisks on the page. The
renderer now parses `**…**` *after* escaping (so the marker cannot inject HTML);
**T4.9** asserts no literal `**` survives.

### F3 — `examples/career-profile.example.json` dangling experienceId (LOW, fixed)

`facts[0].experienceId = "exp-release"` pointed at an experience the file never
defined. Added a minimal draft-stage `exp-release` experience — `type: project`,
`ownership: DIRECT` (matching the existing fact), `resumeReady: false` with two
`openQuestions`. The example now reads as an honest bootstrap-stage profile
instead of a dangling pointer.

### F4 — `templates/shared/sample-data.json` duty statement (LOW, fixed)

The renderer sample carried `参与策略服务与 AI 应用能力建设。` — exactly the
phrasing `resume-writing-policy.md` Rule 2 forbids. It was the only shipped
artefact that violated the skill's own writing rule, and the highest-risk one
because users copy the sample as a starting template. Rewritten to:

> 围绕策略服务需求，将重复的业务判断逻辑抽象为可配置规则，减少业务侧硬编码与重复沟通。

**T7.6** now asserts the sample is Rule 2 clean, so this cannot silently return.

### Observations (non-blocking)

- **Possible ownership drift in the example.** The raw input says
  「我**参与**过新品发布系统优化」 while `fact-001` records `ownership: DIRECT`
  and `confidence: high`. Per `evidence-policy.md`, 「参与」 maps to
  `COLLABORATIVE`, so a reader copying this example could internalise a silent
  ownership upgrade — the exact failure mode the skill's principle 4 forbids.
  Consider aligning the fact to `COLLABORATIVE` or changing the raw input wording.
- **Doc looseness (accepted by the harness).** `templates/README.md` refers to
  `kami-render.js` / `kami-*.html` without the `shared/` prefix or as globs. The
  link checker accepts globs and resolves unique bare filenames, so this is
  style, not breakage.
- **Upstream path references use full URLs.** Docs that cite the upstream Kami
  template point at the GitHub URL rather than a bare repo-relative path, so the
  link checker does not mistake an upstream path for a local asset.
- **`.workbuddy-ai/memory/` references** in `SKILL.md` are workspace-runtime
  paths, correctly excluded from asset link-checking.

---

## 6. Coverage & limitations

- **Covered:** artefact integrity, the full traceability chain
  (Fact → Claim → Metric → View → bullet), the renderer's real output in **both**
  header variants (with and without a photo), its slot → Kami DOM mapping and
  escaping, the CLI, the two-part answer contract, the nine most violation-prone
  behavioural constraints, and the mechanically-checkable part of resume bullet
  quality (Rule 2 duty statements + ownership/verb agreement).
- **Not covered:** statistical behaviour (one run per behavioural scenario proves
  it *can* be right, not that it always is); the subjective remainder of resume
  writing quality (the lint only flags phrasings the policy names explicitly);
  **visual** fidelity of the rendered page — the suite proves the renderer emits
  only upstream class names and that each is styled, but it does not rasterise the
  A4 page, so font loading and final line-breaking are unverified; PDF output (no
  headless browser); multi-target strategy selection.

## 7. Recommendations

1. **Add a CI hook** — wire `npm test` into `prepack` (currently only `check`
   runs) so schema/example drift is caught before publish.
2. **Align the example's ownership** — see the observation in §5; the example
   currently teaches `参与 → DIRECT`, which contradicts principle 4.
3. **Grow the behavioural set** — the scenarios listed at the end of
   `test/behavioral/results.md`: long-session sibling return, multi-target
   strategy, a B1 negative control, and a renderer round-trip audit.

---

*Generated alongside `test/reports/results.json` (machine-readable per-check results).*
