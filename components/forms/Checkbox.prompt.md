Square checkbox with optional label.

```jsx
<Checkbox label="Snap to grid" defaultChecked />
<Checkbox label="Lock aspect ratio" checked={locked} onChange={setLocked} />
```

Controlled via `checked`+`onChange(next, e)`, or uncontrolled via `defaultChecked`. Checked = solid white fill.
