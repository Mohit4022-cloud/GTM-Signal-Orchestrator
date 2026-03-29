# Testing Guide

## What Counts As Unit, Integration, And E2E Here

- Unit tests validate pure decision logic and small service behaviors in isolation.
- Integration tests validate a persisted workflow across multiple backend layers, usually against the seeded SQLite test database.
- E2E tests exercise public route handlers plus persisted side effects through the same contracts the UI depends on. They do not use browser automation in this repo.

## Suite Map

| File | Level | What it covers |
| --- | --- | --- |
| `tests/scoring-engine.test.ts` | Unit | Score thresholds, component caps, account and lead scoring, persisted score history, and reason metadata ordering. |
| `tests/routing-engine.test.ts` | Unit | Routing precedence, fallback behavior, normalized reason codes, idempotency, and simulator output. |
| `tests/sla-engine.test.ts` | Unit | Lead and task SLA policy selection, deadline assignment, breach checks, and snapshot states. |
| `tests/reason-codes.test.ts` | Unit | Human-readable reason detail generation across scoring, routing, and actions. |
| `tests/signal-routing.integration.test.ts` | Integration | Signal ingestion through score recompute and persisted routing decision creation. |
| `tests/urgent-inbound-lead.e2e.test.ts` | E2E | `POST /api/signals`, `GET /api/leads/[id]`, and `getAccountById()` working together for a matched inbound flow. |

## Commands

Run the full suite:

```bash
npm test
```

Run the Phase 5 decision-path bundle only:

```bash
node --import ./tests/setup.mjs --import tsx --test --test-concurrency=1 \
  tests/scoring-engine.test.ts \
  tests/routing-engine.test.ts \
  tests/sla-engine.test.ts \
  tests/reason-codes.test.ts \
  tests/signal-routing.integration.test.ts \
  tests/urgent-inbound-lead.e2e.test.ts
```

Rebuild and verify the seeded workspace:

```bash
npm run db:validate
npm run db:seed
npm run db:verify-contracts
npm run db:verify-routing
npm run db:verify-signal-pipeline
npm run db:verify-sla
```

## Atlas Grid Demo Scenario

Atlas Grid is the main seeded walkthrough because it concentrates several useful behaviors in one place:

- hot inbound routing
- short SLA windows
- task generation
- score explanation
- audit traceability on the account detail view

Use `acc_atlas_grid` and `acc_atlas_grid_lead_01` when you want one scenario that touches dashboard, account detail, lead API, and routing simulation.

## How To Read The E2E Test

`tests/urgent-inbound-lead.e2e.test.ts` is intentionally not a browser test. In this repo, E2E means:

- call the public signal-ingest route
- confirm the lead API reflects routing and SLA state
- confirm the account detail query reflects score movement, open work, and recent audit trace

That gives end-to-end confidence in the backend contracts that the UI consumes, while staying fast enough to run as part of the regular Node test suite.
