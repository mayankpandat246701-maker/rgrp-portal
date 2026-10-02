"use client";

import { useState, type FormEvent } from "react";
import { ClientFormNotice } from "@/components/ui/client-form-notice";
import { FileUploadField } from "@/components/ui/file-upload-field";
import { FormField, inputClassName } from "@/components/ui/form-field";
import { Icon } from "@/components/ui/icon";

const allowedExtensions = new Set(["jpg", "jpeg", "png", "webp", "pdf"]);
const maxFileSize = 5 * 1024 * 1024;

const requiredFields: Record<string, string> = {
  fullName: "कृपया अपना पूरा नाम दर्ज करें।",
  guardianName: "कृपया पिता/अभिभावक का नाम दर्ज करें।",
  birthDate: "कृपया जन्म तिथि चुनें।",
  mobile: "कृपया मोबाइल नंबर दर्ज करें।",
  address: "कृपया पूरा पता दर्ज करें।",
  state: "कृपया राज्य दर्ज करें।",
  zone: "कृपया ज़ोन दर्ज करें।",
  district: "कृपया जिला दर्ज करें।",
  pinCode: "कृपया पिन कोड दर्ज करें।",
  designation: "कृपया इच्छित पद दर्ज करें।",
};

function validateFile(file: File | null, fieldName: string) {
  if (!file) return `${fieldName} चुनें।`;
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!allowedExtensions.has(extension)) {
    return "केवल JPG, PNG, WebP या PDF फ़ाइल स्वीकार्य है।";
  }
  if (file.size > maxFileSize) {
    return "फ़ाइल का आकार 5 MB से कम होना चाहिए।";
  }
  return "";
}

function inputDescription(id: string, error?: string) {
  return error ? `${id}-error` : undefined;
}

