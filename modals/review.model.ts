import mongoose, { Schema, type Model } from "mongoose";

export type ReviewStatus = "pending" | "published" | "hidden";

export interface IReview {
  _id?: string;
  user: mongoose.Types.ObjectId | string;
  product?: mongoose.Types.ObjectId | string;
  course?: mongoose.Types.ObjectId | string;
  rating: number;
  comment: string;
  status?: ReviewStatus;
  sellerReply?: string;
  repliedAt?: Date;
  createdOn?: Date;
  updatedAt?: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: "Product" },
    course: { type: Schema.Types.ObjectId, ref: "Course" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 3000 },
    status: { type: String, enum: ["pending", "published", "hidden"], default: "published", index: true },
    sellerReply: { type: String, maxlength: 3000 },
    repliedAt: { type: Date },
  },
  { timestamps: { createdAt: "createdOn", updatedAt: "updatedAt" }, minimize: false }
);

ReviewSchema.index({ product: 1, status: 1, createdOn: -1 });
ReviewSchema.index({ course: 1, status: 1, createdOn: -1 });

ReviewSchema.pre("validate", function () {
  if (Boolean(this.product) === Boolean(this.course)) {
    this.invalidate("product", "A review must target exactly one product or course.");
  }
});

export const ReviewModel: Model<IReview> =
  (mongoose.models.Review as Model<IReview>) || mongoose.model<IReview>("Review", ReviewSchema);
