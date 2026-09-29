# Behavioural Results

Executed: 2026-09-29 · skill `resume-copilot` · mode: conformance scenarios
(`fixtures/behavioral/*.json`), scored against the rubrics in each case file.

| ID | Scenario | Weighted score | Anti-patterns fired | Verdict |
| --- | --- | --- | --- | --- |
| B1 | Target Direction Gate | 20/20 (100%) | none | ✅ PASS |
| B2 | Ownership integrity | 20/20 (100%) | none | ✅ PASS |
| B3 | Metric provenance | 16/16 (100%) | none | ✅ PASS |
| B4 | Answer-driven depth + two-part answers | 24/24 (100%) | none | ✅ PASS |
| B5 | Interview output hygiene | 20/20 (100%) | none | ✅ PASS |
| B6 | Mock Interview assessment | 16/16 (100%) | none | ✅ PASS |
| B7 | Resume bullet quality | 20/20 (100%) | none | ✅ PASS |
| B8 | Resume Strategy (JD matching) | 20/20 (100%) | none | ✅ PASS |
| B9 | Resume generation (Strategy compliance) | 20/20 (100%) | none | ✅ PASS |

**Aggregate: 9/9 PASS, 0 anti-patterns.**

## What was actually exercised

- **B1** — a mixed front-end/back-end keyword set (React **and** Go/Redis) did not
  cause the skill to guess a direction; it withheld bullets and asked once.
- **B2** — repository facts were labelled `PROJECT / UNVERIFIED` and the skill
  refused ownership verbs until confirmation; the "repo ≠ me" boundary was stated
  to the user.
- **B3** — a real `7h+ → 5min` pair next to a vague "提升很多" produced **no**
  fabricated percentage; the vague part was routed to a confirmation question.
- **B4** — the interview output was a single chain
  (`双写一致性 → 幂等 → check-then-act 竞态 → 唯一约束/MVCC`) reaching the
  mechanism layer, with a retained sibling returned to at the end — not a topic
  list. Every answer used the two-part shape (a concise logic + project-scenario
  paragraph, then a longer `**原理详解**` section).
- **B5** — the delivered Markdown passed a full deny-list scan: no `claimId`,
  no grounding status, no `depth`, no Node Type, no risk level, no stop reason;
  and all six answers carried the two-part structure.
- **B6** — Mock Interview mode withheld the reference answer, graded a
  keyword-only reply as `WEAK`, and followed up on the exact gap.
- **B7** — a "负责 XX" project description that practically begs for a duty
  statement produced **no** finished bullet: six topics were split apart, three
  mechanism questions were asked, and only a placeholder skeleton was offered.
- **B8** — a JD demanding Kubernetes and RAG was matched against four Claims; the
  two genuine gaps were reported as `gap` rather than filled, and the D/NONE
  Claim was excluded with a reason. No claim was invented.
- **B9** — generation stayed inside the Strategy's selection: the excluded
  HIGH-risk Claim and the `inferred` metric were both dropped, and every bullet
  carried `claimIds` + `metricIds`. The golden output is frozen as
  `fixtures/valid/resume-view.agent.json` and machine-checked by T3.5.

## Caveats & limitations

1. These are **conformance** runs, not statistical measurements. A single run per
   scenario proves the skill *can* behave correctly; it does not bound the
   variance across models or temperatures.
2. Scoring was performed by the same process that produced the run. The rubrics
   are written to be objective (each criterion is a yes/no observable), but a
   fully independent evaluation would use a separate judge.
3. The scenarios cover the skill's *constraint* surface (the rules that are easy
   to violate). Where a constraint is mechanically checkable — bullet phrasing —
   it is also encoded as a deterministic test (T7) rather than left to a scored
   run; purely subjective *writing quality* remains out of scope.
4. B4/B5 share a scenario; B5 audits B4's artefact rather than producing a new one.
5. B7/B8/B9 are the resume-side counterparts to B1–B6 (which cover the interview
   side). B9's golden output doubles as a deterministic fixture, so it is the one
   scenario whose result is re-verified on every `npm test`.

## Suggested additions

B7/B8/B9 closed the previous gap on the resume side (bullet quality, Strategy
selection, generation compliance). Still open:

- A "long-session" case: verify the Answer-driven scheduler returns to retained
  siblings after a deep branch, with an assertion on ordering (not just presence).
- A "multi-target" case: same Career Profile, two target roles, assert that
  Resume Strategy selects different Claims without changing any Fact.
- A negative control for B1: confirm the skill *does* emit bullets once a
  direction is supplied, to rule out an over-blocking failure mode.
- A "renderer round-trip" case: feed a generated Resume View through the Kami
  renderer and assert the output contains no grounding metadata (B5-style audit
  applied to the resume path).
