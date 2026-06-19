Underline tab bar for switching panels/views.

```jsx
<Tabs tabs={['Design', 'Code', 'Relationships']} onChange={setTab} />
<Tabs tabs={[{value:'a',label:'Inspector'}]} value={tab} onChange={setTab} />
```

Accepts string or `{value,label}` items. Active tab = white underline + bold.
