export const aiProviderNameValues = ["openai"] as const;

export type AiProviderName = (typeof aiProviderNameValues)[number];

export const aiAssistStatusValues = ["generated", "unavailable", "error"] as const;

export type AiAssistStatus = (typeof aiAssistStatusValues)[number];

export const accountSummaryModeValues = ["default", "briefing", "timeline"] as const;
export const actionNoteModeValues = ["default", "outreach"] as const;
export const aiResponseLengthValues = ["short", "medium"] as const;

export type AccountSummaryMode = (typeof accountSummaryModeValues)[number];
export type ActionNoteMode = (typeof actionNoteModeValues)[number];
export type AiResponseLength = (typeof aiResponseLengthValues)[number];

export type AccountSummaryRequest = {
  mode?: AccountSummaryMode;
  length?: AiResponseLength;
};

export type ActionNoteRequest = {
  mode?: ActionNoteMode;
  length?: AiResponseLength;
};

export type AiProviderMetadataContract = {
  name: AiProviderName;
  model: string | null;
};

export type AiRoutingStatusContract = {
  currentQueue: string | null;
  ownerName: string | null;
};

export type AccountSummarySourceSummaryContract = {
  score: number;
  temperature: string;
  recentSignalCount: number;
  openTaskCount: number;
  hasSlaRisk: boolean;
  routingStatus: AiRoutingStatusContract;
  auditHighlightCount: number;
};

export type ActionNoteSourceSummaryContract = {
  leadScore: number;
  leadTemperature: string;
  recentSignalsUsed: number;
  topReasonCodes: string[];
  openTaskCount: number;
  hasSlaRisk: boolean;
  routingStatus: AiRoutingStatusContract;
};

export type AccountSummaryResponseContract = {
  accountId: string;
  status: AiAssistStatus;
  summary: string;
  keyDrivers: string[];
  generatedAt: string | null;
  sourceSummary: AccountSummarySourceSummaryContract;
  provider: AiProviderMetadataContract | null;
  message: string | null;
};

export type ActionNoteResponseContract = {
  leadId: string;
  status: AiAssistStatus;
  note: string;
  suggestedAngle: string;
  generatedAt: string | null;
  sourceSummary: ActionNoteSourceSummaryContract;
  deterministicGuardrail: string;
  provider: AiProviderMetadataContract | null;
  message: string | null;
};

export type PublicAiApiErrorCode =
  | "AI_VALIDATION_ERROR"
  | "AI_NOT_FOUND"
  | "AI_INTERNAL_ERROR";

export type PublicAiApiErrorResponseContract = {
  code: PublicAiApiErrorCode;
  message: string;
  error: string | null;
};
