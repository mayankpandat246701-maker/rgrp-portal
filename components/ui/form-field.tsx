import type { ReactNode } from "react";

type FormFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
};

export function FormField({
  id,
  label,
  required = false,
  hint,
  error,
  children,
}: FormFieldProps) {
  return (
    <div className="min-w-0">
      <label
        className="mb-2 block text-sm font-semibold text-stone-800"
        htmlFor={id}
      >
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-1 text-orange-700">
            *
          </span>
        ) : null}
        {!required ? (
          <span className="ml-2 text-xs font-normal text-stone-500">
            (वैकल्पिक)
          </span>
        ) : null}
      </label>
      {children}
      {hint ? (
        <p className="mt-2 text-xs leading-5 text-stone-500" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          className="mt-2 text-sm font-medium text-red-700"
          id={`${id}-error`}
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const inputClassName =
  "w-full rounded-xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 hover:border-stone-300 focus:border-emerald-800 focus:ring-4 focus:ring-emerald-800/10 aria-[invalid=true]:border-red-400 aria-[invalid=true]:focus:ring-red-500/10";
