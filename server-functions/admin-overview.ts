"use server";

import connectDB from "@/connectDB";
import { getSessionUser } from "@/server-functions/user";
import { UserModel } from "@/modals/user.model";
import { CourseModel } from "@/modals/course.model";
import { BlogModel } from "@/modals/blog.model";
import { ProductModel } from "@/modals/product.model";
import { OrderModel } from "@/modals/order.model";
import { EnrollmentModel } from "@/modals/enrollment.model";
import { ReviewModel } from "@/modals/review.model";
import { QueryModel } from "@/modals/query.model";
import { ContributionModel } from "@/modals/contribution.model";

/** Admin-only, database-backed overview. Never return financial/customer details here. */
export async function getAdminOverview() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return { error: "Unauthorized" as const };

  await connectDB();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [
    users, courses, articles, products, orders, paidOrders,
    enrollments, pendingReviews, openQueries, pendingContributions, recentOrders, recentCourses,
  ] = await Promise.all([
    UserModel.countDocuments({ status: { $ne: "deleted" } }),
    CourseModel.countDocuments(),
    BlogModel.countDocuments(),
    ProductModel.countDocuments(),
    OrderModel.countDocuments(),
    OrderModel.countDocuments({ status: "paid", createdOn: { $gte: monthStart } }),
    EnrollmentModel.countDocuments({ status: "active" }),
    ReviewModel.countDocuments({ status: "pending" }),
    QueryModel.countDocuments({ status: { $in: ["open", "in_progress"] } }),
    ContributionModel.countDocuments({ status: "pending" }),
    OrderModel.find().sort({ createdOn: -1 }).limit(5).select("orderId status amount currency itemType createdOn").lean(),
    CourseModel.find().sort({ updatedAt: -1 }).limit(5).select("title slug status accessType price updatedAt").lean(),
  ]);

  const monthlyRevenue = await OrderModel.aggregate([
    { $match: { status: "paid", createdOn: { $gte: monthStart } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  return JSON.parse(JSON.stringify({
    stats: { users, courses, articles, products, orders, activeEnrollments: enrollments,
      pendingReviews, openQueries, pendingContributions, monthlyRevenue: monthlyRevenue[0]?.total ?? 0 },
    recentOrders, recentCourses,
  }));
}
