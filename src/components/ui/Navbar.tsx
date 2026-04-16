"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { LanguageSelector, useLanguage } from "@/lib/i18n/LanguageContext";

export function Navbar() {
  const { t } = useLanguage();
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl"
          : "bg-white/70 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#635bff] shadow-[0_4px_14px_-4px_rgba(99,91,255,0.55)] transition group-hover:scale-105">
            <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
              <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5" />
              <path d="M8 12h8M12 8v8" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-[17px] font-extrabold tracking-tight text-[#0a2540]">
            Instant<span className="text-[#635bff]">Talk</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {[
            { href: "/pricing",              label: t("nav.pricing") },
            { href: "/dashboard/meetings",   label: t("nav.book")    },
            { href: "/contact",              label: t("nav.contact") },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-xl px-3.5 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <LanguageSelector />

          <Link
            href="/pricing"
            className="hidden items-center gap-1.5 rounded-full bg-[#0a2540] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_-4px_rgba(10,37,64,0.4)] transition hover:bg-[#16324f] hover:-translate-y-px sm:flex"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 opacity-75">
              <path d="M10 3a.75.75 0 0 1 .75.75v2.5h2.5a.75.75 0 0 1 0 1.5h-2.5v2.5a.75.75 0 0 1-1.5 0v-2.5H6.75a.75.75 0 0 1 0-1.5h2.5v-2.5A.75.75 0 0 1 10 3ZM10 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
            </svg>
            {t("nav.start")}
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 lg:hidden"
            aria-label="Menu"
          >
            {mobileOpen ? (
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5">
                <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white px-5 pb-4 pt-2 lg:hidden">
          <div className="flex flex-col gap-1">
            {[
              { href: "/pricing",            label: t("nav.pricing") },
              { href: "/dashboard/meetings", label: t("nav.book")    },
              { href: "/contact",            label: t("nav.contact") },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              >
                {label}
              </Link>
            ))}
            <Link
              href="/pricing"
              onClick={() => setMobileOpen(false)}
              className="mt-2 flex items-center justify-center rounded-full bg-[#0a2540] px-4 py-3 text-sm font-semibold text-white"
            >
              {t("nav.start")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
