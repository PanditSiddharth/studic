"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { useTheme } from "next-themes";
import rehypeHighlight from "rehype-highlight";
import { toast } from "react-toastify";
import { ArrowLeft, CalendarDays, Clock3, Package, Sparkles, Tag } from "lucide-react";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import { getBlog } from "@/server-functions/blog";
import type { IBlog } from "@/modals/blog.model";
import type { IProduct } from "@/modals/product.model";
import { cn } from "@/modals/utils";
import "@/components/themes/codetheme.css";

type Params = { slug?: string[] };

const money = (price?: number, currency = "INR") =>
  !Number(price) ? "Free" : new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(price));

export default function BlogArticle({ params }: { params: Params }) {
  const { theme, systemTheme } = useTheme();
  const [blog, setBlog] = useState<Partial<IBlog> | null>(null);
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
          return;
        }
        setBlog(result);
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

  const categories = Array.isArray(blog.category) ? blog.category : [];
  const tags = Array.isArray(blog.tags) ? blog.tags : [];

  return (
    <article className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8" data-color-mode={colorMode}>
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/blogs" className="hover:text-foreground">Articles</Link>
        {categories[0] && <><span>/</span><Link href={`/blogs?category=${encodeURIComponent(categories[0])}`} className="hover:text-foreground">{categories[0]}</Link></>}
        <span>/</span>
        <span className="line-clamp-1 max-w-[55vw] text-foreground">{blog.title}</span>
      </nav>

      <header className="mt-5">
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((item) => (
            <Link key={item} href={`/blogs?category=${encodeURIComponent(item)}`} className="rounded-full border bg-muted/40 px-2.5 py-1 text-[11px] font-medium capitalize text-muted-foreground transition-colors hover:text-foreground">
              {item}
            </Link>
          ))}
        </div>

        <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{blog.title}</h1>
        {blog.description && <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">{blog.description}</p>}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          {blog.publishedAt && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={13} /> {new Date(blog.publishedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
            </span>
          )}
          {Boolean(blog.estimatedMinutes) && (
            <span className="inline-flex items-center gap-1.5"><Clock3 size={13} /> {blog.estimatedMinutes} min read</span>
          )}
          {tags.length > 0 && (
            <span className="inline-flex items-center gap-1.5"><Tag size={13} /> {tags.slice(0, 3).join(", ")}</span>
          )}
        </div>

        {blog.thumbnail && (
          <div className="mt-6 overflow-hidden rounded-2xl border bg-muted">
            <Image
              src={blog.thumbnail}
              alt={blog.title || ""}
              width={1200}
              height={675}
              className="aspect-[16/8] w-full object-cover"
              priority
            />
          </div>
        )}
      </header>

      <MarkdownPreview
        source={blog.content || "_This article is still being written._"}
        rehypePlugins={[rehypeHighlight]}
        style={{ backgroundColor: "transparent" }}
        className="mx-auto mt-8 max-w-3xl rounded-2xl p-2 sm:p-4"
      />

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
    </article>
  );
}
