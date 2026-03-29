import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { generateAccountSummary } from "@/lib/ai";
import { recordAiAccountSummaryGenerated, recordAiGenerationFailed } from "@/lib/audit/ai";
import type {
  PublicAiApiErrorCode,
  PublicAiApiErrorResponseContract,
} from "@/lib/contracts/ai";
import { db } from "@/lib/db";
import { parseAccountSummaryRequest } from "@/lib/validation/ai";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ accountId: string }>;
};

function maybeThrowForcedError(request: Request) {
  if (process.env.NODE_ENV === "test" && request.headers.get("x-force-error") === "1") {
    throw new Error("Forced AI account summary route failure.");
  }
}

async function parseOptionalJsonBody(request: Request) {
  const rawBody = await request.text();

  if (!rawBody.trim()) {
    return {};
  }

  return JSON.parse(rawBody) as unknown;
}

function getErrorMessage(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues.map((issue) => issue.message).join("; ");
  }

  return error instanceof Error ? error.message : "Unexpected AI account summary error.";
}

function createErrorResponse(
  code: PublicAiApiErrorCode,
  message: string,
  error: string | null,
  status: number,
) {
  const payload: PublicAiApiErrorResponseContract = {
    code,
    message,
    error,
  };

  return NextResponse.json(payload, { status });
}

async function logAccountSummaryEvent(result: Awaited<ReturnType<typeof generateAccountSummary>>) {
  if (!result) {
    return;
  }

  try {
    if (result.status === "generated") {
      await recordAiAccountSummaryGenerated(db, {
        accountId: result.accountId,
        explanation: "AI account summary generated from grounded account context.",
        provider: result.provider,
        afterState: {
          status: result.status,
          generatedAt: result.generatedAt,
          keyDriverCount: result.keyDrivers.length,
          sourceSummary: result.sourceSummary,
        },
      });

      return;
    }

    if (result.status === "error") {
      await recordAiGenerationFailed(db, {
        entityType: "account",
        entityId: result.accountId,
        accountId: result.accountId,
        explanation: result.message ?? "AI account summary generation failed.",
        provider: result.provider,
        afterState: {
          status: result.status,
          message: result.message,
          sourceSummary: result.sourceSummary,
        },
      });
    }
  } catch {
    // Audit logging is intentionally best-effort for AI assist endpoints.
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    maybeThrowForcedError(request);
    const { accountId } = await context.params;
    const body = await parseOptionalJsonBody(request);
    const input = parseAccountSummaryRequest(body);
    const result = await generateAccountSummary(accountId, input);

    if (!result) {
      return createErrorResponse(
        "AI_NOT_FOUND",
        `Account ${accountId} was not found.`,
        `Account ${accountId} was not found.`,
        404,
      );
    }

    await logAccountSummaryEvent(result);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      return createErrorResponse(
        "AI_VALIDATION_ERROR",
        "AI account summary payload validation failed.",
        getErrorMessage(error),
        400,
      );
    }

    return createErrorResponse(
      "AI_INTERNAL_ERROR",
      "AI account summary generation failed.",
      getErrorMessage(error),
      500,
    );
  }
}
