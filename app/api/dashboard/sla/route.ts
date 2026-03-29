import { NextResponse } from "next/server";

import { getDashboardSlaSummary } from "@/lib/sla";

export const runtime = "nodejs";

function maybeThrowForcedError(request: Request) {
  if (process.env.NODE_ENV === "test" && request.headers.get("x-force-error") === "1") {
    throw new Error("Forced dashboard SLA route failure.");
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected SLA dashboard error.";
}

export async function GET(request: Request) {
  try {
    maybeThrowForcedError(request);
    const summary = await getDashboardSlaSummary();
    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        code: "DASHBOARD_SLA_INTERNAL_ERROR",
        message: "Dashboard SLA summary failed.",
        error: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
