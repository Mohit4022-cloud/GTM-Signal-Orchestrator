# Demo Script

## Goal Of The Demo

Show how a GTM workspace can ingest a new signal, recompute readiness, route work deterministically, and preserve an audit trail without hiding the decision logic behind an opaque AI step.

## Preconditions

- Run `npm run db:seed` immediately before recording.
- Start the app with `npm run dev`.
- Use the Atlas Grid scenario as the main thread: `acc_atlas_grid` and `acc_atlas_grid_lead_01`.
- The fresh seed already contains a strong Atlas inbound story. The live ingest step is best used to show a new signal entering the system and updating the decision surfaces, not a blank-to-populated workspace.

## Exact Commands To Run

Start the app:

```bash
npm run db:seed
npm run dev
```

In a second terminal, keep this request ready. Change `submission_id` if you rerun it:

```bash
curl -X POST http://localhost:3000/api/signals \
  -H 'content-type: application/json' \
  -d '{
    "source_system": "website",
    "event_type": "form_fill",
    "account_domain": "atlasgridsystems.com",
    "contact_email": "kai.kim@atlasgridsystems.com",
    "occurred_at": "2026-03-29T23:35:00.000Z",
    "received_at": "2026-03-29T23:36:00.000Z",
    "payload": {
      "form_id": "request_demo",
      "submission_id": "loom_atlas_request_demo_01",
      "campaign": "demo-walkthrough"
    }
  }'
```

## 2-3 Minute Walkthrough

1. Open `/dashboard`.
2. Start with the KPI row. Call out hot account count, unmatched backlog, and average speed-to-lead.
3. Scroll just enough to show SLA health and recent routing decisions on the same screen.
4. In the second terminal, send the Atlas `request_demo` signal.
5. Return to the app and open `/accounts/acc_atlas_grid`.
6. Show the score breakdown and point out the engagement and recency reasons behind the account posture.
7. In the open-tasks section, show the follow-up work and due times tied to the current Atlas motion.
8. In the audit log, show the recent trace entries for route assignment, SLA assignment, task creation, and score recompute.
9. Mention that the lead-level contract is also available through `GET /api/leads/acc_atlas_grid_lead_01` if you want to show the exact owner, queue, and SLA payload.
10. Open `/routing-simulator` and run a matching scenario to show policy precedence without writing data.
11. Close back on `/dashboard` and restate the measurable outcomes shown in the seeded metrics.

## Optional Backup Paths

- If the dashboard looks stale after repeated testing, rerun `npm run db:seed` and refresh the browser.
- If you need a faster policy explanation, open `/routing-simulator` earlier and use it as the bridge into the Atlas account view.
- If you want a secondary account story, use BeaconOps for pricing and product-signal scoring changes rather than inbound urgency.
