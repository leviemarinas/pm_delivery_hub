# Prototype Instructions

Run the local server yourself and open the preview in the in-app browser. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Design decisions

- `src/styles.css` is organized as a token-first design system ("Design System v2"): CSS custom properties for ink/surface colors, brand blues, semantic tones, elevation shadows (`--shadow-xs` → `--shadow-lg`), radii (`--r-sm/md/lg`), and a shared easing curve (`--ease`). New components must consume these tokens rather than hardcoding values.
- Statuses, priorities, scope, and MoSCoW indicators render as tinted pills (soft background + strong foreground of the same hue), not bare colored text.
- The presentation deck keeps its own purple token set (`--ppt-*`) scoped to `.sprint-slide`; product chrome stays on the blue/navy tokens.
- The Requirements page (searchable source document) must stay reachable from the sidebar; Overview's "Source questions" action depends on it.
