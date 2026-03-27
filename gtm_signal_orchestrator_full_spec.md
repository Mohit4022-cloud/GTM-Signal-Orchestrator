# GTM Signal Orchestrator — Full Product Spec

## 1) Purpose
Build a portfolio-grade GTM Engineering project that proves you can design and implement the connective tissue of a modern revenue system.

This project should demonstrate that you can:
- ingest GTM signals from multiple systems
- normalize and score those signals
- route accounts and leads intelligently
- trigger next-best actions for SDR, AE, and marketing
- maintain auditability and operational trust
- measure downstream business impact

This is not a generic CRM clone and not a generic AI app. It is a **signal activation and workflow orchestration system for revenue teams**.

---

## 2) Portfolio Positioning

### What this repo should signal to recruiters
This repo should make a recruiter think:
- this person understands GTM systems, not just app development
- this person can connect signals, ops logic, and business outcomes
- this person understands revenue workflows across marketing, SDR, AE, and RevOps
- this person can build production-style internal tooling with clean architecture
- this person knows where AI helps and where deterministic logic is better

### Resume / GitHub one-line description
**Signal-based GTM orchestration platform that ingests buyer and account events, scores demand, routes leads, triggers rep actions, and tracks SLA and pipeline impact.**

---

## 3) Product Narrative
Revenue teams lose opportunities because signals are fragmented across tools. Website visits live in one tool. Form fills in another. Product usage in another. Intent data arrives separately. Rep follow-up is inconsistent. Routing breaks. SLAs slip. No one trusts the scoring. High-intent accounts do not get acted on fast enough.

This project solves that by creating a central event and decision layer:
1. ingest signals
2. standardize them
3. score account readiness
4. decide owner and next action
5. write decisions to a CRM-like workspace
6. track operational and funnel outcomes

---

## 4) Product Scope

## In scope for MVP
- Signal ingestion from mock sources
- Signal normalization into one event model
- Account and lead scoring
- Rules-based routing engine
- Next-best-action engine
- CRM-like records for accounts, contacts, leads, tasks, and ownership
- SLA timer tracking
- Audit log for decisions
- Internal dashboard with pipeline operations metrics
- Synthetic sample data
- Optional AI-generated action notes and personalization snippets

## Out of scope for MVP
- Real Salesforce or HubSpot integration
- Real auth/SSO with enterprise identity providers
- Full email sequencing engine
- Full warehouse and BI stack
- Multi-tenant architecture
- Complex role permissions
- Production-grade event streaming infra

These can be listed in a “future enhancements” section.

---

## 5) Core Use Case
An account from the manufacturing segment visits pricing pages three times in 48 hours, submits a demo form, and shows third-party intent. The system should:
- attach the signals to the correct account
- raise the account score
- classify urgency
- assign an owner based on segment, territory, and round-robin logic
- generate an SDR task and recommended action
- start an SLA countdown
- show the event in the dashboard and audit log

---

## 6) Target Users

### Primary users
- GTM Engineer
- RevOps Manager
- SDR Manager
- Sales Operations Analyst

### Secondary users
- SDRs
- AEs
- Marketing Ops
- Growth teams

---

## 7) Key Product Principles

1. **Deterministic first**
   Routing, scoring inputs, and SLA policies should be deterministic and inspectable.

2. **AI only where useful**
   Use AI for action summaries, personalization suggestions, and context compression. Do not use AI for core ownership decisions unless clearly sandboxed.

3. **Auditability matters**
   Every score change and routing decision must be explainable.

4. **Operator-first UX**
   Internal tooling should prioritize clarity, trust, and fast action over fancy visuals.

5. **Business metrics over vanity features**
   Everything should tie back to speed-to-lead, conversion, SLA compliance, or productivity.

---

## 8) Functional Requirements

## 8.1 Signal ingestion
The system should accept these mock signal types:
- website visit
- pricing page visit
- high-intent page cluster visit
- form fill
- webinar registration
- product sign-up
- product usage milestone
- email reply
- meeting booked
- meeting no-show
- third-party intent event
- manual sales note
- account status update

