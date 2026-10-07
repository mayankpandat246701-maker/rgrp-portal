export default function AdminApplicationDetailLoading() {
  return (
    <section
      aria-label="आवेदन विवरण लोड हो रहा है"
      className="mx-auto w-full max-w-5xl animate-pulse px-4 py-10 sm:px-8 sm:py-14"
    >
      <div className="h-8 w-64 rounded-lg bg-stone-200" />
      <div className="mt-5 h-28 rounded-2xl bg-emerald-950/10" />
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 8 }, (_, index) => (
          <div className="h-24 rounded-xl bg-stone-100" key={index} />
        ))}
      </div>
    </section>
  );
}
