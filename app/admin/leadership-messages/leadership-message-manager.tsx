"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type LeadershipMessageItem = {
  id: string;
  name: string;
  designation: string;
  message: string;
  portraitUrl: string | null;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
};

type Draft = {
  name: string;
  designation: string;
  message: string;
  portraitUrl: string;
  sortOrder: string;
  isPublished: boolean;
};

const emptyDraft: Draft = {
  name: "",
  designation: "",
  message: "",
  portraitUrl: "",
  sortOrder: "0",
  isPublished: false,
};

async function getResponseError(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  if (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "string"
  ) {
    return body.error;
  }
  return "अनुरोध पूरा नहीं हो सका। कृपया फिर प्रयास करें।";
}

function isLeadershipMessageItem(value: unknown): value is LeadershipMessageItem {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "name" in value &&
    typeof value.name === "string" &&
    "designation" in value &&
    typeof value.designation === "string" &&
    "message" in value &&
    typeof value.message === "string" &&
    "portraitUrl" in value &&
    (typeof value.portraitUrl === "string" || value.portraitUrl === null) &&
    "sortOrder" in value &&
    typeof value.sortOrder === "number" &&
    "isPublished" in value &&
    typeof value.isPublished === "boolean" &&
    "createdAt" in value &&
    typeof value.createdAt === "string"
  );
}

