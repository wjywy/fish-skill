#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SKILL = path.join(ROOT, 'skills', 'resume-copilot');

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

check('answer depth policy owns answer completeness', () => {
  assert(depth.includes('Answer Completeness Gate'), 'answer completeness gate missing');
  assert(depth.includes('Why Layer'), 'Why Layer missing');
  assert(depth.includes('Knowledge Abstraction'), 'knowledge abstraction missing');
  assert(depth.includes('No Terminology-as-Explanation'), 'terminology-as-explanation guard missing');
});

check('examples remain non-normative', () => {
  assert(answerExamples.includes('不新增硬规则'), 'answer examples must explicitly remain non-normative');
  assert(!answerExamples.includes('Answer Quality Contract（硬约束）'), 'hard policy leaked into examples');
});

check('generated answer has no redundant evaluation-complete flag', () => {
  assert(!('candidateEvaluationComplete' in answerSchema.properties), 'candidateEvaluationComplete reintroduced');
  assert(!answerSchema.required.includes('candidateEvaluationComplete'), 'redundant evaluation flag required again');
  assert(answerSchema.required.includes('overview') && answerSchema.required.includes('principleDetail'), 'two-part internal answer contract missing');
});

check('interview node uses one decision-reason field', () => {
  assert(!('stopReason' in nodeSchema.properties), 'legacy stopReason reintroduced');
  assert('decisionReason' in nodeSchema.properties, 'decisionReason missing');
  for (const status of ['UNEXPANDED', 'EXPANDED', 'COVERED', 'MERGED', 'DROPPED']) {
    assert(nodeSchema.properties.status.enum.includes(status), `node status missing ${status}`);
  }
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
