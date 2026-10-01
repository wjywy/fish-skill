# Evidence & Claim Policy

## 目的

把“用户参与程度”和“事实可靠程度”拆成独立维度，并定义 Fact → Claim 的证据边界。

Metric 的数值、口径和可写入条件统一由 `./metric-policy.md` 定义；本文件不重复维护 Metric 规则。

## Ownership

| 值 | 含义 | 默认允许的动词 |
|---|---|---|
| `OWNER` | 主导方案、推进或承担最终责任 | 主导、负责、设计、推动 |
| `DIRECT` | 自己直接实现关键部分 | 实现、开发、优化、落地 |
| `COLLABORATIVE` | 与他人共同完成 | 参与、协作、共同完成 |
| `OBSERVED` | 联调、排查、接触、了解 | 协助、接入、联调、排查、熟悉 |
| `NONE` | 没有实际参与 | 默认不写成项目贡献 |

动词只是默认建议，不是机械映射；必须结合具体事实。

## Evidence Level

| 等级 | 定义 |
|---|---|
| `A` | 用户明确确认，且能说明具体事实 |
| `B` | 根据用户已描述事实做出的合理结构化抽取，尚未逐字确认 |
| `C` | 用户理解原理或熟悉方案，但并非自己的直接项目事实 |
| `D` | 缺少足够支撑、存在明显猜测或无法解释 |

Evidence Level 描述“这条 Claim 的事实支撑有多强”，不等于 Ownership。

## Confidence

- `confirmed`：用户明确确认。
- `inferred`：由上下文推导，尚待用户确认。
- `disputed`：用户给出的信息存在冲突。
- `unknown`：当前材料无法判断。

## Interview Risk

- `LOW`：用户有直接经历，常规追问可解释。
- `MEDIUM`：存在协作边界、关键细节未确认，或技术本身会引出较深追问。
- `HIGH`：表述强于实际 Ownership、仅理解未实践、或关键实现细节缺失。

Interview Risk 不是“禁止写入”的开关，而是 Strategy / Review 的决策信息。

## Fact → Claim 追溯规则

每个正式 Claim 必须至少引用一个 `factId`。

Claim 不重复维护原始 source；来源类型、仓库位置、用户确认等统一沿：

```text
Claim.factIds
→ Fact
→ sourceType / evidenceLocations / confidence / subject
```

如果 Claim 包含人物贡献表述，还必须有足够的 USER / Ownership 事实支撑；单纯 PROJECT Fact 不能自动升级成个人 Resume Claim。

Metric 也通过 `factIds` 回溯来源，但 Metric 的可用条件读取 `./metric-policy.md`。

## 写入原则

1. `Evidence D` 默认不进入最终简历。
2. `Evidence C` 可以进入技能、了解项或用户明确选择的强化表述，但不能伪装成直接项目实践。
3. 不静默升级 Ownership。
4. 用户坚持更强措辞时可以保留用户决策，但应同步提高 `interviewRisk` 或记录风险。
5. 可以给保守版和强化版，但二者都必须追溯到相同事实，不得新增不存在的经历。
6. 证据强度、Ownership 和 Metric 可信度分别判断，不用一个字段代替另一个字段。