import Link from "next/link";
import { ShieldCheck, TriangleAlert } from "lucide-react";
import { auth } from "@/auth";
import { getAdminManagementData } from "@/server-functions/admin-users";
import { isSuperAdminEmail } from "@/helpers";
import { Button } from "@/components/ui/button";
import AdminManager from "@/components/admin/admin-manager";

export const metadata = { title: "Administrators · Studic admin" };

export default async function AddAdminPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    return (
      <main className="mx-auto w-full max-w-2xl px-5 py-16 sm:px-8">
        <div className="rounded-2xl border bg-card p-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <TriangleAlert size={18} />
          </span>
          <h1 className="mt-4 text-lg font-semibold">Administrator access required</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in with an administrator account to manage admin access.</p>
          <Button asChild className="mt-5"><Link href="/auth">Go to sign in</Link></Button>
        </div>
      </main>
    );
  }

  const data = await getAdminManagementData();
  const isSuperAdmin = isSuperAdminEmail(session.user.email);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-12 pt-6 sm:px-8">
      <div className="flex flex-col gap-3 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            <ShieldCheck size={13} /> Access control
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Administrators</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Grant full workspace access to trusted people. Only {isSuperAdmin ? "you" : "the owner account"} can create or remove administrators.
          </p>
        </div>
        {!isSuperAdmin && <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">Read-only</span>}
      </div>

      <div className="mt-6">
        {"error" in data ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">{data.error}</div>
        ) : (
          <AdminManager admins={data.admins} isSuperAdmin={isSuperAdmin} currentEmail={data.currentEmail} />
        )}
      </div>
    </main>
  );
}
