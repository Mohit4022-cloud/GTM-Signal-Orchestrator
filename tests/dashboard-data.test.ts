import assert from "node:assert/strict";
import { Geography, Segment } from "@prisma/client";
import { after, beforeEach, test } from "node:test";

import { getDashboardTaskSummary } from "@/lib/actions";
import { getDashboardConversionView } from "@/lib/data/dashboard";
import { db } from "@/lib/db";
import { withMissingTableFallback } from "@/lib/prisma-errors";
import {
  getDashboardData,
  getDashboardSummary,
  getWorkspaceTeasers,
} from "@/lib/queries/dashboard";

import { resetDatabase } from "./helpers/db";

async function renameRoutingDecisionTable(from: string, to: string) {
  await db.$executeRawUnsafe("PRAGMA foreign_keys = OFF");
  await db.$executeRawUnsafe(`ALTER TABLE "${from}" RENAME TO "${to}"`);
  await db.$executeRawUnsafe("PRAGMA foreign_keys = ON");
}

beforeEach(async () => {
  await resetDatabase();
});

after(async () => {
  await resetDatabase();
});

test("dashboard contracts stay stable when the RoutingDecision table is unavailable", async () => {
  await renameRoutingDecisionTable("RoutingDecision", "RoutingDecision__backup");

  try {
    const [summary, dashboardData, teasers] = await Promise.all([
      getDashboardSummary(),
      getDashboardData(),
      getWorkspaceTeasers(),
    ]);

    const routedToday = summary.kpis.find((kpi) => kpi.key === "routedToday");

    assert.ok(routedToday, "Expected routedToday KPI to be present.");
    assert.equal(routedToday.rawValue, 0);
    assert.equal(routedToday.change, "0 recent routing decisions");
    assert.deepEqual(dashboardData.recentRoutingDecisions, []);
    assert.deepEqual(summary.routingReasonDistribution, []);
    assert.equal(teasers["routing-simulator"]?.teaserValue, "0");
    assert.equal(teasers.signals?.secondaryValue, "0");
  } finally {
    await renameRoutingDecisionTable("RoutingDecision__backup", "RoutingDecision");
  }
});

test("missing-table fallback does not swallow unrelated errors", async () => {
  await assert.rejects(
    () =>
      withMissingTableFallback(async () => {
        throw new Error("unexpected failure");
      }, [] as string[]),
    /unexpected failure/,
  );
});

test("dashboard task summary exposes stable phase 4 aggregate fields", async () => {
  const summary = await getDashboardTaskSummary();

  assert.equal(typeof summary.asOfIso, "string");
  assert.equal(typeof summary.openCount, "number");
  assert.equal(typeof summary.inProgressCount, "number");
  assert.equal(typeof summary.overdueCount, "number");
  assert.equal(typeof summary.urgentCount, "number");
  assert.equal(typeof summary.unassignedCount, "number");
  assert.equal(typeof summary.trackedSlaCount, "number");
  assert.equal(typeof summary.breachedCount, "number");
  assert.equal(typeof summary.dueSoonCount, "number");
});

test("dashboard summary exposes phase 5 demo metrics and benchmark metadata", async () => {
  const [summary, dashboardData] = await Promise.all([
    getDashboardSummary(),
    getDashboardData(),
  ]);

  assert.equal(summary.kpis.length, 6);
  assert.equal(summary.signalVolume14d.length, 14);
  assert.equal(summary.signalVolumeSeries.points.length, 14);
  assert.equal(summary.demoMeta.dataMode, "demo_sample");
  assert.ok(summary.kpis.find((kpi) => kpi.key === "signalsReceivedToday")!.rawValue > 0);
  assert.ok(summary.kpis.find((kpi) => kpi.key === "routedToday")!.rawValue > 0);
  assert.ok(summary.tasksDueToday.totalCount > 0);
  assert.ok(summary.routingReasonDistribution.length > 0);
  assert.ok(summary.conversionByScoreBucket.length === 4);
  assert.ok(summary.unmatchedSignalsPreview.totalCount >= 1);
  assert.ok(summary.benchmarkMetrics.length >= 4);
  assert.ok(
    summary.benchmarkMetrics.every((metric) =>
      metric.method === "derived"
        ? Boolean(metric.formula) && typeof metric.numerator === "number"
        : Boolean(metric.benchmarkLabel) && metric.scenarioLabels.length > 0,
    ),
  );
  assert.equal(dashboardData.demoMeta?.dataMode, "demo_sample");
  assert.ok((dashboardData.routingReasonDistribution?.length ?? 0) > 0);
  assert.ok((dashboardData.tasksDueToday?.totalCount ?? 0) > 0);
});

test("dashboard filters narrow the seeded analytics views", async () => {
  const unfilteredSummary = await getDashboardSummary();
  const referenceDate = unfilteredSummary.demoMeta.referenceDateIso.slice(0, 10);
  const unfilteredConversionView = await getDashboardConversionView();

  const [strategicSummary, regionalSummary, dailyConversionView] =
    await Promise.all([
      getDashboardSummary({ segment: Segment.STRATEGIC }),
      getDashboardSummary({ geography: Geography.NA_EAST }),
      getDashboardConversionView({
        startDate: referenceDate,
        endDate: referenceDate,
      }),
    ]);

  assert.equal(strategicSummary.appliedFilters.segment, Segment.STRATEGIC);
  assert.ok(
    strategicSummary.hotAccounts.every(
      (account) => account.segment === Segment.STRATEGIC,
    ),
  );
  assert.ok(
    strategicSummary.signalVolumeSeries.totalSignals <=
      unfilteredSummary.signalVolumeSeries.totalSignals,
  );

  assert.equal(regionalSummary.appliedFilters.geography, Geography.NA_EAST);
  assert.ok(
    regionalSummary.signalVolumeSeries.totalSignals <=
      unfilteredSummary.signalVolumeSeries.totalSignals,
  );

  assert.equal(dailyConversionView.appliedFilters.startDate, referenceDate);
  assert.equal(dailyConversionView.appliedFilters.endDate, referenceDate);
  assert.ok(
    dailyConversionView.leadVolumeBySource.reduce((sum, item) => sum + item.value, 0) <=
      unfilteredConversionView.leadVolumeBySource.reduce(
        (sum, item) => sum + item.value,
        0,
      ),
  );
});
