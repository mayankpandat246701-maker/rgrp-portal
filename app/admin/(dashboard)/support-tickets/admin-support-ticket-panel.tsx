"use client";

import { useMemo, useState } from "react";

type TicketStatus = "OPEN" | "IN_REVIEW" | "RESOLVED" | "REJECTED";

type AdminSupportTicket = {
  id: string;
  category: string;
  subject: string;
  message: string;
  status: TicketStatus;
  adminResponse: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
  karyakarta: {
    id: string;
    name: string;
    regNo: string;
    state: string | null;
    district: string | null;
  };
};

const statusLabels: Record<TicketStatus, string> = {
  OPEN: "Open",
  IN_REVIEW: "Under Review",
  RESOLVED: "Resolved",
  REJECTED: "Rejected",
};

const statusStyles: Record<TicketStatus, string> = {
  OPEN: "bg-amber-100 text-amber-800",
  IN_REVIEW: "bg-blue-100 text-blue-800",
  RESOLVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-rose-100 text-rose-800",
};

export function AdminSupportTicketPanel({
  initialTickets,
}: {
  initialTickets: AdminSupportTicket[];
}) {
  const [tickets, setTickets] = useState(initialTickets);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesStatus =
        statusFilter === "ALL" || ticket.status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        ticket.subject,
        ticket.message,
        ticket.karyakarta.name,
        ticket.karyakarta.regNo,
        ticket.karyakarta.state ?? "",
        ticket.karyakarta.district ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [tickets, statusFilter, search]);

  const openCount = tickets.filter((ticket) => ticket.status === "OPEN").length;
  const reviewCount = tickets.filter(
    (ticket) => ticket.status === "IN_REVIEW",
  ).length;
  const resolvedCount = tickets.filter(
    (ticket) => ticket.status === "RESOLVED",
  ).length;

  async function updateTicket(
    ticketId: string,
    status: TicketStatus,
    adminResponse: string,
  ) {
    setBusyId(ticketId);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/support-tickets/${ticketId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            adminResponse: adminResponse.trim() || undefined,
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        throw new Error(
          payload?.error?.message ?? "Ticket update nahi ho saka.",
        );
      }

      setTickets((current) =>
        current.map((ticket) =>
          ticket.id === ticketId
            ? {
                ...ticket,
                status,
                adminResponse:
                  payload.data?.ticket?.adminResponse ?? ticket.adminResponse,
                resolvedAt:
                  payload.data?.ticket?.resolvedAt ?? ticket.resolvedAt,
              }
            : ticket,
        ),
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Ticket update nahi ho saka.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">Open tickets</p>
          <p className="mt-1 text-2xl font-bold text-amber-900">{openCount}</p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-900">Under review</p>
          <p className="mt-1 text-2xl font-bold text-blue-900">{reviewCount}</p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-900">Resolved</p>
          <p className="mt-1 text-2xl font-bold text-emerald-900">
            {resolvedCount}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Name, registration number, subject ya district search karein"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 sm:max-w-md"
        />

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as TicketStatus | "ALL")
          }
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        >
          <option value="ALL">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_REVIEW">Under review</option>
          <option value="RESOLVED">Resolved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      {filteredTickets.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="font-semibold text-slate-900">Koi ticket nahi mila</p>
          <p className="mt-1 text-sm text-slate-600">
            Filter change karke dobara try karein.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              busy={busyId === ticket.id}
              onUpdate={updateTicket}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TicketCard({
  ticket,
  busy,
  onUpdate,
}: {
  ticket: AdminSupportTicket;
  busy: boolean;
  onUpdate: (
    ticketId: string,
    status: TicketStatus,
    adminResponse: string,
  ) => Promise<void>;
}) {
  const [response, setResponse] = useState(ticket.adminResponse ?? "");
  const [status, setStatus] = useState<TicketStatus>(ticket.status);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
              {ticket.category}
            </span>

            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyles[ticket.status]}`}
            >
              {statusLabels[ticket.status]}
            </span>
          </div>

          <h2 className="mt-2 font-semibold text-slate-900">
            {ticket.subject}
          </h2>

          <p className="mt-1 text-sm text-slate-600">{ticket.message}</p>
        </div>

        <div className="text-right text-xs text-slate-500">
          <p className="font-semibold text-slate-700">
            {ticket.karyakarta.name}
          </p>
          <p>{ticket.karyakarta.regNo}</p>
          <p>
            {[ticket.karyakarta.district, ticket.karyakarta.state]
              .filter(Boolean)
              .join(", ")}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[180px_1fr]">
        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as TicketStatus)
          }
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        >
          <option value="OPEN">Open</option>
          <option value="IN_REVIEW">Under review</option>
          <option value="RESOLVED">Resolved</option>
          <option value="REJECTED">Rejected</option>
        </select>

        <textarea
          value={response}
          onChange={(event) => setResponse(event.target.value)}
          rows={3}
          placeholder="Admin response likhein..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        />
      </div>

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          disabled={busy}
          onClick={() => onUpdate(ticket.id, status, response)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Updating..." : "Update ticket"}
        </button>
      </div>
    </article>
  );
}

