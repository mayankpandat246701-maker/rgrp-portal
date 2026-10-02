import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/public/placeholder-page";

export const metadata: Metadata = {
  title: "Member ID Card",
};

export default async function IdCardPage({
  params,
}: {
  params: Promise<{ regNo: string }>;
}) {
  const { regNo } = await params;

  return (
    <PlaceholderPage
      title="Member ID Card"
      description={`The member ID card for registration ${regNo} will be available here.`}
    />
  );
}
