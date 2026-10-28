"use server";

import mongoose from "mongoose";
import connectDB from "@/connectDB";
import { EnrollmentModel } from "@/modals/enrollment.model";
import { OrderModel } from "@/modals/order.model";
import { getSessionUser } from "./user";

const orderQuery = (orderId: string) =>
  mongoose.isValidObjectId(orderId)
    ? { $or: [{ orderId }, { _id: orderId }] }
    : { orderId };

/**
 * Confirm an order manually (bank transfer / UPI / free claim). Marks the order
 * paid and, for course orders, opens the learner's enrollment.
 */
export async function markOrderPaid(orderId: string) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") return { error: "Administrator access required" };
  if (!orderId) return { error: "Choose an order" };

  try {
    await connectDB();
    const order = await OrderModel.findOneAndUpdate(
      orderQuery(orderId),
      { status: "paid", paidAt: new Date(), paymentProvider: "manual" },
      { new: true }
    );
    if (!order) return { error: "Order not found" };

    if (order.course) {
      await EnrollmentModel.updateOne(
        { user: order.buyer, course: order.course },
        {
          $setOnInsert: {
            user: order.buyer,
            course: order.course,
            order: order._id,
            enrolledAt: new Date(),
            progressPercent: 0,
          },
          $set: { status: "active" },
        },
        { upsert: true }
      );
    }

    return { success: true, orderId: order.orderId };
  } catch (error: any) {
    console.error("Error confirming order", error);
    return { error: error?.message || "Could not confirm this order" };
  }
}

/** Close an order that will not be fulfilled. */
export async function cancelOrder(orderId: string) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") return { error: "Administrator access required" };
  if (!orderId) return { error: "Choose an order" };

  try {
    await connectDB();
    const order = await OrderModel.findOneAndUpdate(
      orderQuery(orderId),
      { status: "cancelled" },
      { new: true }
    );
    if (!order) return { error: "Order not found" };
    return { success: true, orderId: order.orderId };
  } catch (error: any) {
    console.error("Error cancelling order", error);
    return { error: error?.message || "Could not cancel this order" };
  }
}
