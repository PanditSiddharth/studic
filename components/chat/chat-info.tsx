"use client";

import { useState } from "react";
import { ChevronDown, Crown, Lock, Settings2, ShieldCheck, Trash2, Users } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ChatPermissions, ChatSummary } from "@/modals/chat.model";
import ChatAvatar from "./chat-avatar";
import { deleteChatMessagesByRange, muteChatUser, removeChatUser, updateChatDetails, updateChatModeration } from "@/server-functions/chat";
import ChatImageUpload from "./chat-image-upload";

interface ChatInfoProps {
  chat: ChatSummary;
  currentUserId: string;
  readOnly: boolean;
  isAdmin?: boolean;
  onUpdated?: (details: { name: string; description: string; image: string }) => void;
  onMessagesDeleted?: () => void;
}

export default function ChatInfo({ chat, currentUserId, readOnly, isAdmin = false, onUpdated, onMessagesDeleted }: ChatInfoProps) {
  const canManageGroup = isAdmin || chat.isGroupAdmin || chat.createdBy === currentUserId;
  const canEditGroupInfo = canManageGroup || chat.moderation?.permissions?.membersCanEditInfo === true;
  const [name, setName] = useState(chat.title);
  const [description, setDescription] = useState(chat.description || "");
  const [image, setImage] = useState(chat.image || "");
  const [slowMode, setSlowMode] = useState(String(chat.moderation?.slowModeSeconds || 0));
  const [words, setWords] = useState((chat.moderation?.restrictedWords || []).join(", "));
  const [permissions, setPermissions] = useState<ChatPermissions>({
    membersCanMessage: true,
    adminsOnlyMessaging: false,
    membersCanSendMedia: true,
    membersCanEditInfo: false,
    membersCanInvite: true,
    isPublic: false,
    isDiscoverable: false,
    ...chat.moderation?.permissions,
  });
  const [sendAccessMode, setSendAccessMode] = useState<"immediate" | "at_time" | "after_seconds">(
    chat.moderation?.messageSendAfter ? "at_time" : "immediate"
  );
  const [sendDelaySeconds, setSendDelaySeconds] = useState("60");
  const [messageSendAfter, setMessageSendAfter] = useState(() => {
    const value = chat.moderation?.messageSendAfter;
    return value ? new Date(value).toISOString().slice(0, 16) : "";
  });
  const [messageRetentionHours, setMessageRetentionHours] = useState(
    String(Math.max(1, Math.round(Number(chat.moderation?.messageRetentionSeconds || 3600) / 3600)))
  );
  const [saving, setSaving] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState("");
  const [deleteFrom, setDeleteFrom] = useState("");
  const [deleteTo, setDeleteTo] = useState("");
  const [deletingMessages, setDeletingMessages] = useState(false);

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
    const messageSendAt = sendAccessMode === "immediate"
      ? null
      : sendAccessMode === "after_seconds"
        ? new Date(Date.now() + Math.max(1, Number(sendDelaySeconds) || 60) * 1000).toISOString()
        : messageSendAfter
          ? new Date(messageSendAfter).toISOString()
          : null;
    const result = await updateChatModeration({
      chatId: chat._id,
      slowModeSeconds: Number(slowMode) || 0,
      restrictedWords: words.split(","),
      messageSendAfter: messageSendAt,
      messageRetentionHours: Number(messageRetentionHours) || 1,
      permissions,
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

  const removeMember = async (userId: string) => {
    if (!window.confirm("Remove this member from the group?")) return;
    const result = await removeChatUser({ chatId: chat._id, userId });
    if ("error" in result) toast.error(result.error);
    else {
      toast.success("Member removed from group");
      window.location.reload();
    }
  };

  const togglePermission = (key: keyof ChatPermissions) => {
    setPermissions((current) => ({ ...current, [key]: !current[key] }));
  };

  const deleteMessages = async () => {
    if (!deleteFrom || !deleteTo) {
      toast.error("Choose a start and end time");
      return;
    }
    if (!window.confirm(`Delete ${deleteUserId ? "this user's" : "all"} messages in the selected time range?`)) return;
    setDeletingMessages(true);
    const result = await deleteChatMessagesByRange({
      chatId: chat._id,
      senderId: deleteUserId || undefined,
      from: deleteFrom,
      to: deleteTo,
    });
    setDeletingMessages(false);
    if ("error" in result) toast.error(result.error);
    else {
      toast.success(result.deleted ? `${result.deleted} message${result.deleted === 1 ? "" : "s"} deleted` : "No messages found in this range");
      onMessagesDeleted?.();
    }
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
        {chat.kind === "group" && canEditGroupInfo ? (
          <div className="mt-4 space-y-3 text-left">
            <ChatImageUpload value={image} onChange={setImage} />
            <Input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} aria-label="Group name" />
            <Input value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} placeholder="Group description" aria-label="Group description" />
            <Button type="button" size="sm" className="w-full" disabled={savingDetails} onClick={() => void saveDetails()}>
              {savingDetails ? "Saving..." : "Save group profile"}
            </Button>
          </div>
        ) : null}

        {isAdmin ? (
          <div className="space-y-3 rounded-xl border border-destructive/20 bg-destructive/[0.03] p-3">
            <div className="flex items-center gap-2">
              <Trash2 size={14} className="text-destructive" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Admin message deletion</p>
            </div>
            <p className="text-[10px] leading-4 text-muted-foreground">Delete messages from this conversation one user at a time or for everyone in a selected time range.</p>
            <label className="block text-xs">
              Messages from
              <select value={deleteUserId} onChange={(event) => setDeleteUserId(event.target.value)} className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-xs">
                <option value="">Everyone in this chat</option>
                {chat.participants.map((participant) => <option key={participant._id} value={participant._id}>{participant.name}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="block text-xs">From<Input type="datetime-local" value={deleteFrom} onChange={(event) => setDeleteFrom(event.target.value)} className="mt-1 h-9 text-xs" /></label>
              <label className="block text-xs">To<Input type="datetime-local" value={deleteTo} onChange={(event) => setDeleteTo(event.target.value)} className="mt-1 h-9 text-xs" /></label>
            </div>
            <Button type="button" variant="destructive" size="sm" className="w-full" disabled={deletingMessages} onClick={() => void deleteMessages()}>
              {deletingMessages ? "Deleting..." : "Delete selected messages"}
            </Button>
          </div>
        ) : null}
        {chat.kind === "group" && canManageGroup ? (
          <button
            type="button"
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/15"
            onClick={() => document.getElementById("group-settings-panel")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            <Settings2 size={14} /> Open group settings <ChevronDown size={14} />
          </button>
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

        {chat.kind === "group" && canManageGroup ? (
          <div id="group-settings-panel" className="scroll-mt-3 space-y-3 rounded-xl border border-primary/20 bg-primary/[0.03] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Group settings</p>
            <p className="text-[10px] leading-4 text-muted-foreground">Manage group access, timers, moderation and members from here.</p>
            <label className="block text-xs">
              New member message access
              <select value={sendAccessMode} onChange={(event) => setSendAccessMode(event.target.value as typeof sendAccessMode)} className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-xs">
                <option value="immediate">Immediately (default)</option>
                <option value="at_time">At a specific date and time</option>
                <option value="after_seconds">After a delay</option>
              </select>
            </label>
            {sendAccessMode === "after_seconds" ? (
              <label className="block text-xs">
                Delay before messaging (seconds)
                <Input type="number" min={1} max={2592000} value={sendDelaySeconds} onChange={(event) => setSendDelaySeconds(event.target.value)} className="mt-1 h-8 text-xs" />
              </label>
            ) : null}
            {sendAccessMode === "at_time" ? (
              <label className="block text-xs">
                New members can send messages from
                <Input type="datetime-local" value={messageSendAfter} onChange={(event) => setMessageSendAfter(event.target.value)} className="mt-1 h-8 text-xs" />
              </label>
            ) : null}
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
            <div className="space-y-2 rounded-lg border bg-background/70 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Permissions & restrictions</p>
              {([
                ["membersCanMessage", "Members can send messages"],
                ["adminsOnlyMessaging", "Only admins can send messages"],
                ["membersCanSendMedia", "Members can send media and files"],
                ["membersCanEditInfo", "Members can edit group info/photo"],
                ["membersCanInvite", "Members can invite new users"],
                ["isPublic", "Make group public"],
                ["isDiscoverable", "Show group in discovery"],
              ] as const).map(([key, label]) => (
                <label key={key} className="flex items-center justify-between gap-3 text-xs">
                  <span>{label}</span>
                  <input type="checkbox" checked={permissions[key]} onChange={() => togglePermission(key)} className="h-4 w-4 accent-primary" />
                </label>
              ))}
              <p className="text-[10px] leading-4 text-muted-foreground">Polls, reactions, reports and pins are not available in the current chat system yet.</p>
            </div>
            <label className="block text-xs">
              Restricted words (comma separated)
              <Input
                value={words}
                onChange={(event) => setWords(event.target.value)}
                placeholder="word1, word2"
                className="mt-1 h-8 text-xs"
              />
            </label>
            <label className="block text-xs">
              Default message auto-delete (hours)
              <select value={messageRetentionHours} onChange={(event) => setMessageRetentionHours(event.target.value)} className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-xs">
                <option value="1">1 hour (default)</option>
                <option value="6">6 hours</option>
                <option value="24">24 hours</option>
                <option value="168">7 days</option>
                <option value="720">30 days</option>
              </select>
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
                  {chat.kind === "group" && canManageGroup && !isMe && !isChatAdmin ? (
                    <span className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        className="rounded px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground hover:bg-muted"
                        onClick={() => void mute(participant._id)}
                      >
                        Mute 10m
                      </button>
                      <button
                        type="button"
                        className="rounded px-1.5 py-0.5 text-[9px] font-semibold text-destructive hover:bg-destructive/10"
                        onClick={() => void removeMember(participant._id)}
                      >
                        Remove
                      </button>
                    </span>
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
