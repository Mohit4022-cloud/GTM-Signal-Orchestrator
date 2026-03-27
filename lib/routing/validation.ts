import { AccountTier, Geography, Segment, SignalType, Temperature } from "@prisma/client";
import { z } from "zod";

import { routingSimulationCapacityScenarioValues } from "@/lib/contracts/routing";

export const routingSimulationInputSchema = z.object({
  accountDomain: z.string().trim().min(1).nullable().optional(),
  leadSource: z.string().trim().min(1).nullable().optional(),
  leadSourceType: z
    .enum(["inbound", "outbound", "signal", "unknown"])
    .optional(),
  segment: z.nativeEnum(Segment).nullable().optional(),
  geography: z.nativeEnum(Geography).nullable().optional(),
  accountTier: z.nativeEnum(AccountTier).nullable().optional(),
  namedAccount: z.boolean().optional(),
  namedOwnerId: z.string().trim().min(1).nullable().optional(),
  existingOwnerId: z.string().trim().min(1).nullable().optional(),
  inboundType: z.string().trim().min(1).nullable().optional(),
  sdrPod: z.string().trim().min(1).nullable().optional(),
  temperature: z.nativeEnum(Temperature).nullable().optional(),
  triggerSignalType: z.nativeEnum(SignalType).nullable().optional(),
  capacityScenario: z
    .enum(routingSimulationCapacityScenarioValues)
    .optional(),
});

export function parseRoutingSimulationInput(input: unknown) {
  return routingSimulationInputSchema.parse(input);
}
