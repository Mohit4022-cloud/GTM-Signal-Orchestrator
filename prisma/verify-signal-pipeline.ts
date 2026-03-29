import { readFile } from "node:fs/promises";

import { SignalStatus } from "@prisma/client";

import {
  getAccountTimeline,
  getRecentSignals,
  getSignalById,
  getUnmatchedSignals,
  ingestSignal,
  uploadSignalsCsv,
} from "../lib/data/signals";
import { db } from "../lib/db";

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const matchedResult = await ingestSignal({
    source_system: "website",
    event_type: "pricing_page_visit",
    account_domain: "northstaranalytics.com",
    occurred_at: "2026-03-27T06:00:00.000Z",
    received_at: "2026-03-27T06:03:00.000Z",
    payload: {
      page: "/pricing",
      session_id: "verify_pipeline_match_1",
      visit_count: 4,
    },
  });

  invariant(matchedResult.created, "Expected matched ingest to create a signal.");
  invariant(matchedResult.outcome === "matched", "Expected matched ingest outcome.");
  invariant(matchedResult.matchedEntities.account?.name === "Northstar Analytics", "Expected Northstar match.");

  const duplicateResult = await ingestSignal({
    source_system: "website",
    event_type: "pricing_page_visit",
    account_domain: "northstaranalytics.com",
    occurred_at: "2026-03-27T06:00:00.000Z",
    received_at: "2026-03-27T06:03:00.000Z",
    payload: {
      page: "/pricing",
      session_id: "verify_pipeline_match_1",
      visit_count: 4,
    },
  });

  invariant(!duplicateResult.created, "Expected duplicate ingest to skip insert.");
  invariant(duplicateResult.outcome === "duplicate", "Expected duplicate ingest outcome.");
  invariant(duplicateResult.signalId === matchedResult.signalId, "Duplicate should reference the original signal.");

  const contactMatchResult = await ingestSignal({
    source_system: "product",
    event_type: "product_usage_milestone",
    contact_email: "avery.bennett@northstaranalytics.com",
    occurred_at: "2026-03-27T06:20:00.000Z",
    received_at: "2026-03-27T06:24:00.000Z",
    payload: {
      workspace_id: "verify_workspace_1",
      milestone: "connected_crm",
      user_id: "verify_user_1",
    },
  });

  invariant(contactMatchResult.outcome === "matched", "Expected contact-only ingest to match.");
  invariant(
    contactMatchResult.reasonCodes.includes("contact_implies_account"),
    "Expected contact_implies_account reason code.",
  );

  const unmatchedResult = await ingestSignal({
    source_system: "calendar",
    event_type: "meeting_no_show",
    occurred_at: "2026-03-27T06:40:00.000Z",
    received_at: "2026-03-27T06:44:00.000Z",
    payload: {
      meeting_id: "verify_no_match_1",
      calendar_event_id: "verify_no_match_1",
      meeting_type: "demo",
    },
  });

  invariant(unmatchedResult.outcome === "unmatched", "Expected missing identity ingest to remain unmatched.");
  invariant(unmatchedResult.status === SignalStatus.UNMATCHED, "Expected unmatched status.");

  const csvFixture = await readFile(new URL("../tests/fixtures/signals-upload.csv", import.meta.url), "utf8");
  const uploadResult = await uploadSignalsCsv({
    file: new File([csvFixture], "signals-upload.csv", {
      type: "text/csv",
    }),
  });

  invariant(uploadResult.processed === 4, `Expected 4 CSV rows, found ${uploadResult.processed}.`);
  invariant(uploadResult.inserted === 3, `Expected 3 inserted CSV rows, found ${uploadResult.inserted}.`);
  invariant(uploadResult.duplicates === 1, `Expected 1 duplicate CSV row, found ${uploadResult.duplicates}.`);
  invariant(uploadResult.unmatched === 1, `Expected 1 unmatched CSV row, found ${uploadResult.unmatched}.`);
  invariant(uploadResult.errors === 0, `Expected 0 CSV row errors, found ${uploadResult.errors}.`);

  const recentSignals = await getRecentSignals(5);
  invariant(recentSignals.length === 5, `Expected 5 recent signals, found ${recentSignals.length}.`);

  const accountTimeline = await getAccountTimeline("acc_northstar_analytics", { limit: 25 });
  invariant(accountTimeline.length > 0, "Expected Northstar account timeline rows.");
  invariant(
    accountTimeline.some((item) => item.signalId === matchedResult.signalId),
    "Expected newly ingested signal in Northstar timeline.",
  );
  invariant(
    accountTimeline.every(
      (item) =>
        item.eventTypeLabel.length > 0 &&
        item.sourceSystemLabel.length > 0 &&
        item.statusLabel.length > 0 &&
        item.receivedAtIso.length > 0,
    ),
    "Expected stable timeline labels and received timestamps.",
  );

  const unmatchedSignals = await getUnmatchedSignals({ limit: 25 });
  invariant(unmatchedSignals.length >= 10, "Expected unmatched queue rows after seed plus verification inserts.");
  invariant(
    unmatchedSignals.some((item) => item.signalId === unmatchedResult.signalId),
    "Expected unmatched verification signal in queue.",
  );
  invariant(
    unmatchedSignals.every(
      (item) =>
        item.reasonDetails.length > 0 &&
        item.primaryReason.recommendedQueue === item.recommendedQueue &&
        item.displayTitle.length > 0 &&
        item.displaySubtitle.length > 0,
    ),
    "Expected display-safe unmatched queue reason metadata.",
  );

  const signalDetail = await getSignalById(matchedResult.signalId);
  invariant(signalDetail !== null, "Expected signal detail for matched verification signal.");
  invariant(signalDetail.auditTrail.length >= 3, "Expected signal detail audit trail entries.");
  invariant(signalDetail.rawPayload.payload !== undefined, "Expected raw payload to include original payload envelope.");

  console.log("Signal pipeline verification passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
