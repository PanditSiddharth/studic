import "server-only";
import type { IAIStudioProvider } from "@/modals/ai-studio.model";

type Message = { role: "system" | "user"; content: string };

const defaultBaseUrls = {
  ollama: "http://localhost:11434",
  "openai-compatible": "",
  openai: "https://api.openai.com/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta",
  anthropic: "https://api.anthropic.com/v1",
} as const;

function providerUrl(provider: IAIStudioProvider) {
  const raw = provider.baseUrl.trim() || defaultBaseUrls[provider.protocol];
  if (!raw) throw new Error("Add a base URL for this provider.");
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Provider base URL must be a valid HTTP or HTTPS URL.");
  }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error("Provider base URL must use HTTP or HTTPS and must not contain credentials, query strings, or fragments.");
  }
  return url.toString().replace(/\/+$/, "");
}

function endpoint(baseUrl: string, suffix: string) {
  if (baseUrl.endsWith(suffix)) return baseUrl;
  return `${baseUrl}${suffix}`;
}

async function requestJson(url: string, init: RequestInit) {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(90_000) });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Provider returned ${response.status}: ${body.slice(0, 900) || response.statusText}`);
  }
  try {
    return JSON.parse(body) as Record<string, unknown>;
  } catch {
    throw new Error("Provider returned an invalid JSON response.");
  }
}

function openAIHeaders(apiKey: string) {
  return {
    "Content-Type": "application/json",
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
  };
}

export async function requestProviderText(
  provider: IAIStudioProvider,
  apiKey: string,
  messages: Message[],
  forceJson = false
) {
  if (!provider.model.trim()) throw new Error("Add a model name in AI settings.");
  const baseUrl = providerUrl(provider);
  let result: Record<string, unknown>;

  if (provider.protocol === "ollama") {
    const root = baseUrl.replace(/\/v1$/, "");
    result = await requestJson(endpoint(root, "/api/chat"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: provider.model,
        messages,
        stream: false,
        ...(forceJson ? { format: "json" } : {}),
        options: { temperature: 0.3 },
      }),
    });
    const message = result.message as Record<string, unknown> | undefined;
    if (typeof message?.content !== "string") throw new Error("Ollama did not return text.");
    return message.content;
  }

  if (provider.protocol === "gemini") {
    const url = endpoint(baseUrl, "/interactions");
    result = await requestJson(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
        "Api-Revision": "2026-05-20",
      },
      body: JSON.stringify({
        model: provider.model,
        input: messages.map((message) => `${message.role.toUpperCase()}:\n${message.content}`).join("\n\n"),
        store: false,
      }),
    });
    const output = result.output as Array<{ type?: string; text?: string }> | undefined;
    const text = typeof result.output_text === "string"
      ? result.output_text.trim()
      : output?.filter((part) => part.type === "text").map((part) => part.text || "").join("").trim();
    if (!text) throw new Error("Gemini did not return text.");
    return text;
  }

  if (provider.protocol === "anthropic") {
    const system = messages.filter((message) => message.role === "system").map((message) => message.content).join("\n\n");
    const user = messages.filter((message) => message.role === "user").map((message) => message.content).join("\n\n");
    result = await requestJson(endpoint(baseUrl, "/messages"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model: provider.model, max_tokens: 8192, system, messages: [{ role: "user", content: user }] }),
    });
    const content = result.content as Array<{ type?: string; text?: string }> | undefined;
    const text = content?.filter((part) => part.type === "text").map((part) => part.text || "").join("").trim();
    if (!text) throw new Error("Anthropic did not return text.");
    return text;
  }

  const url = endpoint(baseUrl, "/chat/completions");
  result = await requestJson(url, {
    method: "POST",
    headers: openAIHeaders(apiKey),
    body: JSON.stringify({
      model: provider.model,
      messages,
      temperature: 0.3,
      ...(forceJson ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  const choices = result.choices as Array<{ message?: { content?: string | Array<{ text?: string }> } }> | undefined;
  const content = choices?.[0]?.message?.content;
  const text = typeof content === "string"
    ? content.trim()
    : Array.isArray(content)
      ? content.map((part) => part.text || "").join("").trim()
      : "";
  if (!text) throw new Error("The provider returned no text.");
  return text;
}

export function parseProviderJSON(text: string) {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("The model response did not contain a JSON object.");
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as unknown;
  } catch {
    throw new Error("The model returned malformed JSON. Try again or use a stronger model.");
  }
}

export async function requestProviderImage(
  provider: IAIStudioProvider,
  apiKey: string,
  prompt: string
) {
  const imageModel = provider.imageModel?.trim();
  if (!imageModel) throw new Error("Choose an image-capable model in AI settings first.");
  if (provider.protocol === "anthropic" || provider.protocol === "ollama") {
    throw new Error("Thumbnail generation is not supported by this provider protocol. Configure OpenAI, Gemini, or an OpenAI-compatible image API.");
  }

  const baseUrl = providerUrl(provider);
  let imageData = "";
  let mimeType = "image/png";

  if (provider.protocol === "gemini") {
    const url = endpoint(baseUrl, "/interactions");
    const result = await requestJson(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
        "Api-Revision": "2026-05-20",
      },
      body: JSON.stringify({
        model: imageModel,
        input: [{ type: "text", text: prompt }],
        store: false,
      }),
    });
    const outputImage = result.output_image as { data?: string; mime_type?: string; mimeType?: string } | undefined;
    const output = result.output as Array<{ type?: string; data?: string; mime_type?: string; mimeType?: string }> | undefined;
    const imageBlock = output?.find((part) => part.type === "image" && part.data);
    imageData = outputImage?.data || imageBlock?.data || "";
    mimeType = outputImage?.mime_type || outputImage?.mimeType || imageBlock?.mime_type || imageBlock?.mimeType || mimeType;
  } else {
    const url = endpoint(baseUrl, "/images/generations");
    const result = await requestJson(url, {
      method: "POST",
      headers: openAIHeaders(apiKey),
      body: JSON.stringify({ model: imageModel, prompt, size: "1536x1024", n: 1 }),
    });
    const images = result.data as Array<{ b64_json?: string; mime_type?: string }> | undefined;
    imageData = images?.[0]?.b64_json || "";
    mimeType = images?.[0]?.mime_type || mimeType;
  }

  if (!imageData || imageData.length > 18_000_000) {
    throw new Error("Image provider returned no image or an image that is too large.");
  }
  return `data:${mimeType};base64,${imageData}`;
}