### Requirements
- ingest signals via API and CSV upload
- attach raw source metadata
- normalize signal payload into standard schema
- deduplicate obvious duplicates
- timestamp all events
- associate signal with account and contact when possible

---

## 8.2 Identity resolution
The system should map incoming signals to existing entities.

### Rules
- domain match for account association
- email match for contact association
- fallback to “unmatched queue” if no confident match exists
- allow manual merge/reassignment in UI

---

## 8.3 Scoring engine
The system should maintain an account-level and lead-level score.

### Score components
- fit score
- intent score
- engagement score
- recency score
- product usage score
- manual priority boost

### Example weighting
- Fit: 25%
- Intent: 20%
- Engagement: 25%
- Recency: 10%
- Product usage: 15%
- Manual priority: 5%

### Example scoring examples
- pricing page visit = +10
- demo form fill = +25
- meeting booked = +30
- email reply positive = +15
- email reply negative = -10
- inactivity for 14 days = -8 decay
- product activation milestone = +20
- high-fit ICP segment = +15

### Requirements
- every score change must show reason codes
- score history must be stored
- thresholds should drive state changes such as cold, warm, hot, sales-ready
- score formulas should be configurable in JSON or DB tables

---

## 8.4 Routing engine
The routing engine decides owner and queue destination.

### Routing inputs
- geography
- company segment
- account owner presence
- account tier
- SDR pod
- inbound vs outbound source
- named account status
- current rep capacity

### Routing outputs
- assigned owner
- assigned team
- assigned queue
- SLA deadline
- escalation policy

### MVP routing logic
1. if named account exists, assign to named owner
2. else if territory match exists, assign by territory + segment
3. else route via round robin in eligible pool
4. if strategic tier, escalate to AE + SDR pair
5. if no match, send to ops review queue

### Requirements
- store routing policy versions
- show why a route occurred
- allow simulation mode for testing rules

---

## 8.5 Next-best-action engine
The system should recommend what to do next after routing.

### Example action types
- call within 15 minutes
- send follow-up email
- enrich missing contact fields
- handoff to AE
- add to nurture queue
- pause because account already active
- escalate due to SLA breach

### Action generation logic
- deterministic templates first
- optional AI-generated note for context and suggested messaging
- severity and priority assigned to each action

---

## 8.6 CRM workspace
Build a simple CRM-like internal workspace.

### Entities to display
- Accounts
- Contacts
- Leads
- Signals
- Tasks
- Routing decisions
- Score history
- SLA status

### Capabilities
- search and filter
- view account timeline
- view current owner
- inspect score breakdown
- inspect action queue
- inspect unmatched signals
- manually reassign owner

---

## 8.7 SLA tracking
The system should track follow-up speed.

### Example policies
- Hot inbound lead: 15 minutes
- Warm inbound lead: 2 hours
- Product-qualified account: 4 hours
- General form fill: 24 hours

### Requirements
- countdown timer on lead/task views
- breach state if overdue
- escalation events stored
- dashboard summary for SLA attainment

---

## 8.8 Dashboard and analytics
Create a compact operator dashboard.

### Dashboard widgets
- signals received today
- routed today
- unmatched signals
- hot accounts
- SLA breaches
- average speed-to-lead
- conversion by score bucket
- distribution of routing reasons
- tasks due today

### Analytics views
- lead volume by source
- score distribution
- pipeline stage conversion by segment
- SLA compliance trend
- experiment comparison view

---

## 8.9 Audit log
Every important system decision should be logged.

### Log event types
- signal ingested
- identity resolved
- score updated
- route assigned
- task created
- SLA breached
- user override
- rule config changed

### Each log should include
- timestamp
- actor or system
- entity type and ID
- before state
- after state
- explanation / reason code

---

## 8.10 AI assist layer
This is optional but valuable for portfolio differentiation.

### Good AI use cases
- summarize why this account is hot
- generate one-paragraph rep briefing
- suggest outreach angle from signal context
- compress long timelines into action-ready notes

