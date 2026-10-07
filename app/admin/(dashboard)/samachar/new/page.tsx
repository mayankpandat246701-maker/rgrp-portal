import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NewsForm } from "@/app/admin/(dashboard)/samachar/news-form";
import { canManageEditorialContent, canPublishContent } from "@/lib/auth/admin-permissions";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "नया समाचार" };

export default async function NewNewsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (!canManageEditorialContent(admin.role)) redirect("/admin/dashboard");
  return <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-8 sm:py-14"><h1 className="text-3xl font-bold text-stone-950">नया समाचार जोड़ें</h1><NewsForm canPublish={canPublishContent(admin.role)} initialPost={null} /></section>;
}
