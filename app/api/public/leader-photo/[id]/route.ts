import { getCurrentAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { fileResponse, readStoredFile } from "@/lib/uploads/store-file";
import { mimeTypeForStorageKey } from "@/lib/uploads/validate-file";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  const leader = await prisma.sanghLeader.findUnique({
    where: { id },
    select: { photoPath: true, isVisible: true },
  });

  // Hidden leaders' photos are only available to signed-in admins (for preview in the panel).
  if (!leader?.photoPath || (!leader.isVisible && !(await getCurrentAdmin()))) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const contents = await readStoredFile(leader.photoPath);
    return fileResponse(contents, mimeTypeForStorageKey(leader.photoPath), {
      cache: leader.isVisible ? "public" : "private",
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
