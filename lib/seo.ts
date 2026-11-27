import type { Metadata } from "next";

export const DOMAIN = (
  process.env.NEXT_PUBLIC_DOMAIN ||
  process.env.DOMAIN ||
  "https://studic.in"
).replace(/\/+$/, "");

export function absoluteUrl(path = "/") {
  return new URL(path.startsWith("/") ? path : `/${path}`, DOMAIN).toString();
}

export function resolveCanonical(path: string, override?: string) {
  const fallback = new URL(absoluteUrl(path));
  const value = String(override || "").trim();
  if (!value) return fallback.toString();

  try {
    const candidate = value.startsWith("/") && !value.startsWith("//")
      ? new URL(value, DOMAIN)
      : new URL(value);
    if (candidate.origin !== new URL(DOMAIN).origin) return fallback.toString();
    candidate.search = "";
    candidate.hash = "";
    if (candidate.pathname.length > 1) candidate.pathname = candidate.pathname.replace(/\/+$/, "");
    return candidate.toString();
  } catch {
    return fallback.toString();
  }
}

export function cleanMetaText(value: unknown, fallback: string, maxLength = 320) {
  const text = String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/[`*_~>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const result = text || fallback;
  if (result.length <= maxLength) return result;
  const shortened = result.slice(0, maxLength - 1);
  const boundary = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, boundary > maxLength * 0.7 ? boundary : shortened.length).trimEnd()}…`;
}

export function isoDate(value?: Date | string) {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export type SeoMetadataInput = {
  path: string;
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  type?: "website" | "article";
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
  noindex?: boolean;
  publishedTime?: Date | string;
  modifiedTime?: Date | string;
};

function validImageUrl(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  try {
    const url = new URL(value, DOMAIN);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

export function createPageMetadata(input: SeoMetadataInput): Metadata {
  const canonical = resolveCanonical(input.path, input.canonicalUrl);
  const title = cleanMetaText(input.seoTitle, input.title, 160);
  const description = cleanMetaText(input.seoDescription, input.description);
  const image = validImageUrl(input.ogImage || input.image, absoluteUrl("/studic-og.png"));
  const imageAlt = cleanMetaText(input.imageAlt, title, 160);
  const publishedTime = isoDate(input.publishedTime);
  const modifiedTime = isoDate(input.modifiedTime);

  return {
    title,
    description,
    keywords: input.seoKeywords?.length ? input.seoKeywords : undefined,
    alternates: { canonical },
    robots: { index: !input.noindex, follow: true },
    openGraph: {
      type: input.type || "website",
      siteName: "Studic",
      title,
      description,
      url: canonical,
      images: [{ url: image, alt: imageAlt, width: 1200, height: 630 }],
      ...(input.type === "article" ? { publishedTime, modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: image, alt: imageAlt }],
    },
  };
}

export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
