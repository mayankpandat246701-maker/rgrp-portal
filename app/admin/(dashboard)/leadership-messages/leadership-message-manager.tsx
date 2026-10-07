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
  displayOrder: number;
  showOnHomepage: boolean;
  state: string | null;
  district: string | null;
  isPublished: boolean;
  createdAt: string;
};

type Draft = {
  name: string;
  designation: string;
  message: string;
  portraitUrl: string;
  sortOrder: string;
  state: string;
  district: string;
  showOnHomepage: boolean;
  isPublished: boolean;
};

const emptyDraft: Draft = {
  name: "",
  designation: "",
  message: "",
  portraitUrl: "",
  sortOrder: "0",
  state: "",
  district: "",
  showOnHomepage: true,
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
    "displayOrder" in value &&
    typeof value.displayOrder === "number" &&
    "showOnHomepage" in value &&
    typeof value.showOnHomepage === "boolean" &&
    "state" in value &&
    (typeof value.state === "string" || value.state === null) &&
    "district" in value &&
    (typeof value.district === "string" || value.district === null) &&
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
  const [portraitFile, setPortraitFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isError, setIsError] = useState(false);

  function beginEdit(message: LeadershipMessageItem) {
    setEditingId(message.id);
    setPortraitFile(null);
    setDraft({
      name: message.name,
      designation: message.designation,
      message: message.message,
      portraitUrl: message.portraitUrl ?? "",
      sortOrder: String(message.sortOrder),
      state: message.state ?? "",
      district: message.district ?? "",
      showOnHomepage: message.showOnHomepage,
      isPublished: message.isPublished,
    });
    setFeedback("");
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(emptyDraft);
    setPortraitFile(null);
    setFeedback("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const pendingPortrait = portraitFile;
    if (pendingPortrait) {
      const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedImageTypes.includes(pendingPortrait.type)) {
        setIsError(true);
        setFeedback(
          "छवि का प्रारूप अमान्य है। केवल JPG, JPEG, PNG और WEBP फ़ाइलें चुनें।",
        );
        return;
      }
      if (pendingPortrait.size > 3 * 1024 * 1024) {
        setIsError(true);
        setFeedback("छवि का आकार अनुमत सीमा (3 MB) से अधिक है।");
        return;
      }
    }

    setIsSaving(true);
    setFeedback("");
    setIsError(false);

    const payload = {
      ...draft,
      sortOrder: Number(draft.sortOrder),
      displayOrder: Number(draft.sortOrder),
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
      let finalMessage = saved;
      let feedbackMessage = "संदेश सहेज दिया गया है।";
      let feedbackIsError = false;

      if (pendingPortrait) {
        const portraitForm = new FormData();
        portraitForm.set("portrait", pendingPortrait);
        try {
          const uploadResponse = await fetch(
            `/api/admin/leadership-messages/${encodeURIComponent(saved.id)}/photo`,
            { method: "POST", body: portraitForm },
          );
          if (!uploadResponse.ok) {
            throw new Error(await getResponseError(uploadResponse));
          }
          const uploadBody: unknown = await uploadResponse.json();
          const uploadedUrl =
            typeof uploadBody === "object" &&
            uploadBody !== null &&
            "data" in uploadBody &&
            typeof uploadBody.data === "object" &&
            uploadBody.data !== null &&
            "portraitUrl" in uploadBody.data &&
            typeof uploadBody.data.portraitUrl === "string"
              ? uploadBody.data.portraitUrl
              : null;
          if (uploadedUrl) {
            finalMessage = { ...saved, portraitUrl: uploadedUrl };
          }
          feedbackMessage = "संदेश और छवि दोनों सफलतापूर्वक सहेजे गए।";
        } catch (uploadError) {
          feedbackIsError = true;
          feedbackMessage = `संदेश सहेज दिया गया, लेकिन छवि अपलोड नहीं हो सकी। ${
            uploadError instanceof Error ? uploadError.message : ""
          }`.trim();
        }
      }

      setMessages((current) => {
        const next = editingId
          ? current.map((message) =>
              message.id === editingId ? finalMessage : message,
            )
          : [...current, finalMessage];
        return next.sort(
          (left, right) =>
            left.sortOrder - right.sortOrder ||
            left.createdAt.localeCompare(right.createdAt),
        );
      });
      setDraft(emptyDraft);
      setEditingId(null);
      setPortraitFile(null);
      setIsError(feedbackIsError);
      setFeedback(feedbackMessage);
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
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-stone-800">
            पोर्ट्रेट छवि अपलोड करें (JPG/JPEG/PNG/WEBP, अधिकतम 3 MB)
          </span>
          <input
            accept="image/jpeg,image/png,image/webp"
            className="block w-full rounded-xl border border-stone-300 bg-white p-2.5 text-sm text-stone-700"
            onChange={(event) =>
              setPortraitFile(event.target.files?.[0] ?? null)
            }
            type="file"
          />
        </label>
        {portraitFile ? (
          <p className="text-xs text-stone-600">
            चयनित छवि: {portraitFile.name}
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-stone-800">राज्य (वैकल्पिक)</span>
            <input className="w-full rounded-xl border border-stone-300 px-3 py-2.5" maxLength={120} onChange={(event) => setDraft({ ...draft, state: event.target.value })} value={draft.state} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-stone-800">जिला (वैकल्पिक)</span>
            <input className="w-full rounded-xl border border-stone-300 px-3 py-2.5" maxLength={120} onChange={(event) => setDraft({ ...draft, district: event.target.value })} value={draft.district} />
          </label>
        </div>
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
              checked={draft.showOnHomepage}
              onChange={(event) =>
                setDraft({ ...draft, showOnHomepage: event.target.checked })
              }
              type="checkbox"
            />
            होमपेज पर मुख्य व्यक्ति के रूप में दिखाएँ
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
        <p className="text-xs text-stone-500">छोटी संख्या पहले दिखाई जाती है। होमपेज पर अधिकतम 12 चयनित प्रकाशित संदेश दिखेंगे।</p>
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
        {messages.filter((message) => message.isPublished && message.showOnHomepage).length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-stone-300 p-5 text-sm text-stone-600">
            होमपेज के लिए अभी कोई मुख्य व्यक्ति चयनित नहीं है।
          </p>
        ) : null}
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
                  प्रदर्शन क्रम: {message.displayOrder} · {message.showOnHomepage ? "होमपेज चयनित" : "होमपेज से छिपा"}
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
