"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import MarkdownPreview from "@uiw/react-markdown-preview";
import rehypeHighlight from "rehype-highlight";
import { toast } from "react-toastify";
import {
  ArrowLeft, BadgeCheck, Check, Clock, Copy, Download, FileBox, FileText,
  Loader2, PackageOpen, ShieldCheck, Tag, UserRound,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import ProductCard, { formatPrice } from "@/components/product/product-card";
import { getPublishedProduct } from "@/server-functions/product";
import { startCheckout } from "@/server-functions/library";
import type { IProduct } from "@/modals/product.model";
import { cn } from "@/modals/utils";
import "@/components/themes/codetheme.css";

type Seller = { _id?: string; name?: string; username?: string; image?: string };
type Access = { signedIn: boolean; owned: boolean; enrolled: boolean; orderStatus: string | null; orderId: string | null; progressPercent: number };
type DetailData = { product: Partial<IProduct> & { seller?: Seller }; access: Access; related: Partial<IProduct>[] };

const formatBytes = (bytes?: number) => {
  if (!bytes || bytes <= 0) return null;
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${value >= 10 || exponent === 0 ? Math.round(value) : value.toFixed(1)} ${units[exponent]}`;
};

export default function ProductDetail({ slug }: { slug: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, systemTheme } = useTheme();
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const colorMode = ["dark", "blue"].includes((theme === "system" ? systemTheme : theme) as string) ? "dark" : "light";

  const load = useCallback(async () => {
    const result = await getPublishedProduct(slug);
    if ("error" in result) {
      setError(result.error);
      setData(null);
      return;
    }
    setData({ product: result.product as DetailData["product"], access: result.access as Access, related: result.related as Partial<IProduct>[] });
    setError(null);
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load()
      .catch(() => { if (!cancelled) setError("This product could not be loaded."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [load]);

  const claim = async () => {
    if (!data?.product._id) return;
    if (!data.access.signedIn) {
      router.push(`/auth?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    setBusy(true);
    try {
      const result = await startCheckout({ productId: String(data.product._id) });
      if (result.error) {
        if (result.requiresAuth) {
          router.push(`/auth?callbackUrl=${encodeURIComponent(pathname)}`);
          return;
        }
        toast.error(result.error);
        return;
      }
      if (result.status === "granted") {
        toast.success(result.free ? "Added to your library — download it any time." : "Payment confirmed");
      } else if (result.status === "pending") {
        toast.info(result.message || "Order saved and pending confirmation.");
      }
      await load();
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy the link");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-4 grid gap-8 lg:grid-cols-[1.6fr_0.9fr]">
          <div className="space-y-4">
            <div className="aspect-[16/10] animate-pulse rounded-2xl bg-muted" />
            <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
          </div>
          <div className="h-72 animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center px-4 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground"><PackageOpen size={22} /></span>
        <h1 className="mt-4 text-xl font-semibold">Product unavailable</h1>
        <p className="mt-1 text-sm text-muted-foreground">{error || "This product may have been unpublished."}</p>
        <Button asChild variant="outline" className="mt-5"><Link href="/products"><ArrowLeft size={15} /> All products</Link></Button>
      </div>
    );
  }

  const { product, access, related } = data;
  const isFree = !Number(product.price);
  const isPending = access.orderStatus === "pending";
  const known = access.owned;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8" data-color-mode={colorMode}>
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/products" className="hover:text-foreground">Products</Link>
        <span>/</span>
        <span className="line-clamp-1 max-w-[60vw] text-foreground">{product.title}</span>
      </nav>

      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_360px] lg:items-start">
        <div className="min-w-0 space-y-6">
          <div className="overflow-hidden rounded-2xl border bg-muted">
            {product.thumbnail ? (
              <img src={product.thumbnail} alt={product.title || ""} className="aspect-[16/9] w-full object-cover" />
            ) : (
              <div className="flex aspect-[16/9] items-center justify-center text-muted-foreground"><FileBox size={36} /></div>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                isFree ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-primary/10 text-primary"
              )}>
                {isFree ? "Free resource" : formatPrice(product.price, product.currency)}
              </span>
              {product.tags?.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
                  <Tag size={10} /> {tag}
                </span>
              ))}
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{product.title}</h1>
            {product.description && (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{product.description}</p>
            )}
          </div>

          <section className="rounded-2xl border bg-card">
            <div className="border-b px-5 py-3">
              <h2 className="text-sm font-semibold">About this product</h2>
            </div>
            <MarkdownPreview
              source={product.description || "_No extra details have been added yet._"}
              rehypePlugins={[rehypeHighlight]}
              style={{ backgroundColor: "transparent" }}
              className="max-w-none rounded-b-2xl p-4 sm:p-5"
            />
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Price</p>
                <p className="mt-1 text-2xl font-semibold">{isFree ? "Free" : formatPrice(product.price, product.currency)}</p>
              </div>
              {known ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <BadgeCheck size={13} /> Owned
                </span>
              ) : isPending ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                  <Clock size={13} /> Pending
                </span>
              ) : null}
            </div>

            <div className="mt-5 space-y-2">
              {known ? (
                <>
                  <Button asChild className="h-11 w-full gap-2">
                    <a href={`/api/download/${product._id}`}>
                      <Download size={16} /> Download file
                    </a>
                  </Button>
                  <p className="text-center text-[11px] text-muted-foreground">
                    Saved in your library. {product.fileName ? `File: ${product.fileName}` : ""}
                  </p>
                </>
              ) : (
                <Button className="h-11 w-full gap-2" onClick={claim} disabled={busy}>
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                  {isFree ? "Get it free" : isPending ? "Order pending" : "Buy now"}
                </Button>
              )}
              {isPending && !known && (
                <p className="text-center text-[11px] leading-4 text-muted-foreground">
                  Order <span className="font-medium text-foreground">{access.orderId}</span> is waiting for confirmation.
                </p>
              )}
              {!access.signedIn && (
                <p className="text-center text-[11px] text-muted-foreground">Sign in to claim or buy this resource.</p>
              )}
            </div>

            <div className="mt-5 space-y-2.5 border-t pt-4 text-xs text-muted-foreground">
              {product.fileName && (
                <p className="flex items-center gap-2"><FileText size={13} /> {product.fileName}</p>
              )}
              {formatBytes(product.fileSize) && (
                <p className="flex items-center gap-2"><FileBox size={13} /> {formatBytes(product.fileSize)}</p>
              )}
              <p className="flex items-center gap-2"><Check size={13} /> Added to your library instantly</p>
              {product.downloadLimit ? <p className="flex items-center gap-2"><Download size={13} /> Download limit: {product.downloadLimit}</p> : null}
            </div>

            <Button type="button" variant="outline" className="mt-4 w-full gap-2" onClick={copyLink}>
              {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Link copied" : "Share product"}
            </Button>
          </div>

          {product.seller?.name && (
            <div className="rounded-2xl border bg-card p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Published by</p>
              <div className="mt-2 flex items-center gap-2.5">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={product.seller.image} alt={product.seller.name} />
                  <AvatarFallback><UserRound size={15} /></AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{product.seller.name}</p>
                  {product.seller.username && <p className="truncate text-xs text-muted-foreground">@{product.seller.username}</p>}
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-12 border-t pt-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">More resources</h2>
              <p className="mt-1 text-sm text-muted-foreground">Related downloads from the same catalogue.</p>
            </div>
            <Button asChild variant="ghost" size="sm"><Link href="/products">View all</Link></Button>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => <ProductCard key={String(item._id || item.slug)} product={item} />)}
          </div>
        </section>
      )}
    </div>
  );
}
