import type { Metadata } from "next";
import BlogArticle from "@/components/blog/blog-article";
import JsonLd from "@/components/seo/json-ld";
import { getBlog } from "@/server-functions/blog";
import { absoluteUrl, cleanMetaText } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const resolved = await params;
  const slug = resolved.slug.length > 1 ? resolved.slug[1] : resolved.slug[0];
  const category = resolved.slug.length > 1 ? resolved.slug[0] : undefined;
  const result = await getBlog({ slug, category });
  if ("error" in result) return { title: "Article unavailable", robots: { index: false, follow: false } };
  const title = cleanMetaText(result.title, "Article");
  const description = cleanMetaText(result.description, `Read ${title} on Studic.`);
  const path = `/t/${category ? `${category}/` : ""}${slug}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "article", title, description, url: absoluteUrl(path), publishedTime: result.publishedAt ? new Date(result.publishedAt).toISOString() : undefined, images: result.thumbnail ? [{ url: result.thumbnail }] : undefined },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string[] }> }) {
  const resolved = await params;
  const slug = resolved.slug.length > 1 ? resolved.slug[1] : resolved.slug[0];
  const category = resolved.slug.length > 1 ? resolved.slug[0] : undefined;
  const result = await getBlog({ slug, category });
  const article = "error" in result ? null : result;
  const path = `/t/${category ? `${category}/` : ""}${slug}`;
  return (
    <>
      {article && (
        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.description,
          image: article.thumbnail ? [article.thumbnail] : undefined,
          datePublished: article.publishedAt ? new Date(article.publishedAt).toISOString() : undefined,
          dateModified: article.updatedAt ? new Date(article.updatedAt).toISOString() : undefined,
          mainEntityOfPage: absoluteUrl(path),
          author: { "@type": "Organization", name: "Studic" },
          publisher: { "@type": "Organization", name: "Studic", url: absoluteUrl("/") },
        }} />
      )}
      <BlogArticle params={resolved} />
    </>
  );
}
