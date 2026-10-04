import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { LogoSettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "वेबसाइट सेटिंग्स", robots: { index: false, follow: false } };

export default async function SiteSettingsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.role !== "SUPER_ADMIN") redirect("/admin/dashboard");
  return <section className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-8 sm:py-14"><h1 className="text-3xl font-bold text-stone-950">वेबसाइट सेटिंग्स</h1><p className="mt-2 text-stone-600">आधिकारिक लोगो बदलें। लोगो उपलब्ध न होने पर वेबसाइट का मूल चिह्न दिखेगा।</p><LogoSettingsForm /></section>;
}
