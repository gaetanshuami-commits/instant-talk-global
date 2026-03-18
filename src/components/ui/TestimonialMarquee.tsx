"use client";

const testimonials = [
  {
    name: "Sophie Martin",
    role: "International Consultant",
    company: "Paris",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80",
    quote:
      "Instant Talk change complètement la manière de conduire des échanges internationaux. La conversation reste naturelle, claire et crédible, même quand plusieurs langues se croisent en direct.",
    language: "Français",
  },
  {
    name: "David Brooks",
    role: "Operations Lead",
    company: "London",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
    quote:
      "For the first time, multilingual meetings feel like one conversation instead of several fragmented layers. The product feels premium, direct and immediately useful.",
    language: "English",
  },
  {
    name: "Amina Al-Farsi",
    role: "Strategic Partnerships",
    company: "Doha",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
    quote:
      "المنصة تمنحنا مستوى جديداً من الوضوح والسرعة في الاجتماعات الدولية. التجربة احترافية جداً وتشعر بأنها مصممة لعالم الأعمال العالمي.",
    language: "العربية",
  },
  {
    name: "Kenji Sato",
    role: "Global Product Manager",
    company: "Tokyo",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80",
    quote:
      "リアルタイム翻訳なのに会話の自然さが保たれている点が非常に印象的です。国際会議の品質そのものが変わります。",
    language: "日本語",
  },
];

export function TestimonialMarquee() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-24">
      <div className="max-w-3xl">
        <div className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#635bff] shadow-sm">
          Témoignages
        </div>
        <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-[#0a2540] md:text-5xl">
          Une plateforme crédible dès le premier regard, utile dès la première réunion.
        </h2>
        <p className="mt-6 text-lg leading-8 text-[#425466]">
          Instant Talk est conçu pour offrir une expérience immédiatement compréhensible, premium et rassurante pour des échanges internationaux à forte valeur.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {testimonials.map((item) => (
          <article
            key={item.name}
            className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-30px_rgba(10,37,64,0.20)] transition hover:-translate-y-1 hover:shadow-[0_24px_70px_-30px_rgba(10,37,64,0.28)]"
          >
            <div className="flex items-center gap-4">
              <img
                src={item.image}
                alt={item.name}
                className="h-14 w-14 rounded-full object-cover ring-2 ring-slate-100"
              />
              <div>
                <div className="text-base font-bold text-[#0a2540]">{item.name}</div>
                <div className="text-sm text-slate-500">
                  {item.role} • {item.company}
                </div>
              </div>
              <div className="ml-auto rounded-full bg-[#eef2ff] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#635bff]">
                {item.language}
              </div>
            </div>

            <p className="mt-6 text-[15px] leading-8 text-[#425466]">
              “{item.quote}”
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}