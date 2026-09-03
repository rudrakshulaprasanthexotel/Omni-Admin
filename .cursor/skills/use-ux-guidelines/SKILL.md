---
name: use-ux-guidelines
description: Apply cross-cutting UX decisions for supervisor interaction-detail surfaces — avatars, hover cards, filters, RBAC-aware controls, recording states, table column and pagination defaults, row click targets, and copy conventions. Use when implementing or reviewing any UI on dense supervisor tables, drawers, modals, or related interaction workflows.
---

# Use UX Guidelines

## Required reading

Read `docs/domain/glossary-and-permissions.md` and `docs/security/frontend-security.md` before gating or masking any control.

## Purpose

Individual feature specs own local scope, but several UX patterns must hold true **everywhere on interaction-detail surfaces** — not only where they were first defined. This skill is the single place those cross-cutting decisions live, so new work does not reinvent or contradict a pattern already settled elsewhere. When a decision here conflicts with a feature spec, this skill wins and the feature spec should be corrected.

## Avatars and identity representation

Shape encodes identity type, consistently, everywhere:

- **Customers → circular avatars.**
- **Users (agents/supervisors) → rounded-square avatars.**
- Apply wherever either appears: table Customer Name and User columns, hover cards, drawers, modals, and any future surface showing customer or user identity.
- **Fallback:** two-letter initials when no profile image exists, on a background color from a deterministic rule (exact palette rule still open — see Open questions).
- Avatar shape is the **only** visual cue distinguishing customer from user. Do not add a second redundant signal (for example, color-coding by type) that could conflict with other color coding (score thresholds, disposition states).

Supervisors scanning a dense table must tell customer from agent at a glance without reading text. One shape convention, reinforced everywhere, achieves that; breaking the convention in one surface re-trains pattern-matching every time it fails.

## Hover cards

Hovering a Customer Name or User cell shows a quick-glance profile card so supervisors do not leave the table to identify who they are viewing.

- Only one hover card visible at a time; opening a new one dismisses the previous.
- Dismiss when the pointer leaves both the triggering cell and the card.
- The avatar in the card header must exactly match the table row avatar (same shape, color, initials) — the hover should feel like a continuation of the same element, not a re-render.
- **Customer card** includes quick-action icons (Call, WhatsApp, Mail) to start a new interaction from the card.
- **User card** does not include quick-action icons — it is informational (Role, Channel, Skill, Campaigns), not actionable in the same way.
- **Customer card quick-action icons are RBAC-gated** — render enabled only when the logged-in supervisor has permission to start an interaction. When gated, use **disabled with tooltip**, not hidden and not silent failure — same principle as recording playback permissions.



## Filters system

Filtering is split into two distinct surfaces with different complexity budgets, not one monolithic filter builder.

### Quick filters

- Up to five filter categories pinned in the toolbar as chips (Customer, Channel, User, Date Range, Campaign by default).
- One click to access — no dropdown required for the most common filtering needs.
- The same categories also appear in the Filters dropdown left panel under a "Quick Filters" heading, reorderable/swappable (exact configurability still open).



### Filters (full dropdown)

- Three-part layout: left = category list (Quick Filters + Others), right = value-picker for the selected category, footer = Clear / Save Filter Combination / Clear All / Apply Filter.
- "Others" holds every non-pinned category (Channel Type, Queue, Status, Phone Numbers, Talk Time, Call IDs, QA Scoring, etc.).
- "Add Field" lets a supervisor bring customer attribute fields (Account ID, Customer Tier, social IDs, etc.) into the category list.
- Selected values in a category show as a numeric badge next to the category name (for example, "User 2").
- Filter combinations can be saved with a name, then reapplied or edited from a separate "Saved Filters" dropdown chip.



### Advanced filters (separate surface)

- AND/OR logic and contains/ends-with/starts-with/equals-style operators across fields — deliberately **not** part of the basic Filters dropdown.
- Split because it is a different mental model (condition-building) from basic Filters (category selection). Conflating them would over-complexify the surface most supervisors use most of the time.

**Principle:** basic Filters is optimized for "I know roughly what I want" (pick a category, pick values). Advanced Filters is optimized for "I need precise logic." Evaluate any future filtering capability against which mental model it fits before extending either surface.

## RBAC and privacy-aware rendering

Any control gated by permission or masking must communicate its own state clearly — never silently hide, never silently fail, and never look identical to an unrelated disabled state.


