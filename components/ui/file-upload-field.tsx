import type { ChangeEvent } from "react";
import { Icon } from "@/components/ui/icon";
import { FormField } from "@/components/ui/form-field";

type FileUploadFieldProps = {
  id: string;
  label: string;
  accept: string;
  file: File | null;
  required?: boolean;
  error?: string;
  onChange: (file: File | null) => void;
};

export function FileUploadField({
  id,
  label,
  accept,
  file,
  required = false,
  error,
  onChange,
}: FileUploadFieldProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.currentTarget.files?.[0] ?? null);
  }

  return (
    <FormField
      error={error}
      hint="JPG, PNG, WebP या PDF · अधिकतम 5 MB"
      id={id}
      label={label}
      required={required}
    >
      <label
        className="group flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-emerald-900/25 bg-emerald-900/[0.025] px-4 py-5 text-center transition hover:border-emerald-800 hover:bg-emerald-900/[0.05] focus-within:ring-4 focus-within:ring-emerald-800/10"
        htmlFor={id}
      >
        <span className="mb-2 flex size-10 items-center justify-center rounded-xl bg-white text-emerald-800 shadow-sm">
          <Icon name="upload" />
        </span>
        <span className="text-sm font-semibold text-stone-800">
          फ़ाइल चुनने के लिए क्लिक करें
        </span>
        <span className="mt-1 max-w-full truncate text-xs text-stone-500">
          {file ? file.name : "आपकी फ़ाइल केवल इस ब्राउज़र में दिखाई देगी"}
        </span>
      </label>
      <input
        accept={accept}
        aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
        aria-invalid={Boolean(error)}
        className="sr-only"
        id={id}
        onChange={handleChange}
        required={required}
        type="file"
      />
    </FormField>
  );
}
