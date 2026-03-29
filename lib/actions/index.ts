export {
  createManualTask,
  createTaskFromTemplate,
  generateActionsForAccount,
  generateActionsForAccountWithClient,
  generateActionsForLead,
  generateActionsForLeadWithClient,
  updateTask,
} from "./service";
export { createLeadSlaEscalationTaskWithClient } from "./escalations";
export {
  getActionRecommendationsForEntity,
  getRecommendationsList,
  getTaskById,
  getTasks,
  getTasksForAccount,
  getTasksForLead,
} from "./queries";
