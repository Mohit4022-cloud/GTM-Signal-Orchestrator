import { NextResponse } from "next/server";
import { ZodError } from "zod";

import type { PublicLeadApiErrorCode, PublicLeadApiErrorResponseContract } from "@/lib/contracts/leads";
import { getLeadById, updateLead } from "@/lib/queries/leads";
import { parseUpdateLeadRequest } from "@/lib/validation/leads";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

export async function GET(request: Request, context: RouteContext) {
  try {
    maybeThrowForcedError(request);
    const { id } = await context.params;
    const lead = await getLeadById(id);

    if (!lead) {
      return createErrorResponse("LEAD_NOT_FOUND", `Lead ${id} was not found.`, `Lead ${id} was not found.`, 404);
    }

    return NextResponse.json(lead, { status: 200 });
  } catch (error) {
    return createErrorResponse(
      "LEAD_INTERNAL_ERROR",
      "Lead lookup failed.",
      getErrorMessage(error),
      500,
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    maybeThrowForcedError(request);
    const { id } = await context.params;
    const body = await request.json();
    const input = parseUpdateLeadRequest(body);
    const lead = await updateLead(id, input);

    if (!lead) {
      return createErrorResponse("LEAD_NOT_FOUND", `Lead ${id} was not found.`, `Lead ${id} was not found.`, 404);
    }

    return NextResponse.json(lead, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      return createErrorResponse(
        "LEAD_VALIDATION_ERROR",
        "Lead update payload validation failed.",
        getErrorMessage(error),
        400,
      );
    }

    return createErrorResponse(
      "LEAD_INTERNAL_ERROR",
      "Lead update failed.",
      getErrorMessage(error),
      500,
    );
  }
}
