"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, BookOpen, Check, Loader2, Search, X } from "lucide-react";
import { toast } from "react-toastify";
import type { IBlog } from "@/modals/blog.model";
import { getBlogs } from "@/server-functions/blog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/modals/utils";
import { getActionError } from "../helpers";

const PAGE_SIZE = 12;
const PLACEHOLDER = "/placeholder.png";

interface BlogPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSelected?: IBlog[];
  onConfirm: (blogs: IBlog[]) => void;
}

const idOf = (blog: IBlog) => String(blog._id ?? blog.slug);

/** The server builds a RegExp from the search text, so escape special characters. */
const escapeSearch = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default function BlogPicker({ open, onOpenChange, initialSelected = [], onConfirm }: BlogPickerProps) {
  const [items, setItems] = useState<IBlog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [selected, setSelected] = useState<IBlog[]>(initialSelected);

  const selectedIds = useMemo(() => new Set(selected.map(idOf)), [selected]);

  // Reset the draft selection whenever the picker opens.
  useEffect(() => {
    if (!open) return;
    setSelected(initialSelected);
    setSearch("");
    setActiveSearch("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    setLoading(true);
    getBlogs({ skip: 0, postsPerPage: PAGE_SIZE, search: escapeSearch(activeSearch) })
      .then((result) => {
        if (cancelled) return;
        const failure = getActionError(result);
        if (failure) {
          toast.error(failure);
          setItems([]);
          setTotal(0);
          return;
        }
        const page = result as { blogs?: IBlog[]; totalBlogs?: number };
        setItems(page.blogs ?? []);
        setTotal(page.totalBlogs ?? 0);
      })
      .catch(() => toast.error("Articles could not be loaded."))
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [open, activeSearch]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onOpenChange(false); };
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange]);

  const loadMore = async () => {
    if (loadingMore || items.length >= total) return;
    setLoadingMore(true);
    try {
      const result = await getBlogs({ skip: items.length, postsPerPage: PAGE_SIZE, search: escapeSearch(activeSearch) });
      const failure = getActionError(result);
      if (failure) { toast.error(failure); return; }
      const page = result as { blogs?: IBlog[]; totalBlogs?: number };
      setItems((current) => {
        const seen = new Set(current.map(idOf));
        return [...current, ...(page.blogs ?? []).filter((blog) => !seen.has(idOf(blog)))];
      });
      setTotal(page.totalBlogs ?? total);
    } catch {
      toast.error("Articles could not be loaded.");
    } finally {
      setLoadingMore(false);
    }
  };

  const toggle = (blog: IBlog) => {
    setSelected((current) => current.some((item) => idOf(item) === idOf(blog))
      ? current.filter((item) => idOf(item) !== idOf(blog))
      : [...current, blog]);
  };

  const move = (index: number, direction: -1 | 1) => {
    setSelected((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Add articles to course"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onOpenChange(false); }}
    >
      <div className="flex h-full w-full max-w-6xl flex-col overflow-hidden border bg-background shadow-2xl sm:h-[88vh] sm:rounded-2xl">
        <header className="flex items-start justify-between gap-4 border-b px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Add articles to this course</h2>
            <p className="mt-1 text-sm text-muted-foreground">Search the library and build the learning order. Articles are linked, not copied.</p>
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label="Close picker" onClick={() => onOpenChange(false)}>
            <X size={18} />
          </Button>
        </header>

        <div
          className="flex flex-col gap-2 border-b px-5 py-3 sm:flex-row sm:items-center sm:px-6"
        >
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") { event.preventDefault(); setActiveSearch(search.trim()); }
              }}
              placeholder="Search by title, description or tag…"
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={() => setActiveSearch(search.trim())} disabled={loading}>Search</Button>
            {activeSearch ? (
              <Button type="button" variant="outline" onClick={() => { setSearch(""); setActiveSearch(""); }}>Clear</Button>
            ) : null}
          </div>
        </div>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-h-0 overflow-y-auto px-5 py-4 sm:px-6">
            {loading ? (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching articles…
              </div>
            ) : items.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center">
                <BookOpen size={22} className="text-muted-foreground" />
                <p className="text-sm font-medium">No articles found</p>
                <p className="text-xs text-muted-foreground">Try a different search, or create an article first.</p>
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((article) => {
                    const isSelected = selectedIds.has(idOf(article));
                    return (
                      <button
                        key={idOf(article)}
                        type="button"
                        onClick={() => toggle(article)}
                        aria-pressed={isSelected}
                        className={cn(
                          "group overflow-hidden rounded-xl border text-left transition-colors",
                          isSelected ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/50 hover:bg-muted/30"
                        )}
                      >
                        <span className="relative block aspect-video w-full overflow-hidden bg-muted">
                          <Image
                            src={article.thumbnail || PLACEHOLDER}
                            alt={article.title || "Article cover"}
                            fill
                            sizes="(max-width: 640px) 100vw, 280px"
                            className="object-cover"
                          />
                          {isSelected ? (
                            <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                              <Check size={14} />
                            </span>
                          ) : null}
                        </span>
                        <span className="block p-3">
                          <span className="line-clamp-2 text-sm font-medium leading-snug">{article.title || "(Untitled)"}</span>
                          <span className="mt-1 block truncate text-xs text-muted-foreground">
                            {article.category?.[0] ? `${article.category[0]} · ` : ""}{article.slug}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                {items.length < total ? (
                  <div className="mt-4 flex justify-center">
                    <Button type="button" variant="outline" onClick={() => void loadMore()} disabled={loadingMore}>
                      {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Load more
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </div>

          <aside className="flex min-h-0 flex-col border-t bg-muted/20 lg:border-l lg:border-t-0">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <p className="text-sm font-medium">Course lessons</p>
              <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">{selected.length}</span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {selected.length === 0 ? (
                <p className="px-1 py-6 text-center text-sm text-muted-foreground">Select articles to add them here.</p>
              ) : (
                <ol className="space-y-2">
                  {selected.map((article, index) => (
                    <li key={idOf(article)} className="flex items-start gap-2 rounded-lg border bg-background p-2.5">
                      <span className="mt-0.5 text-xs text-muted-foreground">{index + 1}.</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">{article.title}</span>
                        <span className="mt-0.5 flex gap-1">
                          <button type="button" aria-label="Move up" disabled={index === 0} onClick={() => move(index, -1)} className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30">
                            <ArrowUp size={13} />
                          </button>
                          <button type="button" aria-label="Move down" disabled={index === selected.length - 1} onClick={() => move(index, 1)} className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30">
                            <ArrowDown size={13} />
                          </button>
                          <button type="button" aria-label={`Remove ${article.title}`} onClick={() => toggle(article)} className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                            <X size={13} />
                          </button>
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </aside>
        </div>

        <footer className="flex flex-col gap-2 border-t px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-muted-foreground">Selection order becomes the order students see.</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="button" onClick={() => { onConfirm(selected); onOpenChange(false); }}>
              {selected.length ? `Add ${selected.length} article${selected.length === 1 ? "" : "s"}` : "Done"}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
