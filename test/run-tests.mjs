#!/usr/bin/env node
// Deterministic test runner for the resume-copilot skill.
//
// Usage:
//   node test/run-tests.mjs            # run all suites
//   node test/run-tests.mjs T4         # run a single suite by id
//   node test/run-tests.mjs --json     # also emit test/reports/results.json
//
// Everything here is offline and dependency-free. It exercises the parts of the
// skill that are mechanically checkable: file layout, JSON Schema conformance,
// cross-reference integrity, the Kami renderer, the CLI, and internal spec
// consistency. Behavioural (LLM-judged) cases live in test/behavioral/.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import os from 'node:os';

import { createValidator } from './lib/validator.mjs';
import { renderToHtml, loadRenderer } from './lib/dom-shim.mjs';
import {
  REPO_ROOT,
  TEST_ROOT,
  SKILL_ROOT,
  SCHEMA_DIR,
  TEMPLATE_DIR,
  RENDER_JS,
  BIN,
  readText,
  readJson,
  exists,
  listFiles,
  parseFrontmatter,
  extractRelativeFileRefs,
  Suite,
  assert,
  assertIncludes,
  assertExcludes,
} from './lib/util.mjs';

const validator = createValidator(SCHEMA_DIR);
const only = process.argv.slice(2).find((a) => /^T\d+$/.test(a));
const emitJson = process.argv.includes('--json');

const suites = [];
function suite(name) {
  console.log(`\n\x1b[1m${name}\x1b[0m`);
  const s = new Suite(name);
  suites.push(s);
  return s;
}

// ---------------------------------------------------------------------------
// T1 — Package & structure integrity
// ---------------------------------------------------------------------------
function T1() {
  const s = suite('T1 · Package & structure integrity');

  const WORKFLOWS = [
    'input-intake',
    'repository-inspection',
    'resume-bootstrap',
    'experience-mining',
    'resume-strategy',
    'resume-generation',
    'interview-knowledge',
    'mock-interview',
  ];
  const POLICIES = [
    'bootstrap-generation-policy',
    'evidence-policy',
    'repository-evidence-policy',
    'metric-policy',
    'resume-writing-policy',
    'knowledge-expansion-policy',
    'interview-depth-policy',
    'answer-assessment-policy',
  ];
  const SCHEMAS = [
    'raw-career-input',
    'fact',
    'experience',
    'claim',
    'metric',
    'career-profile',
    'resume-strategy',
    'resume-view',
    'render-options',
    'claim-graph',
    'interview-knowledge-node',
    'interview-question',
    'generated-answer',
    'mock-interview-answer',
    'interview-assessment',
  ];
  const EXAMPLES = [
    'career-profile.example.json',
    'claim-graph.example.json',
    'interview-expansion-examples.md',
    'repository-project-mode.example.md',
    'resume-bullet-patterns.md',
    'resume-strategy.example.json',
  ];
  const THEMES = [
    'kami-base.html',
    'kami-ivory.html',
    'kami-mono.html',
    'kami-navy.html',
    'kami-slate.html',
    'kami-teal.html',
    'kami-forest.html',
    'kami-burgundy.html',
    'kami-sepia.html',
    'kami-copper.html',
  ];

  s.check('T1.1', 'SKILL.md exists with YAML frontmatter', () => {
    const p = path.join(SKILL_ROOT, 'SKILL.md');
    assert(exists(p), 'SKILL.md missing');
    const { hasFrontmatter, data } = parseFrontmatter(readText(p));
    assert(hasFrontmatter, 'no frontmatter');
    assert(data.name === 'resume-copilot', `frontmatter name = ${data.name}`);
    assert(data.description && data.description.length > 10, 'description too short');
    return { detail: `name=${data.name}` };
  });

  s.check('T1.2', `all ${WORKFLOWS.length} workflow files exist`, () => {
    const missing = WORKFLOWS.filter((n) => !exists(path.join(SKILL_ROOT, 'workflows', `${n}.md`)));
    assert(missing.length === 0, `missing: ${missing.join(', ')}`);
  });

  s.check('T1.3', `all ${POLICIES.length} policy files exist`, () => {
    const missing = POLICIES.filter((n) => !exists(path.join(SKILL_ROOT, 'policies', `${n}.md`)));
    assert(missing.length === 0, `missing: ${missing.join(', ')}`);
  });

  s.check('T1.4', `all ${SCHEMAS.length} schema files exist and are valid JSON`, () => {
    for (const n of SCHEMAS) {
      const p = path.join(SCHEMA_DIR, `${n}.schema.json`);
      assert(exists(p), `missing ${n}.schema.json`);
      readJson(p); // throws on bad JSON
    }
  });

  s.check('T1.5', `all ${EXAMPLES.length} example files exist`, () => {
    const missing = EXAMPLES.filter((n) => !exists(path.join(SKILL_ROOT, 'examples', n)));
    assert(missing.length === 0, `missing: ${missing.join(', ')}`);
  });

  s.check('T1.6', `all ${THEMES.length} Kami template entry files exist`, () => {
    const missing = THEMES.filter((n) => !exists(path.join(TEMPLATE_DIR, n)));
    assert(missing.length === 0, `missing: ${missing.join(', ')}`);
  });

  s.check('T1.7', 'shared render assets exist', () => {
    for (const rel of ['shared/kami-render.js', 'shared/kami-family.css', 'shared/common.css', 'shared/sample-data.json', 'index.html']) {
      assert(exists(path.join(TEMPLATE_DIR, rel)), `missing templates/${rel}`);
    }
  });

  s.check('T1.8', 'every theme entry references shared css + render js', () => {
    const bad = [];
    for (const t of THEMES) {
      const text = readText(path.join(TEMPLATE_DIR, t));
      if (!text.includes('shared/kami-family.css')) bad.push(`${t}: no kami-family.css`);
      if (!text.includes('shared/kami-render.js')) bad.push(`${t}: no kami-render.js`);
      if (!text.includes('renderKamiResume')) bad.push(`${t}: does not call renderKamiResume`);
    }
    assert(bad.length === 0, bad.join('; '));
  });

  s.check('T1.9', 'bin entry exists and package.json points at it', () => {
    assert(exists(BIN), 'bin/fish-skill.mjs missing');
    const pkg = readJson(path.join(REPO_ROOT, 'package.json'));
    assert(pkg.bin && pkg.bin['fish-skill'] === './bin/fish-skill.mjs', 'package.json bin mismatch');
  });
}

