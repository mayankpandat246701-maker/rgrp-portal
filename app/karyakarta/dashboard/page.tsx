import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/public/placeholder-page";

export const metadata: Metadata = {
  title: "Karyakarta Dashboard",
};

export default function KaryakartaDashboardPage() {
  return (
    <PlaceholderPage
      title="Karyakarta Dashboard"
      description="The karyakarta dashboard will be available in a later phase."
    />
  );
}
