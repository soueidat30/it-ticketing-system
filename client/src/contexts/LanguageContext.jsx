import { createContext, useContext, useState, useEffect } from "react";
import { en } from "../locales/en";
import { ar } from "../locales/ar";
import { fr } from "../locales/fr";

const LOCALES = { en, ar, fr };

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "EN", name: "English",  dir: "ltr", flag: "🇬🇧" },
  { code: "ar", label: "عر", name: "العربية",  dir: "rtl", flag: "🇱🇧" },
  { code: "fr", label: "FR", name: "Français", dir: "ltr", flag: "🇫🇷" },
];

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("lang") || "en";
  });

  useEffect(() => {
    const info = SUPPORTED_LANGUAGES.find(l => l.code === lang) ?? SUPPORTED_LANGUAGES[0];
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", info.dir);
    localStorage.setItem("lang", lang);
  }, [lang]);

  const t = (key) => {
    const dict = LOCALES[lang] ?? LOCALES.en;
    const parts = key.split(".");
    let val = dict;
    for (const p of parts) {
      if (val == null) break;
      val = val[p];
    }
    if (val != null) return val;

    let fallback = LOCALES.en;
    for (const p of parts) {
      if (fallback == null) break;
      fallback = fallback[p];
    }
    return fallback ?? key;
  };

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === lang) ?? SUPPORTED_LANGUAGES[0];
  const isRTL = currentLang.dir === "rtl";

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRTL, currentLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
};