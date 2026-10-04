type LeadershipMessage = {
  id: string;
  name: string;
  designation: string;
  message: string;
  portraitUrl: string | null;
};

export function LeadershipMessagesSection({
  messages,
}: {
  messages: LeadershipMessage[];
}) {
  return (
    <section
      aria-labelledby="leadership-messages-heading"
      className="mx-auto w-full max-w-6xl px-6 pb-16 sm:px-10"
    >
      <div className="rounded-3xl border border-orange-200/70 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6 shadow-lg shadow-orange-900/5 sm:p-10">
        <p className="text-sm font-semibold tracking-wide text-orange-800">
          राष्ट्रीय गौ रक्षा परिषद
        </p>
        <h2
          className="mt-2 text-2xl font-bold tracking-tight text-stone-950 sm:text-3xl"
          id="leadership-messages-heading"
        >
          संघ के मुख्य व्यक्ति और उनके संदेश
        </h2>
        {messages.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-orange-100 bg-white/80 p-5 text-sm leading-6 text-stone-600">
            संदेश शीघ्र प्रकाशित किए जाएँगे।
          </p>
        ) : (
          <div className="mt-7 grid gap-5 md:grid-cols-2">
            {messages.map((person) => (
              <article
                className="rounded-2xl border border-white/80 bg-white/80 p-5 shadow-sm backdrop-blur sm:p-6"
                key={person.id}
              >
                <div className="flex items-center gap-4">
                  {person.portraitUrl ? (
                    // Editor-supplied HTTPS images avoid a broad remote image optimizer allow-list.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt=""
                      className="size-16 rounded-full border-2 border-orange-100 object-cover"
                      height={64}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      src={person.portraitUrl}
                      width={64}
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="flex size-16 shrink-0 items-center justify-center rounded-full border-2 border-orange-100 bg-orange-50 text-xl font-bold text-orange-900"
                    >
                      {person.name.slice(0, 1)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-stone-950">
                      {person.name}
                    </h3>
                    <p className="mt-0.5 text-sm font-medium text-emerald-800">
                      {person.designation}
                    </p>
                  </div>
                </div>
                <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-stone-700">
                  {person.message}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
