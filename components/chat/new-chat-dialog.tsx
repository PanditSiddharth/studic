"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, MessageCircle, Search, ShieldCheck, Users } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/modals/utils";
import type { ChatDirectoryUser } from "@/modals/chat.model";
import { createChatGroup, getChatDirectory, startDirectChat } from "@/server-functions/chat";
import ChatAvatar from "./chat-avatar";

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (chatId: string) => void;
}

type Mode = "direct" | "group";

export default function NewChatDialog({ open, onOpenChange, onCreated }: NewChatDialogProps) {
  const [mode, setMode] = useState<Mode>("direct");
  const [search, setSearch] = useState("");
  const [directory, setDirectory] = useState<ChatDirectoryUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMode("direct");
    setSearch("");
    setSelected([]);
    setName("");
    setDescription("");
    setLoading(true);
    let cancelled = false;
    getChatDirectory()
      .then((result) => {
        if (cancelled) return;
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        setDirectory(result.users);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load people");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const visibleUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return directory;
    return directory.filter((user) =>
      [user.name, user.username, user.email].filter(Boolean).join(" ").toLowerCase().includes(query)
    );
  }, [directory, search]);

  const selectedUsers = useMemo(
    () => directory.filter((user) => selected.includes(user._id)),
    [directory, selected]
  );

  const startDirect = async (userId: string) => {
    if (startingId) return;
    setStartingId(userId);
    try {
      const result = await startDirectChat(userId);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      onOpenChange(false);
      onCreated(result.chatId);
    } finally {
      setStartingId(null);
    }
  };

  const toggleMember = (userId: string) => {
    setSelected((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]
    );
  };

  const createGroup = async () => {
    if (creating) return;
    if (name.trim().length < 2) {
      toast.error("Give the group a name");
      return;
    }
    if (!selected.length) {
      toast.error("Add at least one member");
      return;
    }
    setCreating(true);
    try {
      const result = await createChatGroup({ name, description, memberIds: selected });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Group created");
      onOpenChange(false);
      onCreated(result.chatId);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88vh] w-[calc(100vw-2rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:w-full">
        <DialogHeader className="border-b px-5 py-4 text-left">
          <DialogTitle className="text-lg">Start a conversation</DialogTitle>
          <DialogDescription>
            Message someone directly or bring a few learners together in a group.
          </DialogDescription>
        </DialogHeader>

        <div className="border-b px-3 pt-3">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => setMode("direct")}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-md px-2 py-2 transition-colors",
                mode === "direct" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MessageCircle size={15} /> Direct
            </button>
            <button
              type="button"
              onClick={() => setMode("group")}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-md px-2 py-2 transition-colors",
                mode === "group" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Users size={15} /> New group
            </button>
          </div>
        </div>

        {mode === "group" ? (
          <div className="space-y-2.5 border-b px-5 py-3.5">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Group name"
              maxLength={80}
              aria-label="Group name"
            />
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What is this group about? (optional)"
              maxLength={500}
              rows={2}
              className="min-h-[54px] resize-none text-sm"
              aria-label="Group description"
            />
            {selectedUsers.length ? (
              <div className="flex flex-wrap gap-1.5">
                {selectedUsers.map((user) => (
                  <button
                    key={user._id}
                    type="button"
                    onClick={() => toggleMember(user._id)}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary"
                    title={`Remove ${user.name}`}
                  >
                    {user.name}
                    <span aria-hidden>×</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="px-4 pt-3">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={mode === "group" ? "Search people to add" : "Search people"}
              className="pl-9"
              aria-label="Search people"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="animate-spin" size={20} />
            </div>
          ) : visibleUsers.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-muted-foreground">No people found.</p>
          ) : (
            <ul className="space-y-0.5">
              {visibleUsers.map((user) => {
                const isSelected = selected.includes(user._id);
                return (
                  <li key={user._id}>
                    <button
                      type="button"
                      onClick={() => (mode === "direct" ? void startDirect(user._id) : toggleMember(user._id))}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted/70"
                    >
                      <ChatAvatar name={user.name} image={user.image} seed={user._id} className="h-10 w-10" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-medium">{user.name}</span>
                          {user.isAdmin ? (
                            <span className="inline-flex shrink-0 items-center gap-0.5 rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">
                              <ShieldCheck size={9} /> Admin
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {user.username ? `@${user.username}` : "Studic learner"}
                          {user.email ? ` · ${user.email}` : ""}
                        </span>
                      </span>
                      {mode === "group" ? (
                        <span
                          className={cn(
                            "grid h-6 w-6 shrink-0 place-items-center rounded-full border",
                            isSelected ? "border-primary bg-primary text-primary-foreground" : "text-transparent"
                          )}
                        >
                          <Check size={14} />
                        </span>
                      ) : startingId === user._id ? (
                        <Loader2 size={16} className="shrink-0 animate-spin text-muted-foreground" />
                      ) : (
                        <MessageCircle size={16} className="shrink-0 text-muted-foreground" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {mode === "group" ? (
          <div className="flex items-center justify-between gap-3 border-t px-5 py-3">
            <p className="text-xs text-muted-foreground">
              {selected.length} member{selected.length === 1 ? "" : "s"} selected
            </p>
            <Button type="button" onClick={createGroup} disabled={creating} className="gap-1.5">
              {creating ? <Loader2 size={15} className="animate-spin" /> : <Users size={15} />}
              Create group
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
