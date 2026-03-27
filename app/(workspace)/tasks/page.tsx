import { ModulePlaceholder } from "@/components/shared/ModulePlaceholder";
import { getWorkspaceTeasers } from "@/lib/queries/dashboard";

export default async function TasksPage() {
  const teasers = await getWorkspaceTeasers();
  return <ModulePlaceholder config={teasers.tasks} />;
}
