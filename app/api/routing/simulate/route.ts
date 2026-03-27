import { NextResponse } from "next/server";
import { ZodError } from "zod";

import type {
  PublicRoutingApiErrorCode,
  PublicRoutingApiErrorResponseContract,
  PublicRoutingSimulationResponseContract,
} from "@/lib/contracts/routing";
import { simulateRouting } from "@/lib/routing";
import { parseRoutingSimulationInput } from "@/lib/routing/validation";

export const runtime = "nodejs";

function getErrorMessage(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues.map((issue) => issue.message).join("; ");
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected routing simulation error.";
}

function createErrorResponse(
  code: PublicRoutingApiErrorCode,
  message: string,
  error: string | null,
  status: number,
) {
  const payload: PublicRoutingApiErrorResponseContract = {
    code,
    message,
    error,
  };

  return NextResponse.json(payload, { status });
}

function serializeSimulationResponse(
  result: Awaited<ReturnType<typeof simulateRouting>>,
): PublicRoutingSimulationResponseContract {
  return result;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = parseRoutingSimulationInput(body);
    const result = await simulateRouting(input);
    return NextResponse.json(serializeSimulationResponse(result), { status: 200 });
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      return createErrorResponse(
        "ROUTING_SIMULATION_VALIDATION_ERROR",
        "Routing simulation payload validation failed.",
        getErrorMessage(error),
        400,
      );
    }

    return createErrorResponse(
      "ROUTING_SIMULATION_INTERNAL_ERROR",
      "Routing simulation failed.",
      getErrorMessage(error),
      500,
    );
  }
}
