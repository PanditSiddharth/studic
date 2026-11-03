import AdminContributionsPage from "@/components/admin/admin-contributions-page";
import { getContributionQueue } from "@/server-functions/contribution";

export default async function ContributionsAdminRoute() {
  const queue = await getContributionQueue();

  if ("error" in queue) {
    return <main className="p-8"><h1 className="text-2xl font-semibold">Access denied</h1><p className="mt-2 text-sm text-muted-foreground">An administrator account is required.</p></main>;
  }

  return <AdminContributionsPage queue={queue} />;
}
