"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  BadgeCheck, CheckCircle2, Clock, FileText, GitPullRequest, Hourglass,
  Loader2, MessageSquareText, XCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { reviewArticleContribution, type ContributionResult } from "@/server-functions/contribution";

type Queue = {
  pending: ContributionResult[];
  reviewed: ContributionResult[];
  stats: { pending: number; approved: number; rejected: number };
};

const formatDate = (value?: string | Date) =>
  value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

function ContributorBadge({ user }: { user?: ContributionResult["submittedBy"] }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Avatar className="h-7 w-7">
        {user?.image ? <AvatarImage src={user.image} alt={user.name || ""} /> : null}
        <AvatarFallback className="text-[10px]">{(user?.name || "?").slice(0, 1).toUpperCase()}</AvatarFallback>
      </Avatar>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium">{user?.name || "Unknown student"}</span>
        {user?.username ? <span className="block truncate text-[11px] text-muted-foreground">@{user.username}</span> : null}
      </span>
    </span>
  );
}

function PendingContribution({ record }: {
  record: ContributionResult;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState<"approved" | "rejected" | null>(null);

  const current = String((record.blog as { content?: string })?.content || "");
  const proposed = String(record.proposedContent || "");
  const changedLines = proposed === current ? 0 : null;

  const review = async (action: "approved" | "rejected") => {
    setBusy(action);
    try {
      const result = await reviewArticleContribution({
        _id: String(record._id!),
        action,
        reviewComment: comment,
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(action === "approved"
        ? "Change published — the student is now credited on the article."
        : "Proposal rejected. The article stays unchanged.");
      setOpen(false);
      setComment("");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Could not review this proposal.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-3 border-b p-4 last:border-b-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <ContributorBadge user={record.submittedBy} />
        <p className="mt-2 truncate text-sm font-medium">
          {record.proposedTitle || (record.blog as { title?: string })?.title || "Untitled article"}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Clock size={12} /> Submitted {formatDate(record.submittedAt)}</span>
          {changedLines === 0 ? (
            <span className="inline-flex items-center gap-1 text-amber-600"><Hourglass size={12} /> Content mirrors the current article</span>
          ) : (
            <span className="inline-flex items-center gap-1"><FileText size={12} /> {proposed.length.toLocaleString()} chars</span>
          )}
          <Link
            className="inline-flex items-center gap-1 hover:text-foreground"
            href={`/t/${(record.blog as { slug?: string })?.slug || ""}`}
          >
            View article
          </Link>
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2">
          <MessageSquareText size={14} /> Review
        </Button>
        <Button size="sm" onClick={() => review("approved")} disabled={busy !== null} className="gap-2">
          {busy === "approved" ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />} Approve
        </Button>
        <Button size="sm" variant="outline" onClick={() => review("rejected")} disabled={busy !== null} className="gap-2 text-red-600 hover:text-red-600">
          {busy === "rejected" ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />} Reject
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Review proposed edit</DialogTitle>
            <DialogDescription>
              Compare the proposal with the live article, then approve or reject. Approving publishes the change and credits the student on the article.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">Proposed</p>
              <textarea
                readOnly
                value={proposed}
                className="h-72 w-full resize-none rounded-lg border bg-muted/30 p-3 font-mono text-xs leading-5"
              />
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Current article</p>
              <textarea
                readOnly
                value={current}
                className="h-72 w-full resize-none rounded-lg border bg-transparent p-3 font-mono text-xs leading-5 text-muted-foreground"
              />
            </div>
          </div>
          {record.proposedTitle ? (
            <p className="text-xs text-muted-foreground">Proposed title: <span className="font-medium text-foreground">{record.proposedTitle}</span></p>
          ) : null}
          {record.proposedDescription ? (
            <p className="text-xs text-muted-foreground">Proposed description: <span className="font-medium text-foreground">{record.proposedDescription}</span></p>
          ) : null}
          <Input
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            maxLength={1000}
            placeholder="Optional note to the student (required feedback is shown on their proposal)"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy !== null}>Close</Button>
            <Button variant="outline" onClick={() => review("rejected")} disabled={busy !== null} className="text-red-600 hover:text-red-600">
              {busy === "rejected" ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />} Reject
            </Button>
            <Button onClick={() => review("approved")} disabled={busy !== null}>
              {busy === "approved" ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />} Approve & publish
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminContributionsPage({ queue }: { queue: Queue }) {
  if (!queue) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-semibold">Contributions</h1>
        <p className="mt-2 text-sm text-muted-foreground">The review queue is temporarily unavailable.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen space-y-6 p-4 sm:p-8">
      <div className="flex flex-col gap-5 rounded-3xl border bg-card p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div>
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><GitPullRequest size={21} /></div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Platform management</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Student contributions</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Article edits proposed by students. Approving a proposal publishes the change immediately and shows that student as a contributor on the article.
          </p>
        </div>
        <div className="flex gap-3">
          {[
            { label: "Pending", value: queue.stats.pending, icon: Hourglass },
            { label: "Approved", value: queue.stats.approved, icon: CheckCircle2 },
            { label: "Rejected", value: queue.stats.rejected, icon: XCircle },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-muted/60 px-4 py-3 text-center">
              <p className="text-2xl font-semibold">{stat.value}</p>
              <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground"><stat.icon size={12} /> {stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
        <div className="flex flex-col gap-2 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="font-semibold">Awaiting review</p>
            <p className="mt-1 text-xs text-muted-foreground">Oldest-first proposals from students.</p>
          </div>
          <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{queue.pending.length} pending</span>
        </div>
        {queue.pending.length ? (
          queue.pending.map((record) => (
            <PendingContribution key={String(record._id)} record={record} />
          ))
        ) : (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <CheckCircle2 className="text-muted-foreground/40" size={32} />
            <p className="mt-3 text-sm font-medium">Nothing waiting</p>
            <p className="mt-1 text-sm text-muted-foreground">Student proposals will appear here for review.</p>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
        <div className="border-b px-5 py-5 sm:px-6">
          <p className="font-semibold">Recently reviewed</p>
          <p className="mt-1 text-xs text-muted-foreground">Latest decisions with student-facing notes.</p>
        </div>
        {queue.reviewed.length ? (
          <div className="divide-y">
            {queue.reviewed.map((record) => (
              <div key={String(record._id)} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${record.status === "approved" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400"}`}>
                      {record.status}
                    </span>
                    <p className="truncate text-sm">{(record.blog as { title?: string })?.title || "Untitled article"}</p>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {record.submittedBy?.name || "Student"} · reviewed {formatDate(record.reviewedAt)}
                    {record.reviewComment ? ` — “${record.reviewComment}”` : ""}
                  </p>
                </div>
                <Link className="text-xs text-primary hover:underline" href={`/t/${(record.blog as { slug?: string })?.slug || ""}`}>View article</Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-6 py-8 text-sm text-muted-foreground">No decisions recorded yet.</p>
        )}
      </div>
    </main>
  );
}
