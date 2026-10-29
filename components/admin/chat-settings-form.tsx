"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { updateAdminChatSettings } from "@/server-functions/chat-settings";

type Settings = { allowMedia: boolean; allowImages: boolean; allowDocuments: boolean; allowVoiceCalls: boolean; retentionDays: number | null };

export default function ChatSettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>(() => ({
    allowMedia: Boolean(initial?.allowMedia),
    allowImages: Boolean(initial?.allowImages),
    allowDocuments: Boolean(initial?.allowDocuments),
    allowVoiceCalls: Boolean(initial?.allowVoiceCalls),
    retentionDays: initial?.retentionDays ?? 30,
  }));
  const [saving, setSaving] = useState(false);
  const set = (key: keyof Settings, value: boolean | number | null) => setSettings((current) => ({ ...current, [key]: value }));
  return <div className="max-w-2xl overflow-hidden rounded-3xl border bg-card shadow-sm">
    <div className="space-y-5 p-6 sm:p-8">
      <label className="flex items-start gap-3"><input type="checkbox" checked={settings.allowMedia} onChange={(event) => set("allowMedia", event.target.checked)} className="mt-1 h-4 w-4 accent-primary" /><span><span className="block font-medium">Allow media in chats</span><span className="mt-1 block text-sm text-muted-foreground">Users can attach files to direct and group messages.</span></span></label>
      <label className="flex items-start gap-3"><input type="checkbox" disabled={!settings.allowMedia} checked={settings.allowImages} onChange={(event) => set("allowImages", event.target.checked)} className="mt-1 h-4 w-4 accent-primary" /><span><span className="block font-medium">Allow photos</span><span className="mt-1 block text-sm text-muted-foreground">JPG, PNG, GIF and WebP image uploads.</span></span></label>
      <label className="flex items-start gap-3"><input type="checkbox" disabled={!settings.allowMedia} checked={settings.allowDocuments} onChange={(event) => set("allowDocuments", event.target.checked)} className="mt-1 h-4 w-4 accent-primary" /><span><span className="block font-medium">Allow documents</span><span className="mt-1 block text-sm text-muted-foreground">PDF, ZIP, DOCX and other non-image files.</span></span></label>
      <label className="flex items-start gap-3 border-t pt-5"><input type="checkbox" checked={settings.allowVoiceCalls} onChange={(event) => set("allowVoiceCalls", event.target.checked)} className="mt-1 h-4 w-4 accent-primary" /><span><span className="block font-medium">Allow voice calls</span><span className="mt-1 block text-sm text-muted-foreground">Enable voice calls in direct and group chats. Users still need to grant microphone permission.</span></span></label>
      <div className="border-t pt-5"><label className="block text-sm font-medium">Automatic deletion</label><p className="mt-1 text-sm text-muted-foreground">Cloudinary attachments are deleted after this many days.</p><div className="mt-3 flex items-center gap-3"><input type="number" min={1} max={3650} disabled={!settings.allowMedia} value={settings.retentionDays ?? ""} onChange={(event) => set("retentionDays", event.target.value ? Number(event.target.value) : null)} placeholder="Never" className="h-10 w-32 rounded-lg border bg-background px-3 text-sm disabled:opacity-50" /><span className="text-sm text-muted-foreground">days · empty means never</span></div></div>
      <button type="button" disabled={saving} onClick={async () => { setSaving(true); const result = await updateAdminChatSettings(settings); if ("error" in result) toast.error(result.error); else { toast.success("Chat media settings saved"); router.refresh(); } setSaving(false); }} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">{saving ? "Saving..." : "Save settings"}</button>
    </div>
  </div>;
}
