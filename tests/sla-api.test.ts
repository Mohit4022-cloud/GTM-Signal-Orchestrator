import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { GET as dashboardSlaGet } from "@/app/api/dashboard/sla/route";

import { resetDatabase } from "./helpers/db";

before(async () => {
  await resetDatabase();
});

after(async () => {
  await resetDatabase();
});

test("GET /api/dashboard/sla returns dashboard-safe SLA metrics", async () => {
  const response = await dashboardSlaGet(
    new Request("http://localhost/api/dashboard/sla"),
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(typeof payload.asOfIso, "string");
  assert.equal(payload.demoMeta.dataMode, "demo_sample");
  assert.ok(payload.summary.leadMetrics.openTrackedCount >= 1);
  assert.ok(payload.summary.leadMetrics.breachedCount >= 1);
  assert.ok(payload.summary.taskMetrics.openTrackedCount >= 1);
  assert.ok(payload.summary.aggregateMetrics.overdueCount >= 1);
  assert.ok(Array.isArray(payload.complianceTrend));
  assert.ok(Array.isArray(payload.breachedLeads));
  assert.ok(payload.tasksDueToday.totalCount >= 1);
});

test("GET /api/dashboard/sla returns 400 for invalid filters", async () => {
  const response = await dashboardSlaGet(
    new Request("http://localhost/api/dashboard/sla?startDate=2026-03-30&endDate=2026-03-29"),
  );
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.code, "DASHBOARD_SLA_VALIDATION_ERROR");
});

test("GET /api/dashboard/sla returns 500 for forced failures", async () => {
  const response = await dashboardSlaGet(
    new Request("http://localhost/api/dashboard/sla", {
      headers: {
        "x-force-error": "1",
      },
    }),
  );
  const payload = await response.json();

  assert.equal(response.status, 500);
  assert.equal(payload.code, "DASHBOARD_SLA_INTERNAL_ERROR");
});
