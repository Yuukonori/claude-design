/* global React */
// Code view — a file explorer over the project, real code generation, a full Vite + React + TS
// scaffold ("Initialize project"), and a single-click runnable .zip export.
//
// The tree merges two sources:
//   • Generated (virtual, read-only): src/pages/<Page>.tsx, regenerated live from the design.
//   • Project files (editable): the project's `assets` — user-created files/folders, uploaded
//     binaries (images), and the scaffold written by "Initialize project".
// Assets override generated files at the same path. Export merges scaffold-defaults < generated <
// assets so the exported project always runs: unzip → npm install → npm run dev.
//
// NOTE: no object-rest destructuring anywhere in this file — in the in-browser Babel setup two
// files using `{...rest}` collide on a shared `_excluded` helper, and PreviewCanvas.jsx already
// uses it. Object/JSX spread in literals (`{...obj}`) is fine.

// ---------- pure helpers ----------

function buildChildMap(connections) {
  const m = {};
  (connections || []).filter(c => c.kind === 'child').forEach(c => {
    if (!m[c.from]) m[c.from] = [];
    m[c.from].push(c.to);
  });
  return m;
}
window.buildChildMap = buildChildMap;

function pascalName(s) {
  const out = (s || '').replace(/[^a-zA-Z0-9]+/g, ' ').trim().split(' ')
    .filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  return out || 'Page';
}

function slug(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'lattice-app';
}

const CSS_FONT = {
  'Grotesk (UI)': "var(--font-sans)", 'Serif display': "var(--font-serif-display)",
  'Mono': "var(--font-mono)", 'System': 'system-ui, sans-serif',
};
const CSS_WEIGHT = { regular: 400, medium: 500, semibold: 600, bold: 700 };
const CODE_TEXT_KINDS = new Set(['text', 'heading', 'link', 'button', 'badge', 'stat']);

// Serialize a plain style object to a JSX inline-style body: { "left": 12, "color": "#fff" }
function objToJs(obj) {
  const parts = Object.keys(obj)
    .filter(k => obj[k] != null && obj[k] !== '')
    .map(k => JSON.stringify(k) + ': ' + (typeof obj[k] === 'number' ? obj[k] : JSON.stringify(obj[k])));
  return '{ ' + parts.join(', ') + ' }';
}
function jsxText(t) { return t ? '{' + JSON.stringify(t) + '}' : ''; }

// Faithful-enough inline style for a node, reusing the editor's own resolvers where available.
function nodeStyleObj(n) {
  const fx = (window.nodeFx && window.nodeFx(n)) || {};
  const style = Object.assign({ position: 'absolute', left: n.x || 0, top: n.y || 0, width: n.w || 0, height: n.h || 0 }, fx);
  const bg = (window.fillBg && window.fillBg(n)) || n.fillColor;
  if (bg) style.background = bg;
  if (n.textColor) style.color = n.textColor;
  if (n.fontFamily && CSS_FONT[n.fontFamily]) style.fontFamily = CSS_FONT[n.fontFamily];
  else if (n.kind === 'heading') style.fontFamily = 'var(--font-serif-display)';
  if (n.fontSize) style.fontSize = n.fontSize;
  if (n.fontWeight && CSS_WEIGHT[n.fontWeight]) style.fontWeight = CSS_WEIGHT[n.fontWeight];
  if (n.letterSpacing) style.letterSpacing = n.letterSpacing + 'px';
  if (n.textTransform && n.textTransform !== 'none') style.textTransform = n.textTransform;
  const kind = n.kind || 'frame';
  if (kind === 'button' || kind === 'badge') { style.display = 'inline-flex'; style.alignItems = 'center'; style.justifyContent = 'center'; style.cursor = 'pointer'; }
  else if (kind === 'heading' || kind === 'text' || kind === 'link') {
    style.display = 'flex'; style.alignItems = 'center';
    style.justifyContent = n.textAlign === 'center' ? 'center' : n.textAlign === 'right' ? 'flex-end' : 'flex-start';
    if (kind === 'heading' && !n.fontSize) style.fontSize = 28;
  }
  if (kind === 'button' && !n.borderWidth && !bg) style.background = 'var(--action-solid)', style.color = style.color || 'var(--action-solid-text)';
  return style;
}

