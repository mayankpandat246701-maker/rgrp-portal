import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/public/placeholder-page";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <PlaceholderPage
      title="About RGRP"
      description="Information about Rashtriya Gau Raksha Parishad will be available here."
    />
  );
}
