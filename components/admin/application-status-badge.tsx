import type { KaryakartaApplicationStatus } from "@prisma/client";

const statusStyles: Record<KaryakartaApplicationStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-900",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-900",
  BLOCKED: "border-red-200 bg-red-50 text-red-900",
};

const statusLabels: Record<KaryakartaApplicationStatus, string> = {
  PENDING: "लंबित",
  APPROVED: "स्वीकृत",
  BLOCKED: "अस्वीकृत",
};

export function ApplicationStatusBadge({
  status,
}: {
  status: KaryakartaApplicationStatus;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
