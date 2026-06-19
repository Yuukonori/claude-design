Lattice's primary action control — use for any button; `solid` (white-on-black) is the primary action, one per view.

```jsx
<Button variant="solid">Generate code</Button>
<Button variant="outline" iconLeft={<i data-lucide="plus" />}>New frame</Button>
<Button variant="ghost" size="sm">Cancel</Button>
<Button variant="danger">Delete</Button>
```

Variants: `solid` | `outline` | `ghost` | `danger`. Sizes: `sm` (28px) | `md` (34px) | `lg` (42px). Props: `disabled`, `fullWidth`, `iconLeft`, `iconRight`. Sharp 0px corners; sentence-case labels.
