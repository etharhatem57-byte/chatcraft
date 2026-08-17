"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, LogOut, MessageSquareText, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Input } from "@/components/ui/Input";
import type { Language, PublicUser } from "@/types";

export function ProfilePage({ user, totalChats, demo }: { user: PublicUser; totalChats: number; demo: boolean }) {
  const { t, language, setLanguage, direction } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [preferredLanguage, setPreferredLanguage] = useState<Language>(user.language);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const locale = language === "ar" ? "ar-SA" : "en-US";
  const joinDate = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(new Date(user.createdAt));

  async function save(event: FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2) return setError(t("auth.errors.required"));
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), language: preferredLanguage }),
      });
      if (!response.ok) throw new Error();
      setLanguage(preferredLanguage);
      showToast(t("profile.saved"));
      router.refresh();
    } catch {
      setError(t("profile.error"));
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FCFBFB]">
      <div className="pointer-events-none absolute -start-28 top-24 size-80 rounded-full bg-blush-100/65 blur-3xl" />
      <header className="relative z-10 border-b border-blush-100 bg-white/65 backdrop-blur-md">
        <div className="mx-auto flex h-18 min-h-[72px] max-w-6xl items-center justify-between px-5 sm:px-8">
          <Logo href="/chat" />
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact className="sm:hidden" />
            <LanguageSwitcher className="hidden sm:inline-flex" />
            <Button variant="ghost" size="icon" onClick={logout} aria-label={t("nav.logout")}><LogOut className="size-4" /></Button>
          </div>
        </div>
      </header>

      <div className="relative z-[1] mx-auto max-w-5xl px-5 py-9 sm:px-8 sm:py-12">
        <Link href="/chat" className="inline-flex min-h-10 items-center gap-2 rounded-xl text-sm font-medium text-muted transition hover:text-ink">
          <ArrowLeft className={`size-4 ${direction === "rtl" ? "rotate-180" : ""}`} /> {t("nav.backToChat")}
        </Link>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-ink">{t("profile.title")}</h1>
            <p className="mt-2 text-sm text-muted">{t("profile.subtitle")}</p>
          </div>
          {demo && <span className="self-start rounded-full border border-blush-200 bg-blush-50 px-3 py-1.5 text-xs font-medium text-blush-700">{t("common.demo")}</span>}
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_300px]">
          <Card className="p-5 sm:p-7">
            <div className="flex items-center gap-3 border-b border-blush-100 pb-5">
              <span className="grid size-11 place-items-center rounded-2xl bg-blush-100 text-blush-700"><UserRound className="size-5" /></span>
              <h2 className="font-semibold text-ink">{t("profile.personalInfo")}</h2>
            </div>
            <form onSubmit={save} className="mt-6 space-y-5">
              <Input label={t("profile.name")} value={name} onChange={(event) => setName(event.target.value)} maxLength={50} />
              <Input label={t("profile.email")} value={user.email} disabled dir="ltr" hint={t("profile.emailNote")} />
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-ink">{t("profile.language")}</legend>
                <div className="grid grid-cols-2 gap-3">
                  {(["en", "ar"] as const).map((item) => (
                    <button key={item} type="button" onClick={() => setPreferredLanguage(item)} className={`min-h-12 rounded-xl border px-4 text-sm font-medium transition ${preferredLanguage === item ? "border-blush-400 bg-blush-50 text-blush-700 ring-4 ring-blush-100" : "border-blush-200 bg-white text-muted hover:border-blush-300"}`}>
                      {t(item === "en" ? "profile.english" : "profile.arabic")}
                    </button>
                  ))}
                </div>
              </fieldset>
              {error && <ErrorMessage>{error}</ErrorMessage>}
              <Button type="submit" loading={loading}>{t(loading ? "profile.saving" : "profile.save")}</Button>
            </form>
          </Card>

          <div className="space-y-5">
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-ink">{t("profile.account")}</h2>
              <div className="mt-5 space-y-4">
                <Stat icon={<MessageSquareText className="size-4" />} label={t("profile.totalChats")} value={new Intl.NumberFormat(locale).format(totalChats)} />
                <Stat icon={<CalendarDays className="size-4" />} label={t("profile.memberSince")} value={joinDate} />
              </div>
            </Card>
            <Card className="flex items-center gap-3 p-5">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blush-100 text-lg font-semibold text-blush-700">{user.name.slice(0, 1).toLocaleUpperCase()}</span>
              <div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{user.name}</p><p className="mt-0.5 truncate text-xs text-muted">{user.email}</p></div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-blush-50 text-blush-700">{icon}</span><div><p className="text-xs text-muted">{label}</p><p className="mt-0.5 text-sm font-semibold text-ink">{value}</p></div></div>;
}
