import mongoose, { Schema, type Model } from "mongoose";

export type EnrollmentStatus = "active" | "completed" | "revoked";

export interface IEnrollment {
  _id?: string;
  user: mongoose.Types.ObjectId | string;
  course: mongoose.Types.ObjectId | string;
  order?: mongoose.Types.ObjectId | string;
  status: EnrollmentStatus;
  enrolledAt?: Date;
  completedAt?: Date;
  progressPercent?: number;
  lastAccessedAt?: Date;
}

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    order: { type: Schema.Types.ObjectId, ref: "Order" },
    status: { type: String, enum: ["active", "completed", "revoked"], default: "active", index: true },
    enrolledAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    progressPercent: { type: Number, min: 0, max: 100, default: 0 },
    lastAccessedAt: { type: Date },
  },
  { timestamps: false, minimize: false }
);

EnrollmentSchema.index({ user: 1, course: 1 }, { unique: true });
EnrollmentSchema.index({ course: 1, status: 1 });

export const EnrollmentModel: Model<IEnrollment> =
  (mongoose.models.Enrollment as Model<IEnrollment>) ||
  mongoose.model<IEnrollment>("Enrollment", EnrollmentSchema);
