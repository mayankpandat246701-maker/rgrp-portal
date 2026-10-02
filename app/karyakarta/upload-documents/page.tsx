import type { Metadata } from "next";
import { DocumentUploadForm } from "@/app/karyakarta/upload-documents/document-upload-form";
import { PageSection } from "@/components/ui/page-section";

export const metadata: Metadata = {
  title: "कार्यकर्ता दस्तावेज़ अपलोड",
};

export default function UploadDocumentsPage() {
  return (
    <PageSection
      description="यह केवल आपके अपने आवेदन के लिए है। आवेदन संदर्भ और पंजीकृत मोबाइल नंबर से सत्यापन आवश्यक है।"
      eyebrow="कार्यकर्ता / आवेदक"
      title="कार्यकर्ता दस्तावेज़ अपलोड"
    >
      <DocumentUploadForm />
    </PageSection>
  );
}
