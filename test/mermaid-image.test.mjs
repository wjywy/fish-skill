#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = process.env.MERMAID_SCRIPT || path.join(root, 'skills/resume-copilot/scripts/embed-mermaid.mjs');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mermaid-image-test-'));
const md = path.join(dir, 'answer.md');
const mermaidJs = path.join(dir, 'mermaid-stub.js');
const fence = '```mermaid\nflowchart LR\n  A --> B\n```';

function run(...args) {
  return spawnSync(process.execPath, [script, md, ...args], { encoding: 'utf8' });
}

try {
  fs.writeFileSync(md, `# 图示\n\n${fence}\n\n结尾。\n`);
  fs.writeFileSync(mermaidJs, `var mermaid = {
    initialize() {},
    async render(id) {
      return { svg: '<svg id="' + id + '" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 100"><rect width="320" height="100" fill="white"/><text x="20" y="55">diagram</text></svg>' };
    }
  };`);

  let result = run('--mermaid-js', mermaidJs);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const first = fs.readFileSync(md, 'utf8');
  assert.match(first, /!\[流程图 1\]\(assets\/answer-1\.png\)/);
  const png = fs.readFileSync(path.join(dir, 'assets/answer-1.png'));
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.ok(png.readUInt32BE(16) >= 800, 'PNG should have a readable width');
  assert.ok(fs.existsSync(path.join(dir, 'assets/answer-1.svg')));

  result = run('--check');
  assert.equal(result.status, 0, result.stderr || result.stdout);

  result = run('--mermaid-js', mermaidJs);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(fs.readFileSync(md, 'utf8'), first, 'rerun should not duplicate or reorder content');

  fs.appendFileSync(md, `\n${fence}\n`);
  result = run('--check');
  assert.equal(result.status, 1, 'one image marker must not satisfy two identical diagrams');

  result = run('--mermaid-js', mermaidJs);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  result = run('--check');
  assert.equal(result.status, 0, 'two identical diagrams need two distinct image assets');

  fs.writeFileSync(md, first);
  fs.unlinkSync(path.join(dir, 'assets/answer-1.png'));
  result = run('--check');
  assert.equal(result.status, 1, 'missing PNG must fail --check');

  console.log('mermaid-image: generation, PNG preview asset, rerun, and --check passed');
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
