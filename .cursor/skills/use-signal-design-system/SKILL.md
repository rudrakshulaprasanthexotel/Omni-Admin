---
name: use-signal-design-system
description: Translate Figma UI into React using the approved Signal design system. Use for screens, widgets, layouts, component variants, tokens, responsive behavior, themes, accessibility, motion, visual regression, UX Constitution guidance, MCP-backed component selection, or proposals for a missing Signal primitive.
---

# Use Signal Design System

## Required reading

Read `docs/design-system/signal-and-figma.md`, `docs/security/frontend-security.md`, and the relevant controlled-widget sections of UI-P01 and UI-P04.

## Source of truth

The Signal design system is consumed live, not vendored into this repository:

- **Package:** [`@exotel-npm-dev/signal-design-system`](https://www.npmjs.com/package/@exotel-npm-dev/signal-design-system) on npm — install and import components; do not copy component source into feature code.
- **Storybook:** <https://69ba4becb6eabba83cbd8bc1-hcpfzhpmvz.chromatic.com/> — browsable reference for components, variants, and states.
- **MCP server `signal-storybook`** — direct access to the design system and UX Constitution. Configure:

  ```json
  {
    "mcpServers": {
      "signal-storybook": {
        "url": "https://main--69ba4becb6eabba83cbd8bc1.chromatic.com/mcp"
      }
    }
  }
  ```

Always query the MCP server before selecting or implementing a component — do not guess an API from Storybook screenshots or prior memory. Record the exact package version, theme entry point, token source, icon package, and Figma library URL once a feature first pins them.

## UX Constitution

The UX Constitution is the normative source for how each Signal component is meant to be used. It is maintained per component (one file per component — for example, button, dialog, drawer) and covers:

- Copy conventions (for example, call-to-action text case and length).
- When to use one component over a related one (for example, dialog vs. drawer).
- Component-specific usage, content, and interaction rules.

Do not duplicate UX Constitution content into this repository — it changes independently of this codebase. Retrieve it through the `signal-storybook` MCP server for the exact component in scope, and treat it as authoritative over assumptions from visual inspection alone.

## Workflow

1. Inspect the exact Figma node and its instances, variants, variables, constraints, content, and interaction states.
2. Map each Figma component to an approved Signal import and variant; confirm the mapping and UX Constitution guidance via the MCP server.
3. Use Signal tokens for layout, typography, color, spacing, radius, elevation, iconography, motion, and breakpoints.
4. Record an unmapped design as a design-system gap before creating a shared primitive.
5. Build controlled components with typed props and semantic events; keep route/query/action behavior outside reusable widgets.
6. Verify loading, empty, partial, error, denied, success, keyboard, focus, zoom, localization, reduced-motion, responsive, and content-extreme states.
7. Compare the rendered screen with Figma at agreed viewports and content extremes.
8. Add behavior, accessibility, and visual evidence appropriate to the change.
9. Run `pnpm agent:verify:changed`.

## Component mapping

| Figma component | Signal component/import | Approved variants | Notes/gaps |
|---|---|---|---|
| Pending | Pending | Pending | Populate from the supplied design system |

Do not claim a mapping is approved while this table still says `Pending`.

## Rules

- Do not hard-code a value when an approved Signal token exists.
- Do not guess a Signal API or copy design-system source into a feature.
- Do not use CSS selectors, text labels, or visual coordinates as copilot contracts.
- Do not add a generic shared component for a single feature without demonstrated reuse.
- Do not use Figma node IDs as application IDs.
- Do not describe a local composition as an approved shared primitive.
- Preserve native semantics, accessible names, focus order, keyboard interaction, and visible focus.
- Treat translated or dynamic text as content, not as a stable identifier.

## Design-system gap process

A gap proposal must include:

- Figma evidence and affected screens.
- Missing behavior or variant.
- Accessibility requirements.
- Proposed token/component API.
- Why composition of existing Signal components is insufficient.
- Ownership, tests, migration impact, and decision record when shared globally.

Feature teams may create a narrowly scoped composition while a gap is reviewed, but must not present it as an approved Signal primitive.

## Visual verification

Define stable viewports, fonts, browser, animations, and synthetic data for visual regression. Visual snapshots complement behavior and accessibility tests; they do not replace them.

## Stop conditions

Stop when the Figma frame, Signal package/component mapping, responsive intent, accessibility behavior, or token source is unavailable. This repository currently records those inputs as pending.
