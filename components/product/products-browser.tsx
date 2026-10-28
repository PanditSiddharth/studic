"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, PackageOpen, Search, Sparkles } from "lucide-react";
import { toast } from "react-toastify";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/product/product-card";
import { getPublishedProducts } from "@/server-functions/product";
import type { IProduct } from "@/modals/product.model";
import { cn } from "@/modals/utils";

const PAGE_SIZE = 12;

type ProductsResult = { products: IProduct[]; totalProducts: number };

const isResult = (value: unknown): value is ProductsResult =>
  Boolean(value && typeof value === "object" && "products" in value && "totalProducts" in value);

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="aspect-[16/10] animate-pulse bg-muted" />
      <div className="space-y-2 p-4">
        <div className="h-3.5 w-4/5 animate-pulse rounded bg-muted" />
        <div className="h-3 w-3/5 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-7 w-1/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

export default function ProductsBrowser() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadedOnce = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setActiveSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPublishedProducts({ skip: 0, postsPerPage: PAGE_SIZE, search: activeSearch })
      .then((result) => {
        if (cancelled) return;
        if ("error" in result) {
          toast.error(result.error);
          setProducts([]);
          setTotal(0);
          return;
        }
        setProducts(result.products ?? []);
        setTotal(result.totalProducts ?? 0);
      })
      .catch(() => {
        if (!cancelled) toast.error("Products could not be loaded.");
      })
      .finally(() => {
        if (cancelled) return;
        loadedOnce.current = true;
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [activeSearch]);

  const loadMore = useCallback(async () => {
    if (loadingMore || products.length >= total) return;
    setLoadingMore(true);
    try {
      const result = await getPublishedProducts({ skip: products.length, postsPerPage: PAGE_SIZE, search: activeSearch });
      if (!isResult(result)) {
        if ("error" in result) toast.error(result.error);
        return;
      }
      setProducts((current) => {
        const seen = new Set(current.map((product) => String(product._id)));
        return [...current, ...result.products.filter((product) => !seen.has(String(product._id)))];
      });
      setTotal(result.totalProducts ?? total);
    } finally {
      setLoadingMore(false);
    }
  }, [activeSearch, loadingMore, products.length, total]);

  const featured = products[0];

  return (
    <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-violet-500/10 p-7 sm:p-10">
        <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            <Sparkles size={13} /> Digital products
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Resources that ship with your learning</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            Templates, notes, cheatsheets and starter kits. Claim the free ones instantly and keep everything in your library.
          </p>

          <div className="relative mt-6 max-w-lg">
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products, tags or topics..."
              className="h-12 rounded-xl pl-10"
              aria-label="Search products"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><PackageOpen size={13} /> {loading ? "Loading catalogue" : `${total} resource${total === 1 ? "" : "s"}`}</span>
            {featured?.tags?.length ? (
              <span className="inline-flex items-center gap-1.5">
                Popular tags:
                {featured.tags.slice(0, 3).map((tag) => (
                  <button key={tag} type="button" onClick={() => setSearch(tag)} className="rounded-full border px-2 py-0.5 transition-colors hover:bg-muted">
                    {tag}
                  </button>
                ))}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <div className="mt-8 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{activeSearch ? `Results for “${activeSearch}”` : "All products"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Instant access after claiming. Paid orders appear in your profile until confirmed.</p>
        </div>
      </div>

      {loading ? (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => <SkeletonCard key={index} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed bg-muted/20 px-6 py-14 text-center">
          <PackageOpen size={26} className="mx-auto text-muted-foreground" />
          <p className="mt-3 font-medium">No products found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeSearch ? "Try a different keyword or clear the search." : "New resources will appear here as they are published."}
          </p>
          {activeSearch && (
            <Button variant="outline" className="mt-4" onClick={() => setSearch("")}>Clear search</Button>
          )}
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={String(product._id || product.slug)} product={product} />
            ))}
          </div>

          {products.length < total && (
            <div className="mt-8 flex justify-center">
              <Button variant="outline" onClick={loadMore} disabled={loadingMore} className={cn("gap-2", loadingMore && "opacity-80")}>
                {loadingMore && <Loader2 size={15} className="animate-spin" />}
                Load more products
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
