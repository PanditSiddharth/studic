"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, BookOpen, LoaderCircle, X } from "lucide-react";
import { getCourses } from "@/server-functions/course";

type BuddyCourse = {
  title: string;
  slug: string;
  description?: string;
};

type BuddyKind = "course" | "product" | "article";

function isBuddyKind(value: string | undefined): value is BuddyKind {
  return value === "course" || value === "product" || value === "article";
}

function courseSummary(description?: string) {
  const clean = String(description || "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*_>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return clean.length > 72 ? `${clean.slice(0, 69).trimEnd()}…` : clean;
}

export default function StudyBuddy() {
  const pathname = usePathname();
  const router = useRouter();
  const isRoamingPage = pathname === "/" || pathname === "/courses" || pathname === "/products" || pathname === "/blogs";
  const [open, setOpen] = useState(false);
  const [courses, setCourses] = useState<BuddyCourse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  useEffect(() => {
    if (!isRoamingPage) return;

    const handleCardClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;
      const item = event.target.closest<HTMLElement>("[data-study-buddy-item]");
      if (!item) return;
      const href = item.dataset.studyBuddyHref;
      if (!href || !href.startsWith("/") || href.startsWith("//") || !isBuddyKind(item.dataset.studyBuddyKind)) return;
      if (event.target.closest("a, button, input, select, textarea, [role='button']")) return;

      event.preventDefault();
      event.stopPropagation();
      router.push(href);
    };

    document.addEventListener("click", handleCardClick, true);
    return () => document.removeEventListener("click", handleCardClick, true);
  }, [isRoamingPage, router]);

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/chat")
  ) return null;

  const loadCourses = async () => {
    if (courses !== null || loading) return;
    setLoading(true);
    setLoadError(false);
    try {
      const result = await getCourses({ skip: 0, postsPerPage: 2 });
      if ("error" in result) {
        console.error("Study Buddy could not load course picks", result.error);
        setLoadError(true);
        return;
      }
      setCourses(result.courses.map(({ title, slug, description }) => ({ title, slug, description })));
    } catch (error) {
      console.error("Study Buddy could not load course picks", error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const toggleBuddy = () => {
    if (!open) void loadCourses();
    setOpen((current) => !current);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-3">
      {open ? (
        <section
          id="study-buddy-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="study-buddy-title"
          className="max-h-[min(48dvh,22rem)] w-[min(19rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border bg-popover p-4 text-popover-foreground shadow-2xl shadow-black/15"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BookOpen size={20} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="study-buddy-title" className="text-sm font-semibold">Hi, I’m your Study Buddy</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Find a learning path for your next step.</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close Study Buddy"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-4 space-y-2" aria-live="polite">
            {loading ? (
              <p className="flex items-center gap-2 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
                <LoaderCircle size={14} className="animate-spin" /> Finding a few courses…
              </p>
            ) : null}
            {loadError ? (
              <div className="rounded-xl bg-muted/60 p-3 text-xs">
                <p className="text-muted-foreground">Course picks could not load right now.</p>
                <button type="button" onClick={() => void loadCourses()} className="mt-2 font-medium text-primary hover:underline">
                  Try again
                </button>
              </div>
            ) : null}
            {courses?.length ? courses.map((course) => (
              <Link
                key={course.slug}
                href={`/course/${course.slug}`}
                onClick={() => setOpen(false)}
                className="group block rounded-xl border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="line-clamp-1 text-xs font-semibold group-hover:text-primary">{course.title}</span>
                  <ArrowRight size={14} className="mt-0.5 shrink-0 text-muted-foreground group-hover:text-primary" />
                </span>
                <span className="mt-1 line-clamp-2 block text-[11px] leading-4 text-muted-foreground">
                  {courseSummary(course.description) || "A focused course to help you take your next learning step."}
                </span>
              </Link>
            )) : null}
            {courses && courses.length === 0 ? (
              <p className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
                New course picks are on the way. Browse all courses to find your next topic.
              </p>
            ) : null}
          </div>

          <Link
            href="/courses"
            onClick={() => setOpen(false)}
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Browse all courses <ArrowRight size={13} />
          </Link>
        </section>
      ) : null}

      <button
        type="button"
        onClick={toggleBuddy}
        aria-label="Toggle Study Buddy"
        aria-controls="study-buddy-panel"
        aria-expanded={open}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <BookOpen size={20} aria-hidden="true" />
      </button>
    </div>
  );
}
