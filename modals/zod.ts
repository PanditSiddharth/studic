import { z } from "zod";

const slugSchema = z.string().trim().min(1, "Slug is required").max(180)
  .regex(/^(?!-)(?!.*--)[a-z0-9-]+(?<!-)$/, "Use lowercase letters, numbers and single hyphens");

const tagsSchema = z.array(z.string().trim().min(1)).default([]);
const urlOrEmpty = z.string().url().or(z.literal("")).optional();

const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address");

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password"),
});

export const signUpSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name").max(60, "Keep your name under 60 characters"),
    email: emailSchema,
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .max(72, "Keep your password under 72 characters")
      .regex(/[A-Za-z]/, "Include at least one letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;

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
  title: z.string().trim().min(1, "Add a product title").max(160, "Keep the title under 160 characters"),
  description: z.string().max(10000).default(""),
  price: z.number().min(0, "Price cannot be negative"),
  currency: z.string().length(3).default("INR"),
  tags: tagsSchema,
  thumbnail: urlOrEmpty,
  fileLink: z.string().url("Enter a valid file URL").or(z.literal("")).optional(),
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
  title: z.string().trim().min(1, "Add a blog title").max(160, "Keep the title under 160 characters"),
  status: z.enum(["draft", "private", "public", "unlisted", "free", "paid"]).default("draft"),
  accessType: z.enum(["free", "paid"]).default("free"),
  price: z.number().min(0, "Price cannot be negative").default(0),
  currency: z.string().length(3).default("INR"),
  description: z.string().max(10000).default(""),
  thumbnail: urlOrEmpty,
  content: z.string().default(""),
  tags: tagsSchema,
  category: tagsSchema,
  products: z.array(z.any()).default([]),
  author: z.string().optional(),
  course: z.string().optional(),
  estimatedMinutes: z.number().int().nonnegative().optional(),
  seoTitle: z.string().max(160, "Keep the SEO title under 160 characters").optional(),
  seoDescription: z.string().max(320, "Keep the SEO description under 320 characters").optional(),
  publishedAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  _id: z.string().optional(),
});

export const ZodCourseSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(1, "Add a course title").max(160, "Keep the title under 160 characters"),
  status: z.enum(["draft", "private", "published", "unlisted", "archived"]).default("draft"),
  accessType: z.enum(["free", "paid"]).default("free"),
  price: z.number().min(0, "Price cannot be negative").default(0),
  currency: z.string().length(3).default("INR"),
  description: z.string().trim().min(1, "Add a course description").max(10000),
  thumbnail: z.string().min(1, "Upload a cover image"),
  content: z.array(z.any()).default([]),
  products: z.array(z.any()).default([]),
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
