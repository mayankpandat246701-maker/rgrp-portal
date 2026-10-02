import type { Metadata } from "next";
import { KaryakartaLoginForm } from "@/app/karyakarta/login/karyakarta-login-form";
import { PageSection } from "@/components/ui/page-section";

export const metadata: Metadata = {
  title: "कार्यकर्ता पोर्टल प्रवेश",
};

export default function KaryakartaLoginPage() {
  return (
    <PageSection
      description="कार्यकर्ताओं के लिए सदस्य पोर्टल का सुरक्षित प्रवेश।"
      eyebrow="RGRP सदस्य पोर्टल"
      title="कार्यकर्ता पोर्टल प्रवेश"
    >
      <KaryakartaLoginForm />
    </PageSection>
  );
}
