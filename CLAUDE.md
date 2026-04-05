# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start Vite dev server (localhost:5173)
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
```

No test runner or linter is configured.

## Architecture

This is a **vanilla HTML/CSS/JS static site** built with Vite (no framework). The entire site is a single page.

| File | Purpose |
|---|---|
| `index.html` | Single-page markup — all sections in order |
| `style.css` | All styles (~560px centered column + trinket layer) |
| `main.js` | JS interactions — trinket sync, tooltip, SSH copy |
| `assets/trinkets/` | 6 grayscale margin photos (trinket-1.png … trinket-6.png) |
| `assets/icons/` | Company/project logos (lodestone, gebbs, humber, mit, ssh, shortsblock, etc.) |
| `assets/images/` | Section images (after-hobbies.jpeg) |
| `assets/profile.jpg` | Circular bio photo |
| `assets/favicon.svg` | Site favicon |
| `DESIGN.md` | Design system spec — read before any visual changes |

## Page Sections (top → bottom)

1. **Trinket Layer** — absolutely positioned grayscale photos in left/right margins (6 trinkets, aria-hidden)
2. **Bio** (`#bio`) — profile photo, 2-paragraph bio, social links row
3. **Projects** (`#projects`) — 4 project rows with 50×50 icon thumb, name, desc
4. **Work** (`#work`) — 2 work items (Lodestone, GeBBS Healthcare)
5. **Education** (`#education`) — 2 items (Humber Polytechnic, MIT ADT University)
6. **Volunteering** (`#volunteering`) — 5 items (HackTheBrain, Collision, Toronto Tech Week ×2, Sentry)
7. **Hobbies** (`#hobbies`) — prose paragraph + full-width image
8. **Footer** — GitHub · LinkedIn · Email links + copyright

## JS Interactions (main.js)

- **`syncTrinketLayer()`** — sets `.trinket-layer` height to `document.body.scrollHeight` on load/resize/ResizeObserver
- **Info tooltip** — `.info-wrap` click stops propagation so the parent `<a>` doesn't navigate
- **SSH copy** — clicking `.ssh-cmd` copies `data-cmd` to clipboard, shows "copied!" for 1.5s

## Design System (from DESIGN.md)

**Read DESIGN.md before modifying any styles.** Key rules:

- **560px centered column** (`.column`) — all content aligns to a single left axis within it
- **No 1px borders** — use vertical whitespace (64–80px gaps) or tonal background shifts (`#eeeeee`)
- **No drop shadows** — except on `.trinket` images (`box-shadow: 0 2px 8px rgba(0,0,0,0.12)`)
- **No blue links** — use `on_surface` (#1a1c1c) or `on_surface_variant` (#474747)
- **Tags use bracket syntax** — `[Tag]` or `·` separators, never pill backgrounds
- **Fonts** — system sans-serif body (`ui-sans-serif, -apple-system …`), `'Caveat'` (Google Fonts) for handwritten accents

### Color tokens
| Token | Value | Use |
|---|---|---|
| `--on-surface` | #1a1c1c | Primary text, headlines |
| `--on-surface-variant` | #474747 | Metadata, secondary text |
| `--on-surface-muted` | #888888 | Dots, placeholders |
| `--surface` | #ffffff | Page background |
| `--surface-container` | #eeeeee | Tonal section backgrounds |
| `--surface-container-low` | #f3f3f4 | Project hover state |
| `--outline-variant` | #c6c6c6 | Subtle dividers if needed |
| `--primary` | #000000 | Strongest emphasis |

### Spacing tokens
| Token | Value |
|---|---|
| `--section-gap` | 80px (56px mobile) |
| `--subsection-gap` | 48px (32px mobile) |
| `--item-gap` | 32px |
| `--column-width` | 560px |

### Trinket layer
Trinkets are absolutely positioned grayscale photos placed in the left/right margins outside the 560px column. They are `aria-hidden="true"` and must never overlap text. 6 trinkets currently placed. Hidden on mobile (< 600px) via `.trinket--margin { display: none }`. The `.trinket-layer` height is managed by `main.js`.

Each trinket uses inline `style` for `top`, `left`/`right`, `width`, and `transform: rotate(Xdeg)`.
`trinket-2` and `trinket-5` have a `.tape-effect` pseudo-strip element.
All trinket images use `filter: grayscale(100%) contrast(1.1) brightness(1.05)`.

### Project rows
`.project` is an `<a>` with a 50×50 `.project-thumb` (icon) and `.project-body` (name + desc).
On hover: siblings fade to `opacity: 0.6` via `:has(.project:hover) .project:not(:hover)`.
`ssh-portfolio` has an `.info-wrap` → `.info-btn` + `.info-tooltip` pattern with a `.ssh-cmd` click-to-copy.

### Work / Education / Volunteering rows
Shared `.work-item` pattern: 44×44 `.work-icon` + `.work-body` (company name + period on one line, role below).
