import { getAdminUsers } from "@/server-functions/admin-users";
import UserStatusControl from "@/components/admin/user-status-control";

export default async function AdminUsersPage() {
  const result = await getAdminUsers();
  if ("error" in result) return <main className="p-8"><h1 className="text-2xl font-semibold">Access denied</h1><p className="mt-2 text-sm text-muted-foreground">{result.error}</p></main>;
  return <main className="min-h-screen space-y-6 p-4 sm:p-8">
    <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Platform management</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Users & sellers</h1><p className="mt-2 text-sm text-muted-foreground">Review accounts, roles and access status.</p></div>
    <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
      <div className="border-b px-5 py-5"><p className="font-semibold">All accounts</p><p className="mt-1 text-xs text-muted-foreground">{result.users.length} most recent accounts</p></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-5 py-3">User</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Joined</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y">{result.users.map((user: any) => <tr key={user._id} className="hover:bg-primary/[0.03]"><td className="px-5 py-4"><p className="font-medium">{user.name}</p><p className="text-xs text-muted-foreground">{user.email}</p></td><td className="px-4 py-4 capitalize">{user.role}</td><td className="px-4 py-4 text-muted-foreground">{user.createdOn ? new Date(user.createdOn).toLocaleDateString("en-IN") : "—"}</td><td className="px-5 py-4"><UserStatusControl id={String(user._id)} status={user.status || "active"} /></td></tr>)}</tbody></table></div>
    </div>
  </main>;
}
