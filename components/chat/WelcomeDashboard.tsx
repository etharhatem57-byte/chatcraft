"use client";

import { ArrowUpRight, BrainCircuit, CalendarRange, Lightbulb, Sparkles } from "lucide-react";
import { useChatShell } from "@/components/chat/ChatShell";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/Button";

export function WelcomeDashboard({ name }: { name: string }) {
  const { t, language } = useTranslation();
  const { createNewChat } = useChatShell();
  const firstName = name.trim().split(/\s+/)[0];
  const cards = [
    { key: "chat.suggestion1", icon: CalendarRange },
    { key: "chat.suggestion2", icon: BrainCircuit },
    { key: "chat.suggestion3", icon: Lightbulb },
  ];

  return (
    <section className="scrollbar-soft h-full overflow-y-auto px-5 py-10 sm:px-8 lg:px-12 lg:py-16">
      <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-center">
        <span className="grid size-14 place-items-center rounded-[18px] border border-blush-200 bg-white text-blush-600 shadow-soft"><Sparkles className="size-6" /></span>
        <p className="mt-6 text-sm font-medium text-blush-700">{language === "ar" ? `مرحبًا، ${firstName}` : `Hello, ${firstName}`}</p>
        <h1 className="mt-2 text-balance text-3xl font-semibold tracking-[-0.035em] text-ink sm:text-4xl">{t("chat.welcome")}</h1>
        <p className="mt-3 text-base text-muted">{t("chat.welcomeSubtitle")}</p>

        <div className="mt-9 grid gap-3 sm:grid-cols-3">
          {cards.map(({ key, icon: Icon }) => {
            const prompt = t(key);
            return (
              <button key={key} onClick={() => void createNewChat(prompt)} className="group flex min-h-36 flex-col rounded-[18px] border border-blush-100 bg-white/70 p-4 text-start shadow-soft transition duration-200 hover:-translate-y-1 hover:border-blush-300 hover:bg-white hover:shadow-lift">
                <span className="grid size-9 place-items-center rounded-xl bg-blush-100 text-blush-700"><Icon className="size-4" /></span>
                <span className="mt-4 flex-1 text-sm leading-6 text-muted group-hover:text-ink">{prompt}</span>
                <ArrowUpRight className="mt-2 size-4 text-blush-500 opacity-60" />
              </button>
            );
          })}
        </div>

        <Button className="mt-7 self-start" onClick={() => void createNewChat()}>{t("chat.newChat")}</Button>
      </div>
    </section>
  );
}
