import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import connectDB from "@/connectDB";
import { EnrollmentModel } from "@/modals/enrollment.model";
import { OrderModel, type IOrder } from "@/modals/order.model";
import { getRazorpayConfig } from "@/lib/razorpay";
import { getSessionUser } from "@/server-functions/user";

type PaymentVerification = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

async function activateCourse(order: IOrder | null) {
  if (!order?.course) return;

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

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session?._id) {
    return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });
  }

  let input: PaymentVerification;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (
    !input ||
    typeof input.razorpay_order_id !== "string" ||
    typeof input.razorpay_payment_id !== "string" ||
    typeof input.razorpay_signature !== "string" ||
    !input.razorpay_order_id ||
    !input.razorpay_payment_id ||
    !input.razorpay_signature
  ) {
    return NextResponse.json({ error: "Payment verification fields are required" }, { status: 400 });
  }

  try {
    const { keySecret } = getRazorpayConfig();
    const expectedSignature = createHmac("sha256", keySecret)
      .update(`${input.razorpay_order_id}|${input.razorpay_payment_id}`)
      .digest("hex");
    const signatureIsHex = /^[a-f\d]{64}$/i.test(input.razorpay_signature);
    const signatureMatches = signatureIsHex && timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(input.razorpay_signature, "hex")
    );
    if (!signatureMatches) {
      return NextResponse.json({ error: "Payment signature is invalid" }, { status: 400 });
    }

    await connectDB();
    const order = await OrderModel.findOne({
      providerOrderId: input.razorpay_order_id,
      buyer: session._id,
    });
    if (!order) {
      return NextResponse.json({ error: "Payment order not found" }, { status: 404 });
    }

    if (order.status === "paid") {
      if (order.providerPaymentId !== input.razorpay_payment_id) {
        return NextResponse.json({ error: "Order was paid with a different payment" }, { status: 400 });
      }
      await activateCourse(order);
      return NextResponse.json({ success: true, order_id: order.orderId });
    }
    if (order.status !== "pending") {
      return NextResponse.json({ error: "This order is no longer payable" }, { status: 400 });
    }

    const paidOrder = await OrderModel.findOneAndUpdate(
      { _id: order._id, status: "pending" },
      {
        $set: {
          status: "paid",
          paidAt: new Date(),
          paymentProvider: "razorpay",
          providerPaymentId: input.razorpay_payment_id,
          transactionId: input.razorpay_payment_id,
        },
      },
      { new: true }
    );
    if (!paidOrder) {
      const currentOrder = await OrderModel.findById(order._id);
      if (currentOrder?.status === "paid" && currentOrder.providerPaymentId === input.razorpay_payment_id) {
        await activateCourse(currentOrder);
        return NextResponse.json({ success: true, order_id: currentOrder.orderId });
      }
      return NextResponse.json({ error: "Order status changed; verify payment again" }, { status: 409 });
    }

    await activateCourse(paidOrder);
    return NextResponse.json({ success: true, order_id: paidOrder.orderId });
  } catch (error) {
    console.error("Razorpay payment verification failed", error);
    return NextResponse.json({ error: "Could not verify this payment" }, { status: 500 });
  }
}
