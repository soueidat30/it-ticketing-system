import { createContext, useContext, useEffect, useState } from "react";
import en from "../translations/en.json";
import ar from "../translations/ar.json";

const TRANSLATIONS = { en, ar };

// Languages that should flip the whole layout to right-to-left.
export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
];

// Languages that should flip the whole layout to right-to-left.
const RTL_LANGUAGES = SUPPORTED_LANGUAGES.filter((l) => l.code === "ar").map((l) => l.code);

const ROLE_LANGUAGE_KEY = (role) => `language:${role}`;
const GLOBAL_LANGUAGE_KEY = "language";


const LanguageContext = createContext(null);

const getNested = (obj, path) =>
  path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(
    () => localStorage.getItem("language") || "en"
  );

  const isRTL = RTL_LANGUAGES.includes(language);

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.lang = language;
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
  }, [language, isRTL]);

  const setLanguage = (lang) => {
    if (TRANSLATIONS[lang]) setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === "en" ? "ar" : "en"));
  };

  // t("agent.dashboard.title") -> looks up nested key in the active
  // translation file. Falls back to English, then to the key itself,
  // so a missing translation never crashes the UI — it just shows the
  // raw key, which is easy to spot while filling translations in.
  const t = (key, vars = {}) => {
    let str = getNested(TRANSLATIONS[language], key);
    if (str === undefined) str = getNested(TRANSLATIONS.en, key);
    if (str === undefined) return key;

    return Object.keys(vars).reduce(
      (acc, varKey) => acc.replace(`{{${varKey}}}`, vars[varKey]),
      str
    );
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, isRTL, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}