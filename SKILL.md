---
name: lattice-design
description: Use this skill to generate well-branded interfaces and assets for Lattice, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick orientation
- **Brand:** Lattice — a dark, monochrome, editorial UI-design tool. High-contrast near-black, **sharp 0px corners**, serif display (Newsreader) + grotesk UI (Space Grotesk) + mono (JetBrains Mono).
- **Tokens:** link `styles.css` (root) — it `@import`s everything in `tokens/`. Reference semantic vars (`--text-primary`, `--surface-card`, `--border-subtle`, `--action-solid`), never raw hex.
- **Components:** authored in `components/<group>/` as React + a `.d.ts` + a `.prompt.md`. Read each `*.prompt.md` for usage. They render off the CSS vars.
- **UI kit:** `ui_kits/lattice/` — the canvas editor, a worked example of composing the primitives.
- **Foundations:** `guidelines/*.html` are specimen cards for colors, type, spacing, brand.
- **Icons:** Lucide via CDN (`https://unpkg.com/lucide@latest`), 1.5px stroke, `currentColor`. No emoji.

## Rules of thumb
- Sentence case everywhere; ALL-CAPS only for tiny wide-tracked eyebrows. No emoji.
- Borders carry structure; shadows only on floating overlays. 0px radius (avatars/pills excepted).
- Monochrome-first: the "accent" is white. Semantic hues are muted and status-only.
- Motion is quick and mechanical (120–180ms, ease-out). No bounce.
