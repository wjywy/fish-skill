# resume-copilot · Test Report

**Date:** 2026-09-29
**Scope:** `skills/resume-copilot` + `bin/fish-skill.mjs`
**Runner:** `node test/run-tests.mjs` (Node ≥ 18, zero dependencies, offline)

---

## 1. Executive summary

| Layer | Result | Meaning |
| --- | --- | --- |
| Deterministic (T1–T6) | **52 / 52 pass** | Layout, schemas, refs, renderer, CLI, consistency |
| Behavioural (B1–B6) | **6 / 6 pass**, 0 anti-patterns | Skill follows its own hard rules under realistic input |

All previously reported findings are now closed (§5). The suite is fully green
and exits 0, so it can be wired straight into CI.

**Verdict: healthy.**

---

## 2. What was tested and why

`resume-copilot` is a *spec* skill: its logic is prose (`SKILL.md`, `workflows/`,
`policies/`) plus a small machine surface (JSON schemas, an HTML/JS renderer, a
CLI). The suite therefore splits into:

- **Deterministic cases** — everything checkable by reading bytes and running
  code. 52 assertions across 6 suites.
- **Behavioural cases** — whether an agent following the prose actually obeys the
  constraints. 6 conformance scenarios, each with a weighted rubric and an
  explicit anti-pattern list.

Full case-by-case detail: `test/cases/README.md` and `test/behavioral/README.md`.

---

## 3. Results

### 3.1 Deterministic suites

| Suite | Checks | Pass | Fail | Notes |
| --- | --- | --- | --- | --- |
| T1 · Package & structure | 9 | 9 | 0 | Frontmatter, all 8 workflows, 8 policies, 15 schemas, 6 examples, 10 themes, shared assets, CLI wiring |
| T2 · Schema validation | 12 | 12 | 0 | 5 positive + 6 negative + the two-part answer contract |
| T3 · Cross-reference integrity | 4 | 4 | 0 | `career-profile.min.json` and both shipped examples fully consistent |
| T4 · Kami renderer contract | 9 | 9 | 0 | Renders real HTML through the real `kami-render.js`; XSS escaping verified |
| T5 · CLI | 8 | 8 | 0 | list/check/install/force/unknown, full-tree copy (56 files) |
| T6 · Internal spec consistency | 10 | 10 | 0 | Ownership vocabulary, theme enum ⇄ files, doc refs, two-part contract across schema + 4 docs |

### 3.2 Behavioural scenarios

| ID | Scenario | Score | Verdict |
| --- | --- | --- | --- |
| B1 | Target Direction Gate (mixed React + Go signals) | 100% | ✅ PASS |
| B2 | Repository evidence ≠ ownership | 100% | ✅ PASS |
| B3 | Metric provenance ("提升很多") | 100% | ✅ PASS |
| B4 | Answer-driven depth + two-part answers | 100% | ✅ PASS |
| B5 | Interview output hygiene (deny-list scan) | 100% | ✅ PASS |
| B6 | Mock Interview assessment | 100% | ✅ PASS |

---

## 4. Change made this round — two-part reference answers

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

---

## 5. Findings — all closed

| ID | Severity | Finding | Status |
| --- | --- | --- | --- |
| F1 | HIGH | `claim-graph.example.json` violated its own schema | ✅ fixed |
| F2 | HIGH | `claim-graph.example.json` had dangling internal refs | ✅ fixed |
| F3 | LOW | `career-profile.example.json` had a dangling `experienceId` | ✅ fixed |

### F3 — `examples/career-profile.example.json` dangling experienceId (LOW, fixed)

`facts[0].experienceId = "exp-release"` pointed at an experience the file never
defined. Added a minimal draft-stage `exp-release` experience — `type: project`,
`ownership: DIRECT` (matching the existing fact), `resumeReady: false` with two
`openQuestions`. The example now reads as an honest bootstrap-stage profile
instead of a dangling pointer.

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
- **`.workbuddy-ai/memory/` references** in `SKILL.md` are workspace-runtime
  paths, correctly excluded from asset link-checking.

---

## 6. Coverage & limitations

- **Covered:** artefact integrity, the full traceability chain
  (Fact → Claim → Metric → View → bullet), the renderer's real output and
  escaping, the CLI, the two-part answer contract, and the six most
  violation-prone behavioural constraints.
- **Not covered:** statistical behaviour (one run per behavioural scenario proves
  it *can* be right, not that it always is); resume writing quality (subjective —
  only the rendering contract is asserted); PDF output (no headless browser);
  multi-target strategy selection.

## 7. Recommendations

1. **Add a CI hook** — wire `npm test` into `prepack` (currently only `check`
   runs) so schema/example drift is caught before publish.
2. **Align the example's ownership** — see the observation in §5; the example
   currently teaches `参与 → DIRECT`, which contradicts principle 4.
3. **Grow the behavioural set** — the three scenarios listed at the end of
   `test/behavioral/results.md` (long-session sibling return, multi-target
   strategy, and a B1 negative control).

---

*Generated alongside `test/reports/results.json` (machine-readable per-check results).*
