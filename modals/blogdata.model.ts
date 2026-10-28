import mongoose, { Schema, type Model } from "mongoose";

export interface IComment {
  _id?: string;
  blogId: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId | string;
  message: string;
  status?: "visible" | "hidden" | "reported";
  parentComment?: mongoose.Types.ObjectId | string;
  createdOn?: Date;
  updatedAt?: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    blogId: { type: Schema.Types.ObjectId, ref: "Blog", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    status: { type: String, enum: ["visible", "hidden", "reported"], default: "visible", index: true },
    parentComment: { type: Schema.Types.ObjectId, ref: "Comment" },
  },
  { timestamps: { createdAt: "createdOn", updatedAt: "updatedAt" }, minimize: false }
);

CommentSchema.index({ blogId: 1, createdOn: -1 });

export const CommentModel: Model<IComment> =
  (mongoose.models.Comment as Model<IComment>) || mongoose.model<IComment>("Comment", CommentSchema);
