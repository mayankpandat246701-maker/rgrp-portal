import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/public/placeholder-page";

export const metadata: Metadata = {
  title: "Registration Details",
};

export default async function RegistrationPage({
  params,
}: {
  params: Promise<{ regNo: string }>;
}) {
  const { regNo } = await params;

  return (
    <PlaceholderPage
      title="Registration Details"
      description={`Verification details for registration ${regNo} will be available here.`}
    />
  );
}
