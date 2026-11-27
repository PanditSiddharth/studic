import mongoose, { Schema, type Model } from "mongoose";

export type AIProviderProtocol = "ollama" | "openai-compatible" | "openai" | "gemini" | "anthropic";
export type AIContentType = "product" | "article";

export interface IAIStudioProvider {
  id: string;
  name: string;
  protocol: AIProviderProtocol;
  baseUrl: string;
  model: string;
  imageModel?: string;
  encryptedApiKey?: string;
}

export interface IAIStudioSettings {
  key: "default";
  providers: IAIStudioProvider[];
  activeProviderId: string;
  imageProviderId: string;
  siteContext: string;
  updatedBy?: mongoose.Types.ObjectId | string;
  updatedAt?: Date;
}

export interface IAIStudioDraft {
  _id?: mongoose.Types.ObjectId | string;
  contentType: AIContentType;
  source: "ai" | "json";
  status: "review" | "saved";
  data: Record<string, unknown>;
  contentId?: mongoose.Types.ObjectId | string;
  contentSlug?: string;
  createdBy: mongoose.Types.ObjectId | string;
  createdOn?: Date;
  updatedAt?: Date;
}

const ProviderSchema = new Schema<IAIStudioProvider>(
  {
    id: { type: String, required: true, trim: true, maxlength: 40 },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    protocol: { type: String, enum: ["ollama", "openai-compatible", "openai", "gemini", "anthropic"], required: true },
    baseUrl: { type: String, trim: true, maxlength: 500, default: "" },
    model: { type: String, trim: true, maxlength: 160, default: "" },
    imageModel: { type: String, trim: true, maxlength: 160, default: "" },
    encryptedApiKey: { type: String, select: false },
  },
  { _id: false }
);

const AIStudioSettingsSchema = new Schema<IAIStudioSettings>(
  {
    key: { type: String, enum: ["default"], unique: true, default: "default" },
    providers: { type: [ProviderSchema], default: [] },
    activeProviderId: { type: String, default: "" },
    imageProviderId: { type: String, default: "" },
    siteContext: { type: String, maxlength: 12000, default: "" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: { createdAt: false, updatedAt: "updatedAt" }, minimize: false }
);

const AIStudioDraftSchema = new Schema<IAIStudioDraft>(
  {
    contentType: { type: String, enum: ["product", "article"], required: true, index: true },
    source: { type: String, enum: ["ai", "json"], required: true },
    status: { type: String, enum: ["review", "saved"], default: "review", index: true },
    data: { type: Schema.Types.Mixed, required: true },
    contentId: { type: Schema.Types.ObjectId },
    contentSlug: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: "createdOn", updatedAt: "updatedAt" }, minimize: false }
);

AIStudioDraftSchema.index({ status: 1, createdOn: -1 });

export const AIStudioSettingsModel: Model<IAIStudioSettings> =
  (mongoose.models.AIStudioSettings as Model<IAIStudioSettings>) ||
  mongoose.model<IAIStudioSettings>("AIStudioSettings", AIStudioSettingsSchema);

export const AIStudioDraftModel: Model<IAIStudioDraft> =
  (mongoose.models.AIStudioDraft as Model<IAIStudioDraft>) ||
  mongoose.model<IAIStudioDraft>("AIStudioDraft", AIStudioDraftSchema);
