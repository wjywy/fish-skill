# Deterministic Test Cases (T1–T7)

These are the mechanically checkable cases. They run offline with zero
dependencies via `node test/run-tests.mjs`. Every case asserts a **contract the
skill publishes about itself** — the test files describe the desired behaviour,
so a failing case is a real finding against the skill, not against the test.

| Suite | Focus | Cases | Runner section |
| --- | --- | --- | --- |
| T1 | Package & structure integrity | 12 | `T1()` |
| T2 | JSON Schema validation | 13 | `T2()` |
| T3 | Cross-reference integrity | 5 | `T3()` |
| T4 | Kami renderer contract | 16 | `T4()` |
| T5 | CLI behaviour | 8 | `T5()` |
| T6 | Internal spec consistency | 10 | `T6()` |
| T7 | Resume content lint | 6 | `T7()` |
| | **Total** | **70** | |

Run one suite at a time with its id, e.g. `node test/run-tests.mjs T4`.

---

## Coverage matrix

| Capability the skill claims | Covered by |
| --- | --- |
| Skill is discoverable / installable | T1.1, T1.11, T5.1, T5.4 |
| On-demand loading assets all exist | T1.2, T1.3, T1.4, T1.6, T1.7, T6.1, T6.6 |
| Data model is well-formed | T2 (all), T6.4, T6.5, T6.8 |
| Fact → Claim → Metric → View is traceable | T3.1, T3.3, T3.4, T2 (claim/view schemas) |
| Interview graph is internally linked | T3.3, T6.5 |
| Kami renderer renders a Resume View | T4.1–T4.3, T4.7–T4.9 |
| Renderer emits only upstream Kami classes | T4.4 |
| Styling matches upstream Kami | T4.4, T4.13, T1.9 |
| Content slots survive the mapping intact | T4.11, T4.12 |
| Header layout matches the agreed design | T4.1, T4.14, T4.15 |
| Optional photo header is gated by `header.avatar` | T4.15 |
| Project address renders as a short-label link | T4.16 |
| Pagination is adaptive, no hard break | T4.10 |
| `**keyword**` becomes theme-accent emphasis | T4.9 |
| Renderer is safe against injected markup | T4.5, T4.6 |
| Theme set is coherent | T1.6, T1.8, T1.9, T6.3, T6.7 |
| Theme pages actually render (not blank) | T1.8, T1.10 |
| Both header variants work in every theme | T1.12, T4.15 |
| Distribution copies the whole skill | T5.4 |
| Documented file references are not dangling | T6.1, T6.2, T6.6 |
| Schemas are referenced from the entry doc | T6.9 |
| Generated answers keep the two-part contract | T2.10, T6.10 |
| Resume bullets avoid vague duty statements | T7.1, T7.2, T7.3, T7.6 |
| Resume bullets use ownership-appropriate verbs | T7.5 |
| Generation honours the Strategy selection | T3.5, T7.4 |

---

## Detailed cases

### T1 — Package & structure integrity

| ID | Input | Expected | Why it matters |
| --- | --- | --- | --- |
| T1.1 | `skills/resume-copilot/SKILL.md` | Has `---` frontmatter with `name: resume-copilot` and a non-trivial `description` | `name` must match the directory so the loader can resolve the skill; a missing description means the agent cannot decide when to use it |
| T1.2 | 8 workflow files | All exist | `SKILL.md` routes to these by path; a missing file is a dead route |
| T1.3 | 8 policy files | All exist | Policies are the hard rules; a missing policy silently drops a constraint |
| T1.4 | 15 schema files | Exist **and** parse as JSON | A malformed schema breaks validation for every downstream artefact |
| T1.5 | 6 example files | All exist | Examples are `Required References` in several workflows |
| T1.6 | 10 template entry files | `kami-base.html` + 9 themes exist | The theme enum is only real if the files back it |
| T1.7 | shared assets | `shared/kami-render.js`, `shared/kami-family.css`, `shared/kami-layout.css`, `shared/common.css`, `shared/sample-data.json`, `shared/sample-data.js` exist, plus the gallery entry `templates/index.html` | Every theme depends on the shared renderer/CSS; the preview data script is what keeps the pages from rendering blank |
| T1.8 | Each theme HTML | References `shared/kami-family.css` **then** `shared/kami-layout.css`, plus `shared/kami-render.js` and `shared/sample-data.js`, and calls `renderKamiResume` | Structure/theme separation only holds if every entry wires up the shared assets; the layout delta only wins if it loads after the upstream stylesheet, and a page that never assigns `KAMI_RESUME_DATA` renders blank |
| T1.9 | The 9 theme `:root` blocks | Each overrides all 10 upstream tokens (`--parchment` … `--brand-tint`) using real CSS | A comma-separated `:root` collapses into one custom-property declaration, silently killing every other theme variable |
| T1.10 | `shared/sample-data.js` vs `sample-data.json` | Byte-equal after parsing | The preview data and the schema fixture must not drift |
| T1.11 | `bin/fish-skill.mjs` + `package.json` | File exists and `package.json#bin` points at it | Otherwise `npx fish-skill …` cannot run |
| T1.12 | Every theme page + `shared/preview-avatar.js` | The avatar toggle is wired on all 10 themes and on `avatar-demo.html`; it mounts **only** for the shipped sample, flips `header.avatar` both ways, and is hidden by `@media print` | Proves all 10 themes handle both header variants, without leaking a preview control into a delivered resume |

