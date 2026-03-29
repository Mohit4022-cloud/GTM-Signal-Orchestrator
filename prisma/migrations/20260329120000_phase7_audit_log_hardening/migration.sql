-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN "actorId" TEXT;

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN "action" TEXT NOT NULL DEFAULT 'legacy_event';

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN "reasonCodesJson" JSONB NOT NULL DEFAULT '[]';

-- Backfill existing audit actions for pre-phase-7 rows.
UPDATE "AuditLog"
SET "action" = CASE "eventType"
    WHEN 'SIGNAL_INGESTED' THEN 'signal_ingested'
    WHEN 'SIGNAL_NORMALIZED' THEN 'signal_normalized'
    WHEN 'IDENTITY_RESOLVED' THEN 'identity_resolved'
    WHEN 'SIGNAL_UNMATCHED_QUEUED' THEN 'signal_unmatched_queued'
    WHEN 'SIGNAL_DUPLICATE_SKIPPED' THEN 'signal_duplicate_skipped'
    WHEN 'SIGNAL_INGEST_ERROR' THEN 'signal_ingest_error'
    WHEN 'SCORE_UPDATED' THEN 'score_updated'
    WHEN 'SCORE_RECOMPUTED' THEN 'score_recomputed'
    WHEN 'SCORE_THRESHOLD_CROSSED' THEN 'score_threshold_crossed'
    WHEN 'SCORE_MANUAL_PRIORITY_OVERRIDDEN' THEN 'score_manual_priority_overridden'
    WHEN 'SIGNAL_ATTACHED_AND_RESCORED' THEN 'signal_attached_and_rescored'
    WHEN 'ROUTE_ASSIGNED' THEN 'route_assigned'
    WHEN 'ROUTING_FALLBACK_CAPACITY' THEN 'routing_fallback_capacity'
    WHEN 'ROUTING_SENT_TO_OPS_REVIEW' THEN 'routing_sent_to_ops_review'
    WHEN 'TASK_CREATED' THEN 'task_created'
    WHEN 'TASK_UPDATED' THEN 'task_updated'
    WHEN 'ACTION_RECOMMENDATION_CREATED' THEN 'action_recommendation_created'
    WHEN 'DUPLICATE_ACTION_PREVENTED' THEN 'duplicate_action_prevented'
    WHEN 'ACTION_GENERATION_SKIPPED' THEN 'action_generation_skipped'
    WHEN 'SLA_ASSIGNED' THEN 'sla_assigned'
    WHEN 'SLA_BREACHED' THEN 'sla_breached'
    WHEN 'SLA_RESOLVED' THEN 'sla_resolved'
    WHEN 'USER_OVERRIDE' THEN 'user_override'
    WHEN 'RULE_CONFIG_CHANGED' THEN 'rule_config_changed'
    ELSE 'legacy_event'
END;

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");
