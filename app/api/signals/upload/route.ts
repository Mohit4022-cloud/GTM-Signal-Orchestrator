import { NextResponse } from "next/server";

import type {
  PublicSignalApiErrorResponseContract,
  PublicSignalUploadResponseContract,
} from "@/lib/contracts/signals";
import { uploadSignalsCsv } from "@/lib/data/signals/upload";

export const runtime = "nodejs";

function createErrorResponse(
  code: PublicSignalApiErrorResponseContract["code"],
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

function serializeUploadResponse(
  result: Awaited<ReturnType<typeof uploadSignalsCsv>>,
): PublicSignalUploadResponseContract {
  return {
    processed: result.processed,
    inserted: result.inserted,
    duplicates: result.duplicates,
    unmatched: result.unmatched,
    errors: result.errors,
    rows: result.rows,
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return createErrorResponse(
        "UPLOAD_FILE_REQUIRED",
        "CSV upload requires a file field.",
        null,
        400,
      );
    }

    const result = await uploadSignalsCsv({ file });
    return NextResponse.json(serializeUploadResponse(result), { status: 200 });
  } catch (error) {
    return createErrorResponse(
      "UPLOAD_INTERNAL_ERROR",
      "CSV signal upload failed.",
      error instanceof Error ? error.message : "Unexpected upload error.",
      500,
    );
  }
}
