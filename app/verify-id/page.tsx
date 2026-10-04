import type { Metadata } from "next";
import { VerifyIdForm } from "@/app/verify-id/verify-id-form";

export const metadata: Metadata = {
  title: "कार्यकर्ता पहचान पत्र सत्यापित करें",
  description: "राष्ट्रीय गौ रक्षा परिषद के कार्यकर्ता पंजीकरण की सत्यापन जानकारी।",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function VerifyIdPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const reg = typeof params.reg === "string" ? params.reg.slice(0, 60) : "";
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-8 sm:py-14">
      <header className="mb-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">राष्ट्रीय गौ रक्षा परिषद</p>
        <h1 className="mt-3 text-3xl font-bold text-stone-950 sm:text-4xl">कार्यकर्ता पहचान पत्र सत्यापित करें</h1>
        <p className="mt-3 text-stone-600">पहचान पत्र पर अंकित पंजीकरण संख्या दर्ज करें।</p>
      </header>
      <VerifyIdForm initialRegistrationNumber={reg} />
    </main>
  );
}
