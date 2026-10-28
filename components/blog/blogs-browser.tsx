"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, CalendarDays, Clock3, FileText, Loader2, Search, Sparkles } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getBlogs } from "@/server-functions/blog";
import type { IBlog } from "@/modals/blog.model";
import { cn } from "@/modals/utils";

const PAGE_SIZE = 9;

export default function BlogsBrowser() {
  const [blogs, setBlogs] = useState<IBlog[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setActiveSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getBlogs({
      skip: 0,
      postsPerPage: PAGE_SIZE,
      search: activeSearch,
      publicOnly: true,
      category: category || undefined,
    })
      .then((result) => {
        if (cancelled) return;
        if ("error" in result) {
          toast.error(result.error);
          setBlogs([]);
          setTotal(0);
          return;
        }
        setBlogs(result.blogs ?? []);
        setTotal(result.totalBlogs ?? 0);
      })
      .catch(() => { if (!cancelled) toast.error("Articles could not be loaded."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeSearch, category]);

  const categories = useMemo(() => {
    const values = new Set<string>();
    blogs.forEach((blog) => (Array.isArray(blog.category) ? blog.category : []).forEach((item) => values.add(item)));
    return [...values].slice(0, 8);
  }, [blogs]);

  const loadMore = useCallback(async () => {
    if (loadingMore || blogs.length >= total) return;
    setLoadingMore(true);
    try {
      const result = await getBlogs({
        skip: blogs.length,
        postsPerPage: PAGE_SIZE,
        search: activeSearch,
        publicOnly: true,
        category: category || undefined,
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setBlogs((current) => {
        const seen = new Set(current.map((blog) => String(blog._id || blog.slug)));
        return [...current, ...result.blogs.filter((blog) => !seen.has(String(blog._id || blog.slug)))];
      });
      setTotal(result.totalBlogs ?? total);
    } finally {
      setLoadingMore(false);
    }
  }, [activeSearch, blogs.length, category, loadingMore, total]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-amber-500/10 p-7 sm:p-10">
        <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            <Sparkles size={13} /> Articles
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Notes from the making of things</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            Deep dives, study guides and practical walkthroughs — many with downloadable resources attached.
          </p>

          <div className="relative mt-6 max-w-lg">
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search articles, tags or topics..."
              className="h-12 rounded-xl pl-10"
              aria-label="Search articles"
            />
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCategory(null)}
            className={cn("rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors", !category ? "border-primary/40 bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}
          >
            All topics
          </button>
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(category === item ? null : item)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium capitalize transition-colors",
                category === item ? "border-primary/40 bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
              )}
            >
              {item}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            {activeSearch ? `Results for “${activeSearch}”` : category ? `Articles in ${category}` : "Latest articles"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{loading ? "Loading articles…" : `${total} article${total === 1 ? "" : "s"}`}</p>
        </div>
      </div>

      {loading ? (
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-2xl border bg-card">
              <div className="aspect-[16/9] animate-pulse bg-muted" />
              <div className="space-y-2 p-4">
                <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
                <div className="h-3 w-full animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed bg-muted/20 px-6 py-14 text-center">
          <FileText size={26} className="mx-auto text-muted-foreground" />
          <p className="mt-3 font-medium">No articles found</p>
          <p className="mt-1 text-sm text-muted-foreground">{activeSearch ? "Try another keyword or clear the search." : "New articles will appear here."}</p>
          {(activeSearch || category) && (
            <Button variant="outline" className="mt-4" onClick={() => { setSearch(""); setCategory(null); }}>Clear filters</Button>
          )}
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {blogs.map((blog) => {
              const href = blog.category?.length ? `/t/${blog.category[0]}/${blog.slug}` : `/t/${blog.slug}`;
              const isPaid = blog.accessType === "paid" || blog.status === "paid" || Number(blog.price) > 0;
              return (
                <article key={String(blog._id || blog.slug)} className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                  <Link href={href} className="relative block aspect-[16/9] overflow-hidden bg-muted">
                    {blog.thumbnail ? (
                      <Image src={blog.thumbnail} alt={blog.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground"><FileText size={26} /></div>
                    )}
                    {isPaid && (
                      <span className="absolute right-2.5 top-2.5 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold">
                        {Number(blog.price) > 0 ? new Intl.NumberFormat("en-IN", { style: "currency", currency: blog.currency || "INR", maximumFractionDigits: 0 }).format(Number(blog.price)) : "Paid"}
                      </span>
                    )}
                  </Link>
                  <div className="flex flex-1 flex-col p-4">
                    {blog.category?.length ? (
                      <div className="flex flex-wrap gap-1.5">
                        {blog.category.slice(0, 2).map((item) => (
                          <span key={item} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">{item}</span>
                        ))}
                      </div>
                    ) : null}
                    <Link href={href} className="mt-2">
                      <h3 className="line-clamp-2 text-[15px] font-semibold leading-6 group-hover:text-primary">{blog.title}</h3>
                    </Link>
                    {blog.description && <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground">{blog.description}</p>}

                    <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-[11px] text-muted-foreground">
                      <span className="flex flex-wrap items-center gap-2">
                        {blog.publishedAt && <span className="inline-flex items-center gap-1"><CalendarDays size={11} /> {new Date(blog.publishedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>}
                        {Boolean(blog.estimatedMinutes) && <span className="inline-flex items-center gap-1"><Clock3 size={11} /> {blog.estimatedMinutes} min</span>}
                      </span>
                      <Link href={href} className="inline-flex items-center gap-1 font-medium text-primary">Read <ArrowUpRight size={12} /></Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {blogs.length < total && (
            <div className="mt-8 flex justify-center">
              <Button variant="outline" className="gap-2" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
                Load more articles
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
