"use client";

export function ApplicationPrintButton() {
  return (
    <button
      className="no-print inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
      onClick={() => window.print()}
      type="button"
    >
      आवेदन प्रपत्र प्रिंट करें
    </button>
  );
}
