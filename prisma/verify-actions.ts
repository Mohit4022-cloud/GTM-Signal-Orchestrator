import { ActionType, SignalType } from "@prisma/client";

import {
  generateActionsForLead,
  getActionRecommendationsForEntity,
  getTasks,
  getTasksForLead,
} from "../lib/actions";
import { db } from "../lib/db";

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const atlasDemoSignal = await db.signalEvent.findFirst({
    where: {
      accountId: "acc_atlas_grid",
      eventType: SignalType.FORM_FILL,
    },
    orderBy: {
      receivedAt: "desc",
    },
    select: {
      id: true,
      receivedAt: true,
    },
  });

  invariant(atlasDemoSignal, "Expected the seeded Atlas Grid demo signal.");

  const atlasTasksBefore = await getTasksForLead("acc_atlas_grid_lead_01");
  const atlasCallTaskCountBefore = atlasTasksBefore.filter(
    (task) => task.actionType === ActionType.CALL_WITHIN_15_MINUTES,
  ).length;

  const rerun = await generateActionsForLead("acc_atlas_grid_lead_01", {
    effectiveAt: atlasDemoSignal.receivedAt,
    triggerSignalId: atlasDemoSignal.id,
  });

  invariant(rerun !== null, "Expected action generation rerun output for Atlas Grid.");
  invariant(
    rerun.preventedDuplicateKeys.length > 0,
    "Expected duplicate prevention keys when rerunning seeded Atlas Grid generation.",
  );

  const atlasTasksAfter = await getTasksForLead("acc_atlas_grid_lead_01");
  const atlasCallTaskCountAfter = atlasTasksAfter.filter(
    (task) => task.actionType === ActionType.CALL_WITHIN_15_MINUTES,
  ).length;

  invariant(
    atlasCallTaskCountAfter === atlasCallTaskCountBefore,
    "Rerunning the Atlas Grid demo action generation should not create a duplicate urgent call task.",
  );
  invariant(
    atlasTasksAfter.some((task) => task.actionType === ActionType.ESCALATE_SLA_BREACH),
    "Expected Atlas Grid lead tasks to include an SLA escalation task.",
  );

  const urgentQueue = await getTasks({ priorityCode: "P1" });
  invariant(urgentQueue.rows.length > 0, "Expected urgent queue rows.");
  invariant(
    urgentQueue.rows.every((task) => task.priorityCode === "P1"),
    "Urgent task filter should only return P1 tasks.",
  );

  const overdueQueue = await getTasks({ overdue: true });
  invariant(overdueQueue.rows.length > 0, "Expected overdue queue rows.");
  invariant(
    overdueQueue.rows.every((task) => task.isOverdue),
    "Overdue task filter should only return overdue tasks.",
  );

  const ownerQueue = await getTasks({ ownerId: "usr_owen_price" });
  invariant(ownerQueue.rows.length > 0, "Expected owner-filtered queue rows for Owen Price.");
  invariant(
    ownerQueue.rows.every((task) => task.owner?.id === "usr_owen_price"),
    "Owner filter should only return tasks owned by Owen Price.",
  );

  const beaconOpsRecommendations = await getActionRecommendationsForEntity("account", "acc_beaconops");
  invariant(
    beaconOpsRecommendations.some(
      (recommendation) => recommendation.recommendationType === ActionType.ADD_TO_NURTURE_QUEUE,
    ),
    "Expected BeaconOps nurture recommendation in the recommendations contract.",
  );

  const signalNestRecommendations = await getActionRecommendationsForEntity("account", "acc_signalnest");
  invariant(
    signalNestRecommendations.some(
      (recommendation) => recommendation.recommendationType === ActionType.GENERATE_ACCOUNT_SUMMARY,
    ),
    "Expected SignalNest account summary recommendation in the recommendations contract.",
  );

  const summitFlowRecommendations = await getActionRecommendationsForEntity(
    "account",
    "acc_summitflow_finance",
  );
  invariant(
    summitFlowRecommendations.some(
      (recommendation) => recommendation.recommendationType === ActionType.PAUSE_ACTIVE_ACCOUNT,
    ),
    "Expected SummitFlow active-account pause recommendation in the recommendations contract.",
  );

  console.log("Action verification passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
