import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/connectDB";
import { CourseModel } from "@/modals/course.model";
import { EnrollmentModel } from "@/modals/enrollment.model";
import { OrderModel } from "@/modals/order.model";
import { ProductModel } from "@/modals/product.model";
import { UserModel } from "@/modals/user.model";
import { getRazorpayConfig } from "@/lib/razorpay";
import { getSessionUser } from "@/server-functions/user";

type CheckoutItem = { itemType: "product" | "course"; itemId: string };

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session?._id) {
    return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });
  }

  let input: CheckoutItem;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (
    !input ||
    !["product", "course"].includes(input.itemType) ||
    typeof input.itemId !== "string" ||
    !mongoose.isValidObjectId(input.itemId)
  ) {
    return NextResponse.json({ error: "Choose a valid item to purchase" }, { status: 400 });
  }

  try {
    await connectDB();

    let title: string;
    let price: number;
    let currency: string;
    let itemFilter: Record<string, unknown>;

    if (input.itemType === "product") {
      const product = await ProductModel.findOne({
        _id: input.itemId,
        $or: [{ status: "published" }, { status: { $exists: false } }],
      }).select("title price currency");
      if (!product) return NextResponse.json({ error: "This product is not available" }, { status: 404 });
      const purchased = await OrderModel.exists({ buyer: session._id, product: product._id, status: "paid" });
      const bundledCourses = await CourseModel.find({
        products: product._id,
        status: { $in: ["published", "unlisted"] },
      }).distinct("_id");
      const enrolledInBundle = bundledCourses.length
        ? await EnrollmentModel.exists({
          user: session._id,
          course: { $in: bundledCourses },
          status: { $ne: "revoked" },
        })
        : false;
      if (purchased || enrolledInBundle) {
        return NextResponse.json({ error: "You already have access to this product" }, { status: 409 });
      }
      title = product.title;
      price = Number(product.price);
      currency = product.currency || "INR";
      itemFilter = { product: product._id };
    } else {
      const course = await CourseModel.findOne({
        _id: input.itemId,
        status: "published",
      }).select("title price currency accessType");
      if (!course) return NextResponse.json({ error: "This course is not available" }, { status: 404 });
      const [purchased, enrollment] = await Promise.all([
        OrderModel.exists({ buyer: session._id, course: course._id, status: "paid" }),
        EnrollmentModel.exists({ user: session._id, course: course._id, status: { $ne: "revoked" } }),
      ]);
      if (purchased || enrollment) {
        return NextResponse.json({ error: "You already have access to this course" }, { status: 409 });
      }
      title = course.title;
      price = Number(course.price);
      currency = course.currency || "INR";
      itemFilter = { course: course._id };
      if (course.accessType === "free" || price <= 0) {
        return NextResponse.json({ error: "This course does not require payment" }, { status: 400 });
      }
    }

    const amount = Math.round(price * 100);
    currency = currency.toUpperCase();
    if (!Number.isSafeInteger(amount) || amount < 100) {
      return NextResponse.json({ error: "The minimum payment amount is 1.00" }, { status: 400 });
    }
    if (!/^[A-Z]{3}$/.test(currency)) {
      return NextResponse.json({ error: "This item's currency is not supported" }, { status: 400 });
    }

    const { client } = getRazorpayConfig();

    // Razorpay checkout remembers the last contact used in the browser. When we
    // have the signed-in user's phone, prefill their own name/email/phone so the
    // merchant/super-admin email is never shown and checkout skips the contact
    // step. When the phone is missing we send no prefill at all, so Razorpay
    // hides the prefilled contact fields and goes straight to payment methods.
    // Read fresh from the database because the JWT session can be stale.
    const buyer = await UserModel.findById(session._id).select("name email phone").lean();
    const buyerName = String(buyer?.name || session.name || "").trim();
    const buyerEmail = String(buyer?.email || session.email || "").trim();
    const rawPhone = String(buyer?.phone || session.phone || "").trim();
    const phoneDigits = rawPhone.replace(/[^\d+]/g, "");
    const contact = phoneDigits
      ? phoneDigits.startsWith("+")
        ? phoneDigits
        : phoneDigits.length === 10
          ? `+91${phoneDigits}`
          : phoneDigits
      : "";
    const prefill = {
          ...(buyerName ? { name: buyerName } : {}),
          ...(buyerEmail ? { email: buyerEmail } : {}),
          ...(contact ? { contact } : {}),
        }

    const existingOrder = await OrderModel.findOne({
      buyer: session._id,
      ...itemFilter,
      status: "pending",
      paymentProvider: "razorpay",
      amount: price,
      currency,
    }).sort({ createdOn: -1 });
    if (existingOrder?.providerOrderId) {
      return NextResponse.json({
        order_id: existingOrder.providerOrderId,
        amount,
        currency,
        prefill,
      });
    }

    const order = existingOrder || await OrderModel.create({
      orderId: `STD-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`,
      status: "pending",
      buyer: session._id,
      ...itemFilter,
      itemType: input.itemType,
      amount: price,
      currency,
      paymentProvider: "razorpay",
    });

    const providerOrder = await client.orders.create({
      amount,
      currency,
      receipt: order.orderId,
      notes: { item_title: title },
    });

    order.providerOrderId = providerOrder.id;
    order.paymentProvider = "razorpay";
    await order.save();

    return NextResponse.json({
      order_id: providerOrder.id,
      amount: providerOrder.amount,
      currency: providerOrder.currency,
      prefill,
    });
  } catch (error) {
    console.error("Razorpay order creation failed", error);
    const statusCode = typeof error === "object" && error !== null && "statusCode" in error
      ? Number(error.statusCode)
      : undefined;
    if (statusCode === 401) {
      return NextResponse.json({ error: "Razorpay authentication failed" }, { status: 401 });
    }
    return NextResponse.json({ error: "Could not create a payment order" }, { status: 500 });
  }
}
