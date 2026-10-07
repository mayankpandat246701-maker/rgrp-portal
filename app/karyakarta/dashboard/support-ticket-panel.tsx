"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type Ticket = {
  id: string;
  category: string;
  subject: string;
  message: string;
  status: "OPEN" | "IN_REVIEW" | "RESOLVED" | "REJECTED";
  adminResponse: string | null;
  createdAt: string;
  resolvedAt: string | null;
};

const categoryLabels: Record<string, string> = {
  PROFILE_CORRECTION: "Profile correction",
  ID_CARD_ISSUE: "ID card issue",
  CERTIFICATE_ISSUE: "Certificate issue",
  REGISTRATION_RENEWAL: "Registration renewal",
  MOBILE_NUMBER_CHANGE: "Mobile number change",
  DOCUMENT_REUPLOAD: "Document re-upload",
  OTHER: "Other",
};

const statusLabels: Record<Ticket["status"], string> = {
  OPEN: "Received",
  IN_REVIEW: "Under review",
  RESOLVED: "Resolved",
  REJECTED: "Rejected",
};

export function SupportTicketPanel() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [category, setCategory] = useState("OTHER");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTickets = useCallback(async () => {
    try {
      const response = await fetch("/api/karyakarta/support-tickets", {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);

      if (response.ok && payload?.data?.tickets) {
        setTickets(payload.data.tickets);
      } else {
        setError("Support requests could not be loaded.");
      }
    } catch {
      setError("Support requests could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (subject.trim().length < 5) {
      setError("Subject must be at least 5 characters.");
      return;
    }
    if (message.trim().length < 20) {
      setError("Please describe your issue in at least 20 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/karyakarta/support-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.error?.message ?? "Request could not be submitted.");
        return;
      }

      setSubject("");
      setMessage("");
      setNotice("Your request has been submitted.");
      await loadTickets();
    } catch {
      setError("Request could not be submitted.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-stone-950">Help & Support</h2>
      <p className="mt-1 text-sm text-stone-600">
        Raise a request for profile correction, ID card, certificate, or registration renewal.
      </p>

      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-stone-800">
            Request type
          </span>
          <select
            className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm"
            onChange={(event) => setCategory(event.currentTarget.value)}
            value={category}
          >
            {Object.entries(categoryLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-stone-800">
            Subject
          </span>
          <input
            className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm"
            maxLength={120}
            onChange={(event) => setSubject(event.currentTarget.value)}
            value={subject}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-stone-800">
            Describe your issue
          </span>
          <textarea
            className="min-h-32 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm"
            maxLength={2000}
            onChange={(event) => setMessage(event.currentTarget.value)}
            value={message}
          />
        </label>

        {error ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
            {notice}
          </p>
        ) : null}

        <button
          className="min-h-11 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Submitting..." : "Submit request"}
        </button>
      </form>

      <div className="mt-6">
        <h3 className="text-sm font-bold text-stone-950">Your requests</h3>
        {isLoading ? (
          <p className="mt-3 text-sm text-stone-600">Loading...</p>
        ) : tickets.length ? (
          <ul className="mt-3 divide-y divide-stone-100">
            {tickets.map((ticket) => (
              <li className="py-4" key={ticket.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-stone-900">
                    {ticket.subject}
                  </p>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
                    {statusLabels[ticket.status]}
                  </span>
                </div>
                <p className="mt-1 text-xs font-semibold text-stone-500">
                  {categoryLabels[ticket.category] ?? ticket.category}
                </p>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-stone-600">
                  {ticket.message}
                </p>
                {ticket.adminResponse ? (
                  <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    Admin response: {ticket.adminResponse}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-stone-600">
            You have not submitted any support request yet.
          </p>
        )}
      </div>
    </section>
  );
}
