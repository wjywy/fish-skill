#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function json(rel) {
  return JSON.parse(read(rel));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const checks = [];
function check(name, fn) {
  try {
    fn();
    checks.push({ name, ok: true });
    console.log(`✓ ${name}`);
  } catch (error) {
    checks.push({ name, ok: false, error: error.message });
    console.error(`✗ ${name}: ${error.message}`);
  }
}

const skill = read('skills/resume-copilot/SKILL.md');
const interviewWorkflow = read('skills/resume-copilot/workflows/interview-knowledge.md');
const strategy = read('skills/resume-copilot/workflows/resume-strategy.md');
const generation = read('skills/resume-copilot/workflows/resume-generation.md');
const evidence = read('skills/resume-copilot/policies/evidence-policy.md');
const expansion = read('skills/resume-copilot/policies/knowledge-expansion-policy.md');
const depth = read('skills/resume-copilot/policies/interview-depth-policy.md');
const presentation = read('skills/resume-copilot/policies/answer-presentation-policy.md');
const answerExamples = read('skills/resume-copilot/examples/interview-answer-examples.md');
const answerSchema = json('skills/resume-copilot/schemas/generated-answer.schema.json');
const nodeSchema = json('skills/resume-copilot/schemas/interview-knowledge-node.schema.json');
const strategySchema = json('skills/resume-copilot/schemas/resume-strategy.schema.json');
const renderSchema = json('skills/resume-copilot/schemas/render-options.schema.json');

check('SKILL is orchestration, not a second interview scheduler', () => {
  assert(skill.includes('架构与 Source of Truth'), 'missing architecture ownership section');
  assert(skill.includes('policies/knowledge-expansion-policy.md'), 'SKILL must route to expansion policy');
  assert(!skill.includes('while current Claim is active'), 'scheduler algorithm leaked back into SKILL.md');
});

check('interview workflow delegates scheduling to policy', () => {
  assert(interviewWorkflow.includes('Candidate Node Extraction & Scheduling'), 'missing scheduling handoff step');
  assert(interviewWorkflow.includes('调用 `knowledge-expansion-policy.md`'), 'workflow must delegate scheduling');
  assert(!interviewWorkflow.includes('## Interview Expansion Scheduler'), 'workflow reintroduced a competing scheduler section');
  assert(!interviewWorkflow.includes('while current Claim is active'), 'workflow duplicated policy loop algorithm');
});

check('knowledge expansion policy is the scheduler source of truth', () => {
  assert(expansion.includes('唯一 Source of Truth'), 'policy must declare scheduler ownership');
  assert(expansion.includes('## 六、Answer-first 执行算法与调度器'), 'canonical scheduler section missing');
  assert(expansion.includes('Retain all valuable siblings'), 'sibling retention invariant missing');
});

check('interview knowledge is deep-study by default', () => {
  assert(skill.includes('Deep Study per question'), 'SKILL missing deep-study invariant');
  assert(interviewWorkflow.includes('默认就是完整 Q&A'), 'workflow must default to complete Q&A');
  assert(depth.includes('每题默认 DEEP_STUDY'), 'depth policy missing deep-study contract');
  assert(!interviewWorkflow.includes('默认：只输出问题'), 'question-only default reintroduced');
  assert(!skill.includes('默认面试预设只展示问题'), 'question-only default reintroduced in SKILL');
});

check('answer depth policy owns depth but not presentation', () => {
  assert(depth.includes('Answer Completeness Gate'), 'answer completeness gate missing');
  assert(depth.includes('Explanation Backbone First'), 'explanation backbone missing');
  assert(depth.includes('Necessary-for-Conclusion Test'), 'deep-study upper-bound test missing');
  assert(depth.includes('Necessary vs Interesting 是瞬时决策'), 'draft-time necessary/interesting boundary missing');
  assert(depth.includes('Why Layer'), 'Why Layer missing');
  assert(depth.includes('Knowledge Abstraction'), 'knowledge abstraction missing');
  assert(depth.includes('No Terminology-as-Explanation'), 'terminology-as-explanation guard missing');
  assert(!depth.includes('# 二、Presentation Planning'), 'presentation planning leaked back into depth policy');
  assert(depth.includes('./answer-presentation-policy.md'), 'depth policy must delegate visible rendering');
});

check('answer presentation policy is the visible-structure source of truth', () => {
  assert(presentation.includes('唯一 Source of Truth'), 'presentation policy must declare ownership');
  assert(presentation.includes('Question Dimension != Explanation Shape'), 'question dimension and explanation shape must be separated');
  for (const shape of ['PROSE', 'CAUSAL_CHAIN', 'SEQUENCE', 'COMPARISON_MATRIX', 'TIMELINE', 'STATE_TRANSITION', 'COMPONENT_FLOW', 'EVIDENCE_CHAIN', 'DECISION_FRAME']) {
    assert(presentation.includes(`\`${shape}\``), `presentation shape missing ${shape}`);
  }
  assert(presentation.includes('Citation Locality'), 'citation locality rule missing');
  assert(presentation.includes('Backbone 可以显式展示，也可以只作为内部规划'), 'backbone must not become a forced visible template');
});

