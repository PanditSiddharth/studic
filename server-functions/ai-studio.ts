"use server";

import connectDB from "@/connectDB";
import { AIStudioDraftModel, AIStudioSettingsModel, type AIContentType, type IAIStudioProvider } from "@/modals/ai-studio.model";
import { BlogModel } from "@/modals/blog.model";
import { ProductModel } from "@/modals/product.model";
import { getSessionUser } from "@/server-functions/user";
import { decryptAIProviderKey, encryptAIProviderKey } from "@/lib/ai-studio-crypto";
import { normalizeAIDraft, productAIDraftSchema, articleAIDraftSchema } from "@/lib/ai-studio-schema";
import { parseProviderJSON, requestProviderImage, requestProviderText } from "@/lib/ai-studio-provider";
import { z } from "zod";
import mongoose from "mongoose";

const DEFAULT_SITE_CONTEXT = [
  "Studic is an online learning platform for students and curious builders.",
  "The site offers practical online courses, study guides, previous-year exam resources, articles, and downloadable digital products.",
  "Primary audience: learners in India. Write clear, helpful, original content in approachable English; use Hindi/Hinglish only when the brief requests it.",
  "Do not invent prices, file links, credentials, official affiliations, exam guarantees, or claims not present in the brief.",
  "Use INR when a price is explicitly provided. New content is always a draft and requires human review before publishing.",
].join("\n");

const defaultProviders: IAIStudioProvider[] = [
  {
    id: "local-qwen",
    name: "Local Ollama · Qwen",
    protocol: "ollama",
    baseUrl: "http://localhost:11434",
    model: "qwen3.5:4b",
  },
  {
    id: "local-llama",
    name: "Local Ollama · Llama",
    protocol: "ollama",
    baseUrl: "http://localhost:11434",
    model: "llama",
  },
];

const settingsInputSchema = z.object({
  providers: z.array(z.object({
    id: z.string().trim().min(1).max(40).regex(/^[a-z0-9][a-z0-9_-]*$/),
    name: z.string().trim().min(1).max(80),
    protocol: z.enum(["ollama", "openai-compatible", "openai", "gemini", "anthropic"]),
    baseUrl: z.string().trim().max(500),
    model: z.string().trim().max(160),
    imageModel: z.string().trim().max(160).optional(),
    apiKey: z.string().max(4096).optional(),
    clearApiKey: z.boolean().optional(),
  })).min(1).max(8),
  activeProviderId: z.string().trim().min(1).max(40),
  imageProviderId: z.string().trim().max(40),
  siteContext: z.string().trim().min(1).max(12000),
});

const generationInputSchema = z.object({
  contentType: z.enum(["product", "article"]),
  brief: z.string().trim().min(3).max(8000),
  count: z.number().int().min(1).max(10),
});

const importInputSchema = z.array(z.object({
  contentType: z.enum(["product", "article"]),
  data: z.record(z.string(), z.unknown()),
})).min(1).max(100);

async function requireAdmin() {
  const user = await getSessionUser();
  return user?.role === "admin" ? user : null;
}

function validateProviderInputURL(value: string) {
  if (!value) return;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Provider base URL must be a valid HTTP or HTTPS URL.");
  }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error("Provider base URL must use HTTP or HTTPS and must not contain credentials, query strings, or fragments.");
  }
}

async function getSettingsWithSecrets() {
  await connectDB();
  const existing = await AIStudioSettingsModel.findOne({ key: "default" }).select("+providers.encryptedApiKey");
  if (existing) return existing;
  return AIStudioSettingsModel.create({
    key: "default",
    providers: defaultProviders,
    activeProviderId: "local-qwen",
    imageProviderId: "",
    siteContext: DEFAULT_SITE_CONTEXT,
  });
}

function publicProvider(provider: IAIStudioProvider) {
  return {
    id: provider.id,
    name: provider.name,
    protocol: provider.protocol,
    baseUrl: provider.baseUrl,
    model: provider.model,
    imageModel: provider.imageModel || "",
    hasApiKey: Boolean(provider.encryptedApiKey),
  };
}

function publicSettings(settings: {
  providers: IAIStudioProvider[];
  activeProviderId: string;
  imageProviderId: string;
  siteContext: string;
}) {
  return JSON.parse(JSON.stringify({
    providers: settings.providers.map(publicProvider),
    activeProviderId: settings.activeProviderId,
    imageProviderId: settings.imageProviderId,
    siteContext: settings.siteContext || DEFAULT_SITE_CONTEXT,
  }));
}

