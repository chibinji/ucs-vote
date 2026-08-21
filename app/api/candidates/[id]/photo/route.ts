import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const candidate = await prisma.candidate.findUnique({
    where: { id },
    select: { photoData: true, photoMime: true },
  });
  if (!candidate?.photoData) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(Uint8Array.from(candidate.photoData), {
    headers: {
      "Content-Type": candidate.photoMime || "image/jpeg",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
