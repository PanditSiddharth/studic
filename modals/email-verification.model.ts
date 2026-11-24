import mongoose, { Schema, type Model } from "mongoose";

export type OtpPurpose = "register" | "reset" | "login";

export interface IOtp {
  email: string;
  purpose: OtpPurpose;
  codeHash: string;
  attempts: number;
  expiresAt: Date;
  createdOn?: Date;
  updatedAt?: Date;
}

const OtpSchema = new Schema<IOtp>(
  {
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    purpose: { type: String, enum: ["register", "reset", "login"], required: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0, min: 0 },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  { timestamps: { createdAt: "createdOn", updatedAt: "updatedAt" }, minimize: false }
);

// One active code per email + purpose. A new code replaces the previous one.
OtpSchema.index({ email: 1, purpose: 1 }, { unique: true });

export const OtpModel: Model<IOtp> =
  (mongoose.models.EmailVerification as Model<IOtp>) ||
  mongoose.model<IOtp>("EmailVerification", OtpSchema);