export async function getAIStudioData() {
  const user = await requireAdmin();
  if (!user) return { error: "Administrator access required" as const };
  try {
    const [settings, drafts, totalDrafts] = await Promise.all([
      getSettingsWithSecrets(),
      AIStudioDraftModel.find({ status: "review" }).sort({ createdOn: -1 }).limit(50).lean(),
      AIStudioDraftModel.countDocuments({ status: "review" }),
    ]);
    return {
      settings: publicSettings(settings),
      drafts: JSON.parse(JSON.stringify(drafts)),
      totalDrafts,
    };
  } catch (error) {
    console.error("Could not load AI Studio", error);
    return { error: error instanceof Error ? error.message : "Could not load AI Studio" };
  }
}

export async function getAIStudioDraftPage(skip = 0) {
  const user = await requireAdmin();
  if (!user) return { error: "Administrator access required" as const };
  const offset = Math.max(0, Math.min(100_000, Math.floor(Number(skip) || 0)));
  try {
    const [drafts, total] = await Promise.all([
      AIStudioDraftModel.find({ status: "review" }).sort({ createdOn: -1 }).skip(offset).limit(50).lean(),
      AIStudioDraftModel.countDocuments({ status: "review" }),
    ]);
    return { drafts: JSON.parse(JSON.stringify(drafts)), total };
  } catch (error) {
    console.error("Could not load AI Studio review queue", error);
    return { error: error instanceof Error ? error.message : "Could not load review queue" };
  }
}

export async function saveAIStudioSettings(input: unknown) {
  const user = await requireAdmin();
  if (!user) return { error: "Administrator access required" as const };
  const parsed = settingsInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues.map((issue) => issue.message).join("; ") };
  const values = parsed.data;
  const providerIds = new Set(values.providers.map((provider) => provider.id));
  if (providerIds.size !== values.providers.length) return { error: "Provider IDs must be unique." };
  if (!providerIds.has(values.activeProviderId)) return { error: "Select an active text provider." };
  if (values.imageProviderId && !providerIds.has(values.imageProviderId)) return { error: "Select a valid image provider." };
  const imageProvider = values.providers.find((provider) => provider.id === values.imageProviderId);
  if (values.imageProviderId && (!imageProvider?.imageModel || ["ollama", "anthropic"].includes(imageProvider.protocol))) {
    return { error: "The selected provider needs an image model and an image-capable protocol." };
  }

  try {
    values.providers.forEach((provider) => validateProviderInputURL(provider.baseUrl));
    const existing = await getSettingsWithSecrets();
    const oldKeys = new Map(existing.providers.map((provider) => [provider.id, provider.encryptedApiKey]));
    const providers = values.providers.map((provider) => {
      const apiKey = provider.apiKey?.trim();
      const encryptedApiKey = provider.clearApiKey
        ? undefined
        : apiKey
          ? encryptAIProviderKey(apiKey)
          : oldKeys.get(provider.id);
      return {
        id: provider.id,
        name: provider.name,
        protocol: provider.protocol,
        baseUrl: provider.baseUrl,
        model: provider.model,
        imageModel: provider.imageModel || "",
        ...(encryptedApiKey ? { encryptedApiKey } : {}),
      };
    });

    existing.providers = providers;
    existing.activeProviderId = values.activeProviderId;
    existing.imageProviderId = values.imageProviderId;
    existing.siteContext = values.siteContext;
    existing.updatedBy = user._id;
    await existing.save();
    return { success: true, settings: publicSettings(existing) };
  } catch (error) {
    console.error("Could not save AI Studio settings", error);
    return { error: error instanceof Error ? error.message : "Could not save AI settings" };
  }
}

function getDecryptedProvider(
  settings: { providers: IAIStudioProvider[] },
  id: string
) {
  const provider = settings.providers.find((candidate) => candidate.id === id);
  if (!provider) throw new Error("The selected provider is not configured.");
  const apiKey = provider.encryptedApiKey ? decryptAIProviderKey(provider.encryptedApiKey) : "";
  if (!["ollama", "openai-compatible"].includes(provider.protocol) && !apiKey) {
    throw new Error("Add an API key for this provider in AI settings.");
  }
  return { provider, apiKey };
}

function promptForDrafts(contentType: AIContentType, brief: string, count: number, siteContext: string) {
  const shape = contentType === "product"
    ? `Each item must contain: title, slug, description, tags (array), price (number), currency ("INR"), fileLink (string), fileName (string), thumbnail (empty string), externalLink (string), externalLinkLabel (string), downloadLimit (number or null). Do not invent prices or URLs: use 0 and empty strings unless explicitly provided.`
    : `Each item must contain: title, slug, description, content (original Markdown), tags (array), category (array), products (array of IDs or empty array), course (ID or empty string), estimatedMinutes (number), thumbnail (empty string), seoTitle, seoDescription, externalLink (string), externalLinkLabel (string).`;

  return [
    "Create editable draft content for the Studic website using only the supplied brief and site context.",
    "Return exactly one valid JSON object with an `items` array. Do not wrap it in Markdown fences or add commentary.",
    `Create ${count} distinct ${contentType} item${count === 1 ? "" : "s"}.`,
    shape,
    "Do not publish anything, claim that anything has been published, or invent missing facts, links, prices, exam outcomes, official affiliations, or credentials.",
    "Write original content. Keep title <= 160 characters and description <= 10000 characters. Tags/categories must be concise strings.",
    `SITE CONTEXT:\n${siteContext}`,
    `CONTENT BRIEF:\n${brief}`,
  ].join("\n\n");
}

