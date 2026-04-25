type Section = {
  title: string;
  text: string[];
};

type LegalPageShellProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  sections: Section[];
};

export default function LegalPageShell({
  eyebrow,
  title,
  subtitle,
  sections,
}: LegalPageShellProps) {
  return (
    <main className="relative overflow-hidden bg-[#050816] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.16),transparent_32%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.14),transparent_28%),radial-gradient(circle_at_bottom,rgba(168,85,247,0.12),transparent_34%)]" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative mx-auto max-w-6xl px-6 py-24 sm:px-8 lg:px-10">
        <section className="mb-16 rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-12">
          <div className="mb-5 inline-flex rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-1.5 text-sm font-semibold tracking-wide text-violet-200">
            {eyebrow}
          </div>
          <h1 className="max-w-4xl text-4xl font-black tracking-[-0.04em] sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-white/72 sm:text-lg">
            {subtitle}
          </p>
        </section>

        <section className="grid gap-6">
          {sections.map((section, index) => (
            <article
              key={section.title}
              className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/8 to-white/5 p-7 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-violet-300/20 hover:shadow-[0_24px_70px_rgba(79,70,229,0.16)] sm:p-9"
            >
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-cyan-400/20 text-sm font-bold text-white/90">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <h2 className="text-2xl font-bold tracking-[-0.03em]">{section.title}</h2>
              </div>

              <div className="space-y-4">
                {section.text.map((paragraph) => (
                  <p key={paragraph} className="text-[15px] leading-8 text-white/72 sm:text-base">
                    {paragraph}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
