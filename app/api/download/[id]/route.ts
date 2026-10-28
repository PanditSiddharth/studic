import { NextResponse } from "next/server";
import { getDownloadUrl } from "@/server-functions/library";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Gated download endpoint. The file URL is only revealed to the buyer (or an
 * administrator), so published products can show a download button without
 * exposing the Cloudinary link in the page source.
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const forwardedFor = _request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientKey = forwardedFor || _request.headers.get("x-real-ip") || "unknown";
  const limiter = rateLimit(`download:${clientKey}`, 30, 60 * 1000);
  if (!limiter.allowed) {
    return NextResponse.json({ error: "Too many download requests. Try again shortly." }, {
      status: 429,
      headers: { "Retry-After": String(limiter.retryAfter) },
    });
  }

  try {
    const result = await getDownloadUrl(id);
    if ("error" in result) {
      const message = result.error || "Download unavailable";
      const status = message.includes("Sign in") ? 401 : message.includes("Purchase") ? 403 : 404;
      return NextResponse.json({ error: message }, { status });
    }
    return NextResponse.redirect(result.url, 302);
  } catch (error) {
    console.error("Download failed", error);
    return NextResponse.json({ error: "Download unavailable" }, { status: 500 });
  }
}
