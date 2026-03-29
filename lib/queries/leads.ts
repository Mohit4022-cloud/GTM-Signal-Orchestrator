import { LeadStatus, Temperature, type Prisma } from "@prisma/client";

import type {
  LeadDetailContract,
  LeadFiltersInput,
  LeadQueueContract,
} from "@/lib/contracts/leads";
import { db } from "@/lib/db";
import { getContactDisplayName } from "@/lib/data/signals/presentation";
import { mapLeadSlaSnapshot } from "@/lib/sla";
import { resolveLeadSlaWithClient, getLeadSlaEvents } from "@/lib/sla";

function buildWhere(filters: LeadFiltersInput): Prisma.LeadWhereInput {
  const where: Prisma.LeadWhereInput = {};

  if (filters.ownerId) {
    where.currentOwnerId = filters.ownerId;
  }

  if (filters.status) {
    where.status = {
      in: Array.isArray(filters.status) ? filters.status : [filters.status],
    };
  }

  if (filters.temperature) {
    where.temperature = {
      in: Array.isArray(filters.temperature) ? filters.temperature : [filters.temperature],
    };
  }

  if (filters.tracked !== undefined) {
    where.slaTargetMinutes = filters.tracked ? { not: null } : null;
  }

  if (filters.overdue !== undefined) {
    const now = new Date();
    where.slaDeadlineAt = filters.overdue ? { lt: now } : { gte: now };
  }

  return where;
}

function normalizeFilterArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

export async function getLeadQueue(filters: LeadFiltersInput = {}): Promise<LeadQueueContract> {
  const now = new Date();
  const rows = await db.lead.findMany({
    where: buildWhere(filters),
    orderBy: [{ score: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      accountId: true,
      source: true,
      inboundType: true,
      status: true,
      temperature: true,
      score: true,
      createdAt: true,
      updatedAt: true,
      currentOwnerId: true,
      firstResponseAt: true,
      routedAt: true,
      slaPolicyKey: true,
      slaPolicyVersion: true,
      slaTargetMinutes: true,
      slaDeadlineAt: true,
      slaBreachedAt: true,
      account: {
        select: {
          name: true,
        },
      },
      contact: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      currentOwner: {
        select: {
          name: true,
        },
      },
    },
  });

  const mappedRows = rows
    .map((row) => {
      const sla = mapLeadSlaSnapshot(
        {
          slaPolicyKey: row.slaPolicyKey,
          slaPolicyVersion: row.slaPolicyVersion,
          slaTargetMinutes: row.slaTargetMinutes,
          slaDeadlineAt: row.slaDeadlineAt,
          slaBreachedAt: row.slaBreachedAt,
          firstResponseAt: row.firstResponseAt,
          routedAt: row.routedAt,
        },
        now,
      );

      return {
        id: row.id,
        accountId: row.accountId,
        accountName: row.account.name,
        contactId: row.contact?.id ?? null,
        contactName: row.contact
          ? getContactDisplayName(row.contact.firstName, row.contact.lastName, row.contact.email)
          : null,
        currentOwnerId: row.currentOwnerId,
        currentOwnerName: row.currentOwner?.name ?? null,
        source: row.source,
        inboundType: row.inboundType,
        status: row.status,
        temperature: row.temperature,
        score: row.score,
        createdAtIso: row.createdAt.toISOString(),
        updatedAtIso: row.updatedAt.toISOString(),
        sla,
      };
    })
    .filter((row) => {
      if (!filters.slaState) {
        return true;
      }

      const states = Array.isArray(filters.slaState) ? filters.slaState : [filters.slaState];
      return states.includes(row.sla.currentState);
    });

  return {
    filters: {
      ownerId: filters.ownerId ?? "",
      statuses: normalizeFilterArray(filters.status),
      temperatures: normalizeFilterArray(filters.temperature),
      slaStates: normalizeFilterArray(filters.slaState),
      tracked: filters.tracked ?? null,
      overdue: filters.overdue ?? null,
    },
    totalCount: mappedRows.length,
    rows: mappedRows,
  };
}

export async function getLeadById(id: string): Promise<LeadDetailContract | null> {
  const now = new Date();
  const lead = await db.lead.findUnique({
    where: { id },
    select: {
      id: true,
      accountId: true,
      source: true,
      inboundType: true,
      status: true,
      temperature: true,
      score: true,
      createdAt: true,
      updatedAt: true,
      currentOwnerId: true,
      firstResponseAt: true,
      routedAt: true,
      slaPolicyKey: true,
      slaPolicyVersion: true,
      slaTargetMinutes: true,
      slaDeadlineAt: true,
      slaBreachedAt: true,
      account: {
        select: {
          name: true,
        },
      },
      contact: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      currentOwner: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!lead) {
    return null;
  }

  const sla = mapLeadSlaSnapshot(
    {
      slaPolicyKey: lead.slaPolicyKey,
      slaPolicyVersion: lead.slaPolicyVersion,
      slaTargetMinutes: lead.slaTargetMinutes,
      slaDeadlineAt: lead.slaDeadlineAt,
      slaBreachedAt: lead.slaBreachedAt,
      firstResponseAt: lead.firstResponseAt,
      routedAt: lead.routedAt,
    },
    now,
  );
  const contactName = lead.contact
    ? getContactDisplayName(lead.contact.firstName, lead.contact.lastName, lead.contact.email)
    : null;

  return {
    id: lead.id,
    accountId: lead.accountId,
    accountName: lead.account.name,
    contactId: lead.contact?.id ?? null,
    contactName,
    currentOwnerId: lead.currentOwnerId,
    currentOwnerName: lead.currentOwner?.name ?? null,
    source: lead.source,
    inboundType: lead.inboundType,
    status: lead.status,
    temperature: lead.temperature,
    score: lead.score,
    createdAtIso: lead.createdAt.toISOString(),
    updatedAtIso: lead.updatedAt.toISOString(),
    sla,
    firstResponseAtIso: lead.firstResponseAt?.toISOString() ?? null,
    routedAtIso: lead.routedAt?.toISOString() ?? null,
    timelineSummary: `${lead.account.name} is ${sla.currentState.replaceAll("_", " ")} against ${sla.policyKey ?? "no active SLA policy"}.`,
    events: await getLeadSlaEvents(lead.id),
  };
}

export async function updateLead(
  id: string,
  input: {
    status?: LeadStatus;
    firstResponseAtIso?: string;
  },
) {
  const updatedId = await db.$transaction(async (client) => {
    const existing = await client.lead.findUnique({
      where: { id },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return null;
    }

    if (input.status !== undefined) {
      await client.lead.update({
        where: { id },
        data: {
          status: input.status,
        },
      });
    }

    if (input.firstResponseAtIso) {
      await resolveLeadSlaWithClient(client, {
        leadId: id,
        firstResponseAt: new Date(input.firstResponseAtIso),
      });
    }

    return existing.id;
  });

  return updatedId ? getLeadById(updatedId) : null;
}
