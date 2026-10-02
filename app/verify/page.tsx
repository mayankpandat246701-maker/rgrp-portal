import type { Metadata } from "next";
import { VerifyForm } from "@/app/verify/verify-form";
import { PageSection } from "@/components/ui/page-section";

export const metadata: Metadata = {
  title: "कार्यकर्ता पहचान सत्यापन",
};

export default function VerifyPage() {
  return (
    <PageSection
      description="पंजीकरण संख्या से पहचान की जाँच करें या QR सत्यापन सुविधा के बारे में जानें।"
      eyebrow="आधिकारिक सत्यापन"
      title="कार्यकर्ता पहचान सत्यापन"
    >
      <VerifyForm />
    </PageSection>
  );
}
