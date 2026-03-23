"use client";

import { FormEvent, useState } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function ContactPage() {
  const { t } = useLanguage();
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") || ""),
      company: String(form.get("company") || ""),
      email: String(form.get("email") || ""),
      message: String(form.get("message") || "")
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("send_failed");
      }

      (e.currentTarget as HTMLFormElement).reset();
      setStatus(t("contact.success"));
    } catch {
      setStatus("Configuration email requise côté serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <Navbar />

      <main className="mx-auto max-w-3xl px-6 pb-24 pt-20">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_25px_60px_-30px_rgba(10,37,64,0.22)] md:p-10">
          <h1 className="text-5xl font-extrabold tracking-tight text-[#0A2540]">
            {t("contact.title")}
          </h1>

          <p className="mt-4 text-lg leading-8 text-[#425466]">
            {t("contact.sub")}
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#0A2540]">{t("contact.name")}</label>
              <input
                name="name"
                required
                className="w-full rounded-2xl border border-slate-200 px-4 py-4 text-base outline-none transition focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#0A2540]">{t("contact.company")}</label>
              <input
                name="company"
                className="w-full rounded-2xl border border-slate-200 px-4 py-4 text-base outline-none transition focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#0A2540]">{t("contact.email")}</label>
              <input
                name="email"
                type="email"
                required
                className="w-full rounded-2xl border border-slate-200 px-4 py-4 text-base outline-none transition focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#0A2540]">{t("contact.message")}</label>
              <textarea
                name="message"
                rows={7}
                required
                className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-4 text-base outline-none transition focus:border-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex rounded-full bg-[#0A2540] px-7 py-4 text-sm font-semibold text-white transition hover:bg-[#16324f] disabled:opacity-60"
            >
              {loading ? "Envoi..." : t("contact.submit")}
            </button>

            {status ? <p className="text-sm font-medium text-[#425466]">{status}</p> : null}
          </form>
        </div>
      </main>
    </div>
  );
}