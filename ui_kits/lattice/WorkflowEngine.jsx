/* global React */
// Workflow engine — shared metadata + runtime for the Workflow tab. No UI lives here.
// Both the editor (WorkflowView) and the Preview runtime (App/PreviewCanvas) import from here.
//
// A workflow is { id, name, nodes:[{id,type,x,y,...config}], edges:[{id,from,to,fromPort}] }.
// Execution starts at the single `trigger` node and walks edges, running each node's side effect
// through an injected `ctx` object so the engine stays free of React/DOM. Variables are resolved
// from a mutable `scope` (name → value) so a value written by one node is visible to the next.

// React context so a bound Input in Preview can read/write the live variable store. Default null →
// components fall back to their own local state (used by the design canvas & anim canvas).
window.WorkflowRuntime = window.WorkflowRuntime || React.createContext(null);

// Node-type catalogue: label, icon (lucide), accent colour, `category` (for the grouped add-menu),
// input arity, and how outputs branch. `out: 'branches'` means the port list is computed from the
// node's condition branches; `out: []` means the node is terminal (no outgoing port, e.g. Stop).
const WORKFLOW_NODE_TYPES = {
  trigger:      { label: 'Trigger',      icon: 'play',            accent: 'var(--green-base)', category: 'Flow',      inputs: 0, out: ['next'] },
  condition:    { label: 'Condition',    icon: 'git-branch',      accent: 'var(--amber-base)', category: 'Flow',      inputs: 1, out: 'branches' },
  confirm:      { label: 'Confirm',      icon: 'circle-help',     accent: 'var(--amber-base)', category: 'Flow',      inputs: 1, out: ['yes', 'no'] },
  stop:         { label: 'Stop',         icon: 'circle-stop',     accent: 'var(--red-base)',   category: 'Flow',      inputs: 1, out: [] },
  setVar:       { label: 'Set variable', icon: 'variable',        accent: 'var(--blue-base)',  category: 'Data',      inputs: 1, out: ['next'] },
  compute:      { label: 'Compute',      icon: 'calculator',      accent: 'var(--blue-base)',  category: 'Data',      inputs: 1, out: ['next'] },
  random:       { label: 'Random',       icon: 'dices',           accent: 'var(--blue-base)',  category: 'Data',      inputs: 1, out: ['next'] },
  storage:      { label: 'Local storage',icon: 'database',        accent: 'var(--blue-base)',  category: 'Data',      inputs: 1, out: ['next'] },
  api:          { label: 'API request',  icon: 'globe',           accent: 'var(--blue-base)',  category: 'Network',   inputs: 1, out: ['next'] },
  runWorkflow:  { label: 'Run workflow', icon: 'workflow',        accent: 'var(--green-base)', category: 'Network',   inputs: 1, out: ['next'] },
  navigate:     { label: 'Navigate',     icon: 'corner-up-right', accent: 'var(--green-base)', category: 'Interface', inputs: 1, out: ['next'] },
  setProp:      { label: 'Set property', icon: 'sliders',         accent: 'var(--blue-base)',  category: 'Interface', inputs: 1, out: ['next'] },
  toast:        { label: 'Toast',        icon: 'message-square',  accent: 'var(--red-base)',   category: 'Interface', inputs: 1, out: ['next'] },
  delay:        { label: 'Delay',        icon: 'timer',           accent: 'var(--text-muted)', category: 'Utility',   inputs: 1, out: ['next'] },
  log:          { label: 'Log',          icon: 'terminal',        accent: 'var(--text-muted)', category: 'Utility',   inputs: 1, out: ['next'] },
  playAnim:     { label: 'Play component animation', icon: 'film',        accent: 'var(--amber-base)', category: 'Animation', inputs: 1, out: ['next'] },
  playPageAnim: { label: 'Play page animation',      icon: 'clapperboard', accent: 'var(--amber-base)', category: 'Animation', inputs: 1, out: ['next'] },
};
window.WORKFLOW_NODE_TYPES = WORKFLOW_NODE_TYPES;

