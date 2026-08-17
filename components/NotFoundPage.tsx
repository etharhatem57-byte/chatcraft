"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useTranslation } from "@/components/providers/LanguageProvider";

export function NotFoundPage() {
  const { t } = useTranslation();
  return <main className="grid min-h-screen place-items-center bg-[#FCFBFB] p-6 text-center"><div><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-blush-100 text-blush-600"><Sparkles className="size-6" /></span><h1 className="mt-5 text-2xl font-semibold text-ink">{t("notFound.title")}</h1><p className="mt-2 text-sm text-muted">{t("notFound.description")}</p><Link href="/" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-blush-500 px-4 text-sm font-medium text-white">{t("notFound.home")}</Link></div></main>;
}
