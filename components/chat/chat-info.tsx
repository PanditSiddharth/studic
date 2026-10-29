"use client";

import { useState } from "react";
import { Crown, Lock, ShieldCheck, Users } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ChatSummary } from "@/modals/chat.model";
import ChatAvatar from "./chat-avatar";
import { muteChatUser, updateChatDetails, updateChatModeration } from "@/server-functions/chat";
import ChatImageUpload from "./chat-image-upload";

interface ChatInfoProps {
  chat: ChatSummary;
  currentUserId: string;
  readOnly: boolean;
  onUpdated?: (details: { name: string; description: string; image: string }) => void;
}

export default function ChatInfo({ chat, currentUserId, readOnly, onUpdated }: ChatInfoProps) {
  const [name, setName] = useState(chat.title);
  const [description, setDescription] = useState(chat.description || "");
  const [image, setImage] = useState(chat.image || "");
  const [slowMode, setSlowMode] = useState(String(chat.moderation?.slowModeSeconds || 0));
  const [words, setWords] = useState((chat.moderation?.restrictedWords || []).join(", "));
  const [saving, setSaving] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);

  const saveDetails = async () => {
    setSavingDetails(true);
    const result = await updateChatDetails({ chatId: chat._id, name, description, image });
    setSavingDetails(false);
    if ("error" in result) toast.error(result.error);
    else {
      onUpdated?.({ name, description, image });
      toast.success("Group details updated");
    }
  };

  const saveModeration = async () => {
    setSaving(true);
    const result = await updateChatModeration({
      chatId: chat._id,
      slowModeSeconds: Number(slowMode) || 0,
      restrictedWords: words.split(","),
    });
    setSaving(false);
    if ("error" in result) toast.error(result.error);
    else toast.success("Group restrictions updated");
  };

  const mute = async (userId: string) => {
    const result = await muteChatUser({ chatId: chat._id, userId, seconds: 600 });
    if ("error" in result) toast.error(result.error);
    else toast.success("User muted for 10 minutes");
  };

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
        {chat.kind === "group" && chat.moderation?.canManage ? (
          <div className="mt-4 space-y-3 text-left">
            <ChatImageUpload value={image} onChange={setImage} />
            <Input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} aria-label="Group name" />
            <Input value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} placeholder="Group description" aria-label="Group description" />
            <Button type="button" size="sm" className="w-full" disabled={savingDetails} onClick={() => void saveDetails()}>
              {savingDetails ? "Saving..." : "Save group profile"}
            </Button>
          </div>
        ) : null}
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

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
              {chat.description || "A shared space for this group to learn and talk together."}
            </p>
          </div>
        ) : null}

        {chat.systemKey === "all-site-users" ? (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-[11px] leading-5 text-muted-foreground">
            Every registered Studic user is automatically included in this community. Members cannot leave or be removed.
          </div>
        ) : null}

        {chat.kind === "group" && chat.moderation?.canManage ? (
          <div className="space-y-3 rounded-xl border bg-muted/20 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Group restrictions</p>
            <label className="block text-xs">
              Global slow mode (seconds)
              <Input
                type="number"
                min={0}
                max={86400}
                value={slowMode}
                onChange={(event) => setSlowMode(event.target.value)}
                className="mt-1 h-8 text-xs"
              />
            </label>
            <label className="block text-xs">
              Restricted words (comma separated)
              <Input
                value={words}
                onChange={(event) => setWords(event.target.value)}
                placeholder="word1, word2"
                className="mt-1 h-8 text-xs"
              />
            </label>
            <Button type="button" size="sm" className="w-full" disabled={saving} onClick={() => void saveModeration()}>
              {saving ? "Saving..." : "Save restrictions"}
            </Button>
            <p className="text-[10px] leading-4 text-muted-foreground">
              Restricted words delete the attempted message and mute the sender for 10 minutes.
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
                    <span className="block truncate text-[11px] text-muted-foreground">
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
                  {chat.kind === "group" && chat.moderation?.canManage && !isMe && !isChatAdmin ? (
                    <button
                      type="button"
                      className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold text-destructive hover:bg-destructive/10"
                      onClick={() => void mute(participant._id)}
                    >
                      Mute 10m
                    </button>
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
