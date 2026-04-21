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
  { code: "fr", label: "Fran\u00E7ais" },
  { code: "en", label: "English" },
  { code: "es", label: "Espa\u00F1ol" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Portugu\u00EAs" },
  { code: "nl", label: "Nederlands" },
  { code: "zh", label: "\u4E2D\u6587" },
  { code: "ja", label: "\u65E5\u672C\u8A9E" },
  { code: "ar", label: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629" },
  { code: "ko", label: "\uD55C\uAD6D\uC5B4" },
  { code: "hi", label: "\u0939\u093F\u0928\u094D\u0926\u0940" },
  { code: "tr", label: "T\u00FCrk\u00E7e" },
  { code: "ru", label: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439" },
  { code: "pl", label: "Polski" },
  { code: "sv", label: "Svenska" },
  { code: "el", label: "\u0395\u03BB\u03BB\u03B7\u03BD\u03B9\u03BA\u03AC" },
  { code: "cs", label: "\u010Ce\u0161tina" },
  { code: "ro", label: "Rom\u00E2n\u0103" },
  { code: "hu", label: "Magyar" },
  { code: "sw", label: "Kiswahili" },
  { code: "th", label: "\u0E20\u0E32\u0E29\u0E32\u0E44\u0E17\u0E22" },
  { code: "vi", label: "Ti\u1EBFng Vi\u1EC7t" },
  { code: "bg", label: "\u0411\u044A\u043B\u0433\u0430\u0440\u0441\u043A\u0438" },
  { code: "da", label: "Dansk" },
  { code: "fi", label: "Suomi" },
  { code: "sk", label: "Sloven\u010Dina" },
  { code: "no", label: "Norsk" },
] as const;

type ContextType = {
  lang: LanguageCode;
  setLang: (l: LanguageCode) => void;
  t: (path: string) => string;
};

const LanguageContext = createContext<ContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Always start with "fr" to match SSR — localStorage is read after mount in useEffect
  const [lang, setLangState] = useState<LanguageCode>("fr");
  // Bumped when extended translations finish loading — forces re-evaluation of `t`
  const [extRev, setExtRev] = useState(0);

  // Restore saved language after mount (avoids SSR hydration mismatch #418)
  useEffect(() => {
    const saved = localStorage.getItem("itg_lang") as LanguageCode | null;
    if (saved && saved !== "fr") setLangState(saved);
  }, []);

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

export function LanguageSelector({ compact = false, dark = false }: { compact?: boolean; dark?: boolean }) {
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

  const btnCls = dark
    ? "flex items-center gap-2 rounded-full border border-white/15 bg-white/08 px-3 py-1.5 text-sm font-medium text-white/80 transition hover:bg-white/12 hover:border-white/25"
    : "flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50";

  const codeCls = dark
    ? "inline-flex h-5 w-7 items-center justify-center rounded bg-white/15 text-[9px] font-bold tracking-wider text-white/70"
    : "inline-flex h-5 w-7 items-center justify-center rounded bg-slate-100 text-[9px] font-bold tracking-wider text-slate-600";

  const dropdownCls = dark
    ? "absolute right-0 z-[200] mt-2 max-h-72 w-52 overflow-y-auto rounded-2xl border border-white/10 bg-[#07101e] p-1.5 shadow-2xl backdrop-blur-xl"
    : "absolute right-0 z-[200] mt-2 max-h-72 w-52 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl";

  const itemBaseCls = dark ? "text-white/70 hover:bg-white/08" : "text-slate-700 hover:bg-slate-100";
  const itemCodeCls = dark ? "bg-white/10 text-white/50" : "bg-slate-100 text-slate-500";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label="Select language"
        className={btnCls}
      >
        <span className={codeCls}>
          {(current?.code ?? lang).toUpperCase()}
        </span>
        {!compact && <span className="hidden sm:inline">{current?.label ?? lang.toUpperCase()}</span>}
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-3.5 w-3.5 ${dark ? "text-white/40" : "text-slate-400"} transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className={dropdownCls}>
          {languagesList.map((item) => (
            <button
              key={item.code}
              onClick={() => {
                setLang(item.code as LanguageCode);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition ${
                lang === item.code ? "bg-[#635bff] text-white font-semibold" : itemBaseCls
              }`}
            >
              <span
                className={`inline-flex h-4 w-7 items-center justify-center rounded text-[9px] font-bold tracking-wider ${
                  lang === item.code ? "bg-white/20 text-white" : itemCodeCls
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
