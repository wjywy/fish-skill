#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, '..');
const skillsRoot = path.join(packageRoot, 'skills');

function listSkills() {
  if (!fs.existsSync(skillsRoot)) return [];
  return fs.readdirSync(skillsRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(skillsRoot, e.name, 'SKILL.md')))
    .map((e) => e.name)
    .sort();
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function parseFlag(args, name, fallback) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

function usage() {
  console.log(`fish-skill\n\nCommands:\n  fish-skill list\n  fish-skill install <skill> [--target .agents/skills] [--force]\n  fish-skill check\n\nExamples:\n  npx fish-skill list\n  npx fish-skill install resume-copilot\n  npx fish-skill install resume-copilot --target .claude/skills\n`);
}

const args = process.argv.slice(2);
const cmd = args[0];

if (!cmd || cmd === '-h' || cmd === '--help' || cmd === 'help') {
  usage();
  process.exit(0);
}

if (cmd === 'list') {
  const skills = listSkills();
  if (!skills.length) console.log('No skills found.');
  else skills.forEach((name) => console.log(name));
  process.exit(0);
}

if (cmd === 'check') {
  const skills = listSkills();
  if (!skills.length) {
    console.error('No valid skills found under skills/.');
    process.exit(1);
  }
  for (const skill of skills) {
    const skillFile = path.join(skillsRoot, skill, 'SKILL.md');
    const text = fs.readFileSync(skillFile, 'utf8');
    if (!text.startsWith('---')) {
      console.error(`${skill}: SKILL.md is missing YAML frontmatter.`);
      process.exit(1);
    }
  }
  console.log(`OK: ${skills.length} skill(s): ${skills.join(', ')}`);
  process.exit(0);
}

if (cmd === 'install') {
  const skill = args[1];
  if (!skill) {
    console.error('Missing skill name.');
    usage();
    process.exit(1);
  }
  const available = listSkills();
  if (!available.includes(skill)) {
    console.error(`Unknown skill: ${skill}`);
    console.error(`Available: ${available.join(', ')}`);
    process.exit(1);
  }
  const targetRoot = path.resolve(process.cwd(), parseFlag(args, '--target', '.agents/skills'));
  const dest = path.join(targetRoot, skill);
  if (fs.existsSync(dest)) {
    if (!args.includes('--force')) {
      console.error(`Destination already exists: ${dest}`);
      console.error('Use --force to replace it.');
      process.exit(1);
    }
    fs.rmSync(dest, { recursive: true, force: true });
  }
  copyDir(path.join(skillsRoot, skill), dest);
  console.log(`Installed ${skill} -> ${dest}`);
  process.exit(0);
}

console.error(`Unknown command: ${cmd}`);
usage();
process.exit(1);
