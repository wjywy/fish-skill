# B7 · Resume bullet quality

> Fixture: `test/fixtures/behavioral/B7-resume-bullet-quality.json`

## Objective

Verify the skill applies `resume-writing-policy.md` when turning a weak,
multi-capability project description into resume content: it must not emit vague
duty statements, must not stuff six topics into one bullet, and must ask for the
missing mechanism instead of inventing it.

## Source of truth

- `policies/resume-writing-policy.md` — Rule 1 (one core topic), Rule 2 (no duty
  statements), Rule 3/8 (action + mechanism), Rule 6 (verb strength), Rule 12 (traceable)
- `workflows/resume-generation.md §Bullet 生成原则`
- `policies/bootstrap-generation-policy.md §Bootstrap Bullet 写作要求`
- `examples/resume-bullet-patterns.md §9 Weak → Strong`

## Input

```
使用 resume-copilot 帮我把这段整理成简历内容：
项目：低代码平台
我负责页面编辑器、事件系统、物料平台、权限、发布和性能优化。
关键词：Schema、实时预览
```

Target role is **given** (前端开发工程师), so the Target Direction Gate does not
block. The trap is the input itself: one sentence listing six capabilities with
zero mechanism.

## Expected behaviour

1. Recognise the input is "multi-topic + no mechanism" and split it by topic.
2. Surface the missing mechanism and ask 1–3 high-value questions.
3. If it shows a skeleton, keep it a skeleton — not a finished bullet.
4. Verbs must match `OWNER`, but must not claim unconfirmed mechanisms.

## Anti-patterns

- 「负责低代码平台相关能力建设」-style duty statements.
- One bullet covering 页面编辑器/事件系统/物料平台/权限/发布/性能优化.
- Inventing implementation detail (e.g. 「基于虚拟 DOM Diff 与 Web Worker…」).
- Using 「设计并实现」 when no mechanism has been provided.

## Rubric

| ID | Criterion | Weight |
| --- | --- | --- |
| B7-R1 | No vague duty statement (Rule 2) | 3 |
| B7-R2 | One core topic per bullet (Rule 1) | 3 |
| B7-R3 | Missing mechanism → skeleton + questions, not fabrication | 2 |
| B7-R4 | Verb strength matches OWNER without over-claiming | 2 |

## Recorded run

```text
目标方向已明确：前端开发工程师。我先按主题拆开，并标出必须补齐的机制缺口。

识别到的主题（一条 bullet 只讲一个）
  1. 页面编辑器
  2. 事件系统
  3. 物料平台
  4. 权限
  5. 发布链路
  6. 性能优化

现在还不能出正式 bullet，原因是：目前只有「负责 XX」这一层信息。
直接写只会得到两种结果——
  · 空泛职责句：「负责低代码平台相关能力建设。」
  · 编造机制：「基于虚拟 DOM Diff 与 Web Worker 构建实时预览引擎……」（你没有提供这些事实）

需要你补的机制（决定这些 bullet 能否成型）
  1. 页面编辑器：你动的是渲染引擎、属性面板还是拖拽编排？
  2. 事件系统：Schema 里抽象了什么？运行时怎么解析成真正的组件交互？
  3. 性能优化：优化了哪个指标，怎么定位到瓶颈的？

先给骨架（占位，不是成稿）：

  项目：低代码平台（前端方向）
  · 页面编辑器：[动作] + [模块/对象] + [技术机制] + [解决的问题]
  · 事件系统：     [动作] + [模块/对象] + [技术机制] + [解决的问题]
  · 性能优化：     [动作] + [测量/归因方式] + [优化手段] + [指标结果]

你补完机制后，我会按「动作 + 对象 + 技术机制 + 问题 + 结果」生成正式 bullet。
```

## Score

| Criterion | Score | Note |
| --- | --- | --- |
| B7-R1 | 2 | No duty statement emitted; the anti-example is shown as a warning |
| B7-R2 | 2 | Six topics enumerated separately; skeleton keeps one topic per line |
| B7-R3 | 2 | Explicitly refused to fabricate mechanism; asked three targeted questions |
| B7-R4 | 2 | Did not use 「设计并实现」 before mechanism was known |

Weighted: 20/20 = **100% → PASS**. No anti-pattern fired.

## What this proves

The writing policy's Rule 2 survives its hardest case: an input that practically
begs for a duty statement. The skill also correctly treats "no mechanism" as a
blocker for finished bullets rather than filling the gap with plausible-sounding
technical detail — the failure mode `resume-bullet-patterns.md §10` warns about.
