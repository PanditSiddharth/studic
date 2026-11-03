import mongoose, { Schema, type Model } from "mongoose";

export type ContributionStatus = "pending" | "approved" | "rejected";

/**
 * A student's proposed change to one article. Students never edit published
 * articles directly — they submit a proposal, an administrator reviews it and
 * only approved proposals change the published article.
 */
export interface IContribution {
  _id?: string;
  blog: mongoose.Types.ObjectId | string;
  submittedBy: mongoose.Types.ObjectId | string;
  proposedTitle?: string;
  proposedDescription?: string;
  proposedContent: string;
  status?: ContributionStatus;
  reviewedBy?: mongoose.Types.ObjectId | string;
  reviewComment?: string;
  submittedAt?: Date;
  reviewedAt?: Date;
}

const ContributionSchema = new Schema<IContribution>(
  {
    blog: { type: Schema.Types.ObjectId, ref: "Blog", required: true, index: true },
    submittedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    proposedTitle: { type: String, trim: true, maxlength: 160 },
    proposedDescription: { type: String, maxlength: 10000 },
    proposedContent: { type: String, required: true, maxlength: 120000 },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewComment: { type: String, trim: true, maxlength: 1000 },
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
  },
  { timestamps: { createdAt: "submittedAt", updatedAt: "updatedAt" }, minimize: false }
);

// A student keeps at most one open proposal per article; older pending
// proposals are superseded when they submit a new edit.
ContributionSchema.index({ blog: 1, submittedBy: 1, status: 1 });
ContributionSchema.index({ status: 1, submittedAt: -1 });

export const ContributionModel: Model<IContribution> =
  (mongoose.models.Contribution as Model<IContribution>) ||
  mongoose.model<IContribution>("Contribution", ContributionSchema);
