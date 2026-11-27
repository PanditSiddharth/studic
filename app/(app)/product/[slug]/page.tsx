import type { Metadata } from "next";
import { cache } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import ProductDetail from "@/components/product/product-detail";
import JsonLd from "@/components/seo/json-ld";
import { getPublishedProduct } from "@/server-functions/product";
import { breadcrumbSchema, cleanMetaText, createPageMetadata, resolveCanonical } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

const loadProduct = cache((slug: string) => getPublishedProduct(slug));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const normalizedSlug = slug.toLowerCase();
  const result = await loadProduct(normalizedSlug);
  if ("error" in result) {
    return createPageMetadata({
      path: `/product/${normalizedSlug}`,
      title: "Product unavailable",
      description: "This product could not be found.",
      noindex: true,
    });
  }

  const product = result.product;
  const title = cleanMetaText(product.title, "Digital product");
  return createPageMetadata({
    path: `/product/${normalizedSlug}`,
    title,
    description: cleanMetaText(product.description, `Download ${title} from Studic.`),
    image: product.thumbnail,
    ogImage: product.ogImage,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    seoKeywords: product.seoKeywords,
    canonicalUrl: product.canonicalUrl,
    noindex: product.noindex,
  });
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const normalizedSlug = slug.toLowerCase();
  if (slug !== normalizedSlug) permanentRedirect(`/product/${normalizedSlug}`);

  const result = await loadProduct(normalizedSlug);
  if ("error" in result) {
    if (result.error === "This product could not be found") notFound();
    throw new Error(result.error);
  }

  const product = result.product;
  const path = `/product/${normalizedSlug}`;
  const canonical = resolveCanonical(path, product.canonicalUrl);
  const isPublic = product.status !== "archived" && !product.noindex;

  return (
    <>
      {isPublic ? (
        <JsonLd data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Product",
              name: product.title,
              description: product.description,
              image: product.ogImage || product.thumbnail || undefined,
              url: canonical,
              offers: {
                "@type": "Offer",
                price: Number(product.price || 0),
                priceCurrency: product.currency || "INR",
                availability: "https://schema.org/InStock",
                url: canonical,
              },
            },
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Products", path: "/products" },
              { name: String(product.title || "Product"), path },
            ]),
          ],
        }} />
      ) : null}
      <ProductDetail key={normalizedSlug} slug={normalizedSlug} initialData={result} />
    </>
  );
}
