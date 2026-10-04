import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ActivityForm } from "@/app/admin/hamare-karya/activity-form";
import { canManageEditorialContent, canPublishContent, hasEditorialScope } from "@/lib/auth/admin-permissions";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "जमीनी कार्य संपादित करें", robots: { index: false, follow: false } };
type PageProps = { params: Promise<{ id: string }> };

export default async function EditGroundActivityPage({ params }: PageProps) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (!canManageEditorialContent(admin.role)) redirect("/admin/dashboard");
  const { id } = await params;
  const activity = await prisma.groundActivity.findUnique({
    where: { id },
    select: {
      id: true, slug: true, title: true, shortSummary: true, fullDescription: true,
      activityType: true, activityDate: true, state: true, district: true,
      tehsilOrBlock: true, cityOrVillage: true, publicLocationLabel: true,
      exactLocationPublic: true, mapLink: true, isPublished: true,
      isFeaturedOnHomepage: true, homepageDisplayOrder: true, scheduledPublishAt: true,
      expiresAt: true, archivedAt: true, coverImageAltHindi: true,
      images: { orderBy: { displayOrder: "asc" }, select: { id: true, altTextHindi: true, displayOrder: true, isPublic: true } },
    },
  });
  if (!activity) notFound();
  if (!hasEditorialScope(admin, activity.state, activity.district)) redirect("/admin/hamare-karya");
  return <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-8 sm:py-14"><h1 className="text-3xl font-bold">जमीनी कार्य संपादित करें</h1><ActivityForm canPublish={canPublishContent(admin.role)} initialActivity={{ ...activity, activityDate: activity.activityDate.toISOString(), scheduledPublishAt: activity.scheduledPublishAt?.toISOString() ?? null, expiresAt: activity.expiresAt?.toISOString() ?? null, archivedAt: activity.archivedAt?.toISOString() ?? null }} /></section>;
}
