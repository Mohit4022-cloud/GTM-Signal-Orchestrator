import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { readFile } from "node:fs/promises";

import { SignalStatus } from "@prisma/client";

import { buildSignalDedupeBasis, computeSignalDedupeKey } from "@/lib/data/signals/dedupe";
import {
  getAccountTimeline,
  getSignalById,
  getUnmatchedSignals,
  ingestSignal,
  uploadSignalsCsv,
} from "@/lib/data/signals";
import { normalizeSignal } from "@/lib/data/signals/normalize";
import { db } from "@/lib/db";
import { parseSignalInput } from "@/lib/validation/signals";

import { resetDatabase } from "./helpers/db";

before(async () => {
  await resetDatabase();
});

after(async () => {
  await resetDatabase();
});

test("ingestSignal matches an account by domain only", async () => {
  const result = await ingestSignal({
    source_system: "website",
    event_type: "pricing_page_visit",
    account_domain: "northstaranalytics.com",
    occurred_at: "2026-03-27T07:00:00.000Z",
    received_at: "2026-03-27T07:04:00.000Z",
    payload: {
      page: "/pricing",
      session_id: "test_match_domain_only",
      visit_count: 3,
    },
  });

  assert.equal(result.created, true);
  assert.equal(result.outcome, "matched");
  assert.equal(result.status, SignalStatus.MATCHED);
  assert.equal(result.matchedEntities.account?.name, "Northstar Analytics");
  assert.equal(result.matchedEntities.contact, null);
  assert.ok(result.reasonCodes.includes("account_domain_exact_match"));
});

test("ingestSignal derives account from contact email", async () => {
  const result = await ingestSignal({
    source_system: "product",
    event_type: "product_usage_milestone",
    contact_email: "avery.bennett@northstaranalytics.com",
    occurred_at: "2026-03-27T07:20:00.000Z",
    received_at: "2026-03-27T07:24:00.000Z",
    payload: {
      workspace_id: "test_workspace_contact_only",
      milestone: "connected_crm",
      user_id: "test_user_contact_only",
    },
  });

  assert.equal(result.outcome, "matched");
  assert.ok(result.reasonCodes.includes("contact_implies_account"));
  assert.equal(result.matchedEntities.contact?.name, "Avery Bennett");
  assert.equal(result.matchedEntities.account?.name, "Northstar Analytics");
});