// Category order for the grouped "Add node" menu.
const WORKFLOW_CATEGORIES = ['Flow', 'Data', 'Network', 'Interface', 'Animation', 'Utility'];
window.WORKFLOW_CATEGORIES = WORKFLOW_CATEGORIES;

const COND_OPS = [
  { value: '==', label: 'equals' }, { value: '!=', label: 'not equals' },
  { value: '>', label: 'greater than' }, { value: '<', label: 'less than' },
  { value: '>=', label: 'greater or equal' }, { value: '<=', label: 'less or equal' },
  { value: 'contains', label: 'contains' }, { value: 'starts', label: 'starts with' },
  { value: 'ends', label: 'ends with' }, { value: 'regex', label: 'matches regex' },
  { value: 'in', label: 'in list (a, b, c)' }, { value: 'truthy', label: 'is truthy' },
  { value: 'empty', label: 'is empty' },
];
window.WORKFLOW_COND_OPS = COND_OPS;
// Operators that don't need a right-hand value (used to hide the "right" input in the editor).
const COND_UNARY = new Set(['truthy', 'empty']);
window.WORKFLOW_COND_UNARY = COND_UNARY;

const uidW = (p) => p + '_' + Math.random().toString(36).slice(2, 7);

// A fresh node of `type` at board position (x,y) with sensible config defaults.
function newWorkflowNode(type, x, y) {
  const base = { id: uidW('wn'), type, x: Math.round(x), y: Math.round(y) };
  switch (type) {
    case 'setVar':   return { ...base, target: '', value: '' };
    case 'compute':  return { ...base, a: '', op: '+', b: '', target: '' };
    case 'random':   return { ...base, mode: 'number', min: '0', max: '100', list: '', target: '' };
    case 'storage':  return { ...base, mode: 'set', key: '', value: '', target: '' };
    case 'api':      return { ...base, method: 'POST', url: '', headers: '', body: '', resultVar: '' };
    case 'runWorkflow': return { ...base, workflowId: '' };
    case 'condition':return { ...base, branches: [{ left: '', op: '==', right: '' }] };
    case 'confirm':  return { ...base, message: '' };
    case 'stop':     return { ...base };
    case 'navigate': return { ...base, pageId: '' };
    case 'setProp':  return { ...base, targetNodeId: '', prop: 'label', value: '' };
    case 'toast':    return { ...base, message: '' };
    case 'delay':    return { ...base, ms: '500' };
    case 'log':      return { ...base, message: '', level: 'info' };
    case 'playAnim': return { ...base, targetNodeId: '', animId: '' };
    case 'playPageAnim': return { ...base, pageId: '' };
    default:         return base; // trigger
  }
}
window.newWorkflowNode = newWorkflowNode;

// Output ports of a node, as [{ port, label }]. Condition nodes get one port per branch + `else`.
// A node with several fixed ports (e.g. Confirm → yes/no) labels each; a single-port node stays
// unlabelled; a terminal node (out: []) has none.
function workflowOutPorts(node) {
  const meta = WORKFLOW_NODE_TYPES[node.type];
  if (!meta) return [];
  if (meta.out === 'branches') {
    const ports = (node.branches || []).map((_, i) => ({ port: String(i), label: i === 0 ? 'if' : 'else if' }));
    ports.push({ port: 'else', label: 'else' });
    return ports;
  }
  return meta.out.map(p => ({ port: p, label: meta.out.length > 1 ? p : '' }));
}
window.workflowOutPorts = workflowOutPorts;

// --- Value resolution -------------------------------------------------------
// `scope` is a plain object mapping variable name → value (API results are stored as objects, so a
// dotted path like `resp.body.token` walks into them).
function getPath(obj, path) {
  return String(path).trim().split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
// Short, safe stringification for run-log rows.
function fmtVal(v) {
  if (v == null) return '∅';
  if (typeof v === 'object') { try { return JSON.stringify(v).slice(0, 120); } catch { return '[object]'; } }
  const s = String(v);
  return s.length > 120 ? s.slice(0, 120) + '…' : s;
}
window.fmtVal = fmtVal;
// Resolve a template string. If the whole string is a single `{{expr}}`, return the raw value
// (keeps objects/numbers intact); otherwise substitute each `{{expr}}` and return a string.
function resolveTemplate(str, scope) {
  if (typeof str !== 'string') return str;
  const whole = str.match(/^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/);
  if (whole) return getPath(scope, whole[1]);
  return str.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, e) => { const v = getPath(scope, e); return v == null ? '' : String(v); });
}
window.resolveTemplate = resolveTemplate;

