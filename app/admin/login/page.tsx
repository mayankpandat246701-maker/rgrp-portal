import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/app/admin/login/admin-login-form";
import { PageSection } from "@/components/ui/page-section";
import { getCurrentAdmin } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "प्रशासनिक प्रवेश",
};

export default async function AdminLoginPage() {
  const admin = await getCurrentAdmin();
  if (admin) redirect("/admin/dashboard");

  return (
    <PageSection
      description="संगठन के सुरक्षित प्रशासनिक पोर्टल में प्रवेश करें।"
      eyebrow="RGRP प्रशासन"
      title="प्रशासनिक प्रवेश"
    >
      <AdminLoginForm />
    </PageSection>
  );
}
