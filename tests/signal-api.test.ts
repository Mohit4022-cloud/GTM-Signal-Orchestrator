import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { readFile } from "node:fs/promises";

import { POST as ingestPost } from "@/app/api/signals/route";
import { POST as uploadPost } from "@/app/api/signals/upload/route";

import { resetDatabase } from "./helpers/db";

before(() => {
  resetDatabase();
});

after(() => {
  resetDatabase();
});

test("POST /api/signals returns 201 for a new matched signal", async () => {
  const response = await ingestPost(
    new Request("http://localhost/api/signals", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        source_system: "website",
        event_type: "pricing_page_visit",
        account_domain: "northstaranalytics.com",
        contact_email: "avery.bennett@northstaranalytics.com",
        occurred_at: "2026-03-27T09:00:00.000Z",
        received_at: "2026-03-27T09:04:00.000Z",
        payload: {
          page: "/pricing",
          session_id: "api_match_test_1",
          visit_count: 3,
        },
      }),
    }),
  );

  const payload = await response.json();
  assert.equal(response.status, 201);
  assert.equal(payload.outcome, "matched");
  assert.equal(payload.created, true);
  assert.ok(Array.isArray(payload.reasonCodes));
  assert.equal("dedupe" in payload, false);
  assert.equal("normalizedEvent" in payload, false);
  assert.equal("errorMessage" in payload, false);
});

test("POST /api/signals returns 200 for a duplicate signal", async () => {
  const requestBody = {
    source_system: "website",
    event_type: "website_visit",
    account_domain: "northstaranalytics.com",
    occurred_at: "2026-03-27T09:20:00.000Z",
    received_at: "2026-03-27T09:25:00.000Z",
    payload: {
      page: "/docs",
      session_id: "api_duplicate_test_1",
      visit_count: 1,
    },
  };

  await ingestPost(
    new Request("http://localhost/api/signals", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(requestBody),
    }),
  );

  const duplicateResponse = await ingestPost(
    new Request("http://localhost/api/signals", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(requestBody),
    }),
  );

  const payload = await duplicateResponse.json();
  assert.equal(duplicateResponse.status, 200);
  assert.equal(payload.outcome, "duplicate");
  assert.equal(payload.created, false);
  assert.equal("dedupe" in payload, false);
  assert.equal("normalizedEvent" in payload, false);
});

test("POST /api/signals returns 400 for validation errors", async () => {
  const response = await ingestPost(
    new Request("http://localhost/api/signals", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        source_system: "website",
        event_type: "unsupported_type",
        occurred_at: "not-a-date",
      }),
    }),
  );

  const payload = await response.json();
  assert.equal(response.status, 400);
  assert.equal(payload.code, "SIGNAL_VALIDATION_ERROR");
  assert.match(payload.message, /validation failed/i);
  assert.equal(typeof payload.error, "string");
});

test("POST /api/signals returns 400 for chronological validation errors", async () => {
  const response = await ingestPost(
    new Request("http://localhost/api/signals", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        source_system: "website",
        event_type: "website_visit",
        account_domain: "northstaranalytics.com",
        occurred_at: "2026-03-27T10:00:00.000Z",
        received_at: "2026-03-27T09:59:00.000Z",
        payload: {
          page: "/security",
          session_id: "api_invalid_chronology_1",
        },
      }),
    }),
  );

  const payload = await response.json();
  assert.equal(response.status, 400);
  assert.equal(payload.code, "SIGNAL_VALIDATION_ERROR");
  assert.match(payload.error, /received_at must be greater than or equal to occurred_at/);
});

test("POST /api/signals/upload returns batch summary counts", async () => {
  const csvFixture = await readFile(new URL("./fixtures/signals-upload.csv", import.meta.url), "utf8");
  const formData = new FormData();
  formData.set(
    "file",
    new File([csvFixture], "signals-upload.csv", {
      type: "text/csv",
    }),
  );

  const response = await uploadPost(
    new Request("http://localhost/api/signals/upload", {
      method: "POST",
      body: formData,
    }),
  );

  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.processed, 4);
  assert.equal(payload.duplicates, 1);
  assert.equal(payload.unmatched, 1);
  assert.equal(payload.errors, 0);
  assert.equal("code" in payload, false);
});

test("POST /api/signals/upload returns row errors without failing the batch", async () => {
  const csvFixture = await readFile(new URL("./fixtures/signals-upload-invalid.csv", import.meta.url), "utf8");
  const formData = new FormData();
  formData.set(
    "file",
    new File([csvFixture], "signals-upload-invalid.csv", {
      type: "text/csv",
    }),
  );

  const response = await uploadPost(
    new Request("http://localhost/api/signals/upload", {
      method: "POST",
      body: formData,
    }),
  );

  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.processed, 3);
  assert.equal(payload.inserted, 0);
  assert.equal(payload.duplicates, 0);
  assert.equal(payload.unmatched, 0);
  assert.equal(payload.errors, 3);
});

test("POST /api/signals/upload returns 400 when the file is missing", async () => {
  const response = await uploadPost(
    new Request("http://localhost/api/signals/upload", {
      method: "POST",
      body: new FormData(),
    }),
  );

  const payload = await response.json();
  assert.equal(response.status, 400);
  assert.equal(payload.code, "UPLOAD_FILE_REQUIRED");
  assert.equal(payload.error, null);
});
