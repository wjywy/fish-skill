// Shared helpers for the resume-copilot test suite.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

/** Repo root (…/fish-skill). */
export const REPO_ROOT = path.resolve(__dirname, '..', '..');
export const TEST_ROOT = path.resolve(__dirname, '..');
export const SKILL_ROOT = path.join(REPO_ROOT, 'skills', 'resume-copilot');
export const SCHEMA_DIR = path.join(SKILL_ROOT, 'schemas');
export const TEMPLATE_DIR = path.join(SKILL_ROOT, 'templates');
export const RENDER_JS = path.join(TEMPLATE_DIR, 'shared', 'kami-render.js');
export const BIN = path.join(REPO_ROOT, 'bin', 'fish-skill.mjs');

export function readText(p) {
  return fs.readFileSync(p, 'utf8');
}

export function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function exists(p) {
  return fs.existsSync(p);
}

/** Recursively list files under a directory (absolute paths), sorted. */
export function listFiles(dir, filter = () => true) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full, filter));
    else if (filter(full)) out.push(full);
  }
  return out.sort();
}

/** Parse `---\n…\n---` YAML frontmatter into a flat key/value map. */
export function parseFrontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!match) return { hasFrontmatter: false, data: {} };
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (m) data[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
  return { hasFrontmatter: true, data };
}

/**
 * Extract backticked relative file references from markdown, e.g.
 *   `../policies/evidence-policy.md`
 * Only returns values that look like a relative path ending in a known asset
 * extension, so prose backticks like `OWNER` are ignored.
 */
export function extractRelativeFileRefs(markdown) {
  const refs = new Set();
  const re = /`([^`\n]+\.(?:md|json|html|js|css))`/g;
  let m;
  while ((m = re.exec(markdown)) !== null) {
    const value = m[1].trim();
    if (/^[a-z]+:\/\//i.test(value)) continue; // URL
    if (value.startsWith('/')) continue; // absolute
    refs.add(value);
  }
  return [...refs];
}

/** Simple pass/fail recorder that prints a live, grouped report. */
export class Suite {
  constructor(name) {
    this.name = name;
    this.results = [];
  }

  check(id, title, fn) {
    let status = 'PASS';
    let detail = '';
    try {
      const outcome = fn();
      if (outcome === false) {
        status = 'FAIL';
        detail = 'assertion returned false';
      } else if (outcome && typeof outcome === 'object') {
        if (outcome.ok === false) status = 'FAIL';
        detail = outcome.detail || '';
      }
    } catch (err) {
      status = 'FAIL';
      detail = err && err.message ? err.message : String(err);
    }
    this.results.push({ id, title, status, detail });
    const icon = status === 'PASS' ? '  ✓' : '  ✗';
    const line = `${icon} ${id} ${title}${detail ? `\n      → ${detail}` : ''}`;
    console.log(status === 'PASS' ? line : `\x1b[31m${line}\x1b[0m`);
    return status === 'PASS';
  }

  /** Record a non-blocking observation (does not fail the suite). */
  warn(id, title, detail = '') {
    this.results.push({ id, title, status: 'WARN', detail });
    console.log(`\x1b[33m  ! ${id} ${title}${detail ? `\n      → ${detail}` : ''}\x1b[0m`);
    return false;
  }

  get summary() {
    const passed = this.results.filter((r) => r.status === 'PASS').length;
    const warned = this.results.filter((r) => r.status === 'WARN').length;
    const failed = this.results.filter((r) => r.status === 'FAIL').length;
    return { total: this.results.length, passed, warned, failed };
  }
}

export function assert(condition, message) {
  if (!condition) throw new Error(message || 'assertion failed');
}

export function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || 'assertEqual failed'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

export function assertIncludes(haystack, needle, message) {
  if (!String(haystack).includes(needle)) {
    throw new Error(`${message || 'assertIncludes failed'}: expected to include ${JSON.stringify(needle)}`);
  }
}

export function assertExcludes(haystack, needle, message) {
  if (String(haystack).includes(needle)) {
    throw new Error(`${message || 'assertExcludes failed'}: expected NOT to include ${JSON.stringify(needle)}`);
  }
}
