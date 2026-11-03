"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "react-toastify";
import { Loader2, PencilLine } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitArticleContribution, getMyArticleContribution } from "@/server-functions/contribution";

type SuggestEditProps = {
  /** Article id and its current full markdown; edits are proposals against this snapshot. */
  blogId?: string;
  title?: string;
  content?: string;
  /** Existing proposal for this article from the current user, if any. */
  contribution?: { status?: string; submittedAt?: string | Date; reviewComment?: string } | null;
  onSubmitted?: () => void;
};

export default function SuggestEditDialog({ blogId, title, content, contribution, onSubmitted }: SuggestEditProps) {
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setDraft(content || "");
  }, [open, content]);

  const signedIn = status === "authenticated";
  const pending = contribution?.status === "pending";

  const submit = async () => {
    if (!blogId) return;
    setBusy(true);
    try {
      const result = await submitArticleContribution({ blogId, proposedContent: draft });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Edit submitted — an administrator will review it soon.");
      setOpen(false);
      onSubmitted?.();
    } catch (error) {
      console.error(error);
      toast.error("Could not submit this edit.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => (signedIn ? setOpen(true) : undefined)}
        asChild={!signedIn}
      >
        {signedIn ? (
          <><PencilLine size={14} /> Suggest an edit</>
        ) : (
          <Link href="/auth" className="flex items-center gap-2"><PencilLine size={14} /> Suggest an edit</Link>
        )}
      </Button>
      <p className="text-[11px] leading-4 text-muted-foreground">
        {signedIn
          ? pending
            ? "Your earlier edit is awaiting admin review — a new edit replaces it."
            : "Your edit goes to the admin review queue. Approved edits publish with your name."
          : "Sign in to propose edits to this article."}
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><PencilLine size={16} /> Suggest an edit</DialogTitle>
            <DialogDescription>
              Edit the article below. Nothing is published until an administrator reviews and approves your change.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={16}
            spellCheck={false}
            className="max-h-[50vh] font-mono text-xs leading-5"
            placeholder={title ? `Write the updated article: ${title}` : "Write the updated article"}
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-muted-foreground">{draft.length.toLocaleString()} / 120,000 characters</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
              <Button onClick={submit} disabled={busy || draft.trim().length < 20} className="gap-2">
                {busy && <Loader2 size={14} className="animate-spin" />} Submit for review
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
