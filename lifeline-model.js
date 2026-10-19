(function (root) {
'use strict';

const TYPES = ['participant', 'actor', 'database', 'queue', 'external'];
const KINDS = ['sync', 'async', 'reply'];
const OPS = ['group', 'opt', 'loop', 'alt'];
const BADGE_COLORS = ['blue', 'green', 'orange', 'red', 'purple', 'teal', 'gray'];
const FLOW_KEYS = ['name', 'notes', 'participants', 'steps'];
const ID_RE = /^[A-Za-z0-9_.-]+$/;
const FLOW_EXT = /\.ya?ml$/i;
const DOC_EXT = /\.md$/i;

const str = (v) => (v == null ? '' : String(v));
const uniq = (base, taken) => { let id = base, n = 2; while (taken(id)) id = `${base}-${n++}`; return id; };

function normPath(p) {
  return str(p).trim().replace(/\\/g, '/').replace(/^\.\/+/, '').replace(/^\/+/, '');
}
function fileKind(path) {
  return FLOW_EXT.test(path) ? 'flow' : DOC_EXT.test(path) ? 'doc' : null;
}
function refOf(path) {
  const p = normPath(path);
  return FLOW_EXT.test(p) ? p.replace(FLOW_EXT, '') : p;
}
function resolveRef(ref, has) {
  const r = normPath(ref);
  if (!r) return null;
  if (has(r)) return r;
  if (!/\.[A-Za-z0-9]+$/.test(r)) {
    if (has(`${r}.yaml`)) return `${r}.yaml`;
    if (has(`${r}.yml`)) return `${r}.yml`;
  }
  return null;
}

function normalizeFlow(raw, dump) {
  const warnings = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('A flow file must be a mapping with name, participants and steps.');
  if (raw.flows != null) throw new Error('This file uses the old multi-flow format ("flows:"). Each file now holds exactly one flow.');
  if (raw.messages != null) throw new Error('"messages" was renamed to "steps".');
  for (const k of Object.keys(raw)) if (!FLOW_KEYS.includes(k)) warnings.push(`unknown key "${k}" is ignored`);
  const list = (v, what) => { if (v == null) return []; if (!Array.isArray(v)) throw new Error(`"${what}" must be a list.`); return v; };

  const participants = [], pids = new Set();
  list(raw.participants, 'participants').forEach((p, i) => {
    if (!p || typeof p !== 'object' || Array.isArray(p)) throw new Error(`Participant ${i + 1} must be a mapping.`);
    const given = str(p.id);
    const id = given || str(p.name).toLowerCase().replace(/[^a-z0-9_.-]+/g, '-').replace(/^-+|-+$/g, '') || `p${i + 1}`;
    if (given && !ID_RE.test(given)) warnings.push(`participant id "${given}" should use letters, digits, dot, dash or underscore`);
    if (pids.has(id)) throw new Error(`Participant id "${id}" is used twice.`);
    pids.add(id);
    if (p.type && !TYPES.includes(p.type)) warnings.push(`participant "${id}": unknown type "${p.type}", using participant`);
    participants.push({ id, name: str(p.name ?? id), type: TYPES.includes(p.type) ? p.type : 'participant', link: str(p.link), notes: str(p.notes) });
  });

  const ids = new Set();
  let msgN = 0, fragN = 0;
  const takeId = (want, prefix) => {
    const w = str(want);
    if (w && ID_RE.test(w) && !ids.has(w)) { ids.add(w); return w; }
    if (w) warnings.push(`step id "${w}" is ${ids.has(w) ? 'used twice' : 'invalid'}; a new id was assigned`);
    let id;
    do id = `${prefix}${prefix === 's' ? ++msgN : ++fragN}`; while (ids.has(id));
    ids.add(id);
    return id;
  };
  const parseBadges = (v, id) => list(v, `step "${id}" badges`).map((b, k) => {
    if (!b || typeof b !== 'object' || Array.isArray(b)) throw new Error(`Step "${id}", badge ${k + 1} must be a mapping.`);
    if (b.type != null && !['markdown', 'yaml'].includes(b.type)) warnings.push(`step "${id}": badge "${str(b.name)}" has unknown type "${b.type}", using markdown`);
    const content = b.content == null ? '' : typeof b.content === 'string' ? b.content : dump ? dump(b.content).replace(/\n$/, '') : JSON.stringify(b.content);
    return { name: str(b.name), type: b.type === 'yaml' ? 'yaml' : 'markdown', color: BADGE_COLORS.includes(b.color) ? b.color : 'gray', content };
  });
  const parseSteps = (arr, where) => list(arr, `${where}steps`).map((s, i) => {
    if (!s || typeof s !== 'object' || Array.isArray(s)) throw new Error(`${where}step ${i + 1} must be a mapping.`);
    const op = OPS.find((o) => Object.prototype.hasOwnProperty.call(s, o));
    if (op) {
      const id = takeId(s.id, 'f');
      let cases;
      if (op === 'alt') {
        cases = list(s.alt, `${where}alt`).map((c, k) => {
          if (!c || typeof c !== 'object' || Array.isArray(c)) throw new Error(`${where}alt case ${k + 1} must be a mapping with when and steps.`);
          return { when: str(c.when), steps: parseSteps(c.steps, `${where}alt case ${k + 1}: `) };
        });
        if (!cases.length) cases = [{ when: '', steps: [] }];
      } else {
        cases = [{ when: str(s[op]), steps: parseSteps(s.steps, `${where}${op} "${str(s[op])}": `) }];
      }
      return { type: 'frag', id, op, notes: str(s.notes), cases };
    }
    const from = str(s.from), to = str(s.to);
    if (!pids.has(from)) throw new Error(`${where}step ${i + 1}: from "${from}" is not a participant id.`);
    if (!pids.has(to)) throw new Error(`${where}step ${i + 1}: to "${to}" is not a participant id.`);
    const id = takeId(s.id, 's');
    if (s.kind && !KINDS.includes(s.kind)) warnings.push(`step "${id}": unknown kind "${s.kind}", using sync`);
    return { type: 'msg', id, from, to, label: str(s.label), kind: KINDS.includes(s.kind) ? s.kind : 'sync', link: str(s.link), notes: str(s.notes), badges: parseBadges(s.badges, id) };
  });

  const flow = { name: str(raw.name) || 'Untitled flow', notes: str(raw.notes), participants, steps: parseSteps(raw.steps, '') };
  return { flow, warnings };
}

function toData(f) {
  const clean = (x) => { for (const k of Object.keys(x)) if (x[k] === undefined || x[k] === '') delete x[k]; return x; };
  const stepsOut = (steps) => steps.map((s) => {
    if (s.type === 'frag') {
      const o = s.op === 'alt' ? { alt: s.cases.map((c) => ({ when: c.when, steps: stepsOut(c.steps) })) } : { [s.op]: s.cases[0].when };
      o.id = s.id;
      if (s.notes) o.notes = s.notes;
      if (s.op !== 'alt') o.steps = stepsOut(s.cases[0].steps);
      return o;
    }
    return clean({
      id: s.id, from: s.from, to: s.to, label: s.label, kind: s.kind === 'sync' ? undefined : s.kind, link: s.link, notes: s.notes,
      badges: s.badges.length ? s.badges.map((b) => clean({ name: b.name, type: b.type === 'markdown' ? undefined : b.type, color: b.color, content: b.content })) : undefined,
    });
  });
  const o = { name: f.name };
  if (f.notes) o.notes = f.notes;
  o.participants = f.participants.map((p) => clean({ id: p.id, name: p.name, type: p.type === 'participant' ? undefined : p.type, link: p.link, notes: p.notes }));
  o.steps = stepsOut(f.steps);
  return o;
}

function* iterSteps(steps, parent = null, depth = 0) {
  for (let i = 0; i < steps.length; i++) {
    const node = steps[i];
    yield { node, container: steps, index: i, parent, depth };
    if (node.type === 'frag') for (const c of node.cases) yield* iterSteps(c.steps, node, depth + 1);
  }
}
function findStep(flow, id) {
  for (const x of iterSteps(flow.steps)) if (x.node.id === id) return x;
  return null;
}
function chainTo(steps, id, acc = []) {
  for (let i = 0; i < steps.length; i++) {
    const node = steps[i], here = [...acc, { container: steps, index: i, node }];
    if (node.id === id) return here;
    if (node.type === 'frag') for (const c of node.cases) { const r = chainTo(c.steps, id, here); if (r) return r; }
  }
  return null;
}
function messages(flow) {
  const out = [];
  for (const x of iterSteps(flow.steps)) if (x.node.type === 'msg') out.push(x.node);
  return out;
}
function refsOf(flow) {
  const out = [];
  flow.participants.forEach((p) => { if (p.link) out.push({ ref: p.link, via: 'participant', id: p.id, label: p.name }); });
  for (const x of iterSteps(flow.steps)) if (x.node.type === 'msg' && x.node.link) out.push({ ref: x.node.link, via: 'step', id: x.node.id, label: x.node.label });
  return out;
}

function dirOf(p) { return p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : ''; }
function joinPath(base, rel) {
  const out = base ? base.split('/') : [];
  for (const part of rel.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') out.pop(); else out.push(part);
  }
  return out.join('/');
}
function markdownLinks(text) {
  const hrefs = [];
  for (const re of [/\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g, /^\s*\[[^\]]+\]:\s*<?(\S+?)>?(?:\s+.*)?$/gm]) {
    for (const m of str(text).matchAll(re)) hrefs.push(m[1]);
  }
  return hrefs
    .filter((h) => !/^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(h))
    .map((h) => { const p = h.split('#')[0]; try { return decodeURI(p); } catch (_) { return p; } })
    .filter(Boolean);
}
function linksOf(entry, has) {
  const out = [], dir = dirOf(entry.path);
  const md = (text, via, id, label) => {
    for (const href of markdownLinks(text)) {
      const local = joinPath(dir, href);
      const target = resolveRef(local, has) || resolveRef(href, has);
      out.push({ ref: target ? href : local, target, via, id, label, markdown: true });
    }
  };
  if (entry.kind === 'doc') md(entry.text, 'doc', undefined, 'link');
  else if (entry.flow) {
    for (const r of refsOf(entry.flow)) out.push({ ...r, target: resolveRef(r.ref, has), markdown: false });
    md(entry.flow.notes, 'notes', undefined, 'notes');
    entry.flow.participants.forEach((p) => md(p.notes, 'participant', p.id, p.name));
    for (const x of iterSteps(entry.flow.steps)) {
      const n = x.node;
      md(n.notes, 'step', n.id, n.type === 'msg' ? n.label : n.cases[0].when);
      if (n.type === 'msg') n.badges.forEach((b) => { if (b.type !== 'yaml') md(b.content, 'step', n.id, b.name); });
    }
  }
  return out;
}

function validateWorkspace(entries) {
  const problems = [];
  const paths = new Set(entries.map((e) => e.path));
  const has = (p) => paths.has(p);
  for (const e of entries) {
    if (e.kind === 'flow' && e.error) { problems.push({ severity: 'error', path: e.path, message: e.error }); continue; }
    for (const w of e.warnings || []) problems.push({ severity: 'warning', path: e.path, message: w });
    for (const r of linksOf(e, has)) {
      if (!r.target) problems.push(r.markdown
        ? { severity: 'warning', path: e.path, id: r.id, message: `Markdown link "${r.ref}" does not match a file in the workspace` }
        : { severity: 'error', path: e.path, id: r.id, message: `Link "${r.ref}" does not match a file in the workspace` });
      else if (!r.markdown && r.target === e.path) problems.push({ severity: 'warning', path: e.path, id: r.id, message: `"${r.ref}" links to its own flow` });
    }
    if (e.kind === 'flow' && !e.flow.steps.length) problems.push({ severity: 'warning', path: e.path, message: 'The flow has no steps' });
  }
  return problems;
}

function bundle(entries, startPath, sourceOf) {
  const paths = new Set(entries.map((e) => e.path));
  const byPath = new Map(entries.map((e) => [e.path, e]));
  const has = (p) => paths.has(p);
  const order = [], seen = new Set([startPath]), queue = [startPath], missing = [];
  while (queue.length) {
    const p = queue.shift(), e = byPath.get(p);
    if (!e) continue;
    order.push(e);
    for (const r of linksOf(e, has)) {
      const t = r.target;
      if (!t) { if (!missing.includes(r.ref)) missing.push(r.ref); continue; }
      if (!seen.has(t)) { seen.add(t); queue.push(t); }
    }
  }
  const fence = (text) => { let f = '```'; while (text.includes(f)) f += '`'; return f; };
  let out = `# Lifeline bundle: ${refOf(startPath)}\n\nThis bundle contains the flow ${refOf(startPath)} and every flow or document it links to, in breadth-first order. Links use workspace-relative paths.\n`;
  if (missing.length) out += `\nUnresolved references: ${missing.join(', ')}\n`;
  for (const e of order) {
    const text = sourceOf(e).replace(/\s+$/, '');
    const f = fence(text);
    out += `\n## ${e.path}\n\n${f}${e.kind === 'flow' ? 'yaml' : 'markdown'}\n${text}\n${f}\n`;
  }
  return out;
}

const api = {
  TYPES, KINDS, OPS, BADGE_COLORS, ID_RE,
  normPath, fileKind, refOf, resolveRef, uniq,
  normalizeFlow, toData, iterSteps, findStep, chainTo, messages, refsOf, markdownLinks, linksOf, validateWorkspace, bundle,
};
if (typeof module === 'object' && module.exports) module.exports = api;
else root.LifelineModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
