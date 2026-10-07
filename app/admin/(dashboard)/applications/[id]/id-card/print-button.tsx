"use client";

export function IdCardPrintButton() {
  return (
    <button
      className="no-print rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white"
      onClick={() => window.print()}
      type="button"
    >
      ID कार्ड प्रिंट करें
    </button>
  );
}
