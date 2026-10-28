import { z } from "zod";

const slugSchema = z.string().trim().min(1, "Slug is required").max(180)
  .regex(/^(?!-)(?!.*--)[a-z0-9-]+(?<!-)$/, "Use lowercase letters, numbers and single hyphens");

const tagsSchema = z.array(z.string().trim().min(1)).default([]);
const urlOrEmpty = z.string().url().or(z.literal("")).optional();

export const userSettingsSchema = z.object({
  name: z.string().trim().min(1).max(100),
  username: z.string().trim().min(2).max(30).regex(/^[A-Za-z0-9_-]+$/),
  about: z.string().max(500).optional(),
  role: z.enum(["student", "seller", "admin"]),
  status: z.enum(["active", "suspended", "deleted"]).optional(),
  image: z.string().optional(),
  phone: z.union([z.string(), z.number()]).optional(),
  account: z.string().optional(),
  ifsc: z.string().optional(),
});

export const ZodUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  username: z.string().trim().min(2).max(30).regex(/^[A-Za-z0-9_-]+$/),
  email: z.string().trim().email(),
  phone: z.union([z.string(), z.number()]).optional(),
  image: z.string().url().or(z.literal("")),
  role: z.enum(["student", "seller", "admin"]),
  status: z.enum(["active", "suspended", "deleted"]).optional(),
  about: z.string().max(500).optional(),
});

export const ZodProductScema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().max(10000).default(""),
  price: z.number().min(0),
  currency: z.string().length(3).default("INR"),
  tags: tagsSchema,
  thumbnail: urlOrEmpty,
  fileLink: z.string().url().optional(),
  slug: slugSchema,
  status: z.enum(["draft", "published", "archived"]).optional(),
  seller: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().nonnegative().optional(),
  mimeType: z.string().optional(),
  downloadLimit: z.number().int().positive().nullable().optional(),
  createdOn: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  _id: z.string().optional(),
});

export const ZodBlogSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(1).max(160),
  status: z.enum(["draft", "private", "public", "unlisted", "free", "paid"]).default("draft"),
  description: z.string().max(10000).default(""),
  thumbnail: urlOrEmpty,
  content: z.string().default(""),
  tags: tagsSchema,
  category: tagsSchema,
  products: z.array(z.any()).default([]),
  author: z.string().optional(),
  course: z.string().optional(),
  estimatedMinutes: z.number().int().nonnegative().optional(),
  seoTitle: z.string().max(160).optional(),
  seoDescription: z.string().max(320).optional(),
  publishedAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  _id: z.string().optional(),
});

export const ZodCourseSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(1).max(160),
  status: z.enum(["draft", "private", "published", "unlisted", "archived"]).default("draft"),
  accessType: z.enum(["free", "paid"]).default("free"),
  price: z.number().min(0).default(0),
  currency: z.string().length(3).default("INR"),
  description: z.string().trim().min(1).max(10000),
  thumbnail: z.string().min(1),
  content: z.array(z.any()).default([]),
  tags: tagsSchema,
  author: z.string().optional(),
  landingPage: z.string().optional(),
  level: z.enum(["beginner", "intermediate", "advanced", "all-levels"]).optional(),
  language: z.string().optional(),
  estimatedMinutes: z.number().int().nonnegative().optional(),
  prerequisites: z.array(z.string()).optional(),
  publishedAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  _id: z.string().optional(),
});
