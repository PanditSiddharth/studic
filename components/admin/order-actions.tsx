"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cancelOrder, markOrderPaid } from "@/server-functions/orders";

export default function OrderActions({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"paid" | "cancelled" | null>(null);

  const update = async (next: "paid" | "cancelled") => {
    setBusy(next);
    try {
      const result = next === "paid" ? await markOrderPaid(orderId) : await cancelOrder(orderId);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(next === "paid" ? "Order confirmed — access granted" : "Order cancelled");
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  if (status === "paid" || status === "refunded") {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      <Button type="button" size="sm" className="h-7 gap-1 px-2 text-xs" disabled={busy !== null} onClick={() => update("paid")}>
        {busy === "paid" ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Confirm
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 gap-1 px-2 text-xs text-muted-foreground"
        disabled={busy !== null}
        onClick={() => update("cancelled")}
      >
        {busy === "cancelled" ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />} Cancel
      </Button>
    </div>
  );
}
