import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/public/placeholder-page";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

export default function AdminDashboardPage() {
  return (
    <PlaceholderPage
      title="Admin Dashboard"
      description="The administrator dashboard will be available in a later phase."
    />
  );
}
