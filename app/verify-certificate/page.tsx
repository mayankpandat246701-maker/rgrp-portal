import type { Metadata } from "next";
import { CertificateVerificationForm } from "@/app/verify-certificate/verification-form";
import { hi } from "@/lib/i18n/hi";

export const metadata: Metadata = {
  title: hi.navigation.verifyCertificate,
  description: "राष्ट्रीय गौ रक्षा परिषद के कार्यकर्ता नियुक्ति प्रमाणपत्र की सार्वजनिक सत्यापन जानकारी।",
  alternates: { canonical: "/verify-certificate" },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function VerifyCertificatePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const number = typeof params.number === "string" ? params.number.slice(0, 60) : "";
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-8 sm:py-14">
      <header className="mb-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">राष्ट्रीय गौ रक्षा परिषद</p>
        <h1 className="mt-3 text-3xl font-bold text-stone-950 sm:text-4xl">कार्यकर्ता नियुक्ति प्रमाणपत्र सत्यापित करें</h1>
        <p className="mt-3 text-stone-600">प्रमाणपत्र पर अंकित संख्या दर्ज करें।</p>
      </header>
      <CertificateVerificationForm initialCertificateNumber={number} />
    </main>
  );
}
