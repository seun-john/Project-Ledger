import { TrackerApp } from "@/components/TrackerApp";
import { computeMetrics, listProjects } from "@/lib/server/projects";
import { listStages } from "@/lib/server/stages";
import { getAppSettings } from "@/lib/server/settings";

// Health status depends on today's date and the data changes on every action,
// so this page is never cached.
export const dynamic = "force-dynamic";

export default async function Page() {
  const settings = await getAppSettings();
  const stages = await listStages();
  const projects = await listProjects(stages, settings.currency);
  const metrics = computeMetrics(projects, settings.currency);

  return <TrackerApp settings={settings} stages={stages} projects={projects} metrics={metrics} />;
}
