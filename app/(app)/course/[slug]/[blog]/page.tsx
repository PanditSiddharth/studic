"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { useTheme } from "next-themes";
import { useDataStore } from "@/store";
import { IBlog } from "@/modals/blog.model";
import { getBlog, getBlogs } from "@/server-functions/blog";
import { getCourse } from "@/server-functions/course";
import { toast } from "react-toastify";
import Loader from "@/components/loader";
import rehypeHighlight from "rehype-highlight";
import "@/components/themes/codetheme.css";

type TocItem = { id: string; title: string; level: number };
type Suggestion = { _id?: string; title?: string; slug?: string; thumbnail?: string; description?: string };
type Suggestions = { course?: Suggestion; blogs: Suggestion[] };

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

export default function Blog(props: any) {
  const { theme, systemTheme } = useTheme();
  const bg = useDataStore<Partial<IBlog> | undefined>("blog", undefined)();
  const params = React.use(props.params) as any;
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<Suggestions>({ blogs: [] });
  const currentTheme = ["dark", "blue"].includes(
    (theme === "system" ? systemTheme : theme) as string
  ) ? "dark" : "light";

  useEffect(() => {
    let cancelled = false;
    const fetchBlog = async () => {
      try {
        const blog = await getBlog({ slug: params?.blog });
        if (cancelled) return;
        if ("error" in blog) toast.error(blog.error);
        else bg.setData(blog);
      } catch {
        if (!cancelled) toast.error("Unable to load this article.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (loading) void fetchBlog();
    return () => { cancelled = true; };
  }, [params?.blog, bg, loading]);

  useEffect(() => {
    const current = bg?.data;
    if (!current?.slug) return;
    let cancelled = false;
    const loadSuggestions = async () => {
      try {
        const [courseResult, blogResult] = await Promise.all([
          params?.slug ? getCourse({ slug: params.slug, blogs: true }) : Promise.resolve(null),
          getBlogs({ skip: 0, postsPerPage: 8, search: current.tags?.[0] || current.category?.[0] || current.title?.split(" ")[0] || "" }),
        ]);
        if (cancelled) return;
        const course = courseResult && !("error" in courseResult) ? courseResult as any : undefined;
        const allBlogs = blogResult && !("error" in blogResult) ? (blogResult as any).blogs || [] : [];
        const related = allBlogs
          .filter((item: Suggestion) => item.slug && item.slug !== current.slug)
          .slice(0, 4);
        setSuggestions({ course: course?.slug ? course : undefined, blogs: related });
      } catch {
        if (!cancelled) setSuggestions({ blogs: [] });
      }
    };
    void loadSuggestions();
    return () => { cancelled = true; };
  }, [bg?.data?.slug, bg?.data?.tags, bg?.data?.category, bg?.data?.title, params?.slug]);

  const headings = useMemo(() => extractHeadings(bg?.data?.content ?? ""), [bg?.data?.content]);

  useEffect(() => {
    if (loading) return;
    const root = document.querySelector("[data-blog-article]");
    if (!root) return;
    const renderedHeadings = Array.from(root.querySelectorAll("h1, h2, h3"));
    renderedHeadings.forEach((heading, index) => {
      const item = headings[index];
      if (item) heading.id = item.id;
    });
  }, [loading, headings, bg?.data?.content]);

  if (loading) return <Loader />;
  if (!bg?.data) return <div className="fixed inset-0 flex items-center justify-center">Not Found</div>;

  return (
    <div data-color-mode={currentTheme} className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-5 px-3 py-5 sm:px-5 lg:grid-cols-[190px_minmax(0,1fr)_230px] lg:gap-5 xl:grid-cols-[205px_minmax(0,1fr)_250px]">
      {headings.length > 0 && (
        <aside className="hidden lg:block min-w-0">
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
      )}

      <main className="min-w-0">
        <MarkdownPreview
          data-blog-article=""
          style={{
            backgroundColor: currentTheme === "dark" ? "rgba(0, 0, 0, 0.2)" : "rgba(255, 255, 255, 0.2)",
            fontFamily: "sans-serif",
          }}
          rehypePlugins={[rehypeHighlight]}
          className="mx-auto w-full max-w-4xl rounded-xl p-3 sm:p-5"
          source={bg.data.content}
        />
      </main>

      <aside className="hidden lg:block min-w-0">
        <div className="sticky top-24 max-h-[calc(100vh-7rem)] space-y-5 overflow-y-auto pl-1">
          {suggestions.course && (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Related course</h2>
              <Link href={`/course/${suggestions.course.slug}`} className="group block overflow-hidden rounded-lg border border-border transition-colors hover:bg-muted/60">
                {suggestions.course.thumbnail && <img src={suggestions.course.thumbnail} alt="" className="aspect-video w-full object-cover" />}
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
                    <Link href={`/course/${params?.slug || ""}/${item.slug}`} className="group flex gap-2.5 rounded-lg p-1 transition-colors hover:bg-muted/60">
                      {item.thumbnail && <img src={item.thumbnail} alt="" className="h-14 w-16 shrink-0 rounded-md object-cover" />}
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
