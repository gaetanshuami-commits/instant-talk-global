export const LANGUAGES = [
  { code: "FR", label: "Francais" },
  { code: "EN", label: "English" },
  { code: "DE", label: "Deutsch" },
  { code: "ES", label: "Espanol" },
  { code: "IT", label: "Italiano" },
  { code: "NL", label: "Nederlands" },
  { code: "PT-PT", label: "Portugues" },
  { code: "JA", label: "Japanese" },
  { code: "ZH", label: "Chinese" },
  { code: "AR", label: "Arabic" }
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];
