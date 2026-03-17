"use client";

import React from "react";

const languages = [
  { code: "en", label: "English" }, { code: "fr", label: "Français" }, { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" }, { code: "it", label: "Italiano" }, { code: "pt", label: "Português" },
  { code: "nl", label: "Nederlands" }, { code: "ar", label: "العربية" }, { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" }, { code: "ko", label: "한국어" }, { code: "tr", label: "Türkçe" },
  { code: "hi", label: "हिन्दी" }, { code: "pl", label: "Polski" }, { code: "ru", label: "Русский" },
  { code: "uk", label: "Українська" }, { code: "el", label: "Ελληνικά" }, { code: "sv", label: "Svenska" },
  { code: "no", label: "Norsk" }, { code: "da", label: "Dansk" }, { code: "fi", label: "Suomi" },
  { code: "cs", label: "Čeština" }, { code: "sk", label: "Slovenčina" }, { code: "ro", label: "Română" },
  { code: "bg", label: "Български" }, { code: "id", label: "Bahasa Indonesia" }, { code: "vi", label: "Tiếng Việt" },
  { code: "th", label: "ไทย" }, { code: "ms", label: "Bahasa Melayu" }, { code: "he", label: "עברית" }
];

export function LanguageSelector() {
  return (
    <div className="relative inline-block text-left">
      <select className="block w-full pl-3 pr-8 py-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition cursor-pointer hover:bg-gray-100">
        <option value="" disabled>🌐 Langue</option>
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>{lang.label}</option>
        ))}
      </select>
    </div>
  );
}