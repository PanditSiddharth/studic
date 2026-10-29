"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Plus, Pencil, Trash2, RefreshCw, ExternalLink } from "lucide-react";
import { toast } from "react-toastify";
import { deleteAdminContent, searchAdminContent, updateAdminAccess, updateAdminVisibility } from "@/server-functions/admin-content";

type Kind = "courses" | "blogs" | "products";
type Item = { _id: string; title: string; slug: string; status?: string; accessType?: string; price?: number; updatedAt?: string; createdOn?: string; description?: string; category?: string[] };

const settings: Record<Kind, { title: string; singular: string; createHref: string; editHref: (item: Item) => string }> = {
  courses: { title: "Courses", singular: "course", createHref: "/admin/add-course", editHref: (item) => `/admin/add-course?slug=${encodeURIComponent(item.slug)}` },
  blogs: { title: "Articles", singular: "article", createHref: "/admin/add-blog", editHref: (item) => `/admin/add-blog?slug=${encodeURIComponent(item.slug)}` },
  products: { title: "Products", singular: "product", createHref: "/admin/add-product", editHref: (item) => `/admin/add-product?slug=${encodeURIComponent(item.slug)}` },
};

export default function AdminContentList({ kind }: { kind: Kind }) {
  const router = useRouter();
  const cfg = settings[kind];
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, startTransition] = useTransition();
  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await searchAdminContent(kind, search, page * pageSize, pageSize);
      if ("error" in result) { toast.error(result.error); setItems([]); setTotal(0); return; }
      setItems(result.items as Item[]);
      setTotal(result.total);
    } catch { toast.error("Could not load records."); }
    finally { setLoading(false); }
  }, [kind, search, page]);

  useEffect(() => { void load(); }, [load]);
  const filtered = status === "all"
    ? items
    : status === "free" || status === "paid"
      ? items.filter((item) => (item.accessType || (item.status === "paid" ? "paid" : "free")) === status)
      : items.filter((item) => item.status === status);

  const remove = (item: Item) => {
    if (!window.confirm(`Delete this ${cfg.singular}: "${item.title}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteAdminContent(kind, item._id);
      if ("error" in result) { toast.error(result.error); return; }
      toast.success(`Deleted ${result.deletedCount} record(s)`);
      await load();
      router.refresh();
    });
  };

  const changeStatus = (item: Item, nextStatus: string) => {
    if (nextStatus === "free" || nextStatus === "paid") {
      if (kind !== "blogs") return;
      if (nextStatus === "paid" && !(Number(item.price) > 0)) {
        toast.error("Add a price in the article editor, then switch it to paid.");
        return;
      }
      startTransition(async () => {
        const result = await updateAdminAccess("blogs", item._id, nextStatus);
        if ("error" in result) { toast.error(result.error); return; }
        toast.success(nextStatus === "paid" ? "Article marked as paid" : "Article is now free");
        await load();
        router.refresh();
      });
      return;
    }
    startTransition(async () => {
      const result = await updateAdminVisibility(kind, item._id, nextStatus);
      if ("error" in result) { toast.error(result.error); return; }
      toast.success("Visibility updated");
      await load();
      router.refresh();
    });
  };

  return <main className="min-h-screen space-y-6 p-5 sm:p-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Content management</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{cfg.title}</h1><p className="mt-2 text-sm text-muted-foreground">Search, review and manage your {cfg.title.toLowerCase()}.</p></div>
      <Link href={cfg.createHref} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"><Plus size={16}/> Create {cfg.singular}</Link>
    </div>

    <section className="overflow-hidden rounded-2xl border bg-card">
      <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center">
        <div className="relative flex-1"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} placeholder={`Search by title, slug, description or tags…`} className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"/></div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-lg border bg-background px-3 text-sm"><option value="all">All statuses</option>{(kind === "courses" ? ["draft","private","published","unlisted","archived"] : kind === "blogs" ? ["draft","private","public","unlisted","free","paid"] : ["draft","published","archived"]).map((value) => <option key={value} value={value}>{value === "free" ? "Free access" : value === "paid" ? "Paid access" : value[0].toUpperCase()+value.slice(1)}</option>)}</select>
        <button onClick={() => void load()} disabled={loading} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm hover:bg-muted disabled:opacity-50"><RefreshCw size={15}/> Refresh</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Content</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">{kind === "products" ? "Price" : "Access"}</th><th className="px-4 py-3 font-medium">Last updated</th><th className="px-5 py-3 text-right font-medium">Actions</th></tr></thead>
          <tbody className="divide-y">{filtered.map((item) => <tr key={item._id} className="hover:bg-muted/20">
            <td className="max-w-sm px-5 py-4"><p className="truncate font-medium">{item.title || "(Untitled)"}</p><p className="mt-1 truncate text-xs text-muted-foreground">/{item.slug}</p></td>
            <td className="px-4 py-4"><span className="rounded-full border px-2.5 py-1 text-xs capitalize">{item.status || "draft"}</span></td>
            <td className="px-4 py-4 text-muted-foreground">{
              kind === "products" || item.accessType === "paid" || item.status === "paid"
                ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(item.price || 0)
                : kind === "blogs" ? "Free" : item.accessType || "—"
            }</td>
            <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString("en-IN") : item.createdOn ? new Date(item.createdOn).toLocaleDateString("en-IN") : "—"}</td>
            <td className="px-5 py-4"><div className="flex justify-end gap-2">
              <select aria-label={`Status for ${item.title}`} value={["free", "paid"].includes(String(item.status)) ? "public" : item.status || "draft"} disabled={busy} onChange={(e) => changeStatus(item, e.target.value)} className="max-w-28 rounded-md border bg-background px-2 py-1 text-xs">
                <option value="draft">Draft</option>
                {kind === "courses" && <><option value="private">Private</option><option value="published">Published</option><option value="unlisted">Unlisted</option><option value="archived">Archived</option></>}
                {kind === "blogs" && <><option value="private">Private</option><option value="public">Public</option><option value="unlisted">Unlisted</option></>}
                {kind === "products" && <><option value="published">Published</option><option value="archived">Archived</option></>}
              </select>
              {kind === "blogs" && <select aria-label={`Access for ${item.title}`} value={item.accessType === "paid" || item.status === "paid" ? "paid" : "free"} disabled={busy} onChange={(e) => changeStatus(item, e.target.value)} className="max-w-24 rounded-md border bg-background px-2 py-1 text-xs"><option value="free">Free</option><option value="paid">Paid</option></select>}
              <Link aria-label={`Edit ${item.title}`} href={cfg.editHref(item)} className="rounded-md border p-2 hover:bg-muted"><Pencil size={15}/></Link>
              <button aria-label={`Delete ${item.title}`} disabled={busy} onClick={() => remove(item)} className="rounded-md border p-2 text-destructive hover:bg-destructive/10 disabled:opacity-50"><Trash2 size={15}/></button>
              <Link aria-label={`Open ${item.title}`} href={kind === "courses" ? `/course/${item.slug}` : kind === "blogs" ? `/t/${item.slug}` : `/product/${item.slug}`} target="_blank" className="rounded-md border p-2 hover:bg-muted"><ExternalLink size={15}/></Link>
            </div></td>
          </tr>)}</tbody>
        </table>
        {loading ? <p className="p-8 text-center text-sm text-muted-foreground">Loading records…</p> : filtered.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No matching records found.</p> : null}
      </div>
      <div className="flex items-center justify-between border-t px-5 py-4"><p className="text-xs text-muted-foreground">Showing {total === 0 ? 0 : page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} of {total}</p><div className="flex gap-2"><button disabled={page === 0 || loading} onClick={() => setPage((p) => Math.max(0,p-1))} className="rounded-lg border px-3 py-2 text-xs disabled:opacity-40">Previous</button><button disabled={(page+1)*pageSize >= total || loading} onClick={() => setPage((p) => p+1)} className="rounded-lg border px-3 py-2 text-xs disabled:opacity-40">Next</button></div></div>
    </section>
  </main>;
}
