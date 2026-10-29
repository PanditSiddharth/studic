import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight, Mail, MessageCircle, Send, Youtube } from "lucide-react";
import ContactForm from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "Contact Studic",
  description: "Get help from the Studic team through chat, email, YouTube or Telegram.",
  alternates: { canonical: "/contact" },
};

const links = [
  { title: "Email us", detail: "mynmss3@gmail.com", href: "mailto:mynmss3@gmail.com", icon: Mail, className: "bg-rose-500/10 text-rose-600" },
  { title: "YouTube", detail: "Ignou Study Center", href: "https://youtube.com/ignoustudycenter", icon: Youtube, className: "bg-red-500/10 text-red-600" },
  { title: "Telegram", detail: "@ignoustudychannel", href: "https://telegram.me/ignoustudychannel", icon: Send, className: "bg-sky-500/10 text-sky-600" },
];

export default function Contact() {
  return (
    <main className="min-h-screen bg-muted/20">
      <section className="relative overflow-hidden border-b bg-card">
        <div className="absolute -right-24 -top-32 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Support center</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">We’re here to help you keep learning.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">Ask a question, report an issue, or connect with the Studic team through the channel that works best for you.</p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm text-muted-foreground"><a href="/chat" className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-2 font-medium transition hover:border-primary/40 hover:text-primary"><MessageCircle size={15} className="text-primary" /> Open support chat <ArrowRight size={14} /></a><span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-2"><Mail size={15} className="text-primary" /> Human support</span></div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)] lg:py-16">
        <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8"><div className="mb-7"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Send a request</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">Tell us what’s on your mind</h2><p className="mt-2 text-sm text-muted-foreground">We usually respond by email after reviewing your message.</p></div><ContactForm /></div>
        <div className="space-y-4">
          <div className="rounded-3xl border bg-card p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Connect with Studic</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">Choose your channel</h2><div className="mt-6 space-y-3">{links.map((link) => <a key={link.title} href={link.href} target={link.href.startsWith("http") ? "_blank" : undefined} rel={link.href.startsWith("http") ? "noreferrer" : undefined} className="group flex items-center gap-3 rounded-2xl border p-3.5 transition hover:border-primary/40 hover:bg-muted/40"><span className={`grid h-10 w-10 place-items-center rounded-xl ${link.className}`}><link.icon size={19} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{link.title}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{link.detail}</span></span><ArrowUpRight size={16} className="text-muted-foreground transition group-hover:text-primary" /></a>)}</div></div>
          <div className="rounded-3xl bg-primary p-6 text-primary-foreground shadow-lg shadow-primary/15"><p className="text-lg font-semibold">Need help with your account?</p><p className="mt-2 text-sm leading-6 text-primary-foreground/75">Sign in and start a private conversation with our support team directly inside Studic.</p></div>
        </div>
      </section>
    </main>
  );
}
