import { ModulePlaceholder } from "@/components/shared/ModulePlaceholder";
import { getWorkspaceTeasers } from "@/lib/queries/dashboard";

export default async function SettingsPage() {
  const teasers = await getWorkspaceTeasers();
  return <ModulePlaceholder config={teasers.settings} />;
}
