"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, GraduationCap, Loader2, Search, Sparkles } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CourseTile from "@/components/course/course-tile";
import { getCourses } from "@/server-functions/course";
import type { ICourse } from "@/modals/course.model";
import { cn } from "@/modals/utils";

const PAGE_SIZE = 9;

const levels = [
  { value: "all", label: "All levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const accessFilters = [
  { value: "all", label: "All courses" },
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
] as const;

function Skeleton() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="aspect-video animate-pulse bg-muted" />
      <div className="space-y-2 p-4">
        <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
        <div className="h-3 w-3/5 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-7 w-1/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

export default function CoursesBrowser() {
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [level, setLevel] = useState("all");
  const [access, setAccess] = useState<(typeof accessFilters)[number]["value"]>("all");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setActiveSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getCourses({
      skip: 0,
      postsPerPage: PAGE_SIZE,
      search: activeSearch,
      level,
      accessType: access === "all" ? undefined : access,
    })
      .then((result) => {
        if (cancelled) return;
        if ("error" in result) {
          toast.error(result.error);
          setCourses([]);
          setTotal(0);
          return;
        }
        setCourses(result.courses ?? []);
        setTotal(result.totalCourses ?? 0);
      })
      .catch(() => { if (!cancelled) toast.error("Courses could not be loaded."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeSearch, level, access]);

  const loadMore = useCallback(async () => {
    if (loadingMore || courses.length >= total) return;
    setLoadingMore(true);
    try {
      const result = await getCourses({
        skip: courses.length,
        postsPerPage: PAGE_SIZE,
        search: activeSearch,
        level,
        accessType: access === "all" ? undefined : access,
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setCourses((current) => {
        const seen = new Set(current.map((course) => String(course._id || course.slug)));
        return [...current, ...result.courses.filter((course) => !seen.has(String(course._id || course.slug)))];
      });
      setTotal(result.totalCourses ?? total);
    } finally {
      setLoadingMore(false);
    }
  }, [access, activeSearch, courses.length, level, loadingMore, total]);

  const filtersActive = Boolean(activeSearch) || level !== "all" || access !== "all";

  return (
    <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-sky-500/10 p-7 sm:p-10">
        <div className="absolute -left-20 -top-24 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              <Sparkles size={13} /> Course library
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Learn in structured courses, not scattered tabs</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              Every course is a curated path through articles. Follow one from start to finish and keep your progress in your library.
            </p>

            <div className="relative mt-6 max-w-lg">
              <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search courses, topics or tags..."
                className="h-12 rounded-xl pl-10"
                aria-label="Search courses"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center lg:min-w-[280px]">
            <div className="rounded-2xl border bg-background/70 px-3 py-4 backdrop-blur">
              <p className="text-2xl font-semibold">{loading ? "—" : total}</p>
              <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">Courses</p>
            </div>
            <div className="rounded-2xl border bg-background/70 px-3 py-4 backdrop-blur">
              <p className="text-2xl font-semibold">{courses.reduce((sum, course) => sum + (Array.isArray(course.content) ? course.content.length : 0), 0)}</p>
              <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">Lessons</p>
            </div>
            <div className="rounded-2xl border bg-background/70 px-3 py-4 backdrop-blur">
              <p className="text-2xl font-semibold">{courses.filter((course) => course.accessType === "free" || !Number(course.price)).length}</p>
              <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">Free</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-7 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {accessFilters.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setAccess(option.value)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                access === option.value ? "border-primary/40 bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
              )}
            >
              {option.label}
            </button>
          ))}
          <span className="mx-1 hidden h-4 w-px bg-border sm:block" />
          {levels.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setLevel(option.value)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                level === option.value ? "border-primary/40 bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
              )}
            >
              {option.label}
            </button>
          ))}
          {filtersActive && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => { setSearch(""); setLevel("all"); setAccess("all"); }}
            >
              Reset filters
            </Button>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            {activeSearch ? `Results for “${activeSearch}”` : "Browse courses"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading ? "Loading the catalogue…" : `${total} course${total === 1 ? "" : "s"} available`}
          </p>
        </div>
        <Link href="/products" className="hidden text-sm font-medium text-primary hover:underline sm:inline-flex">
          Looking for downloads? Browse products →
        </Link>
      </div>

      {loading ? (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} />)}
        </div>
      ) : courses.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed bg-muted/20 px-6 py-14 text-center">
          <GraduationCap size={28} className="mx-auto text-muted-foreground" />
          <p className="mt-3 font-medium">No courses match those filters</p>
          <p className="mt-1 text-sm text-muted-foreground">Try another keyword, level or price filter.</p>
          {filtersActive && (
            <Button variant="outline" className="mt-4" onClick={() => { setSearch(""); setLevel("all"); setAccess("all"); }}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => <CourseTile key={String(course._id || course.slug)} course={course} />)}
          </div>

          {courses.length < total && (
            <div className="mt-8 flex justify-center">
              <Button variant="outline" className="gap-2" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? <Loader2 size={15} className="animate-spin" /> : <BookOpen size={15} />}
                Load more courses
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
