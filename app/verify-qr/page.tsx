import type { Metadata } from "next";
import { QrScanner } from "./qr-scanner";

export const metadata: Metadata = {
  title: "QR सत्यापन",
};

export default function VerifyQrPage() {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-8">
      <p className="text-xs font-bold tracking-[0.15em] text-emerald-800 uppercase">
        राष्ट्रीय गौ रक्षा परिषद
      </p>
      <h1 className="mt-3 text-3xl font-bold text-stone-950">
        कार्यकर्ता QR सत्यापन
      </h1>
      <p className="mt-3 text-sm leading-6 text-stone-600">
        परिषद द्वारा जारी ID कार्ड का QR कैमरे से स्कैन करें या QR इमेज चुनें।
        केवल स्वीकृत और सत्यापित दस्तावेज़ वाला कार्ड मान्य होगा।
      </p>
      <div className="mt-7 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <QrScanner />
      </div>
    </section>
  );
}
