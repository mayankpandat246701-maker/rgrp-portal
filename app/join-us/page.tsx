import type { Metadata } from "next";
import { JoinForm } from "@/app/join/join-form";
import { PageSection } from "@/components/ui/page-section";

export const metadata: Metadata = {
  title: "राष्ट्रीय गौ रक्षा परिषद से जुड़ें",
  alternates: { canonical: "/join-us" },
};

export default function JoinUsPage() {
  return (
    <PageSection
      description="राष्ट्रीय गौ रक्षा परिषद से जुड़ने के लिए अपना आवेदन भरें। सभी आवश्यक विवरण सावधानी से दर्ज करें।"
      eyebrow="सदस्यता आवेदन"
      title="राष्ट्रीय गौ रक्षा परिषद से जुड़ें"
    >
      <JoinForm />
    </PageSection>
  );
}
