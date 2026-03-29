import { NextResponse } from "next/server";
import { ZodError } from "zod";

import type {
  PublicDashboardApiErrorResponseContract,
  PublicDashboardConversionApiErrorCode,
} from "@/lib/contracts/dashboard";
import { getDashboardConversionView } from "@/lib/data/dashboard";
import { parseDashboardFilters } from "@/lib/validation/dashboard";

export const runtime = "nodejs";

function maybeThrowForcedError(request: Request) {
  if (
    process.env.NODE_ENV === "test" &&
    request.headers.get("x-force-error") === "1"
  ) {
    throw new Error("Forced dashboard conversion route failure.");
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues.map((issue) => issue.message).join("; ");
  }

  return error instanceof Error
    ? error.message
    : "Unexpected dashboard conversion error.";
}

function createErrorResponse(
  code: PublicDashboardConversionApiErrorCode,
  message: string,
  error: string | null,
  status: number,
) {
  const payload: PublicDashboardApiErrorResponseContract<PublicDashboardConversionApiErrorCode> =
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
    const view = await getDashboardConversionView(filters);
    return NextResponse.json(view, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return createErrorResponse(
        "DASHBOARD_CONVERSION_VALIDATION_ERROR",
        "Dashboard conversion filter validation failed.",
        getErrorMessage(error),
        400,
      );
    }

    return createErrorResponse(
      "DASHBOARD_CONVERSION_INTERNAL_ERROR",
      "Dashboard conversion query failed.",
      getErrorMessage(error),
      500,
    );
  }
}
