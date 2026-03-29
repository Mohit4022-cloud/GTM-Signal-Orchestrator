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
  assert.ok(payload.leadMetrics.openTrackedCount >= 1);
  assert.ok(payload.leadMetrics.breachedCount >= 1);
  assert.ok(payload.taskMetrics.openTrackedCount >= 1);
  assert.ok(payload.aggregateMetrics.overdueCount >= 1);
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
