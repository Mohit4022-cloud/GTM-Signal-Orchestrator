ALTER TABLE "Lead" ADD COLUMN "slaPolicyKey" TEXT;
ALTER TABLE "Lead" ADD COLUMN "slaPolicyVersion" TEXT;
ALTER TABLE "Lead" ADD COLUMN "slaTargetMinutes" INTEGER;
ALTER TABLE "Lead" ADD COLUMN "slaStatus" TEXT;
ALTER TABLE "Lead" ADD COLUMN "slaBreachedAt" DATETIME;

ALTER TABLE "Task" ADD COLUMN "isSlaTracked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Task" ADD COLUMN "slaPolicyKey" TEXT;
ALTER TABLE "Task" ADD COLUMN "slaPolicyVersion" TEXT;
ALTER TABLE "Task" ADD COLUMN "slaTargetMinutes" INTEGER;
ALTER TABLE "Task" ADD COLUMN "slaStatus" TEXT;
ALTER TABLE "Task" ADD COLUMN "slaBreachedAt" DATETIME;

CREATE TABLE "SlaEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "leadId" TEXT,
    "taskId" TEXT,
    "accountId" TEXT,
    "eventType" TEXT NOT NULL,
    "policyVersion" TEXT,
    "policyKey" TEXT,
    "targetMinutes" INTEGER,
    "dueAt" DATETIME,
    "breachedAt" DATETIME,
    "resolvedAt" DATETIME,
    "explanationJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SlaEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SlaEvent_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SlaEvent_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "Lead_slaStatus_slaDeadlineAt_idx" ON "Lead"("slaStatus", "slaDeadlineAt");
CREATE INDEX "Task_isSlaTracked_slaStatus_dueAt_idx" ON "Task"("isSlaTracked", "slaStatus", "dueAt");
CREATE INDEX "SlaEvent_entityType_entityId_createdAt_idx" ON "SlaEvent"("entityType", "entityId", "createdAt");
CREATE INDEX "SlaEvent_leadId_createdAt_idx" ON "SlaEvent"("leadId", "createdAt");
CREATE INDEX "SlaEvent_taskId_createdAt_idx" ON "SlaEvent"("taskId", "createdAt");
CREATE INDEX "SlaEvent_eventType_createdAt_idx" ON "SlaEvent"("eventType", "createdAt");
