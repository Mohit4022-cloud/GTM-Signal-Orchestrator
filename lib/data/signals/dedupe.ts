import type { JsonRecord } from "@/lib/contracts/signals";

import type { NormalizedSignalEnvelope } from "./normalize";
import { hashStableValue } from "./shared";

export type SignalDedupeBasis = {
  sourceSystem: string;
  eventType: NormalizedSignalEnvelope["eventType"];
  accountDomain: string | null;
  contactEmail: string | null;
  occurredAtIso: string;
  rawReference: NormalizedSignalEnvelope["normalizedPayload"]["rawReference"];
  payloadFingerprint: string | null;
};

function getPayloadFingerprint(payload: JsonRecord) {
  return hashStableValue(payload);
}

export function buildSignalDedupeBasis(normalizedSignal: NormalizedSignalEnvelope): SignalDedupeBasis {
  return {
    sourceSystem: normalizedSignal.sourceSystem,
    eventType: normalizedSignal.eventType,
    accountDomain: normalizedSignal.accountDomain,
    contactEmail: normalizedSignal.contactEmail,
    occurredAtIso: normalizedSignal.occurredAt.toISOString(),
    rawReference: normalizedSignal.normalizedPayload.rawReference,
    payloadFingerprint:
      Object.keys(normalizedSignal.normalizedPayload.rawReference).length > 0
        ? null
        : getPayloadFingerprint(normalizedSignal.rawPayload.payload as JsonRecord),
  };
}

export function computeSignalDedupeKey(normalizedSignal: NormalizedSignalEnvelope) {
  return hashStableValue(buildSignalDedupeBasis(normalizedSignal));
}