// ---------------------------------------------------------------------------
// T2 — JSON Schema validation (positive + negative)
// ---------------------------------------------------------------------------
function T2() {
  const s = suite('T2 · JSON Schema validation');

  const positives = [
    ['examples/career-profile.example.json', 'career-profile.schema.json'],
    ['examples/resume-strategy.example.json', 'resume-strategy.schema.json'],
    ['examples/claim-graph.example.json', 'claim-graph.schema.json'],
    ['templates/shared/sample-data.json', 'resume-view.schema.json'],
    ['fixtures/valid/career-profile.min.json', 'career-profile.schema.json'],
  ];

  for (const [rel, schema] of positives) {
    const abs = path.join(rel.startsWith('fixtures') ? TEST_ROOT : SKILL_ROOT, rel);
    s.check(`T2.${rel}`, `${rel} validates against ${schema}`, () => {
      const errors = validator.validate(schema, readJson(abs));
      assert(errors.length === 0, errors.slice(0, 4).map((e) => `${e.path} ${e.message}`).join(' | '));
      return { detail: 'schema-valid' };
    });
  }

  const negatives = [
    ['fact-missing-statement.json', 'fact.schema.json', 'statement'],
    ['fact-bad-category-enum.json', 'fact.schema.json', 'category'],
    ['claim-empty-factids.json', 'claim.schema.json', 'factIds'],
    ['resume-view-bullet-missing-claimids.json', 'resume-view.schema.json', 'claimIds'],
    ['render-options-bad-theme.json', 'render-options.schema.json', 'theme'],
    ['interview-node-bad-status.json', 'interview-knowledge-node.schema.json', 'status'],
  ];

  for (const [file, schema, token] of negatives) {
    s.check(`T2.neg.${file}`, `validator rejects ${file}`, () => {
      const errors = validator.validate(schema, readJson(path.join(TEST_ROOT, 'fixtures', 'invalid', file)));
      assert(errors.length > 0, 'expected validation errors, got none');
      const joined = JSON.stringify(errors);
      assert(joined.includes(token), `errors did not mention "${token}": ${joined.slice(0, 200)}`);
      return { detail: `${errors.length} error(s), mentions "${token}"` };
    });
  }

  // The answer contract: every generated answer is two parts, and the
  // principle section is the detailed one.
  s.check('T2.10', 'every generated answer has a two-part body (overview + principleDetail)', () => {
    const g = readJson(path.join(SKILL_ROOT, 'examples', 'claim-graph.example.json'));
    assert(Array.isArray(g.generatedAnswers) && g.generatedAnswers.length > 0, 'no generated answers in example');
    for (const a of g.generatedAnswers) {
      assert(typeof a.overview === 'string' && a.overview.length > 0, `${a.id}: empty/missing overview`);
      assert(typeof a.principleDetail === 'string' && a.principleDetail.length > 0, `${a.id}: empty/missing principleDetail`);
      assert(!('canonicalAnswer' in a), `${a.id}: legacy canonicalAnswer field still present`);
      assert(
        a.principleDetail.length > a.overview.length,
        `${a.id}: principleDetail (${a.principleDetail.length}) should be longer than overview (${a.overview.length})`
      );
    }
    return { detail: `${g.generatedAnswers.length} answers: two-part, detail section is the longer one` };
  });
}

