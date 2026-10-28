"use server";

import mongoose from "mongoose";
import connectDB from "@/connectDB";
import { CourseModel } from "@/modals/course.model";
import { EnrollmentModel } from "@/modals/enrollment.model";
import { OrderModel } from "@/modals/order.model";
import { ProductModel } from "@/modals/product.model";
import { UserModel } from "@/modals/user.model";
import { isSuperAdminEmail, userFilter } from "@/helpers";
import { getSessionUser } from "./user";

type ItemRef = { productId?: string; courseId?: string };

const isObjectId = (value?: string) => Boolean(value && mongoose.isValidObjectId(value));

const orderId = () =>
  `STD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

const PAID_STATUSES = ["paid"];
const OPEN_STATUSES = ["pending"];

type AccessResult = {
  signedIn: boolean;
  owned: boolean;
  enrolled: boolean;
  orderStatus: string | null;
  orderId: string | null;
  progressPercent: number;
};

/**
 * Whether the signed-in user already owns an item. Used by product/course pages
 * to swap "Buy" for "Download" and by the download endpoint.
 */
export async function getItemAccess(input: ItemRef): Promise<AccessResult> {
  const session = await getSessionUser();
  if (!session?._id) {
    return { signedIn: false, owned: false, enrolled: false, orderStatus: null, orderId: null, progressPercent: 0 };
  }

  await connectDB();
  const buyer = session._id;

  try {
    if (isObjectId(input.productId)) {
      const order = await OrderModel.findOne({ buyer, product: input.productId })
        .sort({ createdOn: -1 })
        .select("status orderId");
      return {
        signedIn: true,
        owned: Boolean(order && PAID_STATUSES.includes(order.status)),
        enrolled: false,
        orderStatus: order?.status ?? null,
        orderId: order?.orderId ?? null,
        progressPercent: 0,
      };
    }

    if (isObjectId(input.courseId)) {
      const enrollment = await EnrollmentModel.findOne({
        user: buyer,
        course: input.courseId,
        status: { $ne: "revoked" },
      }).select("status progressPercent");
      if (enrollment) {
        return {
          signedIn: true,
          owned: true,
          enrolled: true,
          orderStatus: null,
          orderId: null,
          progressPercent: enrollment.progressPercent ?? 0,
        };
      }
      const order = await OrderModel.findOne({ buyer, course: input.courseId })
        .sort({ createdOn: -1 })
        .select("status orderId");
      return {
        signedIn: true,
        owned: Boolean(order && PAID_STATUSES.includes(order.status)),
        enrolled: false,
        orderStatus: order?.status ?? null,
        orderId: order?.orderId ?? null,
        progressPercent: 0,
      };
    }

    return { signedIn: true, owned: false, enrolled: false, orderStatus: null, orderId: null, progressPercent: 0 };
  } catch (error) {
    console.error("Error checking item access", error);
    return { signedIn: true, owned: false, enrolled: false, orderStatus: null, orderId: null, progressPercent: 0 };
  }
}

type CheckoutResult = {
  error?: string;
  requiresAuth?: boolean;
  status?: "granted" | "pending";
  orderId?: string;
  message?: string;
  free?: boolean;
  enrolled?: boolean;
  progressPercent?: number;
};

/**
 * Grant access to a free item instantly, or open a pending order for a paid
 * item. No payment provider is connected yet, so paid orders stay pending and
 * are visible on the profile/orders page until an administrator confirms them.
 */
export async function startCheckout(input: ItemRef): Promise<CheckoutResult> {
  const session = await getSessionUser();
  if (!session?._id) return { error: "Sign in to continue", requiresAuth: true as const };

  await connectDB();
  const buyer = session._id;

  try {
    if (isObjectId(input.productId)) {
      const product = await ProductModel.findOne({
        _id: input.productId,
        $or: [{ status: "published" }, { status: { $exists: false } }],
      });
      if (!product) return { error: "This product is not available" };

      const existing = await OrderModel.findOne({ buyer, product: product._id }).sort({ createdOn: -1 });
      if (existing && PAID_STATUSES.includes(existing.status)) {
        return { status: "granted" as const, orderId: existing.orderId, free: true };
      }

      const isFree = Number(product.price) <= 0;
      if (isFree) {
        const order = existing && OPEN_STATUSES.includes(existing.status)
          ? await OrderModel.findByIdAndUpdate(existing._id, { status: "paid", paidAt: new Date(), amount: 0 }, { new: true })
          : await OrderModel.create({
            orderId: orderId(),
            status: "paid",
            buyer,
            seller: product.seller,
            product: product._id,
            itemType: "product",
            amount: 0,
            currency: product.currency || "INR",
            paymentProvider: "manual",
            paidAt: new Date(),
          });
        return { status: "granted" as const, orderId: order?.orderId, free: true };
      }

      if (existing && OPEN_STATUSES.includes(existing.status)) {
        return {
          status: "pending" as const,
          orderId: existing.orderId,
          message: "Your order is already waiting for confirmation.",
        };
      }

      const order = await OrderModel.create({
        orderId: orderId(),
        status: "pending",
        buyer,
        seller: product.seller,
        product: product._id,
        itemType: "product",
        amount: product.price,
        currency: product.currency || "INR",
        paymentProvider: "manual",
      });

      return {
        status: "pending" as const,
        orderId: order.orderId,
        message: "Order saved. Online payments are not connected yet, so you have not been charged — an administrator will confirm your order.",
      };
    }

    if (isObjectId(input.courseId)) {
      const course = await CourseModel.findOne({ _id: input.courseId, status: "published" });
      if (!course) return { error: "This course is not available" };

      const isFree = course.accessType === "free" || Number(course.price) <= 0;

      if (isFree) {
        const enrollment = await EnrollmentModel.findOneAndUpdate(
          { user: buyer, course: course._id },
          {
            $setOnInsert: {
              user: buyer,
              course: course._id,
              enrolledAt: new Date(),
              progressPercent: 0,
            },
            $set: { status: "active" },
          },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        return { status: "granted" as const, enrolled: true, progressPercent: enrollment?.progressPercent ?? 0, free: true };
      }

      const existing = await OrderModel.findOne({ buyer, course: course._id }).sort({ createdOn: -1 });
      if (existing && PAID_STATUSES.includes(existing.status)) {
        await EnrollmentModel.updateOne(
          { user: buyer, course: course._id },
          { $setOnInsert: { user: buyer, course: course._id, status: "active", enrolledAt: new Date() } },
          { upsert: true }
        );
        return { status: "granted" as const, enrolled: true, orderId: existing.orderId, free: false };
      }

      if (existing && OPEN_STATUSES.includes(existing.status)) {
        return { status: "pending" as const, orderId: existing.orderId, message: "Your order is already waiting for confirmation." };
      }

      const order = await OrderModel.create({
        orderId: orderId(),
        status: "pending",
        buyer,
        seller: course.author,
        course: course._id,
        itemType: "course",
        amount: course.price,
        currency: course.currency || "INR",
        paymentProvider: "manual",
      });

      return {
        status: "pending" as const,
        orderId: order.orderId,
        message: "Order saved. Online payments are not connected yet, so you have not been charged — an administrator will confirm your order.",
      };
    }

    return { error: "Nothing to purchase" };
  } catch (error: any) {
    console.error("Error starting checkout", error);
    return { error: error?.message || "Could not start checkout" };
  }
}

/** Everything a learner owns: enrolled courses, owned products and order history. */
export async function getMyLibrary() {
  const session = await getSessionUser();
  if (!session?._id) return { error: "Sign in to view your library", requiresAuth: true as const };

  await connectDB();

  try {
    const [user, enrollments, orders] = await Promise.all([
      UserModel.findById(session._id).select("name email username image about phone role createdOn"),
      EnrollmentModel.find({ user: session._id, status: { $ne: "revoked" } })
        .populate("course", "title slug thumbnail description tags level language estimatedMinutes accessType price currency status")
        .sort({ enrolledAt: -1 })
        .lean(),
      OrderModel.find({ buyer: session._id })
        .populate("product", "title slug thumbnail description price currency fileName fileSize mimeType downloadLimit")
        .populate("course", "title slug thumbnail price currency accessType")
        .sort({ createdOn: -1 })
        .lean(),
    ]);

    if (!user) return { error: "Your account could not be loaded" };

    const courses = enrollments
      .map((enrollment: any) => {
        const course = enrollment.course;
        if (!course?._id) return null;
        return {
          _id: String(course._id),
          title: course.title,
          slug: course.slug,
          thumbnail: course.thumbnail,
          description: course.description,
          tags: course.tags || [],
          level: course.level,
          language: course.language,
          estimatedMinutes: course.estimatedMinutes,
          accessType: course.accessType,
          price: course.price,
          currency: course.currency,
          status: course.status,
          enrolledAt: enrollment.enrolledAt,
          progressPercent: enrollment.progressPercent ?? 0,
          enrollmentStatus: enrollment.status,
        };
      })
      .filter(Boolean);

    const seenProducts = new Set<string>();
    const products: any[] = [];
    const updatedOrders = orders.map((order: any) => {
      const isPaid = order.status === "paid";
      const item = order.product || order.course;
      const itemTitle = item?.title || "Removed item";
      const itemSlug = item?.slug || "";
      const itemType = order.itemType || (order.product ? "product" : order.course ? "course" : undefined);

      if (order.product && isPaid) {
        const key = String(order.product._id);
        if (!seenProducts.has(key)) {
          seenProducts.add(key);
          products.push({
            _id: key,
            title: order.product.title,
            slug: order.product.slug,
            thumbnail: order.product.thumbnail,
            description: order.product.description,
            price: order.product.price,
            currency: order.product.currency,
            fileName: order.product.fileName,
            fileSize: order.product.fileSize,
            mimeType: order.product.mimeType,
            orderId: order.orderId,
            ownedAt: order.paidAt || order.createdOn,
          });
        }
      }

      return {
        _id: String(order._id),
        orderId: order.orderId,
        status: order.status,
        itemType,
        amount: order.amount,
        currency: order.currency || "INR",
        createdOn: order.createdOn,
        paidAt: order.paidAt,
        title: itemTitle,
        slug: itemSlug,
        thumbnail: item?.thumbnail || "",
      };
    });

    const paidOrders = updatedOrders.filter((order) => order.status === "paid");
    const spent = paidOrders.reduce((total, order) => total + Number(order.amount || 0), 0);

    return JSON.parse(JSON.stringify({
      user: userFilter(user),
      courses,
      products,
      orders: updatedOrders,
      stats: {
        courses: courses.length,
        products: products.length,
        pendingOrders: updatedOrders.filter((order) => order.status === "pending").length,
        orders: updatedOrders.length,
        spent,
        currency: "INR",
      },
    }));
  } catch (error: any) {
    console.error("Error loading library", error);
    return { error: error?.message || "Could not load your library" };
  }
}

/** Update the signed-in user's own profile. */
export async function updateMyProfile(input: {
  name?: string;
  username?: string;
  about?: string;
  phone?: string;
  image?: string;
}) {
  const session = await getSessionUser();
  if (!session?._id) return { error: "Sign in to update your profile" };

  const name = String(input?.name || "").trim();
  const username = String(input?.username || "").trim().toLowerCase();
  const about = String(input?.about || "").trim();
  const phone = String(input?.phone || "").trim();
  const image = String(input?.image || "").trim();

  if (name.length < 2 || name.length > 60) return { error: "Enter your name (2–60 characters)" };
  if (!/^[a-z0-9_-]{3,30}$/.test(username)) {
    return { error: "Username needs 3–30 lowercase letters, numbers, dashes or underscores" };
  }
  if (about.length > 500) return { error: "Keep your bio under 500 characters" };
  if (phone.length > 20) return { error: "Enter a valid phone number" };
  if (image && !/^https?:\/\//i.test(image)) return { error: "Profile image must be a valid URL" };

  await connectDB();

  try {
    const taken = await UserModel.findOne({ username, _id: { $ne: session._id } }).select("_id");
    if (taken) return { error: "That username is already taken" };

    const updated = await UserModel.findByIdAndUpdate(
      session._id,
      { name, username, about, phone, image },
      { new: true, runValidators: true }
    );
    if (!updated) return { error: "Your account could not be updated" };

    return { user: userFilter(updated) };
  } catch (error: any) {
    console.error("Error updating profile", error);
    if (error?.code === 11000) return { error: "That username is already taken" };
    return { error: error?.message || "Could not update your profile" };
  }
}

/** Resolve a gated download for the signed-in buyer (or any administrator). */
export async function getDownloadUrl(productId: string) {
  const session = await getSessionUser();
  if (!session?._id) return { error: "Sign in to download this file", requiresAuth: true as const };
  if (!isObjectId(productId)) return { error: "This product could not be found" };

  await connectDB();

  try {
    const product = await ProductModel.findById(productId).select("title fileLink seller");
    if (!product) return { error: "This product could not be found" };
    if (!product.fileLink) return { error: "No file has been attached to this product yet" };

    const isOwner = product.seller && String(product.seller) === String(session._id);
    if (session.role === "admin" || isSuperAdminEmail(session.email) || isOwner) {
      return { url: product.fileLink };
    }

    const order = await OrderModel.findOne({ buyer: session._id, product: product._id, status: "paid" }).select("_id");
    if (!order) return { error: "Purchase this product to download the file" };

    return { url: product.fileLink };
  } catch (error: any) {
    console.error("Error resolving download", error);
    return { error: error?.message || "Could not prepare your download" };
  }
}
