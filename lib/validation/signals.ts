import { z } from "zod";

import { ingestibleSignalEventTypes, type IngestSignalInput } from "@/lib/contracts/signals";

const payloadSchema = z.object({}).catchall(z.unknown());

export const ingestSignalSchema = z
  .object({
    source_system: z.string().trim().min(1, "source_system is required"),
    event_type: z.enum(ingestibleSignalEventTypes, {
      error: () => "event_type is not supported",
    }),
    account_domain: z.string().trim().min(1).optional().nullable(),
    contact_email: z.email().optional().nullable(),
    occurred_at: z.iso.datetime(),
    received_at: z.iso.datetime().optional().nullable(),
    payload: payloadSchema,
  })
  .superRefine((value, ctx) => {
    if (!value.received_at) {
      return;
    }

    const occurredAt = new Date(value.occurred_at);
    const receivedAt = new Date(value.received_at);

    if (receivedAt.getTime() < occurredAt.getTime()) {
      ctx.addIssue({
        code: "custom",
        message: "received_at must be greater than or equal to occurred_at",
        path: ["received_at"],
      });
    }
  });

export type ValidatedIngestSignalInput = z.infer<typeof ingestSignalSchema>;

export function parseSignalInput(input: unknown): IngestSignalInput {
  return ingestSignalSchema.parse(input);
}

export function safeParseSignalInput(input: unknown) {
  return ingestSignalSchema.safeParse(input);
}
