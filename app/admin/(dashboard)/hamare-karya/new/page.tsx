import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ActivityForm } from "@/app/admin/(dashboard)/hamare-karya/activity-form";
import { canManageEditorialContent, canPublishContent } from "@/lib/auth/admin-permissions";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "नया जमीनी कार्य" };

export default async function NewGroundActivityPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (!canManageEditorialContent(admin.role)) redirect("/admin/dashboard");
  return <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-8 sm:py-14"><h1 className="text-3xl font-bold">नया जमीनी कार्य जोड़ें</h1><ActivityForm canPublish={canPublishContent(admin.role)} initialActivity={null} /></section>;
}