export function JoinForm() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [identityDocument, setIdentityDocument] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");

    const formData = new FormData(event.currentTarget);
    const nextErrors: Record<string, string> = {};

    for (const [field, message] of Object.entries(requiredFields)) {
      if (!String(formData.get(field) ?? "").trim()) {
        nextErrors[field] = message;
      }
    }

    const mobile = String(formData.get("mobile") ?? "").trim();
    if (mobile && !/^[6-9]\d{9}$/.test(mobile)) {
      nextErrors.mobile = "कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें।";
    }

    const pinCode = String(formData.get("pinCode") ?? "").trim();
    if (pinCode && !/^[1-9]\d{5}$/.test(pinCode)) {
      nextErrors.pinCode = "कृपया 6 अंकों का सही पिन कोड दर्ज करें।";
    }

    const email = String(formData.get("email") ?? "").trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "कृपया सही ईमेल पता दर्ज करें।";
    }

    const photoError = validateFile(photo, "पासपोर्ट साइज फोटो");
    const documentError = validateFile(identityDocument, "पहचान दस्तावेज़");
    if (photoError) nextErrors.photo = photoError;
    if (documentError) nextErrors.identityDocument = documentError;
    if (!formData.get("consent")) {
      nextErrors.consent = "आगे बढ़ने के लिए कृपया सहमति दें।";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setNotice(
      "पंजीकरण सुविधा जल्द ही सक्रिय होगी। आपका डेटा अभी भेजा नहीं गया है।",
    );
  }

  function updateFile(
    file: File | null,
    field: "photo" | "identityDocument",
  ) {
    if (field === "photo") setPhoto(file);
    else setIdentityDocument(file);

    const fileError = validateFile(
      file,
      field === "photo" ? "पासपोर्ट साइज फोटो" : "पहचान दस्तावेज़",
    );
    setErrors((current) => ({
      ...current,
      [field]: fileError,
    }));
    setNotice("");
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

      <form className="space-y-8 p-5 sm:p-8" noValidate onSubmit={handleSubmit}>
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
            <FormField
              error={errors.fullName}
              id="fullName"
              label="पूरा नाम / Full Name"
              required
            >
              <input
                aria-describedby={inputDescription("fullName", errors.fullName)}
                aria-invalid={Boolean(errors.fullName)}
                autoComplete="name"
                className={inputClassName}
                id="fullName"
                name="fullName"
                placeholder="अपना पूरा नाम लिखें"
                required
              />
            </FormField>
            <FormField
              error={errors.guardianName}
              id="guardianName"
              label="पिता/अभिभावक का नाम"
              required
            >
              <input
                aria-describedby={inputDescription(
                  "guardianName",
                  errors.guardianName,
                )}
                aria-invalid={Boolean(errors.guardianName)}
                autoComplete="off"
                className={inputClassName}
                id="guardianName"
                name="guardianName"
                placeholder="पिता या अभिभावक का पूरा नाम"
                required
              />
            </FormField>
            <FormField
              error={errors.birthDate}
              id="birthDate"
              label="जन्म तिथि"
              required
            >
              <input
                aria-describedby={inputDescription(
                  "birthDate",
                  errors.birthDate,
                )}
                aria-invalid={Boolean(errors.birthDate)}
                className={inputClassName}
                id="birthDate"
                name="birthDate"
                required
                type="date"
              />
            </FormField>
            <FormField
              error={errors.mobile}
              hint="10 अंकों का मोबाइल नंबर दर्ज करें।"
              id="mobile"
              label="मोबाइल नंबर"
              required
            >
              <input
                aria-describedby={`mobile-hint${errors.mobile ? " mobile-error" : ""}`}
                aria-invalid={Boolean(errors.mobile)}
                autoComplete="tel-national"
                className={inputClassName}
                id="mobile"
                inputMode="numeric"
                maxLength={10}
                name="mobile"
                placeholder="उदाहरण: 9876543210"
                required
                type="tel"
              />
            </FormField>
            <FormField error={errors.email} id="email" label="ईमेल">
              <input
                aria-describedby={inputDescription("email", errors.email)}
                aria-invalid={Boolean(errors.email)}
                autoComplete="email"
                className={inputClassName}
                id="email"
                name="email"
                placeholder="name@example.com"
                type="email"
              />
            </FormField>
            <FormField
              error={errors.designation}
              id="designation"
              label="इच्छित पद / Designation"
              required
            >
              <input
                aria-describedby={inputDescription(
                  "designation",
                  errors.designation,
                )}
                aria-invalid={Boolean(errors.designation)}
                className={inputClassName}
                id="designation"
                name="designation"
                placeholder="अपनी इच्छित भूमिका लिखें"
                required
              />
            </FormField>
            <div className="md:col-span-2">
              <FormField
                error={errors.address}
                id="address"
                label="पूरा पता"
                required
              >
                <textarea
                  aria-describedby={inputDescription("address", errors.address)}
                  aria-invalid={Boolean(errors.address)}
                  autoComplete="street-address"
                  className={`${inputClassName} min-h-24 resize-y`}
                  id="address"
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
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { id: "state", label: "राज्य", placeholder: "राज्य का नाम" },
              { id: "zone", label: "ज़ोन", placeholder: "ज़ोन का नाम" },
              { id: "district", label: "जिला", placeholder: "जिले का नाम" },
              {
                id: "pinCode",
                label: "पिन कोड",
                placeholder: "उदाहरण: 110001",
              },
            ].map(({ id, label, placeholder }) => (
              <FormField
                error={errors[id]}
                id={id}
                key={id}
                label={label}
                required
              >
                <input
                  aria-describedby={inputDescription(id, errors[id])}
                  aria-invalid={Boolean(errors[id])}
                  autoComplete={id === "pinCode" ? "postal-code" : "off"}
                  className={inputClassName}
                  id={id}
                  inputMode={id === "pinCode" ? "numeric" : undefined}
                  maxLength={id === "pinCode" ? 6 : undefined}
                  name={id}
                  placeholder={placeholder}
                  required
                />
              </FormField>
            ))}
          </div>
        </section>

        <section aria-labelledby="service-heading">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-stone-900" id="service-heading">
              सेवा और कौशल
            </h2>
          </div>
          <FormField
            id="skills"
            label="सेवा/कौशल क्षेत्र"
            hint="जैसे: पशु सेवा, जनसंपर्क, आयोजन या अन्य कौशल"
          >
            <textarea
              className={`${inputClassName} min-h-24 resize-y`}
              id="skills"
              name="skills"
              placeholder="अपने अनुभव या रुचि के क्षेत्र लिखें"
              rows={3}
            />
          </FormField>
        </section>

        <section aria-labelledby="documents-heading">
          <div className="mb-5">
            <h2
              className="text-lg font-bold text-stone-900"
              id="documents-heading"
            >
              फोटो और पहचान दस्तावेज़
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              JPG, PNG, WebP or PDF, maximum 5 MB.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <FileUploadField
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              error={errors.photo}
              file={photo}
              id="photo"
              label="पासपोर्ट साइज फोटो"
              onChange={(file) => updateFile(file, "photo")}
              required
            />
            <FileUploadField
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              error={errors.identityDocument}
              file={identityDocument}
              id="identityDocument"
              label="पहचान प्रमाण / Aadhaar या अन्य वैध दस्तावेज़"
              onChange={(file) => updateFile(file, "identityDocument")}
              required
            />
          </div>
          <p className="mt-4 rounded-xl border border-orange-200/80 bg-orange-50/70 px-4 py-3 text-sm leading-6 text-orange-950">
            पहचान दस्तावेज़ केवल सत्यापन हेतु अधिकृत प्रशासनिक टीम द्वारा देखे
            जाएंगे।
          </p>
        </section>

        <section className="space-y-5 border-t border-stone-100 pt-6">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-stone-50 p-4">
            <input
              aria-describedby={errors.consent ? "consent-error" : undefined}
              aria-invalid={Boolean(errors.consent)}
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
          {errors.consent ? (
            <p className="text-sm font-medium text-red-700" id="consent-error" role="alert">
              {errors.consent}
            </p>
          ) : null}
          <ClientFormNotice
            message={notice}
            tone="warning"
          />
          <div className="flex flex-col gap-4 border-t border-stone-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-lg text-xs leading-5 text-stone-500">
              अभी कोई जानकारी या फ़ाइल भेजी अथवा सहेजी नहीं जाएगी।
            </p>
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-900 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-950/10 transition hover:bg-emerald-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
              type="submit"
            >
              पंजीकरण आवेदन जमा करें
              <span aria-hidden="true" className="text-orange-300">
                →
              </span>
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}
