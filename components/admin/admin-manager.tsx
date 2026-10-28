"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Crown, Loader2, Mail, ShieldCheck, ShieldMinus, UserRound, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAdminAccount, removeAdminAccess } from "@/server-functions/admin-users";
import type { IUser } from "@/modals/user.model";
import { cn } from "@/modals/utils";

type Props = {
  admins: Partial<IUser>[];
  isSuperAdmin: boolean;
  currentEmail: string;
};

const initials = (name?: string) =>
  String(name || "A")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

export default function AdminManager({ admins: initialAdmins, isSuperAdmin, currentEmail }: Props) {
  const router = useRouter();
  const [admins, setAdmins] = useState(initialAdmins);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const ownerEmails = useMemo(
    () => admins.filter((admin) => String(admin.email).toLowerCase() === "mynmss3@gmail.com").map((admin) => admin.email),
    [admins]
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Add a name and email address");
      return;
    }
    setSaving(true);
    try {
      const result = await createAdminAccount({ name, email, password });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(result.promoted ? `${email} can now access the admin panel` : "Administrator created");
      setAdmins((current) => {
        const exists = current.some((admin) => String(admin.email).toLowerCase() === email.trim().toLowerCase());
        if (exists) {
          return current.map((admin) =>
            String(admin.email).toLowerCase() === email.trim().toLowerCase() ? { ...admin, role: "admin" as const, name } : admin
          );
        }
        return [...current, { name, email: email.trim().toLowerCase(), role: "admin" as const, createdOn: new Date() }];
      });
      setName("");
      setEmail("");
      setPassword("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (target: string) => {
    setRemoving(target);
    try {
      const result = await removeAdminAccess(target);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Administrator access removed");
      setAdmins((current) => current.filter((admin) => admin.email !== target));
      router.refresh();
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5">
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-4">
            <div>
              <p className="font-medium">Administrators</p>
              <p className="mt-1 text-xs text-muted-foreground">{admins.length} account{admins.length === 1 ? "" : "s"} with full workspace access</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
              <ShieldCheck size={13} /> Admin only
            </span>
          </div>

          <ul className="divide-y">
            {admins.map((admin) => {
              const isOwner = ownerEmails.includes(admin.email);
              const isYou = String(admin.email).toLowerCase() === currentEmail.toLowerCase();
              return (
                <li key={admin.email} className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <span className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold",
                    isOwner ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" : "bg-primary/10 text-primary"
                  )}>
                    {isOwner ? <Crown size={17} /> : initials(admin.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                      <span className="truncate">{admin.name || "Administrator"}</span>
                      {isOwner && <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">Owner</span>}
                      {isYou && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">You</span>}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{admin.email}</p>
                  </div>
                  {isSuperAdmin && !isOwner && !isYou ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={removing === admin.email}
                      onClick={() => remove(String(admin.email))}
                    >
                      {removing === admin.email ? <Loader2 size={14} className="animate-spin" /> : <ShieldMinus size={14} />}
                      Remove
                    </Button>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">{isOwner ? "Protected" : ""}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-2xl border border-dashed bg-muted/20 px-5 py-4 text-xs leading-5 text-muted-foreground">
          Administrator access unlocks courses, articles, products, orders and user management. Only the owner account
          can grant or remove it.
        </div>
      </div>

      <div className="space-y-4">
        {isSuperAdmin ? (
          <form onSubmit={submit} className="rounded-2xl border bg-card p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><ShieldCheck size={17} /></span>
              <div>
                <p className="text-sm font-medium">Add an administrator</p>
                <p className="text-xs text-muted-foreground">Create a new account or promote an existing one.</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="admin-name" className="flex items-center gap-1.5 text-xs"><UserRound size={13} /> Name</Label>
                <Input id="admin-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" className="h-10" autoComplete="off" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-email" className="flex items-center gap-1.5 text-xs"><Mail size={13} /> Email</Label>
                <Input id="admin-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="person@example.com" className="h-10" autoComplete="off" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-password" className="flex items-center gap-1.5 text-xs"><KeyRound size={13} /> Temporary password</Label>
                <Input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Optional for existing accounts" className="h-10" autoComplete="new-password" />
                <p className="text-[11px] leading-4 text-muted-foreground">
                  Leave blank to promote an existing account. New accounts need a password with 8+ characters, a letter and a number.
                </p>
              </div>

              <Button type="submit" className="w-full gap-2" disabled={saving}>
                {saving ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
                Create administrator
              </Button>
            </div>
          </form>
        ) : (
          <div className="rounded-2xl border bg-card p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground"><ShieldCheck size={17} /></span>
              <p className="text-sm font-medium">Owner-only action</p>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Only the owner account can create or remove administrators. Ask the site owner if you need another admin added.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
