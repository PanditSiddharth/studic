import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const normalizeText = (value: string) =>
  value.replace(/<[^>]+>/g, "").replace(/[*_`~]/g, "").replace(/\s+/g, " ").trim().toLowerCase();

const normalizeUrl = (value: string) =>
  value.trim().replace(/^<|>$/g, "").replace(/[?#].*$/, "").replace(/\/+$/, "").toLowerCase();

const markdownImagePattern = /!\[[^\]]*]\(\s*<?([^)\s>]+)>?(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/g;
const htmlImagePattern = /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi;

const sameImage = (source: string, thumbnail: string) => {
  const normalizedSource = normalizeUrl(source);
  if (normalizedSource === thumbnail) return true;

  try {
    return decodeURIComponent(normalizedSource) === decodeURIComponent(thumbnail);
  } catch {
    return false;
  }
};

/**
 * The article header already renders the title and cover image. Older articles
 * often repeat both at the top of their Markdown body, which made the cover (and
 * heading) appear twice. Strip only duplicates: a leading H1 with the same title
 * and every image that points at the same file as the cover.
 */
export function cleanArticleContent(
  content?: string,
  options: { title?: string; thumbnail?: string } = {}
): string {
  let result = String(content || "");
  if (!result.trim()) return result;

  if (options.title) {
    const title = normalizeText(options.title);
    result = result.replace(/^\s*#\s+(.+?)\s*#*\s*(?:\r?\n|$)/, (match, heading) =>
      normalizeText(String(heading)) === title ? "" : match
    );
  }

  if (options.thumbnail) {
    const thumbnail = normalizeUrl(options.thumbnail);
    if (thumbnail) {
      result = result
        .replace(markdownImagePattern, (match, src) => sameImage(String(src), thumbnail) ? "" : match)
        .replace(htmlImagePattern, (match, src) => sameImage(String(src), thumbnail) ? "" : match);
    }
  }

  // Remove accidentally pasted identical images that sit next to each other.
  const seen = new Set<string>();
  result = result
    .split(/\r?\n/)
    .filter((line) => {
      const image = line.match(/^\s*!\[[^\]]*]\(\s*<?([^)\s>]+)>?[^)]*\)\s*$/);
      if (!image) return true;
      const src = normalizeUrl(image[1]);
      if (seen.has(src)) return false;
      seen.add(src);
      return true;
    })
    .join("\n");

  return result.replace(/\n{3,}/g, "\n\n").trim();
}
