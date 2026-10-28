"use server";

import connectDB from "@/connectDB";
import { getSessionUser } from "@/server-functions/user";
import { CourseModel } from "@/modals/course.model";
import { BlogModel } from "@/modals/blog.model";
import { ProductModel } from "@/modals/product.model";
import mongoose from "mongoose";

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
  const Model = kind === "courses" ? CourseModel : kind === "blogs" ? BlogModel : ProductModel;
  const [items, total] = await Promise.all([
    Model.find(query).sort({ updatedAt: -1, _id: -1 }).skip(Math.max(0, skip)).limit(Math.min(50, Math.max(1, limit))).lean(),
    Model.countDocuments(query),
  ]);
  return JSON.parse(JSON.stringify({ items, total }));
}

export async function deleteAdminContent(kind: ContentKind, ids: string | string[]) {
  if (!(await requireAdmin())) return { error: "Unauthorized" as const };
  const list = (Array.isArray(ids) ? ids : [ids]).filter((id) => mongoose.isValidObjectId(id));
  if (!list.length) return { error: "Select at least one valid record." };
  await connectDB();
  if (kind === "courses") {
    // Preserve purchased access/order history; detach content relationships rather than deleting linked articles.
    const result = await CourseModel.deleteMany({ _id: { $in: list } });
    return { success: true, deletedCount: result.deletedCount || 0 };
  }
  if (kind === "blogs") {
    // Remove deleted articles from course playlists before deleting them.
    await CourseModel.updateMany({ content: { $in: list } }, { $pull: { content: { $in: list } } });
    const result = await BlogModel.deleteMany({ _id: { $in: list } });
    return { success: true, deletedCount: result.deletedCount || 0 };
  }
  // Products referenced by blog articles are detached before deletion.
  await BlogModel.updateMany({ products: { $in: list } }, { $pull: { products: { $in: list } } });
  const result = await ProductModel.deleteMany({ _id: { $in: list } });
  return { success: true, deletedCount: result.deletedCount || 0 };
}

export async function updateAdminVisibility(kind: "courses" | "blogs", id: string, status: string) {
  if (!(await requireAdmin())) return { error: "Unauthorized" as const };
  if (!mongoose.isValidObjectId(id)) return { error: "Invalid record id." };
  const allowed = kind === "courses"
    ? ["draft", "private", "published", "archived", "unlisted"]
    : ["draft", "private", "public", "unlisted", "free", "paid"];
  if (!allowed.includes(status)) return { error: "Invalid status." };
  await connectDB();
  const Model = kind === "courses" ? CourseModel : BlogModel;
  const updated = await Model.findByIdAndUpdate(id, { $set: { status, ...(status === "published" || status === "public" ? { publishedAt: new Date() } : {}) } }, { new: true }).select("_id status").lean();
  if (!updated) return { error: "Record not found." };
  return { success: true, item: JSON.parse(JSON.stringify(updated)) };
}
