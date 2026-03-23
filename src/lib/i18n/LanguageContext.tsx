"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { translations, LanguageCode } from "./translations";

export const languagesList = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
  { code: "nl", label: "Nederlands" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
  { code: "ar", label: "العربية" }
];

type ContextType = {
  lang: LanguageCode;
  setLang: (l: LanguageCode) => void;
  t: (path: string) => string;
};

const LanguageContext = createContext<ContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>("fr");

  useEffect(() => {
    const saved = localStorage.getItem("itg_lang") as LanguageCode | null;
    if (saved && saved in translations) setLangState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = (newLang: LanguageCode) => {
    setLangState(newLang);
    localStorage.setItem("itg_lang", newLang);
  };

  const t = (path: string) => {
    const keys = path.split(".");
    let current: any = translations[lang];
    let fallbackFr: any = translations.fr;
    let fallbackEn: any = translations.en;

    for (const key of keys) {
      current = current?.[key];
      fallbackFr = fallbackFr?.[key];
      fallbackEn = fallbackEn?.[key];
    }

    return current ?? fallbackFr ?? fallbackEn ?? path;
  };

  const value = useMemo(() => ({ lang, setLang, t }), [lang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("Missing Provider");
  return ctx;
}

export function LanguageSelector() {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
      >
        {lang.toUpperCase()}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-3 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
          {languagesList.map((item) => (
            <button
              key={item.code}
              onClick={() => {
                setLang(item.code as LanguageCode);
                setOpen(false);
              }}
              className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                lang === item.code ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}