import type { MetadataRoute } from "next";
import connectDB from "@/connectDB";
import { BlogModel } from "@/modals/blog.model";
import { CourseModel } from "@/modals/course.model";
import { ProductModel } from "@/modals/product.model";
import { normalizeBlogCategories } from "@/helpers";
import { absoluteUrl, resolveCanonical } from "@/lib/seo";
import { toUrlSlug } from "@/lib/slug";

const staticPages = [
  "/", "/courses", "/products", "/blogs", "/about", "/contact", "/privacy", "/tnc", "/refund",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connectDB();

  const [blogs, courses, products] = await Promise.all([
    BlogModel.find({
      $and: [
        { $or: [{ status: { $in: ["public", "free", "paid"] } }, { status: { $exists: false } }] },
        { noindex: { $ne: true } },
      ],
    })
      .select("slug category updatedAt publishedAt canonicalUrl")
      .lean(),
    CourseModel.find({ status: "published", noindex: { $ne: true } })
      .select("slug updatedAt publishedAt canonicalUrl")
      .lean(),
    ProductModel.find({
      $and: [
        { $or: [{ status: "published" }, { status: { $exists: false } }] },
        { noindex: { $ne: true } },
      ],
    })
      .select("slug updatedAt publishedAt canonicalUrl")
      .lean(),
  ]);

  const entries = [
    ...staticPages.map((path) => ({
      url: absoluteUrl(path),
      changeFrequency: path === "/" ? "daily" as const : "weekly" as const,
      priority: path === "/" ? 1 : 0.7,
    })),
    ...courses.map((course) => ({
      url: resolveCanonical(`/course/${course.slug}`, course.canonicalUrl),
      lastModified: course.updatedAt || course.publishedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...blogs.map((blog) => {
      const category = normalizeBlogCategories(blog.category)[0];
      return {
        url: resolveCanonical(`/t/${category ? `${toUrlSlug(category)}/` : ""}${blog.slug}`, blog.canonicalUrl),
        lastModified: blog.updatedAt || blog.publishedAt,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      };
    }),
    ...products.map((product) => ({
      url: resolveCanonical(`/product/${product.slug}`, product.canonicalUrl),
      lastModified: product.updatedAt || product.publishedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
  return [...new Map(entries.map((entry) => [entry.url, entry])).values()];
}
