"use client";

import { useMemo, useState } from "react";
import { Loader2, MessageCircle, Plus, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/modals/utils";
import type { ChatSummary } from "@/modals/chat.model";
import ChatAvatar from "./chat-avatar";
import { formatSidebarTime } from "./chat-utils";

type Filter = "all" | "group" | "direct";

const filters: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "All" },
  { value: "group", label: "Groups" },
  { value: "direct", label: "Direct" },
];

interface ChatSidebarProps {
  chats: ChatSummary[];
  loading: boolean;
  selectedId: string | null;
  currentUserId: string;
  isAdmin: boolean;
  scope: "mine" | "all";
  onScopeChange: (scope: "mine" | "all") => void;
  onSelect: (chatId: string) => void;
  onNewChat: () => void;
}

export default function ChatSidebar({
  chats,
  loading,
  selectedId,
  currentUserId,
  isAdmin,
  scope,
  onScopeChange,
  onSelect,
  onNewChat,
}: ChatSidebarProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const visibleChats = useMemo(() => {
    const query = search.trim().toLowerCase();
    return chats.filter((chat) => {
      if (filter !== "all" && chat.kind !== filter) return false;
      if (!query) return true;
      return [chat.title, chat.subtitle, ...chat.participants.map((participant) => participant.name)]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [chats, filter, search]);

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col border-r bg-background",
        selectedId ? "hidden md:flex" : "flex"
      )}
      aria-label="Chats"
    >
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3.5">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight">Chats</h2>
          <p className="truncate text-[11px] text-muted-foreground">
            {isAdmin && scope === "all" ? "All conversations · admin view" : "Your conversations"}
          </p>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-9 w-9 shrink-0 rounded-full"
          onClick={onNewChat}
          aria-label="New chat"
          title="New chat"
        >
          <Plus size={18} />
        </Button>
      </div>

      {isAdmin ? (
        <div className="px-3 pt-3">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => onScopeChange("all")}
              className={cn(
                "rounded-md px-2 py-1.5 transition-colors",
                scope === "all" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              All chats
            </button>
            <button
              type="button"
              onClick={() => onScopeChange("mine")}
              className={cn(
                "rounded-md px-2 py-1.5 transition-colors",
                scope === "mine" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              My chats
            </button>
          </div>
        </div>
      ) : null}

      <div className="space-y-2 px-3 py-3">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search chats"
            className="h-9 rounded-lg pl-9 text-sm"
            aria-label="Search chats"
          />
        </div>
        <div className="flex items-center gap-1">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                filter === item.value
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {loading ? (
          <div className="space-y-1.5 pt-1">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 rounded-xl px-2.5 py-2.5">
                <div className="h-11 w-11 animate-pulse rounded-full bg-muted" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                  <div className="h-2.5 w-1/2 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : visibleChats.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <MessageCircle size={22} />
            </span>
            <p className="mt-3 text-sm font-medium">
              {search ? "No chats match your search" : "No conversations yet"}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {search
                ? "Try a different name or clear the search."
                : "Start a direct message or create a group to get going."}
            </p>
            {!search ? (
              <Button size="sm" className="mt-4 gap-1.5" onClick={onNewChat}>
                <Plus size={14} /> New chat
              </Button>
            ) : null}
          </div>
        ) : (
          <ul className="space-y-0.5">
            {visibleChats.map((chat) => {
              const active = chat._id === selectedId;
              const ownMessage = chat.lastMessage?.senderId === currentUserId;
              const preview = chat.lastMessage
                ? `${ownMessage ? "You: " : chat.kind === "group" && chat.lastMessage.senderName ? `${chat.lastMessage.senderName.split(" ")[0]}: ` : ""}${chat.lastMessage.text}`
                : chat.kind === "group"
                  ? `${chat.memberCount} member${chat.memberCount === 1 ? "" : "s"} · no messages yet`
                  : "No messages yet";

              return (
                <li key={chat._id}>
                  <button
                    type="button"
                    onClick={() => onSelect(chat._id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors",
                      active ? "bg-primary/10" : "hover:bg-muted/60"
                    )}
                  >
                    <ChatAvatar
                      name={chat.title}
                      image={chat.image}
                      kind={chat.kind}
                      seed={chat._id}
                      className="h-11 w-11"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className={cn("truncate text-sm", active ? "font-semibold text-foreground" : "font-medium")}>
                          {chat.title}
                        </span>
                        <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                          {formatSidebarTime(chat.lastMessageAt)}
                        </span>
                      </span>
                      <span className="mt-0.5 flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-muted-foreground">{preview}</span>
                        {chat.unread > 0 ? (
                          <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                            {chat.unread > 9 ? "9+" : chat.unread}
                          </span>
                        ) : !chat.isParticipant ? (
                          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                            Read only
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {isAdmin ? (
        <div className="flex items-center gap-1.5 border-t px-4 py-2.5 text-[11px] text-muted-foreground">
          <ShieldCheck size={12} className="shrink-0 text-primary" />
          Admins can read every conversation
        </div>
      ) : null}
    </aside>
  );
}
