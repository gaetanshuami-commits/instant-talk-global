"use client";

import React, { FormEvent, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Building2, Handshake, GraduationCap, MessageSquare } from "lucide-react";

const contactReasons: { icon: React.FC; label: string }[] = [
  { icon: () => <Building2 size={18} />, label: "Déploiement entreprise" },
  { icon: () => <Handshake size={18} />, label: "Partenariat" },
  { icon: () => <GraduationCap size={18} />, label: "Usage institutionnel" },
  { icon: () => <MessageSquare size={18} />, label: "Question produit" },
];

export default function ContactPage() {
  const { t } = useLanguage();
  const [status, setStatus]   = useState<"idle" | "success" | "error">("idle");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");
    const form = new FormData(e.currentTarget);
    const payload = {
      name:    String(form.get("name")    ?? ""),
      company: String(form.get("company") ?? ""),
      email:   String(form.get("email")   ?? ""),
      message: String(form.get("message") ?? ""),
    };
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      (e.currentTarget as HTMLFormElement).reset();
      setStatus("success");
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 pb-24 pt-14">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-start">

          {/* ── Left: context ── */}
          <div className="lg:pt-2">
            <div className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-violet-600">
              Contact
            </div>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-[#0a2540] md:text-5xl">
              {t("contact.title")}
            </h1>
            <p className="mt-4 text-base leading-8 text-slate-500">
              {t("contact.sub")}
            </p>

            {/* Reasons */}
            <div className="mt-8 grid grid-cols-2 gap-3">
              {contactReasons.map((r) => (
                <div
                  key={r.label}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm"
                >
                  <span className="text-slate-500"><r.icon /></span>
                  <span className="text-sm font-medium text-slate-700">{r.label}</span>
                </div>
              ))}
            </div>

            {/* Info block */}
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">
                Temps de réponse garanti
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { label: "Entreprises & institutions", value: "< 4 heures" },
                  { label: "Partenariats", value: "< 24 heures" },
                  { label: "Questions produit", value: "< 48 heures" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="font-semibold text-[#0a2540]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Back to pricing */}
            <div className="mt-6">
              <Link href="/pricing" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#635bff] hover:underline">
                ← Voir les offres
              </Link>
            </div>
          </div>

          {/* ── Right: form ── */}
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_25px_60px_-30px_rgba(10,37,64,0.16)] md:p-10">
            {status === "success" ? (
              <div className="py-10 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8 text-emerald-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <h2 className="text-2xl font-extrabold text-[#0a2540]">{t("contact.direct")}</h2>
                <p className="mt-3 text-slate-500">{t("contact.success")}</p>
                <button
                  onClick={() => setStatus("idle")}
                  className="mt-6 text-sm font-semibold text-[#635bff] hover:underline"
                >
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label={t("contact.name")} name="name" required />
                  <Field label={t("contact.company")} name="company" />
                </div>
                <Field label={t("contact.email")} name="email" type="email" required />
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#0a2540]">
                    {t("contact.message")} <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    name="message"
                    rows={6}
                    required
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"
                    placeholder="Décrivez votre projet, vos besoins, votre équipe…"
                  />
                </div>

                {status === "error" && (
                  <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                    Erreur d'envoi. Veuillez réessayer ou écrire directement à contact@instant-talk.com
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0a2540] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#16324f] disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Envoi en cours…
                    </>
                  ) : (
                    t("contact.submit")
                  )}
                </button>

                <p className="text-center text-xs text-slate-400">
                  Réponse garantie sous 24h. Vos données sont protégées. Conforme RGPD.
                </p>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({
  label, name, type = "text", required,
}: {
  label: string; name: string; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[#0a2540]">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"
      />
    </div>
  );
}
