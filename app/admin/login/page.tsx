import type { Metadata } from "next";
import { AdminLoginForm } from "@/app/admin/login/admin-login-form";
import { PageSection } from "@/components/ui/page-section";

export const metadata: Metadata = {
  title: "प्रशासनिक प्रवेश",
};

export default function AdminLoginPage() {
  return (
    <PageSection
      description="यह सुरक्षित प्रवेश इंटरफ़ेस अभी केवल दृश्य नमूना है।"
      eyebrow="RGRP प्रशासन"
      title="प्रशासनिक प्रवेश"
    >
      <AdminLoginForm />
    </PageSection>
  );
}
