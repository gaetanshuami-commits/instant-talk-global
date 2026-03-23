"use client";

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/30 bg-sky-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-sky-300">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-sky-400" aria-hidden="true">
        <path d="M22.25 12c0 .82-.67 1.49-1.36 2.05-.22.18-.44.36-.58.52-.16.19-.3.48-.43.76-.31.67-.64 1.36-1.42 1.64-.76.28-1.5.02-2.2-.22-.29-.1-.58-.2-.82-.2-.23 0-.53.1-.82.2-.69.24-1.44.5-2.2.22-.78-.28-1.11-.97-1.42-1.64-.13-.28-.27-.57-.43-.76-.14-.16-.36-.34-.58-.52-.69-.56-1.36-1.23-1.36-2.05s.67-1.49 1.36-2.05c.22-.18.44-.36.58-.52.16-.19.3-.48.43-.76.31-.67.64-1.36 1.42-1.64.76-.28 1.5-.02 2.2.22.29.1.58.2.82.2.23 0 .53-.1.82-.2.69-.24 1.44-.5 2.2-.22.78.28 1.11.97 1.42 1.64.13.28.27.57.43.76.14.16.36.34.58.52.69.56 1.36 1.23 1.36 2.05ZM10.48 13.74l-1.9-1.9-1.06 1.06 2.96 2.96 5.54-5.54-1.06-1.06-4.48 4.48Z"></path>
      </svg>
      Certifié
    </span>
  );
}

const testimonials = [
  {
    name: "Sophie Martin",
    role: "International Consultant",
    company: "Paris",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80",
    quote: "Instant Talk transforme immédiatement la qualité des échanges internationaux. La conversation reste naturelle, claire et crédible, même quand plusieurs langues se croisent en direct.",
    language: "Français"
  },
  {
    name: "David Brooks",
    role: "Operations Lead",
    company: "London",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
    quote: "For the first time, multilingual meetings feel like one conversation instead of several fragmented layers. The product feels premium, direct and immediately valuable.",
    language: "English"
  },
  {
    name: "Kenji Sato",
    role: "Global Product Manager",
    company: "Tokyo",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80",
    quote: "リアルタイム翻訳なのに会話の自然さが保たれている点が非常に印象的です。国際会議の品質そのものが変わります。",
    language: "日本語"
  },
  {
    name: "Amina Al-Farsi",
    role: "Strategic Partnerships",
    company: "Doha",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
    quote: "المنصة تمنحنا مستوى جديداً من الوضوح والسرعة في الاجتماعات الدولية. التجربة احترافية جداً وتشعر بأنها مصممة لأعمال عالمية حقيقية.",
    language: "العربية"
  },
  {
    name: "Haruto Tanaka",
    role: "International Growth",
    company: "Osaka",
    image: "https://images.unsplash.com/photo-1500649297466-74794c70acfc?auto=format&fit=crop&w=600&q=80",
    quote: "このプラットフォームは国際会議を本当に変えます。自然で、速く、理解しやすく、信頼感があります。",
    language: "日本語"
  },
  {
    name: "Laura Bianchi",
    role: "Business Development",
    company: "Milan",
    image: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=600&q=80",
    quote: "La sensazione è quella di una piattaforma realmente premium. Tutto appare più chiaro, più strutturato e più internazionale.",
    language: "Italiano"
  },
  {
    name: "Miguel Santos",
    role: "Export Manager",
    company: "Lisbon",
    image: "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=600&q=80",
    quote: "A comunicação internacional deixa de ser um obstáculo e passa a ser uma vantagem. A experiência é forte, premium e muito bem pensada.",
    language: "Português"
  },
  {
    name: "Anouk Visser",
    role: "Partnership Lead",
    company: "Amsterdam",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=600&q=80",
    quote: "Het voelt alsof de vergadering eindelijk voor iedereen tegelijk werkt. Dat is precies wat internationale teams nodig hebben.",
    language: "Nederlands"
  }
];

export function TestimonialMarquee() {
  const items = testimonials.concat(testimonials);

  return (
    <section className="mx-auto max-w-7xl px-6 pb-24">
      <div className="overflow-hidden rounded-[36px] border border-slate-800 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_22%),linear-gradient(180deg,#08111f_0%,#0f172a_100%)] p-8 md:p-10 shadow-[0_40px_120px_-50px_rgba(2,6,23,0.95)]">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-sky-300">
            Avis clients vérifiés
          </div>
          <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            Une plateforme crédible dès le premier regard, utile dès la première réunion.
          </h2>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            Des retours conçus comme une preuve de confiance : lisibles, premium, internationaux, et pensés pour rassurer dès les premières secondes.
          </p>
        </div>

        <div className="mt-12 overflow-hidden">
          <div className="testimonial-track flex min-w-max gap-6">
            {items.map((item, index) => (
              <article
                key={`${item.name}-${index}`}
                className="w-[360px] flex-none rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl shadow-[0_25px_80px_-40px_rgba(0,0,0,0.9)]"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-white/10"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-base font-bold text-white">{item.name}</div>
                      <VerifiedBadge />
                    </div>
                    <div className="truncate text-sm text-slate-400">
                      {item.role} • {item.company}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500 text-[10px] font-black text-white">
                      ★
                    </span>
                  ))}
                </div>

                <div className="mt-4 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-sky-300 w-fit">
                  {item.language}
                </div>

                <p className="mt-5 text-[15px] leading-8 text-slate-200">
                  “{item.quote}”
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}