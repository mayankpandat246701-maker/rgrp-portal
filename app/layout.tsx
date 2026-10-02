import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
  description: "Rashtriya Gau Raksha Parishad Portal foundation.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="site-header border-b border-stone-200 bg-white">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4 sm:px-10">
            <Link
              className="text-sm font-semibold tracking-wide text-emerald-900"
              href="/"
            >
              RGRP Portal
            </Link>
            <nav aria-label="मुख्य नेविगेशन" className="flex flex-wrap gap-2">
              <Link
                className="rounded-lg px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-emerald-800"
                href="/application-status"
              >
                आवेदन स्थिति देखें
              </Link>
              <Link
                className="rounded-lg px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-emerald-800"
                href="/karyakarta/upload-documents"
              >
                <span className="block">कार्यकर्ता दस्तावेज़ अपलोड</span>
                <span className="block text-xs font-normal text-stone-500">
                  Upload Documents
                </span>
              </Link>
              <Link
                className="rounded-lg px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-emerald-800"
                href="/verify-qr"
              >
                QR सत्यापन
              </Link>
              <Link
                className="rounded-lg bg-emerald-900 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
                href="/admin/login"
              >
                Admin Login / एडमिन लॉगिन
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
        <footer className="site-footer border-t border-stone-200 bg-white">
          <div className="mx-auto w-full max-w-5xl px-6 py-5 text-sm text-stone-500 sm:px-10">
            Rashtriya Gau Raksha Parishad
          </div>
        </footer>
      </body>
    </html>
  );
}
