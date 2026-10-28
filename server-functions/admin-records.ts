"use server";

import connectDB from "@/connectDB";
import { getSessionUser } from "@/server-functions/user";
import { OrderModel } from "@/modals/order.model";
import { EnrollmentModel } from "@/modals/enrollment.model";
import { ReviewModel } from "@/modals/review.model";
import { QueryModel } from "@/modals/query.model";

export type AdminRecordKind = "orders" | "enrollments" | "reviews" | "queries";

export async function getAdminRecords(kind: AdminRecordKind) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return { error: "Unauthorized" as const };
  await connectDB();

  let records: unknown[] = [];
  if (kind === "orders") {
    records = await OrderModel.find().sort({ createdOn: -1 }).limit(100)
      .populate("buyer", "name email").populate("product", "title").populate("course", "title").populate("blog", "title").lean();
  } else if (kind === "enrollments") {
    records = await EnrollmentModel.find().sort({ enrolledAt: -1 }).limit(100)
      .populate("user", "name email").populate("course", "title slug").lean();
  } else if (kind === "reviews") {
    records = await ReviewModel.find().sort({ createdOn: -1 }).limit(100)
      .populate("user", "name email").populate("product", "title").populate("course", "title").lean();
  } else {
    records = await QueryModel.find().sort({ createdOn: -1 }).limit(100).lean();
  }
  return JSON.parse(JSON.stringify({ records }));
}
