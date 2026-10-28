import mongoose, { Schema, type Model } from "mongoose";

export type BlogStatus = "draft" | "private" | "free" | "paid";
export interface IBlog {
  _id?: string;
  slug: string;
  title: string;
  status: BlogStatus;
  description: string;
  thumbnail: string;
  content: string;
  category: string[];
  tags: string[];
  products?: string[] | mongoose.Types.ObjectId[] | unknown[];
  author?: string | mongoose.Types.ObjectId;
  estimatedMinutes?: number;
  course?: string | mongoose.Types.ObjectId;
  seoTitle?: string;
  seoDescription?: string;
  publishedAt?: Date;
  createdOn?: Date;
  updatedAt?: Date;
}

export const BlogSchema = new Schema<IBlog>(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    status: { type: String, enum: ["draft", "private", "free", "paid"], default: "draft", index: true },
    description: { type: String, default: "", maxlength: 10000 },
    thumbnail: { type: String, default: "" },
    category: { type: [String], default: [], index: true },
    content: { type: String, default: "" },
    tags: { type: [String], default: [] },
    products: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    author: { type: Schema.Types.ObjectId, ref: "User", index: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", index: true },
    estimatedMinutes: { type: Number, min: 0, default: 0 },
    seoTitle: { type: String, trim: true, maxlength: 160 },
    seoDescription: { type: String, trim: true, maxlength: 320 },
    publishedAt: { type: Date },
  },
  { timestamps: { createdAt: "createdOn", updatedAt: "updatedAt" }, minimize: false }
);

BlogSchema.index({ status: 1, publishedAt: -1 });
BlogSchema.index({ title: "text", description: "text", content: "text", tags: "text" });

export const BlogModel: Model<IBlog> =
  (mongoose.models.Blog as Model<IBlog>) || mongoose.model<IBlog>("Blog", BlogSchema);
