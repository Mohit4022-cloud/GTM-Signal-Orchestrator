import { parse } from "csv-parse/sync";
import { ZodError } from "zod";

import type {
  UploadSignalsCsvInput,
  UploadSignalsCsvParsedRow,
  UploadSignalsCsvResult,
} from "@/lib/contracts/signals";
import { parseCsvSignalRow } from "@/lib/validation/signal-csv";

import { ingestSignal } from "./ingest";

function getErrorMessage(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues.map((issue) => issue.message).join("; ");
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown CSV upload error.";
}

async function parseFileRows(file: File): Promise<UploadSignalsCsvParsedRow[]> {
  const rawText = await file.text();
  const rows = parse(rawText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as UploadSignalsCsvParsedRow[];

  return rows;
}

export async function uploadSignalsCsv(input: UploadSignalsCsvInput): Promise<UploadSignalsCsvResult> {
  const rows = input.parsedRows ?? (input.file ? await parseFileRows(input.file) : null);

  if (!rows) {
    throw new Error("A CSV file or parsedRows input is required.");
  }

  const results: UploadSignalsCsvResult["rows"] = [];

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 1;

    try {
      const ingestInput = parseCsvSignalRow(row);
      const ingestResult = await ingestSignal(ingestInput);
      results.push({
        rowNumber,
        signalId: ingestResult.signalId,
        status: ingestResult.status,
        outcome: ingestResult.outcome,
        reasonCodes: ingestResult.reasonCodes,
        errorMessage: ingestResult.errorMessage,
      });
    } catch (error) {
      results.push({
        rowNumber,
        signalId: null,
        status: "VALIDATION_ERROR",
        outcome: "error",
        reasonCodes: [],
        errorMessage: getErrorMessage(error),
      });
    }
  }

  return {
    processed: rows.length,
    inserted: results.filter((row) => row.outcome === "matched" || row.outcome === "unmatched").length,
    duplicates: results.filter((row) => row.outcome === "duplicate").length,
    unmatched: results.filter((row) => row.outcome === "unmatched").length,
    errors: results.filter((row) => row.outcome === "error").length,
    rows: results,
  };
}