test("ingestSignal marks conflicting matches as unmatched", async () => {
  const conflictingContact = await db.contact.findFirstOrThrow({
    where: {
      accountId: "acc_alloyworks",
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const result = await ingestSignal({
    source_system: "calendar",
    event_type: "meeting_booked",
    account_domain: "summitflowfinance.com",
    contact_email: conflictingContact.email,
    occurred_at: "2026-03-27T07:40:00.000Z",
    received_at: "2026-03-27T07:45:00.000Z",
    payload: {
      meeting_id: "test_conflict_meeting_1",
      calendar_event_id: "test_conflict_calendar_1",
      meeting_type: "exec_review",
    },
  });

  assert.equal(result.outcome, "unmatched");
  assert.equal(result.status, SignalStatus.UNMATCHED);
  assert.ok(result.reasonCodes.includes("conflicting_match_candidates"));
});

test("ingestSignal skips duplicates deterministically", async () => {
  const input = {
    source_system: "website",
    event_type: "website_visit" as const,
    account_domain: "northstaranalytics.com",
    contact_email: "avery.bennett@northstaranalytics.com",
    occurred_at: "2026-03-27T08:00:00.000Z",
    received_at: "2026-03-27T08:02:00.000Z",
    payload: {
      page: "/integrations/salesforce",
      session_id: "test_duplicate_visit_1",
      visit_count: 1,
    },
  };

  const first = await ingestSignal(input);
  const second = await ingestSignal(input);

  assert.equal(first.created, true);
  assert.equal(second.created, false);
  assert.equal(second.outcome, "duplicate");
  assert.equal(second.signalId, first.signalId);
});

test("dedupe basis is explicit and deterministic", () => {
  const input = {
    source_system: "website",
    event_type: "website_visit" as const,
    account_domain: "northstaranalytics.com",
    contact_email: "avery.bennett@northstaranalytics.com",
    occurred_at: "2026-03-27T08:00:00.000Z",
    received_at: "2026-03-27T08:02:00.000Z",
    payload: {
      page: "/integrations/salesforce",
      session_id: "test_duplicate_visit_2",
      visit_count: 1,
    },
  };
  const normalized = normalizeSignal(parseSignalInput(input));
  const dedupeBasis = buildSignalDedupeBasis(normalized);

  assert.deepEqual(dedupeBasis, {
    sourceSystem: "website",
    eventType: "WEBSITE_VISIT",
    accountDomain: "northstaranalytics.com",
    contactEmail: "avery.bennett@northstaranalytics.com",
    occurredAtIso: "2026-03-27T08:00:00.000Z",
    rawReference: {
      page: "/integrations/salesforce",
      session_id: "test_duplicate_visit_2",
      visit_count: "1",
    },
    payloadFingerprint: null,
  });
  assert.equal(computeSignalDedupeKey(normalized), computeSignalDedupeKey(normalized));
});

test("ingestSignal rejects received_at earlier than occurred_at", async () => {
  await assert.rejects(
    () =>
      ingestSignal({
        source_system: "website",
        event_type: "website_visit",
        account_domain: "northstaranalytics.com",
        occurred_at: "2026-03-27T10:00:00.000Z",
        received_at: "2026-03-27T09:59:00.000Z",
        payload: {
          page: "/security",
          session_id: "invalid_received_before_occurred",
        },
      }),
    /received_at must be greater than or equal to occurred_at/,
  );
});

test("uploadSignalsCsv returns mixed row outcomes without failing the batch", async () => {
  const csvFixture = await readFile(new URL("./fixtures/signals-upload.csv", import.meta.url), "utf8");
  const result = await uploadSignalsCsv({
    file: new File([csvFixture], "signals-upload.csv", {
      type: "text/csv",
    }),
  });

  assert.equal(result.processed, 4);
  assert.equal(result.inserted, 3);
  assert.equal(result.duplicates, 1);
  assert.equal(result.unmatched, 1);
  assert.equal(result.errors, 0);
});

test("query contracts expose timeline, unmatched queue, and signal detail", async () => {
  const unmatched = await getUnmatchedSignals({ limit: 25 });
  assert.ok(unmatched.length >= 10);
  assert.ok(unmatched[0]!.reasonDetails.length > 0);
  assert.equal(unmatched[0]!.primaryReason.recommendedQueue, unmatched[0]!.recommendedQueue);
  assert.ok(unmatched[0]!.displayTitle.length > 0);
  assert.ok(unmatched[0]!.displaySubtitle.length > 0);
  assert.ok(unmatched[0]!.accountDomainDisplay.length > 0);
  assert.ok(unmatched[0]!.contactEmailDisplay.length > 0);

  const timeline = await getAccountTimeline("acc_northstar_analytics", { limit: 10 });
  assert.ok(timeline.length > 0);
  assert.ok(timeline[0]!.displayTitle.length > 0);
  assert.ok(timeline[0]!.displaySubtitle.length > 0);
  assert.ok(timeline[0]!.eventTypeLabel.length > 0);
  assert.ok(timeline[0]!.sourceSystemLabel.length > 0);
  assert.ok(timeline[0]!.statusLabel.length > 0);
  assert.ok(timeline[0]!.receivedAtIso.length > 0);

  const detail = await getSignalById(timeline[0]!.signalId);
  assert.ok(detail);
  assert.ok(detail.auditTrail.length >= 3);
  assert.ok(detail.normalizedSummary.payloadSummary.length > 0);
});

test("getAccountTimeline uses deterministic ordering and contact display fallbacks", async () => {
  const contact = await db.contact.findFirstOrThrow({
    where: {
      accountId: "acc_northstar_analytics",
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  await db.contact.update({
    where: {
      id: contact.id,
    },
    data: {
      firstName: "",
      lastName: "",
    },
  });

  const firstResult = await ingestSignal({
    source_system: "website",
    event_type: "website_visit",
    account_domain: "northstaranalytics.com",
    contact_email: contact.email,
    occurred_at: "2026-03-27T23:00:00.000Z",
    received_at: "2026-03-27T23:01:00.000Z",
    payload: {
      page: "/compare",
      session_id: "timeline_same_occurred_1",
      visit_count: 1,
    },
  });
  const secondResult = await ingestSignal({
    source_system: "website",
    event_type: "website_visit",
    account_domain: "northstaranalytics.com",
    contact_email: contact.email,
    occurred_at: "2026-03-27T23:00:00.000Z",
    received_at: "2026-03-27T23:05:00.000Z",
    payload: {
      page: "/pricing",
      session_id: "timeline_same_occurred_2",
      visit_count: 2,
    },
  });

  const timeline = await getAccountTimeline("acc_northstar_analytics", { limit: 5 });
  const first = timeline.find((item) => item.signalId === firstResult.signalId);
  const second = timeline.find((item) => item.signalId === secondResult.signalId);
  const firstIndex = timeline.findIndex((item) => item.signalId === firstResult.signalId);
  const secondIndex = timeline.findIndex((item) => item.signalId === secondResult.signalId);

  assert.ok(first);
  assert.ok(second);
  assert.notEqual(firstIndex, -1);
  assert.notEqual(secondIndex, -1);
  assert.ok(secondIndex < firstIndex);
  assert.equal(second.associatedContact?.name, contact.email);
  assert.equal(second.displaySubtitle.includes(contact.email), true);
});