// ---------------------------------------------------------------------------
// T3 — Cross-reference integrity
// ---------------------------------------------------------------------------
function T3() {
  const s = suite('T3 · Cross-reference integrity');

  function checkProfileRefs(label, profile, { soft = false } = {}) {
    const problems = [];
    const factIds = new Set((profile.facts || []).map((f) => f.id));
    const claimIds = new Set((profile.claims || []).map((c) => c.id));
    const metricIds = new Set((profile.metrics || []).map((m) => m.id));
    const experienceIds = new Set((profile.experiences || []).map((e) => e.id));

    for (const c of profile.claims || []) {
      for (const f of c.factIds || []) if (!factIds.has(f)) problems.push(`claim ${c.id} → missing fact ${f}`);
      for (const m of c.metricIds || []) if (!metricIds.has(m)) problems.push(`claim ${c.id} → missing metric ${m}`);
      if (c.experienceId && !experienceIds.has(c.experienceId)) problems.push(`claim ${c.id} → missing experience ${c.experienceId}`);
    }
    for (const m of profile.metrics || []) {
      for (const f of m.factIds || []) if (!factIds.has(f)) problems.push(`metric ${m.id} → missing fact ${f}`);
      if (m.experienceId && !experienceIds.has(m.experienceId)) problems.push(`metric ${m.id} → missing experience ${m.experienceId}`);
    }
    for (const e of profile.experiences || []) {
      for (const c of e.claimIds || []) if (!claimIds.has(c)) problems.push(`experience ${e.id} → missing claim ${c}`);
      for (const m of e.metricIds || []) if (!metricIds.has(m)) problems.push(`experience ${e.id} → missing metric ${m}`);
    }
    for (const st of profile.resumeStrategies || []) {
      for (const e of st.selectedExperienceIds || []) if (!experienceIds.has(e)) problems.push(`strategy ${st.id} → missing experience ${e}`);
      for (const c of st.selectedClaimIds || []) if (!claimIds.has(c)) problems.push(`strategy ${st.id} → missing claim ${c}`);
      for (const cov of st.requirementCoverage || []) {
        for (const c of cov.claimIds || []) if (!claimIds.has(c)) problems.push(`strategy ${st.id} coverage → missing claim ${c}`);
      }
    }
    for (const v of profile.resumeViews || []) {
      const walkBullets = (bullets, where) => {
        for (const b of bullets || []) {
          for (const c of b.claimIds || []) if (!claimIds.has(c)) problems.push(`view ${v.id} ${where} bullet ${b.id} → missing claim ${c}`);
          for (const m of b.metricIds || []) if (!metricIds.has(m)) problems.push(`view ${v.id} ${where} bullet ${b.id} → missing metric ${m}`);
        }
      };
      for (const sec of v.sections || []) {
        for (const en of sec.entries || []) {
          walkBullets(en.summaryBullets, `${sec.type}/summary`);
          walkBullets(en.bullets, sec.type);
          for (const sub of en.subBlocks || []) walkBullets(sub.bullets, `${sec.type}/${sub.title}`);
        }
      }
    }
    for (const f of profile.facts || []) {
      if (f.experienceId && !experienceIds.has(f.experienceId)) problems.push(`fact ${f.id} → missing experience ${f.experienceId}`);
    }
    return problems;
  }

  s.check('T3.1', 'fixtures/valid/career-profile.min.json is fully self-consistent', () => {
    const problems = checkProfileRefs('min', readJson(path.join(TEST_ROOT, 'fixtures', 'valid', 'career-profile.min.json')));
    assert(problems.length === 0, problems.slice(0, 6).join('; '));
    return { detail: 'all claim/fact/metric/experience/view refs resolve' };
  });

  s.check('T3.2', 'examples/career-profile.example.json refs resolve', () => {
    const problems = checkProfileRefs('ex', readJson(path.join(SKILL_ROOT, 'examples', 'career-profile.example.json')));
    assert(problems.length === 0, problems.slice(0, 6).join('; '));
    return { detail: 'consistent' };
  });

  s.check('T3.3', 'examples/claim-graph.example.json node/question/answer refs resolve', () => {
    const g = readJson(path.join(SKILL_ROOT, 'examples', 'claim-graph.example.json'));
    const problems = [];
    const nodeIds = new Set((g.nodes || []).map((n) => n.id));
    const qIds = new Set((g.questions || []).map((q) => q.id));
    const aIds = new Set((g.generatedAnswers || []).map((a) => a.id));
    for (const n of g.nodes || []) {
      if (n.parentNodeId && !nodeIds.has(n.parentNodeId)) problems.push(`node ${n.id} → missing parent ${n.parentNodeId}`);
      if (n.claimId && n.claimId !== g.claimId) problems.push(`node ${n.id} → claimId ${n.claimId} != graph ${g.claimId}`);
      if (n.sourceAnswerId && !aIds.has(n.sourceAnswerId)) problems.push(`node ${n.id} → missing sourceAnswer ${n.sourceAnswerId}`);
    }
    for (const id of g.rootNodeIds || []) if (!nodeIds.has(id)) problems.push(`rootNodeIds → missing node ${id}`);
    for (const q of g.questions || []) {
      if (q.nodeId && !nodeIds.has(q.nodeId)) problems.push(`question ${q.id} → missing node ${q.nodeId}`);
      if (q.parentQuestionId && !qIds.has(q.parentQuestionId)) problems.push(`question ${q.id} → missing parent ${q.parentQuestionId}`);
      if (q.generatedAnswerId && !aIds.has(q.generatedAnswerId)) problems.push(`question ${q.id} → missing answer ${q.generatedAnswerId}`);
    }
    for (const a of g.generatedAnswers || []) {
      if (a.questionId && !qIds.has(a.questionId)) problems.push(`answer ${a.id} → missing question ${a.questionId}`);
      for (const nid of a.extractedNodeIds || []) if (!nodeIds.has(nid)) problems.push(`answer ${a.id} → missing extracted node ${nid}`);
    }
    assert(problems.length === 0, problems.slice(0, 8).join('; '));
    return { detail: 'graph refs consistent' };
  });

  s.check('T3.4', 'resume-view bullets always carry ≥1 claimId (schema-level guarantee)', () => {
    const v = readJson(path.join(SKILL_ROOT, 'templates', 'shared', 'sample-data.json'));
    const errors = validator.validate('resume-view.schema.json', v);
    assert(errors.length === 0, 'sample resume view invalid');
    let count = 0;
    for (const sec of v.sections || []) {
      for (const en of sec.entries || []) {
        for (const b of [...(en.summaryBullets || []), ...(en.bullets || [])]) {
          assert(Array.isArray(b.claimIds) && b.claimIds.length >= 1, `bullet ${b.id} has no claimIds`);
          count += 1;
        }
        for (const sub of en.subBlocks || []) {
          for (const b of sub.bullets || []) {
            assert(Array.isArray(b.claimIds) && b.claimIds.length >= 1, `bullet ${b.id} has no claimIds`);
            count += 1;
          }
        }
      }
    }
    return { detail: `${count} bullets all traceable` };
  });
}

