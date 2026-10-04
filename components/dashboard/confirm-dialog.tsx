"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  tone?: "danger" | "primary";
  pending?: boolean;
  /** When set, the user must type this exact text before confirming. */
  requireText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  tone = "danger",
  pending = false,
  requireText,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [typed, setTyped] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setTyped("");
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const confirmDisabled = pending || (requireText !== undefined && typed.trim() !== requireText);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onCancel();
      }}
      className="m-auto w-[min(92vw,28rem)] rounded-3xl border border-white/80 bg-white/95 p-0 text-cocoa-900 shadow-2xl backdrop:bg-cocoa-900/40 backdrop:backdrop-blur-sm"
    >
      <div className="p-6">
        <h2 id={titleId} className="font-serif text-xl font-bold">
          {title}
        </h2>
        <div id={descriptionId} className="mt-2 text-sm leading-relaxed text-cocoa-700">
          {description}
        </div>
        {requireText !== undefined ? (
          <div className="mt-4">
            <label htmlFor={`${titleId}-confirm`} className="text-sm font-semibold">
              पुष्टि के लिए <span className="font-mono">{requireText}</span> टाइप करें
            </label>
            <input
              id={`${titleId}-confirm`}
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
              className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-saffron-600 focus:ring-4 focus:ring-saffron-500/15"
            />
          </div>
        ) : null}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-cocoa-800 hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron-700 disabled:opacity-60"
          >
            रद्द करें · Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 ${
              tone === "danger"
                ? "bg-red-700 hover:bg-red-800 focus-visible:outline-red-700"
                : "bg-saffron-600 hover:bg-saffron-700 focus-visible:outline-saffron-700"
            }`}
          >
            {pending ? "कृपया प्रतीक्षा करें…" : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
