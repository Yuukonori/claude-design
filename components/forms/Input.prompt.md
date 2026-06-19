Text field with optional label, leading icon, hint, and error.

```jsx
<Input label="Frame name" placeholder="Untitled frame" />
<Input iconLeft={<i data-lucide="search" />} placeholder="Search components" />
<Input label="Width" error="Must be a number" defaultValue="abc" />
```

Sizes `sm`/`md`/`lg`. Pass `error` to show red border + message. Dark inset field, sharp corners, white focus ring.
