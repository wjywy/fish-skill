# B6 · Mock Interview — assessment & follow-up

> Fixture: `test/fixtures/behavioral/B6-mock-interview.json`

## Objective

Verify that Mock Interview mode activates only on explicit request, withholds
the reference answer, assesses the *user's* answer without over-crediting
keyword mentions, and follows up on the identified gap instead of moving on.

## Source of truth

- `SKILL.md §Mock Interview（可选）` — enabled only when the user asks
- `workflows/mock-interview.md` — Question → User Answer → Assessment → Follow-up
- `policies/answer-assessment-policy.md` — "用户说出术语 ≠ 掌握机制"; states WEAK / PARTIAL / DEFENSIBLE / NOT_OWNED / INCORRECT

## Input

```
模拟面试我，不要先给答案，我自己回答。
问：为什么使用 Transactional Outbox？
答：因为 Outbox 可以保证消息可靠。
```

## Expected behaviour

1. Enter Mock Interview mode (the trigger "不要先给答案" is explicit).
2. **Do not** output a reference answer.
3. Assess the user answer. "Outbox 可以保证消息可靠" is a keyword-level restatement
   of the question, so it must not be scored `DEFENSIBLE`.
4. Generate a follow-up aimed at the missing dimension (the write-consistency
   problem between DB update and message send).
5. Do not write the user's improvised answer back into the Career Profile.

## Anti-patterns

- Providing the reference answer (that would be Interview Knowledge, not Mock).
- Marking `DEFENSIBLE` because the answer contained the correct keyword "可靠".
- Skipping to a new question instead of probing the weakness.

## Rubric

| ID | Criterion | Weight |
| --- | --- | --- |
| B6-R1 | No reference answer given | 3 |
| B6-R2 | Assessment not over-optimistic (not DEFENSIBLE) | 3 |
| B6-R3 | Follow-up targets the gap rather than changing topic | 2 |

## Recorded run

```text
（模拟面试模式 · 本轮不提供参考答案）

评估：WEAK
- 只给出了结论性判断（“可以保证消息可靠”），基本是复述问题里的关键词；
- 没有说明它解决的具体问题，也没有触及数据库更新与消息发送之间的关系。

追问：
它具体解决了数据库更新和消息发送之间的什么问题？如果不使用 Outbox，
你认为会在什么时刻出现不一致？
```

## Score

| Criterion | Score | Note |
| --- | --- | --- |
| B6-R1 | 2 | No reference answer emitted |
| B6-R2 | 2 | Scored `WEAK`, with the reason being exactly the keyword-restatement problem |
| B6-R3 | 2 | Follow-up targets the write-consistency gap, same question thread |

Weighted: 16/16 = **100% → PASS**. No anti-pattern fired.

## What this proves

The two interview modes are cleanly separated. A keyword-only answer is correctly
graded as weak rather than accepted, which is the behaviour that makes Mock
Interview useful for finding real gaps before the real interview.
