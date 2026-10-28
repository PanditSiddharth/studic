"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { useTheme } from "next-themes";
import rehypeHighlight from "rehype-highlight";
import {
  ArrowLeft, BadgeCheck, BookOpen, CheckCircle2, Lock, Package, Sparkles,
} from "lucide-react";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import { getBlog, type BlogAccessState, type BlogCourseSummary, type BlogResult } from "@/server-functions/blog";
import type { IProduct } from "@/modals/product.model";
import { cleanArticleContent, cn } from "@/modals/utils";
import "@/components/themes/codetheme.css";

type Params = { slug?: string[] };
type TocItem = { id: string; title: string; level: number };
type RelatedArticle = { _id?: string; title?: string; slug?: string; thumbnail?: string; description?: string };

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

const money = (price?: number, currency = "INR") =>
  !Number(price) ? "Free" : new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(price));

export default function BlogArticle({ params }: { params: Params }) {
  const { theme, systemTheme } = useTheme();
  const [blog, setBlog] = useState<BlogResult | null>(null);
  const [access, setAccess] = useState<BlogAccessState | null>(null);
  const [accessCourse, setAccessCourse] = useState<BlogCourseSummary | null>(null);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Articles are linked both as /t/<slug> and /t/<category>/<slug>.
  const segments = params?.slug || [];
  const category = segments.length > 1 ? segments[0] : undefined;
  const slug = segments.length > 1 ? segments[1] : segments[0];
  const colorMode = ["dark", "blue"].includes((theme === "system" ? systemTheme : theme) as string) ? "dark" : "light";

  useEffect(() => {
    let cancelled = false;
    if (!slug) {
      setError("This article could not be found");
      setLoading(false);
      return;
    }
    setLoading(true);
    getBlog({ slug, category, products: true })
      .then((result) => {
        if (cancelled) return;
        if ("error" in result) {
          setError(result.error);
          setBlog(null);
          setLocked(false);
          return;
        }
        setBlog(result);
        setLocked(Boolean(result.locked));
        setAccess(result.access || null);
        setAccessCourse(result.accessCourse || null);
        setError(null);
      })
      .catch(() => { if (!cancelled) setError("This article could not be loaded"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug, category]);

  const products = useMemo(() => {
    // Draft/archived products are already filtered out by getBlog's populate
    // match, so only guard against malformed references here.
    const list = (Array.isArray(blog?.products) ? blog?.products : []) as Partial<IProduct>[];
    return list.filter((product) => Boolean(product?.slug)).slice(0, 4);
  }, [blog?.products]);

  const articleContent = useMemo(
    () => cleanArticleContent(blog?.content, { title: blog?.title, thumbnail: blog?.thumbnail }),
    [blog?.content, blog?.title, blog?.thumbnail]
  );
  const headings = useMemo(() => extractHeadings(articleContent), [articleContent]);

  useEffect(() => {
    if (loading || !articleContent) return;
    const root = document.querySelector("[data-blog-article]");
    if (!root) return;
    Array.from(root.querySelectorAll("h1, h2, h3")).forEach((heading, index) => {
      const item = headings[index];
      if (item) heading.id = item.id;
    });
  }, [loading, headings, articleContent]);

  const relatedArticles = (blog?.relatedBlogs || []) as RelatedArticle[];

  if (loading) return <Loader />;

  if (error || !blog) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center px-4 text-center">
        <h1 className="text-xl font-semibold">Article unavailable</h1>
        <p className="mt-1 text-sm text-muted-foreground">{error || "This article may have been unpublished."}</p>
        <Button asChild variant="outline" className="mt-5"><Link href="/blogs"><ArrowLeft size={15} /> All articles</Link></Button>
      </div>
    );
  }

  return (
    <article className="mx-auto w-full max-w-[1600px] px-3 py-5 sm:px-5" data-color-mode={colorMode}>
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/blogs" className="hover:text-foreground">Articles</Link>
        <span>/</span>
        <span className="line-clamp-1 max-w-[70vw] text-foreground">{blog.title}</span>
      </nav>

      <div className="mt-4 grid w-full grid-cols-1 gap-5 lg:grid-cols-[190px_minmax(0,1fr)_230px] lg:gap-5 xl:grid-cols-[205px_minmax(0,1fr)_250px]">
        {headings.length > 0 ? (
          <aside className="hidden min-w-0 lg:block">
            <nav aria-label="On this page" className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto border-r border-border pr-3">
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
        ) : <div className="hidden lg:block" />}

        <main className="min-w-0">
        {locked ? (
        <section className="mx-auto mt-5 max-w-3xl overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="relative aspect-[16/7] bg-gradient-to-br from-primary/15 via-muted to-amber-500/10">
            {blog.thumbnail ? (
              <Image src={blog.thumbnail} alt="" fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover opacity-40 blur-[1px]" />
            ) : null}
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-background/80 backdrop-blur">
                <Lock size={24} />
              </span>
              <p className="mt-3 text-sm font-medium">This article is for paid readers</p>
              <p className="mt-1 max-w-md text-xs text-muted-foreground">
                Enroll in the course that includes this article to unlock it.
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 p-4">
              <div>
                <p className="text-xs text-muted-foreground">Article access</p>
                <p className="mt-0.5 text-2xl font-semibold">Course access</p>
              </div>
              {access?.owned ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <BadgeCheck size={13} /> Unlocked
                </span>
              ) : null}
            </div>

            <div className="mt-4">
              {accessCourse?.slug ? (
                <Button asChild className="h-11 w-full gap-2">
                  <Link href={`/course/${accessCourse.slug}`}>
                    <BookOpen size={16} /> Unlock with course
                  </Link>
                </Button>
              ) : (
                <p className="rounded-xl border border-dashed px-4 py-3 text-center text-sm text-muted-foreground">
                  This article is not available outside a course.
                </p>
              )}
            </div>

            {accessCourse?.slug ? (
              <Link href={`/course/${accessCourse.slug}`} className="mt-4 flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/40">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><BookOpen size={18} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] uppercase tracking-wider text-muted-foreground">Included in course</span>
                  <span className="block truncate text-sm font-medium">{accessCourse.title}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {accessCourse.accessType === "paid" && Number(accessCourse.price) > 0
                    ? money(accessCourse.price, accessCourse.currency)
                    : "Free to enroll"}
                </span>
              </Link>
            ) : null}

            <ul className="mt-5 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              {[
                "Full article and downloads",
                "Lifetime access from any device",
                "No separate article purchase",
                "Access is saved to your account",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : (
        <MarkdownPreview
          data-blog-article=""
          source={articleContent || "_This article is still being written._"}
          rehypePlugins={[rehypeHighlight]}
          style={{
            backgroundColor: colorMode === "dark" ? "rgba(0, 0, 0, 0.2)" : "rgba(255, 255, 255, 0.2)",
            fontFamily: "sans-serif",
          }}
          className="mx-auto mt-4 w-full max-w-4xl rounded-xl p-3 sm:p-5"
        />
      )}

      {products.length > 0 && (
        <section className="mt-10 border-t pt-8">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                <Sparkles size={12} /> Resources mentioned
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">Products related to this article</h2>
              <p className="mt-1 text-sm text-muted-foreground">Downloads and templates that pair with what you just read.</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1.5">
              <Link href="/products"><Package size={14} /> All products</Link>
            </Button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <Link
                key={String(product._id || product.slug)}
                href={`/product/${product.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border transition-colors hover:border-primary/30 hover:bg-muted/40"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                  {product.thumbnail ? (
                    <Image src={product.thumbnail} alt={product.title || ""} fill sizes="(max-width: 768px) 100vw, 25vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground"><Package size={26} /></div>
                  )}
                  <span className={cn(
                    "absolute left-2.5 top-2.5 rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur",
                    Number(product.price) ? "bg-background/90" : "bg-emerald-500/90 text-white"
                  )}>
                    {money(product.price, product.currency)}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <h3 className="line-clamp-2 text-sm font-medium group-hover:text-primary">{product.title}</h3>
                  {product.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{product.description}</p>}
                  <span className="mt-auto pt-3 text-xs font-medium text-primary">View resource →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
        </main>

        <aside className="hidden min-w-0 lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] space-y-5 overflow-y-auto pl-1">
            {accessCourse?.slug ? (
              <section>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Related course</h2>
                <Link href={`/course/${accessCourse.slug}`} className="group block overflow-hidden rounded-lg border border-border transition-colors hover:bg-muted/60">
                  {accessCourse.thumbnail && <img src={accessCourse.thumbnail} alt="" className="aspect-video w-full object-cover" />}
                  <div className="p-3">
                    <p className="text-sm font-medium leading-5 group-hover:underline">{accessCourse.title}</p>
                    {accessCourse.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{accessCourse.description}</p>}
                  </div>
                </Link>
              </section>
            ) : null}

            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Related articles</h2>
              {relatedArticles.length ? (
                <ul className="space-y-3">
                  {relatedArticles.map((item) => (
                    <li key={item._id || item.slug}>
                      <Link href={`/t/${item.slug}`} className="group flex gap-2.5 rounded-lg p-1 transition-colors hover:bg-muted/60">
                        {item.thumbnail && <img src={item.thumbnail} alt="" className="h-14 w-16 shrink-0 rounded-md object-cover" />}
                        <span className="min-w-0">
                          <span className="block text-[13px] font-medium leading-5 group-hover:underline">{item.title}</span>
                          {item.description && <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{item.description}</span>}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-xs leading-5 text-muted-foreground">Related articles will appear here when available.</p>}
            </section>
          </div>
        </aside>
      </div>
    </article>
  );
}
