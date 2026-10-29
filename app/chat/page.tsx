import type { Metadata } from "next";
import ChatWorkspace from "@/components/chat/chat-workspace";

export const metadata: Metadata = {
  title: "Chats · Studic",
  description: "Message learners, sellers and groups on Studic.",
};

export default function ChatPage() {
  return (
    <main className="fixed inset-x-0 bottom-0 top-16 z-10 overflow-hidden bg-muted/20">
      <ChatWorkspace />
    </main>
  );
}
