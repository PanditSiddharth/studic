"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { useTheme } from "next-themes";
import { toast } from "react-toastify";
import {
  ArrowLeft, ArrowRight, BadgeCheck, CheckCircle2, Loader2, Lock,
  ShieldCheck, Sparkles,
} from "lucide-react";
import rehypeHighlight from "rehype-highlight";
import { Button } from "@/components/ui/button";
import { getCourseLesson } from "@/server-functions/course";
import { getBlogs } from "@/server-functions/blog";
import { getMyArticleContribution } from "@/server-functions/contribution";
import SuggestEditDialog from "@/components/blog/suggest-edit-dialog";
import ArticleContributorsCard, { ContributorLine } from "@/components/blog/article-contributors";
import { startCheckout } from "@/server-functions/library";
import { openRazorpayCheckout } from "@/lib/razorpay-checkout";
import { formatPrice } from "@/components/product/product-card";
import { cleanArticleContent } from "@/modals/utils";
import type { IBlog } from "@/modals/blog.model";
import type { ICourse } from "@/modals/course.model";
import "@/components/themes/codetheme.css";

type TocItem = { id: string; title: string; level: number };
type Suggestion = { _id?: string; title?: string; slug?: string; thumbnail?: string; description?: string };
type Suggestions = { course?: Suggestion; blogs: Suggestion[] };
type Access = {
  signedIn: boolean;
  owned: boolean;
  enrolled: boolean;
  orderStatus: string | null;
  orderId: string | null;
  progressPercent: number;
};
type LessonSummary = { _id?: string; title?: string; slug?: string; thumbnail?: string; description?: string; contributors?: { _id?: string; name?: string; username?: string; image?: string }[] };

