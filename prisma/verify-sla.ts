import { ActionType } from "@prisma/client";

import { db } from "../lib/db";
import {
  getDashboardSlaSummary,
  getLeadSlaEvents,
  getLeadSlaState,
  getTaskSlaState,
} from "../lib/sla";

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const [atlasLead, meridianLead, signalNestLead, beaconOpsLead, summitFlowLead] =
    await Promise.all([
      getLeadSlaState("acc_atlas_grid_lead_01"),
      getLeadSlaState("acc_meridian_freight_lead_01"),
      getLeadSlaState("acc_signalnest_lead_01"),
      getLeadSlaState("acc_beaconops_lead_01"),
      getLeadSlaState("acc_summitflow_finance_lead_01"),
    ]);

  invariant(atlasLead?.currentState === "breached", "Expected Atlas Grid lead to be breached.");
  invariant(
    meridianLead?.currentState === "due_soon",
    "Expected Meridian Freight lead to be due soon.",
  );
  invariant(
    signalNestLead?.currentState === "on_track",
    "Expected SignalNest lead to be on track.",
  );
  invariant(
    beaconOpsLead?.currentState === "overdue",
    "Expected BeaconOps lead to be overdue but not yet breached.",
  );
  invariant(
    summitFlowLead?.currentState === "completed" && summitFlowLead.metSla === true,
    "Expected SummitFlow lead to be completed within SLA.",
  );

  const [atlasTaskRow, frontierTaskRow, verityTaskRow, pinecrestTaskRow] =
    await Promise.all([
      db.task.findFirstOrThrow({
        where: { leadId: "acc_atlas_grid_lead_01", isSlaTracked: true },
        select: { id: true },
      }),
      db.task.findFirstOrThrow({
        where: { leadId: "acc_frontier_retail_lead_01", isSlaTracked: true },
        select: { id: true },
      }),
      db.task.findFirstOrThrow({
        where: { leadId: "acc_veritypulse_lead_01", isSlaTracked: true },
        select: { id: true },
      }),
      db.task.findFirstOrThrow({
        where: { leadId: "acc_pinecrest_lead_01", isSlaTracked: true },
        select: { id: true },
      }),
    ]);
  const [atlasTask, frontierTask, verityTask, pinecrestTask] = await Promise.all([
    getTaskSlaState(atlasTaskRow.id),
    getTaskSlaState(frontierTaskRow.id),
    getTaskSlaState(verityTaskRow.id),
    getTaskSlaState(pinecrestTaskRow.id),
  ]);

  invariant(atlasTask?.currentState === "breached", "Expected Atlas tracked task to be breached.");
  invariant(
    frontierTask?.currentState === "on_track",
    "Expected Frontier tracked task to be on track.",
  );
  invariant(
    verityTask?.currentState === "overdue",
    "Expected VerityPulse tracked task to be overdue.",
  );
  invariant(
    pinecrestTask?.currentState === "completed" && pinecrestTask.metSla === true,
    "Expected Pinecrest tracked task to be completed within SLA.",
  );

  const [atlasEvents, atlasEscalationTasks, summary] = await Promise.all([
    getLeadSlaEvents("acc_atlas_grid_lead_01"),
    db.task.count({
      where: {
        leadId: "acc_atlas_grid_lead_01",
        actionType: ActionType.ESCALATE_SLA_BREACH,
      },
    }),
    getDashboardSlaSummary(),
  ]);

  invariant(
    atlasEvents.some((event) => event.eventType === "breached"),
    "Expected Atlas lead SLA breach history.",
  );
  invariant(
    atlasEvents.some((event) => event.eventType === "escalation_created"),
    "Expected Atlas lead escalation history.",
  );
  invariant(atlasEscalationTasks >= 1, "Expected at least one Atlas escalation task.");
  invariant(summary.leadMetrics.openTrackedCount >= 4, "Expected open tracked leads in summary.");
  invariant(summary.leadMetrics.breachedCount >= 1, "Expected breached leads in summary.");
  invariant(summary.taskMetrics.overdueCount >= 1, "Expected overdue tracked tasks in summary.");
  invariant(summary.taskMetrics.breachedCount >= 1, "Expected breached tracked tasks in summary.");

  console.log("SLA verification passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
