# CLAUDE.md

## Project
GTM Signal Orchestrator is a production-style internal GTM operations tool.
The current goal is to build a polished, recruiter-friendly foundation milestone.

---

## Your role
You own the frontend and UI layer only.

You may:
- build and refine page UI
- create reusable presentational components
- improve layout, spacing, typography, charts, tables, badges, filters
- add loading, empty, error, and not-found states
- improve responsiveness
- improve visual consistency across pages

You may work in:
- app/dashboard/page.tsx
- app/accounts/page.tsx
- app/accounts/[id]/page.tsx
- components/**
- app/layout.tsx
- styling-related files
- small helper utilities used only for presentation

---

## Do not change
Do not modify these unless explicitly asked:
- prisma/schema.prisma
- app/api/**
- lib/db/**
- lib/scoring/**
- lib/routing/**
- seed scripts
- backend business logic
- data contracts and field names returned from server functions

---

## Design toolchain

Every non-trivial UI task must flow through this three-tool design pipeline before a single line of component code is written. These tools set the visual standard — code implements what they define.

### 1. Google Stitch MCP — visual mockup generation
**What it is:** Google Labs' AI design platform that turns text prompts, voice, and sketches into layered, interactive UI mockups with exportable code. Free at stitch.withgoogle.com. MCP server: github.com/davideast/stitch-mcp.

**When to use:** At the start of any new page, section, or layout change. Before writing JSX, use Stitch to generate a visual mockup from a plain-English description of the component or page.

**Workflow:**
1. Connect the Stitch MCP server if available in the session
2. Prompt Stitch with the page/component goal, audience, and tone (e.g. "internal GTM dashboard, dark, minimal, data-dense")
3. Iterate on the canvas until the mockup matches the desired layout
4. Export the mockup or use Stitch's generated code as a direct implementation reference
5. Proceed to coding with the mockup as the visual contract

### 2. Nano Banana 2 — AI image and UI mockup generation inside Claude Code
**What it is:** A Claude Code skill/plugin powered by Gemini image models (Nano Banana 2 uses Gemini 2.5 Flash Image; Nano Banana Pro uses Gemini 3 Pro Image). Generates UI mockups, visual references, icons, and assets without leaving the coding session.

**Install:** `npx claude install kingbootoshi/nano-banana-2-skill` or install via the Claude plugin marketplace.

**When to use:** When Stitch is not connected, or when you need a fast visual reference for a specific component, illustration, or asset during an implementation session. Use `/nano-banana` to trigger image generation inline.

**Workflow:**
1. Describe the component or visual with design constraints (colors, style, layout)
2. Gemini generates a mockup in ~10 seconds
3. Review and iterate with follow-up prompts
4. Implement directly from the generated reference in the same session

### 3. UI UX Pro Max — design system intelligence
**What it is:** A Claude skill with 161 industry-specific reasoning rules, 67 UI styles, 161 color palettes, 57 font pairings, and a multi-domain design system generator. GitHub: nextlevelbuilder/ui-ux-pro-max-skill.

**Install:**
```
npm install -g uipro-cli
uipro init --ai claude
```
Or via Claude marketplace: `/plugin install ui-ux-pro-max@ui-ux-pro-max-skill`

**When to use:** At the start of any project or major redesign. Use UI UX Pro Max to generate the full design system — colors, typography, component patterns, effects, and anti-patterns — before touching any CSS or Tailwind classes.

**Design system persistence:** Output goes into:
- `design-system/MASTER.md` — global source of truth
- `design-system/pages/[name].md` — page-specific overrides

All Tailwind color choices, font pairings, shadow styles, and animation timings must align with the generated design system. Do not freestyle these choices.

### 4. 21st.dev — component library
**What it is:** The "npm for design engineers." The largest open-source marketplace of shadcn/ui-based React + Tailwind components, with 1,000+ production-ready blocks including 3D, animated, and reactive components. Used by 1.4M developers.

**Install any component:**
```
npx shadcn@latest add https://21st.dev/r/[component-name]
```

**When to use:** Before building any UI component from scratch, check 21st.dev first. If a suitable component exists, install it and adapt it — do not rebuild what already exists at production quality.

**What's available:** Navigation, cards, tables, charts, filters, badges, modals, hero sections, dashboards, 3D elements, animated transitions, data visualizations, forms, and more — all Tailwind + shadcn compatible.

**Rule:** Only build a component from scratch if 21st.dev has nothing suitable. When in doubt, browse first.

---

## Execution mode

When given a frontend task, execute it in full without stopping to ask questions — unless you are genuinely blocked by a missing backend contract or an ambiguous requirement that cannot be inferred.

### Phase-based execution
Break all non-trivial work into sequential phases. Each phase must have a clear goal, a list of files to touch, full implementation (no placeholders, no TODOs), and a git commit.

**Phase order for UI work:**

**Phase 0 — Design (always first)**
- Use Stitch MCP or Nano Banana 2 to generate a visual mockup of the target layout
- Run UI UX Pro Max to generate or consult the existing design system
- Browse 21st.dev for installable components that cover the needed UI surface
- Produce a design reference (mockup image or Stitch export) before writing any code
- Commit: `design: add mockup and design system for [page/component]`

**Phase 1 — Component scaffolding and layout structure**
- Build layout shells from the Phase 0 mockup
- Install applicable 21st.dev components
- Commit: `feat(ui): scaffold layout for [page/component]`

**Phase 2 — Data wiring and props/types**
- Wire in server data, props, and TypeScript types
- Commit: `feat(ui): wire data into [page/component]`

**Phase 3 — Loading, empty, and error states**
- Commit: `feat(ui): add loading/empty/error states for [page/component]`

**Phase 4 — Visual polish**
- Apply design system tokens: spacing, typography, badges, color
- Align all Tailwind classes with MASTER.md design system
- Commit: `feat(ui): polish visual design for [page/component]`

**Phase 5 — Responsiveness pass**
- Commit: `feat(ui): responsive layout for [page/component]`

**Phase 6 — Accessibility pass**
- ARIA labels, keyboard nav, color contrast
- Commit: `feat(ui): accessibility pass for [page/component]`

**Phase 7 — Cross-page consistency check**
- Commit: `feat(ui): consistency pass across pages`

**Phase 8 — Final review**
- Screenshot mental model, README/comment updates if needed
- Commit: `feat(ui): final review and cleanup`

Not every task needs all phases. Use judgment. Skip phases that don't apply.

### Commit discipline
```
git add <specific files>
git commit -m "feat(ui): <concise description of what changed and why>"
```
Never commit unrelated files. Never use `git add .` blindly.

---

## Testing and verification

After completing any significant UI change:
- manually verify the component renders correctly for all data states (loaded, empty, error)
- check that no TypeScript errors are introduced
- check that Tailwind classes are valid and render as expected
- if Playwright is configured, write or extend a test covering the changed flow

For pages with interactive flows (filters, search, row clicks), include at minimum:
- a smoke test confirming the page renders
- a test confirming the primary interaction works end-to-end in the browser

Playwright is preferred for E2E. Keep tests realistic — simulate actual user clicks, form fills, and navigation rather than just asserting DOM presence.

---

## Frontend principles
- internal-tool aesthetic
- clean, modern, minimal
- recruiter-friendly screenshots
- clarity over flash
- desktop-first, but responsive
- use reusable components
- keep code simple and readable
- do not over-engineer
- production quality: types, validation, accessibility, error handling throughout

---

## Data contract rules
- treat backend return shapes as source of truth
- do not invent new backend fields
- do not rename fields in fetched data
- if a needed field is missing, note the gap clearly instead of faking a backend change
- prefer graceful UI fallbacks when data is absent

---

## Current implemented scope
The currently active pages are:
- /dashboard
- /accounts
- /accounts/[id]

Other routes can remain placeholders for now.

---

## UI requirements

Dashboard should include:
- KPI cards
- signal chart
- hot accounts table
- recent activity feed

Accounts page should include:
- searchable table
- segment and score filters
- clickable rows

Account detail page should include:
- account header
- metadata
- contacts
- leads summary
- signal timeline
- open tasks

---

## Styling guidance
- use Tailwind, aligned with the design system in `design-system/MASTER.md`
- source components from 21st.dev before building custom ones
- keep card design consistent
- use small tasteful badges for status fields
- avoid heavy UI libraries unless clearly necessary
- charts should be readable and simple
- empty states should feel intentional
- accessibility: all interactive elements must be keyboard-accessible and have ARIA labels where needed
- target Lighthouse accessibility score ≥ 90 on active pages

---

## Collaboration boundary
Codex owns:
- schema
- seed data
- server data access
- APIs
- business logic

You should not step into backend ownership.
If a page needs missing backend data, call that out clearly with the exact field or function name needed, then continue with a graceful fallback in the UI.

---

## Output style
When making changes:
- explain what you changed and why
- list every file touched
- flag any backend dependency gaps with specifics
- note which design tool was used in Phase 0 (Stitch, Nano Banana 2, or UI UX Pro Max)
- note any 21st.dev components installed vs built from scratch
- keep diffs focused — no unrelated refactors
- after completing all phases, give a short summary of what was built, what was tested, and any remaining gaps
