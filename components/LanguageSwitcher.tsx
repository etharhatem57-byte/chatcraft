"use client";

import { Languages } from "lucide-react";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { twMerge } from "tailwind-merge";

export function LanguageSwitcher({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { language, toggleLanguage, t } = useTranslation();
  const target = language === "en" ? t("common.arabic") : t("common.english");
  return (
    <button
      onClick={toggleLanguage}
      className={twMerge("inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-blush-200 bg-white/70 px-3 text-sm font-medium text-muted shadow-soft transition hover:border-blush-300 hover:bg-white hover:text-ink", className)}
      aria-label={language === "en" ? "Switch to Arabic" : "التبديل إلى الإنجليزية"}
    >
      <Languages className="size-4 text-blush-600" />
      {!compact && <span>{target}</span>}
    </button>
  );
}
