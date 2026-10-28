import mongoose, { Schema, type Model } from "mongoose";

export type OrderStatus = "pending" | "paid" | "failed" | "cancelled" | "refunded" | "partially_refunded";
export type PaymentProvider = "phonepe" | "manual" | "other";

export interface IOrder {
  _id?: string;
  orderId: string;
  transactionId?: string;
  status: OrderStatus;
  buyer: mongoose.Types.ObjectId | string;
  seller?: mongoose.Types.ObjectId | string;
  product?: mongoose.Types.ObjectId | string;
  course?: mongoose.Types.ObjectId | string;
  blog?: mongoose.Types.ObjectId | string;
  itemType?: "product" | "course" | "blog";
  amount?: number;
  currency?: string;
  paymentProvider?: PaymentProvider;
  providerOrderId?: string;
  providerPaymentId?: string;
  failureReason?: string;
  paidAt?: Date;
  refundedAt?: Date;
  createdOn?: Date;
  updatedAt?: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    transactionId: { type: String, index: true, sparse: true },
    status: { type: String, enum: ["pending", "paid", "failed", "cancelled", "refunded", "partially_refunded"], default: "pending", index: true },
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    seller: { type: Schema.Types.ObjectId, ref: "User", index: true },
    product: { type: Schema.Types.ObjectId, ref: "Product" },
    course: { type: Schema.Types.ObjectId, ref: "Course" },
    blog: { type: Schema.Types.ObjectId, ref: "Blog" },
    itemType: { type: String, enum: ["product", "course", "blog"] },
    amount: { type: Number, min: 0, required: true, default: 0 },
    currency: { type: String, uppercase: true, default: "INR", maxlength: 3 },
    paymentProvider: { type: String, enum: ["phonepe", "manual", "other"], default: "phonepe" },
    providerOrderId: { type: String, index: true, sparse: true },
    providerPaymentId: { type: String, index: true, sparse: true },
    failureReason: { type: String, maxlength: 1000 },
    paidAt: { type: Date },
    refundedAt: { type: Date },
  },
  { timestamps: { createdAt: "createdOn", updatedAt: "updatedAt" }, minimize: false }
);

OrderSchema.index({ buyer: 1, createdOn: -1 });
OrderSchema.index({ status: 1, createdOn: -1 });

export const OrderModel: Model<IOrder> =
  (mongoose.models.Order as Model<IOrder>) || mongoose.model<IOrder>("Order", OrderSchema);
