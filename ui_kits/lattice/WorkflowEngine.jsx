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

// Node-type catalogue: label, icon (lucide), accent colour, input arity, and how outputs branch.
// `out: 'branches'` means the port list is computed from the node's condition branches.
const WORKFLOW_NODE_TYPES = {
  trigger:   { label: 'Trigger',      icon: 'play',            accent: 'var(--green-base)', inputs: 0, out: ['next'] },
  setVar:    { label: 'Set variable', icon: 'variable',        accent: 'var(--blue-base)',  inputs: 1, out: ['next'] },
  api:       { label: 'API request',  icon: 'globe',           accent: 'var(--blue-base)',  inputs: 1, out: ['next'] },
  condition: { label: 'Condition',    icon: 'git-branch',      accent: 'var(--amber-base)', inputs: 1, out: 'branches' },
  navigate:  { label: 'Navigate',     icon: 'corner-up-right', accent: 'var(--green-base)', inputs: 1, out: ['next'] },
  setProp:   { label: 'Set property', icon: 'sliders',         accent: 'var(--blue-base)',  inputs: 1, out: ['next'] },
  toast:     { label: 'Toast',        icon: 'message-square',  accent: 'var(--red-base)',   inputs: 1, out: ['next'] },
};
window.WORKFLOW_NODE_TYPES = WORKFLOW_NODE_TYPES;

const COND_OPS = [
  { value: '==', label: 'equals' }, { value: '!=', label: 'not equals' },
  { value: '>', label: 'greater than' }, { value: '<', label: 'less than' },
  { value: 'contains', label: 'contains' }, { value: 'truthy', label: 'is truthy' },
  { value: 'empty', label: 'is empty' },
];
window.WORKFLOW_COND_OPS = COND_OPS;

const uidW = (p) => p + '_' + Math.random().toString(36).slice(2, 7);

// A fresh node of `type` at board position (x,y) with sensible config defaults.
function newWorkflowNode(type, x, y) {
  const base = { id: uidW('wn'), type, x: Math.round(x), y: Math.round(y) };
  switch (type) {
    case 'setVar':   return { ...base, target: '', value: '' };
    case 'api':      return { ...base, method: 'POST', url: '', headers: '', body: '', resultVar: '' };
    case 'condition':return { ...base, branches: [{ left: '', op: '==', right: '' }] };
    case 'navigate': return { ...base, pageId: '' };
    case 'setProp':  return { ...base, targetNodeId: '', prop: 'label', value: '' };
    case 'toast':    return { ...base, message: '' };
    default:         return base; // trigger
  }
}
window.newWorkflowNode = newWorkflowNode;

// Output ports of a node, as [{ port, label }]. Condition nodes get one port per branch + `else`.
function workflowOutPorts(node) {
  const meta = WORKFLOW_NODE_TYPES[node.type];
  if (!meta) return [];
  if (meta.out === 'branches') {
    const ports = (node.branches || []).map((_, i) => ({ port: String(i), label: i === 0 ? 'if' : 'else if' }));
    ports.push({ port: 'else', label: 'else' });
    return ports;
  }
  return meta.out.map(p => ({ port: p, label: '' }));
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
  switch (branch.op) {
    case '==': return String(l) === String(r);
    case '!=': return String(l) !== String(r);
    case '>':  return Number(l) > Number(r);
    case '<':  return Number(l) < Number(r);
    case 'contains': return String(l).includes(String(r));
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
        default: log({ label: 'Trigger', tone: 'info', text: 'workflow started' }); break;
      }
    } catch (err) {
      log({ label: (WORKFLOW_NODE_TYPES[cur.type] || {}).label || cur.type, tone: 'danger', text: 'Error: ' + err.message });
      console.error('[workflow]', cur.type, err);
    }
    const next = edgeFrom(cur.id, port);
    cur = next ? byId[next.to] : null;
  }
}
window.execWorkflow = execWorkflow;
