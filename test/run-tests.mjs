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
import { lintResumeView, collectBullets } from './lib/resume-lint.mjs';
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
    for (const rel of [
      'shared/kami-render.js',
      'shared/kami-family.css',
      'shared/kami-layout.css',
      'shared/common.css',
      'shared/sample-data.json',
      'shared/sample-data.js',
      'shared/preview-avatar.js',
      'index.html',
    ]) {
      assert(exists(path.join(TEMPLATE_DIR, rel)), `missing templates/${rel}`);
    }
  });

  s.check('T1.8', 'every theme entry wires css + layout delta + preview data + render js', () => {
    const bad = [];
    for (const t of THEMES) {
      const text = readText(path.join(TEMPLATE_DIR, t));
      if (!text.includes('shared/kami-family.css')) bad.push(`${t}: no kami-family.css`);
      if (!text.includes('shared/kami-layout.css')) bad.push(`${t}: no kami-layout.css`);
      if (!text.includes('shared/kami-render.js')) bad.push(`${t}: no kami-render.js`);
      if (!text.includes('shared/sample-data.js')) bad.push(`${t}: no sample-data.js (page would render blank)`);
      if (!text.includes('renderKamiResume')) bad.push(`${t}: does not call renderKamiResume`);
      // Theme = colour only, avatar = header layout only, so both header variants
      // work in every theme. The preview toggle is what makes that visible.
      if (!text.includes('shared/preview-avatar.js')) {
        bad.push(`${t}: no preview-avatar.js — cannot compare both header variants`);
      }
      // The layout delta only wins if it loads *after* the upstream stylesheet.
      const familyAt = text.indexOf('shared/kami-family.css');
      const layoutAt = text.indexOf('shared/kami-layout.css');
      if (familyAt > layoutAt) bad.push(`${t}: kami-layout.css must load after kami-family.css`);
    }
    assert(bad.length === 0, bad.join('; '));
    return { detail: `${THEMES.length} themes wired (css + data + renderer + avatar toggle)` };
  });

  // The 9 themes are a colour-only extension layer on top of the upstream Kami
  // stylesheet, so each must override the *upstream* token names — and must use
  // real CSS. A comma-separated `:root` block silently collapses into a single
  // custom-property declaration, leaving every other token undefined.
  s.check('T1.9', 'each of the 9 themes overrides all 10 upstream tokens with valid CSS', () => {
    const UPSTREAM_TOKENS = [
      '--parchment',
      '--ivory',
      '--border',
      '--border-soft',
      '--near-black',
      '--dark-warm',
      '--olive',
      '--stone',
      '--brand',
      '--brand-tint',
    ];
    const themes = THEMES.filter((t) => t !== 'kami-base.html');
    const problems = [];
    for (const t of themes) {
      const text = readText(path.join(TEMPLATE_DIR, t));
      const m = /:root\s*\{([\s\S]*?)\}/.exec(text);
      if (!m) {
        problems.push(`${t}: no :root block`);
        continue;
      }
      const body = m[1];
      if (!body.includes(';')) problems.push(`${t}: :root uses commas, not semicolons — declarations collapse`);
      for (const tok of UPSTREAM_TOKENS) {
        if (!new RegExp(`${tok}\\s*:`).test(body)) problems.push(`${t}: missing ${tok}`);
      }
    }
    assert(problems.length === 0, problems.join('; '));
    return { detail: `${themes.length} themes × ${UPSTREAM_TOKENS.length} tokens` };
  });

  // sample-data.js exists only so a theme page previews without a server. If it
  // drifts from sample-data.json, the preview and the schema fixture disagree.
  s.check('T1.10', 'shared/sample-data.js stays in sync with sample-data.json', () => {
    const json = readJson(path.join(TEMPLATE_DIR, 'shared', 'sample-data.json'));
    const js = readText(path.join(TEMPLATE_DIR, 'shared', 'sample-data.js'));
    const m = /window\.KAMI_RESUME_DATA\s*=\s*([\s\S]*?);\s*$/.exec(js.trim());
    assert(m, 'sample-data.js does not assign window.KAMI_RESUME_DATA');
    const parsed = JSON.parse(m[1]);
    assert(
      JSON.stringify(parsed) === JSON.stringify(json),
      'sample-data.js and sample-data.json have drifted apart'
    );
    return { detail: 'preview data matches the schema fixture' };
  });

  s.check('T1.11', 'bin entry exists and package.json points at it', () => {
    assert(exists(BIN), 'bin/fish-skill.mjs missing');
    const pkg = readJson(path.join(REPO_ROOT, 'package.json'));
    assert(pkg.bin && pkg.bin['fish-skill'] === './bin/fish-skill.mjs', 'package.json bin mismatch');
  });

  // The avatar toggle is a *preview* affordance. It has to be wired on every
  // theme page (that is what proves all 10 themes handle both header variants)
  // and it must stay out of a generated resume, so it may only mount when the
  // page is still showing the shipped sample.
  s.check('T1.12', 'avatar preview toggle is wired on every theme and stays preview-only', () => {
    const rel = path.join(TEMPLATE_DIR, 'shared', 'preview-avatar.js');
    assert(exists(rel), 'missing templates/shared/preview-avatar.js');
    const code = readText(rel);

    const unwired = [...THEMES, 'avatar-demo.html'].filter(
      (t) => !readText(path.join(TEMPLATE_DIR, t)).includes('shared/preview-avatar.js')
    );
    assert(unwired.length === 0, `avatar toggle not wired on: ${unwired.join(', ')}`);

    // Evaluate the IIFE with a bare `window` (no document) to reach its API.
    const fakeWindow = {};
    // eslint-disable-next-line no-new-func
    new Function('window', 'document', code)(fakeWindow, undefined);
    const api = fakeWindow.KAMI_PREVIEW_AVATAR;
    assert(api, 'preview-avatar.js did not expose KAMI_PREVIEW_AVATAR');

    assert(api.isPreview({ id: 'resume-view-sample' }) === true, 'the shipped sample should get the toggle');
    assert(api.isPreview({ id: 'resume-view-zhangzhixing' }) === false, 'a generated view must NOT get the toggle');
    assert(api.isPreview(null) === false, 'missing data must not get the toggle');

    assert(api.nextAvatar(null) === 'shared/avatar-sample.jpg', 'toggle should turn the avatar on');
    assert(api.nextAvatar('shared/avatar-sample.jpg') === null, 'toggle should turn the avatar off');

    // A fixed-position control would otherwise print onto the A4 sheet.
    assert(/@media\s*print/.test(code), 'the toggle must be hidden when printing');
    return { detail: `${THEMES.length + 1} preview pages wired; toggle is sample-only and print-hidden` };
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
    ['fixtures/valid/resume-view.agent.json', 'resume-view.schema.json'],
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

  // Golden output of the B9 scenario: it must honour its Strategy selection.
  s.check('T3.5', 'golden agent resume view only uses Strategy-selected claims and confirmed metrics', () => {
    const view = readJson(path.join(TEST_ROOT, 'fixtures', 'valid', 'resume-view.agent.json'));
    const SELECTED = new Set(['claim-selected-1', 'claim-selected-2']);
    const CONFIRMED_METRICS = new Set(['metric-confirmed']);
    const bullets = collectBullets(view);
    assert(bullets.length > 0, 'no bullets in golden agent view');
    const problems = [];
    for (const b of bullets) {
      for (const c of b.claimIds) if (!SELECTED.has(c)) problems.push(`bullet ${b.id} → unselected claim ${c}`);
      for (const m of b.metricIds) if (!CONFIRMED_METRICS.has(m)) problems.push(`bullet ${b.id} → non-confirmed metric ${m}`);
    }
    assert(problems.length === 0, problems.join('; '));
    return { detail: `${bullets.length} bullets respect Strategy selection` };
  });
}

// ---------------------------------------------------------------------------
// T4 — Kami renderer contract
// ---------------------------------------------------------------------------
function T4() {
  const s = suite('T4 · Kami renderer contract');

  const sample = readJson(path.join(TEMPLATE_DIR, 'shared', 'sample-data.json'));

  // The renderer's job is to map the skill's own content slots onto the upstream
  // Kami DOM, so the verbatim kami-family.css covers every element it emits.
  // Anything outside this whitelist would render unstyled.
  // `avatar` / `header-main` are the only two classes upstream does not have:
  // the optional photo header needs them, and kami-layout.css styles both.
  const KAMI_CLASSES = new Set([
    'alias', 'avatar', 'big', 'contact', 'date', 'desc', 'edu-row', 'em-brand', 'follower',
    'handle', 'handle-strip', 'header', 'header-main', 'hl', 'impact-grid', 'inf-block-title',
    'loc', 'major', 'metric', 'metric-label', 'metric-value', 'metrics', 'name',
    'no-break', 'os-desc', 'os-grid', 'os-highlight', 'os-intro', 'os-item',
    'os-name', 'os-star', 'page-break', 'proj-head', 'proj-kind', 'proj-label',
    'proj-lines', 'proj-name', 'proj-role', 'proj-row', 'proj-text', 'project',
    'resume--dense', 'role', 'school', 'section-title', 'sep', 'serif',
    'skill-body', 'skill-label', 'skill-row', 'small', 'strong', 'sub', 'summary',
    'tag', 'timeline', 'tl-body', 'tl-head', 'tl-step', 'tl-top', 'tl-year',
    'unit', 'year',
  ]);

  const emittedClasses = (html) =>
    new Set([...html.matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/)));

  s.check('T4.1', 'maps header slots onto the Kami header (education on its own line)', () => {
    const html = renderToHtml(RENDER_JS, sample);
    // Left column: name on line 1, education on line 2 — the alias must NOT be
    // nested inside .name, or the two collapse onto one line.
    assertIncludes(html, 'class="name serif"', 'name wrapper missing');
    assertIncludes(html, `class="name serif">${sample.header.name}</div>`, 'name must close before the alias');
    assert(!/class="name serif">[^<]*<span class="alias"/.test(html), 'alias must not be inline inside .name');
    assertIncludes(html, `class="alias">${sample.header.educationInline}</div>`, 'education must be its own block line');
    // Right column: role as a block line, then the contacts line.
    assertIncludes(html, `class="role">${sample.header.targetRole}</div>`, 'targetRole should be a block line');
    assertIncludes(html, 'class="contact"', 'contact column missing');
    assertIncludes(html, 'class="sep"', 'contact separator missing');
    return { detail: 'header slots → 2 lines left / 2 lines right' };
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

  s.check('T4.3', 'maps summary / skills / sections onto Kami blocks', () => {
    const html = renderToHtml(RENDER_JS, sample);
    // summary 是可省略槽位：样例不带，就单独注入一份验证映射，
    // 同时确认槽位为空时不输出空壳块。
    assertExcludes(html, 'class="summary"', 'empty summary slot should render nothing');
    const withSummary = renderToHtml(RENDER_JS, { ...sample, summary: '一句话概述。' });
    assertIncludes(withSummary, 'class="summary"', 'summary block missing');
    assertIncludes(withSummary, '一句话概述。', 'summary text missing');
    assertIncludes(html, 'class="section-title"', 'section title missing');
    assertIncludes(html, 'class="skill-row"', 'skill row missing');
    assertIncludes(html, 'class="skill-label"', 'skill label missing');
    assertIncludes(html, 'class="skill-body"', 'skill body missing');
    assertIncludes(html, sample.skills[0].label, 'skill label text missing');
    assertIncludes(html, 'class="project"', 'project block missing');
    assertIncludes(html, 'class="proj-head"', 'proj-head missing');
    assertIncludes(html, 'class="proj-name serif"', 'proj-name missing');
    assertIncludes(html, 'class="proj-role"', 'entry.time should map to the .proj-role pill');
    assertIncludes(html, 'class="proj-lines"', 'proj-lines missing');
    assertIncludes(html, 'class="proj-row"', 'proj-row missing');
    assertIncludes(html, 'class="proj-label"', 'proj-label missing');
    assertIncludes(html, 'class="proj-text"', 'proj-text missing');
    assertIncludes(html, sample.sections[1].entries[0].title, 'entry title missing');
    return { detail: 'summary/skills/sections → .summary/.skill-row/.project' };
  });

  // The whole point of the mapping: nothing the renderer emits may fall outside
  // the upstream class vocabulary, and every class it emits must be covered by
  // the upstream stylesheet — otherwise part of the resume renders unstyled.
  // Both header variants are checked, so the optional avatar path is held to the
  // same contract as the standard one.
  s.check('T4.4', 'emits only upstream Kami classes, all covered by the stylesheets', () => {
    const css =
      readText(path.join(TEMPLATE_DIR, 'shared', 'kami-family.css')) +
      readText(path.join(TEMPLATE_DIR, 'shared', 'kami-layout.css'));
    const cssClasses = new Set([...css.matchAll(/\.([A-Za-z][\w-]*)/g)].map((m) => m[1]));

    const variants = {
      'no avatar': sample,
      avatar: { ...sample, header: { ...sample.header, avatar: 'shared/avatar-sample.jpg' } },
    };

    const found = new Set();
    for (const [label, data] of Object.entries(variants)) {
      const emitted = emittedClasses(renderToHtml(RENDER_JS, data));
      const foreign = [...emitted].filter((c) => !KAMI_CLASSES.has(c));
      assert(foreign.length === 0, `${label}: non-Kami classes emitted: ${foreign.join(', ')}`);

      const unstyled = [...emitted].filter((c) => !cssClasses.has(c));
      assert(unstyled.length === 0, `${label}: emitted but not styled by the stylesheets: ${unstyled.join(', ')}`);
      for (const c of emitted) found.add(c);
    }
    return { detail: `${found.size} classes emitted across both header variants, all upstream + all styled` };
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

  s.check('T4.6', 'handles missing Resume View data with a safe placeholder', () => {
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

  // Emphasis convention: `**keyword**` becomes <span class="hl"> (theme accent),
  // and inside .skill-body it becomes .em-brand, matching the upstream template.
  s.check('T4.9', 'renders **keyword** as theme accent, leaking no literal **', () => {
    const html = renderToHtml(RENDER_JS, sample);
    assertExcludes(html, '**', 'literal ** leaked into output');
    assertIncludes(html, '<span class="hl">', 'no .hl emphasis rendered');
    assertIncludes(html, '<span class="em-brand">', 'skill bodies should use .em-brand');
    const m = /<span class="hl">([^<]+)<\/span>/.exec(html);
    assert(m, 'could not read a highlighted keyword');
    assert(!m[1].includes('*'), 'highlighted text still contains a marker');
    return {
      detail: `${(html.match(/class="hl"/g) || []).length} .hl + ${(html.match(/class="em-brand"/g) || []).length} .em-brand`,
    };
  });

  // Pagination is adaptive: content flows inside the A4 box and the CSS keeps
  // entries from splitting. The renderer must not inject a hard break.
  s.check('T4.10', 'does not force a page break (adaptive flow)', () => {
    const html = renderToHtml(RENDER_JS, sample);
    assertExcludes(html, 'page-break', 'renderer must not force a page break');
    const css = readText(path.join(TEMPLATE_DIR, 'shared', 'kami-family.css'));
    assertIncludes(css, 'break-inside: avoid', 'no break-inside guard for entries');
    return { detail: 'no hard break emitted; CSS guards entry splitting' };
  });

  // sections[type=education] is the one slot with a dedicated Kami block.
  s.check('T4.11', 'maps sections[type=education] onto .edu-row inside .no-break', () => {
    const withEdu = {
      ...sample,
      sections: [
        ...sample.sections,
        {
          type: 'education',
          title: '教育背景',
          range: null,
          entries: [
            { time: '2018.09 - 2022.06', title: '华东理工大学', meta: '信息科学与工程学院 · 软件工程' },
          ],
        },
      ],
    };
    const html = renderToHtml(RENDER_JS, withEdu);
    assertIncludes(html, 'class="no-break"', 'education section should not break across pages');
    assertIncludes(html, 'class="edu-row"', 'edu-row missing');
    assertIncludes(html, 'class="school serif"', 'school wrapper missing');
    assertIncludes(html, '华东理工大学', 'school text missing');
    assertIncludes(html, 'class="major"', 'major wrapper missing');
    assertIncludes(html, 'class="date"', 'date wrapper missing');
    assertIncludes(html, '2018.09 - 2022.06', 'date text missing');
    return { detail: 'education slot → .no-break + .edu-row' };
  });

  // summaryBullets / bullets / subBlocks all land in Kami's label+text table,
  // so nothing from the skill's slot model is dropped on the floor.
  // Format: bullets are a `·` list; a subBlock first adds a `|` + bold title row,
  // then its own `·` list. Tech-stack tags are intentionally not rendered.
  s.check('T4.12', 'renders summaryBullets / bullets / subBlocks, drops tags by design', () => {
    const html = renderToHtml(RENDER_JS, sample);
    // Compare against the rendered *text*: `**kw**` becomes a span, so neither
    // the raw source nor the marker-stripped source is a substring of the HTML.
    const text = html.replace(/<[^>]+>/g, '');
    const plain = (t) => String(t).replace(/\*\*/g, '');
    const work = sample.sections[0].entries[0];
    const proj = sample.sections[1].entries[0];
    const oss = sample.sections[2].entries[0];

    // 无序列表：· 标记 + 正文
    assertIncludes(html, '<div class="proj-label">·</div>', 'bullets should render as a · list');
    assertIncludes(text, plain(work.summaryBullets[0].text), 'work summaryBullet text missing');
    assertIncludes(text, plain(proj.summaryBullets[0].text), 'project summaryBullet text missing');
    assertIncludes(text, plain(oss.bullets[0].text), 'plain entry.bullets text missing');

    // 分标题：| 标记 + 加粗标题单起一行，其下才是该分标题的 · 列表
    assertIncludes(html, '<div class="proj-label">|</div>', 'subBlock title should get a | label');
    assertIncludes(
      html,
      `<strong>${plain(work.subBlocks[0].title)}</strong>`,
      'subBlock title should be bold on its own row'
    );
    assertIncludes(text, plain(work.subBlocks[0].bullets[0].text), 'subBlock bullet 1 missing');
    assertIncludes(text, plain(work.subBlocks[0].bullets[1].text), 'subBlock bullet 2 missing');
    assertIncludes(text, plain(proj.subBlocks[0].bullets[0].text), 'project subBlock bullet missing');

    // 技术栈标签按约定不上简历：标题行右格只放所在部门 / 项目地址
    const kinds = [...html.matchAll(/<span class="proj-kind">([\s\S]*?)<\/span>/g)].map((m) => m[1]);
    assert(kinds.length > 0, 'proj-kind cells missing');
    for (const tag of proj.tags) {
      assert(!kinds.some((k) => k.includes(tag)), `tag ${tag} must not be rendered`);
    }
    return { detail: 'summaryBullets / bullets / subBlocks rendered; tags dropped by design' };
  });

  s.check('T4.13', 'shared stylesheet ships the upstream A4 rules', () => {
    const css = readText(path.join(TEMPLATE_DIR, 'shared', 'kami-family.css'));
    assertIncludes(css, '@page', 'no @page rule — A4 box undefined');
    assertIncludes(css, 'A4', '@page is not sized to A4');
    assertIncludes(css, '.no-break', 'no .no-break rule');
    assertIncludes(css, 'resume--dense', 'no dense-mode override');
    assertIncludes(css, 'TsangerJinKai02', 'upstream 仓耳今楷 font-face missing');
    return { detail: 'A4 @page + no-break + dense + 仓耳今楷 all present' };
  });

  // The header layout is the one place this skill deliberately departs from
  // upstream: the header becomes a 2×2 grid (name / role on row 1, education /
  // contacts on row 2), row 1 is bottom-aligned and row 2 baseline-aligned, and
  // the optional avatar stretches the text block to the photo's height. That
  // delta lives in exactly one file, so the upstream stylesheet stays a clean
  // verbatim copy.
  s.check('T4.14', 'header layout delta is isolated in kami-layout.css', () => {
    const family = readText(path.join(TEMPLATE_DIR, 'shared', 'kami-family.css'));
    const layout = readText(path.join(TEMPLATE_DIR, 'shared', 'kami-layout.css'));

    // Upstream keeps its own rule; the delta is what overrides it.
    assertIncludes(family, 'align-items: flex-end', 'upstream .header rule changed — the copy is no longer verbatim');
    assertIncludes(layout, '.header', 'layout delta must target .header');
    assertIncludes(layout, 'display: grid', 'header must become a 2x2 grid');
    assertIncludes(layout, 'grid-template-columns', 'grid must define the two columns');
    assertIncludes(layout, 'align-items: end', 'row 1 (name / role) must be bottom-aligned');
    assertIncludes(layout, 'align-self: baseline', 'row 2 (education / contacts) must share a baseline');
    assertIncludes(layout, '.name', 'layout delta must target .name');
    assertIncludes(layout, 'display: block', '.name must stop being a flex container');
    assertIncludes(layout, '.alias', 'layout delta must size the education line');
    assertIncludes(layout, '.role', 'role must be its own grid cell');
    assertIncludes(layout, 'grid-row: 1', 'name and role must share grid row 1');
    assertIncludes(layout, '.contact', 'layout delta must place the contacts cell');
    // 头像变体：文字块与头像等高，第 1 行贴顶、第 2 行贴底。
    assertIncludes(layout, ':has(.avatar)', 'avatar variant must switch .header to a flex row');
    assertIncludes(layout, 'align-content: space-between', 'avatar variant must pin row 1 to the top and row 2 to the bottom');
    return { detail: 'header deviation contained in one override file' };
  });

  // 头像版式：header.avatar 有值时页头变成「头像在左 + 文字块在右」，
  // 没值时一个头像类名都不该出现。
  s.check('T4.15', 'header.avatar switches to the photo layout, absent by default', () => {
    const plain = renderToHtml(RENDER_JS, sample);
    assertExcludes(plain, 'class="avatar"', 'avatar must not render when the slot is empty');
    assertExcludes(plain, 'class="header-main"', 'text block wrapper must only exist in the avatar layout');

    const withAvatar = renderToHtml(RENDER_JS, {
      ...sample,
      header: { ...sample.header, avatar: 'shared/avatar-sample.jpg' },
    });
    assertIncludes(withAvatar, 'class="avatar"', 'avatar image missing');
    assertIncludes(withAvatar, 'src="shared/avatar-sample.jpg"', 'avatar src missing');
    assertIncludes(withAvatar, 'class="header-main"', 'avatar layout must wrap the text block');
    // 文字块内容一个都不能少
    assertIncludes(withAvatar, `class="name serif">${sample.header.name}</div>`, 'name lost in avatar layout');
    assertIncludes(withAvatar, `class="alias">${sample.header.educationInline}</div>`, 'education lost in avatar layout');
    assertIncludes(withAvatar, 'class="contact"', 'contacts lost in avatar layout');
    return { detail: 'avatar layout gated by header.avatar; text slots intact' };
  });

  // 项目地址：entry.link 渲染成超链接，href 是完整网址、显示文字是站点短名；
  // entry.meta 仍是纯文本（工作经历用它写所在部门）。
  s.check('T4.16', 'entry.link renders as a short-label anchor, meta stays plain text', () => {
    const html = renderToHtml(RENDER_JS, sample);
    const work = sample.sections[0].entries[0];
    const proj = sample.sections[1].entries[0];

    assertIncludes(html, `<a href="${proj.link}">github</a>`, 'project link should show the site name and point at the full URL');
    assertIncludes(html, `<span class="proj-kind">${work.meta}</span>`, 'work meta should stay plain text, not a link');

    // 兼容旧数据：网址写在 meta 里时同样渲染成链接
    const legacy = { ...proj, link: null, meta: 'https://github.com/zhangzhixing/qa-workbench' };
    const html2 = renderToHtml(RENDER_JS, {
      ...sample,
      sections: [sample.sections[0], { ...sample.sections[1], entries: [legacy] }, sample.sections[2]],
    });
    assertIncludes(html2, '<a href="https://github.com/zhangzhixing/qa-workbench">github</a>', 'a URL in meta should still become a link');
    return { detail: 'link → <a>github</a>; meta stays text' };
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
// T7 — Resume content lint (bullet quality rules)
// ---------------------------------------------------------------------------
function T7() {
  const s = suite('T7 · Resume content lint');

  const goldenProfile = readJson(path.join(TEST_ROOT, 'fixtures', 'valid', 'career-profile.min.json'));
  const goldenView = goldenProfile.resumeViews[0];
  const dutyView = readJson(path.join(TEST_ROOT, 'fixtures', 'invalid', 'resume-view-duty-statements.json'));

  // The point of the lint: a duty-statement bullet is schema-VALID, so the
  // schema cannot catch it — only the policy lint can.
  s.check('T7.1', 'duty-statement fixture is schema-valid (schema alone cannot catch it)', () => {
    const errors = validator.validate('resume-view.schema.json', dutyView);
    assert(errors.length === 0, `expected schema-valid, got: ${errors.slice(0, 3).map((e) => e.path).join(', ')}`);
    return { detail: 'schema passes — proving the lint adds coverage the schema lacks' };
  });

  s.check('T7.2', 'lint flags every vague duty statement in the negative fixture', () => {
    const problems = lintResumeView(dutyView);
    assert(problems.length === 4, `expected 4 flagged bullets, got ${problems.length}`);
    for (const p of problems) assert(p.reasons.length > 0, `bullet ${p.id} flagged without a reason`);
    return { detail: problems.map((p) => p.id).join(', ') };
  });

  s.check('T7.3', 'lint passes the golden resume fixture (Rule 2 clean)', () => {
    const problems = lintResumeView(goldenView);
    assert(problems.length === 0, problems.map((p) => `${p.id}: ${p.reasons.join('/')}`).join('; '));
    return { detail: `${collectBullets(goldenView).length} bullets, 0 duty statements` };
  });

  s.check('T7.4', 'every golden-fixture bullet is traceable (≥1 claimId)', () => {
    const bullets = collectBullets(goldenView);
    assert(bullets.length > 0, 'golden fixture has no bullets');
    for (const b of bullets) {
      assert(Array.isArray(b.claimIds) && b.claimIds.length >= 1, `bullet ${b.id} has no claimIds`);
    }
    return { detail: `${bullets.length} bullets all carry claimIds` };
  });

  s.check('T7.5', 'golden-fixture bullets use Ownership-appropriate verbs', () => {
    const claims = new Map(goldenProfile.claims.map((c) => [c.id, c]));
    const OWNER_VERBS = ['负责', '主导', '设计', '推动', '规划'];
    const COLLAB_VERBS = ['参与', '协同', '共建', '配合'];
    const violations = [];
    for (const b of collectBullets(goldenView)) {
      const own = b.claimIds.map((id) => claims.get(id)?.ownership).filter(Boolean);
      const weak = own.length > 0 && own.every((o) => o === 'COLLABORATIVE' || o === 'OBSERVED');
      if (weak && OWNER_VERBS.some((v) => b.text.includes(v))) {
        violations.push(`${b.id}: 弱 ownership 却使用强动词`);
      }
      const strong = own.some((o) => o === 'OWNER' || o === 'DIRECT');
      if (!strong && COLLAB_VERBS.some((v) => b.text.startsWith(v))) {
        // informational only — collaborative verbs on a strong claim are allowed
      }
    }
    assert(violations.length === 0, violations.join('; '));
    return { detail: 'no ownership/verb mismatch' };
  });

  // sample-data.json is the renderer preview fixture. It is shipped to users and
  // is the most likely thing a user copies as a starting template, so it must
  // obey the same Rule 2 the skill enforces on generated output.
  s.check('T7.6', 'templates/shared/sample-data.json is Rule 2 clean', () => {
    const sample = readJson(path.join(TEMPLATE_DIR, 'shared', 'sample-data.json'));
    const problems = lintResumeView(sample);
    assert(
      problems.length === 0,
      problems.map((p) => `${p.id}: ${p.reasons[0]}`).join('; ')
    );
    return { detail: `${collectBullets(sample).length} sample bullets, 0 duty statements` };
  });
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
const ALL = { T1, T2, T3, T4, T5, T6, T7 };
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
