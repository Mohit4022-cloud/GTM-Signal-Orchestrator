import { NextResponse } from "next/server";
import { ZodError } from "zod";

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await ingestSignal(body);
    const status = result.outcome === "duplicate" ? 200 : 201;
    return NextResponse.json(result, { status });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          message: "Signal payload validation failed.",
          error: getErrorMessage(error),
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        message: "Signal ingest failed.",
        error: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
