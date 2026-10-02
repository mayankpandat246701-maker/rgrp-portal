type ClientFormNoticeProps = {
  message: string;
  tone?: "success" | "info" | "warning";
};

const toneClassNames = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  info: "border-blue-200 bg-blue-50 text-blue-900",
  warning: "border-orange-200 bg-orange-50 text-orange-950",
};

export function ClientFormNotice({
  message,
  tone = "info",
}: ClientFormNoticeProps) {
  if (!message) return null;

  return (
    <p
      aria-live="polite"
      className={`rounded-xl border px-4 py-3 text-sm leading-6 ${toneClassNames[tone]}`}
      role="status"
    >
      {message}
    </p>
  );
}
