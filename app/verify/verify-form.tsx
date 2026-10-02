"use client";

import { useState, type FormEvent } from "react";
import { ClientFormNotice } from "@/components/ui/client-form-notice";
import { FormField, inputClassName } from "@/components/ui/form-field";
import { Icon } from "@/components/ui/icon";

type VerificationTab = "registration" | "qr";

export function VerifyForm() {
  const [activeTab, setActiveTab] = useState<VerificationTab>("registration");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    const value = registrationNumber.trim();

    if (!value) {
      setError("कृपया पंजीकरण संख्या दर्ज करें।");
      return;
    }
    if (!/^RGRP-\d{4}-\d{3,}$/i.test(value)) {
      setError("कृपया सही प्रारूप में संख्या दर्ज करें, जैसे RGRP-2026-001।");
      return;
    }

    setError("");
    setNotice("सत्यापन सुविधा डेटाबेस कनेक्शन के बाद सक्रिय होगी।");
  }

  function selectTab(tab: VerificationTab) {
    setActiveTab(tab);
    setError("");
    setNotice("");
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/80 bg-white/85 shadow-[0_24px_80px_-40px_rgba(6,78,59,0.25)] backdrop-blur-xl">
      <div
        aria-label="सत्यापन विधि"
        className="grid grid-cols-2 border-b border-stone-100 p-2"
        role="tablist"
      >
        <button
          aria-controls="registration-panel"
          aria-selected={activeTab === "registration"}
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition aria-selected:bg-emerald-900 aria-selected:text-white aria-[selected=false]:text-stone-600 aria-[selected=false]:hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
          id="registration-tab"
          onClick={() => selectTab("registration")}
          role="tab"
          type="button"
        >
          <Icon name="id-card" size={18} />
          <span>पंजीकरण संख्या से सत्यापन</span>
        </button>
        <button
          aria-controls="qr-panel"
          aria-selected={activeTab === "qr"}
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition aria-selected:bg-emerald-900 aria-selected:text-white aria-[selected=false]:text-stone-600 aria-[selected=false]:hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
          id="qr-tab"
          onClick={() => selectTab("qr")}
          role="tab"
          type="button"
        >
          <Icon name="scan" size={18} />
          <span>QR कोड स्कैन करें</span>
        </button>
      </div>

      {activeTab === "registration" ? (
        <section
          aria-labelledby="registration-tab"
          className="p-5 sm:p-8"
          id="registration-panel"
          role="tabpanel"
        >
          <div className="mb-7">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-900">
              <Icon name="shield" size={24} />
            </span>
            <h2 className="mt-5 text-xl font-bold text-stone-950">
              पंजीकरण संख्या से पहचान जाँचें
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              सदस्य के आधिकारिक पंजीकरण नंबर से सत्यापन शुरू करें।
            </p>
          </div>
          <form className="space-y-5" noValidate onSubmit={handleSubmit}>
            <FormField
              error={error}
              hint="उदाहरण: RGRP-2026-001"
              id="registrationNumber"
              label="पंजीकरण संख्या"
              required
            >
              <input
                aria-describedby={`registrationNumber-hint${error ? " registrationNumber-error" : ""}`}
                aria-invalid={Boolean(error)}
                autoCapitalize="characters"
                autoComplete="off"
                className={`${inputClassName} font-mono tracking-wide`}
                id="registrationNumber"
                name="registrationNumber"
                onChange={(event) => {
                  setRegistrationNumber(event.currentTarget.value);
                  setError("");
                  setNotice("");
                }}
                placeholder="RGRP-2026-001"
                required
                value={registrationNumber}
              />
            </FormField>
            <ClientFormNotice message={notice} tone="warning" />
            <button
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
              type="submit"
            >
              <Icon name="shield" size={18} />
              पहचान सत्यापित करें
            </button>
          </form>
        </section>
      ) : (
        <section
          aria-labelledby="qr-tab"
          className="p-5 text-center sm:p-8"
          id="qr-panel"
          role="tabpanel"
        >
          <div className="mx-auto flex size-40 items-center justify-center rounded-3xl border border-dashed border-emerald-900/25 bg-emerald-50/60 text-emerald-900">
            <Icon name="scan" size={68} />
          </div>
          <h2 className="mt-6 text-xl font-bold text-stone-950">
            QR कोड से पहचान सत्यापन
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-600">
            कैमरा स्कैनिंग सुविधा अगले सुरक्षित चरण में उपलब्ध होगी।
          </p>
          <button
            className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-900/20 bg-white px-5 py-3 text-sm font-bold text-emerald-950 shadow-sm transition hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
            onClick={() =>
              setNotice("कैमरा स्कैनिंग सुविधा अगले सुरक्षित चरण में उपलब्ध होगी।")
            }
            type="button"
          >
            <Icon name="scan" size={18} />
            कैमरा से QR स्कैन करें
          </button>
          <div className="mt-5 text-left">
            <ClientFormNotice message={notice} tone="warning" />
          </div>
        </section>
      )}

      <p className="border-t border-stone-100 bg-orange-50/60 px-5 py-4 text-sm leading-6 text-orange-950 sm:px-8">
        <span className="font-bold">सुरक्षा सूचना:</span> केवल आधिकारिक RGRP QR
        कोड या पंजीकरण संख्या से ही पहचान सत्यापित करें। स्क्रीनशॉट को मान्य
        प्रमाण न मानें।
      </p>
    </div>
  );
}