// One node → a JSX element line for its page component.
function nodeToTsx(n, resolveImg) {
  const styleStr = objToJs(nodeStyleObj(n));
  const kind = n.kind || 'frame';
  const text = n.label != null ? n.label : (CODE_TEXT_KINDS.has(kind) ? (n.name || '') : '');
  if (kind === 'image') {
    const img = resolveImg(n.src);
    const srcExpr = img ? (img.var ? '{' + img.var + '}' : JSON.stringify(img.url)) : '""';
    return '      <img src=' + srcExpr + ' alt=' + JSON.stringify(n.label || '') + ' style={' + styleStr + '} />';
  }
  if (kind === 'button') return '      <button style={' + styleStr + '}>' + jsxText(text) + '</button>';
  if (kind === 'link') return '      <a href=' + JSON.stringify(n.href || '#') + ' style={' + styleStr + '}>' + jsxText(text) + '</a>';
  if (kind === 'input') return '      <input placeholder=' + JSON.stringify(n.placeholder || n.label || '') + ' style={' + styleStr + '} />';
  if (CODE_TEXT_KINDS.has(kind)) return '      <div style={' + styleStr + '}>' + jsxText(text) + '</div>';
  return '      <div style={' + styleStr + '} />';
}

// Stable component name + route per page.
function pageMetaOf(pages) {
  const used = {};
  return (pages || []).map(p => {
    let base = pascalName(p.name);
    if (used[base]) { used[base]++; base = base + used[base]; } else { used[base] = 1; }
    return { id: p.id, name: p.name || base, route: p.route || '/' + base.toLowerCase(), comp: base };
  });
}

