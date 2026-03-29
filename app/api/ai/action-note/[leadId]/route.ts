import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { generateActionNote } from "@/lib/ai";
import { recordAiActionNoteGenerated, recordAiGenerationFailed } from "@/lib/audit/ai";
import type {
  PublicAiApiErrorCode,
  PublicAiApiErrorResponseContract,
} from "@/lib/contracts/ai";
import { db } from "@/lib/db";
import { parseActionNoteRequest } from "@/lib/validation/ai";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ leadId: string }>;
};

function maybeThrowForcedError(request: Request) {
  if (process.env.NODE_ENV === "test" && request.headers.get("x-force-error") === "1") {
    throw new Error("Forced AI action note route failure.");
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

  return error instanceof Error ? error.message : "Unexpected AI action note error.";
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

async function logActionNoteEvent(result: Awaited<ReturnType<typeof generateActionNote>>) {
  if (!result) {
    return;
  }

  try {
    if (result.status === "generated") {
      await recordAiActionNoteGenerated(db, {
        leadId: result.leadId,
        explanation: "AI action note generated from grounded lead context.",
        provider: result.provider,
        afterState: {
          status: result.status,
          generatedAt: result.generatedAt,
          suggestedAngle: result.suggestedAngle,
          sourceSummary: result.sourceSummary,
        },
      });

      return;
    }

    if (result.status === "error") {
      await recordAiGenerationFailed(db, {
        entityType: "lead",
        entityId: result.leadId,
        leadId: result.leadId,
        explanation: result.message ?? "AI action note generation failed.",
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
    const { leadId } = await context.params;
    const body = await parseOptionalJsonBody(request);
    const input = parseActionNoteRequest(body);
    const result = await generateActionNote(leadId, input);

    if (!result) {
      return createErrorResponse(
        "AI_NOT_FOUND",
        `Lead ${leadId} was not found.`,
        `Lead ${leadId} was not found.`,
        404,
      );
    }

    await logActionNoteEvent(result);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      return createErrorResponse(
        "AI_VALIDATION_ERROR",
        "AI action note payload validation failed.",
        getErrorMessage(error),
        400,
      );
    }

    return createErrorResponse(
      "AI_INTERNAL_ERROR",
      "AI action note generation failed.",
      getErrorMessage(error),
      500,
    );
  }
}
