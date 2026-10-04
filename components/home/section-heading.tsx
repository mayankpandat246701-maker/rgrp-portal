export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  align = "center",
}: {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  align?: "center" | "left";
}) {
  const alignment = align === "center" ? "mx-auto text-center" : "text-left";
  return (
    <div className={`max-w-2xl ${alignment}`}>
      <p className="text-sm font-semibold tracking-[0.18em] text-saffron-700 uppercase">{eyebrow}</p>
      <h2 id={id} className="mt-3 font-serif text-3xl leading-snug font-bold text-balance text-cocoa-900 sm:text-4xl">
        {title}
      </h2>
      {description && <p className="mt-4 text-base leading-relaxed text-pretty text-cocoa-700 sm:text-lg">{description}</p>}
    </div>
  );
}