function evalCondition(branch, scope) {
  const l = resolveTemplate(branch.left, scope);
  const r = resolveTemplate(branch.right, scope);
  const ls = l == null ? '' : String(l);
  const rs = r == null ? '' : String(r);
  switch (branch.op) {
    case '==': return ls === rs;
    case '!=': return ls !== rs;
    case '>':  return Number(l) > Number(r);
    case '<':  return Number(l) < Number(r);
    case '>=': return Number(l) >= Number(r);
    case '<=': return Number(l) <= Number(r);
    case 'contains': return ls.includes(rs);
    case 'starts': return ls.startsWith(rs);
    case 'ends':   return ls.endsWith(rs);
    case 'regex':  { try { return new RegExp(rs).test(ls); } catch { return false; } }
    case 'in':     return rs.split(',').map(s => s.trim()).includes(ls.trim());
    case 'truthy': return !!l && l !== 'false' && l !== '0';
    case 'empty':  return l == null || l === '';
    default: return false;
  }
}
window.evalCondition = evalCondition;

// --- Execution --------------------------------------------------------------
// ctx = {
//   variables: [{id,name,type,initial}]   merged global + page vars (for id → name lookup)
//   scope:     { name: value }            initial snapshot (mutated in place as nodes run)
//   onVarChange(id, value)                push a write to the React runtime store
//   navigate(pageId)  setProp(nodeId, prop, value)  toast(message)
//   callApi({method,url,headers,body}) -> Promise<{status, ok, body}>
//   playAnim(nodeId, animId) -> bool     play one node's animation state (false = not found)
//   playPageAnim(pageId)                 replay a page's scene timeline from 0
//   confirm(message) -> bool             show a yes/no dialog (used by the Confirm node)
//   storage: { get(k), set(k,v), remove(k) }   persistent key/value (used by the Local storage node)
//   workflows: [workflow]                sibling workflows (used by the Run-workflow node)
//   _depth                               internal recursion guard for nested Run-workflow calls
// }
async function execWorkflow(workflow, ctx) {
  if (!workflow || !Array.isArray(workflow.nodes)) return;
  const byId = {};
  workflow.nodes.forEach(n => { byId[n.id] = n; });
  const varById = {};
  (ctx.variables || []).forEach(v => { varById[v.id] = v; });
  const scope = ctx.scope || {};
  const edgeFrom = (id, port) => (workflow.edges || []).find(e => e.from === id && (e.fromPort || 'next') === port);

  const writeVar = (varId, value) => {
    const v = varById[varId];
    if (v) scope[v.name] = value;
    if (ctx.onVarChange) ctx.onVarChange(varId, value);
  };
  const log = (e) => { if (ctx.log) ctx.log(e); };
  const varName = (id) => (varById[id] || {}).name || id;
  const pageName = (id) => (ctx.pageNameFor ? ctx.pageNameFor(id) : id);

  let cur = workflow.nodes.find(n => n.type === 'trigger') || workflow.nodes[0];
  let guard = 0;
  while (cur && guard++ < 200) {
    let port = 'next';
    // A disabled (muted) node is skipped entirely — the run continues down its first outgoing edge,
    // whatever the port, so you can mute a step without rewiring the graph around it.
    if (cur.disabled) {
      log({ label: (WORKFLOW_NODE_TYPES[cur.type] || {}).label || cur.type, tone: 'info', text: '(disabled — skipped)' });
      const skip = (workflow.edges || []).find(e => e.from === cur.id);
      cur = skip ? byId[skip.to] : null;
      continue;
    }
    try {
      switch (cur.type) {
        case 'setVar': {
          const val = resolveTemplate(cur.value, scope);
          if (cur.target) writeVar(cur.target, val);
          log({ label: 'Set variable', tone: 'info', text: `${varName(cur.target)} = ${fmtVal(val)}` });
          break;
        }
        case 'api': {
          const method = (cur.method || 'GET').toUpperCase();
          const url = resolveTemplate(cur.url, scope);
          let body = resolveTemplate(cur.body, scope);
          if (typeof body === 'string' && body.trim()) { try { body = JSON.parse(body); } catch {} }
          else if (!body) body = undefined;
          let headers;
          if (cur.headers && cur.headers.trim()) { try { headers = JSON.parse(resolveTemplate(cur.headers, scope)); } catch {} }
          const resp = ctx.callApi
            ? await ctx.callApi({ method, url, headers, body })
            : { status: 0, ok: false, body: null };
          if (cur.resultVar) writeVar(cur.resultVar, resp);
          log({
            label: 'API request', tone: resp && resp.ok ? 'success' : 'danger',
            text: `${method} ${url || '(no url)'} → ${resp && resp.status != null ? resp.status : '—'}`,
            data: { request: body ?? '(no body)', status: resp && resp.status, response: resp && resp.body, error: resp && resp.error },
          });
          break;
        }
        case 'condition': {
          const checks = (cur.branches || []).map((b, i) => ({
            branch: i, left: fmtVal(resolveTemplate(b.left, scope)), op: b.op,
            right: (b.op === 'truthy' || b.op === 'empty') ? '—' : fmtVal(resolveTemplate(b.right, scope)),
            result: evalCondition(b, scope),
          }));
          const idx = checks.findIndex(c => c.result);
          port = idx >= 0 ? String(idx) : 'else';
          log({ label: 'Condition', tone: 'info', text: idx >= 0 ? `matched branch ${idx} → took “if” path` : 'no branch matched → took “else” path', data: { checks } });
          break;
        }
        case 'navigate':
          if (cur.pageId && ctx.navigate) ctx.navigate(cur.pageId);
          log({ label: 'Navigate', tone: 'success', text: `→ ${pageName(cur.pageId) || '(no page)'}` });
          break;
        case 'setProp': {
          const val = resolveTemplate(cur.value, scope);
          if (cur.targetNodeId && ctx.setProp) ctx.setProp(cur.targetNodeId, cur.prop || 'label', val);
          log({ label: 'Set property', tone: 'info', text: `${cur.prop || 'label'} = ${fmtVal(val)}` });
          break;
        }
        case 'toast': {
          const msg = resolveTemplate(cur.message, scope) || 'Done';
          if (ctx.toast) ctx.toast(msg);
          log({ label: 'Toast', tone: 'info', text: msg });
          break;
        }
        case 'playAnim': {
          const ok = cur.targetNodeId && cur.animId && ctx.playAnim ? ctx.playAnim(cur.targetNodeId, cur.animId) : false;
          log(ok
            ? { label: 'Play component animation', tone: 'success', text: ctx.animNameFor ? ctx.animNameFor(cur.targetNodeId, cur.animId) : 'playing' }
            : { label: 'Play component animation', tone: 'warning', text: 'nothing played — pick a component + animation, and make sure that component is on the page being previewed' });
          break;
        }
        case 'playPageAnim': {
          if (ctx.playPageAnim) ctx.playPageAnim(cur.pageId || null);
          log({ label: 'Play page animation', tone: 'success', text: `↻ ${pageName(cur.pageId) || 'current page'}` });
          break;
        }
        case 'compute': {
          const a = resolveTemplate(cur.a, scope), b = resolveTemplate(cur.b, scope);
          const na = Number(a), nb = Number(b);
          let val;
          switch (cur.op) {
            case '-': val = na - nb; break;
            case '*': val = na * nb; break;
            case '/': val = nb === 0 ? NaN : na / nb; break;
            case 'min': val = Math.min(na, nb); break;
            case 'max': val = Math.max(na, nb); break;
            case 'concat': val = `${a == null ? '' : a}${b == null ? '' : b}`; break;
            default: val = na + nb; // '+'
          }
          if (cur.target) writeVar(cur.target, val);
          log({ label: 'Compute', tone: 'info', text: `${varName(cur.target)} = ${fmtVal(val)}` });
          break;
        }
        case 'random': {
          let val;
          if (cur.mode === 'list') {
            const items = String(resolveTemplate(cur.list, scope) || '').split(',').map(s => s.trim()).filter(Boolean);
            val = items.length ? items[Math.floor(Math.random() * items.length)] : '';
          } else {
            const min = Number(resolveTemplate(cur.min, scope)); const lo = isNaN(min) ? 0 : min;
            const max = Number(resolveTemplate(cur.max, scope)); const hi = isNaN(max) ? 100 : max;
            val = Math.floor(lo + Math.random() * (hi - lo + 1));
          }
          if (cur.target) writeVar(cur.target, val);
          log({ label: 'Random', tone: 'info', text: `${varName(cur.target)} = ${fmtVal(val)}` });
          break;
        }
        case 'storage': {
          const key = resolveTemplate(cur.key, scope);
          const mode = cur.mode || 'set';
          if (!ctx.storage) { log({ label: 'Local storage', tone: 'warning', text: 'storage unavailable in this context' }); break; }
          if (mode === 'get') {
            const v = ctx.storage.get(key);
            if (cur.target) writeVar(cur.target, v);
            log({ label: 'Local storage', tone: 'info', text: `get ${key || '(no key)'} → ${fmtVal(v)}` });
          } else if (mode === 'remove') {
            ctx.storage.remove(key);
            log({ label: 'Local storage', tone: 'info', text: `remove ${key || '(no key)'}` });
          } else {
            const v = resolveTemplate(cur.value, scope);
            ctx.storage.set(key, typeof v === 'object' ? JSON.stringify(v) : String(v == null ? '' : v));
            log({ label: 'Local storage', tone: 'info', text: `set ${key || '(no key)'} = ${fmtVal(v)}` });
          }
          break;
        }
        case 'confirm': {
          const msg = resolveTemplate(cur.message, scope) || 'Are you sure?';
          const ok = ctx.confirm ? await ctx.confirm(msg) : (typeof window !== 'undefined' ? window.confirm(msg) : true);
          port = ok ? 'yes' : 'no';
          log({ label: 'Confirm', tone: 'info', text: `“${msg}” → took the ${port} path` });
          break;
        }
        case 'runWorkflow': {
          const sub = (ctx.workflows || []).find(w => w.id === cur.workflowId);
          const depth = ctx._depth || 0;
          if (!sub) { log({ label: 'Run workflow', tone: 'warning', text: 'pick a workflow to run' }); break; }
          if (depth >= 8) { log({ label: 'Run workflow', tone: 'danger', text: 'max nesting depth (8) reached — stopped' }); break; }
          log({ label: 'Run workflow', tone: 'info', text: `↳ ${sub.name}` });
          await execWorkflow(sub, { ...ctx, _depth: depth + 1 });
          break;
        }
        case 'delay': {
          const ms = Math.max(0, Math.min(20000, Number(resolveTemplate(cur.ms, scope)) || 0));
          log({ label: 'Delay', tone: 'info', text: `wait ${ms}ms` });
          await new Promise(res => setTimeout(res, ms));
          break;
        }
        case 'log': {
          const msg = resolveTemplate(cur.message, scope);
          const tone = ['info', 'success', 'warning', 'danger'].includes(cur.level) ? cur.level : 'info';
          log({ label: 'Log', tone, text: fmtVal(msg) });
          break;
        }
        case 'stop': {
          log({ label: 'Stop', tone: 'info', text: 'workflow stopped' });
          break;
        }
        default: log({ label: 'Trigger', tone: 'info', text: 'workflow started' }); break;
      }
    } catch (err) {
      log({ label: (WORKFLOW_NODE_TYPES[cur.type] || {}).label || cur.type, tone: 'danger', text: 'Error: ' + err.message });
      console.error('[workflow]', cur.type, err);
    }
    if (cur.type === 'stop') break; // terminal node — end the run regardless of any wiring
    const next = edgeFrom(cur.id, port);
    cur = next ? byId[next.to] : null;
  }
}
window.execWorkflow = execWorkflow;
