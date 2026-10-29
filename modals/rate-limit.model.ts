import mongoose, { Schema, type Model } from "mongoose";

interface IRateLimit {
  key: string;
  windowStart: Date;
  count: number;
  expiresAt: Date;
}

const RateLimitSchema = new Schema<IRateLimit>(
  {
    key: { type: String, required: true, unique: true, maxlength: 180 },
    windowStart: { type: Date, required: true },
    count: { type: Number, required: true, min: 0, max: 10000 },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  { minimize: false }
);

export const RateLimitModel: Model<IRateLimit> =
  (mongoose.models.RateLimit as Model<IRateLimit>) ||
  mongoose.model<IRateLimit>("RateLimit", RateLimitSchema);
