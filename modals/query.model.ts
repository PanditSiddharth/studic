import mongoose, { Schema, type Model } from "mongoose";

export type QueryStatus = "open" | "in_progress" | "resolved" | "closed";
export type QueryPriority = "low" | "normal" | "high" | "urgent";

export interface IQuery {
  _id?: string;
  name: string;
  description: string;
  email: string;
  user?: mongoose.Types.ObjectId | string;
  status?: QueryStatus;
  priority?: QueryPriority;
  assignedTo?: mongoose.Types.ObjectId | string;
  adminNotes?: string;
  resolvedAt?: Date;
  createdOn?: Date;
  updatedAt?: Date;
}

const QuerySchema = new Schema<IQuery>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 10000 },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },
    status: { type: String, enum: ["open", "in_progress", "resolved", "closed"], default: "open", index: true },
    priority: { type: String, enum: ["low", "normal", "high", "urgent"], default: "normal", index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    adminNotes: { type: String, maxlength: 10000 },
    resolvedAt: { type: Date },
  },
  { timestamps: { createdAt: "createdOn", updatedAt: "updatedAt" }, minimize: false }
);

QuerySchema.index({ status: 1, priority: -1, createdOn: -1 });

export const QueryModel: Model<IQuery> =
  (mongoose.models.Query as Model<IQuery>) || mongoose.model<IQuery>("Query", QuerySchema);
