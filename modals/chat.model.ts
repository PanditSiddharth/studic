import mongoose, { Schema, type Model } from "mongoose";

export type ChatKind = "direct" | "group";

export interface ChatPermissions {
  membersCanMessage: boolean;
  adminsOnlyMessaging: boolean;
  membersCanSendMedia: boolean;
  membersCanEditInfo: boolean;
  membersCanInvite: boolean;
  membersCanUseVoice: boolean;
  isPublic: boolean;
  isDiscoverable: boolean;
}

/** A user as exposed inside chat payloads. Never includes private fields. */
export interface ChatUser {
  _id: string;
  name: string;
  username?: string;
  image?: string;
  role?: string;
  email?: string;
}

export interface ChatLastMessage {
  text: string;
  senderId: string;
  senderName: string;
  at: string | Date;
}

export interface ChatSummary {
  _id: string;
  kind: ChatKind;
  title: string;
  subtitle: string;
  description?: string;
  image?: string;
  participants: ChatUser[];
  memberCount: number;
  adminIds: string[];
  lastMessage: ChatLastMessage | null;
  lastMessageAt: string | Date | null;
  isParticipant: boolean;
  canSend: boolean;
  isGroupAdmin: boolean;
  createdBy: string;
  systemKey?: string;
  moderation?: {
    slowModeSeconds: number;
    restrictedWords: string[];
    messageSendAfter: string | Date | null;
    messageRetentionSeconds: number;
    permissions: ChatPermissions;
    canManage: boolean;
  };
  unread: number;
}

export interface ChatMessage {
  _id: string;
  text: string;
  sender: ChatUser;
  createdAt: string | Date;
  attachment?: ChatAttachment;
}

export type ChatAttachmentKind = "image" | "document";
export interface ChatAttachment {
  url: string;
  name: string;
  mimeType: string;
  kind: ChatAttachmentKind;
  expiresAt?: string | Date | null;
}

export interface ChatDirectoryUser extends ChatUser {
  isAdmin: boolean;
}

export interface IChat {
  _id?: string;
  kind: ChatKind;
  name?: string;
  description?: string;
  image?: string;
  participants: mongoose.Types.ObjectId[] | string[];
  admins: mongoose.Types.ObjectId[] | string[];
  createdBy: mongoose.Types.ObjectId | string;
  systemKey?: string;
  slowModeSeconds?: number;
  restrictedWords?: string[];
  messageSendAfter?: Date | null;
  messageRetentionSeconds?: number;
  permissions?: Partial<ChatPermissions>;
  mutedUsers?: Array<{
    user: mongoose.Types.ObjectId | string;
    until: Date;
  }>;
  lastMessage?: {
    text: string;
    senderId: mongoose.Types.ObjectId | string;
    senderName: string;
    at: Date;
  };
  lastMessageAt?: Date;
  createdOn?: Date;
  updatedAt?: Date;
}

export interface IMessage {
  _id?: string;
  chat: mongoose.Types.ObjectId | string;
  sender: mongoose.Types.ObjectId | string;
  text: string;
  attachment?: ChatAttachment;
  expiresAt?: Date | null;
  createdOn?: Date;
  updatedAt?: Date;
}

export interface IChatRead {
  _id?: string;
  chat: mongoose.Types.ObjectId | string;
  user: mongoose.Types.ObjectId | string;
  lastReadAt: Date;
}

export interface IVoiceParticipant {
  user: mongoose.Types.ObjectId | string;
  joinedAt: Date;
  lastSeenAt: Date;
}

export interface IVoiceSignal {
  from: mongoose.Types.ObjectId | string;
  to: mongoose.Types.ObjectId | string;
  type: "offer" | "answer" | "candidate";
  payload: Record<string, unknown>;
  createdAt: Date;
}

const LastMessageSchema = new Schema(
  {
    text: { type: String, maxlength: 400 },
    senderId: { type: Schema.Types.ObjectId, ref: "User" },
    senderName: { type: String, maxlength: 100 },
    at: { type: Date },
  },
  { _id: false }
);

