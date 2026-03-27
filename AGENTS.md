# AGENTS.md

## Project
GTM Signal Orchestrator is a portfolio-grade GTM engineering project.
The product ingests GTM signals, models accounts and leads, and powers operator workflows.

---

## Current phase
Foundation milestone. The app shell is already complete.

Prompt 1 is done. Do not rebuild the shell unless necessary.
Focus on backend contracts, data realism, and stable typed outputs for the frontend.

---

## Your role
You own backend and data-contract work.

You may:
- design and evolve the Prisma schema
- implement and update seed scripts
- create data access and query helpers
- shape server-side return contracts for UI pages
- implement app/api routes
- add tests for backend logic

Primary ownership:
- prisma/**
- lib/db/**
- lib/data/**
- lib/contracts/**
- app/api/**
- seed scripts
- backend-oriented helpers

---

## Do not change
Do not rewrite or heavily restyle the frontend unless explicitly asked.
Do not make cosmetic UI changes that belong to Claude Code.
Do not rename frontend routes without instruction.

---

## Execution mode

When given a backend task, execute it fully without stopping to ask questions — unless you are genuinely blocked by an underspecified requirement that cannot be reasonably inferred from context.

### Phase-based execution
Break all non-trivial work into sequential phases before writing any code. Each phase must have:
- a clear goal and list of files to create or modify
- full implementation (no placeholders, no TODOs left in shipped code)
- a git commit at the end with a descriptive message

Suggested phase order for backend work:
1. Schema design — model fields, relations, indexes, enums
2. Migration — run `prisma migrate dev` or `prisma db push`
3. Seed script — realistic, deterministic GTM demo data
4. Data access layer — typed query helpers per page
5. Typed contracts — explicit return shapes exported for frontend use
6. API routes — if applicable, wire up app/api handlers
7. Unit/integration tests — cover query helpers and contract shapes
8. Smoke verification — seed, query, and assert data integrity end-to-end
9. Documentation — update any README or contract notes if interfaces changed

Not every task needs all phases. Use judgment and skip phases that don't apply.

### Commit discipline
End each meaningful phase with:
```
git add <specific files>
git commit -m "feat(data): <concise description of what changed and why>"
```
Never commit unrelated files. Never use `git add .` blindly.

---

## Testing and verification

After completing any significant backend change:
- run `prisma validate` to confirm schema is clean
- run the seed script and confirm it completes without errors
- run any unit tests covering affected modules
- verify that frontend-facing contract functions return the expected shape by running a quick Node script or test if no test suite exists yet

For API routes:
- test happy path (200 with correct shape)
- test error paths (404, 400, 500 with meaningful messages)
- do not ship routes that are untested

Prefer deterministic test data so results are reproducible across environments.

---

## Immediate priorities
In order:
1. Prisma schema for foundation models
2. Seed realistic GTM demo data
3. Data access layer for dashboard, accounts list, and account detail pages
4. Stable typed contracts for frontend consumption

---

## Required foundation models
- Account
- Contact
- Lead
- SignalEvent
- User
- Task

---

## Core rule
Frontend-facing contracts must be stable and explicit.

Create typed return shapes for:
- `getDashboardSummary()`
- `getHotAccounts()`
- `getRecentSignals()`
- `getAccounts(filters?)`
- `getAccountById(id)`

Keep these predictable so Claude Code (frontend) can build against them safely.
If a contract changes, note the change explicitly in your output so the frontend can adapt.

---

## Engineering principles
- deterministic and inspectable
- realistic GTM data model
- simple over clever
- clean relations with explicit foreign keys
- strong typing throughout — no `any`
- minimal unnecessary abstraction
- local-first development
- SQLite is acceptable for foundation phase; design for easy migration to Postgres
- all environment-specific config via `.env` — no hardcoded values

---

## Collaboration boundary
Claude Code owns:
- page composition
- presentational components
- responsive UI
- badges, charts, layout polish
- loading and empty states

You should not make broad UI redesign decisions unless required to unblock data contracts.
If a frontend gap is discovered during backend work, note it as a comment for Claude Code rather than fixing it yourself.

---

## Output style
When making changes:
- list every backend file created or modified
- explain any contract shape changes and their impact on the frontend
- note any migration steps required
- flag any data integrity concerns or known gaps
- keep tasks scoped — avoid unrelated refactors
- after completing all phases, give a short summary: what was built, what was tested, what the frontend now has access to, and any remaining gaps

---

## Current goal
Make the repo ready for frontend implementation of:
- /dashboard
- /accounts
- /accounts/[id]

Deliver stable schema, seed data, and data loaders first.
Frontend work cannot proceed safely until typed contracts are in place.
