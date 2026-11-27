"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight, Check, FileJson2, FileText, ImagePlus, LoaderCircle, Package,
  Plus, Save, Settings2, Sparkles, Trash2, UploadCloud, WandSparkles,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  deleteAIStudioDraft, generateAIDrafts, generateAIStudioThumbnail, getAIStudioDraftPage,
  importAIStudioDrafts, saveAIStudioDraftAsContent, saveAIStudioSettings,
  testAIStudioProvider, updateAIStudioDraft,
} from "@/server-functions/ai-studio";
import { parseAIImportText } from "@/lib/ai-studio-schema";
import { ImageUpload, uploadGeneratedThumbnail } from "@/components/product/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import MyEditor from "@/app/admin/(add)/editor";

type ProviderProtocol = "ollama" | "openai-compatible" | "openai" | "gemini" | "anthropic";
type Provider = {
  id: string;
  name: string;
  protocol: ProviderProtocol;
  baseUrl: string;
  model: string;
  imageModel: string;
  hasApiKey: boolean;
};
type Settings = {
  providers: Provider[];
  activeProviderId: string;
  imageProviderId: string;
  siteContext: string;
};
type Draft = {
  _id: string;
  contentType: "product" | "article";
  source: "ai" | "json";
  status: "review" | "saved";
  data: Record<string, unknown>;
  contentSlug?: string;
  createdOn?: string;
};
type ImportState = ReturnType<typeof parseAIImportText>;
type Props = { initialSettings: Settings; initialDrafts: Draft[]; initialDraftTotal: number };

const protocols: Array<{ value: ProviderProtocol; label: string }> = [
  { value: "ollama", label: "Ollama (local/offline)" },
  { value: "openai-compatible", label: "OpenAI-compatible / custom API" },
  { value: "openai", label: "OpenAI" },
  { value: "gemini", label: "Google Gemini" },
  { value: "anthropic", label: "Anthropic Claude" },
];

const inputClass = "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
const textAreaClass = "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

function valueText(value: unknown) {
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (typeof value === "string" || typeof value === "number") return String(value);
  return "";
}

function endpointPlaceholder(protocol: ProviderProtocol) {
  if (protocol === "ollama") return "http://localhost:11434";
  if (protocol === "openai") return "https://api.openai.com/v1";
  if (protocol === "gemini") return "https://generativelanguage.googleapis.com/v1beta";
  if (protocol === "anthropic") return "https://api.anthropic.com/v1";
  return "https://your-provider.example/v1";
}

function newProvider(): Provider {
  return {
    id: `provider-${Date.now().toString(36)}`,
    name: "New provider",
    protocol: "openai-compatible",
    baseUrl: "",
    model: "",
    imageModel: "",
    hasApiKey: false,
  };
}

const sampleJSON = `[
  {
    "type": "product",
    "title": "IGNOU BCS-111 revision notes",
    "description": "Original description of the resource.",
    "tags": ["IGNOU", "BCS-111"],
    "price": 0,
    "fileLink": "",
    "thumbnail": ""
  },
  {
    "type": "article",
    "title": "How to plan a focused study session",
    "description": "A short summary for readers.",
    "content": "## Start with one clear goal\\nWrite original article content here.",
    "category": ["study-skills"],
    "tags": ["study plan"],
    "thumbnail": ""
  }
]`;

