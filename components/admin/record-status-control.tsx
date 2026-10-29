"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { updateAdminRecordStatus } from "@/server-functions/admin-records";

type Kind = "reviews" | "queries" | "enrollments";
const options: Record<Kind, string[]> = {
  reviews: ["pending", "published", "hidden"],
  queries: ["open", "in_progress", "resolved", "closed"],
  enrollments: ["active", "completed", "revoked"],
};

export default function RecordStatusControl({ kind, id, status }: { kind: Kind; id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <select
      aria-label="Update status"
      value={status}
      disabled={busy}
      onChange={async (event) => {
        setBusy(true);
        const result = await updateAdminRecordStatus(kind, id, event.target.value);
        if ("error" in result) toast.error(result.error);
        else { toast.success("Status updated"); router.refresh(); }
        setBusy(false);
      }}
      className="rounded-md border bg-background px-2 py-1 text-xs capitalize disabled:opacity-50"
    >
      {options[kind].map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}
    </select>
  );
}
