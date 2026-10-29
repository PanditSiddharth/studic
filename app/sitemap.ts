import type { MetadataRoute } from "next";
import connectDB from "@/connectDB";
import { BlogModel } from "@/modals/blog.model";
import { CourseModel } from "@/modals/course.model";
import { ProductModel } from "@/modals/product.model";
import { absoluteUrl } from "@/lib/seo";

const staticPages = [
  "/", "/courses", "/products", "/blogs", "/about", "/contact", "/privacy", "/tnc", "/refund",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connectDB();

  const [blogs, courses, products] = await Promise.all([
    BlogModel.find({ status: { $in: ["public", "free", "paid"] } })
      .select("slug category updatedAt publishedAt")
      .lean(),
    CourseModel.find({ status: "published" })
      .select("slug updatedAt publishedAt")
      .lean(),
    ProductModel.find({ $or: [{ status: "published" }, { status: { $exists: false } }] })
      .select("slug updatedAt publishedAt")
      .lean(),
  ]);

  return [
    ...staticPages.map((path) => ({
      url: absoluteUrl(path),
      changeFrequency: path === "/" ? "daily" as const : "weekly" as const,
      priority: path === "/" ? 1 : 0.7,
    })),
    ...courses.map((course) => ({
      url: absoluteUrl(`/course/${course.slug}`),
      lastModified: course.updatedAt || course.publishedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...blogs.map((blog) => ({
      url: absoluteUrl(`/t/${Array.isArray(blog.category) && blog.category[0] ? `${blog.category[0]}/` : ""}${blog.slug}`),
      lastModified: blog.updatedAt || blog.publishedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...products.map((product) => ({
      url: absoluteUrl(`/product/${product.slug}`),
      lastModified: product.updatedAt || product.publishedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