export async function generateAIDrafts(input: unknown) {
  const user = await requireAdmin();
  if (!user) return { error: "Administrator access required" as const };
  const parsedInput = generationInputSchema.safeParse(input);
  if (!parsedInput.success) return { error: parsedInput.error.issues.map((issue) => issue.message).join("; ") };

  try {
    const settings = await getSettingsWithSecrets();
    const { provider, apiKey } = getDecryptedProvider(settings, settings.activeProviderId);
    const prompt = promptForDrafts(parsedInput.data.contentType, parsedInput.data.brief, parsedInput.data.count, settings.siteContext || DEFAULT_SITE_CONTEXT);
    const text = await requestProviderText(provider, apiKey, [
      { role: "system", content: "You are a careful editorial assistant. Follow the requested JSON shape exactly. The user must review every result before publishing." },
      { role: "user", content: prompt },
    ], true);
    const output = parseProviderJSON(text);
    const outputRecord = output !== null && typeof output === "object" && !Array.isArray(output)
      ? output as Record<string, unknown>
      : null;
    const rawItems = Array.isArray(output) ? output : Array.isArray(outputRecord?.items) ? outputRecord.items : [output];
    if (!rawItems.length) return { error: "The model returned no items. Try another prompt or model." };

    const drafts: Array<{ contentType: AIContentType; source: "ai"; status: "review"; data: Record<string, unknown>; createdBy: string }> = [];
    const rejected: string[] = [];
    rawItems.slice(0, parsedInput.data.count).forEach((rawItem, index) => {
      const normalized = normalizeAIDraft(parsedInput.data.contentType, rawItem);
      if (!normalized.success) rejected.push(`Item ${index + 1}: ${normalized.error}`);
      else drafts.push({
        contentType: normalized.contentType,
        source: "ai",
        status: "review",
        data: normalized.data as unknown as Record<string, unknown>,
        createdBy: String(user._id),
      });
    });
    if (!drafts.length) return { error: `No valid drafts returned. ${rejected.join(" ")}` };

    const created = await AIStudioDraftModel.insertMany(drafts);
    return {
      success: true,
      drafts: JSON.parse(JSON.stringify(created)),
      rejected,
    };
  } catch (error) {
    console.error("AI draft generation failed", error);
    return { error: error instanceof Error ? error.message : "Could not generate drafts" };
  }
}

export async function importAIStudioDrafts(input: unknown) {
  const user = await requireAdmin();
  if (!user) return { error: "Administrator access required" as const };
  const parsedInput = importInputSchema.safeParse(input);
  if (!parsedInput.success) return { error: parsedInput.error.issues.map((issue) => issue.message).join("; ") };
  if (JSON.stringify(parsedInput.data).length > 700_000) {
    return { error: "This batch is too large. Split it into smaller JSON imports." };
  }
  const drafts = [];
  for (const [index, item] of parsedInput.data.entries()) {
    const normalized = normalizeAIDraft(item.contentType, item.data);
    if (!normalized.success) return { error: `Item ${index + 1}: ${normalized.error}` };
    drafts.push({
      contentType: normalized.contentType,
      source: "json" as const,
      status: "review" as const,
      data: normalized.data,
      createdBy: user._id,
    });
  }
  try {
    const created = await AIStudioDraftModel.insertMany(drafts);
    return { success: true, drafts: JSON.parse(JSON.stringify(created)) };
  } catch (error) {
    console.error("AI JSON import failed", error);
    return { error: error instanceof Error ? error.message : "Could not import JSON drafts" };
  }
}

export async function updateAIStudioDraft(id: string, contentType: AIContentType, input: unknown) {
  const user = await requireAdmin();
  if (!user) return { error: "Administrator access required" as const };
  if (!mongoose.isValidObjectId(id)) return { error: "Invalid draft ID." };
  const normalized = normalizeAIDraft(contentType, input);
  if (!normalized.success) return { error: normalized.error };
  try {
    const updated = await AIStudioDraftModel.findOneAndUpdate(
      { _id: id, status: "review" },
      { $set: { data: normalized.data } },
      { new: true }
    ).lean();
    if (!updated) return { error: "Draft not found or already saved." };
    return { success: true, draft: JSON.parse(JSON.stringify(updated)) };
  } catch (error) {
    console.error("Could not update AI Studio draft", error);
    return { error: error instanceof Error ? error.message : "Could not update draft" };
  }
}

