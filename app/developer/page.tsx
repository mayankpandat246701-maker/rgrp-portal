import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Developer Portfolio | Mayank Upadhyay",
  description: "Developer portfolio of Mayank Upadhyay",
};

export default function DeveloperPage() {
  redirect("/developer-portfolio.html");
}