// ---------------------------------------------------------------------------
// T4 — Kami renderer contract
// ---------------------------------------------------------------------------
function T4() {
  const s = suite('T4 · Kami renderer contract');

  const sample = readJson(path.join(TEMPLATE_DIR, 'shared', 'sample-data.json'));

  s.check('T4.1', 'renders header name, target role, education', () => {
    const html = renderToHtml(RENDER_JS, sample);
    assertIncludes(html, sample.header.name, 'name missing');
    assertIncludes(html, sample.header.targetRole, 'role missing');
    assertIncludes(html, 'education-inline', 'education class missing');
  });

  s.check('T4.2', 'contacts: href → <a>, no href → <span>', () => {
    const html = renderToHtml(RENDER_JS, sample);
    assertIncludes(html, `<a href="${sample.header.contacts[0].href}">`, 'href contact not a link');
    const noHref = {
      ...sample,
      header: { ...sample.header, contacts: [{ label: '电话', value: '13800000000' }] },
    };
    const html2 = renderToHtml(RENDER_JS, noHref);
    assertIncludes(html2, '<span>13800000000</span>', 'plain contact should be a span');
  });

  s.check('T4.3', 'renders summary, skills, sections, subBlocks, tags', () => {
    const html = renderToHtml(RENDER_JS, sample);
    assertIncludes(html, 'resume-summary', 'summary missing');
    assertIncludes(html, 'skill-grid', 'skills missing');
    assertIncludes(html, sample.skills[0].label, 'skill label missing');
    assertIncludes(html, 'resume-section', 'section missing');
    assertIncludes(html, 'sub-block', 'sub-block missing');
    assertIncludes(html, 'entry-tags', 'tags missing');
  });

  s.check('T4.4', 'renders section-<type> class per section type', () => {
    const html = renderToHtml(RENDER_JS, sample);
    assertIncludes(html, 'section-work', 'work section class missing');
    assertIncludes(html, 'section-project', 'project section class missing');
  });

  s.check('T4.5', 'escapes HTML special chars (XSS safety)', () => {
    const evil = {
      ...sample,
      header: { ...sample.header, name: '<script>alert(1)</script>', targetRole: 'a"b&c' },
    };
    const html = renderToHtml(RENDER_JS, evil);
    assertExcludes(html, '<script>alert(1)</script>', 'raw script tag leaked');
    assertIncludes(html, '&lt;script&gt;', 'name not escaped');
    assertIncludes(html, '&quot;', 'quote not escaped');
    assertIncludes(html, '&amp;', 'ampersand not escaped');
  });

  s.check('T4.6', 'handles missing header with a safe placeholder', () => {
    const html = renderToHtml(RENDER_JS, { sections: [] });
    assertIncludes(html, 'Missing Resume View data', 'no placeholder for missing data');
  });

  s.check('T4.7', 'works without renderOptions (theme is html-level, not js-level)', () => {
    const { renderOptions, ...noOpts } = sample;
    const html = renderToHtml(RENDER_JS, noOpts);
    assertIncludes(html, sample.header.name, 'render failed without renderOptions');
  });

  s.check('T4.8', 'defaults to document.body when no target given', () => {
    const { render, document } = loadRenderer(RENDER_JS);
    render({ data: sample });
    assertIncludes(document.body.innerHTML, sample.header.name, 'body default target not used');
  });

  s.check('T4.9', 'renders plain-string bullets as well as {text} objects', () => {
    const mixed = {
      ...sample,
      sections: [
        {
          type: 'project',
          title: '项目经历',
          entries: [{ title: 'X', bullets: ['纯字符串 bullet'] }],
        },
      ],
    };
    const html = renderToHtml(RENDER_JS, mixed);
    assertIncludes(html, '纯字符串 bullet', 'string bullet not rendered');
  });
}

