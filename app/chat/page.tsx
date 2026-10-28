import type { Metadata } from "next";
import ChatWorkspace from "@/components/chat/chat-workspace";

export const metadata: Metadata = {
  title: "Chats · Studic",
  description: "Message learners, sellers and groups on Studic.",
};

export default function ChatPage() {
  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-muted/20">
      <ChatWorkspace />
    </main>
  );
}
