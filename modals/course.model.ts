import mongoose, { Schema, type Model } from "mongoose";

export type CourseStatus = "draft" | "private" | "published" | "unlisted" | "archived";
export type AccessType = "free" | "paid";

export interface ICourse {
  _id?: string;
  slug: string;
  title: string;
  status: CourseStatus;
  price: number;
  description: string;
  thumbnail: string;
  thumbnailPublicId?: string;
  content: string[] | mongoose.Types.ObjectId[] | unknown[];
  /** Downloadable products bundled with the course. */
  products?: string[] | mongoose.Types.ObjectId[] | unknown[];
  tags: string[];
  landingPage?: string;
  author?: string | mongoose.Types.ObjectId;
  accessType?: AccessType;
  currency?: string;
  level?: "beginner" | "intermediate" | "advanced" | "all-levels";
  language?: string;
  estimatedMinutes?: number;
  prerequisites?: string[];
  publishedAt?: Date;
  createdOn?: Date;
  updatedAt?: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    status: { type: String, enum: ["draft", "private", "published", "unlisted", "archived"], default: "draft", index: true },
    accessType: { type: String, enum: ["free", "paid"], default: "free", index: true },
    price: { type: Number, required: true, min: 0, default: 0 },
    currency: { type: String, uppercase: true, default: "INR", maxlength: 3 },
    description: { type: String, required: true, maxlength: 10000 },
    thumbnail: { type: String, required: true, default: "" },
    thumbnailPublicId: { type: String, trim: true },
    content: [{ type: Schema.Types.ObjectId, ref: "Blog" }],
    products: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    tags: { type: [String], default: [] },
    landingPage: { type: String },
    author: { type: Schema.Types.ObjectId, ref: "User", index: true },
    level: { type: String, enum: ["beginner", "intermediate", "advanced", "all-levels"], default: "all-levels" },
    language: { type: String, default: "hi" },
    estimatedMinutes: { type: Number, min: 0, default: 0 },
    prerequisites: { type: [String], default: [] },
    publishedAt: { type: Date },
  },
  { timestamps: { createdAt: "createdOn", updatedAt: "updatedAt" }, minimize: false }
);

CourseSchema.index({ status: 1, publishedAt: -1 });
// NOTE: do not add a text index to this collection. MongoDB reads the `language`
// field of a document as the text-search language override, and courses store a
// human language such as "hi" here. Saving such a document would fail with
// "language override unsupported: hi". Search uses regex queries instead.

export const CourseModel: Model<ICourse> =
  (mongoose.models.Course as Model<ICourse>) || mongoose.model<ICourse>("Course", CourseSchema);