### T2 — JSON Schema validation

Positive cases assert the shipped examples conform to their own schemas:

| ID | Artefact | Schema |
| --- | --- | --- |
| T2.examples/career-profile.example.json | Career Profile | `career-profile.schema.json` |
| T2.examples/resume-strategy.example.json | Resume Strategy | `resume-strategy.schema.json` |
| T2.examples/claim-graph.example.json | Interview Knowledge Graph | `claim-graph.schema.json` |
| T2.templates/shared/sample-data.json | Resume View | `resume-view.schema.json` |
| T2.fixtures/valid/career-profile.min.json | Career Profile (hand-built, fully consistent) | `career-profile.schema.json` |
| T2.fixtures/valid/resume-view.agent.json | Resume View (golden B9 output) | `resume-view.schema.json` |

Negative cases prove the validator actually rejects bad data (a suite that only
passes is worthless):

| Fixture | Injected defect | Schema | Token asserted in error |
| --- | --- | --- | --- |
| `fact-missing-statement.json` | omits required `statement` | `fact.schema.json` | `statement` |
| `fact-bad-category-enum.json` | `category: "vibes"` | `fact.schema.json` | `category` |
| `claim-empty-factids.json` | `factIds: []` (violates `minItems: 1`) | `claim.schema.json` | `factIds` |
| `resume-view-bullet-missing-claimids.json` | project `lines[]` row without `claimIds` | `resume-view.schema.json` | `claimIds` |
| `render-options-bad-theme.json` | `theme: "kami-neon"` | `render-options.schema.json` | `theme` |
| `interview-node-bad-status.json` | `status: "PENDING_REVIEW"` | `interview-knowledge-node.schema.json` | `status` |

T2.10 enforces the **two-part answer contract** on the shipped example: every
`generatedAnswers[]` entry must carry a non-empty `overview` (part 1, logic +
project scenario) and `principleDetail` (part 2, detailed principle), must not
carry the legacy `canonicalAnswer` field, and the principle section must be the
longer of the two.

### T3 — Cross-reference integrity

The skill's central promise is `Source → Fact → Claim → Wording` traceability.
These cases follow every ID pointer and assert it resolves.

| ID | Graph checked | Rules |
| --- | --- | --- |
| T3.1 | `fixtures/valid/career-profile.min.json` | claim.factIds/metricIds/experienceId, metric.factIds/experienceId, experience.claimIds/metricIds, strategy.selected*/requirementCoverage, view bullet claimIds/metricIds, fact.experienceId — all resolve |
| T3.2 | `examples/career-profile.example.json` | same rules |
| T3.3 | `examples/claim-graph.example.json` | node.parentNodeId, node.claimId == graph.claimId, node.sourceAnswerId, rootNodeIds, question.nodeId/parentQuestionId/generatedAnswerId, answer.questionId/extractedNodeIds |
| T3.4 | `templates/shared/sample-data.json` | every bullet (incl. summaryBullets and subBlocks) carries ≥1 `claimId` |
| T3.5 | `fixtures/valid/resume-view.agent.json` | every bullet's `claimIds` ⊆ the Strategy's `selectedClaimIds` **and** every `metricIds` entry is `confidence: confirmed` — i.e. generation did not bypass the Strategy |

