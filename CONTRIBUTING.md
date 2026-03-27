# Contributing to Open GTM Signal Orchestrator

Thanks for contributing. This project is intended to be a practical open-source foundation for GTM engineering workflows, with an emphasis on deterministic behavior, realistic data contracts, and inspectable operator logic.

## Local Setup

1. Install dependencies.

   ```bash
   npm install
   ```

2. Apply the local Prisma migrations.

   ```bash
   npm run db:migrate
   ```

3. Seed the local workspace.

   ```bash
   npm run db:seed
   ```

4. Start the app.

   ```bash
   npm run dev
   ```

## Branch Naming

Use short, descriptive branch names from `main`.

- `feat/signal-simulator`
- `fix/accounts-filtering`
- `docs/contributing-guide`
- `chore/ci-cleanup`

## Required Checks

Before opening a pull request, run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

If you touch Prisma schema, seed logic, or server-side query contracts, also run:

```bash
npm run db:seed
npm run db:verify-seed
npm run db:verify-contracts
```

## Contribution Scope

The repo is organized around clear boundaries:

- Backend and data-contract work lives primarily under `prisma/`, `lib/db/`, `lib/data/`, `lib/contracts/`, and `app/api/`
- Frontend composition and presentation should preserve the existing route structure and visual system unless the change is required to support data or product correctness
- Stable frontend-facing contracts matter more than clever abstractions

`AGENTS.md` captures the repo’s current collaboration boundaries and ownership assumptions. If your change affects backend contracts or seed realism, update the relevant docs and verification paths in the same pull request.

## Pull Request Expectations

Each pull request should include:

- a concise description of the problem and solution
- any schema, seed, or contract changes called out explicitly
- screenshots or API examples when behavior changes are user-visible
- clear verification notes describing what you ran locally

## Good Contribution Targets

- signal ingestion and normalization improvements
- stronger typed query helpers and contracts
- data realism improvements in the seed workspace
- testing coverage for APIs and contract loaders
- docs that improve GTM engineering discoverability and onboarding
