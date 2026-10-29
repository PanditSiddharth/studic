"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, CheckCheck, Download, ExternalLink, FileText, Info, Loader2, Lock, MessageCircle, Send, ShieldCheck, Trash2, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/modals/utils";
import type { ChatAttachment, ChatMessage, ChatSummary } from "@/modals/chat.model";
import ChatAvatar from "./chat-avatar";
import { formatTime, groupMessagesByDay, senderTone } from "./chat-utils";
import ChatMediaUpload from "./chat-media-upload";
import VoiceCall from "./voice-call";

function AttachmentPreview({ attachment, compact = false }: { attachment: ChatAttachment; compact?: boolean }) {
  if (attachment.kind === "image") {
    return (
      <a href={attachment.url} target="_blank" rel="noreferrer" className={cn("group mt-1 block overflow-hidden rounded-xl border border-black/10", compact ? "max-w-[220px]" : "max-w-[280px]")}>
        <img src={attachment.url} alt={attachment.name} className="block max-h-72 w-full object-cover transition group-hover:opacity-90" />
      </a>
    );
  }

  const isPdf = attachment.mimeType.toLowerCase() === "application/pdf" || /\.pdf$/i.test(attachment.name);
  if (isPdf && !compact) {
    return (
      <div className="mt-1 overflow-hidden rounded-xl border border-black/10 bg-background">
        <iframe src={attachment.url} title={attachment.name} className="h-56 w-full" />
        <a href={attachment.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 border-t px-3 py-2 text-xs font-medium hover:bg-muted">
          <FileText size={14} className="shrink-0 text-primary" /><span className="min-w-0 flex-1 truncate">{attachment.name}</span><ExternalLink size={13} />
        </a>
      </div>
    );
  }

  return (
    <a href={attachment.url} target="_blank" rel="noreferrer" className="mt-1 flex max-w-[280px] items-center gap-3 rounded-xl border border-black/10 bg-black/10 px-3 py-2.5 hover:bg-black/15">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-background/80 text-primary"><FileText size={18} /></span>
      <span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium">{attachment.name}</span><span className="block text-[10px] opacity-70">Open document</span></span>
      <Download size={15} />
    </a>
  );
}

interface ChatWindowProps {
  chat: ChatSummary | null;
  messages: ChatMessage[];
  loading: boolean;
  sending: boolean;
  readOnly: boolean;
  currentUserId: string;
  onSend: (text: string, attachment?: ChatAttachment) => Promise<boolean>;
  mediaSettings: { allowMedia: boolean; allowImages: boolean; allowDocuments: boolean; allowVoiceCalls: boolean };
  onBack: () => void;
  onInfo: () => void;
  canModerate: boolean;
  onDelete: (messageId: string) => void;
}

export default function ChatWindow({
  chat,
  messages,
  loading,
  sending,
  readOnly,
  currentUserId,
  onSend,
  mediaSettings,
  onBack,
  onInfo,
  canModerate,
  onDelete,
}: ChatWindowProps) {
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<ChatAttachment | undefined>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeChatRef = useRef<string | null>(null);
  const days = groupMessagesByDay(messages);

  useEffect(() => {
    setDraft("");
    setAttachment(undefined);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [chat?._id]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const firstRender = activeChatRef.current !== chat?._id;
    activeChatRef.current = chat?._id ?? null;
    const nearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 220;
    if (firstRender || nearBottom) {
      requestAnimationFrame(() => {
        element.scrollTop = element.scrollHeight;
      });
    }
  }, [chat?._id, messages]);

  const resize = () => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 140)}px`;
  };

  const submit = async () => {
    const value = draft.trim();
    if ((!value && !attachment) || sending || readOnly) return;
    const sent = await onSend(value, attachment);
    if (sent) {
      setDraft("");
      setAttachment(undefined);
      requestAnimationFrame(() => {
        if (textareaRef.current) textareaRef.current.style.height = "auto";
        textareaRef.current?.focus();
      });
    }
  };

  if (!chat) {
    return (
      <section className="hidden h-full min-h-0 flex-col items-center justify-center bg-muted/20 px-8 text-center md:flex">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-background text-muted-foreground shadow-sm">
          <MessageCircle size={28} />
        </span>
        <h2 className="mt-4 text-lg font-semibold">Your messages</h2>
        <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
          Pick a conversation from the list or start a new chat with a learner, a group or the admin team.
        </p>
      </section>
    );
  }

  return (
    <section className="flex h-full min-h-0 flex-col bg-background" aria-label={`Chat with ${chat.title}`}>
      <header className="flex items-center gap-3 border-b bg-background/95 px-3 py-2.5 backdrop-blur sm:px-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-full md:hidden"
          onClick={onBack}
          aria-label="Back to chats"
        >
          <ArrowLeft size={18} />
        </Button>
        {mediaSettings.allowVoiceCalls ? <VoiceCall chatId={chat._id} currentUserId={currentUserId} /> : null}
        <ChatAvatar name={chat.title} image={chat.image} kind={chat.kind} seed={chat._id} className="h-10 w-10" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
            {chat.title}
            {chat.kind === "group" ? (
              <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                Group
              </span>
            ) : null}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {chat.subtitle}
            {readOnly ? " · read only" : ""}
          </p>
        </div>
        {readOnly ? (
          <span className="hidden items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-medium text-amber-600 sm:inline-flex dark:text-amber-400">
            <Lock size={11} /> Admin view
          </span>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-full"
          onClick={onInfo}
          aria-label="Chat details"
          title="Chat details"
        >
          <Info size={18} />
        </Button>
      </header>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto bg-muted/20 px-3 py-4 sm:px-5"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, hsl(var(--muted-foreground) / 0.13) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      >
        {loading ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Loader2 className="animate-spin" size={22} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-background text-muted-foreground shadow-sm">
              <MessageCircle size={22} />
            </span>
            <p className="mt-3 text-sm font-medium">No messages yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {readOnly ? "This conversation is empty." : "Say hello and start the conversation."}
            </p>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-1">
            {days.map((day) => (
              <div key={day.key} className="flex flex-col gap-1">
                <div className="sticky top-0 z-10 my-3 flex justify-center">
                  <span className="rounded-full border bg-background/95 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground shadow-sm backdrop-blur">
                    {day.label}
                  </span>
                </div>
                {day.messages.map((message, index) => {
                  const own = message.sender._id === currentUserId;
                  const previous = index > 0 ? day.messages[index - 1] : null;
                  const showSender =
                    !own &&
                    chat.kind === "group" &&
                    (!previous || previous.sender._id !== message.sender._id);
                  return (
                    <div key={message._id} className={cn("flex w-full", own ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[82%] rounded-2xl px-3 py-2 text-sm shadow-sm sm:max-w-[72%]",
                          own
                            ? "rounded-br-md bg-primary text-primary-foreground"
                            : "rounded-bl-md border bg-card text-foreground"
                        )}
                      >
                        {showSender ? (
                          <p className={cn("mb-0.5 text-[11px] font-semibold", senderTone(message.sender._id))}>
                            {message.sender.name}
                          </p>
                        ) : null}
                        {message.text ? <p className="whitespace-pre-wrap break-words leading-6">{message.text}</p> : null}
                        {message.attachment ? <AttachmentPreview attachment={message.attachment} /> : null}
                        <span
                          className={cn(
                            "mt-1 flex items-center justify-end gap-1 text-[10px]",
                            own ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}
                        >
                          {formatTime(message.createdAt)}
                          {own ? <CheckCheck size={12} /> : null}
                          {(canModerate || own) ? (
                            <button
                              type="button"
                              className="ml-1 opacity-60 hover:opacity-100"
                              onClick={() => onDelete(message._id)}
                              aria-label="Delete message"
                            >
                              <Trash2 size={11} />
                            </button>
                          ) : null}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {readOnly ? (
        <div className="flex items-start gap-2 border-t bg-muted/30 px-4 py-3 text-xs leading-5 text-muted-foreground">
          <ShieldCheck size={15} className="mt-0.5 shrink-0 text-primary" />
          <p>
            You are viewing this conversation as an administrator. Only its members can send messages here.
          </p>
        </div>
      ) : (
        <form
          className="border-t bg-background p-2.5 sm:p-3"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          {attachment ? (
            <div className="relative mb-2 w-fit max-w-full rounded-xl border bg-muted p-1.5">
              <AttachmentPreview attachment={attachment} compact />
              <button type="button" className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-background/90 text-muted-foreground shadow-sm hover:text-foreground" onClick={() => setAttachment(undefined)} aria-label="Remove attachment">
                <X size={14} />
              </button>
            </div>
          ) : null}
          <div className="flex items-end gap-2">
            {mediaSettings.allowMedia ? <ChatMediaUpload allowImages={mediaSettings.allowImages} allowDocuments={mediaSettings.allowDocuments} onUploaded={setAttachment} /> : null}
            <Textarea
              ref={textareaRef}
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                resize();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  void submit();
                }
              }}
              rows={1}
              placeholder={`Message ${chat.title}`}
              className="max-h-[140px] min-h-[42px] resize-none rounded-2xl border bg-muted/40 px-3.5 py-2.5 text-sm shadow-none focus-visible:bg-background focus-visible:ring-1"
              aria-label="Message"
            />
            <Button
              type="submit"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-full"
              disabled={(!draft.trim() && !attachment) || sending}
              aria-label="Send message"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </Button>
          </div>
          <p className="mt-1.5 hidden px-1 text-[10px] text-muted-foreground sm:block">
            Enter to send · Shift + Enter for a new line
          </p>
        </form>
      )}
    </section>
  );
}
