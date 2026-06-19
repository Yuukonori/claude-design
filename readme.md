# Lattice — Design System

> A dark, monochrome, editorial design system for **Lattice**, a web app for designing UI
> layouts on a canvas, mapping component relationships, and generating code from them.

Lattice is a tool for designers and design-engineers. The product surface is a large
working **canvas** where component nodes are placed, connected, and inspected — flanked by
dense panels (layers, inspector, code). The brand reflects that: high-contrast near-black,
sharp 0px corners, a serif for editorial moments and a grotesk for the dense working UI.

## Sources

This system was generated **from scratch** (no production codebase was available at build
time). The intended source repository was:

- `https://github.com/Yuukonori/claude-design` — empty at time of build.

When that repo (or the real frontend) is pushed, re-derive tokens, components, and screens
from it for accuracy. Until then this system encodes the brief: *modern & bold,
high-contrast, monochrome/near-black, dark UI, editorial serif + grotesk pairing, sharp
corners.* Explore the repo above to do a better, source-accurate job.

> **Font substitution flag:** No brand font files were provided. The system substitutes
> Google Fonts: **Newsreader** (serif display), **Space Grotesk** (UI/body), **JetBrains
> Mono** (code). Swap `tokens/fonts.css` + `--font-*` in `tokens/typography.css` for the
> real faces when available.

---

## CONTENT FUNDAMENTALS

How Lattice writes.

- **Voice:** confident, spare, technical-but-human. We sound like a sharp tool, not a
  cheerleader. Short declaratives. No exclamation points in product UI.
- **Person:** address the user as **you**; the product refers to itself in third person
  ("Lattice generates…") only in marketing, never "we" inside the app.
- **Casing:** **Sentence case everywhere** — buttons, menus, headers, titles. Never Title
  Case UI labels. ALL-CAPS is reserved for tiny eyebrow/overline labels with wide tracking
  (e.g. `COMPONENTS`, `INSPECTOR`).
- **Length:** labels are 1–2 words ("New frame", "Connect", "Generate code"). Tooltips and
  empty states get one short sentence. Marketing display lines can be a single bold serif
  clause.
- **Emoji:** **none.** Not in UI, not in marketing. The brand is monochrome and restrained.
- **Numbers & units:** terse and monospaced where they're data (`240×120`, `12px`,
  `3 connections`). Use `×` (not "x") for dimensions.
- **Verbs for actions:** prefer the concrete verb — *Connect, Detach, Duplicate, Generate,
  Inspect, Place* — over generic *Submit/OK/Done*.

**Example copy**
- Primary CTA: `Generate code`
- Empty canvas: `Nothing placed yet. Drag a component from the library to begin.`
- Destructive confirm: `Delete frame? Its 6 connections will be removed.`
- Eyebrow: `RELATIONSHIPS`
- Marketing headline (serif): *“Design the structure, not just the surface.”*

---

## VISUAL FOUNDATIONS

The look: a precise, near-black instrument with editorial typographic moments.

**Color**
- **Monochrome-first.** The entire UI is built from one cool neutral ramp (`--neutral-0`
  `#050506` → `--neutral-950` `#fafafa`). There is no colored brand accent — the "accent"
  is *white*. The primary action is white-on-near-black.
- **Semantic hues** (success/warning/danger/info) are deliberately **muted and
  desaturated** and appear only on status (badges, toasts, validation). They never decorate.
- Backgrounds step darkest→lighter as surfaces raise: `--bg-app` → `--surface` →
  `--surface-card` → `--surface-hover`.

**Type**
- **Serif display** (`Newsreader`) for big editorial headlines, empty-state titles, and
  marketing — often *italic* for emphasis. **Grotesk** (`Space Grotesk`) for all working
  UI and body. **Mono** (`JetBrains Mono`) for code, coordinates, dimensions, IDs.
- Display is set tight (`--leading-tight`, negative tracking). UI body is `14px`.

**Backgrounds**
- No photography, no gradients-as-decoration. The signature texture is the **Lattice grid**
  — a faint 24px dotted/lined grid (`.lattice-grid`, `--grid-line`) behind the canvas. Flat
  near-black elsewhere.

**Borders & structure**
- **Borders do the structural work**, not shadows. Hairlines (`--border-subtle`) separate
  panels; `--border-default` outlines controls; `--border-strong` on emphasis. 1px, crisp.

**Corners**
- **0px radius everywhere.** Sharp, architectural. The only exceptions: avatars
  (`--radius-full`) and the occasional pill toggle/tag (`--radius-pill`).

**Shadows**
- Used **only on floating overlays** (menus, dialogs, toasts) — deep and soft
  (`--shadow-md/lg/overlay`, black at 50–70%). Inline cards use borders, not shadow.

**Transparency & blur**
- Sparingly. Sticky topbars may use `--blur-overlay` (12px blur, slight saturate) over a
  translucent near-black. Selection highlight is white at 16%.

**Motion**
- Quick and mechanical: `--dur-fast 120ms` for hovers, `--dur-base 180ms` for state. Easing
  is `--ease-out` (decisive settle). **No bounce, no spring, no decorative loops.** Fades
  and 1–2px translateY only.

**Hover / press states**
- Hover: surfaces lighten one ramp step (`--surface-hover`); ghost buttons gain a faint
  fill; solid white buttons go to pure `#fff`. Borders may step from subtle→default.
- Press: a 1px downward nudge / brief opacity dip — never a scale-down bounce.

**Focus**
- A 1px offset white ring (`--focus-ring`), high contrast against near-black.

**Cards**
- Flat `--surface-card` fill, 1px `--border-subtle`, **0 radius, no shadow**. Density over
  decoration.

---

## ICONOGRAPHY

- **System:** [**Lucide**](https://lucide.dev) — loaded from CDN. Clean 1.5px stroke, 24px
  grid, no fill. It matches the monochrome, precise, technical character better than a
  filled set. *(Substitution flag: no brand icon set existed; Lucide is the closest match.
  Swap if the real product ships its own.)*
- **Usage:** icons inherit `currentColor` and sit at `--text-secondary` by default,
  brightening to `--text-primary` on hover. Standard sizes **16 / 18 / 20px**; stroke stays
  1.5px (Lucide default).
- **No emoji. No multicolor icons. No unicode glyphs as icons.** Arrows/chevrons come from
  Lucide too, not unicode.
- In HTML, load via CDN and call `lucide.createIcons()`:
  ```html
  <script src="https://unpkg.com/lucide@latest"></script>
  <i data-lucide="layout-grid"></i>
  ```
- **Logo:** a text wordmark — see `assets/logo.svg` / `assets/logo-mark.svg`. The mark is a
  monochrome lattice glyph. No raster logos.

---

## INDEX — what's in this system

**Foundations (root)**
- `styles.css` — the single entry point consumers link.
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `radius.css`, `effects.css`,
  `fonts.css`, `base.css`.
- `guidelines/` — foundation specimen cards (Design System tab).

**Assets** — `assets/logo.svg`, `assets/logo-mark.svg`.

**Components** — `components/` (see each `*.prompt.md`): Button, IconButton, Input, Select,
Checkbox, Switch, Badge, Tag, Avatar, Card, Tabs, Tooltip, Dialog, Toast (final set listed
in the Components section of the DS tab).

**UI kit** — `ui_kits/lattice/` — interactive recreation of the Lattice canvas editor.

**Skill** — `SKILL.md` (Agent-Skills compatible) + this `readme.md`.
