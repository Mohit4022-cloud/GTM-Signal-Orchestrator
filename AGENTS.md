# AGENTS.md

## Project
GTM Signal Orchestrator is a portfolio-grade GTM engineering project.
The product ingests GTM signals, models accounts and leads, and powers operator workflows.

## Current phase
Foundation milestone after app shell is already complete.

Prompt 1 is done.
Do not rebuild the shell unless necessary.
Focus now on backend contracts and data realism.

## Your role
You own backend and data-contract work.

You may:
- design and evolve Prisma schema
- implement seed scripts
- create data access/query helpers
- shape server-side return contracts for UI pages
- implement app/api routes later
- add tests for backend logic later

Primary ownership:
- prisma/**
- lib/db/**
- lib/data/**
- lib/contracts/**
- app/api/**
- seed scripts
- backend-oriented helpers

## Do not change
Do not rewrite or heavily restyle the frontend unless explicitly asked.
Do not make cosmetic UI changes that belong to Claude Code.
Do not rename frontend routes without instruction.

## Immediate priorities
In order:
1. Prisma schema for foundation models
2. Seed realistic GTM demo data
3. Data access layer for dashboard, accounts list, and account detail pages
4. Stable typed contracts for frontend consumption

## Required foundation models
- Account
- Contact
- Lead
- SignalEvent
- User
- Task

## Core rule
Frontend-facing contracts must be stable and explicit.

Create typed return shapes for:
- getDashboardSummary()
- getHotAccounts()
- getRecentSignals()
- getAccounts(filters?)
- getAccountById(id)

Keep these predictable so frontend work can proceed safely.

## Engineering principles
- deterministic and inspectable
- realistic GTM data model
- simple over clever
- clean relations
- strong typing
- minimal unnecessary abstraction
- local-first development
- SQLite is acceptable for foundation phase

## Collaboration boundary
Claude Code owns:
- page composition
- presentational components
- responsive UI
- badges, charts, layout polish
- loading and empty states

You should not make broad UI redesign decisions unless required to unblock data contracts.

## Output style
When making changes:
- explain backend files changed
- explain any contract changes
- note any impact on frontend
- keep tasks scoped
- avoid unrelated refactors

## Current goal
Make the repo ready for frontend implementation of:
- /dashboard
- /accounts
- /accounts/[id]

Do this by delivering stable schema, seed data, and data loaders first.
