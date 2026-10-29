import mongoose, { Schema, type Model } from "mongoose";

export interface IChatSettings {
  key: "default";
  allowMedia: boolean;
  allowImages: boolean;
  allowDocuments: boolean;
  allowVoiceCalls: boolean;
  retentionDays: number | null;
  updatedBy?: mongoose.Types.ObjectId | string;
  updatedAt?: Date;
}

const ChatSettingsSchema = new Schema<IChatSettings>(
  {
    key: { type: String, enum: ["default"], unique: true, default: "default" },
    allowMedia: { type: Boolean, default: false },
    allowImages: { type: Boolean, default: false },
    allowDocuments: { type: Boolean, default: false },
    allowVoiceCalls: { type: Boolean, default: false },
    retentionDays: { type: Number, min: 1, max: 3650, default: 30 },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, minimize: false }
);

export const ChatSettingsModel: Model<IChatSettings> =
  (mongoose.models.ChatSettings as Model<IChatSettings>) ||
  mongoose.model<IChatSettings>("ChatSettings", ChatSettingsSchema);
