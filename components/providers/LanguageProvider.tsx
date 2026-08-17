"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import ar from "@/locales/ar.json";
import en from "@/locales/en.json";
import type { Language } from "@/types";

const dictionaries = { en, ar } as const;

interface LanguageContextValue {
  language: Language;
  direction: "ltr" | "rtl";
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function lookup(dictionary: unknown, key: string): string {
  const value = key.split(".").reduce<unknown>((current, part) => {
    if (current && typeof current === "object" && part in current) {
      return (current as Record<string, unknown>)[part];
    }
    return undefined;
  }, dictionary);
  return typeof value === "string" ? value : key;
}

export function LanguageProvider({ initialLanguage, children }: { initialLanguage: Language; children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);

  const applyLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    document.documentElement.lang = next;
    document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
    document.cookie = `chatcraft_language=${next}; path=/; max-age=31536000; samesite=lax`;
    localStorage.setItem("chatcraft_language", next);
  }, []);

  const setLanguage = useCallback((next: Language) => {
    applyLanguage(next);
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => data?.user && fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.user.name, language: next }),
      }))
      .catch(() => undefined);
  }, [applyLanguage]);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    direction: language === "ar" ? "rtl" : "ltr",
    setLanguage,
    toggleLanguage: () => setLanguage(language === "en" ? "ar" : "en"),
    t: (key: string) => lookup(dictionaries[language], key),
  }), [language, setLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useTranslation must be used inside LanguageProvider");
  return context;
}
