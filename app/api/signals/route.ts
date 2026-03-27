import { NextResponse } from "next/server";
import { ZodError } from "zod";

import type {
  PublicIngestSignalResponseContract,
  PublicSignalApiErrorCode,
  PublicSignalApiErrorResponseContract,
} from "@/lib/contracts/signals";
import { ingestSignal } from "@/lib/data/signals";

export const runtime = "nodejs";

function getErrorMessage(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues.map((issue) => issue.message).join("; ");
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected signal ingest error.";
}

function createErrorResponse(
  code: PublicSignalApiErrorCode,
  message: string,
  error: string | null,
  status: number,
) {
  const payload: PublicSignalApiErrorResponseContract = {
    code,
    message,
    error,
  };

  return NextResponse.json(payload, { status });
}

function serializeIngestSignalResponse(
  result: Awaited<ReturnType<typeof ingestSignal>>,
): PublicIngestSignalResponseContract {
  return {
    signalId: result.signalId,
    created: result.created,
    status: result.status,
    outcome: result.outcome,
    matchedEntities: result.matchedEntities,
    reasonCodes: result.reasonCodes,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await ingestSignal(body);
    const status = result.outcome === "duplicate" ? 200 : 201;
    return NextResponse.json(serializeIngestSignalResponse(result), { status });
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      return createErrorResponse(
        "SIGNAL_VALIDATION_ERROR",
        "Signal payload validation failed.",
        getErrorMessage(error),
        400,
      );
    }

    return createErrorResponse(
      "SIGNAL_INTERNAL_ERROR",
      "Signal ingest failed.",
      getErrorMessage(error),
      500,
    );
  }
}
