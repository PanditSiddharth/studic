import mongoose, { Schema, type Model } from "mongoose";

export type ProductStatus = "draft" | "published" | "archived";

export interface IProduct {
  _id?: string;
  slug: string;
  title: string;
  price: number;
  description: string;
  thumbnail: string;
  tags: string[];
  fileLink?: string;
  seller?: string;
  status?: ProductStatus;
  currency?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  downloadLimit?: number | null;
  publishedAt?: Date;
  createdOn?: Date;
  updatedAt?: Date;
}

export const ProductSchema = new Schema<IProduct>(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: "", maxlength: 10000 },
    price: { type: Number, required: true, min: 0, default: 0 },
    currency: { type: String, uppercase: true, default: "INR", maxlength: 3 },
    tags: { type: [String], default: [], index: true },
    thumbnail: { type: String, default: "" },
    fileLink: { type: String, select: false },
    seller: { type: Schema.Types.ObjectId, ref: "User", index: true },
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft", index: true },
    fileName: { type: String, trim: true },
    fileSize: { type: Number, min: 0 },
    mimeType: { type: String, trim: true },
    downloadLimit: { type: Number, min: 1, default: null },
    publishedAt: { type: Date },
  },
  { timestamps: { createdAt: "createdOn", updatedAt: "updatedAt" }, minimize: false }
);

ProductSchema.index({ status: 1, publishedAt: -1 });
ProductSchema.index({ title: "text", description: "text", tags: "text" });

export const ProductModel: Model<IProduct> =
  (mongoose.models.Product as Model<IProduct>) || mongoose.model<IProduct>("Product", ProductSchema);
