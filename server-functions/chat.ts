"use server";

import mongoose from "mongoose";
import connectDB from "@/connectDB";
import {
  ChatModel,
  ChatReadModel,
  MessageModel,
  VoiceCallModel,
  type ChatDirectoryUser,
  type ChatMessage,
  type ChatSummary,
  type ChatUser,
} from "@/modals/chat.model";
import { UserModel } from "@/modals/user.model";
import { getSessionUser } from "./user";
import { ChatSettingsModel } from "@/modals/chat-settings.model";
import { deleteExpiredCloudinaryAssets } from "@/lib/cloudinary";

const idOf = (value: any) => String(value?._id ?? value ?? "");
const isAdmin = (user: any) => user?.role === "admin";
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const COMMUNITY_CHAT_KEY = "all-site-users";
const COMMUNITY_CHAT_NAME = "Studic Community";
const RESTRICTED_WORD_MUTE_SECONDS = 10 * 60;
const MAX_VOICE_PARTICIPANTS = 5;
const VOICE_LEASE_MS = 15_000;

const defaultChatMediaSettings = {
  allowMedia: false,
  allowImages: false,
  allowDocuments: false,
  allowVoiceCalls: false,
  retentionDays: 30,
};

async function getChatMediaConfig() {
  const settings = await ChatSettingsModel.findOne({ key: "default" }).lean();
  return settings ? {
    allowMedia: Boolean(settings.allowMedia),
    allowImages: Boolean(settings.allowImages),
    allowDocuments: Boolean(settings.allowDocuments),
    allowVoiceCalls: Boolean(settings.allowVoiceCalls),
    retentionDays: settings.retentionDays == null ? null : Number(settings.retentionDays),
  } : defaultChatMediaSettings;
}

export async function getChatMediaSettings() {
  const user = await getSessionUser();
  if (!user?._id) return { error: "Sign in to open chats" };
  try {
    await connectDB();
    return { settings: await getChatMediaConfig() };
  } catch (error: any) {
    console.error("Error loading chat media settings", error);
    return { error: error?.message || "Could not load chat settings" };
  }
}

export async function cleanupExpiredChatMedia() {
    await connectDB();
    const expired = await MessageModel.find({
      "attachment.url": { $exists: true },
      "attachment.expiresAt": { $ne: null, $lte: new Date() },
    }).select("attachment.url").lean();
    if (!expired.length) return { deleted: 0 };
    await deleteExpiredCloudinaryAssets(expired.map((message: any) => ({ url: String(message.attachment.url) })));
    const result = await MessageModel.updateMany(
      { _id: { $in: expired.map((message: any) => message._id) } },
      { $unset: { attachment: 1 } }
    );
    return { deleted: result.modifiedCount || 0 };
}

