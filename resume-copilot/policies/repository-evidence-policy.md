# Repository Evidence Policy

## 目的

定义 Coding Agent 从当前代码仓库提取简历事实时的证据边界。

## 统一 Fact 模型

仓库事实和人物事实都使用 `Fact`，通过 `subject` 与 `sourceType` 区分。

### 项目事实

```text
subject = PROJECT
sourceType = REPOSITORY
ownership = UNVERIFIED
```

例如：

> 项目实现了 Outbox Worker。

### 人物事实

用户确认 Ownership 后，可以形成：

```text
subject = USER
ownership = OWNER / DIRECT / COLLABORATIVE / OBSERVED / NONE
```

例如：

> 用户直接实现了 Outbox Worker。

### Resume Claim

只有人物事实经过 Evidence / Ownership 验证后，才能形成简历 Claim：

> 设计并实现事务 Outbox 与异步 Worker 链路，解耦业务事务与事件投递。

禁止：

```text
PROJECT Fact -X-> Resume Claim
```

必须先完成 Ownership Verification。

## 证据强度

### High
- 核心实现代码直接存在
- 多处调用 / 测试 / 配置共同证明能力真实使用
- 架构文档与实现一致

### Medium
- README / 设计文档说明能力，但实现证据不完整
- 依赖 + 少量调用能证明大概率使用

### Low
- 只有依赖声明
- 注释 / TODO / 示例代码
- 已废弃、未接入、无法判断是否生产使用的代码

Low evidence 默认不得生成强 Resume Claim。

## 指标规则

Repository 可以证明的指标仅限仓库中有明确证据的内容，例如 benchmark 输出、测试规模、静态配置上限等。

以下内容通常必须由用户确认：
- 线上耗时提升
- 人力节省
- DAU / GMV / 转化率
- 生产故障下降
- 业务覆盖范围

## Git 规则

若环境可访问 Git history，可以用于定位变更范围与候选 Ownership 线索，但：
- commit author 不是最终 Ownership 证明；
- 团队 squash / pair programming / 代提交可能造成偏差；
- 不根据 Git 作者信息推断用户身份。

最终人物 Ownership 仍以用户确认或明确上下文为准。
