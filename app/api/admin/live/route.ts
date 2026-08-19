import { getLiveSnapshot } from "@/lib/results";
import { jsonError } from "@/lib/http";
import { requireStaff } from "@/lib/staff";

export const dynamic = "force-dynamic";

export async function GET() {
  const { staff, error } = await requireStaff();
  if (!staff) return jsonError(error, 401);

  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    async start(controller) {
      const send = async () => {
        const snapshot = await getLiveSnapshot();
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(snapshot)}\n\n`));
      };
      await send();
      timer = setInterval(() => {
        send().catch(() => {
          if (timer) clearInterval(timer);
        });
      }, 2000);
    },
    cancel() {
      if (timer) clearInterval(timer);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
