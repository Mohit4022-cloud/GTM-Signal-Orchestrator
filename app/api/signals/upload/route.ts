import { NextResponse } from "next/server";

import { uploadSignalsCsv } from "@/lib/data/signals/upload";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          message: "CSV upload requires a file field.",
        },
        { status: 400 },
      );
    }

    const result = await uploadSignalsCsv({ file });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message: "CSV signal upload failed.",
        error: error instanceof Error ? error.message : "Unexpected upload error.",
      },
      { status: 500 },
    );
  }
}
