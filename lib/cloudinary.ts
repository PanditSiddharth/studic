import crypto from "node:crypto";

type CloudinaryAsset = { url: string; resourceType: "image" | "raw" };

export function cloudinaryReference(url?: string) {
  const asset = url ? assetFromUrl(url) : null;
  if (!asset) return undefined;
  const [resourceType, publicId] = asset.url.split(":");
  return { publicId, resourceType };
}

function assetFromUrl(url: string): CloudinaryAsset | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "res.cloudinary.com") return null;
    const match = parsed.pathname.match(/^\/[^/]+\/(image|raw)\/upload\/(?:v\d+\/)?(.+)$/);
    if (!match) return null;
    const publicId = match[1] === "image" ? match[2].replace(/\.[a-z0-9]+$/i, "") : match[2];
    return { url: `${match[1]}:${publicId}`, resourceType: match[1] as "image" | "raw" };
  } catch {
    return null;
  }
}

function signature(params: Record<string, string>, secret: string) {
  const body = Object.entries(params)
    .filter(([, value]) => value)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return crypto.createHash("sha1").update(body + secret).digest("hex");
}

export async function deleteCloudinaryAssets(urls: Array<string | undefined>) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    console.warn("Cloudinary cleanup skipped: credentials are not configured");
    return;
  }

  const assets = Array.from(new Set(urls.filter(Boolean).map((url) => assetFromUrl(String(url))).filter(Boolean) as CloudinaryAsset[]));
  for (const asset of assets) {
    const [resourceType, publicId] = asset.url.split(":");
    const timestamp = String(Math.floor(Date.now() / 1000));
    const params = { public_id: publicId, timestamp };
    const form = new URLSearchParams({
      ...params,
      api_key: apiKey,
      signature: signature(params, apiSecret),
    });
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    if (!response.ok) console.error("Cloudinary asset cleanup failed", { publicId, status: response.status });
  }
}
