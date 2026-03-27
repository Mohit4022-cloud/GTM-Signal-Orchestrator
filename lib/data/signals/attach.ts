import { attachSignalToEntities } from "@/lib/scoring/service";

export async function attachSignal(
  signalId: string,
  params: {
    accountId: string;
    contactId?: string | null;
    leadId?: string | null;
    actorType?: string;
    actorName?: string;
    note?: string;
  },
) {
  return attachSignalToEntities(signalId, params);
}
