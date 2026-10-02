import type { Metadata } from "next";
import { ApplicationStatusForm } from "@/app/application-status/application-status-form";
import { PageSection } from "@/components/ui/page-section";

export const metadata: Metadata = {
  title: "आवेदन स्थिति",
};

export default function ApplicationStatusPage() {
  return (
    <PageSection
      description="अपनी आवेदन संदर्भ संख्या और आवेदन में दिया गया मोबाइल नंबर भरकर स्थिति देखें।"
      eyebrow="आवेदन सहायता"
      title="आवेदन स्थिति देखें"
    >
      <ApplicationStatusForm />
    </PageSection>
  );
}
