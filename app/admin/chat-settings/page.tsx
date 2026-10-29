import { getAdminChatSettings } from "@/server-functions/chat-settings";
import ChatSettingsForm from "@/components/admin/chat-settings-form";

export default async function ChatSettingsPage() {
  const result = await getAdminChatSettings();
  if ("error" in result) return <main className="p-8"><h1 className="text-2xl font-semibold">Access denied</h1><p className="mt-2 text-sm text-muted-foreground">{result.error}</p></main>;
  return <main className="min-h-screen space-y-6 p-4 sm:p-8">
    <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Platform settings</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Chat media & calls</h1><p className="mt-2 max-w-xl text-sm text-muted-foreground">Control media sharing, voice calls and automatic Cloudinary cleanup.</p></div>
    <ChatSettingsForm initial={result.settings as { allowMedia: boolean; allowImages: boolean; allowDocuments: boolean; allowVoiceCalls: boolean; retentionDays: number | null }} />
  </main>;
}