### Bad AI use cases for MVP
- deciding routing ownership blindly
- opaque score assignment
- replacing all deterministic action logic

---

## 9) Non-Functional Requirements
- responsive internal web app
- seeded sample data should work locally
- basic error handling
- clean typing and validation
- deterministic workflows should be testable
- easy local setup
- architecture simple enough for recruiter review

---

## 10) Suggested Tech Stack

### Preferred stack
- **Frontend:** Next.js, TypeScript, Tailwind
- **Backend:** Next.js API routes or separate Node/Express service
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Queue / jobs:** BullMQ with Redis or lightweight in-process job scheduling for MVP
- **Validation:** Zod
- **Charts:** Recharts
- **AI adapter:** OpenAI or provider-agnostic wrapper
- **Testing:** Vitest / Jest + Playwright for one happy-path flow

### Simpler alternative for speed
- Next.js full-stack app
- SQLite for local demo first, upgrade to Postgres after
- cron-like local jobs instead of queue infra initially

---

## 11) Architecture

### High-level architecture
1. Signal sources send events via API or CSV upload
2. Ingestion service validates and stores raw signals
3. Normalizer maps raw signals to canonical event model
4. Identity resolver attaches signal to account/contact
5. Scoring engine updates lead/account scores
6. Routing engine assigns owner and queue
7. Action engine creates tasks and recommendations
8. CRM workspace displays entities and timelines
9. Dashboard aggregates operational metrics
10. Audit log records all key decisions

### Architectural modules
- `ingestion`
- `normalization`
- `identity-resolution`
- `scoring`
- `routing`
- `actions`
- `sla`
- `analytics`
- `ai-assist`
- `audit`

---

## 12) Data Model

## 12.1 Account
Fields:
- id
- name
- domain
- segment
- industry
- geography
- employee_count
- annual_revenue_band
- named_owner_id
- account_tier
- lifecycle_stage
- fit_score
- overall_score
- status
- created_at
- updated_at

## 12.2 Contact
Fields:
- id
- account_id
- first_name
- last_name
- email
- title
- department
- seniority
- phone
- persona_type
- created_at
- updated_at

## 12.3 Lead
Fields:
- id
- account_id
- contact_id
- source
- inbound_type
- current_owner_id
- status
- score
- temperature
- sla_deadline_at
- first_response_at
- routed_at
- created_at
- updated_at

## 12.4 SignalEvent
Fields:
- id
- source_system
- event_type
- account_id nullable
- contact_id nullable
- lead_id nullable
- raw_payload_json
- normalized_payload_json
- occurred_at
- received_at
- dedupe_key
- status

## 12.5 ScoreHistory
Fields:
- id
- entity_type account|lead
- entity_id
- previous_score
- new_score
- delta
- score_component
- reason_code
- created_at

## 12.6 RoutingDecision
Fields:
- id
- lead_id
- account_id
- policy_version
- decision_type
- assigned_owner_id
- assigned_team
- assigned_queue
- explanation
- created_at

## 12.7 Task
Fields:
- id
- lead_id nullable
- account_id nullable
- owner_id
- task_type
- priority
- due_at
- status
- title
- description
- created_at
- completed_at nullable

## 12.8 User
Fields:
- id
- name
- email
- role
- team
- territory
- segment_focus
- active_capacity
- current_load

## 12.9 AuditLog
Fields:
- id
- actor_type system|user
- actor_id nullable
- entity_type
- entity_id
- action
- before_json
- after_json
- explanation
- created_at

## 12.10 RuleConfig
Fields:
- id
- rule_type scoring|routing|sla
- version
- config_json
- is_active
- created_at

---

## 13) State Models

## Lead status example
- new
- enriched
- scored
- routed
- working
- qualified
- disqualified
- converted

## Temperature example
- cold
- warm
- hot
- urgent

## Task status
- open
- in_progress
- completed
- overdue
- canceled

---

## 14) API Spec (MVP)

