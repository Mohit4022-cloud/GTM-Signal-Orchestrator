import { SignalCategory, SignalType, Temperature } from "@prisma/client";

import type { RoutingReasonCode } from "@/lib/contracts/routing";
import { resolveSlaPolicyFromConfig } from "@/lib/sla";

import type { ActiveRoutingConfig } from "./config";

export type RoutingSlaInput = {
  entityType: "lead" | "account";
  inboundType: string | null;
  temperature: Temperature | null;
  triggerSignal:
    | {
        eventType: SignalType;
        eventCategory: SignalCategory;
        receivedAt: Date;
      }
    | null;
  referenceTime: Date;
};

export type RoutingSlaResult = {
  targetMinutes: number | null;
  dueAt: Date | null;
  reasonCodes: RoutingReasonCode[];
};

export function resolveRoutingSla(
  config: ActiveRoutingConfig,
  input: RoutingSlaInput,
): RoutingSlaResult {
  const resolved = resolveSlaPolicyFromConfig(config, input);
  return {
    targetMinutes: resolved.targetMinutes,
    dueAt: resolved.dueAt,
    reasonCodes: resolved.reasonCodes,
  };
}