// ---------------------------------------------------------------------------
// T5 — CLI (bin/fish-skill.mjs)
// ---------------------------------------------------------------------------
function T5() {
  const s = suite('T5 · CLI (fish-skill)');

  function run(args, opts = {}) {
    try {
      const stdout = execFileSync('node', [BIN, ...args], { encoding: 'utf8', ...opts });
      return { code: 0, stdout, stderr: '' };
    } catch (err) {
      return { code: err.status ?? 1, stdout: err.stdout?.toString() || '', stderr: err.stderr?.toString() || '' };
    }
  }

  s.check('T5.1', '`list` prints resume-copilot and exits 0', () => {
    const r = run(['list']);
    assert(r.code === 0, `exit ${r.code}`);
    assertIncludes(r.stdout, 'resume-copilot', 'skill not listed');
  });

  s.check('T5.2', '`check` validates frontmatter and exits 0', () => {
    const r = run(['check']);
    assert(r.code === 0, `exit ${r.code}: ${r.stderr}`);
    assertIncludes(r.stdout, 'OK', 'no OK line');
  });

  s.check('T5.3', 'no args prints usage and exits 0', () => {
    const r = run([]);
    assert(r.code === 0, `exit ${r.code}`);
    assertIncludes(r.stdout, 'fish-skill', 'usage missing');
  });

  s.check('T5.4', '`install` copies the full skill to --target', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fish-skill-'));
    const r = run(['install', 'resume-copilot', '--target', tmp]);
    assert(r.code === 0, `exit ${r.code}: ${r.stderr}`);
    const dest = path.join(tmp, 'resume-copilot');
    assert(exists(path.join(dest, 'SKILL.md')), 'SKILL.md not copied');
    for (const d of ['workflows', 'policies', 'schemas', 'examples', 'templates', 'renderers']) {
      assert(exists(path.join(dest, d)), `subdir ${d} not copied`);
    }
    const srcCount = listFiles(SKILL_ROOT).length;
    const dstCount = listFiles(dest).length;
    assert(srcCount === dstCount, `file count mismatch src=${srcCount} dst=${dstCount}`);
    return { detail: `${dstCount} files copied` };
  });

  s.check('T5.5', '`install` refuses to overwrite without --force', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fish-skill-'));
    run(['install', 'resume-copilot', '--target', tmp]);
    const r = run(['install', 'resume-copilot', '--target', tmp]);
    assert(r.code === 1, `expected exit 1, got ${r.code}`);
    assertIncludes(r.stderr, 'already exists', 'no overwrite warning');
  });

  s.check('T5.6', '`install --force` overwrites successfully', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fish-skill-'));
    run(['install', 'resume-copilot', '--target', tmp]);
    const r = run(['install', 'resume-copilot', '--target', tmp, '--force']);
    assert(r.code === 0, `exit ${r.code}: ${r.stderr}`);
  });

  s.check('T5.7', '`install unknown-skill` fails with exit 1', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fish-skill-'));
    const r = run(['install', 'does-not-exist', '--target', tmp]);
    assert(r.code === 1, `expected exit 1, got ${r.code}`);
    assertIncludes(r.stderr, 'Unknown skill', 'no unknown-skill message');
  });

  s.check('T5.8', 'unknown command exits 1 with usage', () => {
    const r = run(['frobnicate']);
    assert(r.code === 1, `expected exit 1, got ${r.code}`);
    assertIncludes(r.stderr, 'Unknown command', 'no unknown-command message');
  });
}

