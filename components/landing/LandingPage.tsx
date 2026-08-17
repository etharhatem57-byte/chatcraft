"use client";

import Link from "next/link";
import { ArrowRight, BrainCircuit, Languages, MessageSquareText, Send, Sparkles } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";
import { useTranslation } from "@/components/providers/LanguageProvider";

export function LandingPage({ authenticated }: { authenticated: boolean }) {
  const { t, direction } = useTranslation();
  const primaryHref = authenticated ? "/chat" : "/register";
  const secondaryHref = authenticated ? "/profile" : "/login";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FCFBFB]">
      <div aria-hidden="true" className="pointer-events-none absolute -start-24 top-28 size-72 rounded-full bg-blush-100/75 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -end-20 top-[420px] size-80 rounded-full bg-[#FFE9F0]/60 blur-3xl" />

      <header className="relative z-10 mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <Logo />
        <nav className="flex items-center gap-2 sm:gap-3" aria-label="Main navigation">
          <LanguageSwitcher compact className="sm:hidden" />
          <LanguageSwitcher className="hidden sm:inline-flex" />
          <Link href={secondaryHref} className="hidden min-h-11 items-center rounded-xl px-3.5 text-sm font-medium text-muted transition hover:bg-white hover:text-ink sm:inline-flex">
            {authenticated ? t("nav.profile") : t("nav.login")}
          </Link>
          <Link href={primaryHref} className="inline-flex min-h-11 items-center rounded-xl border border-blush-400/60 bg-gradient-to-b from-blush-500 to-[#CE78A8] px-4 text-sm font-medium text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-glow">
            {authenticated ? t("chat.chats") : t("nav.register")}
          </Link>
        </nav>
      </header>

      <section className="relative z-[1] mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:px-10 lg:pb-32 lg:pt-24">
        <div className="max-w-2xl animate-slide-up text-center lg:text-start">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blush-200 bg-white/70 px-3 py-1.5 text-xs font-medium text-blush-700 shadow-soft backdrop-blur">
            <Sparkles className="size-3.5" />
            {t("landing.eyebrow")}
          </div>
          <h1 className="text-balance text-[42px] font-semibold leading-[1.12] tracking-[-0.045em] text-ink sm:text-6xl lg:text-[64px]">
            {t("landing.title")}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-balance text-base leading-7 text-muted sm:text-lg sm:leading-8 lg:mx-0">
            {t("landing.description")}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Link href={primaryHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-blush-400/70 bg-gradient-to-b from-blush-500 to-[#CC76A5] px-5 text-sm font-medium text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-glow">
              {t("landing.primary")}
              <ArrowRight className={`size-4 ${direction === "rtl" ? "rotate-180" : ""}`} />
            </Link>
            <Link href={secondaryHref} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-blush-200 bg-white/75 px-5 text-sm font-medium text-ink shadow-soft transition hover:border-blush-300 hover:bg-white">
              {t("landing.secondary")}
            </Link>
          </div>
          <p className="mt-5 flex items-center justify-center gap-2 text-xs text-[#929292] lg:justify-start">
            <span className="size-1.5 rounded-full bg-blush-400" />
            {t("brand.tagline")}
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-[650px] animate-fade-in">
          <div aria-hidden="true" className="absolute inset-x-12 -bottom-8 top-10 rounded-[40px] bg-blush-200/45 blur-3xl" />
          <div className="relative overflow-hidden rounded-[28px] border border-white bg-white/70 p-2.5 shadow-[0_20px_70px_rgba(204,118,165,0.13)] backdrop-blur-md sm:p-3">
            <div className="overflow-hidden rounded-[21px] border border-blush-200/80 bg-[#FFFDFD]">
              <div className="flex h-14 items-center justify-between border-b border-blush-100 bg-white/75 px-4 sm:px-5">
                <div className="flex items-center gap-2.5">
                  <div className="grid size-8 place-items-center rounded-xl bg-blush-100 text-blush-700"><Sparkles className="size-4" /></div>
                  <span className="text-sm font-semibold">ChatCraft</span>
                </div>
                <div className="flex gap-1.5"><span className="size-2 rounded-full bg-blush-300" /><span className="size-2 rounded-full bg-blush-200" /><span className="size-2 rounded-full bg-blush-100" /></div>
              </div>
              <div className="min-h-[410px] bg-gradient-to-b from-[#FFFBFC] to-white p-5 sm:min-h-[455px] sm:p-8">
                <div className="mx-auto max-w-md text-center">
                  <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-blush-200 bg-white text-blush-600 shadow-soft"><Sparkles className="size-5" /></span>
                  <p className="mt-4 text-sm font-medium text-blush-700">{t("landing.previewGreeting")}</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink sm:text-2xl">{t("landing.previewQuestion")}</h2>
                </div>
                <div className="mt-8 ms-auto max-w-[82%] rounded-2xl rounded-ee-md bg-blush-100 px-4 py-3 text-sm leading-6 text-ink">
                  {t("landing.previewPrompt")}
                </div>
                <div className="mt-4 flex items-start gap-3">
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl border border-blush-200 bg-white text-blush-600"><Sparkles className="size-3.5" /></span>
                  <div className="max-w-[82%] rounded-2xl rounded-es-md border border-blush-100 bg-white px-4 py-3 text-sm leading-6 text-muted shadow-soft">
                    {t("landing.previewAnswer")}
                  </div>
                </div>
                <div className="mt-8 flex min-h-14 items-center gap-3 rounded-2xl border border-blush-200 bg-white px-4 shadow-soft">
                  <span className="flex-1 text-sm text-[#AAA]">{t("chat.placeholder")}</span>
                  <span className="grid size-9 place-items-center rounded-xl bg-blush-500 text-white"><Send className="size-4" /></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-[1] border-y border-blush-100 bg-white/55">
        <div className="mx-auto grid max-w-7xl gap-5 px-5 py-16 sm:px-8 md:grid-cols-3 lg:px-10">
          <Feature icon={<Languages className="size-5" />} title={t("landing.feature1Title")} text={t("landing.feature1Text")} />
          <Feature icon={<MessageSquareText className="size-5" />} title={t("landing.feature2Title")} text={t("landing.feature2Text")} />
          <Feature icon={<BrainCircuit className="size-5" />} title={t("landing.feature3Title")} text={t("landing.feature3Text")} />
        </div>
      </section>

      <footer className="relative z-[1] mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 text-xs text-[#929292] sm:flex-row sm:px-8 lg:px-10">
        <Logo />
        <span>© {new Date().getFullYear()} ChatCraft</span>
      </footer>
    </main>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <article className="rounded-[20px] border border-blush-100 bg-white/70 p-6 transition duration-300 hover:-translate-y-1 hover:border-blush-200 hover:shadow-soft">
      <span className="grid size-11 place-items-center rounded-2xl bg-blush-100 text-blush-700">{icon}</span>
      <h3 className="mt-5 text-base font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
    </article>
  );
}
