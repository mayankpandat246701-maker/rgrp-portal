import type { Prisma } from "@prisma/client";

export function publishedNewsWhere(now = new Date()): Prisma.NewsPostWhereInput {
  return {
    isPublished: true,
    archivedAt: null,
    AND: [
      { OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: now } }] },
      { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
    ],
  };
}

export function publishedGroundActivityWhere(
  now = new Date(),
): Prisma.GroundActivityWhereInput {
  return {
    isPublished: true,
    archivedAt: null,
    AND: [
      { OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: now } }] },
      { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
    ],
  };
}

export function publicActivityLocation(activity: {
  exactLocationPublic: boolean;
  publicLocationLabel: string | null;
  district: string;
  state: string;
}): string {
  if (activity.exactLocationPublic) {
    return [activity.publicLocationLabel, activity.district, activity.state]
      .filter(Boolean)
      .join(", ");
  }
  return [activity.publicLocationLabel, activity.district, activity.state]
    .filter(Boolean)
    .join(", ");
}
