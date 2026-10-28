import mongoose, { Schema, type Model } from "mongoose";

export type ChatKind = "direct" | "group";

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
  unread: number;
}

export interface ChatMessage {
  _id: string;
  text: string;
  sender: ChatUser;
  createdAt: string | Date;
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
  createdOn?: Date;
  updatedAt?: Date;
}

export interface IChatRead {
  _id?: string;
  chat: mongoose.Types.ObjectId | string;
  user: mongoose.Types.ObjectId | string;
  lastReadAt: Date;
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
    lastMessage: { type: LastMessageSchema },
    lastMessageAt: { type: Date, index: true },
  },
  { timestamps: { createdAt: "createdOn", updatedAt: "updatedAt" }, minimize: false }
);

ChatSchema.index({ participants: 1, lastMessageAt: -1 });
ChatSchema.index({ kind: 1, lastMessageAt: -1 });
ChatSchema.index({ systemKey: 1 }, { unique: true, sparse: true });

const MessageSchema = new Schema<IMessage>(
  {
    chat: { type: Schema.Types.ObjectId, ref: "Chat", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true, maxlength: 4000 },
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

ChatReadSchema.index({ chat: 1, user: 1 }, { unique: true });

export const ChatModel: Model<IChat> =
  (mongoose.models.Chat as Model<IChat>) || mongoose.model<IChat>("Chat", ChatSchema);

export const MessageModel: Model<IMessage> =
  (mongoose.models.Message as Model<IMessage>) || mongoose.model<IMessage>("Message", MessageSchema);

export const ChatReadModel: Model<IChatRead> =
  (mongoose.models.ChatRead as Model<IChatRead>) || mongoose.model<IChatRead>("ChatRead", ChatReadSchema);
