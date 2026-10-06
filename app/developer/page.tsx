import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer Portfolio | Mayank Upadhyay",
  description: "Developer portfolio of Mayank Upadhyay",
};

export default function DeveloperPage() {
  return (
    <iframe
      className="h-screen w-full border-0"
      src="/developer-portfolio.html"
      title="Mayank Upadhyay Developer Portfolio"
    />
  );
}
