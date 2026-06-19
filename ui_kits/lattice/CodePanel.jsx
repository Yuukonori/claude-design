/* global React */
// Code view — generated code with a file rail and mono editor.
function CodePanel({ nodes }) {
  const { Tag, Button } = window.LatticeDesignSystem_e801cb;
  const [file, setFile] = React.useState('PricingPage.tsx');
  const files = ['PricingPage.tsx', 'PricingCard.tsx', 'styles.css'];

  const code = [
    { t: 'export function ', c: 'var(--text-secondary)' }, { t: 'PricingPage', c: 'var(--blue-base)' }, { t: '() {\n', c: 'var(--text-secondary)' },
    { t: '  return (\n', c: 'var(--text-muted)' },
    { t: '    <Section', c: 'var(--green-base)' }, { t: ' layout=', c: 'var(--text-secondary)' }, { t: '"grid"', c: 'var(--amber-base)' }, { t: ' gap=', c: 'var(--text-secondary)' }, { t: '{24}', c: 'var(--amber-base)' }, { t: '>\n', c: 'var(--green-base)' },
    { t: '      <Heading', c: 'var(--green-base)' }, { t: '>Simple pricing</Heading>\n', c: 'var(--text-primary)' },
    { t: '      {plans.map(', c: 'var(--text-muted)' }, { t: 'plan', c: 'var(--text-primary)' }, { t: ' => (\n', c: 'var(--text-muted)' },
    { t: '        <PricingCard', c: 'var(--green-base)' }, { t: ' key=', c: 'var(--text-secondary)' }, { t: '{plan.id}', c: 'var(--amber-base)' }, { t: ' {...plan} />\n', c: 'var(--text-secondary)' },
    { t: '      ))}\n', c: 'var(--text-muted)' },
    { t: '    </Section>\n', c: 'var(--green-base)' },
    { t: '  );\n}', c: 'var(--text-muted)' },
  ];

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', background: 'var(--bg-app)' }}>
      <div style={{ width: 200, flex: 'none', borderRight: '1px solid var(--border-subtle)', padding: 10, background: 'var(--surface)' }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', margin: '4px 6px 10px' }}>Generated</div>
        {files.map(f => (
          <button key={f} onClick={() => setFile(f)} style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 8px',
            background: f === file ? 'var(--surface-hover)' : 'transparent', border: 0,
            color: f === file ? 'var(--text-primary)' : 'var(--text-secondary)',
            cursor: 'pointer', fontSize: 12.5, fontFamily: 'var(--font-mono)', textAlign: 'left',
          }}>
            <i data-lucide="file-code" style={{ width: 13, height: 13, opacity: 0.7 }}></i>{f}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 12.5, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{file}</span>
          <Tag shape="pill">React + TS</Tag>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <Button variant="ghost" size="sm" iconLeft={<i data-lucide="copy"></i>}>Copy</Button>
            <Button variant="outline" size="sm" iconLeft={<i data-lucide="download"></i>}>Export</Button>
          </div>
        </div>
        <pre style={{ margin: 0, padding: '18px 20px', flex: 1, overflow: 'auto', fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.7, background: 'var(--surface-inset)' }}>
          <code style={{ whiteSpace: 'pre-wrap' }}>
            {code.map((s, i) => <span key={i} style={{ color: s.c }}>{s.t}</span>)}
          </code>
        </pre>
      </div>
    </div>
  );
}
window.CodePanel = CodePanel;
