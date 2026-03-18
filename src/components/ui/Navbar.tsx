"use client";

import Link from "next/link";
import { LanguageSelector, useLanguage } from "@/lib/i18n/LanguageContext";

export function Navbar() {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-2xl font-extrabold tracking-tight text-slate-900">
          InstantTalk
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/pricing" className="text-sm font-medium text-slate-500 transition hover:text-slate-900">
            {t("nav.pricing")}
          </Link>
          <Link href="/contact" className="text-sm font-medium text-slate-500 transition hover:text-slate-900">
            {t("nav.contact")}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSelector />
          <Link
            href="/pricing"
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {t("nav.start")}
          </Link>
        </div>
      </div>
    </header>
  );
}