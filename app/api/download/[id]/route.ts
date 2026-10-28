import { NextResponse } from "next/server";
import { getDownloadUrl } from "@/server-functions/library";

/**
 * Gated download endpoint. The file URL is only revealed to the buyer (or an
 * administrator), so published products can show a download button without
 * exposing the Cloudinary link in the page source.
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

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
