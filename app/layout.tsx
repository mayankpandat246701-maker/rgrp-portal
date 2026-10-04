import type { Metadata, Viewport } from "next";
import { Geist_Mono, Hind, Noto_Serif_Devanagari } from "next/font/google";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import "./globals.css";

const hind = Hind({
  variable: "--font-hind",
  subsets: ["latin", "devanagari"],
  weight: ["400", "500", "600", "700"],
});

const notoSerifDevanagari = Noto_Serif_Devanagari({
  variable: "--font-noto-serif-devanagari",
  subsets: ["latin", "devanagari"],
  weight: ["600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Rashtriya Gau Raksha Parishad | RGRP Portal",
    template: "%s | RGRP Portal",
  },
  description:
    "राष्ट्रीय गौ रक्षा परिषद (RGRP India) — गौ सेवा, संरक्षण और जन जागरण के लिए समर्पित संगठन। कार्यकर्ता आवेदन, सत्यापन और संघ के संदेश।",
};

export const viewport: Viewport = {
  themeColor: "#fdf1e2",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-IN"
      className={`${hind.variable} ${notoSerifDevanagari.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="flex flex-1 flex-col">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