export async function deleteAIStudioDraft(id: string) {
  const user = await requireAdmin();
  if (!user) return { error: "Administrator access required" as const };
  if (!mongoose.isValidObjectId(id)) return { error: "Invalid draft ID." };
  const result = await AIStudioDraftModel.deleteOne({ _id: id, status: "review" });
  if (!result.deletedCount) return { error: "Draft not found or already saved." };
  return { success: true };
}

export async function saveAIStudioDraftAsContent(id: string, contentType: AIContentType, input: unknown) {
  const user = await requireAdmin();
  if (!user) return { error: "Administrator access required" as const };
  if (!mongoose.isValidObjectId(id)) return { error: "Invalid draft ID." };
  const normalized = normalizeAIDraft(contentType, input);
  if (!normalized.success) return { error: normalized.error };

  try {
    const existingDraft = await AIStudioDraftModel.findOne({ _id: id, contentType, status: "review" }).select("_id");
    if (!existingDraft) return { error: "Draft not found or already saved." };
    const { data } = normalized;
    if (contentType === "product") {
      const productData = productAIDraftSchema.parse(data);
      const duplicate = await ProductModel.exists({ slug: productData.slug });
      if (duplicate) return { error: `Product slug "${productData.slug}" is already in use. Change the slug and try again.` };
      const product = await ProductModel.create({
        ...productData,
        status: "draft",
        publishedAt: undefined,
      });
      await AIStudioDraftModel.updateOne(
        { _id: id, status: "review" },
        { $set: { status: "saved", contentId: product._id, contentSlug: product.slug } }
      );
      return { success: true, contentType, contentId: String(product._id), slug: product.slug, status: "draft" };
    }

    const articleData = articleAIDraftSchema.parse(data);
    const duplicate = await BlogModel.exists({ slug: articleData.slug });
    if (duplicate) return { error: `Article slug "${articleData.slug}" is already in use. Change the slug and try again.` };
    if (articleData.course && !mongoose.isValidObjectId(articleData.course)) return { error: "Course must be a valid course ID." };
    if (articleData.products.some((productId) => !mongoose.isValidObjectId(productId))) {
      return { error: "Every related product must use a valid product ID." };
    }
    const article = await BlogModel.create({
      ...articleData,
      author: user._id,
      status: "draft",
      accessType: "free",
      price: 0,
      publishedAt: undefined,
    });
    await AIStudioDraftModel.updateOne(
      { _id: id, status: "review" },
      { $set: { status: "saved", contentId: article._id, contentSlug: article.slug } }
    );
    return { success: true, contentType, contentId: String(article._id), slug: article.slug, status: "draft" };
  } catch (error) {
    console.error("Could not save reviewed content draft", error);
    if (error instanceof mongoose.mongo.MongoServerError && error.code === 11000) {
      return { error: "This slug is already in use. Change it before saving." };
    }
    return { error: error instanceof Error ? error.message : "Could not save content draft" };
  }
}

export async function testAIStudioProvider(providerId: string) {
  const user = await requireAdmin();
  if (!user) return { error: "Administrator access required" as const };
  try {
    const settings = await getSettingsWithSecrets();
    const { provider, apiKey } = getDecryptedProvider(settings, providerId);
    const response = await requestProviderText(provider, apiKey, [
      { role: "user", content: "Reply with exactly: Studic AI connection OK" },
    ]);
    return { success: true, response: response.slice(0, 200) };
  } catch (error) {
    console.error("AI provider connection test failed", error);
    return { error: error instanceof Error ? error.message : "Provider test failed" };
  }
}

export async function generateAIStudioThumbnail(input: { prompt: string; providerId?: string }) {
  const user = await requireAdmin();
  if (!user) return { error: "Administrator access required" as const };
  const prompt = typeof input?.prompt === "string" ? input.prompt.trim().slice(0, 2000) : "";
  if (prompt.length < 5) return { error: "Add a more descriptive thumbnail prompt." };
  try {
    const settings = await getSettingsWithSecrets();
    const { provider, apiKey } = getDecryptedProvider(settings, input.providerId || settings.imageProviderId);
    const image = await requestProviderImage(
      provider,
      apiKey,
      `Create a polished 16:9 landscape YouTube thumbnail image for Studic. ${prompt}. Use strong clear visual hierarchy, educational subject matter, high contrast, no logos, no watermark, and no small text.`
    );
    return { success: true, image };
  } catch (error) {
    console.error("AI thumbnail generation failed", error);
    return { error: error instanceof Error ? error.message : "Could not generate a thumbnail" };
  }
}
