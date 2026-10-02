import type { Metadata } from "next";
import { JoinForm } from "@/app/join/join-form";
import { PageSection } from "@/components/ui/page-section";

export const metadata: Metadata = {
  title: "कार्यकर्ता पंजीकरण",
};

export default function JoinPage() {
  return (
    <PageSection
      description="Rashtriya Gau Raksha Parishad से जुड़ने के लिए अपना आवेदन भरें। सभी आवश्यक विवरण सावधानी से दर्ज करें।"
      eyebrow="सदस्यता आवेदन"
      title="राष्ट्रीय गौ रक्षा परिषद – कार्यकर्ता पंजीकरण"
    >
      <JoinForm />
    </PageSection>
  );
}
