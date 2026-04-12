"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 border border-sky-400/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-sky-400">
      <svg viewBox="0 0 24 24" className="h-3 w-3 fill-sky-400" aria-hidden="true">
        <path d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-.967 3.372 3.745 3.745 0 01-3.372.967A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 01-3.372-.967 3.745 3.745 0 01-.967-3.372A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 01.967-3.372 3.745 3.745 0 013.372-.967A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 013.372.967 3.745 3.745 0 01.967 3.372A3.745 3.745 0 0121 12z" strokeWidth="1.5" />
      </svg>
      Certifié
    </span>
  );
}

function Stars() {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map((i) => (
        <svg key={i} viewBox="0 0 20 20" fill="#f59e0b" className="h-4 w-4">
          <path d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" />
        </svg>
      ))}
    </div>
  );
}

const row1 = [
  {
    name: "Sophie Martin",
    role: "International Consultant",
    city: "Paris, France",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    quote: "Instant Talk transforme immédiatement la qualité des échanges internationaux. La conversation reste naturelle, claire et crédible, même quand plusieurs langues se croisent en direct.",
    lang: "🇫🇷 Français"
  },
  {
    name: "David Brooks",
    role: "Operations Lead",
    city: "London, UK",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    quote: "For the first time, multilingual meetings feel like one conversation instead of several fragmented layers. The product feels premium, direct and immediately valuable.",
    lang: "🇬🇧 English"
  },
  {
    name: "Kenji Sato",
    role: "Global Product Manager",
    city: "Tokyo, Japan",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80",
    quote: "リアルタイム翻訳なのに会話の自然さが保たれている点が非常に印象的です。国際会議の品質そのものが変わります。",
    lang: "🇯🇵 日本語"
  },
  {
    name: "Amina Al-Farsi",
    role: "Strategic Partnerships",
    city: "Doha, Qatar",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    quote: "المنصة تمنحنا مستوى جديداً من الوضوح والسرعة في الاجتماعات الدولية. التجربة احترافية جداً.",
    lang: "🇸🇦 العربية"
  },
  {
    name: "Laura Bianchi",
    role: "Business Development",
    city: "Milan, Italy",
    image: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=200&q=80",
    quote: "La sensazione è quella di una piattaforma realmente premium. Tutto appare più chiaro, strutturato e internazionale.",
    lang: "🇮🇹 Italiano"
  },
  {
    name: "Carlos Mendez",
    role: "CEO",
    city: "Madrid, España",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80",
    quote: "Nunca pensé que una reunión con 6 idiomas distintos pudiera ser tan fluida. Instant Talk es realmente el futuro de la comunicación global.",
    lang: "🇪🇸 Español"
  },
];

const row2 = [
  {
    name: "Miguel Santos",
    role: "Export Manager",
    city: "Lisbon, Portugal",
    image: "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=200&q=80",
    quote: "A comunicação internacional deixa de ser um obstáculo e passa a ser uma vantagem. A experiência é forte, premium e muito bem pensada.",
    lang: "🇧🇷 Português"
  },
  {
    name: "Anouk Visser",
    role: "Partnership Lead",
    city: "Amsterdam, NL",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80",
    quote: "Het voelt alsof de vergadering eindelijk voor iedereen tegelijk werkt. Dat is precies wat internationale teams nodig hebben.",
    lang: "🇳🇱 Nederlands"
  },
  {
    name: "Amara Diallo",
    role: "Regional Director",
    city: "Nairobi, Kenya",
    image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=200&q=80",
    quote: "Instant Talk imefanya vikao vyetu vya kimataifa kuwa rahisi zaidi. Kila mtu anaweza kuzungumza lugha yake na kuelewana bila matatizo.",
    lang: "🇰🇪 Kiswahili"
  },
  {
    name: "Markus Weber",
    role: "CTO",
    city: "Berlin, Deutschland",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    quote: "Die Echtzeit-Übersetzung ist beeindruckend präzise. Endlich können wir globale Meetings ohne Sprachbarrieren durchführen.",
    lang: "🇩🇪 Deutsch"
  },
  {
    name: "Park Ji-Yeon",
    role: "Innovation Lead",
    city: "Seoul, Korea",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=200&q=80",
    quote: "국제 회의에서 언어 장벽이 사라졌습니다. 실시간 번역 품질이 놀라울 정도로 자연스럽습니다.",
    lang: "🇰🇷 한국어"
  },
  {
    name: "Priya Sharma",
    role: "Global Operations",
    city: "Mumbai, India",
    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=200&q=80",
    quote: "Instant Talk ने हमारी अंतर्राष्ट्रीय बैठकों को पूरी तरह बदल दिया है। अब भाषा कोई बाधा नहीं है।",
    lang: "🇮🇳 हिन्दी"
  },
];

function TestimonialCard({ item }: { item: typeof row1[0] }) {
  return (
    <article className="w-[340px] flex-none rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-sm transition hover:bg-white/[0.08]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src={item.image}
            alt={item.name}
            className="h-12 w-12 rounded-full object-cover ring-2 ring-white/10"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white">{item.name}</span>
              <VerifiedBadge />
            </div>
            <div className="mt-0.5 text-xs text-slate-400">{item.role}, {item.city}</div>
          </div>
        </div>
      </div>

      <Stars />

      <span className="mt-2 inline-block rounded-full bg-white/8 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-sky-300">
        {item.lang}
      </span>

      <p className="mt-3 text-[13.5px] leading-7 text-slate-300">
        "{item.quote}"
      </p>
    </article>
  );
}

export function TestimonialMarquee() {
  const { t } = useLanguage();
  const doubled1 = [...row1, ...row1];
  const doubled2 = [...row2, ...row2];

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top,#0d1b3e_0%,#060d1f_50%,#020509_100%)] py-20">
      {/* Glow orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-[#635bff]/10 blur-[100px]" />
        <div className="absolute right-1/4 bottom-0 h-72 w-72 rounded-full bg-[#00b4d8]/8 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="text-center">
          <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-sky-400">
            {t("testimonials.badge")}
          </span>
          <h2 className="mt-5 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            {t("testimonials.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-400">
            {t("testimonials.text")}
          </p>
        </div>

        {/* Row 1 */}
        <div className="mt-12 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="testimonial-track gap-5">
            {doubled1.map((item, i) => (
              <TestimonialCard key={`r1-${i}`} item={item} />
            ))}
          </div>
        </div>

        {/* Row 2 */}
        <div className="mt-5 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="testimonial-track-r gap-5">
            {doubled2.map((item, i) => (
              <TestimonialCard key={`r2-${i}`} item={item} />
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { n: "10 000+", labelKey: "stats.meetings" },
            { n: "26",      labelKey: "stats.languages" },
            { n: "98%",     labelKey: "stats.satisfaction" },
            { n: "< 400ms", labelKey: "stats.latency" },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl border border-white/8 bg-white/4 p-5 text-center">
              <div className="text-3xl font-extrabold text-white">{s.n}</div>
              <div className="mt-1.5 text-xs font-medium text-slate-400">{t(s.labelKey)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
