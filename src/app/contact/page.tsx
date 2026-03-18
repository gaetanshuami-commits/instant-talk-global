"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const blockedDomains = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "live.com"
];

function isProfessionalEmail(email: string) {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return !blockedDomains.includes(domain);
}

export default function ContactPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [project, setProject] = useState("");
  const [status, setStatus] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email.includes("@")) {
      setStatus(t("contact.err_invalid"));
      return;
    }

    if (!isProfessionalEmail(email)) {
      setStatus(t("contact.err_free"));
      return;
    }

    setStatus("Demande prête à être envoyée.");
  }

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <Navbar />

      <main className="mx-auto max-w-3xl px-6 pb-24 pt-20">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-8">
          ← {t("contact.back")}
        </Link>

        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_25px_60px_-30px_rgba(10,37,64,0.22)] md:p-10">
          <h1 className="text-5xl font-extrabold tracking-tight text-[#0A2540]">
            {t("contact.title")}
          </h1>

          <p className="mt-4 text-lg leading-8 text-[#425466]">
            {t("contact.sub")}
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#0A2540]">
                {t("contact.email_label")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("contact.email_placeholder")}
                className="w-full rounded-2xl border border-slate-200 px-4 py-4 text-base outline-none transition focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#0A2540]">
                {t("contact.project_label")}
              </label>
              <textarea
                rows={7}
                value={project}
                onChange={(e) => setProject(e.target.value)}
                placeholder={t("contact.project_placeholder")}
                className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-4 text-base outline-none transition focus:border-slate-400"
              />
            </div>

            <button
              type="submit"
              className="inline-flex rounded-full bg-[#0A2540] px-7 py-4 text-sm font-semibold text-white transition hover:bg-[#16324f]"
            >
              {t("contact.submit")}
            </button>

            {status ? (
              <p className="text-sm font-medium text-[#425466]">{status}</p>
            ) : null}
          </form>
        </div>
      </main>
    </div>
  );
}