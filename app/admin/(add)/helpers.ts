import { IBlog } from "@/modals/blog.model"
import { ICourse } from "@/modals/course.model";
import { IProduct } from "@/modals/product.model"

interface ICommon {
  _id?: string;
  slug?: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  tags?: string[];
  publishedAt?: Date;
}

export const common = <T extends ICommon>(initial: Partial<T> = {}) => {
  return {
    _id: initial?._id || "",
    slug: initial?.slug || "",
    title: initial?.title || "",
    description: initial?.description || "",
    thumbnail: initial?.thumbnail || "",
    tags: initial?.tags || [],
    publishedAt: initial?.publishedAt ? new Date(initial.publishedAt) : undefined,
  };
};

export const getCourseDefault = (initial: Partial<ICourse> = {}) => {
  return {
    ...common(initial),
    status: initial?.status || "draft",
    accessType: initial?.accessType || ((initial?.price ?? 0) > 0 ? "paid" : "free"),
    price: initial?.price ?? 0,
    currency: initial?.currency || "INR",
    level: initial?.level || "all-levels",
    language: initial?.language || "",
    estimatedMinutes: initial?.estimatedMinutes ?? 0,
    prerequisites: initial?.prerequisites || [],
    landingPage: initial?.landingPage || "",
    content: initial?.content || [],
    author: initial?.author ? String(initial.author) : "",
  };
};

export const getBlogDefaults = (initial: Partial<IBlog> = {}) => {
  return {
    ...common(initial),
    status: initial?.status || "draft",
    content: initial?.content || "",
    category: initial?.category || [],
    products: toIdList(initial?.products),
    author: initial?.author ? String(initial.author) : "",
    estimatedMinutes: initial?.estimatedMinutes ?? 0,
    seoTitle: initial?.seoTitle || "",
    seoDescription: initial?.seoDescription || "",
    updatedAt: initial?.updatedAt || new Date(),
  }
}

export const getProductDefault = (initial: Partial<IProduct> = {}) => {
  return {
    ...common(initial),
    price: initial?.price ?? 0,
    currency: initial?.currency || "INR",
    status: initial?.status || "draft",
    fileLink: initial?.fileLink || "",
    fileName: initial?.fileName || "",
    fileSize: initial?.fileSize ?? 0,
    mimeType: initial?.mimeType || "",
    downloadLimit: initial?.downloadLimit ?? null,
  }
}

/** Converts an arbitrary title into a URL-safe slug. */export function generateSlug(title: string = "") {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

export function isValidSlug(slug?: string) {
  return !!slug && /^(?!-)(?!.*--)[a-z0-9-]+(?<!-)$/.test(slug);
}

/** Normalises a list of mixed ids/objects (e.g. populated refs) into string ids. */
export function toIdList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "_id" in item) return String((item as { _id: unknown })._id);
      return "";
    })
    .filter(Boolean);
}

/**
 * Server actions normally resolve to `{ error }`, but a few legacy code paths
 * resolve to a plain message string. Normalise both so the forms can always show
 * a useful toast instead of crashing.
 */
export function getActionError(result: unknown): string | null {
  if (result == null) return "Something went wrong. Please try again.";
  if (typeof result === "string") return result;
  if (typeof result === "object" && "error" in result) {
    const message = (result as { error?: unknown }).error;
    return message ? String(message) : "Something went wrong. Please try again.";
  }
  return null;
}
