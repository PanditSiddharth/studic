"use server";

import connectDB from "@/connectDB";
import { getSessionUser } from "@/server-functions/user";
import { CourseModel } from "@/modals/course.model";
import { BlogModel } from "@/modals/blog.model";
import { ProductModel } from "@/modals/product.model";
import { OrderModel } from "@/modals/order.model";
import { EnrollmentModel } from "@/modals/enrollment.model";
import mongoose from "mongoose";
import { deleteCloudinaryAssets } from "@/lib/cloudinary";

type ContentKind = "courses" | "blogs" | "products";

async function requireAdmin() {
  const user = await getSessionUser();
  return user?.role === "admin" ? user : null;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function searchAdminContent(kind: ContentKind, search = "", skip = 0, limit = 20) {
  if (!(await requireAdmin())) return { error: "Unauthorized" as const };
  await connectDB();
  const safeSearch = escapeRegex(search.trim().slice(0, 100));
  const query = safeSearch ? { $or: [
    { title: { $regex: safeSearch, $options: "i" } },
    { slug: { $regex: safeSearch, $options: "i" } },
    { description: { $regex: safeSearch, $options: "i" } },
    { tags: { $regex: safeSearch, $options: "i" } },
  ] } : {};
  const [items, total] = await Promise.all([
    kind === "courses"
      ? CourseModel.find(query).sort({ updatedAt: -1, _id: -1 }).skip(Math.max(0, skip)).limit(Math.min(50, Math.max(1, limit))).lean()
      : kind === "blogs"
        ? BlogModel.find(query).sort({ updatedAt: -1, _id: -1 }).skip(Math.max(0, skip)).limit(Math.min(50, Math.max(1, limit))).lean()
        : ProductModel.find(query).sort({ updatedAt: -1, _id: -1 }).skip(Math.max(0, skip)).limit(Math.min(50, Math.max(1, limit))).lean(),
    kind === "courses" ? CourseModel.countDocuments(query) : kind === "blogs" ? BlogModel.countDocuments(query) : ProductModel.countDocuments(query),
  ]);
  return JSON.parse(JSON.stringify({ items, total }));
}

export async function deleteAdminContent(kind: ContentKind, ids: string | string[]) {
  if (!(await requireAdmin())) return { error: "Unauthorized" as const };
  const list = (Array.isArray(ids) ? ids : [ids]).filter((id) => mongoose.isValidObjectId(id));
  if (!list.length) return { error: "Select at least one valid record." };
  await connectDB();
  if (kind === "courses") {
    // Courses are independent from their lessons/products, but access and purchase
    // records must disappear when the course itself is deleted.
    const courses = await CourseModel.find({ _id: { $in: list } }).select("thumbnail").lean();
    await BlogModel.updateMany({ course: { $in: list } }, { $unset: { course: 1 } });
    await EnrollmentModel.deleteMany({ course: { $in: list } });
    await OrderModel.deleteMany({ course: { $in: list } });
    const result = await CourseModel.deleteMany({ _id: { $in: list } });
    if (result.deletedCount) await deleteCloudinaryAssets(courses.map((course) => course.thumbnail));
    return { success: true, deletedCount: result.deletedCount || 0 };
  }
  if (kind === "blogs") {
    // Remove deleted articles from course playlists before deleting them.
    await CourseModel.updateMany({ content: { $in: list } }, { $pull: { content: { $in: list } } });
    const blogs = await BlogModel.find({ _id: { $in: list } }).select("thumbnail").lean();
    await OrderModel.deleteMany({ blog: { $in: list } });
    const result = await BlogModel.deleteMany({ _id: { $in: list } });
    if (result.deletedCount) await deleteCloudinaryAssets(blogs.map((blog) => blog.thumbnail));
    return { success: true, deletedCount: result.deletedCount || 0 };
  }
  // Products referenced by blog articles and course bundles are detached before deletion.
  await BlogModel.updateMany({ products: { $in: list } }, { $pull: { products: { $in: list } } });
  await CourseModel.updateMany({ products: { $in: list } }, { $pull: { products: { $in: list } } });
  const products = await ProductModel.find({ _id: { $in: list } }).select("thumbnail fileLink").lean();
  await OrderModel.deleteMany({ product: { $in: list } });
  const result = await ProductModel.deleteMany({ _id: { $in: list } });
  if (result.deletedCount) await deleteCloudinaryAssets(products.flatMap((product) => [product.thumbnail, product.fileLink]));
  return { success: true, deletedCount: result.deletedCount || 0 };
}

export async function updateAdminVisibility(kind: "courses" | "blogs" | "products", id: string, status: string) {
  if (!(await requireAdmin())) return { error: "Unauthorized" as const };
  if (!mongoose.isValidObjectId(id)) return { error: "Invalid record id." };
  const allowed = kind === "courses"
    ? ["draft", "private", "published", "archived", "unlisted"]
    : kind === "blogs"
      ? ["draft", "private", "public", "unlisted", "free", "paid"]
      : ["draft", "published", "archived"];
  if (!allowed.includes(status)) return { error: "Invalid status." };
  await connectDB();
  const update = { $set: { status, ...(status === "published" || status === "public" ? { publishedAt: new Date() } : {}) } };
  const updated = kind === "courses"
    ? await CourseModel.findByIdAndUpdate(id, update, { new: true }).select("_id status").lean()
    : kind === "blogs"
      ? await BlogModel.findByIdAndUpdate(id, update, { new: true }).select("_id status").lean()
      : await ProductModel.findByIdAndUpdate(id, update, { new: true }).select("_id status").lean();
  if (!updated) return { error: "Record not found." };
  return { success: true, item: JSON.parse(JSON.stringify(updated)) };
}

/** Toggle free/paid access for article records without touching visibility. */
export async function updateAdminAccess(kind: "blogs", id: string, accessType: "free" | "paid") {
  if (!(await requireAdmin())) return { error: "Unauthorized" as const };
  if (!mongoose.isValidObjectId(id)) return { error: "Invalid record id." };
  if (!["free", "paid"].includes(accessType)) return { error: "Invalid access type." };
  await connectDB();
  const existing = await BlogModel.findById(id).select("status").lean();
  if (!existing) return { error: "Record not found." };
  // Move records that still use the legacy free/paid status onto the separate
  // visibility + access fields.
  const legacyStatus = ["free", "paid"].includes(String(existing.status));
  const update = accessType === "free"
    ? { $set: { accessType, price: 0, ...(legacyStatus ? { status: "public" } : {}) } }
    : { $set: { accessType, ...(legacyStatus ? { status: "public" } : {}) } };
  const updated = await BlogModel.findByIdAndUpdate(id, update, { new: true })
    .select("_id status accessType price").lean();
  if (!updated) return { error: "Record not found." };
  return { success: true, item: JSON.parse(JSON.stringify(updated)) };
}

export async function getAdminProductBySlug(slug: string) {
  if (!(await requireAdmin())) return { error: "Unauthorized" as const };
  await connectDB();
  const product = await ProductModel.findOne({ slug }).lean();
  if (!product) return { error: "Product not found" as const };
  return JSON.parse(JSON.stringify(product));
}
