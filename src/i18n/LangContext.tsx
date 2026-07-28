import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { translations, type Lang, type TranslationKey } from "./translations";

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: TranslationKey;
}

const LangContext = createContext<LangContextValue | undefined>(undefined);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("saalim-lang") as Lang | null;
    if (saved === "fr" || saved === "en") setLangState(saved);
    else {
      const browser = window.navigator.language.toLowerCase().startsWith("en") ? "en" : "fr";
      setLangState(browser as Lang);
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") window.localStorage.setItem("saalim-lang", l);
  };

  const value: LangContextValue = { lang, setLang, t: translations[lang] };
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}

// Simple Gregorian → Hijri approximation (good enough for display).
// For production-grade conversion, replace with a proper library.
export function toHijri(date: Date): string {
  const jd = Math.floor((date.getTime() / 86400000) + 2440587.5);
  const l1 = jd - 1948440 + 10632;
  const n = Math.floor((l1 - 1) / 10631);
  const l2 = l1 - 10631 * n + 354;
  const j =
    Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
    Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * l3) / 709);
  const day = l3 - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  const monthsFr = ["Muḥarram","Ṣafar","Rabīʿ I","Rabīʿ II","Jumādā I","Jumādā II","Rajab","Shaʿbān","Ramaḍān","Shawwāl","Dhū al-Qaʿdah","Dhū al-Ḥijjah"];
  return `${day} ${monthsFr[month - 1] ?? ""} ${year} AH`;
}