const ChatSchema = new Schema<IChat>(
  {
    kind: { type: String, enum: ["direct", "group"], required: true, index: true },
    name: { type: String, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 500 },
    image: { type: String, default: "" },
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true, index: true }],
    admins: [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    systemKey: { type: String, trim: true },
    slowModeSeconds: { type: Number, min: 0, max: 86400, default: 0 },
    restrictedWords: { type: [String], default: [] },
    messageSendAfter: { type: Date, default: null },
    messageRetentionSeconds: { type: Number, min: 3600, max: 31536000, default: 3600 },
    permissions: {
      membersCanMessage: { type: Boolean, default: true },
      adminsOnlyMessaging: { type: Boolean, default: false },
      membersCanSendMedia: { type: Boolean, default: true },
      membersCanEditInfo: { type: Boolean, default: false },
      membersCanInvite: { type: Boolean, default: true },
      membersCanUseVoice: { type: Boolean, default: true },
      isPublic: { type: Boolean, default: false },
      isDiscoverable: { type: Boolean, default: false },
    },
    mutedUsers: [{
      user: { type: Schema.Types.ObjectId, ref: "User" },
      until: { type: Date },
    }],
    lastMessage: { type: LastMessageSchema },
    lastMessageAt: { type: Date, index: true },
  },
  { timestamps: { createdAt: "createdOn", updatedAt: "updatedAt" }, minimize: false }
);

ChatSchema.index({ participants: 1, lastMessageAt: -1 });
ChatSchema.index({ kind: 1, lastMessageAt: -1 });
ChatSchema.index({ systemKey: 1 }, { unique: true, sparse: true });

const ChatAttachmentSchema = new Schema(
  {
    url: { type: String, required: true },
    name: { type: String, required: true, maxlength: 240 },
    mimeType: { type: String, required: true, maxlength: 120 },
    kind: { type: String, enum: ["image", "document"], required: true },
    expiresAt: { type: Date, default: null },
  },
  { _id: false }
);

const MessageSchema = new Schema<IMessage>(
  {
    chat: { type: Schema.Types.ObjectId, ref: "Chat", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, default: "", trim: true, maxlength: 4000 },
    attachment: { type: ChatAttachmentSchema, required: false, default: undefined },
    expiresAt: { type: Date, default: null, index: true },
  },
  { timestamps: { createdAt: "createdOn", updatedAt: "updatedAt" }, minimize: false }
);

MessageSchema.index({ chat: 1, createdOn: 1 });
MessageSchema.index({ chat: 1, _id: 1 });

const ChatReadSchema = new Schema<IChatRead>(
  {
    chat: { type: Schema.Types.ObjectId, ref: "Chat", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    lastReadAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true, minimize: false }
);

const VoiceCallSchema = new Schema(
  {
    chat: { type: Schema.Types.ObjectId, ref: "Chat", required: true, unique: true, index: true },
    participants: [{
      user: { type: Schema.Types.ObjectId, ref: "User", required: true },
      joinedAt: { type: Date, required: true },
      lastSeenAt: { type: Date, required: true },
    }],
    signals: [{
      from: { type: Schema.Types.ObjectId, ref: "User", required: true },
      to: { type: Schema.Types.ObjectId, ref: "User", required: true },
      type: { type: String, enum: ["offer", "answer", "candidate"], required: true },
      payload: { type: Schema.Types.Mixed, required: true },
      createdAt: { type: Date, required: true },
    }],
  },
  { timestamps: true, minimize: false }
);

ChatReadSchema.index({ chat: 1, user: 1 }, { unique: true });

export const ChatModel: Model<IChat> =
  (mongoose.models.Chat as Model<IChat>) || mongoose.model<IChat>("Chat", ChatSchema);

const cachedMessageModel = mongoose.models.Message as Model<IMessage> | undefined;
const cachedAttachmentPath = cachedMessageModel?.schema.path("attachment") as any;
const cachedAttachmentIsOptional = cachedAttachmentPath && cachedAttachmentPath.isRequired === false;
const cachedExpiryPath = cachedMessageModel?.schema.path("expiresAt");

if (cachedMessageModel && (!cachedAttachmentIsOptional || !cachedExpiryPath)) {
  delete mongoose.models.Message;
}

export const MessageModel: Model<IMessage> =
  (mongoose.models.Message as Model<IMessage>) || mongoose.model<IMessage>("Message", MessageSchema);

export const ChatReadModel: Model<IChatRead> =
  (mongoose.models.ChatRead as Model<IChatRead>) || mongoose.model<IChatRead>("ChatRead", ChatReadSchema);

export const VoiceCallModel: Model<any> =
  (mongoose.models.VoiceCall as Model<any>) || mongoose.model("VoiceCall", VoiceCallSchema);
