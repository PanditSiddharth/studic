"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  ArrowLeft, BadgeCheck, BookOpen, ChevronRight, Clock3, Download, Globe2,
  Layers, Loader2, Lock, Package, PlayCircle, ShieldCheck, Sparkles,
} from "lucide-react";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import { getCourse } from "@/server-functions/course";
import { getItemAccess, startCheckout } from "@/server-functions/library";
import type { ICourse } from "@/modals/course.model";
import { formatPrice } from "@/components/product/product-card";
import { cn } from "@/modals/utils";

type Access = { signedIn: boolean; owned: boolean; enrolled: boolean; orderStatus: string | null; orderId: string | null; progressPercent: number };

const levelLabels: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  "all-levels": "All levels",
};

export default function CourseDetail({ slug }: { slug: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [course, setCourse] = useState<Partial<ICourse> | null>(null);
  const [access, setAccess] = useState<Access | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const result = await getCourse({ slug, blogs: true, products: true });
    if ("error" in result) {
      setError(result.error);
      setCourse(null);
      return;
    }
    setCourse(result);
    setError(null);
    if (result._id) {
      const state = await getItemAccess({ courseId: String(result._id) });
      setAccess(state);
    }
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load()
      .catch(() => { if (!cancelled) setError("This course could not be loaded."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [load]);

  const enroll = async () => {
    if (!course?._id) return;
    if (!access?.signedIn) {
      router.push(`/auth?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    setBusy(true);
    try {
      const result = await startCheckout({ courseId: String(course._id) });
      if (result.error) {
        if (result.requiresAuth) {
          router.push(`/auth?callbackUrl=${encodeURIComponent(pathname)}`);
          return;
        }
        toast.error(result.error);
        return;
      }
      if (result.status === "granted") {
        toast.success(result.free ? "You are enrolled — start with the first lesson." : "Payment confirmed. Enjoy the course!");
      } else if (result.status === "pending") {
        toast.info(result.message || "Order saved and pending confirmation.");
      }
      await load();
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loader />;

  if (error || !course) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center px-4 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground"><BookOpen size={22} /></span>
        <h1 className="mt-4 text-xl font-semibold">Course unavailable</h1>
        <p className="mt-1 text-sm text-muted-foreground">{error || "This course may have been unpublished."}</p>
        <Button asChild variant="outline" className="mt-5"><Link href="/courses"><ArrowLeft size={15} /> All courses</Link></Button>
      </div>
    );
  }

  const lessons = (Array.isArray(course.content) ? course.content : []) as any[];
  const bundledProducts = (Array.isArray(course.products) ? course.products : []).filter(
    (product: any) => product && typeof product === "object" && product.slug
  ) as any[];
  const isFree = course.accessType === "free" || !Number(course.price);
  const minutes = Number(course.estimatedMinutes || 0);
  const duration = minutes >= 60 ? `${Math.round(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ""}` : minutes ? `${minutes}m` : null;
  const owned = Boolean(access?.owned);
  const pending = access?.orderStatus === "pending";
  const needsPurchase = !isFree && !owned;
  const openPurchase = () => {
    document.getElementById("course-access")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/courses" className="hover:text-foreground">Courses</Link>
        <span>/</span>
        <span className="line-clamp-1 max-w-[60vw] text-foreground">{course.title}</span>
      </nav>

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start">
        <aside className="overflow-hidden rounded-2xl border bg-card lg:sticky lg:top-20">
          <div className="relative aspect-video bg-muted">
            {course.thumbnail ? (
              <Image src={course.thumbnail} alt={course.title || "Course cover"} fill sizes="(max-width: 1024px) 100vw, 380px" className="object-cover" priority />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground"><BookOpen size={30} /></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-white">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/70">Course</p>
              <h1 className="mt-1 line-clamp-2 text-lg font-semibold leading-6">{course.title}</h1>
            </div>
            {owned && (
              <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[11px] font-semibold text-white">
                <BadgeCheck size={12} /> Enrolled
              </span>
            )}
          </div>

          <div className="space-y-4 p-5">
            {course.description && <p className="text-sm leading-6 text-muted-foreground">{course.description}</p>}

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border bg-muted/30 px-3 py-2">
                <p className="text-muted-foreground">Lessons</p>
                <p className="mt-0.5 font-medium">{lessons.length}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 px-3 py-2">
                <p className="text-muted-foreground">Level</p>
                <p className="mt-0.5 font-medium">{course.level ? levelLabels[course.level] || course.level : "All levels"}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 px-3 py-2">
                <p className="text-muted-foreground">Duration</p>
                <p className="mt-0.5 flex items-center gap-1 font-medium">{duration ? <><Clock3 size={12} /> {duration}</> : "Self paced"}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 px-3 py-2">
                <p className="text-muted-foreground">Language</p>
                <p className="mt-0.5 flex items-center gap-1 font-medium"><Globe2 size={12} /> {course.language || "English"}</p>
              </div>
            </div>

            <div className="border-t pt-4" id="course-access">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Access</p>
                  <p className="mt-0.5 text-xl font-semibold">{isFree ? "Free" : formatPrice(course.price, course.currency)}</p>
                </div>
                {pending && !owned && (
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">Order pending</span>
                )}
              </div>

              <div className="mt-3">
                {owned ? (
                  <Button asChild className="w-full gap-2">
                    <a href="#course-content"><PlayCircle size={16} /> Continue course</a>
                  </Button>
                ) : (
                  <Button className="w-full gap-2" onClick={enroll} disabled={busy || pending}>
                    {busy ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                    {isFree ? "Enroll for free" : pending ? "Awaiting confirmation" : "Buy course"}
                  </Button>
                )}
              </div>

              {!access?.signedIn && (
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  {isFree ? "Sign in to enroll in this course." : "Sign in to purchase this course."}
                </p>
              )}
              {needsPurchase && access?.signedIn && !pending && (
                <p className="mt-2 text-center text-[11px] leading-4 text-muted-foreground">
                  All {lessons.length} lesson{lessons.length === 1 ? "" : "s"} unlock after purchase.
                </p>
              )}
              {pending && !owned && (
                <p className="mt-2 text-center text-[11px] leading-4 text-muted-foreground">
                  Order <span className="font-medium text-foreground">{access?.orderId}</span> is waiting for confirmation.
                </p>
              )}
              {owned && access?.progressPercent ? (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Progress</span><span>{access.progressPercent}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${access.progressPercent}%` }} />
                  </div>
                </div>
              ) : null}
            </div>

            {course.tags?.length ? (
              <div className="flex flex-wrap gap-1.5 border-t pt-4">
                {course.tags.slice(0, 6).map((tag) => (
                  <span key={tag} className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">{tag}</span>
                ))}
              </div>
            ) : null}
          </div>
        </aside>

        <section id="course-content" className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                <Sparkles size={12} /> Course
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">Course content</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {lessons.length} lesson{lessons.length === 1 ? "" : "s"} in order — follow them at your own pace.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground">
              <Layers size={12} /> {lessons.length} lessons
            </span>
          </div>

          {lessons.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed bg-muted/20 px-6 py-12 text-center">
              <BookOpen size={24} className="mx-auto text-muted-foreground" />
              <p className="mt-3 font-medium">Lessons are on the way</p>
              <p className="mt-1 text-sm text-muted-foreground">This course is still being assembled.</p>
            </div>
          ) : (
            <ol className="mt-4 space-y-2">
              {lessons.map((lesson, index) => {
                const lessonIsPaid = lesson?.accessType === "paid" || lesson?.status === "paid" || Number(lesson?.price) > 0;
                const lessonLocked = needsPurchase || (lessonIsPaid && !owned);
                const rowClassName = cn(
                  "group flex w-full items-stretch gap-3 rounded-xl border bg-card p-2.5 text-left transition-colors hover:border-primary/30 hover:bg-muted/40",
                  index === 0 && !lessonLocked && "border-primary/20",
                  lessonLocked && "hover:border-primary/30"
                );
                const rowContent = (
                  <>
                    <span className="flex w-7 shrink-0 items-center justify-center text-xs font-medium text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg bg-muted sm:w-36">
                      {lesson?.thumbnail ? (
                        <Image src={lesson.thumbnail} alt={lesson.title || ""} fill sizes="144px" className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground"><PlayCircle size={18} /></div>
                      )}
                      {lessonLocked ? (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-white">
                          <Lock size={18} />
                        </span>
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
                          <PlayCircle size={22} />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 py-0.5">
                      <p className="line-clamp-2 text-sm font-medium leading-5 group-hover:text-primary">{lesson?.title || "Untitled lesson"}</p>
                      {lesson?.description && <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{lesson.description}</p>}
                      <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        {lessonLocked ? <><Lock size={10} /> {lessonIsPaid && !needsPurchase ? "Paid article" : "Unlock with purchase"}</> : index === 0 ? "Start here" : "Lesson"} <ChevronRight size={11} />
                      </p>
                    </div>
                  </>
                );

                return (
                  <li key={String(lesson?._id || index)}>
                    {lessonLocked ? (
                      <button type="button" onClick={openPurchase} className={rowClassName}>
                        {rowContent}
                      </button>
                    ) : (
                      <Link href={`/course/${course.slug}/${lesson.slug}`} className={rowClassName}>
                        {rowContent}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          )}

          {needsPurchase && lessons.length > 0 && (
            <div className="mt-5 flex items-start gap-2 rounded-xl border border-dashed bg-muted/20 px-4 py-3 text-xs leading-5 text-muted-foreground">
              <Lock size={14} className="mt-0.5 shrink-0" />
              <p>Purchase this course to unlock all {lessons.length} lesson{lessons.length === 1 ? "" : "s"} and keep it in your library.</p>
            </div>
          )}
          {!needsPurchase && !owned && lessons.length > 0 && (
            <div className="mt-5 flex items-start gap-2 rounded-xl border border-dashed bg-muted/20 px-4 py-3 text-xs leading-5 text-muted-foreground">
              <Lock size={14} className="mt-0.5 shrink-0" />
              <p>Enroll to track your progress through every lesson and keep this course in your library.</p>
            </div>
          )}

          {bundledProducts.length > 0 && (
            <div className="mt-10 border-t pt-7">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                    <Package size={12} /> Included downloads
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight">Resources bundled with this course</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Free files are open to everyone. Paid files unlock with enrollment or can be bought separately.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground">
                  <Package size={12} /> {bundledProducts.length} resource{bundledProducts.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {bundledProducts.map((product) => {
                  const productIsFree = !Number(product.price);
                  const canDownload = Boolean(owned) && Boolean(product._id);
                  return (
                    <div key={String(product._id || product.slug)} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                      <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {product.thumbnail ? (
                          <Image src={product.thumbnail} alt={product.title || ""} fill sizes="80px" className="object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted-foreground"><Package size={18} /></div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link href={`/product/${product.slug}`} className="line-clamp-2 text-sm font-medium hover:text-primary">
                          {product.title}
                        </Link>
                        <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                          {productIsFree ? (
                            <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 font-medium text-emerald-600 dark:text-emerald-400">Free</span>
                          ) : owned ? (
                            <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 font-medium text-emerald-600 dark:text-emerald-400">Included</span>
                          ) : (
                            <span>{formatPrice(product.price, product.currency)}</span>
                          )}
                          {product.fileName ? <span className="truncate">{product.fileName}</span> : null}
                        </p>
                      </div>
                      {canDownload ? (
                        <Button asChild size="sm" className="shrink-0 gap-1.5">
                          <a href={`/api/download/${product._id}`}><Download size={13} /> Download</a>
                        </Button>
                      ) : (
                        <Button asChild size="sm" variant="outline" className="shrink-0">
                          <Link href={`/product/${product.slug}`}>{productIsFree ? "Get free" : "Buy"}</Link>
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
