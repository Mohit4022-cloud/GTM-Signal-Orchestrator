import { NextResponse } from "next/server";
import { ZodError } from "zod";

import type {
  PublicDashboardApiErrorResponseContract,
  PublicDashboardSummaryApiErrorCode,
} from "@/lib/contracts/dashboard";
import { getDashboardSummary } from "@/lib/data/dashboard";
import { parseDashboardFilters } from "@/lib/validation/dashboard";

export const runtime = "nodejs";

function maybeThrowForcedError(request: Request) {
  if (
    process.env.NODE_ENV === "test" &&
    request.headers.get("x-force-error") === "1"
  ) {
    throw new Error("Forced dashboard summary route failure.");
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues.map((issue) => issue.message).join("; ");
  }

  return error instanceof Error
    ? error.message
    : "Unexpected dashboard summary error.";
}

function createErrorResponse(
  code: PublicDashboardSummaryApiErrorCode,
  message: string,
  error: string | null,
  status: number,
) {
  const payload: PublicDashboardApiErrorResponseContract<PublicDashboardSummaryApiErrorCode> =
    {
      code,
      message,
      error,
    };

  return NextResponse.json(payload, { status });
}

export async function GET(request: Request) {
  try {
    maybeThrowForcedError(request);
    const filters = parseDashboardFilters(new URL(request.url).searchParams);
    const summary = await getDashboardSummary(filters);
    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return createErrorResponse(
        "DASHBOARD_SUMMARY_VALIDATION_ERROR",
        "Dashboard summary filter validation failed.",
        getErrorMessage(error),
        400,
      );
    }

    return createErrorResponse(
      "DASHBOARD_SUMMARY_INTERNAL_ERROR",
      "Dashboard summary query failed.",
      getErrorMessage(error),
      500,
    );
  }
}
