"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { updateAdminUserStatus } from "@/server-functions/admin-users";

export default function UserStatusControl({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return <select value={status} disabled={busy} onChange={async (event) => {
    setBusy(true);
    const result = await updateAdminUserStatus(id, event.target.value as "active" | "suspended");
    if ("error" in result) toast.error(result.error); else { toast.success("User status updated"); router.refresh(); }
    setBusy(false);
  }} className="rounded-md border bg-background px-2 py-1 text-xs capitalize disabled:opacity-50"><option value="active">Active</option><option value="suspended">Suspended</option></select>;
}
