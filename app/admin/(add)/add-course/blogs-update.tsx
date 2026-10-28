"use client";

import { useEffect, useState } from "react";
import { BlogCard } from "@/components/Cards";
import Scroll from "@/components/infinite-scroll";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { IBlog } from "@/modals/blog.model";
import { getBlogs } from "@/server-functions/blog";
import { useDataStore } from "@/store";
import { CircleX, Search, X } from "lucide-react";
import { toast } from "react-toastify";

const AddBlogs = ({ onChange, value, showBlogs, setShowBlogs }: any) => {
  const selected = useDataStore<IBlog[]>("sblogs", [])();
  const cache = useDataStore<IBlog[]>("blogs", [])();
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const selectedIds = new Set(selected.data.map((item) => String(item._id)));

  const fetchPage = async (reset = false, query = activeSearch) => {
    setLoading(true);
    try {
      const skip = reset ? 0 : cache.data.length;
      const result = await getBlogs({ skip, postsPerPage: 12, search: query });
      if ("error" in result) { toast.error(result.error); return; }
      cache.setTotalLength(result.totalBlogs || 0);
      cache.setData(reset ? result.blogs : [...cache.data, ...result.blogs]);
    } catch {
      toast.error("Articles could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showBlogs) void fetchPage(true, activeSearch);
    // Opening the picker or submitting a new search should load a fresh result set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showBlogs, activeSearch]);

  const selectArticle = (article: IBlog) => {
    if (selectedIds.has(String(article._id))) return;
    selected.setData([...selected.data, article]);
  };

  const closePicker = () => {
    onChange(selected.data.map((item) => item._id));
    setShowBlogs(false);
  };

  return showBlogs ? (
    <div className="fixed inset-0 z-50 flex h-screen w-screen flex-col bg-background px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div><h2 className="text-xl font-semibold">Add articles to course</h2><p className="mt-1 text-sm text-muted-foreground">Search the article library. Adding an article here does not duplicate it.</p></div>
        <Button type="button" onClick={closePicker}><X size={16} className="mr-2"/> Done ({selected.data.length})</Button>
      </div>

      <form className="flex gap-2 py-4" onSubmit={(event) => { event.preventDefault(); setActiveSearch(search.trim()); }}>
        <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by article title, slug, description or tags" className="pl-9"/></div>
        <Button type="submit" disabled={loading}>Search</Button>
        {activeSearch && <Button type="button" variant="outline" onClick={() => { setSearch(""); setActiveSearch(""); }}>Clear</Button>}
      </form>

      <div className="mb-4 rounded-xl border p-3">
        <div className="mb-3 flex items-center justify-between"><p className="text-sm font-medium">Course playlist · {selected.data.length} articles</p><p className="text-xs text-muted-foreground">Selection order is playlist order</p></div>
        {selected.data.length ? <div className="flex flex-wrap gap-2">{selected.data.map((article, index) => <div key={article._id || article.slug} className="flex max-w-full items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm"><span className="text-xs text-muted-foreground">{index + 1}.</span><span className="max-w-[220px] truncate">{article.title}</span><button type="button" aria-label={`Remove ${article.title}`} onClick={() => selected.setData(selected.data.filter((entry) => entry._id !== article._id))} className="text-muted-foreground hover:text-destructive"><CircleX size={15}/></button></div>)}</div> : <p className="text-sm text-muted-foreground">No articles selected yet.</p>}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && cache.data.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">Searching articles…</p> : <Scroll
          data={cache.data || []}
          next={() => fetchPage(false)}
          className2="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          totalLength={cache.totalLength}
          element={(article: IBlog, index: number) => (
            <BlogCard key={article._id || index} title={article.title} slug={`${article.category?.[0] || "article"}/${article.slug}`} image={article.thumbnail} description={article.description}
              component={<Button type="button" variant={selectedIds.has(String(article._id)) ? "outline" : "secondary"} disabled={selectedIds.has(String(article._id))} onClick={() => selectArticle(article)}>{selectedIds.has(String(article._id)) ? "Added" : "Add to course"}</Button>}
            />
          )}
        />}
        {!loading && cache.data.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">No articles match this search.</p>}
      </div>
    </div>
  ) : null;
};

export default AddBlogs;
