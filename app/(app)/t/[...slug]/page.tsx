import type { Metadata } from "next";
import { cache } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import BlogArticle from "@/components/blog/blog-article";
import JsonLd from "@/components/seo/json-ld";
import { getBlog } from "@/server-functions/blog";
import { isHiddenBlogStatus, isListedBlogStatus } from "@/helpers";
import { toUrlSlug } from "@/lib/slug";
import { absoluteUrl, breadcrumbSchema, cleanMetaText, createPageMetadata, isoDate, resolveCanonical } from "@/lib/seo";

type Props = { params: Promise<{ slug: string[] }> };

const loadBlog = cache((slug: string, category?: string) => getBlog({ slug, category }));

function articlePath(article: { slug?: string; category?: unknown }) {
  const categories = Array.isArray(article.category) ? article.category : [];
  const category = categories.length ? toUrlSlug(categories[0]) : "";
  return `/t/${category ? `${category}/` : ""}${article.slug || ""}`;
}

async function loadArticle(params: Props["params"]) {
  const resolved = await params;
  if (!resolved.slug.length || resolved.slug.length > 2) notFound();

  const slug = resolved.slug.length === 2 ? resolved.slug[1] : resolved.slug[0];
  const category = resolved.slug.length === 2 ? resolved.slug[0] : undefined;
  const result = await loadBlog(slug.toLowerCase(), category);
  if ("error" in result) {
    if (result.error === "No blog found" || result.error === "Invalid Url") notFound();
    throw new Error(result.error);
  }
  return { resolved, result };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolved = await params;
  if (!resolved.slug.length || resolved.slug.length > 2) {
    return createPageMetadata({
      path: "/blogs",
      title: "Article unavailable",
      description: "This article could not be found.",
      noindex: true,
    });
  }

  const slug = resolved.slug.length === 2 ? resolved.slug[1] : resolved.slug[0];
  const category = resolved.slug.length === 2 ? resolved.slug[0] : undefined;
  const result = await loadBlog(slug.toLowerCase(), category);
  if ("error" in result) {
    if (result.error !== "No blog found" && result.error !== "Invalid Url") throw new Error(result.error);
    return createPageMetadata({
      path: `/t/${resolved.slug.join("/")}`,
      title: "Article unavailable",
      description: "This article could not be found.",
      noindex: true,
    });
  }

  const path = articlePath(result);
  const title = cleanMetaText(result.title, "Article");
  return createPageMetadata({
    path,
    title,
    description: cleanMetaText(result.seoDescription || result.description, `Read ${title} on Studic.`),
    image: result.thumbnail,
    ogImage: result.ogImage,
    seoTitle: result.seoTitle,
    seoDescription: result.seoDescription,
    seoKeywords: result.seoKeywords,
    canonicalUrl: result.canonicalUrl,
    type: "article",
    publishedTime: result.publishedAt,
    modifiedTime: result.updatedAt,
    noindex: result.noindex || result.status === "unlisted" || isHiddenBlogStatus(result.status),
  });
}

export default async function ArticlePage({ params }: Props) {
  const { resolved, result } = await loadArticle(params);
  const path = articlePath(result);
  if (!result.canonicalUrl && resolved.slug.join("/") !== path.slice(3)) {
    permanentRedirect(path);
  }

  const canonical = resolveCanonical(path, result.canonicalUrl);
  const isPublic = (isListedBlogStatus(result.status) || !result.status) &&
    !isHiddenBlogStatus(result.status) &&
    result.status !== "unlisted" &&
    !result.noindex;

  return (
    <>
      {isPublic ? (
        <JsonLd data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "BlogPosting",
              headline: result.title,
              description: cleanMetaText(result.seoDescription || result.description, `Read ${result.title || "this article"} on Studic.`),
              image: result.ogImage || result.thumbnail || undefined,
              datePublished: isoDate(result.publishedAt),
              dateModified: isoDate(result.updatedAt),
              mainEntityOfPage: canonical,
              publisher: { "@type": "Organization", "@id": `${absoluteUrl("/")}#organization`, name: "Studic", url: absoluteUrl("/") },
              articleSection: Array.isArray(result.category) ? result.category : undefined,
              keywords: Array.isArray(result.tags) ? result.tags : undefined,
            },
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Articles", path: "/blogs" },
              { name: String(result.title || "Article"), path },
            ]),
          ],
        }} />
      ) : null}
      <BlogArticle key={path} params={resolved} initialBlog={result} />
    </>
  );
}
