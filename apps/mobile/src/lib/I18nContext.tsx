import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { type LangCode, t as translate, LANGUAGES } from "./i18n";

const LANG_KEY = "itg_lang";

type I18nContextType = {
  lang: LangCode;
  setLang: (l: LangCode) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextType>({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("en");

  useEffect(() => {
    SecureStore.getItemAsync(LANG_KEY).then((v) => {
      if (v) setLangState(v as LangCode);
    });
  }, []);

  const setLang = async (l: LangCode) => {
    setLangState(l);
    await SecureStore.setItemAsync(LANG_KEY, l);
  };

  const t = (key: string) => translate(lang, key);

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export { LANGUAGES };
export type { LangCode };
