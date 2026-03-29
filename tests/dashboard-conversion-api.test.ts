import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { GET as dashboardConversionGet } from "@/app/api/dashboard/conversion/route";

import { resetDatabase } from "./helpers/db";

before(async () => {
  await resetDatabase();
});

after(async () => {
  await resetDatabase();
});

test("GET /api/dashboard/conversion returns the phase 5 conversion contract", async () => {
  const response = await dashboardConversionGet(
    new Request("http://localhost/api/dashboard/conversion"),
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.demoMeta.dataMode, "demo_sample");
  assert.equal(payload.conversionByScoreBucket.length, 4);
  assert.ok(payload.scoreDistribution.accounts.length === 4);
  assert.ok(payload.scoreDistribution.leads.length === 4);
  assert.ok(payload.leadVolumeBySource.length >= 1);
  assert.ok(payload.pipelineStageConversionBySegment.length >= 1);
  assert.ok(payload.benchmarkMetrics.length >= 4);
});

test("GET /api/dashboard/conversion returns 400 for invalid filters", async () => {
  const response = await dashboardConversionGet(
    new Request(
      "http://localhost/api/dashboard/conversion?startDate=2026-03-30&endDate=2026-03-29",
    ),
  );
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.code, "DASHBOARD_CONVERSION_VALIDATION_ERROR");
});

test("GET /api/dashboard/conversion returns 500 for forced failures", async () => {
  const response = await dashboardConversionGet(
    new Request("http://localhost/api/dashboard/conversion", {
      headers: {
        "x-force-error": "1",
      },
    }),
  );
  const payload = await response.json();

  assert.equal(response.status, 500);
  assert.equal(payload.code, "DASHBOARD_CONVERSION_INTERNAL_ERROR");
});
