"use client";

import { Crown, Lock, ShieldCheck, Users } from "lucide-react";
import type { ChatSummary } from "@/modals/chat.model";
import ChatAvatar from "./chat-avatar";
import { cn } from "@/modals/utils";

interface ChatInfoProps {
  chat: ChatSummary;
  currentUserId: string;
  readOnly: boolean;
}

export default function ChatInfo({ chat, currentUserId, readOnly }: ChatInfoProps) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="border-b px-5 py-6 text-center">
        <ChatAvatar
          name={chat.title}
          image={chat.image}
          kind={chat.kind}
          seed={chat._id}
          className="mx-auto h-20 w-20"
          fallbackClassName="text-xl"
        />
        <h3 className="mt-3 break-words text-base font-semibold">{chat.title}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{chat.subtitle}</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
          {chat.kind === "group" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              <Users size={10} /> Group
            </span>
          ) : null}
          {chat.isGroupAdmin ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              <Crown size={10} /> Group admin
            </span>
          ) : null}
          {readOnly ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
              <Lock size={10} /> Read only
            </span>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
        {chat.kind === "group" && chat.isParticipant === false ? (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-[11px] leading-5 text-muted-foreground">
            <ShieldCheck size={14} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
            You are not a member of this group. Admin access is read-only.
          </div>
        ) : null}

        {chat.kind === "group" && chat.isParticipant ? (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">About</p>
            <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
              {chat.participants.length > 0
                ? "A shared space for this group to learn and talk together."
                : "No description yet."}
            </p>
          </div>
        ) : null}

        <div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {chat.kind === "group" ? "Members" : "Participants"}
            </p>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              {chat.memberCount}
            </span>
          </div>
          <ul className="mt-2 space-y-0.5">
            {chat.participants.map((participant) => {
              const isChatAdmin = chat.adminIds.includes(participant._id);
              const isMe = participant._id === currentUserId;
              return (
                <li key={participant._id} className="flex items-center gap-2.5 rounded-xl px-2 py-2 hover:bg-muted/50">
                  <ChatAvatar
                    name={participant.name}
                    image={participant.image}
                    seed={participant._id}
                    className="h-8 w-8"
                    fallbackClassName="text-[10px]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1">
                      <span className="truncate text-sm">{participant.name}</span>
                      {isMe ? (
                        <span className="rounded bg-muted px-1 py-0.5 text-[9px] font-medium text-muted-foreground">You</span>
                      ) : null}
                    </span>
                    <span className={cn("block truncate text-[11px] text-muted-foreground")}>
                      {participant.username ? `@${participant.username}` : participant.role === "admin" ? "Studic admin" : "Studic learner"}
                    </span>
                  </span>
                  {isChatAdmin ? (
                    <span
                      className="inline-flex shrink-0 items-center gap-0.5 rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary"
                      title="Group admin"
                    >
                      <Crown size={9} /> Admin
                    </span>
                  ) : participant.role === "admin" ? (
                    <ShieldCheck size={13} className="shrink-0 text-primary" aria-label="Studic admin" />
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-xl border bg-muted/30 p-3 text-[11px] leading-5 text-muted-foreground">
          Messages in this conversation are visible to its members
          {chat.kind === "group" ? " and to Studic administrators." : " and to Studic administrators."}
        </div>
      </div>
    </div>
  );
}