export function LeadershipMessageManager({
  initialMessages,
}: {
  initialMessages: LeadershipMessageItem[];
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isError, setIsError] = useState(false);

  function beginEdit(message: LeadershipMessageItem) {
    setEditingId(message.id);
    setDraft({
      name: message.name,
      designation: message.designation,
      message: message.message,
      portraitUrl: message.portraitUrl ?? "",
      sortOrder: String(message.sortOrder),
      isPublished: message.isPublished,
    });
    setFeedback("");
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(emptyDraft);
    setFeedback("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setFeedback("");
    setIsError(false);

    const payload = {
      ...draft,
      sortOrder: Number(draft.sortOrder),
    };

    try {
      const response = await fetch(
        editingId
          ? `/api/admin/leadership-messages/${encodeURIComponent(editingId)}`
          : "/api/admin/leadership-messages",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok) throw new Error(await getResponseError(response));

      const body: unknown = await response.json();
      if (
        typeof body !== "object" ||
        body === null ||
        !("data" in body) ||
        !isLeadershipMessageItem(body.data)
      ) {
        throw new Error("अनुरोध पूरा नहीं हो सका। कृपया फिर प्रयास करें।");
      }

      const saved = body.data;
      setMessages((current) => {
        const next = editingId
          ? current.map((message) => (message.id === editingId ? saved : message))
          : [...current, saved];
        return next.sort(
          (left, right) =>
            left.sortOrder - right.sortOrder ||
            left.createdAt.localeCompare(right.createdAt),
        );
      });
      setDraft(emptyDraft);
      setEditingId(null);
      setFeedback("संदेश सहेज दिया गया है।");
      router.refresh();
    } catch (error) {
      setIsError(true);
      setFeedback(
        error instanceof Error
          ? error.message
          : "संदेश सहेजा नहीं जा सका।",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteMessage(message: LeadershipMessageItem) {
    if (!window.confirm(`क्या "${message.name}" का संदेश हटाना चाहते हैं?`)) {
      return;
    }
    setBusyId(message.id);
    setFeedback("");
    setIsError(false);

    try {
      const response = await fetch(
        `/api/admin/leadership-messages/${encodeURIComponent(message.id)}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error(await getResponseError(response));

      setMessages((current) =>
        current.filter((entry) => entry.id !== message.id),
      );
      if (editingId === message.id) cancelEdit();
      setFeedback("संदेश हटा दिया गया है।");
      router.refresh();
    } catch (error) {
      setIsError(true);
      setFeedback(
        error instanceof Error
          ? error.message
          : "संदेश हटाया नहीं जा सका।",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <form
        className="h-fit space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
        onSubmit={handleSubmit}
      >
        <h2 className="text-lg font-bold text-stone-950">
          {editingId ? "संदेश संपादित करें" : "नया संदेश जोड़ें"}
        </h2>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-stone-800">
            नाम
          </span>
          <input
            className="w-full rounded-xl border border-stone-300 px-3 py-2.5"
            maxLength={100}
            onChange={(event) =>
              setDraft({ ...draft, name: event.target.value })
            }
            required
            value={draft.name}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-stone-800">
            पद / परिचय
          </span>
          <input
            className="w-full rounded-xl border border-stone-300 px-3 py-2.5"
            maxLength={120}
            onChange={(event) =>
              setDraft({ ...draft, designation: event.target.value })
            }
            required
            value={draft.designation}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-stone-800">
            संदेश
          </span>
          <textarea
            className="min-h-36 w-full rounded-xl border border-stone-300 px-3 py-2.5"
            maxLength={2000}
            onChange={(event) =>
              setDraft({ ...draft, message: event.target.value })
            }
            required
            value={draft.message}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-stone-800">
            पोर्ट्रेट URL (वैकल्पिक, HTTPS)
          </span>
          <input
            className="w-full rounded-xl border border-stone-300 px-3 py-2.5"
            onChange={(event) =>
              setDraft({ ...draft, portraitUrl: event.target.value })
            }
            type="url"
            value={draft.portraitUrl}
          />
        </label>
        <div className="flex flex-wrap items-center gap-5">
          <label className="flex items-center gap-2 text-sm font-medium">
            क्रम
            <input
              className="w-24 rounded-lg border border-stone-300 px-3 py-2"
              max={9999}
              min={0}
              onChange={(event) =>
                setDraft({ ...draft, sortOrder: event.target.value })
              }
              type="number"
              value={draft.sortOrder}
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              checked={draft.isPublished}
              onChange={(event) =>
                setDraft({ ...draft, isPublished: event.target.checked })
              }
              type="checkbox"
            />
            प्रकाशित करें
          </label>
        </div>
        {feedback ? (
          <p
            className={`text-sm ${isError ? "text-red-700" : "text-emerald-800"}`}
            role={isError ? "alert" : "status"}
          >
            {feedback}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <button
            className="min-h-11 rounded-xl bg-emerald-900 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? "सहेजा जा रहा है…" : "सहेजें"}
          </button>
          {editingId ? (
            <button
              className="min-h-11 rounded-xl border border-stone-300 px-5 py-2.5 text-sm font-semibold"
              onClick={cancelEdit}
              type="button"
            >
              रद्द करें
            </button>
          ) : null}
        </div>
      </form>

      <section aria-labelledby="leadership-list-heading">
        <h2
          className="text-lg font-bold text-stone-950"
          id="leadership-list-heading"
        >
          सभी संदेश ({messages.length})
        </h2>
        <div className="mt-4 space-y-4">
          {messages.length === 0 ? (
            <p className="rounded-xl border border-dashed border-stone-300 p-6 text-sm text-stone-600">
              अभी कोई संदेश नहीं जोड़ा गया है।
            </p>
          ) : (
            messages.map((message) => (
              <article
                className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
                key={message.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-stone-950">{message.name}</h3>
                    <p className="text-sm text-emerald-800">
                      {message.designation}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      message.isPublished
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-amber-50 text-amber-800"
                    }`}
                  >
                    {message.isPublished ? "प्रकाशित" : "ड्राफ़्ट"}
                  </span>
                </div>
                <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-stone-700">
                  {message.message}
                </p>
                <p className="mt-2 text-xs text-stone-500">
                  प्रदर्शन क्रम: {message.sortOrder}
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold"
                    onClick={() => beginEdit(message)}
                    type="button"
                  >
                    संपादित करें
                  </button>
                  <button
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-60"
                    disabled={busyId === message.id}
                    onClick={() => void deleteMessage(message)}
                    type="button"
                  >
                    {busyId === message.id ? "हटाया जा रहा है…" : "हटाएँ"}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