| Control                           | Gate                                | Behavior when gated                                                                                                         |
| --------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Channel Detail column             | Number masking (tenant/user config) | Phone number renders masked; email unaffected                                                                               |
| Row action icon (play/transcript) | View Recordings permission          | Icon disabled, tooltip explains missing permission; blocks both audio and transcript since both live behind the same drawer |
| Download action                   | Download Recordings permission      | Disabled with tooltip; view/play access remains if View Recordings is separately held                                       |
| Customer card quick-action icons  | Start Interaction permission        | Disabled with tooltip, not hidden                                                                                           |


**Standing principle:** permission-disabled, technical-state-disabled, and permanently-unavailable states must be visually distinguishable. A supervisor should always tell "I'm not allowed to" apart from "this isn't ready yet" apart from "this will never exist." One generic greyed-out icon for all three is a failure mode to guard against as new gated controls are added.

## Recording availability states

The row action icon reflects the recording's real technical state through five distinct icon + copy pairs — separate from RBAC states above, and never naming the underlying backend or infrastructure in any copy.


| State         | Icon             | Copy                                                                   |
| ------------- | ---------------- | ---------------------------------------------------------------------- |
| Available     | Play             | (no tooltip)                                                           |
| Not fetched   | Request icon     | "Request Audio"                                                        |
| Processing    | Spinner          | "Recording is still processing. It's usually ready in around 30 mins." |
| Not available | Muted icon       | "Recording is not available for this interaction." — no retry          |
| Failed        | Warning triangle | "Couldn't load the recording." with inline Retry                       |


**Processing covers one state for two triggers:** whether delay comes from native processing lag or from the supervisor clicking "Request Audio" on an on-demand recording, the experience must be identical. Supervisors should never need to know or care which backend an interaction's data lives in — infrastructure differences are handled inline, never surfaced as distinct UI states.

## Table philosophy

Reduce cognitive load by showing only the columns absolutely critical to user decision-making by default; keep everything else one click away.

### Columns

- Ship the **default visible columns exactly as specified in Figma**.
- All other available columns live in the table's **Manage Columns** control — searchable, toggleable, with Show/Hide All and Reset (Reset restores the Figma default set).
- Do not expose non-default columns in the main table view unless the supervisor explicitly enables them through Manage Columns.

### Pagination

- **Default page size:** 50 rows.
- **Page-size options:** 10, 50, 100, 200.
- Persist the supervisor's selected page size for the session where the table supports it.

## Row click target distinctions

A single table row has two click targets that must feel visually distinct:

- **Clicking the row itself** (outside any icon) → navigates to the CQA scoring screen (licensed feature).
- **Clicking the row action icon** (play/transcript) → opens the media drawer.

Use distinguishable hover states (row-level hover highlight vs. icon-level hover state) so a supervisor can tell, before clicking, which action they are about to trigger.

## Content and copy principles

Extend these patterns to any new copy on interaction-detail surfaces:

- **Never expose the real technical cause of a failure.** Use "Couldn't load the recording" and "Something went wrong. We couldn't load your interactions" as templates — no "API failed," "server error," "timeout," or similar internal language.
- **Retry only when retry could plausibly help.** Transient failure (Failed state) gets Retry; permanent state (Not available) does not.
- **Empty states are an invitation, not an apology.** No "Sorry," no exclamation marks; name what will appear and, where relevant, what to do next.
- **Search-empty states echo the actual query back** (for example, "No results for 'xcasdas'"), confirming the system understood the input.
- **No backend or internal terminology in any tooltip or message** — apply this as the first check to any new user-facing string.



## Rules

- Do not break avatar shape conventions on any surface that shows customer or user identity.
- Do not hide RBAC-gated controls without explicit product approval; default to disabled with tooltip.
- Do not conflate permission-disabled, processing, and permanently-unavailable UI states.
- Do not surface backend or infrastructure names in user-facing copy.
- Do not show non-Figma-default columns in the main table view without explicit supervisor choice via Manage Columns.
- Do not change the default page size away from 50 or omit any of the required page-size options (10, 50, 100, 200).
- Do not merge Advanced Filters logic into the basic Filters dropdown without evaluating mental-model fit.
- Do not offer Retry when the underlying state cannot change on retry.



## Stop conditions

Stop and request product-design direction when a feature spec conflicts with this skill, when RBAC or masking behavior is undefined for a new gated control, when a new filter capability does not clearly fit Quick/Basic or Advanced mental models, or when an open question above blocks a faithful implementation.