export default function AIStudio({ initialSettings, initialDrafts, initialDraftTotal }: Props) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [drafts, setDrafts] = useState(initialDrafts);
  const [savedDrafts, setSavedDrafts] = useState<Draft[]>([]);
  const [draftTotal, setDraftTotal] = useState(initialDraftTotal);
  const [draftSkip, setDraftSkip] = useState(0);
  const [activeTab, setActiveTab] = useState<"generate" | "import" | "review" | "settings">("generate");
  const [contentType, setContentType] = useState<"product" | "article">("article");
  const [brief, setBrief] = useState("");
  const [count, setCount] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [importResult, setImportResult] = useState<ImportState | null>(null);
  const [importing, setImporting] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [testingProvider, setTestingProvider] = useState("");
  const [providerKeys, setProviderKeys] = useState<Record<string, string>>({});
  const [clearKeys, setClearKeys] = useState<string[]>([]);
  const [busyDraftId, setBusyDraftId] = useState("");
  const [thumbnailPreviews, setThumbnailPreviews] = useState<Record<string, string>>({});
  const [imageBusyId, setImageBusyId] = useState("");

  const updateProvider = (id: string, patch: Partial<Provider>) => {
    setSettingsDirty(true);
    setSettings((current) => ({
      ...current,
      providers: current.providers.map((provider) => provider.id === id ? { ...provider, ...patch } : provider),
    }));
  };

  const addProvider = () => {
    const provider = newProvider();
    setSettingsDirty(true);
    setSettings((current) => ({ ...current, providers: [...current.providers, provider] }));
  };

  const removeProvider = (id: string) => {
    if (settings.providers.length <= 1) return toast.error("Keep at least one provider profile.");
    setSettingsDirty(true);
    const remaining = settings.providers.filter((provider) => provider.id !== id);
    setSettings((current) => ({
      ...current,
      providers: remaining,
      activeProviderId: current.activeProviderId === id ? remaining[0].id : current.activeProviderId,
      imageProviderId: current.imageProviderId === id ? "" : current.imageProviderId,
    }));
    setProviderKeys((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setClearKeys((current) => current.filter((key) => key !== id));
  };

  const setDraftData = (id: string, field: string, value: string) => {
    setDrafts((current) => current.map((draft) => draft._id === id
      ? { ...draft, data: { ...draft.data, [field]: value } }
      : draft));
  };

  const replaceDraft = (updated: Draft) => {
    setDrafts((current) => current.map((draft) => draft._id === updated._id ? updated : draft));
  };

  const refreshQueue = async (skip: number) => {
    const result = await getAIStudioDraftPage(skip);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setDrafts(result.drafts as Draft[]);
    setDraftTotal(result.total);
    setDraftSkip(skip);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setNotice("");
    try {
      const result = await generateAIDrafts({ contentType, brief, count });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      await refreshQueue(0);
      setBrief("");
      setActiveTab("review");
      if (result.rejected.length) setNotice(result.rejected.join(" "));
      toast.success(`${result.drafts.length} item${result.drafts.length === 1 ? "" : "s"} added to the review queue.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not generate content.");
    } finally {
      setGenerating(false);
    }
  };

  const readJSONFile = async (file?: File) => {
    if (!file) return;
    if (file.size > 700_000) {
      toast.error("JSON file must be smaller than 700 KB. Split large imports into smaller batches.");
      return;
    }
    const text = await file.text();
    setJsonText(text);
    setImportResult(parseAIImportText(text));
  };

  const validateJSON = () => setImportResult(parseAIImportText(jsonText));

  const importJSON = async () => {
    if (!importResult?.rows.length) return;
    setImporting(true);
    try {
      const result = await importAIStudioDrafts(importResult.rows.map((row) => ({
        contentType: row.contentType,
        data: { ...row.data },
      })));
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      await refreshQueue(0);
      if (importResult.errors.length) {
        const remainingJSON = JSON.stringify(importResult.invalidRows, null, 2);
        setJsonText(remainingJSON);
        setImportResult(parseAIImportText(remainingJSON));
        setNotice("Valid rows were added to review. The invalid rows remain here so you can fix and revalidate them.");
      } else {
        setJsonText("");
        setImportResult(null);
        setActiveTab("review");
      }
      toast.success(`${result.drafts.length} JSON item${result.drafts.length === 1 ? "" : "s"} added to the review queue.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not import JSON.");
    } finally {
      setImporting(false);
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const result = await saveAIStudioSettings({
        ...settings,
        providers: settings.providers.map((provider) => ({
          ...provider,
          apiKey: providerKeys[provider.id] || "",
          clearApiKey: clearKeys.includes(provider.id),
        })),
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setSettings(result.settings as Settings);
      setProviderKeys({});
      setClearKeys([]);
      setSettingsDirty(false);
      toast.success("AI settings saved securely.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save AI settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const testProvider = async (id: string) => {
    setTestingProvider(id);
    try {
      const result = await testAIStudioProvider(id);
      if ("error" in result) toast.error(result.error);
      else toast.success(`Connection successful: ${result.response}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Provider test failed.");
    } finally {
      setTestingProvider("");
    }
  };

  const saveReviewChanges = async (draft: Draft) => {
    setBusyDraftId(draft._id);
    try {
      const result = await updateAIStudioDraft(draft._id, draft.contentType, draft.data);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      replaceDraft(result.draft as Draft);
      toast.success("Review changes saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save changes.");
    } finally {
      setBusyDraftId("");
    }
  };

  const saveAsContentDraft = async (draft: Draft) => {
    setBusyDraftId(draft._id);
    try {
      const result = await saveAIStudioDraftAsContent(draft._id, draft.contentType, draft.data);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setSavedDrafts((current) => [{ ...draft, status: "saved", contentSlug: result.slug }, ...current]);
      setDrafts((current) => current.filter((item) => item._id !== draft._id));
      const nextTotal = Math.max(0, draftTotal - 1);
      const nextSkip = draftSkip > 0 && draftSkip >= nextTotal ? Math.max(0, draftSkip - 50) : draftSkip;
      setDraftTotal(nextTotal);
      await refreshQueue(nextSkip);
      toast.success(`Saved as a ${draft.contentType} draft. It is not published.`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save content draft.");
    } finally {
      setBusyDraftId("");
    }
  };

  const removeDraft = async (draft: Draft) => {
    if (!window.confirm("Remove this review-queue item?")) return;
    setBusyDraftId(draft._id);
    try {
      const result = await deleteAIStudioDraft(draft._id);
      if ("error" in result) toast.error(result.error);
      else {
        const nextTotal = Math.max(0, draftTotal - 1);
        const nextSkip = draftSkip > 0 && draftSkip >= nextTotal ? Math.max(0, draftSkip - 50) : draftSkip;
        await refreshQueue(nextSkip);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove this item.");
    } finally {
      setBusyDraftId("");
    }
  };

  const makeThumbnail = async (draft: Draft) => {
    setImageBusyId(draft._id);
    try {
      const prompt = `${valueText(draft.data.title)}. ${valueText(draft.data.description)}. ${draft.contentType === "article" ? valueText(draft.data.content).slice(0, 500) : ""}`;
      const result = await generateAIStudioThumbnail({ prompt, providerId: settings.imageProviderId });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setThumbnailPreviews((current) => ({ ...current, [draft._id]: result.image }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not generate thumbnail.");
    } finally {
      setImageBusyId("");
    }
  };

  const uploadThumbnail = async (draft: Draft) => {
    const preview = thumbnailPreviews[draft._id];
    if (!preview) return;
    setImageBusyId(draft._id);
    try {
      const thumbnail = await uploadGeneratedThumbnail(preview);
      const data = { ...draft.data, thumbnail };
      const result = await updateAIStudioDraft(draft._id, draft.contentType, data);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      replaceDraft(result.draft as Draft);
      setThumbnailPreviews((current) => {
        const next = { ...current };
        delete next[draft._id];
        return next;
      });
      toast.success("16:9 thumbnail uploaded and attached to the review item.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload thumbnail.");
    } finally {
      setImageBusyId("");
    }
  };

  const openers = [
    { id: "generate", label: "Generate", icon: WandSparkles },
    { id: "import", label: "JSON import", icon: FileJson2 },
    { id: "review", label: `Review queue (${draftTotal})`, icon: FileText },
    { id: "settings", label: "AI settings", icon: Settings2 },
  ] as const;

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl space-y-6 p-4 sm:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Content automation</p>
          <h1 className="mt-2 flex items-center gap-2 text-3xl font-semibold tracking-tight"><Sparkles size={26} className="text-primary" /> AI Studio</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Generate or import products and articles. Everything waits in review until you save it as a draft; nothing is auto-published.</p>
        </div>
        <div className="rounded-xl border bg-card px-4 py-3 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{draftTotal}</span> awaiting review
        </div>
      </header>

      <nav className="flex gap-2 overflow-x-auto border-b pb-3">
        {openers.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${activeTab === id ? "bg-primary text-primary-foreground" : "border bg-card text-muted-foreground hover:bg-muted"}`}
          >
            <Icon size={15} />{label}
          </button>
        ))}
      </nav>

      {notice ? <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-800 dark:text-amber-200">{notice}</p> : null}

      {activeTab === "generate" ? (
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5 rounded-2xl border bg-card p-5 sm:p-7">
            <div>
              <h2 className="text-lg font-semibold">Create a content draft</h2>
              <p className="mt-1 text-sm text-muted-foreground">Give the model source facts and requirements. Missing prices, links, or product files stay blank for you to fill in.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_180px_140px]">
              <label className="space-y-1.5 text-sm font-medium">Content type
                <select value={contentType} onChange={(event) => setContentType(event.target.value as "product" | "article")} className={inputClass}>
                  <option value="article">Article</option><option value="product">Product</option>
                </select>
              </label>
              <label className="space-y-1.5 text-sm font-medium">Draft count
                <select value={count} onChange={(event) => setCount(Number(event.target.value))} className={inputClass}>
                  {[1, 2, 3, 5, 10].map((number) => <option key={number} value={number}>{number}</option>)}
                </select>
              </label>
              <div className="space-y-1.5 text-sm font-medium">Text provider
                <div className="flex h-10 items-center rounded-lg border bg-muted/40 px-3 text-sm font-normal">
                  {settings.providers.find((provider) => provider.id === settings.activeProviderId)?.name || "Not configured"}
                </div>
              </div>
            </div>
              {settingsDirty ? <p className="text-xs text-amber-700 dark:text-amber-300">Save your provider changes before generating or testing connections.</p> : null}
            <label className="block space-y-1.5 text-sm font-medium">Brief / prompt
              <Textarea
                value={brief}
                onChange={(event) => setBrief(event.target.value)}
                maxLength={8000}
                rows={9}
                placeholder={contentType === "article"
                  ? "Topic, target reader, factual notes/sources, language, tone, headings, keywords, and anything that must not be claimed…"
                  : "What the product actually contains, who it is for, format, verified facts, keywords, and details you will fill in later…"}
                className={textAreaClass}
              />
              <span className="block text-right text-xs text-muted-foreground">{brief.length}/8000</span>
            </label>
            <Button onClick={() => void handleGenerate()} disabled={generating || settingsDirty || brief.trim().length < 3} className="gap-2">
              {generating ? <LoaderCircle size={16} className="animate-spin" /> : <WandSparkles size={16} />}
              {generating ? "Generating drafts..." : "Generate and add to review"}
            </Button>
          </div>
          <aside className="space-y-4 rounded-2xl border bg-muted/30 p-5">
            <h3 className="font-semibold">Human review stays in control</h3>
            <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
              <li>AI output is saved to this review queue, not published.</li>
              <li>Verify claims and fill missing file links, prices, categories, or images.</li>
              <li>Saving to the catalogue creates a normal <strong className="text-foreground">draft</strong>. Publish later from the regular editor.</li>
              <li>Online provider usage may have costs or rate limits set by that provider.</li>
            </ul>
            <Button variant="outline" onClick={() => setActiveTab("settings")} className="gap-2"><Settings2 size={15} /> Configure providers</Button>
          </aside>
        </section>
      ) : null}

      {activeTab === "import" ? (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4 rounded-2xl border bg-card p-5 sm:p-7">
            <div>
              <h2 className="text-lg font-semibold">Bulk JSON import</h2>
              <p className="mt-1 text-sm text-muted-foreground">Upload a JSON file or paste an array. Valid rows are saved in the same review queue; no record is published.</p>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm hover:bg-muted">
              <UploadCloud size={15} /> Choose .json file
              <input type="file" accept=".json,application/json" className="sr-only" onChange={(event) => void readJSONFile(event.target.files?.[0])} />
            </label>
            <Textarea value={jsonText} onChange={(event) => { setJsonText(event.target.value); setImportResult(null); }} rows={19} spellCheck={false} placeholder={sampleJSON} className={`${textAreaClass} font-mono text-xs`} />
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" onClick={validateJSON} disabled={!jsonText.trim()}>Validate JSON</Button>
              <Button onClick={() => void importJSON()} disabled={importing || !importResult?.rows.length} className="gap-2">
                {importing ? <LoaderCircle size={15} className="animate-spin" /> : <FileJson2 size={15} />}
                Add {importResult?.rows.length || 0} valid item(s) to review
              </Button>
            </div>
            {importResult ? (
              <div className="space-y-2 rounded-xl border p-4 text-sm">
                <p className={importResult.errors.length ? "font-medium text-amber-700 dark:text-amber-300" : "font-medium text-emerald-700 dark:text-emerald-300"}>
                  {importResult.rows.length} valid · {importResult.errors.length} issue(s)
                </p>
                {importResult.errors.map((error, index) => <p key={`${error.index}-${index}`} className="text-xs text-destructive">Item {error.index}: {error.message}</p>)}
              </div>
            ) : null}
          </div>
          <aside className="space-y-4 rounded-2xl border bg-muted/30 p-5">
            <div><h3 className="font-semibold">Supported shapes</h3><p className="mt-1 text-sm text-muted-foreground">Each object needs a title. Slugs are generated when omitted. Missing product files/prices can be completed during review.</p></div>
            <pre className="overflow-x-auto rounded-xl border bg-background p-3 text-[11px] leading-5">{sampleJSON}</pre>
            <p className="text-xs leading-5 text-muted-foreground">You can also use <code>{`{"products":[...],"articles":[...]}`}</code>. Maximum 100 items per file. Unknown fields are ignored; type, URL, tag, and length checks run before saving.</p>
          </aside>
        </section>
      ) : null}

      {activeTab === "review" ? (
        <section className="space-y-4">
          {savedDrafts.length ? (
            <div className="space-y-2 rounded-xl border bg-card p-4">
              <h2 className="text-sm font-semibold">Saved catalogue drafts</h2>
              {savedDrafts.map((draft) => {
                const editHref = draft.contentType === "product"
                  ? `/admin/add-product?slug=${encodeURIComponent(draft.contentSlug || "")}`
                  : `/admin/add-blog?slug=${encodeURIComponent(draft.contentSlug || "")}`;
                return (
                  <div key={draft._id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span>{valueText(draft.data.title) || "Untitled item"}</span>
                    <Button asChild size="sm" variant="outline"><Link href={editHref}>Continue editing <ArrowUpRight size={14} /></Link></Button>
                  </div>
                );
              })}
            </div>
          ) : null}
          {drafts.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center">
              <FileText size={28} className="mx-auto text-muted-foreground" />
              <h2 className="mt-3 font-semibold">Review queue is empty</h2>
              <p className="mt-1 text-sm text-muted-foreground">Generate content or import a JSON file to get started.</p>
            </div>
          ) : drafts.map((draft) => {
            const isProduct = draft.contentType === "product";
            const busy = busyDraftId === draft._id;
            const title = valueText(draft.data.title) || "Untitled item";
            const editHref = isProduct
              ? `/admin/add-product?slug=${encodeURIComponent(draft.contentSlug || "")}`
              : `/admin/add-blog?slug=${encodeURIComponent(draft.contentSlug || "")}`;
            return (
              <article key={draft._id} className="overflow-hidden rounded-2xl border bg-card">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3 sm:px-5">
                  <div className="flex items-center gap-2">
                    {isProduct ? <Package size={16} className="text-primary" /> : <FileText size={16} className="text-primary" />}
                    <span className="font-semibold">{title}</span>
                    <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">{draft.source}</span>
                    <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">{draft.status}</span>
                  </div>
                  {draft.status === "saved" && draft.contentSlug ? (
                    <Button asChild size="sm" variant="outline"><Link href={editHref}>Continue editing <ArrowUpRight size={14} /></Link></Button>
                  ) : null}
                </div>

                <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
                  <label className="space-y-1 text-xs font-medium">Title
                    <Input value={valueText(draft.data.title)} disabled={draft.status === "saved"} onChange={(event) => setDraftData(draft._id, "title", event.target.value)} maxLength={160} />
                  </label>
                  <label className="space-y-1 text-xs font-medium">Slug
                    <Input value={valueText(draft.data.slug)} disabled={draft.status === "saved"} onChange={(event) => setDraftData(draft._id, "slug", event.target.value)} />
                  </label>
                  <label className="space-y-1 text-xs font-medium sm:col-span-2">Description
                    <Textarea value={valueText(draft.data.description)} disabled={draft.status === "saved"} onChange={(event) => setDraftData(draft._id, "description", event.target.value)} rows={3} className={textAreaClass} />
                  </label>
                  <label className="space-y-1 text-xs font-medium">Tags (comma-separated)
                    <Input value={valueText(draft.data.tags)} disabled={draft.status === "saved"} onChange={(event) => setDraftData(draft._id, "tags", event.target.value)} />
                  </label>
                  {!isProduct ? (
                    <label className="space-y-1 text-xs font-medium">Categories (comma-separated)
                      <Input value={valueText(draft.data.category)} disabled={draft.status === "saved"} onChange={(event) => setDraftData(draft._id, "category", event.target.value)} />
                    </label>
                  ) : (
                    <>
                      <label className="space-y-1 text-xs font-medium">Price (INR)
                        <Input type="number" min="0" step="0.01" value={valueText(draft.data.price)} disabled={draft.status === "saved"} onChange={(event) => setDraftData(draft._id, "price", event.target.value)} />
                      </label>
                      <label className="space-y-1 text-xs font-medium sm:col-span-2">Product file URL (fill in if missing)
                        <Input type="url" value={valueText(draft.data.fileLink)} disabled={draft.status === "saved"} onChange={(event) => setDraftData(draft._id, "fileLink", event.target.value)} placeholder="https://..." />
                      </label>
                    </>
                  )}
                  {!isProduct ? (
                    <div className="space-y-1 text-xs font-medium sm:col-span-2">
                      <span>Article content (Markdown)</span>
                      <MyEditor
                        value={valueText(draft.data.content)}
                        onChange={(value) => setDraftData(draft._id, "content", value || "")}
                        height={480}
                        placeholder="Write or edit the article… Use Preview to check formatting."
                      />
                    </div>
                  ) : null}
                  <div className="space-y-2 sm:col-span-2">
                    <label className="block space-y-1 text-xs font-medium">Cover image
                      <span className="block text-xs font-normal text-muted-foreground">Upload and crop a 16:9 image, or paste an image URL. Save review edits to keep the change.</span>
                    </label>
                    <ImageUpload
                      img_src={valueText(draft.data.thumbnail)}
                      onChange={(src) => setDraftData(draft._id, "thumbnail", src)}
                    />
                    <Input
                      type="url"
                      value={valueText(draft.data.thumbnail)}
                      onChange={(event) => setDraftData(draft._id, "thumbnail", event.target.value)}
                      placeholder="Or paste an image URL"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button type="button" size="sm" variant="outline" disabled={!settings.imageProviderId || settingsDirty || imageBusyId === draft._id || draft.status === "saved"} onClick={() => void makeThumbnail(draft)} className="gap-2">
                        {imageBusyId === draft._id ? <LoaderCircle size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                        Generate 16:9 thumbnail
                      </Button>
                      {thumbnailPreviews[draft._id] ? (
                        <Button type="button" size="sm" disabled={imageBusyId === draft._id} onClick={() => void uploadThumbnail(draft)} className="gap-2">
                          {imageBusyId === draft._id ? <LoaderCircle size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                          Upload & attach (1280×720)
                        </Button>
                      ) : null}
                      {!settings.imageProviderId ? <span className="text-xs text-muted-foreground">Set an image model in AI settings first.</span> : null}
                    </div>
                    {thumbnailPreviews[draft._id] ? <Image src={thumbnailPreviews[draft._id]} alt={`Generated thumbnail preview for ${title}`} width={1280} height={720} unoptimized className="aspect-video w-full max-w-xl rounded-xl border object-cover" /> : null}
                  </div>
                  {draft.status === "review" ? (
                    <div className="flex flex-wrap items-center gap-2 pt-2 sm:col-span-2">
                      <Button type="button" variant="outline" disabled={busy} onClick={() => void saveReviewChanges(draft)} className="gap-2">
                        {busy ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />} Save review edits
                      </Button>
                      <Button type="button" disabled={busy} onClick={() => void saveAsContentDraft(draft)} className="gap-2">
                        {busy ? <LoaderCircle size={14} className="animate-spin" /> : <Check size={14} />} Save as {isProduct ? "product" : "article"} draft
                      </Button>
                      <Button type="button" variant="ghost" disabled={busy} onClick={() => void removeDraft(draft)} className="gap-2 text-destructive hover:text-destructive">
                        <Trash2 size={14} /> Remove
                      </Button>
                    </div>
                  ) : null}
                  {draft.status === "saved" ? <p className="text-xs text-emerald-700 dark:text-emerald-300 sm:col-span-2">Saved as a catalogue draft, not published. Continue in the editor to fill any remaining details and publish manually.</p> : null}
                </div>
              </article>
            );
          })}
          {draftTotal > 50 ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3 text-sm">
              <span className="text-muted-foreground">Showing {draftSkip + 1}–{Math.min(draftSkip + 50, draftTotal)} of {draftTotal}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={draftSkip === 0} onClick={() => void refreshQueue(Math.max(0, draftSkip - 50))}>Previous</Button>
                <Button variant="outline" size="sm" disabled={draftSkip + 50 >= draftTotal} onClick={() => void refreshQueue(draftSkip + 50)}>Next</Button>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {activeTab === "settings" ? (
        <section className="space-y-6">
          <div className="rounded-2xl border bg-card p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="text-lg font-semibold">Provider connections</h2><p className="mt-1 text-sm text-muted-foreground">Configure local Ollama, official APIs, or any OpenAI-compatible endpoint.</p></div>
              <Button variant="outline" onClick={addProvider} className="gap-2"><Plus size={15} /> Add provider</Button>
            </div>
            <div className="mt-5 grid gap-4">
              {settings.providers.map((provider) => (
                <div key={provider.id} className="space-y-4 rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid flex-1 gap-3 sm:grid-cols-2">
                      <label className="space-y-1.5 text-xs font-medium">Profile name
                        <Input value={provider.name} onChange={(event) => updateProvider(provider.id, { name: event.target.value })} maxLength={80} />
                      </label>
                      <label className="space-y-1.5 text-xs font-medium">Protocol
                        <select
                          value={provider.protocol}
                          onChange={(event) => {
                            const protocol = event.target.value as ProviderProtocol;
                            updateProvider(provider.id, { protocol, baseUrl: protocol === "openai-compatible" ? provider.baseUrl : endpointPlaceholder(protocol) });
                          }}
                          className={inputClass}
                        >
                          {protocols.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      </label>
                    </div>
                    <Button variant="ghost" size="icon" aria-label={`Remove ${provider.name}`} onClick={() => removeProvider(provider.id)}><Trash2 size={15} /></Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1.5 text-xs font-medium">Base URL
                      <Input value={provider.baseUrl} onChange={(event) => updateProvider(provider.id, { baseUrl: event.target.value })} placeholder={endpointPlaceholder(provider.protocol)} />
                    </label>
                    <label className="space-y-1.5 text-xs font-medium">Text model ID
                      <Input value={provider.model} onChange={(event) => updateProvider(provider.id, { model: event.target.value })} placeholder={provider.protocol === "ollama" ? "qwen3.5:4b or your installed tag" : "Provider model ID"} />
                    </label>
                    <label className="space-y-1.5 text-xs font-medium">API key
                      <Input
                        type="password"
                        autoComplete="new-password"
                        value={providerKeys[provider.id] || ""}
                        onChange={(event) => { setSettingsDirty(true); setProviderKeys((current) => ({ ...current, [provider.id]: event.target.value })); }}
                        placeholder={provider.hasApiKey ? "Saved encrypted; leave blank to keep it" : provider.protocol === "ollama" ? "Not needed for local Ollama" : "Paste provider API key"}
                      />
                      {provider.hasApiKey ? (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-300"><Check size={12} /> Key stored encrypted</span>
                      ) : null}
                    </label>
                    <label className="space-y-1.5 text-xs font-medium">Image model ID (optional)
                      <Input value={provider.imageModel} onChange={(event) => updateProvider(provider.id, { imageModel: event.target.value })} placeholder={provider.protocol === "gemini" ? "gemini-3.1-flash-lite-image" : "Image-capable model ID"} disabled={["ollama", "anthropic"].includes(provider.protocol)} />
                      <span className="block text-[11px] font-normal text-muted-foreground">
                        OpenAI-compatible image endpoint or Gemini image model. <a href="https://aistudio.google.com/docs/models/gemini-3.1-flash-lite-image#pricing" target="_blank" rel="noreferrer" className="text-primary underline">Check Google image pricing</a>.
                      </span>
                    </label>
                  </div>
                  {provider.hasApiKey ? (
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <input type="checkbox" checked={clearKeys.includes(provider.id)} onChange={(event) => { setSettingsDirty(true); setClearKeys((current) => event.target.checked ? [...current, provider.id] : current.filter((id) => id !== provider.id)); }} />
                      Forget stored API key
                    </label>
                  ) : null}
                  <Button variant="outline" size="sm" disabled={settingsDirty || testingProvider === provider.id || !provider.model.trim()} onClick={() => void testProvider(provider.id)}>
                    {testingProvider === provider.id ? <LoaderCircle size={14} className="mr-2 animate-spin" /> : null}{settingsDirty ? "Save settings to test" : "Test connection"}
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-4 border-t pt-5 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm font-medium">Default text provider
                <select value={settings.activeProviderId} onChange={(event) => { setSettingsDirty(true); setSettings((current) => ({ ...current, activeProviderId: event.target.value })); }} className={inputClass}>
                  {settings.providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}
                </select>
              </label>
              <label className="space-y-1.5 text-sm font-medium">Thumbnail image provider
                <select value={settings.imageProviderId} onChange={(event) => { setSettingsDirty(true); setSettings((current) => ({ ...current, imageProviderId: event.target.value })); }} className={inputClass}>
                  <option value="">Disabled</option>
                  {settings.providers.filter((provider) => provider.imageModel && !["ollama", "anthropic"].includes(provider.protocol)).map((provider) => <option key={provider.id} value={provider.id}>{provider.name} · {provider.imageModel}</option>)}
                </select>
              </label>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 sm:p-7">
            <h2 className="text-lg font-semibold">Studic context for prompts</h2>
            <p className="mt-1 text-sm text-muted-foreground">This is included with every generation. Keep it factual; it is editable and saved with provider settings.</p>
            <Textarea value={settings.siteContext} onChange={(event) => { setSettingsDirty(true); setSettings((current) => ({ ...current, siteContext: event.target.value })); }} maxLength={12000} rows={7} className={`${textAreaClass} mt-4`} />
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs leading-5 text-muted-foreground">
            API keys are encrypted at rest using <code>AI_SETTINGS_ENCRYPTION_KEY</code> (or the site&apos;s <code>NEXTAUTH_SECRET</code> fallback) and are never sent back to the browser. Ollama works only when the server running Studic can reach its configured address; a deployed site cannot reach your personal computer&apos;s <code>localhost</code>. Free tiers, image generation, and quotas depend on each provider.
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void saveSettings()} disabled={savingSettings} className="gap-2">
              {savingSettings ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />} Save AI settings
            </Button>
            <Button variant="outline" onClick={() => setActiveTab("generate")}>Back to generation</Button>
          </div>
        </section>
      ) : null}
    </main>
  );
}