## Ingestion APIs
### `POST /api/signals`
Create a signal event.

Payload example:
```json
{
  "source_system": "website",
  "event_type": "pricing_page_visit",
  "account_domain": "acme.com",
  "contact_email": "jane@acme.com",
  "occurred_at": "2026-03-25T12:30:00Z",
  "payload": {
    "page": "/pricing",
    "session_id": "sess_123",
    "visit_count": 3
  }
}
```

### `POST /api/signals/upload`
Upload CSV with signal events.

---

## Account APIs
### `GET /api/accounts`
List accounts with filters.

### `GET /api/accounts/:id`
Get account details including timeline, score, and tasks.

### `PATCH /api/accounts/:id`
Update selected account fields.

---

## Lead APIs
### `GET /api/leads`
List leads with filters.

### `GET /api/leads/:id`
Get lead details.

### `PATCH /api/leads/:id/assign`
Manual reassignment.

---

## Routing APIs
### `POST /api/routing/simulate`
Run routing logic without persisting.

### `POST /api/routing/run/:leadId`
Run routing and persist decision.

---

## Scoring APIs
### `POST /api/scoring/recompute/:entityType/:entityId`
Recompute score for account or lead.

### `GET /api/scoring/history/:entityType/:entityId`
Score history.

---

## Task APIs
### `GET /api/tasks`
List tasks.

### `POST /api/tasks`
Create task.

### `PATCH /api/tasks/:id`
Update task status.

---

## Dashboard APIs
### `GET /api/dashboard/summary`
Top-level metrics.

### `GET /api/dashboard/sla`
SLA metrics.

### `GET /api/dashboard/conversion`
Conversion metrics.

---

## AI Assist APIs
### `POST /api/ai/account-summary/:accountId`
Generate account summary.

### `POST /api/ai/action-note/:leadId`
Generate recommended outreach note.

---

## 15) Scoring Logic Spec

### Formula example
`overall_score = fit + intent + engagement + recency + product_usage + manual_boost`

### Fit examples
- enterprise target segment: +15
- preferred industry: +10
- ideal geography: +5

### Intent examples
- third-party intent spike: +12
- pricing cluster visit: +10
- competitor comparison page visit: +8

### Engagement examples
- form fill: +25
- positive reply: +15
- meeting booked: +30

### Recency examples
- event within 24h: +10
- event within 7d: +5
- inactivity > 14d: -8

### Product usage examples
- signed up: +10
- invited team member: +10
- activated key feature: +20

### Thresholds
- 0–24 = cold
- 25–49 = warm
- 50–74 = hot
- 75+ = urgent

### Requirements
- score calculation code should be isolated and unit-tested
- output explanation object should include top contributing factors

---

## 16) Routing Logic Spec

### Order of precedence
1. named account owner
2. existing account owner
3. strategic tier override
4. territory + segment rule
5. round-robin pool
6. ops review queue

### Example decision explanation
```json
{
  "decision": "assigned_to_owner",
  "owner": "Sarah Kim",
  "team": "Mid-Market SDR",
  "queue": "NA-West-MidMarket",
  "reason": [
    "account_domain_matched_existing_account",
    "account_is_named",
    "owner_has_capacity"
  ],
  "sla_minutes": 15
}
```

### Capacity model
Each rep can have:
- max open hot leads
- max daily inbound assignments
- current open task count

If rep is overloaded, routing should fall back to backup rules.

---

## 17) Action Engine Spec

### Deterministic templates
**Hot inbound demo request**
- create call task due in 15 minutes
- create email follow-up task due in 30 minutes
- notify AE if strategic account

**Warm pricing visitor without form fill**
- create research task
- suggest nurture sequence

**Product-qualified account**
- create success-to-sales handoff task
- suggest account summary generation

### Task priority levels
- P1 urgent
- P2 high
- P3 normal
- P4 low

---

## 18) UI / Screen Spec

## 18.1 Dashboard
Sections:
- KPI cards
- signal volume chart
- SLA health chart
- hot leads table
- unmatched signals panel
- recent routing decisions feed

