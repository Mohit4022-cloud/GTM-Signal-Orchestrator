import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { GET as dashboardSummaryGet } from "@/app/api/dashboard/summary/route";

import { resetDatabase } from "./helpers/db";

before(async () => {
  await resetDatabase();
});

after(async () => {
  await resetDatabase();
});

test("GET /api/dashboard/summary returns the phase 5 dashboard contract", async () => {
  const response = await dashboardSummaryGet(
    new Request("http://localhost/api/dashboard/summary"),
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.demoMeta.dataMode, "demo_sample");
  assert.equal(payload.kpis.length, 6);
  assert.equal(payload.signalVolumeSeries.points.length, 14);
  assert.ok(payload.routingReasonDistribution.length >= 1);
  assert.ok(payload.conversionByScoreBucket.length === 4);
  assert.ok(payload.recentRoutingDecisions.length >= 1);
  assert.ok(payload.unmatchedSignalsPreview.totalCount >= 1);
  assert.ok(payload.tasksDueToday.totalCount >= 1);
  assert.ok(payload.benchmarkMetrics.length >= 4);
});

test("GET /api/dashboard/summary returns 400 for invalid filters", async () => {
  const response = await dashboardSummaryGet(
    new Request("http://localhost/api/dashboard/summary?segment=INVALID"),
  );
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.code, "DASHBOARD_SUMMARY_VALIDATION_ERROR");
});

test("GET /api/dashboard/summary returns 500 for forced failures", async () => {
  const response = await dashboardSummaryGet(
    new Request("http://localhost/api/dashboard/summary", {
      headers: {
        "x-force-error": "1",
      },
    }),
  );
  const payload = await response.json();

  assert.equal(response.status, 500);
  assert.equal(payload.code, "DASHBOARD_SUMMARY_INTERNAL_ERROR");
});
