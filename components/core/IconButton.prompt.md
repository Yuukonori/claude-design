Square icon-only button for toolbars and panel headers; pass a Lucide icon as the child.

```jsx
<IconButton title="Zoom in"><i data-lucide="plus" /></IconButton>
<IconButton variant="outline" active><i data-lucide="grid-3x3" /></IconButton>
```

Variants: `ghost` (default) | `outline` | `solid`. Sizes `sm`/`md`/`lg`. Use `active` for toggled toolbar state. Always set `title` for accessibility.
