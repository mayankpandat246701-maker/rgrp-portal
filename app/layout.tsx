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
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex w-full max-w-5xl items-center px-6 py-5 sm:px-10">
            <Link
              className="text-sm font-semibold tracking-wide text-emerald-900"
              href="/"
            >
              RGRP Portal
            </Link>
          </div>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
        <footer className="border-t border-stone-200 bg-white">
          <div className="mx-auto w-full max-w-5xl px-6 py-5 text-sm text-stone-500 sm:px-10">
            Rashtriya Gau Raksha Parishad
          </div>
        </footer>
      </body>
    </html>
  );
}
