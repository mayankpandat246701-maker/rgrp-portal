"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function PanelLogoutButton({ endpoint, redirectTo }: { endpoint: string; redirectTo: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    setPending(true);
    setError("");
    try {
      const response = await fetch(endpoint, { method: "POST" });
      if (!response.ok) throw new Error("logout failed");
      router.replace(redirectTo);
      router.refresh();
    } catch {
      setError("लॉगआउट नहीं हो सका। फिर प्रयास करें।");
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={logout}
        disabled={pending}
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-cocoa-800 transition-colors hover:bg-red-50 hover:text-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron-700 disabled:opacity-60"
      >
        <LogOut aria-hidden className="size-4" />
        {pending ? "लॉगआउट हो रहा है…" : "लॉगआउट · Logout"}
      </button>
      {error ? (
        <p role="alert" className="mt-1 px-3 text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </>
  );
}
