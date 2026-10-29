"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import {
  Dialog, DialogContent, DialogDescription, DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/modals/utils";
import type { ChatAttachment, ChatMessage, ChatSummary } from "@/modals/chat.model";
import {
  deleteChatMessage, getChat, getChats, getChatMediaSettings, getChatMessages, sendChatMessage,
} from "@/server-functions/chat";
import ChatSidebar from "./chat-sidebar";
import ChatWindow from "./chat-window";
import ChatInfo from "./chat-info";
import NewChatDialog from "./new-chat-dialog";

export default function ChatWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [scope, setScope] = useState<"mine" | "all">("all");
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loadingChats, setLoadingChats] = useState(true);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [chat, setChat] = useState<ChatSummary | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [sending, setSending] = useState(false);
  const [mediaSettings, setMediaSettings] = useState({ allowMedia: false, allowImages: false, allowDocuments: false, allowVoiceCalls: false });

  const [newChatOpen, setNewChatOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const lastMessageId = useRef<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth?callbackUrl=/chat");
    }
  }, [router, status]);

  const loadChats = useCallback(
    async (silent = false) => {
      if (!silent) setLoadingChats(true);
      try {
        const result = await getChats({ scope });
        if (!result || "error" in result) {
          if (!silent) toast.error(result && "error" in result ? result.error : "Could not load chats");
          return;
        }
        const data = result as {
          chats: ChatSummary[];
          scope: "mine" | "all";
          isAdmin: boolean;
          currentUserId: string;
        };
        setChats(data.chats);
        setIsAdmin(data.isAdmin);
        setCurrentUserId(data.currentUserId);
        if (data.scope !== scope) setScope(data.scope);
      } catch (error) {
        if (!silent) toast.error("Could not load chats");
      } finally {
        if (!silent) setLoadingChats(false);
      }
    },
    [scope]
  );

  useEffect(() => {
    if (status !== "authenticated") return;
    void loadChats();
  }, [loadChats, status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    void getChatMediaSettings().then((result) => {
      if (result && !("error" in result)) setMediaSettings(result.settings);
    });
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const timer = setInterval(() => void loadChats(true), 8000);
    const onFocus = () => void loadChats(true);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadChats, status]);

  const openChat = useCallback(async (chatId: string) => {
    setSelectedId(chatId);
    setLoadingChat(true);
    setInfoOpen(false);
    try {
      const result = await getChat(chatId);
      if (!result || "error" in result) {
        toast.error(result && "error" in result ? result.error : "Could not open this chat");
        setSelectedId(null);
        setChat(null);
        setMessages([]);
        return;
      }
      const data = result as {
        chat: ChatSummary;
        messages: ChatMessage[];
        currentUserId: string;
        readOnly: boolean;
      };
      setChat(data.chat);
      setMessages(data.messages);
      setCurrentUserId(data.currentUserId);
      setReadOnly(data.readOnly);
      lastMessageId.current = data.messages.length ? data.messages[data.messages.length - 1]._id : null;
      setChats((current) =>
        current.map((item) => (item._id === chatId ? { ...item, unread: 0 } : item))
      );
    } catch (error) {
      toast.error("Could not open this chat");
    } finally {
      setLoadingChat(false);
    }
  }, []);

  useEffect(() => {
    const requestedChat = searchParams.get("chat");
    if (status === "authenticated" && requestedChat && !loadingChats) {
      void openChat(requestedChat);
    }
  }, [loadingChats, openChat, searchParams, status]);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;

    const tick = async () => {
      try {
        const result = await getChatMessages({ chatId: selectedId, after: lastMessageId.current || undefined });
        if (cancelled || !result || "error" in result) return;
        const fresh = (result as { messages: ChatMessage[] }).messages;
        if (!fresh.length) return;
        setMessages((current) => {
          const known = new Set(current.map((message) => message._id));
          const additions = fresh.filter((message) => !known.has(message._id));
          return additions.length ? [...current, ...additions] : current;
        });
        lastMessageId.current = fresh[fresh.length - 1]._id;
        void loadChats(true);
      } catch {
        /* polling is best-effort; the next tick retries */
      }
    };

    const timer = setInterval(tick, 4000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [loadChats, selectedId]);

  const handleSend = useCallback(
    async (text: string, attachment?: ChatAttachment) => {
      if (!chat) return false;
      setSending(true);
      try {
        const result = await sendChatMessage({ chatId: chat._id, text, attachment });
        if (!result || "error" in result) {
          toast.error(result && "error" in result ? result.error : "Could not send your message");
          return false;
        }
        const message = (result as { message: ChatMessage }).message;
        setMessages((current) =>
          current.some((item) => item._id === message._id) ? current : [...current, message]
        );
        lastMessageId.current = message._id;
        setChats((current) =>
          current.map((item) =>
            item._id === chat._id
              ? {
                  ...item,
                  unread: 0,
                  lastMessage: {
                    text: text.length > 200 ? `${text.slice(0, 197)}...` : text,
                    senderId: currentUserId,
                    senderName: message.sender.name,
                    at: message.createdAt,
                  },
                  lastMessageAt: message.createdAt,
                }
              : item
          )
        );
        return true;
      } catch (error) {
        toast.error("Could not send your message");
        return false;
      } finally {
        setSending(false);
      }
    },
    [chat, currentUserId]
  );

  const goBack = () => {
    setSelectedId(null);
    setChat(null);
    setMessages([]);
    lastMessageId.current = null;
  };

  const handleCreated = async (chatId: string) => {
    setNewChatOpen(false);
    await loadChats(true);
    await openChat(chatId);
  };

  const handleDeleteMessage = async (messageId: string) => {
    const result = await deleteChatMessage(messageId);
    if (!result || "error" in result) {
      toast.error(result && "error" in result ? result.error : "Could not delete message");
      return;
    }
    setMessages((current) => current.filter((message) => message._id !== messageId));
  };

  const handleChatUpdated = (details: { name: string; description: string; image: string }) => {
    if (!chat) return;
    const update = (item: ChatSummary) =>
      item._id === chat._id
        ? { ...item, title: details.name, description: details.description, image: details.image }
        : item;
    setChat((current) => current ? update(current) : current);
    setChats((current) => current.map(update));
  };

  if (status === "loading" || (status === "authenticated" && loadingChats && chats.length === 0)) {
    return (
      <div className="flex h-[calc(100dvh-4rem)] items-center justify-center text-muted-foreground">
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  return (
    <div className="mx-auto h-full w-full">
      <div
        className={cn(
          "grid h-full min-h-0 overflow-hidden bg-card",
          "sm:rounded-none sm:border-0 sm:shadow-none",
          "grid-cols-1 md:grid-cols-[minmax(290px,340px)_minmax(0,1fr)]",
          chat && "xl:grid-cols-[minmax(290px,340px)_minmax(0,1fr)_minmax(260px,300px)]"
        )}
      >
        <ChatSidebar
          chats={chats}
          loading={loadingChats}
          selectedId={selectedId}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          scope={scope}
          onScopeChange={setScope}
          onSelect={(chatId) => void openChat(chatId)}
          onNewChat={() => setNewChatOpen(true)}
        />

        <ChatWindow
          chat={chat}
          messages={messages}
          loading={loadingChat}
          sending={sending}
          mediaSettings={mediaSettings}
          readOnly={readOnly}
          currentUserId={currentUserId}
          onSend={handleSend}
          onBack={goBack}
          onInfo={() => setInfoOpen(true)}
          canModerate={Boolean(chat?.moderation?.canManage)}
          onDelete={(messageId) => void handleDeleteMessage(messageId)}
        />

        {chat ? (
          <aside className="hidden min-h-0 border-l xl:block">
            <ChatInfo chat={chat} currentUserId={currentUserId} readOnly={readOnly} onUpdated={handleChatUpdated} />
          </aside>
        ) : null}
      </div>

      <NewChatDialog open={newChatOpen} onOpenChange={setNewChatOpen} onCreated={(chatId) => void handleCreated(chatId)} />

      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] max-w-sm overflow-hidden p-0 sm:w-full">
          <DialogTitle className="sr-only">Chat details</DialogTitle>
          <DialogDescription className="sr-only">
            Members and details for this conversation
          </DialogDescription>
          {chat ? <ChatInfo chat={chat} currentUserId={currentUserId} readOnly={readOnly} onUpdated={handleChatUpdated} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