## 18.2 Accounts list
Columns:
- account name
- domain
- segment
- owner
- overall score
- status
- last signal time

Filters:
- segment
- geography
- score bucket
- owner
- lifecycle stage

## 18.3 Account detail page
Sections:
- header with score and owner
- account attributes
- signal timeline
- contact list
- open tasks
- score breakdown
- AI summary card
- audit log

## 18.4 Leads queue
Views:
- hot leads
- overdue SLA
- unassigned leads
- recently routed

## 18.5 Routing policy simulator
Inputs:
- account domain
- lead source
- segment
- geography
- named account toggle
- capacity scenario

Outputs:
- simulated owner
- simulated queue
- reason codes
- SLA target

## 18.6 Unmatched signals queue
Show events that could not be confidently attached to account/contact.
Allow manual review and attach.

## 18.7 Rule config viewer
Read-only in MVP is enough.
Show scoring and routing rules with active version.

---

## 19) UX Guidelines
- clean internal-tool look
- minimal but professional
- emphasize inspectability and operator speed
- avoid visual clutter
- make score explanations obvious
- make routing reasons human-readable
- allow drill-down from KPI to source data

---

## 20) Folder Structure
```text
gtm-signal-orchestrator/
  app/
    dashboard/
    accounts/
    accounts/[id]/
    leads/
    tasks/
    signals/
    routing-simulator/
    unmatched/
    settings/
    api/
  components/
    dashboard/
    accounts/
    leads/
    tasks/
    shared/
  lib/
    db/
    scoring/
    routing/
    actions/
    identity/
    analytics/
    ai/
    audit/
    validation/
  prisma/
    schema.prisma
    seed.ts
  data/
    sample-signals.csv
    sample-accounts.json
    sample-contacts.json
    sample-users.json
  tests/
    unit/
    integration/
    e2e/
  docs/
    architecture.md
    scoring.md
    routing.md
    demo-script.md
  public/
  README.md
```

---

## 21) Seed Data Plan
Create realistic sample data for:
- 40 accounts
- 90 contacts
- 12 users (SDRs, AEs, Ops)
- 500 signal events across different sources
- 80 leads
- 100 tasks

### Example segments
- SMB
- Mid-Market
- Enterprise
- Strategic

### Example industries
- SaaS
- Manufacturing
- Healthcare
- Retail
- Fintech

### Example geographies
- North America East
- North America West
- EMEA
- APAC

---

## 22) Key User Flows

## Flow 1: Inbound demo request
1. signal arrives
2. normalized and attached to account/contact
3. lead score recomputed
4. temperature becomes urgent
5. routing engine assigns SDR
6. action engine creates tasks
7. SLA countdown begins
8. dashboard updates
9. audit log captures each step

## Flow 2: Multiple website visits with no form fill
1. pricing page and comparison page visits accumulate
2. account score rises from warm to hot
3. next-best action suggests SDR outreach or nurture path
4. owner sees account in hot accounts queue

## Flow 3: Product-qualified account
1. activation milestone event arrives
2. account score jumps
3. system routes to account owner or AE
4. action engine creates follow-up task
5. AI summary compiles why account should be engaged now

## Flow 4: Unmatched signal review
1. signal arrives with unknown contact
2. identity resolution fails
3. event lands in unmatched queue
4. user manually attaches event to account/contact
5. score and timeline update retroactively

---

## 23) Testing Plan

## Unit tests
- score calculation logic
- routing precedence logic
- SLA deadline assignment
- dedupe logic
- reason-code generation

## Integration tests
- signal ingestion to lead creation
- score recomputation after event
- routing decision persistence
- task creation after hot lead

## E2E test
Happy path:
- submit inbound signal
- confirm lead becomes urgent
- confirm owner assigned
- confirm task created
- confirm dashboard reflects update

---

## 24) Evaluation / Demo Success Criteria
This repo is successful if a recruiter can quickly see:
- clear business problem
- thoughtful architecture
- realistic GTM workflow understanding
- explainable decision engine
- measurable output
- evidence of product sense and systems thinking

