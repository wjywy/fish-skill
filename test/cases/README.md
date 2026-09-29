# Deterministic Test Cases (T1–T6)

These are the mechanically checkable cases. They run offline with zero
dependencies via `node test/run-tests.mjs`. Every case asserts a **contract the
skill publishes about itself** — the test files describe the desired behaviour,
so a failing case is a real finding against the skill, not against the test.

| Suite | Focus | Cases | Runner section |
| --- | --- | --- | --- |
| T1 | Package & structure integrity | 9 | `T1()` |
| T2 | JSON Schema validation | 12 | `T2()` |
| T3 | Cross-reference integrity | 4 | `T3()` |
| T4 | Kami renderer contract | 9 | `T4()` |
| T5 | CLI behaviour | 8 | `T5()` |
| T6 | Internal spec consistency | 10 | `T6()` |
| | **Total** | **52** | |

Run one suite at a time with its id, e.g. `node test/run-tests.mjs T4`.

---

## Coverage matrix

| Capability the skill claims | Covered by |
| --- | --- |
| Skill is discoverable / installable | T1.1, T1.9, T5.1, T5.4 |
| On-demand loading assets all exist | T1.2, T1.3, T1.4, T1.6, T1.7, T6.1, T6.6 |
| Data model is well-formed | T2 (all), T6.4, T6.5, T6.8 |
| Fact → Claim → Metric → View is traceable | T3.1, T3.3, T3.4, T2 (claim/view schemas) |
| Interview graph is internally linked | T3.3, T6.5 |
| Kami renderer renders a Resume View | T4.1–T4.4, T4.7–T4.9 |
| Renderer is safe against injected markup | T4.5, T4.6 |
| Theme set is coherent | T1.6, T1.8, T6.3, T6.7 |
| Distribution copies the whole skill | T5.4 |
| Documented file references are not dangling | T6.1, T6.2, T6.6 |
| Schemas are referenced from the entry doc | T6.9 |

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
| T1.7 | shared assets | `kami-render.js`, `kami-family.css`, `common.css`, `sample-data.json`, `index.html` exist | Every theme depends on the shared renderer/CSS |
| T1.8 | Each theme HTML | References `shared/kami-family.css`, `shared/kami-render.js`, and calls `renderKamiResume` | Structure/theme separation only holds if every entry wires up the shared assets |
| T1.9 | `bin/fish-skill.mjs` + `package.json` | File exists and `package.json#bin` points at it | Otherwise `npx fish-skill …` cannot run |

### T2 — JSON Schema validation

Positive cases assert the shipped examples conform to their own schemas:

| ID | Artefact | Schema |
| --- | --- | --- |
| T2.examples/career-profile.example.json | Career Profile | `career-profile.schema.json` |
| T2.examples/resume-strategy.example.json | Resume Strategy | `resume-strategy.schema.json` |
| T2.examples/claim-graph.example.json | Interview Knowledge Graph | `claim-graph.schema.json` |
| T2.templates/shared/sample-data.json | Resume View | `resume-view.schema.json` |
| T2.fixtures/valid/career-profile.min.json | Career Profile (hand-built, fully consistent) | `career-profile.schema.json` |

Negative cases prove the validator actually rejects bad data (a suite that only
passes is worthless):

| Fixture | Injected defect | Schema | Token asserted in error |
| --- | --- | --- | --- |
| `fact-missing-statement.json` | omits required `statement` | `fact.schema.json` | `statement` |
| `fact-bad-category-enum.json` | `category: "vibes"` | `fact.schema.json` | `category` |
| `claim-empty-factids.json` | `factIds: []` (violates `minItems: 1`) | `claim.schema.json` | `factIds` |
| `resume-view-bullet-missing-claimids.json` | bullet without `claimIds` | `resume-view.schema.json` | `claimIds` |
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

### T4 — Kami renderer contract

The renderer is loaded for real (via a tiny DOM shim) and its HTML output is asserted.

| ID | Input | Expected |
| --- | --- | --- |
| T4.1 | sample Resume View | header name, target role, education rendered |
| T4.2 | contact with `href` / without | `<a href>` vs `<span>` |
| T4.3 | sample | summary, skills, sections, subBlocks, tags all present |
| T4.4 | sample | `section-work` / `section-project` classes emitted |
| T4.5 | name = `<script>alert(1)</script>`, role = `a"b&c` | escaped to `&lt;script&gt;`, `&quot;`, `&amp;`; raw tag absent |
| T4.6 | `{ sections: [] }` (no header) | "Missing Resume View data" placeholder, no crash |
| T4.7 | view with `renderOptions` removed | still renders (theme is html-level) |
| T4.8 | render with no `target` | falls back to `document.body` |
| T4.9 | bullet given as a plain string | rendered inside `<li>` |

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

---

## Findings raised by T1–T6

See `test/reports/test-report.md` for the scored summary and remediation notes.
As of the last run the suite reports **52/52 pass** — all findings closed:

- **`examples/claim-graph.example.json`** conformed to neither its schema nor its
  own internal pointers → rewritten to the two-part answer contract, dangling
  refs repaired.
- **`examples/career-profile.example.json`** had a `fact.experienceId`
  (`exp-release`) pointing at an experience the file never defined → an
  `exp-release` draft stub (`resumeReady: false`) was added.
