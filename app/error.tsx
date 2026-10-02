"use client";

import { useEffect } from "react";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-16 sm:px-10">
      <h1 className="text-3xl font-bold tracking-tight text-stone-950">
        Something went wrong
      </h1>
      <p className="mt-4 text-stone-600">
        The page could not be displayed. Please try again.
      </p>
      <button
        className="mt-8 w-fit rounded-md bg-emerald-800 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
        onClick={() => retry()}
        type="button"
      >
        Try again
      </button>
    </section>
  );
}
