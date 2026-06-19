Centered modal over a blurred scrim. Title renders in the serif display face.

```jsx
<Dialog open={open} onClose={close}
  title="Delete frame?"
  description="Its 6 connections will be removed."
  footer={<><Button variant="ghost" onClick={close}>Cancel</Button><Button variant="danger">Delete</Button></>}
/>
```

Click scrim or × to close. Pass `children` for body content, `footer` for actions.
