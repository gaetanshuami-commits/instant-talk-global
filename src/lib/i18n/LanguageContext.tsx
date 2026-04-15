"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { fr as frBase, en as enBase, LanguageCode } from "./translations-base";

const _langCache: Record<string, Record<string, unknown>> = {
  fr: frBase as Record<string, unknown>,
  en: enBase as Record<string, unknown>,
};
let _extLoaded = false;
let _extLoadPromise: Promise<void> | null = null;

// Subscribers notified when extended translations finish loading
const _extListeners: Set<() => void> = new Set();

function ensureExtended(): Promise<void> {
  if (_extLoaded) return Promise.resolve();
  if (_extLoadPromise) return _extLoadPromise;
  _extLoadPromise = import("./translations").then((m) => {
    Object.assign(_langCache, m.translations as Record<string, unknown>);
    _extLoaded = true;
    // Notify all mounted LanguageProviders so they re-render with correct translations
    _extListeners.forEach((fn) => fn());
    _extListeners.clear();
  });
  return _extLoadPromise;
}

const translations = new Proxy({} as Record<LanguageCode, typeof frBase>, {
  get(_, lang: string) {
    return (_langCache[lang] ?? _langCache.fr) as typeof frBase;
  },
  has(_, lang: string) {
    return lang in _langCache || ["es", "de", "it", "pt", "nl", "zh", "ja", "ar", "ko", "hi", "tr", "ru", "pl", "sv", "el", "cs", "ro", "hu", "sw", "th", "vi", "bg", "da", "fi", "sk", "no"].includes(lang);
  },
});

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
  { code: "ar", label: "العربية" },
  { code: "ko", label: "한국어" },
  { code: "hi", label: "हिन्दी" },
  { code: "tr", label: "Türkçe" },
  { code: "ru", label: "Русский" },
  { code: "pl", label: "Polski" },
  { code: "sv", label: "Svenska" },
  { code: "el", label: "Ελληνικά" },
  { code: "cs", label: "Čeština" },
  { code: "ro", label: "Română" },
  { code: "hu", label: "Magyar" },
  { code: "sw", label: "Kiswahili" },
  { code: "th", label: "ภาษาไทย" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "bg", label: "Български" },
  { code: "da", label: "Dansk" },
  { code: "fi", label: "Suomi" },
  { code: "sk", label: "Slovenčina" },
  { code: "no", label: "Norsk" },
] as const;

type ContextType = {
  lang: LanguageCode;
  setLang: (l: LanguageCode) => void;
  t: (path: string) => string;
};

const LanguageContext = createContext<ContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>(() => {
    if (typeof window === "undefined") return "fr";
    const saved = localStorage.getItem("itg_lang") as LanguageCode | null;
    return saved || "fr";
  });
  // Bumped when extended translations finish loading — forces re-evaluation of `t`
  const [extRev, setExtRev] = useState(0);

  useEffect(() => {
    if (lang === "fr" || lang === "en") return;
    if (_extLoaded) return;
    const bump = () => setExtRev((r) => r + 1);
    _extListeners.add(bump);
    void ensureExtended();
    return () => { _extListeners.delete(bump); };
  }, [lang]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((newLang: LanguageCode) => {
    setLangState(newLang);
    localStorage.setItem("itg_lang", newLang);
    if (newLang !== "fr" && newLang !== "en") {
      void ensureExtended();
    }
  }, []);

  const t = useCallback((path: string): string => {
    const keys = path.split(".");
    let current: unknown = translations[lang];
    let fallbackFr: unknown = translations.fr;
    let fallbackEn: unknown = translations.en;

    for (const key of keys) {
      current = typeof current === "object" && current !== null ? (current as Record<string, unknown>)[key] : undefined;
      fallbackFr = typeof fallbackFr === "object" && fallbackFr !== null ? (fallbackFr as Record<string, unknown>)[key] : undefined;
      fallbackEn = typeof fallbackEn === "object" && fallbackEn !== null ? (fallbackEn as Record<string, unknown>)[key] : undefined;
    }

    return String(current ?? fallbackFr ?? fallbackEn ?? path);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, extRev]);  // extRev forces re-evaluation when extended translations arrive

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("Missing LanguageProvider");
  return ctx;
}

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = languagesList.find((item) => item.code === lang);

  useEffect(() => {
    const handle = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label="Select language"
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
      >
        <span className="inline-flex h-5 w-7 items-center justify-center rounded bg-slate-100 text-[9px] font-bold tracking-wider text-slate-600">
          {(current?.code ?? lang).toUpperCase()}
        </span>
        {!compact && <span className="hidden sm:inline">{current?.label ?? lang.toUpperCase()}</span>}
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-[200] mt-2 max-h-72 w-52 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl">
          {languagesList.map((item) => (
            <button
              key={item.code}
              onClick={() => {
                setLang(item.code as LanguageCode);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition ${
                lang === item.code ? "bg-[#635bff] text-white font-semibold" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span
                className={`inline-flex h-4 w-7 items-center justify-center rounded text-[9px] font-bold tracking-wider ${
                  lang === item.code ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {item.code.toUpperCase()}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
