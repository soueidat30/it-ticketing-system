import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ar } from "../locales/ar";
import { fr } from "../locales/fr";

const TRANSLATIONS = { ar, fr };

export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
];

const RTL_LANGUAGES = ["ar"];

const getRoleLanguageKey = (role) => `language:${role}`;

const LanguageContext = createContext(null);

const getNested = (obj, path) =>
  path
    .split(".")
    .reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);

export function RoleLanguageProvider({ role, children }) {
  const [language, setLanguageState] = useState(() => {
    const roleLang = role ? localStorage.getItem(getRoleLanguageKey(role)) : null;
    return roleLang || "en";
  });

  const isRTL = RTL_LANGUAGES.includes(language);

  useEffect(() => {
    if (!role) return;

    localStorage.setItem(getRoleLanguageKey(role), language);

    document.documentElement.lang = language;
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
  }, [language, isRTL, role]);

  const setLanguage = (lang) => {
    if (lang === "en" || TRANSLATIONS[lang]) setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === "en" ? "ar" : prev === "ar" ? "fr" : "en"));
  };

  const t = useMemo(() => {
    return (key, fallback = key, vars = {}) => {
      let str;
      if (language === "en") {
        str = fallback;
      } else {
        str = getNested(TRANSLATIONS[language], key);
        if (str === undefined) str = fallback;
      }

      return Object.keys(vars).reduce(
        (acc, varKey) => acc.replace(`{{${varKey}}}`, vars[varKey]),
        str
      );
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={{ role, language, setLanguage, toggleLanguage, isRTL, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a RoleLanguageProvider");
  return ctx;
}