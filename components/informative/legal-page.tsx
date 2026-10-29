import Link from "next/link";
import { ArrowRight, CheckCircle2, FileText, Mail } from "lucide-react";

export type LegalSection = {
  id: string;
  title: string;
  body: string;
};

export default function LegalPage({
  eyebrow,
  title,
  description,
  effectiveDate = "29 October 2026",
  sections,
  note,
}: {
  eyebrow: string;
  title: string;
  description: string;
  effectiveDate?: string;
  sections: LegalSection[];
  note?: string;
}) {
  return (
    <main className="min-h-screen bg-muted/20">
      <section className="relative overflow-hidden border-b bg-card">
        <div className="absolute -left-24 -top-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 right-0 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
          <div className="flex items-center gap-3 text-primary">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10"><FileText size={19} /></span>
            <span className="text-xs font-bold uppercase tracking-[0.2em]">{eyebrow}</span>
          </div>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">{description}</p>
          <div className="mt-7 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="rounded-full border bg-background px-3 py-1.5">Effective {effectiveDate}</span>
            <span className="rounded-full border bg-background px-3 py-1.5">India</span>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:py-16">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border bg-card p-4 shadow-sm">
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">On this page</p>
            <nav className="mt-3 space-y-1">
              {sections.map((section, index) => <a key={section.id} href={`#${section.id}`} className="flex gap-2 rounded-lg px-3 py-2 text-xs leading-5 text-muted-foreground transition hover:bg-muted hover:text-foreground"><span className="font-semibold text-primary">{String(index + 1).padStart(2, "0")}</span><span>{section.title}</span></a>)}
            </nav>
          </div>
        </aside>
        <article className="min-w-0">
          <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
            {sections.map((section, index) => <section id={section.id} key={section.id} className="scroll-mt-24 border-b p-6 last:border-b-0 sm:p-8">
              <div className="flex gap-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-xs font-bold text-primary">{String(index + 1).padStart(2, "0")}</span>
                <div><h2 className="text-xl font-semibold tracking-tight">{section.title}</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">{section.body}</p></div>
              </div>
            </section>)}
          </div>
          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-primary/20 bg-primary/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-primary" /><p className="text-sm leading-6 text-muted-foreground">{note || "Questions about this policy? Our support team is happy to help."}</p></div>
            <Link href="/contact" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-primary hover:underline">Contact support <ArrowRight size={15} /></Link>
          </div>
          <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"><Mail size={13} /> mynmss3@gmail.com</p>
        </article>
      </div>
    </main>
  );
}
