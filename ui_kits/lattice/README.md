# Lattice — UI kit

Interactive, high-fidelity recreation of the **Lattice canvas editor** — the product's
primary surface. Built entirely from this design system's component primitives
(`window.LatticeDesignSystem_e801cb`) over the global tokens in `styles.css`.

## Run
Open `index.html`. It loads React + Babel + the compiled `_ds_bundle.js` + Lucide icons,
then mounts `<LatticeApp/>`.

## Screens / states
- **Design view** — three-pane editor: component **Library + Layers** (left), the
  **canvas** with node frames + connection lines on the lattice grid (center), and the
  **Inspector** (right). Click any node or layer to select; the inspector reflects it.
- **Code view** — generated React + TS with a file rail and syntax-tinted mono editor.
- **Relationships view** — the node graph as a dependency list.
- **Share dialog** + **toasts** — modal and transient feedback.

## Interactions
- Click a library tile → places a new node + toast.
- Select nodes on canvas / in layers / from the Relationships list.
- Switch views via the topbar tabs. **Generate code** jumps to Code view with a toast.
- **Share** opens the dialog; Copy link fires a success toast.

## Files
`App.jsx` (orchestrator + state) · `Topbar.jsx` · `LibraryPanel.jsx` · `Canvas.jsx` ·
`Inspector.jsx` · `CodePanel.jsx` · `RelationshipsView.jsx`

## Note
This is a from-brief recreation (no production source was available). When the real
frontend exists, cross-reference node/inspector/code behaviors and refine.
