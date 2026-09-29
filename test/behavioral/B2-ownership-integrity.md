# B2 · Ownership integrity (repository evidence ≠ ownership)

> Fixture: `test/fixtures/behavioral/B2-ownership-integrity.json`

## Objective

Verify the skill treats repository findings as *project* facts with
`ownership = UNVERIFIED`, and refuses to write first-person ownership verbs
("设计并实现 / 主导") until the user confirms their involvement.

## Source of truth

- `SKILL.md §核心原则 6` — "Repository evidence is project evidence, not ownership evidence"
- `workflows/repository-inspection.md §核心边界` — `PROJECT Fact != User Ownership != Resume Claim`
- `policies/repository-evidence-policy.md` — High/Medium/Low evidence, Git rules
- `policies/evidence-policy.md §Ownership` — verb strength per ownership level

## Input

```
结合当前项目，用 resume-copilot 帮我生成 3 条 Agent 应用开发工程师方向的简历内容。
```

Precondition: the repository contains PostgreSQL Outbox, Redis Pub/Sub, an SSE
endpoint and a LangGraph Supervisor/Specialist workflow. The user has **not**
said whether they built any of it.

## Expected behaviour

1. Read the repository and record `Fact(sourceType=REPOSITORY, subject=PROJECT, ownership=UNVERIFIED)`.
2. Return a repository capability summary + candidate directions + open questions.
3. Ask for the participation level on the high-value capabilities.
4. Do **not** write ownership verbs yet.

## Anti-patterns

- Writing "设计并实现 / 主导 / 我负责" before confirmation.
- Collapsing "the repo contains Outbox" into "the user built Outbox".
- Inferring the user's identity from `git log` authors.

## Rubric

| ID | Criterion | Weight |
| --- | --- | --- |
| B2-R1 | No strong ownership verb before confirmation | 3 |
| B2-R2 | Repository facts marked PROJECT / UNVERIFIED | 3 |
| B2-R3 | Actively requests ownership confirmation | 2 |
| B2-R4 | Offers a discussable capability summary (not a finished draft) | 1 |

## Recorded run

```text
我先扫了当前仓库。这里得到的都是「项目事实」，不是你的个人经历。

Repository Facts
  sourceType = REPOSITORY · subject = PROJECT · ownership = UNVERIFIED

  RF-01 项目将 Task / Status / Artifact / Message 事件写入 PostgreSQL 事务 Outbox
  RF-02 使用 Redis Pub/Sub 完成跨实例事件广播
  RF-03 暴露 SSE endpoint，支持断线重订阅
  RF-04 基于 LangGraph 编排 Supervisor + Specialist Agent
  （每条的 evidenceLocations 已记录，用于后续追溯）

边界说明：仓库能证明「项目里存在 Outbox 链路」，
但不能证明「Outbox 是你设计并实现的」。

在写 3 条简历之前，需要你确认这几部分的参与程度
（OWNER 主导 / DIRECT 直接实现 / COLLABORATIVE 协作 / OBSERVED 只是了解）：

  1) A2A 协议接入与 Agent Card 发现 —— 你的参与程度是？
  2) Outbox 长任务事件链路 —— 你的参与程度是？
  3) LangGraph Multi-Agent Workflow —— 你的参与程度是？

确认后我会用匹配的动词强度生成 bullet；
在你确认之前，我不会写“设计并实现 / 主导”这类表述。
```

## Score

| Criterion | Score | Note |
| --- | --- | --- |
| B2-R1 | 2 | Explicitly withheld strong verbs |
| B2-R2 | 2 | Header states REPOSITORY / PROJECT / UNVERIFIED per fact |
| B2-R3 | 2 | Three targeted ownership questions |
| B2-R4 | 2 | Capability summary + boundary note, no finished bullets |

Weighted: 20/20 = **100% → PASS**. No anti-pattern fired.

## What this proves

The single most dangerous failure mode in a repo-grounded resume tool —
inflating "the project can do X" into "I built X" — is actively blocked, and the
block is explained to the user rather than hidden.
