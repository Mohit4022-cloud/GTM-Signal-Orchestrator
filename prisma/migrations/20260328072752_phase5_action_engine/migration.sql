-- CreateTable
CREATE TABLE "ActionRecommendation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT,
    "accountId" TEXT,
    "recommendationType" TEXT NOT NULL,
    "actionCategory" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "suggestedOwnerId" TEXT,
    "suggestedQueue" TEXT,
    "sourceReasonCodesJson" JSONB NOT NULL DEFAULT '[]',
    "explanationJson" JSONB NOT NULL DEFAULT '{}',
    "dedupeKey" TEXT,
    "triggerSignalId" TEXT,
    "triggerRoutingDecisionId" TEXT,
    "triggerScoreHistoryId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActionRecommendation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActionRecommendation_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActionRecommendation_suggestedOwnerId_fkey" FOREIGN KEY ("suggestedOwnerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActionRecommendation_triggerSignalId_fkey" FOREIGN KEY ("triggerSignalId") REFERENCES "SignalEvent" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActionRecommendation_triggerRoutingDecisionId_fkey" FOREIGN KEY ("triggerRoutingDecisionId") REFERENCES "RoutingDecision" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActionRecommendation_triggerScoreHistoryId_fkey" FOREIGN KEY ("triggerScoreHistoryId") REFERENCES "ScoreHistory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT,
    "accountId" TEXT,
    "ownerId" TEXT,
    "taskType" TEXT NOT NULL,
    "actionType" TEXT NOT NULL DEFAULT 'MANUAL_CUSTOM',
    "actionCategory" TEXT NOT NULL DEFAULT 'MANUAL',
    "priority" TEXT NOT NULL,
    "dueAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sourceReasonCodesJson" JSONB NOT NULL DEFAULT '[]',
    "explanationJson" JSONB NOT NULL DEFAULT '{}',
    "dedupeKey" TEXT,
    "triggerSignalId" TEXT,
    "triggerRoutingDecisionId" TEXT,
    "triggerScoreHistoryId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "Task_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_triggerSignalId_fkey" FOREIGN KEY ("triggerSignalId") REFERENCES "SignalEvent" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_triggerRoutingDecisionId_fkey" FOREIGN KEY ("triggerRoutingDecisionId") REFERENCES "RoutingDecision" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_triggerScoreHistoryId_fkey" FOREIGN KEY ("triggerScoreHistoryId") REFERENCES "ScoreHistory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("accountId", "completedAt", "createdAt", "description", "dueAt", "id", "leadId", "ownerId", "priority", "status", "taskType", "title") SELECT "accountId", "completedAt", "createdAt", "description", "dueAt", "id", "leadId", "ownerId", "priority", "status", "taskType", "title" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE UNIQUE INDEX "Task_dedupeKey_key" ON "Task"("dedupeKey");
CREATE INDEX "Task_accountId_idx" ON "Task"("accountId");
CREATE INDEX "Task_leadId_idx" ON "Task"("leadId");
CREATE INDEX "Task_ownerId_idx" ON "Task"("ownerId");
CREATE INDEX "Task_status_dueAt_idx" ON "Task"("status", "dueAt");
CREATE INDEX "Task_triggerSignalId_idx" ON "Task"("triggerSignalId");
CREATE INDEX "Task_triggerRoutingDecisionId_idx" ON "Task"("triggerRoutingDecisionId");
CREATE INDEX "Task_triggerScoreHistoryId_idx" ON "Task"("triggerScoreHistoryId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ActionRecommendation_dedupeKey_key" ON "ActionRecommendation"("dedupeKey");

-- CreateIndex
CREATE INDEX "ActionRecommendation_accountId_createdAt_idx" ON "ActionRecommendation"("accountId", "createdAt");

-- CreateIndex
CREATE INDEX "ActionRecommendation_leadId_createdAt_idx" ON "ActionRecommendation"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "ActionRecommendation_suggestedOwnerId_createdAt_idx" ON "ActionRecommendation"("suggestedOwnerId", "createdAt");

-- CreateIndex
CREATE INDEX "ActionRecommendation_triggerSignalId_idx" ON "ActionRecommendation"("triggerSignalId");

-- CreateIndex
CREATE INDEX "ActionRecommendation_triggerRoutingDecisionId_idx" ON "ActionRecommendation"("triggerRoutingDecisionId");

-- CreateIndex
CREATE INDEX "ActionRecommendation_triggerScoreHistoryId_idx" ON "ActionRecommendation"("triggerScoreHistoryId");