// ---------------------------------------------------------------------------
// T6 — Internal spec consistency (static analysis)
// ---------------------------------------------------------------------------
function T6() {
  const s = suite('T6 · Internal spec consistency');

  // T6.1 — relative file references inside every skill markdown resolve.
  // Globs (`kami-*.html`), workspace-memory files (`MEMORY.md`, `.workbuddy-ai/`)
  // and agent-internal paths are not skill assets, so they are excluded.
  s.check('T6.1', 'all relative file refs in skill markdown resolve to real files', () => {
    const mdFiles = listFiles(SKILL_ROOT, (f) => f.endsWith('.md'));
    const allSkillFiles = listFiles(SKILL_ROOT);
    const byBasename = new Map();
    for (const f of allSkillFiles) {
      const b = path.basename(f);
      if (!byBasename.has(b)) byBasename.set(b, []);
      byBasename.get(b).push(f);
    }
    const skip = (ref) =>
      ref.includes('*') ||
      ref.includes('.workbuddy-ai') ||
      path.basename(ref) === 'MEMORY.md';

    const broken = [];
    for (const file of mdFiles) {
      const dir = path.dirname(file);
      for (const ref of extractRelativeFileRefs(readText(file))) {
        if (skip(ref)) continue;
        if (exists(path.resolve(dir, ref))) continue;
        if (exists(path.resolve(SKILL_ROOT, ref))) continue;
        // Bare filename → accept a unique match anywhere in the skill tree.
        const hits = byBasename.get(path.basename(ref));
        if (hits && hits.length === 1) continue;
        broken.push(`${path.relative(SKILL_ROOT, file)} → ${ref}`);
      }
    }
    assert(broken.length === 0, broken.join('; '));
    return { detail: `${mdFiles.length} markdown files scanned` };
  });

  // T6.2 — workflow "Required References" point at existing files.
  s.check('T6.2', 'every workflow Required References entry resolves', () => {
    const wfDir = path.join(SKILL_ROOT, 'workflows');
    const broken = [];
    for (const file of listFiles(wfDir, (f) => f.endsWith('.md'))) {
      const text = readText(file);
      const section = /##\s*Required References([\s\S]*?)(?=\n##\s|$)/.exec(text);
      if (!section) continue;
      for (const ref of extractRelativeFileRefs(section[1])) {
        if (!exists(path.resolve(wfDir, ref))) broken.push(`${path.basename(file)} → ${ref}`);
      }
    }
    assert(broken.length === 0, broken.join('; '));
  });

  // T6.3 — render-options theme enum matches the template files on disk.
  s.check('T6.3', 'render-options theme enum matches Kami template files', () => {
    const opts = readJson(path.join(SCHEMA_DIR, 'render-options.schema.json'));
    const declared = new Set(opts.properties.theme.enum);
    const files = fs.readdirSync(TEMPLATE_DIR).filter((f) => f.startsWith('kami-') && f.endsWith('.html'));
    const onDisk = new Set(files.map((f) => (f === 'kami-base.html' ? 'kami-default' : f.replace('.html', ''))));
    const missingOnDisk = [...declared].filter((t) => !onDisk.has(t));
    const undeclared = [...onDisk].filter((t) => !declared.has(t));
    assert(missingOnDisk.length === 0, `declared but no file: ${missingOnDisk.join(', ')}`);
    assert(undeclared.length === 0, `file but not declared: ${undeclared.join(', ')}`);
    return { detail: `${declared.size} themes aligned` };
  });

  // T6.4 — ownership vocabulary consistent across schemas.
  s.check('T6.4', 'ownership enum consistent across fact/claim/experience schemas', () => {
    const core = ['OWNER', 'DIRECT', 'COLLABORATIVE', 'OBSERVED', 'NONE'];
    const fact = readJson(path.join(SCHEMA_DIR, 'fact.schema.json')).properties.ownership.enum;
    const claim = readJson(path.join(SCHEMA_DIR, 'claim.schema.json')).properties.ownership.enum;
    const exp = readJson(path.join(SCHEMA_DIR, 'experience.schema.json')).properties.ownership.enum;
    for (const v of core) {
      assert(fact.includes(v), `fact missing ${v}`);
      assert(claim.includes(v), `claim missing ${v}`);
      assert(exp.includes(v), `experience missing ${v}`);
    }
    // claim.schema must NOT allow UNVERIFIED (that's a fact-only, pre-verification state).
    assert(!claim.includes('UNVERIFIED'), 'claim.schema should not allow UNVERIFIED ownership');
    assert(fact.includes('UNVERIFIED'), 'fact.schema should allow UNVERIFIED for repository facts');
    return { detail: 'core 5 aligned; UNVERIFIED restricted to facts' };
  });

  // T6.5 — knowledge node status vocabulary consistent.
  s.check('T6.5', 'interview node status enum covers policy vocabulary', () => {
    const node = readJson(path.join(SCHEMA_DIR, 'interview-knowledge-node.schema.json'));
    const status = node.properties.status.enum;
    for (const v of ['UNEXPANDED', 'EXPANDED', 'COVERED', 'MERGED', 'DROPPED']) {
      assert(status.includes(v), `status enum missing ${v}`);
    }
    const policy = readText(path.join(SKILL_ROOT, 'policies', 'knowledge-expansion-policy.md'));
    assertIncludes(policy, 'COVERED', 'policy does not mention COVERED');
  });

  // T6.6 — SKILL.md routing table targets exist.
  s.check('T6.6', 'SKILL.md 能力与路由 entries resolve', () => {
    const text = readText(path.join(SKILL_ROOT, 'SKILL.md'));
    const refs = extractRelativeFileRefs(text).filter((r) => r.startsWith('workflows/') || r.startsWith('policies/') || r.startsWith('schemas/') || r.startsWith('examples/') || r.startsWith('renderers/'));
    const broken = refs.filter((r) => !exists(path.join(SKILL_ROOT, r)));
    assert(broken.length === 0, broken.join(', '));
    return { detail: `${refs.length} routing refs resolved` };
  });

  // T6.7 — default theme resolution documented consistently.
  s.check('T6.7', 'default theme (kami-default → kami-base.html) documented consistently', () => {
    const rendererReadme = readText(path.join(SKILL_ROOT, 'renderers', 'kami', 'README.md'));
    assertIncludes(rendererReadme, 'kami-default', 'renderer readme missing kami-default');
    assertIncludes(rendererReadme, 'kami-base.html', 'renderer readme missing base mapping');
    const opts = readJson(path.join(SCHEMA_DIR, 'render-options.schema.json'));
    assert(opts.properties.theme.default === 'kami-default', 'schema default theme mismatch');
  });

  // T6.8 — hardMaxDepth guidance consistent (schema default vs policy).
  s.check('T6.8', 'hardMaxDepth default is 20 in schema and echoed in policy', () => {
    const graph = readJson(path.join(SCHEMA_DIR, 'claim-graph.schema.json'));
    assert(graph.properties.hardMaxDepth.default === 20, 'claim-graph hardMaxDepth default != 20');
    const node = readJson(path.join(SCHEMA_DIR, 'interview-knowledge-node.schema.json'));
    assert(node.properties.depth.maximum === 20, 'node depth maximum != 20');
  });

  // T6.9 — every schema referenced from SKILL.md exists.
  s.check('T6.9', 'all 15 schemas are referenced from SKILL.md', () => {
    const text = readText(path.join(SKILL_ROOT, 'SKILL.md'));
    const declared = fs.readdirSync(SCHEMA_DIR).filter((f) => f.endsWith('.schema.json'));
    const unreferenced = declared.filter((f) => !text.includes(f));
    assert(unreferenced.length === 0, `not referenced in SKILL.md: ${unreferenced.join(', ')}`);
    return { detail: `${declared.length} schemas referenced` };
  });

  // T6.10 — the two-part answer contract is consistent across schema + docs.
  s.check('T6.10', 'two-part answer contract consistent across schema and all docs', () => {
    const schema = readJson(path.join(SCHEMA_DIR, 'generated-answer.schema.json'));
    assert(schema.required.includes('overview'), 'generated-answer: overview not required');
    assert(schema.required.includes('principleDetail'), 'generated-answer: principleDetail not required');
    assert(!('canonicalAnswer' in schema.properties), 'generated-answer: legacy canonicalAnswer still declared');
    const docs = [
      ['SKILL.md', path.join(SKILL_ROOT, 'SKILL.md')],
      ['workflows/interview-knowledge.md', path.join(SKILL_ROOT, 'workflows', 'interview-knowledge.md')],
      ['skills/resume-copilot/README.md', path.join(SKILL_ROOT, 'README.md')],
      ['README.zh.md', path.join(REPO_ROOT, 'README.zh.md')],
    ];
    for (const [label, p] of docs) {
      assertIncludes(readText(p), '原理详解', `${label} does not document the 原理详解 section`);
    }
    return { detail: `${docs.length} docs document overview + 原理详解` };
  });
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
const ALL = { T1, T2, T3, T4, T5, T6 };
console.log('\x1b[1m\x1b[36mresume-copilot · deterministic test suite\x1b[0m');
console.log(`skill: ${path.relative(REPO_ROOT, SKILL_ROOT)}`);

for (const [id, fn] of Object.entries(ALL)) {
  if (only && only !== id) continue;
  fn();
}

console.log('\n\x1b[1m── Summary ──\x1b[0m');
let total = 0;
let passed = 0;
let warned = 0;
let failed = 0;
for (const s of suites) {
  const { total: t, passed: p, warned: w, failed: f } = s.summary;
  total += t;
  passed += p;
  warned += w;
  failed += f;
  const flag = f > 0 ? '\x1b[31mFAIL\x1b[0m' : w > 0 ? '\x1b[33mWARN\x1b[0m' : '\x1b[32mPASS\x1b[0m';
  console.log(`${flag}  ${s.name}  (${p}/${t} passed${w ? `, ${w} warn` : ''}${f ? `, ${f} failed` : ''})`);
}
console.log(`\n${passed}/${total} checks passed${warned ? `, ${warned} warning(s)` : ''}${failed ? `, \x1b[31m${failed} failure(s)\x1b[0m` : ''}`);

if (emitJson) {
  const out = path.join(TEST_ROOT, 'reports', 'results.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(
    out,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        node: process.version,
        totals: { total, passed, warned, failed },
        suites: suites.map((s) => ({ name: s.name, summary: s.summary, results: s.results })),
      },
      null,
      2
    ) + '\n'
  );
  console.log(`\nJSON report → ${path.relative(REPO_ROOT, out)}`);
}

process.exit(failed > 0 ? 1 : 0);
