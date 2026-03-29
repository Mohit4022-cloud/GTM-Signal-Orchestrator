import { NextResponse } from "next/server";
import { ZodError } from "zod";

import type { PublicLeadApiErrorCode, PublicLeadApiErrorResponseContract } from "@/lib/contracts/leads";
import { getLeadQueue } from "@/lib/queries/leads";
import { parseLeadFilters } from "@/lib/validation/leads";

export const runtime = "nodejs";

function maybeThrowForcedError(request: Request) {
  if (process.env.NODE_ENV === "test" && request.headers.get("x-force-error") === "1") {
    throw new Error("Forced lead route failure.");
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues.map((issue) => issue.message).join("; ");
  }

  return error instanceof Error ? error.message : "Unexpected lead error.";
}

function createErrorResponse(
  code: PublicLeadApiErrorCode,
  message: string,
  error: string | null,
  status: number,
) {
  const payload: PublicLeadApiErrorResponseContract = {
    code,
    message,
    error,
  };

  return NextResponse.json(payload, { status });
}

export async function GET(request: Request) {
  try {
    maybeThrowForcedError(request);
    const filters = parseLeadFilters(new URL(request.url).searchParams);
    const queue = await getLeadQueue(filters);
    return NextResponse.json(queue, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return createErrorResponse(
        "LEAD_VALIDATION_ERROR",
        "Lead filter validation failed.",
        getErrorMessage(error),
        400,
      );
    }

    return createErrorResponse(
      "LEAD_INTERNAL_ERROR",
      "Lead query failed.",
      getErrorMessage(error),
      500,
    );
  }
}
