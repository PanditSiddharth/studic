import type { Metadata } from "next";
import ProductDetail from "@/components/product/product-detail";
import JsonLd from "@/components/seo/json-ld";
import { getPublishedProduct } from "@/server-functions/product";
import { absoluteUrl, cleanMetaText } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublishedProduct(slug);
  if ("error" in result) return { title: "Product unavailable", robots: { index: false, follow: false } };
  const title = cleanMetaText(result.product.title, "Digital product");
  const description = cleanMetaText(result.product.description, `Download ${title} from Studic.`);
  return {
    title,
    description,
    alternates: { canonical: `/product/${slug}` },
    openGraph: { type: "website", title, description, url: absoluteUrl(`/product/${slug}`), images: result.product.thumbnail ? [{ url: result.product.thumbnail }] : undefined },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getPublishedProduct(slug);
  const product = "error" in result ? null : result.product;
  return (
    <>
      {product && (
        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.title,
          description: product.description,
          image: product.thumbnail || undefined,
          url: absoluteUrl(`/product/${slug}`),
          offers: { "@type": "Offer", price: Number(product.price || 0), priceCurrency: product.currency || "INR", availability: "https://schema.org/InStock", url: absoluteUrl(`/product/${slug}`) },
        }} />
      )}
      <ProductDetail slug={slug} />
    </>
  );
}
