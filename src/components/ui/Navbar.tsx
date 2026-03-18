"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage, LanguageSelector } from "@/lib/i18n/LanguageContext";

export function Navbar() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <Link href="/" className="text-xl font-bold text-slate-900">InstantTalk</Link>
        <div className="hidden md:flex space-x-8 text-sm font-medium text-slate-500">
          <Link href="/pricing" className="hover:text-slate-900">Tarifs</Link>
          <Link href="/contact" className="hover:text-slate-900">Contact</Link>
        </div>
        <div className="flex items-center space-x-5">
          <LanguageSelector />
          <button onClick={() => router.push(`/room/${Math.random().toString(36).substring(2, 12)}`)} className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg">
            Créer une réunion
          </button>
        </div>
      </div>
    </nav>
  );
}