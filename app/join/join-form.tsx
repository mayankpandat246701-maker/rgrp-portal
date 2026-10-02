"use client";

import { useState, type FormEvent } from "react";
import { ClientFormNotice } from "@/components/ui/client-form-notice";
import { FormField, inputClassName } from "@/components/ui/form-field";
import { Icon } from "@/components/ui/icon";

type ApplicationResponse = {
  success: boolean;
  data: {
    applicationReference: string;
  };
};

function isApplicationResponse(value: unknown): value is ApplicationResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    value.success === true &&
    "data" in value &&
    typeof value.data === "object" &&
    value.data !== null &&
    "applicationReference" in value.data &&
    typeof value.data.applicationReference === "string"
  );
}

export function JoinForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [applicationReference, setApplicationReference] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError("");
    setApplicationReference("");
    setIsSubmitting(true);

    const formData = new FormData(form);
    formData.delete("consent");
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/karyakarta/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result: unknown = await response.json();

      if (!response.ok || !isApplicationResponse(result)) {
        throw new Error("Application submission failed.");
      }

      setApplicationReference(result.data.applicationReference);
      form.reset();
    } catch {
      setError("आपका आवेदन जमा नहीं हो सका। कृपया जानकारी जाँचकर फिर प्रयास करें।");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/80 bg-white/85 shadow-[0_24px_80px_-40px_rgba(6,78,59,0.25)] backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 px-5 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-900 text-white">
            <Icon name="user" />
          </span>
          <div>
            <p className="font-semibold text-stone-900">आवेदन विवरण</p>
            <p className="mt-0.5 text-xs text-stone-500">
              * चिह्नित सभी जानकारी आवश्यक है
            </p>
          </div>
        </div>
        <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-900">
          कार्यकर्ता पंजीकरण
        </span>
      </div>

      <form className="space-y-8 p-5 sm:p-8" onSubmit={handleSubmit}>
        <section aria-labelledby="personal-details-heading">
          <div className="mb-5">
            <h2
              className="text-lg font-bold text-stone-900"
              id="personal-details-heading"
            >
              व्यक्तिगत जानकारी
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              अपनी पहचान और संपर्क जानकारी भरें।
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <FormField id="fullName" label="पूरा नाम / Full Name" required>
              <input
                autoComplete="name"
                className={inputClassName}
                id="fullName"
                maxLength={150}
                name="fullName"
                placeholder="अपना पूरा नाम लिखें"
                required
              />
            </FormField>
            <FormField id="fatherName" label="पिता का नाम" required>
              <input
                autoComplete="off"
                className={inputClassName}
                id="fatherName"
                maxLength={150}
                name="fatherName"
                required
              />
            </FormField>
            <FormField id="motherName" label="माता का नाम" required>
              <input
                autoComplete="off"
                className={inputClassName}
                id="motherName"
                maxLength={150}
                name="motherName"
                required
              />
            </FormField>
            <FormField id="dateOfBirth" label="जन्म तिथि" required>
              <input
                className={inputClassName}
                id="dateOfBirth"
                name="dateOfBirth"
                required
                type="date"
              />
            </FormField>
            <FormField id="gender" label="लिंग" required>
              <select
                className={inputClassName}
                defaultValue=""
                id="gender"
                name="gender"
                required
              >
                <option disabled value="">
                  चुनें
                </option>
                <option value="पुरुष">पुरुष</option>
                <option value="महिला">महिला</option>
                <option value="अन्य">अन्य</option>
              </select>
            </FormField>
            <FormField id="category" label="श्रेणी" required>
              <input
                className={inputClassName}
                id="category"
                maxLength={80}
                name="category"
                placeholder="अपनी श्रेणी दर्ज करें"
                required
              />
            </FormField>
            <FormField
              hint="10 अंकों का मोबाइल नंबर दर्ज करें।"
              id="mobile"
              label="मोबाइल नंबर"
              required
            >
              <input
                autoComplete="tel-national"
                className={inputClassName}
                id="mobile"
                inputMode="tel"
                maxLength={16}
                name="mobile"
                placeholder="उदाहरण: 9876543210"
                required
                type="tel"
              />
            </FormField>
            <FormField id="alternateMobile" label="वैकल्पिक मोबाइल नंबर">
              <input
                autoComplete="tel-national"
                className={inputClassName}
                id="alternateMobile"
                inputMode="tel"
                maxLength={16}
                name="alternateMobile"
                type="tel"
              />
            </FormField>
            <FormField id="email" label="ईमेल">
              <input
                autoComplete="email"
                className={inputClassName}
                id="email"
                maxLength={254}
                name="email"
                placeholder="name@example.com"
                type="email"
              />
            </FormField>
            <div className="md:col-span-2">
              <FormField id="address" label="पूरा पता" required>
                <textarea
                  autoComplete="street-address"
                  className={`${inputClassName} min-h-24 resize-y`}
                  id="address"
                  maxLength={1000}
                  name="address"
                  placeholder="मकान/गली, क्षेत्र और निकटतम पहचान लिखें"
                  required
                  rows={3}
                />
              </FormField>
            </div>
          </div>
        </section>

        <section aria-labelledby="location-heading">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-stone-900" id="location-heading">
              क्षेत्रीय जानकारी
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              अपना कार्यक्षेत्र और स्थान दर्ज करें।
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FormField id="state" label="राज्य" required>
              <input
                autoComplete="address-level1"
                className={inputClassName}
                id="state"
                maxLength={120}
                name="state"
                required
              />
            </FormField>
            <FormField id="district" label="जिला" required>
              <input
                autoComplete="address-level2"
                className={inputClassName}
                id="district"
                maxLength={120}
                name="district"
                required
              />
            </FormField>
            <FormField id="constituency" label="विधानसभा क्षेत्र" required>
              <input
                className={inputClassName}
                id="constituency"
                maxLength={120}
                name="constituency"
                required
              />
            </FormField>
            <FormField
              hint="6 अंकों का पिन कोड दर्ज करें।"
              id="pincode"
              label="पिन कोड"
              required
            >
              <input
                autoComplete="postal-code"
                className={inputClassName}
                id="pincode"
                inputMode="numeric"
                maxLength={6}
                name="pincode"
                required
              />
            </FormField>
          </div>
        </section>

        <section aria-labelledby="service-heading">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-stone-900" id="service-heading">
              शिक्षा और संगठन जानकारी
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <FormField id="education" label="शिक्षा" required>
              <input
                className={inputClassName}
                id="education"
                maxLength={120}
                name="education"
                required
              />
            </FormField>
            <FormField id="occupation" label="व्यवसाय" required>
              <input
                className={inputClassName}
                id="occupation"
                maxLength={120}
                name="occupation"
                required
              />
            </FormField>
            <FormField id="organizationName" label="संगठन का नाम">
              <input
                className={inputClassName}
                id="organizationName"
                maxLength={200}
                name="organizationName"
              />
            </FormField>
            <FormField id="designation" label="इच्छित पद / Designation">
              <input
                className={inputClassName}
                id="designation"
                maxLength={120}
                name="designation"
                placeholder="अपनी इच्छित भूमिका लिखें"
              />
            </FormField>
            <div className="md:col-span-2">
              <FormField id="joiningReason" label="जुड़ने का कारण">
                <textarea
                  className={`${inputClassName} min-h-24 resize-y`}
                  id="joiningReason"
                  maxLength={2000}
                  name="joiningReason"
                  rows={3}
                />
              </FormField>
            </div>
            <FormField
              hint='JSON format, उदाहरण: {"instagram":"https://example.com"}'
              id="socialMediaLinks"
              label="सोशल मीडिया लिंक (JSON)"
            >
              <textarea
                className={`${inputClassName} min-h-24 resize-y`}
                id="socialMediaLinks"
                maxLength={4000}
                name="socialMediaLinks"
                rows={3}
              />
            </FormField>
            <FormField id="referenceBy" label="संदर्भ देने वाले का नाम">
              <input
                className={inputClassName}
                id="referenceBy"
                maxLength={150}
                name="referenceBy"
              />
            </FormField>
          </div>
        </section>

        <section className="space-y-5 border-t border-stone-100 pt-6">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-stone-50 p-4">
            <input
              className="mt-1 size-4 shrink-0 accent-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
              name="consent"
              required
              type="checkbox"
            />
            <span className="text-sm leading-6 text-stone-700">
              मैं पुष्टि करता/करती हूँ कि दी गई जानकारी सही है और संगठन की
              गोपनीयता नीति से सहमत हूँ।
              <span aria-hidden="true" className="ml-1 text-orange-700">
                *
              </span>
            </span>
          </label>

          {applicationReference ? (
            <div
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950"
              role="status"
            >
              <p className="font-semibold">आपका आवेदन सफलतापूर्वक जमा हो गया है।</p>
              <p className="mt-2 text-sm">
                कृपया इस आवेदन संदर्भ संख्या को लिखकर सुरक्षित रखें:
              </p>
              <p className="mt-2 select-all rounded-lg bg-white px-4 py-3 font-mono text-lg font-bold tracking-wide">
                {applicationReference}
              </p>
            </div>
          ) : null}
          <ClientFormNotice message={error} tone="warning" />

          <div className="flex flex-col gap-4 border-t border-stone-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-lg text-xs leading-5 text-stone-500">
              आवेदन का संदर्भ नंबर जमा करने के बाद दिखाया जाएगा।
            </p>
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-900 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-950/10 transition hover:bg-emerald-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "आवेदन जमा हो रहा है…" : "पंजीकरण आवेदन जमा करें"}
              {!isSubmitting ? (
                <span aria-hidden="true" className="text-orange-300">
                  →
                </span>
              ) : null}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}
