# Behavioural Test Cases (B1–B6)

The deterministic suite (T1–T6) checks artefacts. It cannot check whether the
skill *behaves* correctly when an agent follows its instructions — that is where
most of the skill's value lives. The behavioural cases cover that gap.

## Why these need a different method

`resume-copilot` is a prompt/spec skill: its "logic" is the prose in `SKILL.md`,
`workflows/` and `policies/`. There is no function to unit-test. So each
behavioural case is a **conformance scenario**:

1. A fixed, realistic user input plus a fixed starting state (`fixtures/behavioral/*.json`).
2. A list of **must-do** behaviours and **must-not-do** anti-patterns, each traced
   to the exact section of the skill that mandates it.
3. A weighted rubric that converts the observed run into a score.
4. A recorded run: the actual output produced by executing the skill's
   instructions against the scenario, plus the score and verdict.

This is deliberately reproducible: anyone can re-run a scenario with a fresh
agent session, diff the transcript against the rubric, and reach the same score.

## Rubric scale

Each criterion is scored 0 / 1 / 2 and multiplied by its weight:

| Score | Meaning |
| --- | --- |
| **2** | Fully satisfies the criterion |
| **1** | Partially satisfies it (correct direction, incomplete or noisy) |
| **0** | Violates the criterion, or the corresponding anti-pattern fired |

Verdict thresholds: **≥ 85% = PASS**, **60–84% = PARTIAL**, **< 60% = FAIL**.
Any single anti-pattern that fires caps the verdict at PARTIAL regardless of the
weighted score, because the anti-patterns encode the skill's hard constraints
("不可跳过", "禁止", "不得").

## Index

| ID | Scenario | Primary capability | Source of truth |
| --- | --- | --- | --- |
| B1 | Project keywords, no target direction | Target Direction Gate | `SKILL.md §Target Direction Gate` |
| B2 | Repository mode, ownership unconfirmed | Repository evidence ≠ ownership | `policies/repository-evidence-policy.md` |
| B3 | Vague result ("提升很多") | Metric provenance | `policies/metric-policy.md` |
| B4 | Interview prep on one claim | Answer-driven depth | `workflows/interview-knowledge.md` |
| B5 | Same claim, output format | Output hygiene | `workflows/interview-knowledge.md §用户可见 Markdown 输出` |
| B6 | "模拟面试我" | Mock Interview assessment | `policies/answer-assessment-policy.md` |

## How to re-run a case

```
1. Open a fresh agent session with the resume-copilot skill installed.
2. Paste the `userInput` from the matching fixture verbatim.
3. Do not add hints; let the skill drive.
4. Capture the full transcript.
5. Score against the rubric in the case file; record the verdict in results.md.
```

Scores are recorded in `test/behavioral/results.md`.
