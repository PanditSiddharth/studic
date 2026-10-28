"use client";

import React, { useEffect, useMemo, useState } from "react";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { useTheme } from "next-themes";
import { useDataStore } from "@/store";
import { IBlog } from "@/modals/blog.model";
import { getBlog } from "@/server-functions/blog";
import { toast } from "react-toastify";
import Loader from "@/components/loader";
import rehypeHighlight from "rehype-highlight";
import "@/components/themes/codetheme.css";

type TocItem = { id: string; title: string; level: number };

function createSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[`*_~]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-");
}

function extractHeadings(markdown: string): TocItem[] {
  const used = new Map<string, number>();
  let inCodeBlock = false;

  return markdown.split("\n").flatMap((line) => {
    if (/^\s*```/.test(line)) {
      inCodeBlock = !inCodeBlock;
      return [];
    }
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
  const currentTheme = ["dark", "blue"].includes(
    (theme === "system" ? systemTheme : theme) as string
  ) ? "dark" : "light";

  useEffect(() => {
    let cancelled = false;

    const fetchBlog = async () => {
      try {
        const blog = await getBlog({ slug: params?.blog });
        if (cancelled) return;

        if ("error" in blog) {
          toast.error(blog.error);
        } else {
          bg.setData(blog);
        }
      } catch {
        if (!cancelled) toast.error("Unable to load this article.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (loading) void fetchBlog();
    return () => { cancelled = true; };
  }, [params?.blog, bg, loading]);

  const headings = useMemo(
    () => extractHeadings(bg?.data?.content ?? ""),
    [bg?.data?.content]
  );

  useEffect(() => {
    if (loading) return;

    // Give the Markdown renderer's DOM a stable id for every heading so the
    // table of contents can navigate to the corresponding section.
    const root = document.querySelector("[data-blog-article]");
    if (!root) return;

    const renderedHeadings = Array.from(root.querySelectorAll("h1, h2, h3"));
    renderedHeadings.forEach((heading, index) => {
      const item = headings[index];
      if (item) heading.id = item.id;
    });
  }, [loading, headings, bg?.data?.content]);

  if (loading) return <Loader />;
  if (!bg?.data) {
    return <div className="fixed inset-0 flex items-center justify-center">Not Found</div>;
  }

  return (
    <div data-color-mode={currentTheme} className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
      {headings.length > 0 && (
        <aside className="hidden lg:block">
          <nav aria-label="On this page" className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto border-r border-border pr-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              On this page
            </p>
            <ul className="space-y-1.5">
              {headings.map((heading) => (
                <li key={heading.id} style={{ paddingLeft: (heading.level - 1) * 12 }}>
                  <a
                    href={`#${heading.id}`}
                    className="block rounded-md px-2 py-1.5 text-sm leading-5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
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
          className="mx-auto w-full max-w-4xl rounded-xl p-4 sm:p-6"
          source={bg.data.content}
        />
      </main>
    </div>
  );
}