### MVP acceptance criteria
- seeded app runs locally with one command after setup
- dashboard loads with realistic metrics
- one happy-path signal triggers scoring, routing, task creation, and SLA tracking
- account page shows timeline, score breakdown, and audit log
- routing simulator works
- README explains value clearly

---

## 25) README Structure

# README Outline
1. Project title
2. One-line summary
3. Why this matters in GTM
4. Core capabilities
5. Architecture diagram
6. Demo screenshots / GIFs
7. Example workflow
8. Tech stack
9. Local setup
10. Sample data
11. How scoring works
12. How routing works
13. AI assist design
14. Tradeoffs and future improvements
15. Business impact metrics

### Example README opening
**GTM Signal Orchestrator** is a signal activation and workflow orchestration platform for revenue teams. It ingests buyer and account events, computes actionable demand scores, routes leads by policy, creates next-best actions for reps, and tracks SLA and funnel health through an auditable internal workspace.

---

## 26) Demo / Loom Script

### 2–3 minute demo flow
1. Start on dashboard and show hot lead count, SLA health, and routing feed
2. Create or ingest a demo request signal
3. Open the resulting lead or account page
4. Show score jump with explanation
5. Show routing decision and assigned owner
6. Show generated task and SLA deadline
7. Open audit log for traceability
8. Open routing simulator to show policy control
9. Close with measurable outcomes shown on dashboard

### Demo narration points
- “This centralizes fragmented GTM signals into one decision layer.”
- “Scoring is inspectable and deterministic.”
- “Routing is rules-based with explanation and simulation.”
- “Actions are triggered automatically and tied to SLA outcomes.”
- “This is the kind of internal system GTM teams use to improve speed-to-lead and rep efficiency.”

---

## 27) Metrics to Highlight
Use believable synthetic metrics in demo and README.

Examples:
- 37% faster average speed-to-lead
- 22% fewer unassigned inbound leads
- 18% higher meeting conversion for urgent-score accounts
- 45% reduction in manual routing effort

Make it clear these are **demo scenario metrics based on sample data**.

---

## 28) Roadmap Beyond MVP

### V2 ideas
- live Salesforce / HubSpot sync
- Slack notifications
- rep workload balancing with smarter capacity model
- experiment framework for scoring models
- warehouse export layer
- approval workflow for rule changes
- persona-specific AI recommendations
- sequence enrollment logic
- real territory mapping tables

### V3 ideas
- multi-tenant architecture
- feature flags
- admin UI for rule editing
- probabilistic identity resolution
- real-time event streaming

---

## 29) What to Say in Interviews
This repo lets you tell a strong GTM Engineer story:
- you understand revenue workflows deeply
- you designed around operational trust, not just AI novelty
- you balanced deterministic logic and AI appropriately
- you focused on measurable business outcomes
- you built a clean system that could integrate with CRM and ops tooling in production

### Sample interview framing
“I wanted to build something closer to the actual operating layer of a modern GTM team. Instead of another generic AI app, I built a signal orchestration system that ingests account activity, applies transparent scoring and routing logic, triggers next-best actions, and measures SLA and conversion impact. I used deterministic logic for trust-critical decisions and layered AI only where it adds leverage, like summaries and contextual action notes.”

---

## 30) Codex Build Plan

## Phase 1: Foundation
Ask Codex to:
- initialize Next.js TypeScript app with Tailwind
- add Prisma with Postgres schema
- scaffold core models
- add seed script with accounts, contacts, users, signals
- create dashboard and accounts list skeleton

## Phase 2: Signal pipeline
Ask Codex to:
- create signal ingestion API
- create normalization service
- create identity resolution helpers
- store raw and normalized payloads
- build unmatched queue

## Phase 3: Scoring and routing
Ask Codex to:
- implement score computation module
- add score history table and reason codes
- implement routing rules engine
- add routing simulator UI
- create action templates and task creation flows

