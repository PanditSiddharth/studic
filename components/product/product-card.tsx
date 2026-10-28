"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, FileBox, IndianRupee } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { IProduct } from "@/modals/product.model";
import { cn } from "@/modals/utils";

export interface ProductOptions {
  product: Partial<IProduct>;
  className?: string;
  options?: unknown;
}

export const formatPrice = (price?: number, currency = "INR") => {
  if (!Number(price)) return "Free";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(price));
};

const ProductCard = ({ product, className }: ProductOptions) => {
  if (!product) return null;
  const isFree = !Number(product.price);

  return (
    <Card className={cn("group flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5", className)}>
      <Link href={`/product/${product.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-muted">
        {product.thumbnail ? (
          <Image
            src={product.thumbnail}
            alt={product.title || "Product cover"}
            fill
            sizes="(max-width: 768px) 100vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <FileBox size={30} />
          </div>
        )}
        <span className={cn(
          "absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur",
          isFree ? "bg-emerald-500/90 text-white" : "bg-background/90 text-foreground"
        )}>
          {isFree ? "Free" : formatPrice(product.price, product.currency)}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={`/product/${product.slug}`} className="focus:outline-none">
          <h3 className="line-clamp-2 text-sm font-semibold leading-5 group-hover:text-primary">{product.title}</h3>
        </Link>
        {product.description && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground">{product.description}</p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <span className="flex items-center gap-1 text-sm font-semibold">
            {isFree ? (
              <span className="text-emerald-600 dark:text-emerald-400">Free download</span>
            ) : (
              <>
                <IndianRupee size={13} className="text-muted-foreground" />
                {Number(product.price).toLocaleString("en-IN")}
              </>
            )}
          </span>
          <Button asChild size="sm" variant="secondary" className="gap-1">
            <Link href={`/product/${product.slug}`}>
              View <ArrowUpRight size={13} />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ProductCard;
