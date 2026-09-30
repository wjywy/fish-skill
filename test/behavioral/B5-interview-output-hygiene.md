# B5 · Interview Knowledge — user-visible output hygiene

> Fixture: `test/fixtures/behavioral/B5-output-hygiene.json`
> Audits the document produced in **B4**.

## Objective

Verify the delivered Markdown contains **no internal reasoning metadata** — the
workflow lists an explicit deny-list of fields that must never reach the user.

## Source of truth

- `SKILL.md §Interview 模式` — internal fields "仅用于内部推理，除非用户明确要求，否则不得输出"
- `workflows/interview-knowledge.md §默认禁止输出的内部信息` (the deny-list)
- `workflows/interview-knowledge.md §用户可见 Markdown 输出` (structure rules)

## Input

```
把刚才那条 Outbox 简历描述的面试准备整理成一份可以直接复习的 Markdown 文档。
```

## Expected behaviour

- `#` = the core theme (e.g. `# Outbox 可靠事件分发`), never `Claim 1`.
- `##` = questions; answers immediately follow.
- Each answer directly addresses the question, then explains the mechanism
  with a concrete example in natural candidate language.
- Any project-detail gap is covered by a short aside only.

## Anti-patterns — the deny-list

| Must not appear | Why |
| --- | --- |
| `claimId` / `Claim 1` | internal identity |
| evidence paths / file paths / code evidence | internal provenance |
| `VERIFIED` / `PARTIAL` / `INSUFFICIENT` | grounding status |
| `depth` | graph metadata |
| Node Type (`IMPLEMENTATION`, `FAILURE`, `TRADEOFF` …) | graph metadata |
| `roleRelevance` | graph metadata |
| risk level (`HIGH` / `MEDIUM` / `LOW`) | internal risk |
| Knowledge Node / Parent / Child / Shared Node | graph structure |
| Stop Reason / 停止条件 | internal control |
| document status / generation-mode notes | internal state |
| "建议补充验证" style gap lists | internal to-do |

## Rubric

| ID | Criterion | Weight |
| --- | --- | --- |
| B5-R1 | Zero internal metadata fields exposed | 3 |
| B5-R2 | Level-1 heading is a theme, not a Claim number | 2 |
| B5-R3 | Questions and answers are adjacent and revision-ready | 2 |
| B5-R4 | Every answer has a direct opening, concrete mechanism, and no internal field labels | 2 |

## Recorded run (audit of the B4 document)

The audit below predates the spoken-answer contract. Its `**原理详解**`
markers and recorded score are historical evidence, not the current output target;
rerun B4/B5 to score the revised rubric.

Structural check:

```text
# Outbox 可靠事件分发                      ← theme, not "Claim 1"          ✓ B5-R2
## 为什么 Task 状态和 Outbox Event …        ← question
   <一段话的逻辑与项目场景>                  ← part 1, concise               ✓ B5-R4
   **原理详解**                             ← part 2 marker                 ✓ B5-R4
   <展开的通用原理>                          ← part 2, longer                ✓ B5-R4
## Outbox Worker 重复投递时，消费侧如何保证幂等？
   一段话 + **原理详解**
## 两个 Worker 并发消费同一事件时，“先查再写”为什么仍可能重复执行？
   一段话 + **原理详解**
## 唯一约束在并发去重里是如何保证原子性的？隔离级别会带来什么影响？
   一段话 + **原理详解**
## 多个 Worker 同时扫描 Outbox 表时，FOR UPDATE SKIP LOCKED …
   一段话 + **原理详解**
```

Deny-list scan (case-sensitive substring search over the delivered document):

```text
claimId ................. not present   ✓
Claim 1 / Claim 2 ....... not present   ✓
VERIFIED / PARTIAL /
  INSUFFICIENT .......... not present   ✓
depth ................... not present   ✓
Node Type tokens ........ not present   ✓
roleRelevance ........... not present   ✓
HIGH / MEDIUM / LOW ..... not present   ✓
Stop Reason / 停止条件 .. not present   ✓
文档状态 / 生成模式 ..... not present   ✓
建议补充验证 ............ not present   ✓
```

No aside was needed in this run because the technical answers were fully
derivable from general knowledge; the aside mechanism exists for cases where a
project-specific detail is unverifiable and is exercised in the policy text
(`workflows/interview-knowledge.md`).

## Score

| Criterion | Score | Note |
| --- | --- | --- |
| B5-R1 | 2 | Deny-list scan clean |
| B5-R2 | 2 | `# Outbox 可靠事件分发` |
| B5-R3 | 2 | Each `##` immediately followed by its answer |
| B5-R4 | 2 | All six answers carry the `**原理详解**` section |

Weighted: 20/20 = **100% → PASS**. No anti-pattern fired.

## What this proves

"内部结构复杂，用户输出简单" holds: the skill carries a rich Claim / Evidence /
Knowledge-Graph model internally but ships a clean, revision-ready document.