## Phase 4: Operator UI
Ask Codex to:
- build account detail page with timeline
- build leads queue and task list
- show score explanations and audit logs
- add SLA countdowns and overdue indicators

## Phase 5: AI assist and polish
Ask Codex to:
- add provider-agnostic AI summary endpoint
- add account summary and rep note cards
- polish charts and filters
- add demo-friendly seed scenarios
- add tests and docs

---

## 31) Codex Prompt Pack

### Prompt 1 — scaffold
Create a production-style Next.js TypeScript internal tool called GTM Signal Orchestrator. Use Tailwind, Prisma, and PostgreSQL. Scaffold routes for dashboard, accounts, leads, tasks, signals, unmatched queue, and routing simulator. Create a clean internal-tool aesthetic with responsive layout and a reusable sidebar shell.

### Prompt 2 — data model
Design a Prisma schema for a GTM signal orchestration platform with models for Account, Contact, Lead, SignalEvent, ScoreHistory, RoutingDecision, Task, User, AuditLog, and RuleConfig. Include appropriate relations, enums, timestamps, and indexes. Optimize for explainable scoring, routing, and timeline views.

### Prompt 3 — signal pipeline
Implement API endpoints and server-side services for signal ingestion and normalization. Accept JSON payloads and CSV uploads. Map raw signal types into a canonical event model. Add deduplication, validation, and status handling. Send unmatched events into an unmatched queue for review.

### Prompt 4 — scoring engine
Implement a deterministic scoring engine for leads and accounts. Include score components for fit, intent, engagement, recency, product usage, and manual priority. Persist score history and generate human-readable explanation objects and reason codes for each score change.

### Prompt 5 — routing engine
Implement a deterministic routing engine that assigns owners and queues using named account precedence, existing owner, strategic tier override, territory + segment rules, and round-robin fallback. Include capacity checks, SLA assignment, explanation objects, and a simulation endpoint.

### Prompt 6 — action engine
Implement a next-best-action engine that creates tasks based on lead temperature, source, and score. Use deterministic templates first. Add optional AI-generated action notes for contextual summaries. Persist tasks and due dates tied to SLA policy.

### Prompt 7 — account detail UI
Build an account detail page that shows account metadata, score breakdown, signal timeline, contacts, open tasks, routing decisions, audit log, and an AI-generated summary panel. Optimize for operator clarity and fast drill-down.

### Prompt 8 — dashboard
Build an internal dashboard for GTM operations with KPI cards, charts for signal volume and SLA health, a hot leads table, an unmatched signals panel, and a recent routing decisions feed. Use believable seeded metrics and make each section link to underlying workflows.

### Prompt 9 — tests
Write unit tests for scoring, routing precedence, SLA deadline assignment, and reason code generation. Add one integration test for signal ingestion to routing and one E2E happy-path test for urgent inbound lead creation.

### Prompt 10 — README
Write a recruiter-friendly README for this repository. Explain the business problem, architecture, features, demo flow, scoring logic, routing logic, AI usage boundaries, setup steps, screenshots to include, and future enhancements. Frame the project as a GTM Engineering portfolio piece.

---

## 32) Build Schedule Recommendation

### Week 1
- scaffold app
- schema + seed data
- dashboard shell
- accounts list and detail page skeleton

### Week 2
- signal ingestion
- identity resolution
- scoring engine
- score history UI

### Week 3
- routing engine
- action engine
- tasks and SLA tracking
- audit log

### Week 4
- unmatched queue
- routing simulator
- AI summary cards
- README, Loom, screenshots, tests

---

## 33) What Not to Do
- do not turn this into a generic CRM clone
- do not over-index on flashy UI
- do not make AI the core decision-maker
- do not add too many integrations early
- do not build features that do not support the main signal-to-action story
- do not leave routing or scoring opaque

---

## 34) Final Positioning Statement
This project should be the strongest proof on your GitHub that you understand how modern GTM systems actually work. It should show that you can turn fragmented account signals into trusted operational decisions, create workflow leverage for revenue teams, and measure business outcomes with engineering discipline.

