import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BookOpen, CheckCircle2, GraduationCap, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "About Studic | Practical Online Learning",
  description: "Discover Studic, an affordable online learning platform for practical courses, articles and digital educational resources.",
  keywords: ["Studic", "online learning", "IGNOU study material", "coding courses", "digital educational products"],
  alternates: { canonical: "/about" },
  openGraph: { title: "About Studic", description: "Practical, affordable learning for students and curious builders.", url: "/about", type: "website" },
};

const pillars = [
  { icon: GraduationCap, title: "Learn with clarity", text: "Understand concepts through focused lessons, practical examples and useful study resources." },
  { icon: BookOpen, title: "Build useful skills", text: "Explore coding, academic topics and digital resources designed for real learning goals." },
  { icon: Sparkles, title: "Keep it accessible", text: "We aim to make quality educational content approachable and affordable for every learner." },
];

export default function About() {
  return <main className="min-h-screen bg-muted/20">
    <section className="border-b bg-card"><div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24"><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">About Studic</p><h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">A simpler way to learn, practice and move forward.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">Studic is an online learning platform for courses, articles and digital educational products. We create practical resources that help learners study with more confidence.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/courses" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/15">Explore courses <ArrowRight size={16}/></Link><Link href="/contact" className="rounded-xl border bg-background px-5 py-3 text-sm font-medium hover:bg-muted">Talk to us</Link></div></div></section>
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-20"><div className="grid gap-5 md:grid-cols-3">{pillars.map(({ icon: Icon, title, text }, index) => <article key={title} className="group relative overflow-hidden rounded-3xl border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"><span className="absolute right-5 top-5 text-5xl font-bold text-muted/50">0{index + 1}</span><span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon size={21}/></span><h2 className="relative mt-5 text-lg font-semibold">{title}</h2><p className="relative mt-2 text-sm leading-6 text-muted-foreground">{text}</p></article>)}</div><div className="relative mt-8 overflow-hidden rounded-3xl border bg-card p-6 shadow-sm sm:p-10 lg:grid lg:grid-cols-[1fr_.8fr]"><div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" /><div className="relative"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Our approach</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">Learning should feel useful, not overwhelming.</h2><p className="mt-4 leading-7 text-muted-foreground">Studic brings together structured courses, explanatory articles and downloadable resources in one place. Whether you are strengthening academic foundations or learning a technical skill, our goal is to help you take the next clear step.</p></div><ul className="relative mt-8 space-y-4 lg:mt-0">{["Practical explanations over unnecessary complexity", "Resources made for independent learners", "A growing community and responsive support"].map((item) => <li key={item} className="flex gap-3 text-sm"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-primary"/><span>{item}</span></li>)}</ul></div></section>
  </main>;
}
