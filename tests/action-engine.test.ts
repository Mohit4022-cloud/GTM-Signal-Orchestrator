import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { ActionType, SignalType } from "@prisma/client";

import {
  generateActionsForLead,
  getActionRecommendationsForEntity,
  getTasksForAccount,
  getTasksForLead,
} from "@/lib/actions";
import { db } from "@/lib/db";

import { resetDatabase } from "./helpers/db";

before(async () => {
  await resetDatabase();
});

after(async () => {
  await resetDatabase();
});

test("seeded action engine scenarios create deterministic lead and account tasks", async () => {
  const [atlasLeadTasks, beaconOpsTasks, signalNestTasks, beaconOpsRecommendations] =
    await Promise.all([
      getTasksForLead("acc_atlas_grid_lead_01"),
      getTasksForAccount("acc_beaconops"),
      getTasksForAccount("acc_signalnest"),
      getActionRecommendationsForEntity("account", "acc_beaconops"),
    ]);

  assert.ok(
    atlasLeadTasks.some((task) => task.actionType === ActionType.CALL_WITHIN_15_MINUTES),
  );
  assert.ok(
    atlasLeadTasks.some((task) => task.actionType === ActionType.SEND_FOLLOW_UP_EMAIL),
  );
  assert.ok(
    atlasLeadTasks.some((task) => task.actionType === ActionType.HANDOFF_TO_AE),
  );
  assert.ok(
    atlasLeadTasks.some((task) => task.actionType === ActionType.ENRICH_MISSING_CONTACT_FIELDS),
  );
  assert.ok(
    atlasLeadTasks.some((task) => task.actionType === ActionType.ESCALATE_SLA_BREACH),
  );

  assert.ok(
    beaconOpsTasks.some((task) => task.actionType === ActionType.RESEARCH_ACCOUNT),
  );
  assert.ok(
    signalNestTasks.some((task) => task.actionType === ActionType.HANDOFF_TO_AE),
  );
  assert.ok(
    beaconOpsRecommendations.some(
      (recommendation) => recommendation.recommendationType === ActionType.ADD_TO_NURTURE_QUEUE,
    ),
  );
});

test("rerunning generation for the same Atlas demo signal prevents duplicate urgent call tasks", async () => {
  const atlasDemoSignal = await db.signalEvent.findFirstOrThrow({
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
  const callTasksBefore = (await getTasksForLead("acc_atlas_grid_lead_01")).filter(
    (task) => task.actionType === ActionType.CALL_WITHIN_15_MINUTES,
  );

  const rerun = await generateActionsForLead("acc_atlas_grid_lead_01", {
    effectiveAt: atlasDemoSignal.receivedAt,
    triggerSignalId: atlasDemoSignal.id,
  });

  const callTasksAfter = (await getTasksForLead("acc_atlas_grid_lead_01")).filter(
    (task) => task.actionType === ActionType.CALL_WITHIN_15_MINUTES,
  );

  assert.ok(rerun);
  assert.ok(rerun.preventedDuplicateKeys.length > 0);
  assert.equal(callTasksAfter.length, callTasksBefore.length);
});
