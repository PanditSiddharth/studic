"use server";

import mongoose from "mongoose";
import connectDB from "@/connectDB";
import {
  ChatModel,
  ChatReadModel,
  MessageModel,
  type ChatDirectoryUser,
  type ChatMessage,
  type ChatSummary,
  type ChatUser,
} from "@/modals/chat.model";
import { UserModel } from "@/modals/user.model";
import { getSessionUser } from "./user";

const idOf = (value: any) => String(value?._id ?? value ?? "");
const isAdmin = (user: any) => user?.role === "admin";
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const COMMUNITY_CHAT_KEY = "all-site-users";
const COMMUNITY_CHAT_NAME = "Studic Community";

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

const toMessage = (message: any): ChatMessage => ({
  _id: idOf(message?._id),
  text: String(message?.text || ""),
  sender: toChatUser(message?.sender),
  createdAt: message?.createdOn || message?.createdAt || new Date().toISOString(),
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

export async function sendChatMessage(input: { chatId: string; text: string }) {
  const user = await getSessionUser();
  if (!user?._id) return { error: "Sign in to send messages", requiresAuth: true };
  if (!mongoose.isValidObjectId(input?.chatId)) return { error: "Chat not found" };

  const text = String(input?.text || "").trim();
  if (!text) return { error: "Write a message first" };
  if (text.length > 4000) return { error: "Keep messages under 4000 characters" };

  try {
    await connectDB();
    const chat = await ChatModel.findById(input.chatId).select("participants lastMessageAt");
    if (!chat) return { error: "Chat not found" };
    if (!isParticipant(chat, String(user._id))) {
      return { error: "Only members can send messages in this chat" };
    }

    const message = await MessageModel.create({
      chat: chat._id,
      sender: user._id,
      text,
    });

    const createdAt = message.createdOn || new Date();
    await ChatModel.updateOne(
      { _id: chat._id },
      {
        $set: {
          lastMessage: {
            text: text.length > 200 ? `${text.slice(0, 197)}...` : text,
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
