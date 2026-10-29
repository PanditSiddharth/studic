import { cleanupExpiredChatMedia } from "@/server-functions/chat";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await cleanupExpiredChatMedia();
    return Response.json({ success: true, ...result });
  } catch (error) {
    console.error("Chat media cleanup failed", error);
    return Response.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