check('workflow does not duplicate explanation-shape mappings', () => {
  assert(interviewWorkflow.includes('../policies/answer-presentation-policy.md'), 'workflow must load presentation policy');
  assert(interviewWorkflow.includes('Question Dimension 描述“这一问想考察什么”'), 'workflow must name question-dimension responsibility');
  assert(interviewWorkflow.includes('Question Dimension 不等于 Markdown Template'), 'workflow must separate question dimension from rendering');
  assert(!interviewWorkflow.includes('DEFINITION       → 定义 + 边界 + 例子'), 'old presentation mapping duplicated in workflow');
  assert(!interviewWorkflow.includes('CONCURRENCY      → 时间线 + race + atomic point'), 'old concurrency mapping duplicated in workflow');
});

check('presentation and expansion branch from the same complete answer', () => {
  assert(interviewWorkflow.includes('Expansion 与 Presentation 消费同一个 complete Generated Answer'), 'workflow must explicitly decouple expansion and presentation');
  assert(interviewWorkflow.includes('不得从已经压缩 / 排版后的 Markdown 反推 Candidate Nodes'), 'node extraction must not depend on rendered markdown');
});

check('visible interview answers are not forced into a two-part template', () => {
  assert(skill.includes('Question Dimension 不等于 Markdown Template'), 'SKILL must reject question-dimension template coupling');
  assert(interviewWorkflow.includes('不固定出现“直接回答 / 展开说明”等模板标题'), 'workflow must reject fixed visible two-part template');
  assert(presentation.includes('不固定“两段式”'), 'presentation policy must reject fixed visible two-part template');
  assert(!answerExamples.includes('外层统一展示 `**直接回答**` 与 `**展开说明**`'), 'examples reintroduced fixed two-part presentation');
});

check('execution claims require current execution evidence', () => {
  assert(evidence.includes('Execution Evidence Rule'), 'execution evidence rule missing');
  assert(evidence.includes('不能单独'), 'execution evidence rule must distinguish static evidence');
  assert(depth.includes('EXECUTION'), 'answer depth policy must preserve execution boundary');
});

check('examples remain non-normative', () => {
  assert(answerExamples.includes('不新增硬规则'), 'answer examples must explicitly remain non-normative');
  assert(!answerExamples.includes('Answer Quality Contract（硬约束）'), 'hard policy leaked into examples');
});

check('generated answer storage is presentation-agnostic', () => {
  assert(!('candidateEvaluationComplete' in answerSchema.properties), 'candidateEvaluationComplete reintroduced');
  assert(answerSchema.required.includes('overview') && answerSchema.required.includes('principleDetail'), 'internal completeness slots missing');
  assert(answerSchema.properties.overview.description?.includes('不直接映射'), 'overview still coupled to visible presentation');
  assert(answerSchema.properties.principleDetail.description?.includes('Presentation'), 'principleDetail must delegate visible rendering');
});

check('interview node uses one decision-reason field', () => {
  assert(!('stopReason' in nodeSchema.properties), 'legacy stopReason reintroduced');
  assert('decisionReason' in nodeSchema.properties, 'decisionReason missing');
  for (const status of ['UNEXPANDED', 'EXPANDED', 'COVERED', 'MERGED', 'DROPPED']) {
    assert(nodeSchema.properties.status.enum.includes(status), `node status missing ${status}`);
  }
});

check('necessary vs interesting did not become a node-state taxonomy', () => {
  const serialized = JSON.stringify(nodeSchema);
  assert(!serialized.includes('NECESSARY'), 'draft-time NECESSARY leaked into node schema');
  assert(!serialized.includes('INTERESTING'), 'draft-time INTERESTING leaked into node schema');
});

check('evidence policy does not duplicate Metric policy', () => {
  assert(evidence.includes('./metric-policy.md'), 'evidence policy must delegate metric rules');
  assert(!evidence.includes('## Metric Policy'), 'duplicate Metric Policy section reintroduced');
});

check('resume strategy obeys no-standalone-summary rule', () => {
  assert(!strategy.includes('Summary: 2–3'), 'standalone Summary budget reintroduced');
  assert(strategy.includes('不生成独立个人简介 / Summary'), 'no-summary invariant missing from strategy');
});

check('resume strategy identifies canonical selection fields', () => {
  assert(strategy.includes('Generation 的权威输入'), 'workflow does not identify canonical selection');
  assert(strategySchema.properties.selectedClaimIds.description?.includes('权威'), 'schema must document selectedClaimIds as canonical');
  assert(strategySchema.properties.selectedExperienceIds.description?.includes('权威'), 'schema must document selectedExperienceIds as canonical');
});

check('resume generation delegates renderer mechanics', () => {
  assert(generation.includes('Renderer Handoff'), 'renderer handoff missing');
  assert(generation.includes('kami-default'), 'generation must use public default theme id');
  assert(!generation.includes('未指定时默认 `kami-base`'), 'template filename leaked back as public default theme');
  assert(!generation.includes('仓耳今楷'), 'font implementation leaked back into generation workflow');
});

check('renderer default theme is schema-owned and stable', () => {
  assert(renderSchema.properties.theme.default === 'kami-default', 'render-options default theme must be kami-default');
  assert(renderSchema.properties.theme.enum.includes('kami-default'), 'default theme not in theme enum');
});

const failed = checks.filter((c) => !c.ok);
console.log(`\nArchitecture contract: ${checks.length - failed.length}/${checks.length} passed`);
if (failed.length) process.exit(1);