function genPageTsx(page, comp) {
  const nodes = page.nodes || [];
  let pw = 360, ph = 240;
  nodes.forEach(n => { pw = Math.max(pw, (n.x || 0) + (n.w || 0)); ph = Math.max(ph, (n.y || 0) + (n.h || 0)); });
  const imports = []; const map = {}; let ai = 0;
  const resolveImg = (src) => {
    if (!src) return null;
    if (/^(https?:|data:|\/\/)/i.test(src)) return { url: src };
    if (map[src] != null) return { var: map[src] };
    const v = 'asset' + (ai++);
    let p = src.replace(/^\.?\//, '');
    if (!/^src\//.test(p)) p = 'src/assets/' + p.split('/').pop();
    imports.push("import " + v + " from '" + ('../' + p.replace(/^src\//, '')) + "';");
    map[src] = v; return { var: v };
  };
  const body = nodes.map(n => nodeToTsx(n, resolveImg)).filter(Boolean).join('\n');
  const head = "import React from 'react';\n" + (imports.length ? imports.join('\n') + '\n' : '');
  return head + '\nexport default function ' + comp + '() {\n  return (\n    <div style={{ position: \'relative\', width: ' + pw + ', height: ' + ph + ', margin: \'0 auto\' }}>\n'
    + (body || '      {/* empty page — place components on the canvas */}') + '\n    </div>\n  );\n}\n';
}

function generatedFiles(pages) {
  const meta = pageMetaOf(pages);
  const out = meta.map((m, i) => ({ path: 'src/pages/' + m.comp + '.tsx', content: genPageTsx(pages[i], m.comp), generated: true }));
  // App.tsx (the page router) is generated too, so it always imports the current set of pages.
  out.push({ path: 'src/App.tsx', content: genAppTsx(meta), generated: true });
  return out;
}

// ---------- scaffold ----------

function genPackageJson(name) {
  return JSON.stringify({
    name: slug(name), private: true, version: '0.0.0', type: 'module',
    scripts: { dev: 'vite', build: 'tsc && vite build', preview: 'vite preview' },
    dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
    devDependencies: {
      '@types/react': '^18.3.3', '@types/react-dom': '^18.3.0',
      '@vitejs/plugin-react': '^4.3.1', typescript: '^5.5.3', vite: '^5.4.0',
    },
  }, null, 2) + '\n';
}
function genIndexHtml(name) {
  return '<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>' + (name || 'Lattice app') + '</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>\n';
}
function genViteConfig() {
  return "import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\n// https://vitejs.dev/config/\nexport default defineConfig({\n  plugins: [react()],\n});\n";
}
function genTsconfig() {
  return JSON.stringify({
    compilerOptions: {
      target: 'ES2020', useDefineForClassFields: true, lib: ['ES2020', 'DOM', 'DOM.Iterable'],
      module: 'ESNext', skipLibCheck: true, moduleResolution: 'bundler',
      allowImportingTsExtensions: true, resolveJsonModule: true, isolatedModules: true,
      noEmit: true, jsx: 'react-jsx', strict: true, noUnusedLocals: false, noUnusedParameters: false,
    },
    include: ['src'], references: [{ path: './tsconfig.node.json' }],
  }, null, 2) + '\n';
}
function genTsconfigNode() {
  return JSON.stringify({
    compilerOptions: { composite: true, skipLibCheck: true, module: 'ESNext', moduleResolution: 'bundler', allowSyntheticDefaultImports: true },
    include: ['vite.config.ts'],
  }, null, 2) + '\n';
}
function genMainTsx() {
  return "import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>,\n);\n";
}
function genAppTsx(meta) {
  const list = meta.length ? meta : [{ name: 'Home', route: '/', comp: 'Home' }];
  const imports = list.map(m => "import " + m.comp + " from './pages/" + m.comp + "';").join('\n');
  const routes = list.map(m => '  { path: ' + JSON.stringify(m.route) + ', name: ' + JSON.stringify(m.name) + ', Comp: ' + m.comp + ' }').join(',\n');
  return "import React from 'react';\n" + imports + "\n\nconst pages = [\n" + routes + "\n];\n\nexport default function App() {\n  const [hash, setHash] = React.useState(() => window.location.hash.slice(1) || pages[0].path);\n  React.useEffect(() => {\n    const on = () => setHash(window.location.hash.slice(1) || pages[0].path);\n    window.addEventListener('hashchange', on);\n    return () => window.removeEventListener('hashchange', on);\n  }, []);\n  const current = pages.find(p => p.path === hash) || pages[0];\n  const Current = current.Comp;\n  return (\n    <div style={{ minHeight: '100vh' }}>\n      <nav style={{ display: 'flex', gap: 16, padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)' }}>\n        {pages.map(p => (\n          <a key={p.path} href={'#' + p.path} style={{ color: p.path === current.path ? 'var(--text-primary)' : 'var(--text-muted)', textDecoration: 'none', fontSize: 14, fontWeight: p.path === current.path ? 600 : 400 }}>{p.name}</a>\n        ))}\n      </nav>\n      <Current />\n    </div>\n  );\n}\n";
}
function genIndexCss() {
  return "/* Design tokens (approximated from the Lattice design system — tune to taste). */\n:root {\n  --bg-app: #0b0d12; --surface: #101319; --surface-card: #12161d; --surface-inset: #0d1016;\n  --surface-hover: #1a1f2a; --surface-raised: #161b24;\n  --border-subtle: #1c2029; --border-default: #2a2f3a; --border-strong: #3a404d;\n  --text-primary: #e7e9ee; --text-secondary: #aeb4c0; --text-muted: #7c8290; --text-disabled: #565c68;\n  --action-solid: #ffffff; --action-solid-text: #0b0d12;\n  --blue-base: #3987e5; --green-base: #199e70; --amber-base: #c98500; --status-danger-fg: #e66767;\n  --font-sans: 'Space Grotesk', system-ui, sans-serif;\n  --font-serif-display: 'Newsreader', Georgia, serif;\n  --font-mono: 'JetBrains Mono', ui-monospace, monospace;\n}\n* { box-sizing: border-box; }\nhtml, body, #root { height: 100%; }\nbody { margin: 0; background: var(--bg-app); color: var(--text-primary); font-family: var(--font-sans); -webkit-font-smoothing: antialiased; }\na { color: inherit; }\n";
}
function genGitignore() { return "node_modules\ndist\ndist-ssr\n*.local\n.DS_Store\n.vscode/*\n!.vscode/extensions.json\n"; }
function genReadme(name) {
  return '# ' + (name || 'Lattice app') + '\n\nExported from **Lattice**. A Vite + React + TypeScript app.\n\n## Getting started\n\n```bash\nnpm install\nnpm run dev\n```\n\nThen open the printed local URL.\n\n## Structure\n\n- `src/pages/*` — one component per Lattice page (generated from the design).\n- `src/App.tsx` — hash router across the pages.\n- `src/assets/*` — images and other binaries you added in the editor.\n- `src/index.css` — design tokens + reset.\n\n> Generated pages are a faithful static starting point (position, size, fill, border, radius,\n> shadow, text, images). Refine them into idiomatic components as you go.\n';
}

function scaffoldFiles(pages, projectName) {
  return [
    { path: 'package.json', content: genPackageJson(projectName) },
    { path: 'index.html', content: genIndexHtml(projectName) },
    { path: 'vite.config.ts', content: genViteConfig() },
    { path: 'tsconfig.json', content: genTsconfig() },
    { path: 'tsconfig.node.json', content: genTsconfigNode() },
    { path: '.gitignore', content: genGitignore() },
    { path: 'README.md', content: genReadme(projectName) },
    { path: 'src/main.tsx', content: genMainTsx() },
    { path: 'src/index.css', content: genIndexCss() },
  ];
}

// ---------- zip (store / no compression) ----------

function crc32(u8) {
  let table = crc32._t;
  if (!table) {
    table = crc32._t = [];
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); table[n] = c >>> 0; }
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < u8.length; i++) crc = (crc >>> 8) ^ table[(crc ^ u8[i]) & 0xFF];
  return (crc ^ (-1)) >>> 0;
}
function strToU8(str) { return new TextEncoder().encode(str); }
function dataUrlToU8(dataUrl) {
  const bin = atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}
function zipBlob(entries) {
  const u16 = (n) => [n & 0xFF, (n >>> 8) & 0xFF];
  const u32 = (n) => [n & 0xFF, (n >>> 8) & 0xFF, (n >>> 16) & 0xFF, (n >>> 24) & 0xFF];
  const enc = new TextEncoder();
  const chunks = []; const central = []; let offset = 0;
  entries.forEach(e => {
    const nameBytes = enc.encode(e.name);
    const crc = crc32(e.data); const size = e.data.length;
    const local = new Uint8Array([].concat(u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(size), u32(size), u16(nameBytes.length), u16(0)));
    chunks.push(local, nameBytes, e.data);
    const cd = new Uint8Array([].concat(u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(size), u32(size), u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset)));
    central.push(cd, nameBytes);
    offset += local.length + nameBytes.length + e.data.length;
  });
  let cdSize = 0; central.forEach(c => { cdSize += c.length; });
  const end = new Uint8Array([].concat(u32(0x06054b50), u16(0), u16(0), u16(entries.length), u16(entries.length), u32(cdSize), u32(offset), u16(0)));
  return new Blob(chunks.concat(central, [end]), { type: 'application/zip' });
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function downloadText(filename, text) { downloadBlob(filename, new Blob([text], { type: 'text/plain;charset=utf-8' })); }

// Every file the exported project should contain: scaffold-defaults < generated < user assets.
function fullProjectFiles(pages, assets, projectName) {
  const map = {};
  scaffoldFiles(pages, projectName).forEach(f => { map[f.path] = { text: f.content }; });
  generatedFiles(pages).forEach(f => { map[f.path] = { text: f.content }; });
  (assets || []).forEach(a => {
    if (a.type === 'folder') return;
    map[a.path] = a.dataUrl ? { dataUrl: a.dataUrl } : { text: a.content || '' };
  });
  return Object.keys(map).sort().map(path => ({ name: path, data: map[path].dataUrl ? dataUrlToU8(map[path].dataUrl) : strToU8(map[path].text) }));
}

// ---------- tree ----------

function buildTree(entries) {
  const root = { name: '', path: '', dir: true, children: {} };
  const put = (path, isDir, meta) => {
    const parts = path.split('/').filter(Boolean);
    let node = root;
    parts.forEach((part, i) => {
      const last = i === parts.length - 1;
      const cur = node.children[part];
      if (!cur) {
        node.children[part] = { name: part, path: parts.slice(0, i + 1).join('/'), dir: last ? isDir : true, children: {}, meta: last ? meta : null };
      } else if (last) {
        cur.dir = isDir; cur.meta = meta || cur.meta;
      }
      node = node.children[part];
    });
  };
  entries.forEach(e => put(e.path, e.type === 'folder', e));
  return root;
}
function sortedChildren(node) {
  return Object.values(node.children).sort((a, b) => (a.dir === b.dir) ? a.name.localeCompare(b.name) : (a.dir ? -1 : 1));
}
const IMG_RE = /\.(png|jpe?g|gif|svg|webp|avif|ico|bmp)$/i;
function fileIcon(name) {
  if (IMG_RE.test(name)) return 'image';
  if (/\.(tsx|ts|jsx|js)$/.test(name)) return 'file-code';
  if (/\.css$/.test(name)) return 'palette';
  if (/\.json$/.test(name)) return 'braces';
  if (/\.md$/i.test(name)) return 'file-text';
  return 'file';
}

// ---------- component ----------

function CodePanel({ pages, activePageId, assets, onChangeAssets, projectName, settings }) {
  const { Button, Tag, Dialog, Input } = window.LatticeDesignSystem_e801cb;
  assets = assets || [];
  const setAssets = onChangeAssets || (() => {});

  const [railW, setRailW] = React.useState(() => {
    const n = parseInt(localStorage.getItem('lattice_code_rail') || '', 10);
    return isNaN(n) ? 250 : Math.max(180, Math.min(560, n));
  });
  React.useEffect(() => { try { localStorage.setItem('lattice_code_rail', String(railW)); } catch (e) {} }, [railW]);

  const gen = React.useMemo(() => generatedFiles(pages), [pages]);
  const hasScaffold = assets.some(a => a.path === 'package.json');

  // Merge generated (read-only) + assets (editable). Assets override generated at the same path.
  const displayEntries = React.useMemo(() => {
    const byPath = {};
    gen.forEach(f => { byPath[f.path] = { path: f.path, type: 'file', generated: true }; });
    assets.forEach(a => { byPath[a.path] = { path: a.path, type: a.type, mime: a.mime, generated: false }; });
    return Object.values(byPath);
  }, [gen, assets]);
  const tree = React.useMemo(() => buildTree(displayEntries), [displayEntries]);

  const defaultSel = React.useMemo(() => {
    const meta = pageMetaOf(pages);
    const act = meta.find(m => m.id === activePageId) || meta[0];
    return act ? 'src/pages/' + act.comp + '.tsx' : (gen[0] && gen[0].path) || '';
  }, [pages, activePageId, gen]);

  const [selPath, setSelPath] = React.useState(defaultSel);
  React.useEffect(() => { if (!displayEntries.some(e => e.path === selPath && e.type === 'file')) setSelPath(defaultSel); }, [defaultSel]); // eslint-disable-line
  const [expanded, setExpanded] = React.useState(() => ({ src: true, 'src/pages': true, 'src/assets': true }));
  const [copied, setCopied] = React.useState(false);
  const [dlg, setDlg] = React.useState(null); // { mode:'file'|'folder'|'rename', parent, path } + value
  const [dlgVal, setDlgVal] = React.useState('');
  const fileInputRef = React.useRef(null);
  const uploadTargetRef = React.useRef('src/assets');

  // Repaint tree/file icons after any structural change (idempotent).
  React.useEffect(() => { const t = setTimeout(() => window.renderLucideIcons && window.renderLucideIcons(), 0); return () => clearTimeout(t); });

  // Resolve the currently selected file to viewable content.
  const selAsset = assets.find(a => a.path === selPath && a.type === 'file');
  const selGen = !selAsset && gen.find(f => f.path === selPath);
  const selContent = selAsset ? (selAsset.dataUrl ? null : (selAsset.content || '')) : (selGen ? selGen.content : null);
  const selIsImage = selAsset && !!selAsset.dataUrl;
  const selEditable = !!selAsset && !selAsset.dataUrl;

  // ----- asset mutations -----
  const commit = (next) => setAssets(next);
  const pathExists = (p) => assets.some(a => a.path === p) || gen.some(f => f.path === p);
  const addTextFile = (parent, name) => {
    const path = (parent ? parent + '/' : '') + name;
    if (pathExists(path)) return;
    commit(assets.concat([{ id: 'as_' + Date.now().toString(36), path, type: 'file', content: '' }]));
    setSelPath(path);
  };
  const addFolder = (parent, name) => {
    const path = (parent ? parent + '/' : '') + name;
    if (assets.some(a => a.path === path)) return;
    commit(assets.concat([{ id: 'as_' + Date.now().toString(36), path, type: 'folder' }]));
    setExpanded(e => Object.assign({}, e, { [path]: true }));
  };
  const setFileContent = (path, content) => commit(assets.map(a => a.path === path ? Object.assign({}, a, { content }) : a));
  const removePath = (path) => {
    commit(assets.filter(a => a.path !== path && a.path.indexOf(path + '/') !== 0));
    if (selPath === path || selPath.indexOf(path + '/') === 0) setSelPath(defaultSel);
  };
  const renamePath = (path, newName) => {
    const parent = path.split('/').slice(0, -1).join('/');
    const to = (parent ? parent + '/' : '') + newName;
    if (pathExists(to)) return;
    commit(assets.map(a => {
      if (a.path === path) return Object.assign({}, a, { path: to });
      if (a.path.indexOf(path + '/') === 0) return Object.assign({}, a, { path: to + a.path.slice(path.length) });
      return a;
    }));
    if (selPath === path) setSelPath(to);
  };

  const doUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const parent = uploadTargetRef.current || 'src/assets';
    let added = assets.slice(); let lastPath = '';
    let pending = files.length;
    if (!pending) return;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        let base = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-');
        let path = parent + '/' + base; let i = 1;
        while (added.some(a => a.path === path)) { path = parent + '/' + base.replace(/(\.[^.]+)?$/, '-' + (i++) + '$1'); }
        added = added.concat([{ id: 'as_' + Date.now().toString(36) + '_' + i, path, type: 'file', mime: file.type, dataUrl: reader.result }]);
        lastPath = path;
        if (--pending === 0) { commit(added); setExpanded(x => Object.assign({}, x, { [parent]: true, src: true })); setSelPath(lastPath); }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };
  const triggerUpload = (parent) => { uploadTargetRef.current = parent || 'src/assets'; if (fileInputRef.current) fileInputRef.current.click(); };

  const initProject = () => {
    const existing = new Set(assets.map(a => a.path));
    const additions = scaffoldFiles(pages, projectName).filter(f => !existing.has(f.path))
      .map(f => ({ id: 'as_' + Math.random().toString(36).slice(2), path: f.path, type: 'file', content: f.content }));
    // ensure src/assets folder exists for uploads
    if (!assets.some(a => a.path === 'src/assets')) additions.push({ id: 'as_assets', path: 'src/assets', type: 'folder' });
    if (additions.length) commit(assets.concat(additions));
    setExpanded(e => Object.assign({}, e, { src: true, 'src/pages': true, 'src/assets': true }));
  };

  const exportZip = () => downloadBlob(slug(projectName) + '.zip', zipBlob(fullProjectFiles(pages, assets, projectName)));

  const handleCopy = () => {
    if (selContent == null) return;
    const text = selContent;
    try { if (navigator.clipboard) navigator.clipboard.writeText(text); } catch (e) {}
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };
  const handleExportOne = () => {
    if (selIsImage) return downloadBlob(selPath.split('/').pop(), new Blob([dataUrlToU8(selAsset.dataUrl)], { type: selAsset.mime || 'application/octet-stream' }));
    if (selContent != null) downloadText(selPath.split('/').pop(), selContent);
  };

  // ----- dialog helpers -----
  const openNew = (mode, parent) => { setDlg({ mode, parent }); setDlgVal(''); };
  const openRename = (path) => { setDlg({ mode: 'rename', path }); setDlgVal(path.split('/').pop()); };
  const submitDlg = () => {
    const v = dlgVal.trim(); if (!v) { setDlg(null); return; }
    if (dlg.mode === 'file') addTextFile(dlg.parent, v);
    else if (dlg.mode === 'folder') addFolder(dlg.parent, v);
    else if (dlg.mode === 'rename') renamePath(dlg.path, v);
    setDlg(null);
  };

  // ----- resizer -----
  const startResize = (e) => {
    e.preventDefault();
    const sx = e.clientX, cur = railW;
    const move = (ev) => setRailW(Math.max(180, Math.min(560, Math.round(cur + (ev.clientX - sx)))));
    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
    document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none';
  };

  // ----- tree rendering -----
  const rowBtn = { display: 'flex', alignItems: 'center', gap: 6, width: '100%', border: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 12.5, fontFamily: 'var(--font-mono)', padding: '4px 6px', color: 'var(--text-secondary)' };
  const iconBtn = (icon, title, onClick) => (
    <button type="button" title={title} onClick={onClick}
      style={{ width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 0, background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', borderRadius: 4 }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
      <i data-lucide={icon} style={{ width: 13, height: 13 }}></i>
    </button>
  );

  const renderNode = (node, depth) => {
    const pad = 6 + depth * 12;
    if (node.dir) {
      const open = expanded[node.path] !== false && (expanded[node.path] || depth < 1 || node.path === 'src' || node.path === 'src/pages' || node.path === 'src/assets');
      const isOpen = expanded[node.path] != null ? expanded[node.path] : open;
      return (
        <div key={node.path || 'root'}>
          {node.path !== '' && (
            <div className="lt-tree-row" style={{ display: 'flex', alignItems: 'center' }}>
              <button type="button" onClick={() => setExpanded(e => Object.assign({}, e, { [node.path]: !isOpen }))}
                style={Object.assign({}, rowBtn, { paddingLeft: pad, color: 'var(--text-primary)', fontWeight: 500 })}>
                <i data-lucide={isOpen ? 'chevron-down' : 'chevron-right'} style={{ width: 12, height: 12, opacity: 0.7 }}></i>
                <i data-lucide={isOpen ? 'folder-open' : 'folder'} style={{ width: 13, height: 13, opacity: 0.8 }}></i>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.name}</span>
              </button>
              <span className="lt-row-actions" style={{ display: 'flex', flex: 'none', opacity: 0 }}>
                {iconBtn('file-plus', 'New file', () => openNew('file', node.path))}
                {iconBtn('upload', 'Upload here', () => triggerUpload(node.path))}
                {!node.meta || node.meta.generated ? null : iconBtn('trash-2', 'Delete', () => removePath(node.path))}
              </span>
            </div>
          )}
          {isOpen && sortedChildren(node).map(c => renderNode(c, node.path === '' ? 0 : depth + 1))}
        </div>
      );
    }
    const selected = node.path === selPath;
    const isGen = node.meta && node.meta.generated;
    return (
      <div key={node.path} className="lt-tree-row" style={{ display: 'flex', alignItems: 'center', background: selected ? 'var(--surface-hover)' : 'transparent' }}>
        <button type="button" onClick={() => setSelPath(node.path)}
          style={Object.assign({}, rowBtn, { paddingLeft: pad + 14, color: selected ? 'var(--text-primary)' : 'var(--text-secondary)' })}>
          <i data-lucide={fileIcon(node.name)} style={{ width: 13, height: 13, opacity: 0.75 }}></i>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.name}</span>
          {isGen && <span style={{ fontSize: 9, color: 'var(--text-disabled)', letterSpacing: '0.08em' }}>gen</span>}
        </button>
        {!isGen && (
          <span className="lt-row-actions" style={{ display: 'flex', flex: 'none', opacity: 0 }}>
            {iconBtn('pencil', 'Rename', () => openRename(node.path))}
            {iconBtn('trash-2', 'Delete', () => removePath(node.path))}
          </span>
        )}
      </div>
    );
  };

  const langTag = selIsImage ? 'Image' : /\.css$/.test(selPath) ? 'CSS' : /\.(tsx|ts)$/.test(selPath) ? 'React + TS' : /\.json$/.test(selPath) ? 'JSON' : /\.md$/i.test(selPath) ? 'Markdown' : 'Text';

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', background: 'var(--bg-app)', position: 'relative' }}>
      <style>{'.lt-tree-row:hover .lt-row-actions{opacity:1 !important}.lt-tree-row:hover{background:var(--surface-hover)}'}</style>
      <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={doUpload} />

      {/* File explorer rail (resizable) */}
      <div style={{ width: railW, flex: 'none', borderRight: '1px solid var(--border-subtle)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '9px 8px 8px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', flex: 1 }}>Explorer</span>
          {iconBtn('file-plus', 'New file', () => openNew('file', 'src'))}
          {iconBtn('folder-plus', 'New folder', () => openNew('folder', 'src'))}
          {iconBtn('image-plus', 'Upload image', () => triggerUpload('src/assets'))}
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '6px 4px' }}>
          {renderNode(tree, 0)}
        </div>
        <div style={{ borderTop: '1px solid var(--border-subtle)', padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Button variant={hasScaffold ? 'ghost' : 'solid'} size="sm" fullWidth onClick={initProject}
            iconLeft={<i data-lucide={hasScaffold ? 'refresh-cw' : 'sparkles'}></i>}>
            {hasScaffold ? 'Update scaffold' : 'Initialize project'}
          </Button>
          <Button variant="outline" size="sm" fullWidth onClick={exportZip} iconLeft={<i data-lucide="folder-down"></i>}>Export project (.zip)</Button>
        </div>
      </div>

      {/* Resizer */}
      <div onMouseDown={startResize} title="Drag to resize"
        style={{ width: 6, marginLeft: -3, cursor: 'col-resize', flex: 'none', zIndex: 5, background: 'transparent' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--border-strong)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }} />

      {/* Viewer */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 12.5, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{selPath || '—'}</span>
          {selPath && <Tag shape="pill">{langTag}</Tag>}
          {selGen && <Tag shape="pill">generated</Tag>}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {!selIsImage && selContent != null && (
              <Button variant="ghost" size="sm" onClick={handleCopy} iconLeft={<i key={copied ? 'c' : 'o'} data-lucide={copied ? 'check' : 'copy'}></i>}>{copied ? 'Copied' : 'Copy'}</Button>
            )}
            {selPath && <Button variant="ghost" size="sm" onClick={handleExportOne} iconLeft={<i data-lucide="download"></i>}>Export</Button>}
          </div>
        </div>

        {selIsImage ? (
          <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-inset)', padding: 24 }}>
            <div style={{ textAlign: 'center' }}>
              <img src={selAsset.dataUrl} alt={selPath} style={{ maxWidth: '100%', maxHeight: '60vh', border: '1px solid var(--border-subtle)' }} />
              <div style={{ marginTop: 12, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                internal path: <span style={{ color: 'var(--text-secondary)' }}>{selPath}</span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-disabled)', marginTop: 4 }}>Use this path as an Image component source.</div>
            </div>
          </div>
        ) : selEditable ? (
          <textarea value={selContent} onChange={e => setFileContent(selPath, e.target.value)} spellCheck={false}
            style={{ flex: 1, minHeight: 0, resize: 'none', border: 0, outline: 'none', padding: '18px 20px', background: 'var(--surface-inset)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.7 }} />
        ) : selContent != null ? (
          <pre style={{ margin: 0, padding: '18px 20px', flex: 1, overflow: 'auto', fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.7, background: 'var(--surface-inset)', color: 'var(--text-secondary)' }}>
            <code style={{ whiteSpace: 'pre-wrap' }}>{selContent}</code>
          </pre>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Select a file to view.</div>
        )}
      </div>

      <Dialog open={!!dlg} onClose={() => setDlg(null)}
        title={dlg ? (dlg.mode === 'file' ? 'New file' : dlg.mode === 'folder' ? 'New folder' : 'Rename') : ''}
        footer={<><Button variant="ghost" size="sm" onClick={() => setDlg(null)}>Cancel</Button>
          <Button variant="solid" size="sm" onClick={submitDlg}>{dlg && dlg.mode === 'rename' ? 'Rename' : 'Create'}</Button></>}>
        <Input autoFocus label={dlg && dlg.mode === 'folder' ? 'Folder name' : dlg && dlg.mode === 'rename' ? 'New name' : 'File name (e.g. utils.ts)'}
          value={dlgVal} onChange={e => setDlgVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submitDlg(); }} />
        {dlg && dlg.parent && <div style={{ marginTop: 8, fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>in {dlg.parent}/</div>}
      </Dialog>
    </div>
  );
}
window.CodePanel = CodePanel;
