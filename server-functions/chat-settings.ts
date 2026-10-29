"use server";

import connectDB from "@/connectDB";
import { ChatSettingsModel } from "@/modals/chat-settings.model";
import { getSessionUser } from "./user";

export async function getAdminChatSettings() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return { error: "Administrator access required" as const };
  await connectDB();
  await ChatSettingsModel.collection.updateOne(
    { key: "default" },
    {
      $setOnInsert: {
        key: "default",
        allowMedia: false,
        allowImages: false,
        allowDocuments: false,
        allowVoiceCalls: false,
        retentionDays: 30,
      },
    },
    { upsert: true }
  );
  const settings = await ChatSettingsModel.collection.findOne({ key: "default" });
  return {
    settings: JSON.parse(JSON.stringify({
      ...settings,
      allowMedia: Boolean(settings?.allowMedia),
      allowImages: Boolean(settings?.allowImages),
      allowDocuments: Boolean(settings?.allowDocuments),
      allowVoiceCalls: Boolean(settings?.allowVoiceCalls),
      retentionDays: settings?.retentionDays ?? 30,
    })),
  };
}

export async function updateAdminChatSettings(input: {
  allowMedia: boolean;
  allowImages: boolean;
  allowDocuments: boolean;
  allowVoiceCalls: boolean;
  retentionDays: number | null;
}) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return { error: "Administrator access required" as const };
  const retentionDays = input.retentionDays == null ? null : Math.floor(Number(input.retentionDays));
  if (retentionDays !== null && (retentionDays < 1 || retentionDays > 3650)) {
    return { error: "Retention must be between 1 and 3650 days, or never expire." };
  }
  await connectDB();
  await ChatSettingsModel.collection.updateOne(
    { key: "default" },
    {
      $set: {
        allowMedia: Boolean(input.allowMedia),
        allowImages: Boolean(input.allowMedia && input.allowImages),
        allowDocuments: Boolean(input.allowMedia && input.allowDocuments),
        allowVoiceCalls: Boolean(input.allowVoiceCalls),
        retentionDays,
        updatedBy: user._id,
      },
    },
    { upsert: true }
  );
  const settings = await ChatSettingsModel.collection.findOne({ key: "default" });
  return {
    success: true,
    settings: JSON.parse(JSON.stringify({
      ...settings,
      allowMedia: Boolean(settings?.allowMedia),
      allowImages: Boolean(settings?.allowImages),
      allowDocuments: Boolean(settings?.allowDocuments),
      allowVoiceCalls: Boolean(settings?.allowVoiceCalls),
      retentionDays: settings?.retentionDays ?? 30,
    })),
  };
}