async function ensureCommunityChat(userId: string) {
  const users = await UserModel.find({ status: { $ne: "deleted" } }).select("_id").lean();
  const participantIds = users.map((entry: any) => entry._id);
  if (!participantIds.some((id: any) => String(id) === userId)) {
    participantIds.push(new mongoose.Types.ObjectId(userId));
  }

  return ChatModel.findOneAndUpdate(
    { systemKey: COMMUNITY_CHAT_KEY },
    {
      $set: {
        name: COMMUNITY_CHAT_NAME,
        description: "A shared chat for everyone on Studic.",
      },
      $setOnInsert: {
        kind: "group",
        admins: [],
        createdBy: userId,
        lastMessageAt: new Date(),
      },
      $addToSet: { participants: { $each: participantIds } },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

const toChatUser = (user: any): ChatUser => ({
  _id: idOf(user),
  name: user?.name || "Member",
  username: user?.username || undefined,
  image: user?.image || "",
  role: user?.role || "student",
});

const isParticipant = (chat: any, userId: string) =>
  (chat?.participants || []).some((participant: any) => idOf(participant) === String(userId));

const isGroupAdmin = (chat: any, userId: string) =>
  (chat?.admins || []).some((admin: any) => idOf(admin) === String(userId));

const canManageChat = (chat: any, user: any) =>
  isAdmin(user) || idOf(chat?.createdBy) === String(user?._id) || isGroupAdmin(chat, String(user?._id));

const activeMute = (chat: any, userId: string) =>
  (chat?.mutedUsers || []).find((entry: any) =>
    idOf(entry.user) === String(userId) && entry.until && new Date(entry.until).getTime() > Date.now()
  );

const containsRestrictedWord = (text: string, words: string[]) => {
  const normalized = text.toLocaleLowerCase();
  return words.find((word) => word && normalized.includes(word.toLocaleLowerCase()));
};

const toMessage = (message: any): ChatMessage => ({
  _id: idOf(message?._id),
  text: String(message?.text || ""),
  sender: toChatUser(message?.sender),
  createdAt: message?.createdOn || message?.createdAt || new Date().toISOString(),
  attachment: message?.attachment ? {
    url: String(message.attachment.url),
    name: String(message.attachment.name),
    mimeType: String(message.attachment.mimeType),
    kind: message.attachment.kind,
    expiresAt: message.attachment.expiresAt || null,
  } : undefined,
});

const toChatSummary = (
  chat: any,
  viewer: any,
  state: { participant: boolean; unread: number }
): ChatSummary => {
  const viewerId = String(viewer?._id || "");
  const participants: ChatUser[] = (chat?.participants || []).map(toChatUser);
  const other = participants.find((participant) => participant._id !== viewerId);
  const isGroup = chat?.kind === "group";

  let title = "Conversation";
  let subtitle = "";

  if (isGroup) {
    title = chat?.name || "Group chat";
    subtitle = `${participants.length} member${participants.length === 1 ? "" : "s"}`;
  } else if (state.participant) {
    title = other?.name || "Direct message";
    subtitle = other?.username ? `@${other.username}` : "Direct message";
  } else {
    title = participants.map((participant) => participant.name).join("  ↔  ") || "Direct message";
    subtitle = "Direct message · admin view";
  }

  const last = chat?.lastMessage;
  return {
    _id: idOf(chat?._id),
    kind: isGroup ? "group" : "direct",
    title,
    subtitle,
    description: isGroup ? String(chat?.description || "") : undefined,
    image: isGroup ? chat?.image || "" : other?.image || "",
    participants,
    memberCount: participants.length,
    adminIds: (chat?.admins || []).map(idOf),
    lastMessage: last?.text
      ? {
          text: String(last.text),
          senderId: idOf(last.senderId),
          senderName: String(last.senderName || ""),
          at: last.at || chat?.lastMessageAt || chat?.createdOn,
        }
      : null,
    lastMessageAt: chat?.lastMessageAt || chat?.createdOn || null,
    isParticipant: state.participant,
    canSend: state.participant,
    isGroupAdmin: isGroupAdmin(chat, viewerId),
    createdBy: idOf(chat?.createdBy),
    systemKey: chat?.systemKey || undefined,
    moderation: chat?.kind === "group" ? {
      slowModeSeconds: Number(chat?.slowModeSeconds || 0),
      restrictedWords: canManageChat(chat, viewer) ? (chat?.restrictedWords || []) : [],
      canManage: canManageChat(chat, viewer),
    } : undefined,
    unread: state.unread,
  };
};

interface GetChatsOptions {
  /** "all" is honoured for administrators only; everyone else gets their own chats. */
  scope?: "mine" | "all";
}

export async function getChats(options: GetChatsOptions = {}) {
  const user = await getSessionUser();
  if (!user?._id) return { error: "Sign in to open chats" };

  try {
    await connectDB();
    await ensureCommunityChat(String(user._id));
    const admin = isAdmin(user);
    const scope: "mine" | "all" = admin && options.scope === "all" ? "all" : "mine";
    const query = scope === "all" ? {} : { participants: user._id };

    const chats = await ChatModel.find(query)
      .sort({ lastMessageAt: -1, createdOn: -1 })
      .limit(80)
      .populate("participants", "name username image role")
      .populate("createdBy", "name username image role")
      .lean();

    const chatIds = chats.map((chat: any) => chat._id);
    const reads = await ChatReadModel.find({ user: user._id, chat: { $in: chatIds } })
      .select("chat lastReadAt")
      .lean();
    const readMap = new Map(reads.map((read: any) => [idOf(read.chat), new Date(read.lastReadAt)]));

    const summaries = await Promise.all(
      chats.map(async (chat: any) => {
        const participant = isParticipant(chat, String(user._id));
        if (!participant) {
          return toChatSummary(chat, user, { participant: false, unread: 0 });
        }
        const lastAt = chat.lastMessageAt ? new Date(chat.lastMessageAt) : null;
        const readAt = readMap.get(idOf(chat._id));
        if (!lastAt || (readAt && lastAt <= readAt)) {
          return toChatSummary(chat, user, { participant: true, unread: 0 });
        }
        const unread = await MessageModel.countDocuments({
          chat: chat._id,
          sender: { $ne: user._id },
          createdOn: { $gt: readAt || new Date(0) },
        });
        return toChatSummary(chat, user, { participant: true, unread });
      })
    );

    return JSON.parse(
      JSON.stringify({
        chats: summaries,
        scope,
        isAdmin: admin,
        currentUserId: String(user._id),
      })
    );
  } catch (error: any) {
    console.error("Error loading chats", error);
    return { error: error?.message || "Could not load chats" };
  }
}

export async function getChat(chatId: string) {
  const user = await getSessionUser();
  if (!user?._id) return { error: "Sign in to open chats" };
  if (!mongoose.isValidObjectId(chatId)) return { error: "Chat not found" };

  try {
    await connectDB();
    await ensureCommunityChat(String(user._id));
    const chat = await ChatModel.findById(chatId)
      .populate("participants", "name username image role")
      .populate("createdBy", "name username image role")
      .lean();

    if (!chat) return { error: "Chat not found" };

    const participant = isParticipant(chat, String(user._id));
    if (!participant && !isAdmin(user)) {
      return { error: "You do not have access to this chat" };
    }

    const messages = await MessageModel.find({ chat: chat._id })
      .sort({ createdOn: -1, _id: -1 })
      .limit(150)
      .populate("sender", "name username image role")
      .lean();

    if (participant) {
      await ChatReadModel.updateOne(
        { chat: chat._id, user: user._id },
        { $set: { lastReadAt: new Date() } },
        { upsert: true }
      );
    }

    return JSON.parse(
      JSON.stringify({
        chat: toChatSummary(chat, user, { participant, unread: 0 }),
        messages: messages.reverse().map(toMessage),
        currentUserId: String(user._id),
        readOnly: !participant,
      })
    );
  } catch (error: any) {
    console.error("Error opening chat", error);
    return { error: error?.message || "Could not open this chat" };
  }
}

/**
 * Fetch messages newer than a known message id. Used by the open conversation
 * to poll for new messages without reloading the whole history.
 */
export async function getChatMessages(input: { chatId: string; after?: string }) {
  const user = await getSessionUser();
  if (!user?._id) return { error: "Sign in to open chats" };
  if (!mongoose.isValidObjectId(input?.chatId)) return { error: "Chat not found" };

  try {
    await connectDB();
    await ensureCommunityChat(String(user._id));
    const chat = await ChatModel.findById(input.chatId)
      .select("participants")
      .lean();
    if (!chat) return { error: "Chat not found" };

    const participant = isParticipant(chat, String(user._id));
    if (!participant && !isAdmin(user)) {
      return { error: "You do not have access to this chat" };
    }

    const query: Record<string, unknown> = { chat: chat._id };
    if (input.after && mongoose.isValidObjectId(input.after)) {
      query._id = { $gt: new mongoose.Types.ObjectId(input.after) };
    }

    const messages = await MessageModel.find(query)
      .sort({ createdOn: 1, _id: 1 })
      .limit(120)
      .populate("sender", "name username image role")
      .lean();

    if (participant && messages.length) {
      await ChatReadModel.updateOne(
        { chat: chat._id, user: user._id },
        { $set: { lastReadAt: new Date() } },
        { upsert: true }
      );
    }

    return JSON.parse(
      JSON.stringify({
        messages: messages.map(toMessage),
        currentUserId: String(user._id),
      })
    );
  } catch (error: any) {
    console.error("Error loading messages", error);
    return { error: error?.message || "Could not load messages" };
  }
}

export async function sendChatMessage(input: {
  chatId: string;
  text: string;
  attachment?: { url: string; name: string; mimeType: string; kind: "image" | "document" };
}) {
  const user = await getSessionUser();
  if (!user?._id) return { error: "Sign in to send messages", requiresAuth: true };
  if (!mongoose.isValidObjectId(input?.chatId)) return { error: "Chat not found" };

  const text = String(input?.text || "").trim();
  if (!text && !input.attachment) return { error: "Write a message or attach a file first" };
  if (text.length > 4000) return { error: "Keep messages under 4000 characters" };

  try {
    await connectDB();
    const media = input.attachment ? await getChatMediaConfig() : null;
    if (input.attachment) {
      const attachment = input.attachment;
      if (!/^https:\/\/res\.cloudinary\.com\//i.test(attachment.url)) return { error: "Use a valid Cloudinary file" };
      if (!attachment.name || attachment.name.length > 240) return { error: "Invalid attachment name" };
      if (!media?.allowMedia || (attachment.kind === "image" ? !media.allowImages : !media.allowDocuments)) {
        return { error: "File sharing is disabled by the site administrator" };
      }
      if (attachment.kind === "image" && !attachment.mimeType.startsWith("image/")) return { error: "Invalid image type" };
      if (attachment.kind === "document" && attachment.mimeType.startsWith("image/")) return { error: "Invalid document type" };
    }
    const chat = await ChatModel.findById(input.chatId)
      .select("kind participants lastMessageAt slowModeSeconds restrictedWords mutedUsers admins createdBy");
    if (!chat) return { error: "Chat not found" };
    if (!isParticipant(chat, String(user._id))) {
      return { error: "Only members can send messages in this chat" };
    }
    const mute = activeMute(chat, String(user._id));
    if (mute) {
      const seconds = Math.max(1, Math.ceil((new Date(mute.until).getTime() - Date.now()) / 1000));
      return { error: `You are muted for ${seconds} more seconds` };
    }
    if (chat.kind === "group" && !canManageChat(chat, user)) {
      const cooldown = Number(chat.slowModeSeconds || 0);
      if (cooldown && chat.lastMessageAt) {
        const remaining = cooldown - Math.floor((Date.now() - new Date(chat.lastMessageAt).getTime()) / 1000);
        if (remaining > 0) return { error: `Slow mode: wait ${remaining} seconds` };
      }
      if (containsRestrictedWord(text, chat.restrictedWords || [])) {
        const until = new Date(Date.now() + RESTRICTED_WORD_MUTE_SECONDS * 1000);
        await ChatModel.updateOne(
          { _id: chat._id },
          { $pull: { mutedUsers: { user: user._id } }, $push: { mutedUsers: { user: user._id, until } } }
        );
        return { error: `Restricted word detected. You are muted for ${RESTRICTED_WORD_MUTE_SECONDS / 60} minutes.` };
      }
    }

    const message = await MessageModel.create({
      chat: chat._id,
      sender: user._id,
      // Keep the database message valid for attachment-only sends. The UI
      // renders the attachment itself, while this fallback supports older
      // cached Mongoose models that still require text.
      text: text || `Attachment: ${input.attachment?.name || "File"}`,
      attachment: input.attachment ? {
        ...input.attachment,
        expiresAt: media?.retentionDays ? new Date(Date.now() + media.retentionDays * 86400000) : null,
      } : undefined,
    });

    const createdAt = message.createdOn || new Date();
    await ChatModel.updateOne(
      { _id: chat._id },
      {
        $set: {
          lastMessage: {
            text: text ? (text.length > 200 ? `${text.slice(0, 197)}...` : text) : `Attachment: ${input.attachment?.name || "Attachment"}`,
            senderId: user._id,
            senderName: user.name || "Member",
            at: createdAt,
          },
          lastMessageAt: createdAt,
        },
      }
    );

    await ChatReadModel.updateOne(
      { chat: chat._id, user: user._id },
      { $set: { lastReadAt: createdAt } },
      { upsert: true }
    );

    const populated = await MessageModel.findById(message._id)
      .populate("sender", "name username image role")
      .lean();

    return JSON.parse(JSON.stringify({ message: toMessage(populated) }));
  } catch (error: any) {
    console.error("Error sending message", error);
    return { error: error?.message || "Could not send your message" };
  }
}

export async function updateChatModeration(input: {
  chatId: string;
  slowModeSeconds: number;
  restrictedWords: string[];
}) {
  const user = await getSessionUser();
  if (!user?._id) return { error: "Sign in to manage this group" };
  if (!mongoose.isValidObjectId(input?.chatId)) return { error: "Chat not found" };
  const slowModeSeconds = Math.min(86400, Math.max(0, Math.floor(Number(input.slowModeSeconds) || 0)));
  const restrictedWords = Array.from(new Set(
    (input.restrictedWords || [])
      .map((word) => String(word).trim().toLocaleLowerCase())
      .filter((word) => word.length >= 2 && word.length <= 60)
  )).slice(0, 100);
  try {
    await connectDB();
    const chat = await ChatModel.findById(input.chatId).select("kind createdBy admins");
    if (!chat || chat.kind !== "group") return { error: "Group not found" };
    if (!canManageChat(chat, user)) return { error: "Only the group owner or an admin can change restrictions" };
    await ChatModel.updateOne({ _id: chat._id }, { $set: { slowModeSeconds, restrictedWords } });
    return { success: true };
  } catch (error: any) {
    console.error("Error updating chat moderation", error);
    return { error: error?.message || "Could not update group restrictions" };
  }
}

export async function updateChatDetails(input: {
    chatId: string;
    name: string;
    description?: string;
    image?: string;
  }) {
    const user = await getSessionUser();
    if (!user?._id) return { error: "Sign in to manage this group" };
    if (!mongoose.isValidObjectId(input?.chatId)) return { error: "Group not found" };
    const name = String(input?.name || "").trim();
    const description = String(input?.description || "").trim();
    const image = String(input?.image || "").trim();
    if (name.length < 2 || name.length > 80) return { error: "Group name must be 2–80 characters" };
    if (description.length > 500) return { error: "Keep the description under 500 characters" };
    if (image && !/^https:\/\/res\.cloudinary\.com\//i.test(image)) return { error: "Use a valid Cloudinary image" };

    try {
      await connectDB();
      const chat = await ChatModel.findById(input.chatId).select("kind createdBy admins");
      if (!chat || chat.kind !== "group") return { error: "Group not found" };
      if (!canManageChat(chat, user)) return { error: "Only the group owner or an admin can edit this group" };
      await ChatModel.updateOne({ _id: chat._id }, { $set: { name, description, image } });
      return { success: true };
    } catch (error: any) {
      console.error("Error updating chat details", error);
      return { error: error?.message || "Could not update group details" };
  }
}

export async function muteChatUser(input: { chatId: string; userId: string; seconds: number }) {
  const user = await getSessionUser();
  if (!user?._id || !mongoose.isValidObjectId(input?.chatId) || !mongoose.isValidObjectId(input?.userId)) {
    return { error: "Invalid moderation request" };
  }
  const seconds = Math.min(604800, Math.max(10, Math.floor(Number(input.seconds) || 0)));
  try {
    await connectDB();
    const chat = await ChatModel.findById(input.chatId).select("kind createdBy admins participants");
    if (!chat || chat.kind !== "group") return { error: "Group not found" };
    if (!canManageChat(chat, user)) return { error: "Only the group owner or an admin can mute users" };
    if (!isParticipant(chat, input.userId)) return { error: "User is not a group member" };
    if (String(user._id) === input.userId) return { error: "You cannot mute yourself" };
    await ChatModel.updateOne(
      { _id: chat._id },
      { $pull: { mutedUsers: { user: input.userId } }, $push: { mutedUsers: { user: input.userId, until: new Date(Date.now() + seconds * 1000) } } }
    );
    return { success: true };
  } catch (error: any) {
    console.error("Error muting chat user", error);
    return { error: error?.message || "Could not mute user" };
  }
}

export async function deleteChatMessage(messageId: string) {
  const user = await getSessionUser();
  if (!user?._id || !mongoose.isValidObjectId(messageId)) return { error: "Invalid message" };
  try {
    await connectDB();
    const message = await MessageModel.findById(messageId).select("chat sender");
    if (!message) return { error: "Message not found" };
    const chat = await ChatModel.findById(message.chat).select("kind createdBy admins participants");
    if (!chat) return { error: "Chat not found" };
    const ownMessage = idOf(message.sender) === String(user._id);
    if (!ownMessage && !canManageChat(chat, user)) return { error: "You cannot delete this message" };
    await MessageModel.deleteOne({ _id: message._id });
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting chat message", error);
    return { error: error?.message || "Could not delete message" };
  }
}

const voiceParticipant = (entry: any) => ({
  userId: idOf(entry.user),
  joinedAt: entry.joinedAt,
  lastSeenAt: entry.lastSeenAt,
});

export async function joinVoiceCall(chatId: string) {
  const user = await getSessionUser();
  if (!user?._id) return { error: "Sign in to join a voice call", requiresAuth: true };
  if (!mongoose.isValidObjectId(chatId)) return { error: "Chat not found" };
  try {
    await connectDB();
    const config = await getChatMediaConfig();
    if (!config.allowVoiceCalls) return { error: "Voice calls are disabled by the administrator" };
    const chat = await ChatModel.findById(chatId).select("participants");
    if (!chat || !isParticipant(chat, String(user._id))) return { error: "Only chat members can join this call" };
    const now = new Date();
    const stale = new Date(Date.now() - VOICE_LEASE_MS);
    await VoiceCallModel.updateOne({ chat: chat._id }, { $pull: { participants: { lastSeenAt: { $lt: stale } } } });
    const current = await VoiceCallModel.findOne({ chat: chat._id });
    const existing = current?.participants?.find((entry: any) => idOf(entry.user) === String(user._id));
    if (existing) {
      await VoiceCallModel.updateOne({ _id: current._id, "participants.user": user._id }, { $set: { "participants.$.lastSeenAt": now } });
    } else {
      const activeCount = (current?.participants || []).filter((entry: any) => new Date(entry.lastSeenAt).getTime() >= stale.getTime()).length;
      if (activeCount >= MAX_VOICE_PARTICIPANTS) {
        return { waiting: true, activeCount, limit: MAX_VOICE_PARTICIPANTS };
      }
      await VoiceCallModel.findOneAndUpdate(
        { chat: chat._id },
        { $setOnInsert: { chat: chat._id }, $push: { participants: { user: user._id, joinedAt: now, lastSeenAt: now } } },
        { upsert: true, new: true }
      );
    }
    const fresh: any = await VoiceCallModel.findOne({ chat: chat._id }).lean();
    return { joined: true, participants: (fresh?.participants || []).map(voiceParticipant), limit: MAX_VOICE_PARTICIPANTS };
  } catch (error: any) {
    console.error("Error joining voice call", error);
    return { error: error?.message || "Could not join voice call" };
  }
}

export async function leaveVoiceCall(chatId: string) {
  const user = await getSessionUser();
  if (!user?._id || !mongoose.isValidObjectId(chatId)) return { error: "Invalid voice call" };
  await connectDB();
  await VoiceCallModel.updateOne({ chat: chatId }, { $pull: { participants: { user: user._id } } });
  return { success: true };
}

export async function heartbeatVoiceCall(chatId: string) {
  const user = await getSessionUser();
  if (!user?._id || !mongoose.isValidObjectId(chatId)) return { error: "Invalid voice call" };
  await connectDB();
  const call: any = await VoiceCallModel.findOneAndUpdate(
    { chat: chatId, "participants.user": user._id },
    { $set: { "participants.$.lastSeenAt": new Date() } },
    { new: true }
  ).lean();
  return { participants: (call?.participants || []).map(voiceParticipant), limit: MAX_VOICE_PARTICIPANTS };
}

export async function exchangeVoiceSignal(input: { chatId: string; to: string; type: "offer" | "answer" | "candidate"; payload: Record<string, unknown> }) {
  const user = await getSessionUser();
  if (!user?._id || !mongoose.isValidObjectId(input?.chatId) || !mongoose.isValidObjectId(input?.to)) return { error: "Invalid voice signal" };
  await connectDB();
  const call: any = await VoiceCallModel.findOne({ chat: input.chatId, "participants.user": { $all: [user._id, input.to] } });
  if (!call) return { error: "Both users must be in the voice call" };
  await VoiceCallModel.updateOne({ _id: call._id }, { $push: { signals: { from: user._id, to: input.to, type: input.type, payload: input.payload, createdAt: new Date() } } });
  return { success: true };
}

export async function getVoiceSignals(chatId: string) {
  const user = await getSessionUser();
  if (!user?._id || !mongoose.isValidObjectId(chatId)) return { error: "Invalid voice call" };
  await connectDB();
  const call: any = await VoiceCallModel.findOne({ chat: chatId, "participants.user": user._id }).lean();
  if (!call) return { signals: [], participants: [], limit: MAX_VOICE_PARTICIPANTS };
  const signals = (call.signals || []).filter((signal: any) => idOf(signal.to) === String(user._id));
  if (signals.length) await VoiceCallModel.updateOne({ _id: call._id }, { $pull: { signals: { to: user._id } } });
  return { signals, participants: (call.participants || []).map(voiceParticipant), limit: MAX_VOICE_PARTICIPANTS };
}

export async function startDirectChat(userId: string) {
  const user = await getSessionUser();
  if (!user?._id) return { error: "Sign in to start a chat", requiresAuth: true };
  if (!mongoose.isValidObjectId(userId)) return { error: "Choose a person to message" };
  if (String(user._id) === String(userId)) return { error: "You cannot message yourself" };

  try {
    await connectDB();
    const target = await UserModel.findOne({ _id: userId, status: { $ne: "deleted" } })
      .select("_id")
      .lean();
    if (!target) return { error: "This person could not be found" };

    const existing = await ChatModel.findOne({
      kind: "direct",
      participants: { $all: [user._id, userId], $size: 2 },
    }).select("_id");

    if (existing) return { chatId: idOf(existing._id), existing: true };

    const chat = await ChatModel.create({
      kind: "direct",
      participants: [user._id, userId],
      admins: [],
      createdBy: user._id,
      lastMessageAt: new Date(),
    });

    return { chatId: idOf(chat._id), existing: false };
  } catch (error: any) {
    console.error("Error starting direct chat", error);
    return { error: error?.message || "Could not start this chat" };
  }
}

export async function startSupportChat() {
    const user = await getSessionUser();
    if (!user?._id) return { error: "Sign in to start a support chat", requiresAuth: true };
    try {
      await connectDB();
      const target = await UserModel.findOne({
        role: "admin",
        status: { $ne: "deleted" },
        _id: { $ne: user._id },
      }).sort({ createdOn: 1 }).select("_id").lean();
      if (!target) return { error: "Support chat is temporarily unavailable" };
      return startDirectChat(String(target._id));
    } catch (error: any) {
      console.error("Error starting support chat", error);
      return { error: error?.message || "Could not start support chat" };
  }
}

export async function createChatGroup(input: {
  name: string;
  description?: string;
  memberIds: string[];
}) {
  const user = await getSessionUser();
  if (!user?._id) return { error: "Sign in to create a group", requiresAuth: true };

  const name = String(input?.name || "").trim();
  const description = String(input?.description || "").trim();
  if (name.length < 2) return { error: "Give the group a name" };
  if (name.length > 80) return { error: "Group names can be at most 80 characters" };
  if (description.length > 500) return { error: "Keep the description under 500 characters" };

  const memberIds = Array.from(
    new Set((input?.memberIds || []).map(String).filter((id) => mongoose.isValidObjectId(id)))
  ).filter((id) => id !== String(user._id));

  if (!memberIds.length) return { error: "Add at least one member" };

  try {
    await connectDB();
    const members = await UserModel.find({ _id: { $in: memberIds }, status: { $ne: "deleted" } })
      .select("_id")
      .lean();
    if (!members.length) return { error: "None of those people could be found" };

    const chat = await ChatModel.create({
      kind: "group",
      name,
      description,
      participants: [user._id, ...members.map((member: any) => member._id)],
      admins: [user._id],
      createdBy: user._id,
      lastMessageAt: new Date(),
    });

    return { chatId: idOf(chat._id) };
  } catch (error: any) {
    console.error("Error creating group", error);
    return { error: error?.message || "Could not create this group" };
  }
}

export async function getChatDirectory(input: { search?: string } = {}) {
  const user = await getSessionUser();
  if (!user?._id) return { error: "Sign in to find people" };

  try {
    await connectDB();
    const admin = isAdmin(user);
    const search = String(input?.search || "").trim();
    const query: Record<string, unknown> = {
      _id: { $ne: user._id },
      status: { $ne: "deleted" },
    };

    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      const or: Record<string, unknown>[] = [{ name: rx }, { username: rx }];
      if (admin) or.push({ email: rx });
      query.$or = or;
    }

    const users = await UserModel.find(query)
      .select("name username image role email")
      .sort({ role: 1, name: 1 })
      .limit(60)
      .lean();

    const directory: ChatDirectoryUser[] = users.map((entry: any) => ({
      ...toChatUser(entry),
      email: admin ? entry.email : undefined,
      isAdmin: entry.role === "admin",
    }));

    return JSON.parse(
      JSON.stringify({
        users: directory,
        isAdmin: admin,
        currentUserId: String(user._id),
      })
    );
  } catch (error: any) {
    console.error("Error loading chat directory", error);
    return { error: error?.message || "Could not load people" };
  }
}
