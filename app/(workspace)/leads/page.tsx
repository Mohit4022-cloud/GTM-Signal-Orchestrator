import { ModulePlaceholder } from "@/components/shared/ModulePlaceholder";
import { getWorkspaceTeasers } from "@/lib/queries/dashboard";

export default async function LeadsPage() {
  const teasers = await getWorkspaceTeasers();
  return <ModulePlaceholder config={teasers.leads} />;
}
