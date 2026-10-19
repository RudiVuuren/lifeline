#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join, relative, resolve, sep } from 'node:path';

const require = createRequire(import.meta.url);
const M = require('../lifeline-model.js');
let yaml;
try { yaml = require('js-yaml'); }
catch { console.error('lifeline: js-yaml is required. Run "npm install" in the Lifeline repository.'); process.exit(2); }

const USAGE = `Usage:
  lifeline validate [folder]            Check every flow in a workspace folder.
  lifeline bundle <folder> <flow-path>  Print a flow and everything it links to or requires, for AI context.

Options:
  --json   Print validate results as JSON.`;

async function collect(root, dir = root) {
  const out = [];
  for (const d of await readdir(dir, { withFileTypes: true })) {
    if (d.name.startsWith('.') || d.name === 'node_modules') continue;
    const full = join(dir, d.name);
    if (d.isDirectory()) out.push(...await collect(root, full));
    else if (M.fileKind(d.name)) out.push(relative(root, full).split(sep).join('/'));
  }
  return out.sort();
}
async function loadWorkspace(root) {
  const entries = [];
  for (const path of await collect(root)) {
    const text = await readFile(join(root, path), 'utf8');
    const e = { path, kind: M.fileKind(path), text, flow: null, warnings: [], error: '' };
    if (e.kind === 'flow') {
      try { const r = M.normalizeFlow(yaml.load(text), (v) => yaml.dump(v, { lineWidth: -1 })); e.flow = r.flow; e.warnings = r.warnings; }
      catch (err) { e.error = err.mark ? `Line ${err.mark.line + 1}: ${err.reason || err.message}` : err.message; }
    }
    entries.push(e);
  }
  return entries;
}

const args = process.argv.slice(2);
const json = args.includes('--json');
const [cmd, ...rest] = args.filter((a) => a !== '--json');

if (cmd === 'validate') {
  const root = resolve(rest[0] || '.');
  const entries = await loadWorkspace(root);
  const problems = M.validateWorkspace(entries);
  const errors = problems.filter((p) => p.severity === 'error').length;
  if (json) console.log(JSON.stringify({ files: entries.length, problems }, null, 2));
  else {
    for (const p of problems) console.log(`${p.severity === 'error' ? 'error  ' : 'warning'} ${p.path}${p.id ? ` (${p.id})` : ''}: ${p.message}`);
    const flows = entries.filter((e) => e.kind === 'flow').length;
    console.log(`${flows} flow${flows === 1 ? '' : 's'}, ${entries.length - flows} document${entries.length - flows === 1 ? '' : 's'}: ${errors} error${errors === 1 ? '' : 's'}, ${problems.length - errors} warning${problems.length - errors === 1 ? '' : 's'}.`);
  }
  process.exit(errors ? 1 : 0);
} else if (cmd === 'bundle' && rest.length === 2) {
  const root = resolve(rest[0]);
  const entries = await loadWorkspace(root);
  const start = M.resolveRef(rest[1], (p) => entries.some((e) => e.path === p));
  if (!start) { console.error(`lifeline: "${rest[1]}" does not match a file in ${root}.`); process.exit(1); }
  process.stdout.write(M.bundle(entries, start, (e) => e.text));
} else {
  console.log(USAGE);
  process.exit(cmd ? 2 : 0);
}
