# B1 · Target Direction Gate

> Fixture: `test/fixtures/behavioral/B1-target-direction-gate.json`

## Objective

Verify the skill refuses to produce target-specific resume wording before the
target direction is known, and that it asks for the direction instead of
guessing it from the tech stack.

## Source of truth

- `SKILL.md §Target Direction Gate` — "不得根据 React、Go、LangGraph、Redis 等技术词自行推断岗位方向"
- `SKILL.md §核心原则 1` — "Target direction before final wording"
- `workflows/input-intake.md §Target Direction Gate`
- `policies/bootstrap-generation-policy.md §Target-first + Draft-first`

## Input

```
使用 resume-copilot 帮我整理下面这个项目的简历内容。
项目：低代码平台
负责：页面编辑器、事件驱动器
关键词：React、Schema、页面编辑、实时预览、Go、Redis
```

Note the deliberate trap: the keyword list mixes **React** (front-end signal)
and **Go/Redis** (back-end signal). A skill that guesses will pick one and be
wrong; the correct behaviour is to ask.

## Expected behaviour

1. Extract Facts and classify them (context / ownership / action / technology).
2. Surface information gaps.
3. Ask for the target direction **once**.
4. Show facts/skeleton, but emit **no** target-oriented Resume Bullet.

## Anti-patterns (any of these caps the verdict at PARTIAL)

- Inferring "前端" or "后端" from React / Go.
- Emitting a finished Resume Bullet before the direction is confirmed.
- Asking the direction but bundling it with a wall of unrelated questions.

## Rubric

| ID | Criterion | Weight |
| --- | --- | --- |
| B1-R1 | No formal bullet produced while direction unknown | 3 |
| B1-R2 | Asks for target direction, exactly once | 3 |
| B1-R3 | Does not infer direction from the tech stack | 3 |
| B1-R4 | Extracts and shows traceable Facts / gaps | 1 |

## Recorded run

```text
收到。我先把这个项目拆成可追溯的事实，并确认一个关键前提。

已抽取的 Facts（来源：用户输入）
┌────┬──────────────────────────────────────────┬────────────┬───────────┐
│ ID │ 陈述                                     │ 类别       │ 状态      │
├────┼──────────────────────────────────────────┼────────────┼───────────┤
│ F1 │ 项目为低代码平台                          │ context    │ confirmed │
│ F2 │ 用户负责页面编辑器与事件驱动器            │ ownership  │ confirmed │
│ F3 │ 涉及 React / Schema / 页面编辑 / 实时预览 │ technology │ confirmed │
│ F4 │ 涉及 Go / Redis                           │ technology │ confirmed │
└────┴──────────────────────────────────────────┴────────────┴───────────┘

信息缺口（补齐后才能形成正式 bullet）
- [待确认] 页面编辑器具体做了什么：渲染引擎 / 属性面板 / 拖拽？
- [待确认] 事件驱动器的关键机制：Schema 抽象？运行时解析？
- [待确认] 有没有可验证的结果或规模数据？

需要你先确认一件事：
这份简历主要投什么方向？例如前端、后端、Agent、产品、全栈，或者直接给我具体岗位名称。
方向确定后，我会按该方向决定表达重点，并给出第一版可讨论的 Draft。
```

## Score

| Criterion | Score | Note |
| --- | --- | --- |
| B1-R1 | 2 | No bullet emitted |
| B1-R2 | 2 | Asked once, at the end, as the single blocking question |
| B1-R3 | 2 | Explicitly did not pick 前端/后端 despite both signal sets |
| B1-R4 | 2 | Facts table + gaps shown |

Weighted: 20/20 = **100% → PASS**. No anti-pattern fired.

## What this proves

The gate holds even when the input contains conflicting direction signals, which
is the exact failure mode the policy was written to prevent.
