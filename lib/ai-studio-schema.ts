import { z } from "zod";
import type { AIContentType } from "@/modals/ai-studio.model";

const urlOrEmpty = z.string().trim().url().refine((value) => {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}).or(z.literal(""));
const slugSchema = z.string().trim().min(1, "A title that creates a URL slug is required").max(180)
  .regex(/^(?!-)(?!.*--)[a-z0-9-]+(?<!-)$/, "Use lowercase letters, numbers and single hyphens");
const tagsSchema = z.array(z.string().trim().min(1).max(60)).max(30);

export const productAIDraftSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(1, "Title is required").max(160),
  description: z.string().max(10000),
  price: z.number().finite().min(0),
  currency: z.string().trim().length(3).default("INR"),
  tags: tagsSchema,
  thumbnail: urlOrEmpty,
  fileLink: urlOrEmpty,
  fileName: z.string().max(200),
  externalLink: urlOrEmpty,
  externalLinkLabel: z.string().max(40),
  downloadLimit: z.number().int().positive().nullable(),
});

export const articleAIDraftSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(1, "Title is required").max(160),
  description: z.string().max(10000),
  content: z.string().max(200000),
  thumbnail: urlOrEmpty,
  category: tagsSchema,
  tags: tagsSchema,
  products: z.array(z.string()).max(50),
  course: z.string().trim().optional().transform((value) => value || undefined),
  estimatedMinutes: z.number().int().min(0).max(1440),
  seoTitle: z.string().max(160),
  seoDescription: z.string().max(320),
  externalLink: urlOrEmpty,
  externalLinkLabel: z.string().max(40),
});

export type ProductAIDraft = z.infer<typeof productAIDraftSchema>;
export type ArticleAIDraft = z.infer<typeof articleAIDraftSchema>;
export type AIDraftData = ProductAIDraft | ArticleAIDraft;
export type ParsedAIImportRow = { contentType: AIContentType; data: AIDraftData; index: number };
export type AIImportError = { index: number; message: string };

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function stringList(value: unknown) {
  if (typeof value === "string") return value.split(/[,\n]/).map((part) => part.trim()).filter(Boolean);
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string").map((part) => part.trim()).filter(Boolean);
  return [];
}

function numberOrDefault(value: unknown, fallback: number) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function slugifyAIContent(value: string) {
  return value.normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

export function normalizeAIDraft(contentType: AIContentType, raw: unknown) {
  const source = asRecord(raw);
  if (!source) return { success: false as const, error: "Each item must be a JSON object." };
  const title = text(source.title);
  const common = {
    slug: text(source.slug) || slugifyAIContent(title),
    title,
    description: text(source.description),
    thumbnail: text(source.thumbnail),
    tags: stringList(source.tags),
    externalLink: text(source.externalLink),
    externalLinkLabel: text(source.externalLinkLabel),
  };
  const numericPrice = numberOrDefault(source.price, 0);

  if (contentType === "product") {
    const parsed = productAIDraftSchema.safeParse({
      ...common,
      price: numericPrice,
      currency: (text(source.currency) || "INR").toUpperCase(),
      fileLink: text(source.fileLink),
      fileName: text(source.fileName),
      downloadLimit: source.downloadLimit === "" || source.downloadLimit === undefined || source.downloadLimit === null
        ? null
        : numberOrDefault(source.downloadLimit, Number.NaN),
    });
    if (!parsed.success) return { success: false as const, error: parsed.error.issues.map((issue) => `${issue.path.join(".") || "item"}: ${issue.message}`).join("; ") };
    return { success: true as const, contentType, data: parsed.data };
  }

  const parsed = articleAIDraftSchema.safeParse({
    ...common,
    content: text(source.content),
    category: stringList(source.category),
    products: stringList(source.products),
    course: text(source.course),
    estimatedMinutes: numberOrDefault(source.estimatedMinutes, 0),
    seoTitle: text(source.seoTitle),
    seoDescription: text(source.seoDescription),
  });
  if (!parsed.success) return { success: false as const, error: parsed.error.issues.map((issue) => `${issue.path.join(".") || "item"}: ${issue.message}`).join("; ") };
  return { success: true as const, contentType, data: parsed.data };
}

function getImportRows(value: unknown): Array<{ contentType?: string; data: unknown; original: unknown }> {
  if (Array.isArray(value)) {
    return value.map((row) => {
      const source = asRecord(row);
      return { contentType: text(source?.type || source?.kind), data: source?.data ?? row, original: row };
    });
  }

  const source = asRecord(value);
  if (!source) return [];
  const rows: Array<{ contentType?: string; data: unknown; original: unknown }> = [];
  if (Array.isArray(source.products)) rows.push(...source.products.map((data) => ({ contentType: "product", data, original: { type: "product", data } })));
  if (Array.isArray(source.articles)) rows.push(...source.articles.map((data) => ({ contentType: "article", data, original: { type: "article", data } })));
  if (Array.isArray(source.blogs)) rows.push(...source.blogs.map((data) => ({ contentType: "article", data, original: { type: "article", data } })));
  if (rows.length) return rows;
  if (Array.isArray(source.items) && typeof source.type === "string") {
    return source.items.map((data) => ({ contentType: source.type as string, data, original: { type: source.type, data } }));
  }
  return [];
}

export function parseAIImportText(input: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    return { rows: [] as ParsedAIImportRow[], errors: [{ index: 0, message: "Invalid JSON. Check commas, quotes, and brackets." }], invalidRows: [] as unknown[] };
  }

  const sourceRows = getImportRows(parsed);
  if (!sourceRows.length) {
    return {
      rows: [] as ParsedAIImportRow[],
      errors: [{ index: 0, message: "Use an array of typed items, or an object with products/articles arrays." }],
      invalidRows: [] as unknown[],
    };
  }
  if (sourceRows.length > 100) {
    return { rows: [] as ParsedAIImportRow[], errors: [{ index: 0, message: "A single import is limited to 100 items." }], invalidRows: [] as unknown[] };
  }

  const rows: ParsedAIImportRow[] = [];
  const errors: AIImportError[] = [];
  const invalidRows: unknown[] = [];
  const seenSlugs = new Set<string>();
  sourceRows.forEach((row, index) => {
    const normalizedType = row.contentType === "blog" ? "article" : row.contentType;
    if (normalizedType !== "article" && normalizedType !== "product") {
      errors.push({ index: index + 1, message: "Set type to `article` or `product`." });
      invalidRows.push(row.original);
      return;
    }
    const result = normalizeAIDraft(normalizedType, row.data);
    if (!result.success) {
      errors.push({ index: index + 1, message: result.error });
      invalidRows.push(row.original);
      return;
    }
    const slugKey = `${result.contentType}:${result.data.slug}`;
    if (seenSlugs.has(slugKey)) {
      errors.push({ index: index + 1, message: `Duplicate ${result.contentType} slug "${result.data.slug}" in this file.` });
      invalidRows.push(row.original);
      return;
    }
    seenSlugs.add(slugKey);
    rows.push({ contentType: result.contentType, data: result.data, index: index + 1 });
  });
  return { rows, errors, invalidRows };
}