### T4 — Kami renderer contract

The renderer is loaded for real (via a tiny DOM shim) and its HTML output is
asserted. The contract is the **slot → Kami DOM mapping**: the Resume View keeps
the skill's own content slots, and the renderer maps them onto the upstream Kami
class names so the verbatim `kami-family.css` applies.

| ID | Input | Expected |
| --- | --- | --- |
| T4.1 | sample Resume View | header slots → `.header` / `.name.serif` (row 1 left) / `.alias` (row 2 left, `educationInline`) / `.role` (row 1 right) / `.contact` (row 2 right) / `.sep` |
| T4.2 | contact with `href` / without | `<a href>` vs `<span>` |
| T4.3 | sample, plus a variant with `summary` injected | skills → `.skill-row` + `.skill-label` / `.skill-body`; entries → `.project` / `.proj-head` / `.proj-name` / `.proj-role` / `.proj-lines` / `.proj-row` / `.proj-label` / `.proj-text`; `summary` → `.summary`, and an empty `summary` slot renders no block at all |
| T4.4 | sample, both header variants | every emitted class is in the upstream Kami vocabulary (only `.avatar` / `.header-main` are additions, defined by the override file) **and** is matched by a rule in `kami-family.css` + `kami-layout.css` (nothing renders unstyled) |
| T4.5 | name = `<script>alert(1)</script>`, role = `a"b&c` | escaped to `&lt;script&gt;`, `&quot;`, `&amp;`; raw tag absent |
| T4.6 | `{ sections: [] }` (no header) | "Missing Resume View data" placeholder, no crash |
| T4.7 | view with `renderOptions` removed | still renders (theme is html-level) |
| T4.8 | render with no `target` | falls back to `document.body` |
| T4.9 | `**keyword**` in text / skill description | `<span class="hl">` / `<span class="em-brand">`, and no literal `**` in the output |
| T4.10 | sample | renderer emits **no** hard page break; the stylesheet guards entry splitting (`break-inside: avoid`) |
| T4.11 | `sections[type=education]` | → `.no-break` + `.edu-row` (`.school` / `.major` / `.date`) |
| T4.12 | sample | `summaryBullets` / `bullets` → label `·`; `subBlocks` → label `|` + a bold title on its own row, its bullets follow; `tags` are **not** rendered — no content dropped except the intentionally hidden tech stack |
| T4.13 | `shared/kami-family.css` | ships `@page { size: A4 }`, `.no-break`, `resume--dense`, and the 仓耳今楷 `@font-face` |
| T4.14 | `shared/kami-layout.css` | the header deviation is isolated: upstream still says `align-items: flex-end`, the delta file says grid + `align-items: end` (row 1) + `align-self: baseline` (row 2) + `:has(.avatar)` + `align-content: space-between` |
| T4.15 | sample with / without `header.avatar` | avatar layout is gated by the slot: no `.avatar` / `.header-main` when empty; with it, `<img class="avatar">` + `.header-main` wrap the same name / education / contacts |
| T4.16 | `entry.link` (and a legacy URL in `entry.meta`) | `<a href="…">github</a>` — short site label, full URL in `href`; plain `meta` stays text |

### T5 — CLI

| ID | Command | Expected |
| --- | --- | --- |
| T5.1 | `list` | prints `resume-copilot`, exit 0 |
| T5.2 | `check` | prints `OK`, exit 0 |
| T5.3 | (no args) | prints usage, exit 0 |
| T5.4 | `install resume-copilot --target <tmp>` | full tree copied (file count equal), exit 0 |
| T5.5 | install twice, no `--force` | exit 1, "already exists" |
| T5.6 | install twice with `--force` | exit 0 |
| T5.7 | `install does-not-exist` | exit 1, "Unknown skill" |
| T5.8 | `frobnicate` | exit 1, "Unknown command" |

### T6 — Internal spec consistency

Static analysis of the prose + schemas, catching drift between docs and assets.