function createSlug(title: string) {
  return title.toLowerCase().trim().replace(/[`*_~]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s+/g, "-");
}

function extractHeadings(markdown: string): TocItem[] {
  const used = new Map<string, number>();
  let inCodeBlock = false;
  return markdown.split("\n").flatMap((line) => {
    if (/^\s*```/.test(line)) { inCodeBlock = !inCodeBlock; return []; }
    if (inCodeBlock) return [];
    const match = line.match(/^(#{1,3})\s+(.+?)\s*#*\s*$/);
    if (!match) return [];
    const title = match[2].replace(/\*\*(.*?)\*\*/g, "$1").replace(/[*_`~]/g, "").trim();
    const base = createSlug(title) || "section";
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    return [{ id: count ? `${base}-${count}` : base, title, level: match[1].length }];
  });
}

export default function CourseLesson({
  params: paramsPromise,
  initialResult,
}: {
  params: { slug: string; blog: string };
  initialResult: Exclude<Awaited<ReturnType<typeof getCourseLesson>>, { error: string }>;
}) {
  const { theme, systemTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const params = paramsPromise;
  const blog = (initialResult.blog as Partial<IBlog>) ?? null;
  const course: Partial<ICourse> | null = initialResult.course;
  const lesson: LessonSummary | null = initialResult.lesson;
  const [access, setAccess] = useState<Access | null>(initialResult.access as Access);
  const locked = Boolean(initialResult.locked);
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestions>({ blogs: [] });
  const [myContribution, setMyContribution] = useState<{ status?: string; submittedAt?: string | Date; reviewComment?: string } | null>(null);
  const currentTheme = ["dark", "blue"].includes(
    (theme === "system" ? systemTheme : theme) as string
  ) ? "dark" : "light";

  const courseSlug = params?.slug as string | undefined;
  const lessonSlug = params?.blog as string | undefined;

  useEffect(() => {
    if (!initialResult.locked && initialResult.lesson?._id) {
      let cancelled = false;
      getMyArticleContribution(String(initialResult.lesson._id))
        .then((mine) => { if (!cancelled) setMyContribution(mine); })
        .catch(() => { /* the edit button still works without this */ });
      return () => { cancelled = true; };
    }
  }, [courseSlug, lessonSlug, initialResult]);

  useEffect(() => {
    if (!blog?.slug) return;
    let cancelled = false;
    const loadSuggestions = async () => {
      try {
        const blogResult = await getBlogs({
          skip: 0,
          postsPerPage: 8,
          publicOnly: true,
          search: blog.tags?.[0] || blog.category?.[0] || blog.title?.split(" ")[0] || "",
        });
        if (cancelled) return;
        const allBlogs = blogResult && !("error" in blogResult) ? (blogResult as any).blogs || [] : [];
        const related = allBlogs
          .filter((item: Suggestion) => item.slug && item.slug !== blog.slug)
          .slice(0, 4);
        setSuggestions({ course: course?.slug ? (course as Suggestion) : undefined, blogs: related });
      } catch {
        if (!cancelled) setSuggestions({ blogs: [] });
      }
    };
    void loadSuggestions();
    return () => { cancelled = true; };
  }, [blog?.slug, blog?.tags, blog?.category, blog?.title, course]);

  const headings = useMemo(() => extractHeadings(blog?.content ?? ""), [blog?.content]);
  const courseLessons = useMemo(
    () => (Array.isArray(course?.content) ? course.content : []) as LessonSummary[],
    [course]
  );
  const currentLessonIndex = courseLessons.findIndex(
    (item) => item.slug === lesson?.slug || String(item._id) === String(lesson?._id)
  );
  const previousLesson = currentLessonIndex > 0 ? courseLessons[currentLessonIndex - 1] : undefined;
  const nextLesson = currentLessonIndex >= 0 ? courseLessons[currentLessonIndex + 1] : undefined;

  useEffect(() => {
    const root = document.querySelector("[data-blog-article]");
    if (!root) return;
    const renderedHeadings = Array.from(root.querySelectorAll("h1, h2, h3"));
    renderedHeadings.forEach((heading, index) => {
      const item = headings[index];
      if (item) heading.id = item.id;
    });
  }, [headings, blog?.content]);

  const buyCourse = useCallback(async () => {
    if (!course?._id) return;
    if (!access?.signedIn) {
      router.push(`/auth?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    setBusy(true);
    try {
      if (course.accessType === "free" || !Number(course.price)) {
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
          toast.success("You are enrolled. Enjoy the course!");
          window.location.reload();
        } else if (result.status === "pending") {
          toast.info(result.message || "Order saved and awaiting confirmation.");
          setAccess((current) => current ? { ...current, orderStatus: "pending", orderId: result.orderId || current.orderId } : current);
        }
        return;
      }

      const paid = await openRazorpayCheckout("course", String(course._id));
      if (paid) {
        toast.success("Payment confirmed. Enjoy the course!");
        window.location.reload();
      } else {
        toast.info("Payment was cancelled.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start checkout.");
    } finally {
      setBusy(false);
    }
  }, [access?.signedIn, course, pathname, router]);

  if (locked && course) {
    const lessonCount = Array.isArray(course.content) ? course.content.length : 0;
    const pending = access?.orderStatus === "pending";
    const courseIsFree = course.accessType === "free" || !Number(course.price);
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <Link href={`/course/${course.slug}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft size={14} /> Back to course
        </Link>

        <div className="mt-4 overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="relative aspect-video bg-muted">
            {course.thumbnail ? (
              <Image src={course.thumbnail} alt="" fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
            ) : null}
            <div className="absolute inset-0 bg-black/55" />
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-white/15 backdrop-blur">
                <Lock size={24} />
              </span>
              <p className="mt-3 text-sm font-medium">This lesson is locked</p>
              {lesson?.title && <p className="mt-1 max-w-md text-xs text-white/75">{lesson.title}</p>}
            </div>
          </div>

          <div className="p-5 sm:p-7">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              <Sparkles size={12} /> Course
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{course.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {lesson?.title ? `“${lesson.title}” is part of this course. ` : ""}
              {courseIsFree
                ? `Enroll for free to unlock all ${lessonCount} lesson${lessonCount === 1 ? "" : "s"}, track your progress and keep it in your library.`
                : `Purchase the course to unlock all ${lessonCount} lesson${lessonCount === 1 ? "" : "s"}, track your progress and keep it in your library.`}
            </p>

            <div className="mt-5 flex flex-col gap-4 rounded-xl border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Full course access</p>
                <p className="mt-0.5 text-2xl font-semibold">{courseIsFree ? "Free" : formatPrice(course.price, course.currency)}</p>
              </div>
              <div className="flex flex-col gap-2 sm:min-w-[230px]">
                <Button onClick={buyCourse} disabled={busy || (pending && courseIsFree)} className="gap-2">
                  {busy ? <Loader2 size={16} className="animate-spin" /> : pending ? <BadgeCheck size={16} /> : <ShieldCheck size={16} />}
                  {pending ? (courseIsFree ? "Awaiting confirmation" : "Pay now") : !access?.signedIn ? (courseIsFree ? "Sign in to enroll" : "Sign in to buy") : courseIsFree ? "Enroll for free" : "Buy course"}
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/course/${course.slug}`}>View course details</Link>
                </Button>
              </div>
            </div>

            {pending && (
              <p className="mt-3 text-center text-[11px] leading-4 text-muted-foreground">
                Previous order <span className="font-medium text-foreground">{access?.orderId}</span> is still pending.
              </p>
            )}
            {!access?.signedIn && (
              <p className="mt-3 text-center text-[11px] text-muted-foreground">Sign in first — you will return to this lesson afterwards.</p>
            )}

            <ul className="mt-6 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              {[
                `Every lesson in the course (${lessonCount})`,
                "Progress saved to your library",
                "Lifetime access from any device",
                "No repeated purchases",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (!blog) return <div className="fixed inset-0 flex items-center justify-center">Not Found</div>;

  return (
    <div data-color-mode={currentTheme} className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-5 px-3 py-5 sm:px-5 lg:grid-cols-[190px_minmax(0,1fr)_230px] lg:gap-5 xl:grid-cols-[205px_minmax(0,1fr)_250px]">
      {headings.length > 0 && (
        <aside className="hidden lg:block min-w-0">
          <nav aria-label="On this page" className="hide-scrollbar sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto border-r border-border pr-3">
            <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">On this page</p>
            <ul className="space-y-1">
              {headings.map((heading) => (
                <li key={heading.id} style={{ paddingLeft: (heading.level - 1) * 9 }}>
                  <a href={`#${heading.id}`} className="block rounded-md px-2 py-1.5 text-[13px] leading-[1.35rem] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                    {heading.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      )}

      <main className="min-w-0">
        {lesson?._id ? (
          <div className="mb-2 flex max-w-4xl mx-auto items-center px-1">
            <ContributorLine contributors={lesson.contributors} />
          </div>
        ) : null}
        <MarkdownPreview
          data-blog-article=""
          data-color-mode={currentTheme}
          style={{
            backgroundColor: "transparent",
            color: "inherit",
            fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
          rehypePlugins={[rehypeHighlight]}
          className="mx-auto w-full max-w-4xl rounded-xl p-3 sm:p-5 [&_*]:!border-border [&_h1]:!text-2xl sm:[&_h1]:!text-3xl [&_h1]:!leading-tight [&_h1]:!font-bold [&_h2]:!text-xl sm:[&_h2]:!text-2xl [&_h2]:!leading-snug [&_h2]:!font-semibold [&_h3]:!text-lg [&_h3]:!font-semibold [&_p]:!text-sm sm:[&_p]:!text-base [&_p]:!leading-7 [&_li]:!text-sm sm:[&_li]:!text-base [&_li]:!leading-7 [&_blockquote]:!text-sm [&_blockquote]:!leading-6 [&_blockquote]:!border-l-border [&_blockquote]:!text-muted-foreground [&_pre_code]:!bg-transparent [&_pre_code]:!text-inherit [&_code:not(pre_code)]:!bg-muted [&_code:not(pre_code)]:!text-foreground"
          source={cleanArticleContent(blog.content)}
        />

        {lesson?._id ? (
          <div className="mt-6 flex justify-center text-center">
            <SuggestEditDialog
              blogId={String(lesson._id)}
              title={lesson.title}
              content={blog?.content}
              contribution={myContribution}
              onSubmitted={() => getMyArticleContribution(String(lesson._id)).then((mine) => setMyContribution(mine))}
            />
          </div>
        ) : null}

        {(previousLesson || nextLesson) && (
          <nav aria-label="Course lesson navigation" className="mx-auto mt-8 flex w-full max-w-4xl items-stretch justify-between gap-3 border-t border-border pt-6">
            {previousLesson?.slug ? (
              <Button asChild variant="outline" className="h-auto min-w-0 flex-1 justify-start px-3 py-3 text-left sm:px-4">
                <Link href={`/course/${courseSlug}/${previousLesson.slug}`}>
                  <ArrowLeft />
                  <span className="min-w-0">
                    <span className="block text-[11px] text-muted-foreground">Previous lesson</span>
                    <span className="block truncate text-sm">{previousLesson.title}</span>
                  </span>
                </Link>
              </Button>
            ) : <div className="flex-1" />}
            {nextLesson?.slug ? (
              <Button asChild variant="outline" className="h-auto min-w-0 flex-1 justify-end px-3 py-3 text-right sm:px-4">
                <Link href={`/course/${courseSlug}/${nextLesson.slug}`}>
                  <span className="min-w-0">
                    <span className="block text-[11px] text-muted-foreground">Next lesson</span>
                    <span className="block truncate text-sm">{nextLesson.title}</span>
                  </span>
                  <ArrowRight />
                </Link>
              </Button>
            ) : <div className="flex-1" />}
          </nav>
        )}
      </main>

      <aside className="hidden lg:block min-w-0">
        <div className="hide-scrollbar sticky top-24 max-h-[calc(100vh-7rem)] space-y-5 overflow-y-auto pl-1">
          <ArticleContributorsCard contributors={lesson?.contributors} />
          {suggestions.course && (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Related course</h2>
              <Link href={`/course/${suggestions.course.slug}`} className="group block overflow-hidden rounded-lg border border-border transition-colors hover:bg-muted/60">
                {suggestions.course.thumbnail && <Image src={suggestions.course.thumbnail} alt="" width={640} height={360} sizes="(max-width: 1024px) 100vw, 320px" className="aspect-video w-full object-cover" />}
                <div className="p-3">
                  <p className="text-sm font-medium leading-5 group-hover:underline">{suggestions.course.title}</p>
                  {suggestions.course.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{suggestions.course.description}</p>}
                </div>
              </Link>
            </section>
          )}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Related articles</h2>
            {suggestions.blogs.length ? (
              <ul className="space-y-3">
                {suggestions.blogs.map((item) => (
                  <li key={item._id || item.slug}>
                    <Link href={`/t/${item.slug}`} className="group flex gap-2.5 rounded-lg p-1 transition-colors hover:bg-muted/60">
                      {item.thumbnail && <Image src={item.thumbnail} alt="" width={64} height={56} sizes="64px" className="h-14 w-16 shrink-0 rounded-md object-cover" />}
                      <span className="min-w-0">
                        <span className="block text-[13px] font-medium leading-5 group-hover:underline">{item.title}</span>
                        {item.description && <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{item.description}</span>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs leading-5 text-muted-foreground">Related articles will appear here when available.</p>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}
