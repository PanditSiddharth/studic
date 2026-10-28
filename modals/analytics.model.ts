import mongoose, { Schema, type Model } from "mongoose";

export interface IAnalytics {
  _id?: string;
  userId: mongoose.Types.ObjectId | string;
  periodStart?: Date;
  periodEnd?: Date;
  totalRevenue: number;
  totalPaidAmount: number;
  productsSold: number;
  coursesSold?: number;
  ordersCount?: number;
  lastUpdated: Date;
}

const AnalyticsSchema = new Schema<IAnalytics>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    periodStart: { type: Date, index: true },
    periodEnd: { type: Date },
    totalRevenue: { type: Number, default: 0, min: 0 },
    totalPaidAmount: { type: Number, default: 0, min: 0 },
    productsSold: { type: Number, default: 0, min: 0 },
    coursesSold: { type: Number, default: 0, min: 0 },
    ordersCount: { type: Number, default: 0, min: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: false, minimize: false }
);

AnalyticsSchema.index({ userId: 1, periodStart: 1 }, { unique: true });

export const AnalyticsModel: Model<IAnalytics> =
  (mongoose.models.Analytics as Model<IAnalytics>) || mongoose.model<IAnalytics>("Analytics", AnalyticsSchema);
