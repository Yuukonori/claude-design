/* global window */
// Run engine — turns the project's generated source files into a REAL running app in the browser, so a
// successful Run implies a successful export (both execute the same src/*.tsx). It builds a self-
// contained HTML document that loads React + Babel from the same CDN the editor uses, embeds every
// project file, and compiles/executes them through a tiny CommonJS module loader. The webpage window
// (and, in debug, a console window) are plain popups written by App.jsx via document.write.
//
// Why the loader compiles with preset order [env(commonjs), react, typescript]: Babel runs presets in
// REVERSE, so typescript -> react -> env. React must lower JSX to `React.createElement(...)` BEFORE the
// module transform renames the imported `React` binding to `_interopRequireDefault(require('react'))`,
// or the JSX would reference a variable the module transform already rewrote. Getting this wrong is the
// classic "React is not defined" at runtime.

const RUN_CDN = {
  react: 'https://unpkg.com/react@18.3.1/umd/react.development.js',
  reactDom: 'https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js',
  babel: 'https://unpkg.com/@babel/standalone@7.29.0/babel.min.js',
};

// Embed a JSON blob safely inside a <script type="application/json"> tag. Only "<" needs neutralising
// (so "</script>" can't close the tag); the value is read back via textContent + JSON.parse, not as a
// JS string literal, so line separators are harmless.
function safeJson(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

// The module loader + optional debug harness that runs INSIDE the popup. Serialised to a string; `OPTS`
// is injected ahead of it. Kept dependency-free and ES5-ish so it runs before any transform.
function runtimeBootSrc() {
  return function LATTICE_BOOT() {
    var FILES = window.__LATTICE_FILES || {};
    var OPTS = window.__LATTICE_OPTS || {};
    var MOD = {};

    // ---- debug capture + controls harness ----
    var paused = false;
    function fmt(v) {
      if (typeof v === 'string') return v;
      try { return JSON.stringify(v); } catch (e) { return String(v); }
    }
    function send(kind, payload) {
      try { if (window.opener && !window.opener.closed) window.opener.postMessage({ __lattice: true, ch: OPTS.channel, kind: kind, payload: payload, t: Date.now() }, '*'); } catch (e) { /* opener gone */ }
    }
    if (OPTS.debug) {
      ['log', 'info', 'warn', 'error', 'debug'].forEach(function (m) {
        var orig = console[m] ? console[m].bind(console) : function () {};
        console[m] = function () { var a = [].slice.call(arguments); send('console', { level: m, text: a.map(fmt).join(' ') }); orig.apply(null, arguments); };
      });
      window.addEventListener('error', function (e) { send('console', { level: 'error', text: (e.message || 'Error') + (e.filename ? ('  ' + e.filename + ':' + e.lineno) : '') }); });
      window.addEventListener('unhandledrejection', function (e) { var r = e.reason || {}; send('console', { level: 'error', text: 'Unhandled rejection: ' + (r.message || r) }); });
      var of = window.fetch;
      if (of) window.fetch = function (u, o) {
        var url = (u && u.url) || u, t0 = Date.now();
        send('net', { phase: 'start', url: String(url), method: (o && o.method) || 'GET' });
        return of.apply(this, arguments).then(function (r) { send('net', { phase: 'end', url: String(url), status: r.status, ms: Date.now() - t0 }); return r; },
          function (err) { send('net', { phase: 'error', url: String(url), error: String(err), ms: Date.now() - t0 }); throw err; });
      };
      var OX = window.XMLHttpRequest;
      if (OX) {
        window.XMLHttpRequest = function () {
          var x = new OX(), open = x.open, url = '', method = 'GET', t0 = 0;
          x.open = function (m, u) { method = m; url = u; return open.apply(x, arguments); };
          x.addEventListener('loadstart', function () { t0 = Date.now(); send('net', { phase: 'start', url: String(url), method: method }); });
          x.addEventListener('loadend', function () { send('net', { phase: 'end', url: String(url), status: x.status, ms: Date.now() - t0 }); });
          return x;
        };
      }
    }
    // Pause = gate requestAnimationFrame (best-effort freeze of rAF-driven motion) + overlay badge.
    var rAF = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = function (cb) { return rAF(function (t) { if (paused) { rAF(function () { window.requestAnimationFrame(cb); }); return; } cb(t); }); };
    window.addEventListener('message', function (e) {
      var d = e.data; if (!d || !d.__latticeCtl) return;
      if (d.cmd === 'pause') { paused = true; badge(true); }
      else if (d.cmd === 'resume') { paused = false; badge(false); }
    });
    function badge(on) {
      var el = document.getElementById('__lattice_pause');
      if (on && !el) { el = document.createElement('div'); el.id = '__lattice_pause'; el.textContent = 'Paused'; el.style.cssText = 'position:fixed;top:10px;right:10px;z-index:2147483647;background:#000c;color:#fff;font:600 12px/1 system-ui;padding:7px 10px;border-radius:6px;pointer-events:none'; document.body.appendChild(el); }
      else if (!on && el) { el.remove(); }
    }

    // ---- CommonJS module loader over the embedded file map ----
    function norm(p) { var out = []; p.split('/').forEach(function (s) { if (!s || s === '.') return; if (s === '..') out.pop(); else out.push(s); }); return out.join('/'); }
    function dir(p) { return p.indexOf('/') < 0 ? '' : p.replace(/\/[^/]*$/, ''); }
    function pick(base) {
      var c = [base, base + '.tsx', base + '.ts', base + '.jsx', base + '.js', base + '/index.tsx', base + '/index.ts', base + '/index.jsx', base + '/index.js'];
      for (var i = 0; i < c.length; i++) if (FILES[c[i]] != null) return c[i];
      return null;
    }
    function resolve(from, spec) { if (spec[0] === '.') return pick(norm(dir(from) + '/' + spec)); return spec; }
    function isCss(p) { return /\.css$/.test(p); }
    function isAsset(p) { return /\.(png|jpe?g|gif|svg|webp|avif|ico|bmp|woff2?|ttf|otf|mp4|webm|mp3)$/i.test(p); }
    function req(from) {
      return function (spec) {
        if (spec === 'react') return window.React;
        if (spec === 'react-dom') return window.ReactDOM;
        if (spec === 'react-dom/client') return { createRoot: window.ReactDOM.createRoot, hydrateRoot: window.ReactDOM.hydrateRoot };
        if (spec === 'react/jsx-runtime' || spec === 'react/jsx-dev-runtime') {
          var R = window.React; var j = function (t, p) { var props = {}, ch = []; for (var k in p) { if (k === 'children') ch = [].concat(p[k]); else props[k] = p[k]; } return R.createElement.apply(R, [t, props].concat(ch)); };
          return { jsx: j, jsxs: j, jsxDEV: j, Fragment: R.Fragment };
        }
        var path = resolve(from, spec);
        if (!path) throw new Error('Cannot resolve "' + spec + '" from "' + from + '"');
        return load(path);
      };
    }
    function load(path) {
      if (MOD[path]) return MOD[path].exports;
      var f = FILES[path];
      if (f == null) throw new Error('Module not found: ' + path);
      if (isCss(path)) { var st = document.createElement('style'); st.textContent = f.text || ''; document.head.appendChild(st); MOD[path] = { exports: {} }; return MOD[path].exports; }
      if (f.dataUrl != null || (isAsset(path) && f.text != null)) { MOD[path] = { exports: { 'default': f.dataUrl != null ? f.dataUrl : f.text, __esModule: true } }; return MOD[path].exports; }
      if (/\.json$/.test(path)) { MOD[path] = { exports: JSON.parse(f.text || '{}') }; return MOD[path].exports; }
      var out;
      try {
        out = window.Babel.transform(f.text || '', {
          filename: path,
          presets: [['env', { modules: 'commonjs', targets: { chrome: '100' } }], 'react', 'typescript'],
        }).code;
      } catch (e) { throw new Error('Compile error in ' + path + '\n' + (e.message || e)); }
      var module = { exports: {} };
      MOD[path] = module; // register before eval so cyclic imports see the partial module
      try { new Function('require', 'module', 'exports', out)(req(path), module, module.exports); }
      catch (e) { delete MOD[path]; throw new Error('Runtime error in ' + path + '\n' + (e && e.stack || e)); }
      return module.exports;
    }

    // ---- entry ----
    function fail(err) {
      var msg = (err && (err.stack || err.message)) || String(err);
      send('console', { level: 'error', text: msg });
      var root = document.getElementById('root') || document.body;
      root.innerHTML = '<pre style="margin:0;padding:20px;white-space:pre-wrap;font:12px/1.6 ui-monospace,monospace;color:#e66767;background:#0b0d12;min-height:100vh">Run failed:\n\n' + String(msg).replace(/</g, '&lt;') + '</pre>';
      send('status', { state: 'error' });
    }
    try {
      var entry = pick('src/main') || pick('src/index');
      if (!entry) throw new Error('No entry file (expected src/main.tsx).');
      send('status', { state: 'compiling' });
      load(entry);
      send('status', { state: 'running' });
    } catch (e) { fail(e); }
  }.toString();
}

// Build the full self-contained HTML for the run window. `opts`: { title, debug, channel }.
function buildRunnableHtml(fileMap, opts) {
  opts = opts || {};
  const optJson = safeJson({ debug: !!opts.debug, channel: opts.channel || 'run' });
  const filesJson = safeJson(fileMap || {});
  const boot = runtimeBootSrc();
  return '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1" />\n<title>' +
    String(opts.title || 'Lattice app').replace(/</g, '&lt;') + '</title>\n' +
    '<style>html,body{margin:0;height:100%;background:#0b0d12}#root{min-height:100vh}</style>\n</head>\n<body>\n<div id="root"></div>\n' +
    '<script>window.__LATTICE_OPTS=' + optJson + ';</script>\n' +
    '<script id="__lattice_files" type="application/json">' + filesJson + '</script>\n' +
    '<script src="' + RUN_CDN.react + '" crossorigin></script>\n' +
    '<script src="' + RUN_CDN.reactDom + '" crossorigin></script>\n' +
    '<script src="' + RUN_CDN.babel + '" crossorigin></script>\n' +
    '<script>\n' +
    'window.__LATTICE_FILES = JSON.parse(document.getElementById("__lattice_files").textContent);\n' +
    'function __latticeStart(){ if(!(window.React&&window.ReactDOM&&window.Babel)){ return setTimeout(__latticeStart,30); } (' + boot + ')(); }\n' +
    '__latticeStart();\n' +
    '</script>\n</body>\n</html>\n';
}

// Simple log-viewer document for the debug console window. The editor (opener) appends rows via
// win.__latticeLog(entry) — no scripts needed inside beyond the helper.
function buildConsoleHtml(title) {
  return '<!doctype html>\n<html><head><meta charset="utf-8"/><title>' + String(title || 'Console').replace(/</g, '&lt;') +
    '</title>\n<style>\n:root{color-scheme:dark}body{margin:0;background:#0b0d12;color:#e7e9ee;font:12px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace}\n' +
    '#bar{position:sticky;top:0;display:flex;gap:8px;align-items:center;padding:7px 12px;background:#12161d;border-bottom:1px solid #2a2f3a;font-family:system-ui}\n' +
    '#bar b{font-size:12px}#bar button{margin-left:auto;background:#1a1f2a;color:#aeb4c0;border:1px solid #2a2f3a;border-radius:4px;padding:4px 9px;cursor:pointer;font:inherit}\n' +
    '#log{padding:6px 0}.row{padding:3px 12px;border-bottom:1px solid #14181f;white-space:pre-wrap;word-break:break-word;display:flex;gap:8px}\n' +
    '.t{color:#565c68;flex:none}.tag{flex:none;font-weight:600;text-transform:uppercase;font-size:9.5px;letter-spacing:.05em;padding:1px 5px;border-radius:3px;height:14px;line-height:12px}\n' +
    '.log .tag{background:#1a1f2a;color:#7c8290}.info .tag{background:#13314f;color:#6fb0ff}.warn .tag{background:#3a2f10;color:#e0b64b}.error{color:#ffb4b4}.error .tag{background:#4a1d1d;color:#ff9a9a}.net .tag{background:#123528;color:#57c99a}.build .tag{background:#241a3a;color:#b48bff}\n' +
    '</style></head><body>\n<div id="bar"><b>Console</b><span id="cnt" style="color:#7c8290"></span><button onclick="document.getElementById(\'log\').innerHTML=\'\'">Clear</button></div>\n<div id="log"></div>\n' +
    '<script>\n(function(){var n=0;window.__latticeLog=function(e){n++;var d=document.createElement("div");d.className="row "+(e.cls||"log");var ts=new Date(e.t||Date.now());var hh=("0"+ts.getHours()).slice(-2)+":"+("0"+ts.getMinutes()).slice(-2)+":"+("0"+ts.getSeconds()).slice(-2);d.innerHTML=\'<span class="t"></span><span class="tag"></span><span class="msg"></span>\';d.querySelector(".t").textContent=hh;d.querySelector(".tag").textContent=(e.tag||"log");d.querySelector(".msg").textContent=e.text||"";var log=document.getElementById("log");log.appendChild(d);document.getElementById("cnt").textContent=n+" entries";window.scrollTo(0,document.body.scrollHeight);};})();\n</script>\n</body></html>\n';
}

window.buildRunnableHtml = buildRunnableHtml;
window.buildConsoleHtml = buildConsoleHtml;
