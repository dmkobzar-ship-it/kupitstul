/**
 * Next.js Instrumentation — runs once when the server starts.
 * Starts the MAX poller in local dev (when no webhook URL is configured).
 * In production, MAX replies arrive via POST /api/chat/webhook.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && !process.env.MAX_WEBHOOK_URL) {
    const { startMaxPoller } = await import("@/lib/chat-store");
    startMaxPoller();
  }
}
