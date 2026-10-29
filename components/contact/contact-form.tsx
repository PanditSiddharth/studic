"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { ArrowRight, Loader2, MessageCircle, Send } from "lucide-react";
import { useSession } from "next-auth/react";
import { createQueryAndSupportChat } from "@/server-functions/query";
import { startSupportChat } from "@/server-functions/chat";

export default function ContactForm() {
  const router = useRouter();
  const { status } = useSession();
  const [form, setForm] = useState({ name: "", email: "", description: "" });
  const [sending, setSending] = useState(false);
  const [chatting, setChatting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    const result = await createQueryAndSupportChat(form);
    if (!result || "error" in result) toast.error(result?.error || "Could not send your message.");
    else {
      const chatResult = "chatAvailable" in result ? result : null;
      toast.success(chatResult?.chatAvailable ? "Message sent to your support chat." : (chatResult?.message || "Message sent. We will get back to you soon."));
      setForm({ name: "", email: "", description: "" });
      if (chatResult?.chatAvailable && chatResult.chatId) router.push(`/chat?chat=${encodeURIComponent(chatResult.chatId)}`);
    }
    setSending(false);
  };

  const openChat = async () => {
    if (status !== "authenticated") {
      router.push("/auth?callbackUrl=/contact");
      return;
    }
    setChatting(true);
    const result = await startSupportChat();
    if ("error" in result) toast.error(result.error);
    else if (result.chatId) router.push(`/chat?chat=${encodeURIComponent(result.chatId)}`);
    setChatting(false);
  };

  return (
    <div className="space-y-4">
      <button type="button" onClick={() => void openChat()} disabled={chatting} className="group flex w-full items-center justify-between rounded-2xl border border-primary/25 bg-primary/5 p-4 text-left transition-colors hover:bg-primary/10 disabled:opacity-60">
        <span className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground"><MessageCircle size={18} /></span><span><span className="block font-semibold">Open in-site chat</span><span className="mt-1 block text-xs text-muted-foreground">Talk privately with the Studic support team</span></span></span>
        {chatting ? <Loader2 size={18} className="animate-spin text-primary" /> : <ArrowRight size={18} className="text-primary transition-transform group-hover:translate-x-1" />}
      </button>
      <form onSubmit={(event) => void submit(event)} className="space-y-4">
        <div><label htmlFor="contact-name" className="text-sm font-medium">Your name</label><input id="contact-name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Enter your name" className="mt-1.5 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" /></div>
        <div><label htmlFor="contact-email" className="text-sm font-medium">Email address</label><input id="contact-email" type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" className="mt-1.5 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" /></div>
        <div><label htmlFor="contact-message" className="text-sm font-medium">How can we help?</label><textarea id="contact-message" required rows={5} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Tell us what you need help with..." className="mt-1.5 w-full resize-none rounded-xl border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" /></div>
        <button type="submit" disabled={sending} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/15 transition hover:opacity-90 disabled:opacity-60">{sending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}{sending ? "Sending..." : "Send message"}</button>
      </form>
    </div>
  );
}
