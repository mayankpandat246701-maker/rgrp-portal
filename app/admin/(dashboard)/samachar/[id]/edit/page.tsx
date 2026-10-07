import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { NewsForm } from "@/app/admin/(dashboard)/samachar/news-form";
import { canManageEditorialContent, canPublishContent, hasEditorialScope } from "@/lib/auth/admin-permissions";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "समाचार संपादित करें", robots: { index: false, follow: false } };

type PageProps = { params: Promise<{ id: string }> };

export default async function EditNewsPage({ params }: PageProps) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (!canManageEditorialContent(admin.role)) redirect("/admin/dashboard");
  const { id } = await params;
  const post = await prisma.newsPost.findUnique({
    where: { id },
    select: {
      id: true, slug: true, title: true, shortSummary: true, fullContent: true,
      category: true, tags: true, state: true, district: true, isPublished: true,
      isFeatured: true, homepageDisplayOrder: true, scheduledPublishAt: true,
      expiresAt: true, archivedAt: true, coverImageAltHindi: true,
    },
  });
  if (!post) notFound();
  if (!hasEditorialScope(admin, post.state, post.district)) redirect("/admin/samachar");
  return <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-8 sm:py-14"><h1 className="text-3xl font-bold text-stone-950">समाचार संपादित करें</h1><NewsForm canPublish={canPublishContent(admin.role)} initialPost={{ ...post, scheduledPublishAt: post.scheduledPublishAt?.toISOString() ?? null, expiresAt: post.expiresAt?.toISOString() ?? null, archivedAt: post.archivedAt?.toISOString() ?? null }} /></section>;
}
