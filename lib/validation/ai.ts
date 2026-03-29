import { z } from "zod";

import {
  accountSummaryModeValues,
  actionNoteModeValues,
  aiResponseLengthValues,
  type AccountSummaryRequest,
  type ActionNoteRequest,
} from "@/lib/contracts/ai";

function normalizeOptionalObject(input: unknown) {
  if (input === null || input === undefined) {
    return {};
  }

  return input;
}

export const accountSummaryRequestSchema = z
  .object({
    mode: z.enum(accountSummaryModeValues).optional(),
    length: z.enum(aiResponseLengthValues).optional(),
  })
  .strict();

export const actionNoteRequestSchema = z
  .object({
    mode: z.enum(actionNoteModeValues).optional(),
    length: z.enum(aiResponseLengthValues).optional(),
  })
  .strict();

export function parseAccountSummaryRequest(input: unknown): AccountSummaryRequest {
  return accountSummaryRequestSchema.parse(normalizeOptionalObject(input));
}

export function parseActionNoteRequest(input: unknown): ActionNoteRequest {
  return actionNoteRequestSchema.parse(normalizeOptionalObject(input));
}