| ID | Contract |
| --- | --- |
| T6.1 | Every relative file reference in skill markdown resolves (globs and workspace-memory refs excluded) |
| T6.2 | Every workflow `## Required References` entry resolves |
| T6.3 | `render-options.theme` enum ⇄ `templates/kami-*.html` on disk |
| T6.4 | Ownership vocabulary identical across fact/claim/experience; `UNVERIFIED` restricted to facts only |
| T6.5 | Interview node `status` enum covers the policy vocabulary (`UNEXPANDED/EXPANDED/COVERED/MERGED/DROPPED`) |
| T6.6 | Every routing/`能力与路由` reference in `SKILL.md` resolves |
| T6.7 | `kami-default → kami-base.html` documented consistently and matches the schema default |
| T6.8 | `hardMaxDepth` default is 20 in the schema and node `depth.maximum` is 20 |
| T6.9 | All 15 schemas are referenced from `SKILL.md` |
| T6.10 | The two-part answer contract is consistent across `generated-answer.schema.json` + all four docs (`SKILL.md`, `workflows/interview-knowledge.md`, both READMEs) |

### T7 — Resume content lint

JSON Schema can prove a bullet is *well-formed* and *traceable*. It cannot prove
the bullet is *worth reading* — `policies/resume-writing-policy.md` Rule 2
("avoid vague duty statements") names the phrasings explicitly, so the lint in
`lib/resume-lint.mjs` encodes them and T7 turns that policy into an assertion.

| ID | Input | Expected | Why it matters |
| --- | --- | --- | --- |
| T7.1 | `fixtures/invalid/resume-view-duty-statements.json` | validates against `resume-view.schema.json` | Proves the schema **cannot** catch a duty statement — the lint adds coverage the schema lacks |
| T7.2 | same fixture | all 4 bullets flagged, each with a reason | The lint must bite on every named pattern, not just one |
| T7.3 | `fixtures/valid/career-profile.min.json` resume view | 0 problems | The golden fixture is Rule-2 clean |
| T7.4 | golden fixture | every bullet carries ≥1 `claimId` | A clean bullet that is untraceable is still unacceptable |
| T7.5 | golden fixture + its claims | no weak-ownership bullet uses a strong verb (`负责/主导/设计/推动/规划`) | `COLLABORATIVE`/`OBSERVED` work must not be dressed as ownership |
| T7.6 | `templates/shared/sample-data.json` | 0 problems | The shipped renderer sample is the most likely thing a user copies — it must obey the same Rule 2 |

The lint is deliberately conservative: it only flags phrasings the policy names
explicitly, so a hit is a real policy violation rather than a style opinion.

---

## Findings raised by T1–T7

See `test/reports/test-report.md` for the scored summary and remediation notes.
As of the last run the suite reports **70/70 pass** — all findings closed:

- **`examples/claim-graph.example.json`** conformed to neither its schema nor its
  own internal pointers → rewritten to the two-part answer contract, dangling
  refs repaired.
- **`examples/career-profile.example.json`** had a `fact.experienceId`
  (`exp-release`) pointing at an experience the file never defined → an
  `exp-release` draft stub (`resumeReady: false`) was added.
- **`templates/shared/sample-data.json`** shipped a duty statement
  (`参与策略服务与 AI 应用能力建设。`) in the renderer sample users copy →
  rewritten to a high-information bullet, and T7.6 now guards against regression.
- **All 9 theme pages had a comma-separated `:root` block.** CSS parses that as a
  *single* `--parchment` declaration whose value swallows every following token,
  so the other nine theme variables were never defined and every theme silently
  fell back to the upstream palette. Fixed to semicolons; T1.9 now asserts each
  theme defines all 10 upstream tokens with real CSS.
- **All 10 theme pages rendered blank.** They called
  `renderKamiResume({ data: window.KAMI_RESUME_DATA })` but nothing ever assigned
  `KAMI_RESUME_DATA`, so the guard emitted the "Missing Resume View data"
  placeholder. Added `shared/sample-data.js` (a classic `<script>` that works over
  `file://`, unlike `fetch`) and wired it into every page; T1.8 asserts the wiring
  and T1.10 asserts it stays in sync with `sample-data.json`. The gallery was also
  missing its `kami-base.html` entry.
- **`**keyword**` leaked into the rendered page.** `templates/README.md` promised
  theme-accent emphasis and the stylesheet shipped `.hl` / `.em-brand`, but the
  renderer had no way to emit them, so users saw literal asterisks. The renderer
  now parses `**…**` after escaping; T4.9 asserts no literal `**` survives.

