export const DOMAIN = (
  process.env.NEXT_PUBLIC_DOMAIN ||
  process.env.DOMAIN ||
  "https://www.studic.in"
).replace(/\/+$/, "");

export function absoluteUrl(path = "/") {
  return new URL(path.startsWith("/") ? path : `/${path}`, DOMAIN).toString();
}

export function cleanMetaText(value: unknown, fallback: string) {
  const text = String(value || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

