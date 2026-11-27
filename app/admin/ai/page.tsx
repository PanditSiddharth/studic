import AIStudio from "@/components/admin/ai-studio";
import { getAIStudioData } from "@/server-functions/ai-studio";

export default async function AdminAIStudioPage() {
  const result = await getAIStudioData();
  if ("error" in result) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-semibold">AI Studio unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">{result.error}</p>
      </main>
    );
  }
  return <AIStudio initialSettings={result.settings} initialDrafts={result.drafts} initialDraftTotal={result.totalDrafts} />;
}
