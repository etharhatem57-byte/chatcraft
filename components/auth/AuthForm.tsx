"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Input } from "@/components/ui/Input";

export function AuthForm({ mode }: { mode: "login" | "register"; demo?: boolean }) {
  const { t, language } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";

  function validate() {
    const trimmedEmail = email.trim();
    if ((!isLogin && !name.trim()) || !trimmedEmail || !password || (!isLogin && !confirmPassword)) {
      return t("auth.errors.required");
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      return t("auth.errors.email");
    }
    if (!isLogin && password.length < 8) {
      return t("auth.errors.passwordLength");
    }
    if (!isLogin && password !== confirmPassword) {
      return t("auth.errors.passwordMismatch");
    }
    return "";
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const validationError = validate();
    if (validationError) return setError(validationError);
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isLogin
            ? { email: email.trim(), password }
            : { name: name.trim(), email: email.trim(), password, language }
        ),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.code === "INVALID_CREDENTIALS") setError(t("auth.errors.invalidCredentials"));
        else if (data.code === "EMAIL_EXISTS") setError(t("auth.errors.emailExists"));
        else if (data.code === "RATE_LIMITED") setError(t("common.error"));
        else setError(data.error || t("auth.errors.generic"));
        return;
      }
      const requested = searchParams.get("next");
      router.push(requested?.startsWith("/") && !requested.startsWith("//") ? requested : "/chat");
      router.refresh();
    } catch {
      setError(t("auth.errors.generic"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FCFBFB]">
      <div className="pointer-events-none absolute -start-32 -top-20 size-96 rounded-full bg-blush-100/80 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -end-20 size-[420px] rounded-full bg-[#FFEAF1]/80 blur-3xl" />
      <header className="relative z-10 mx-auto flex h-20 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Logo />
        <LanguageSwitcher />
      </header>

      <div className="relative z-[1] mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-5 sm:px-8 lg:min-h-[calc(100vh-80px)] lg:grid-cols-[0.9fr_1.1fr] lg:pb-24">
        <section className="hidden max-w-md lg:block">
          <span className="grid size-14 place-items-center rounded-[18px] border border-blush-200 bg-white/75 text-blush-600 shadow-soft backdrop-blur">
            <Sparkles className="size-6" />
          </span>
          <h1 className="mt-7 text-4xl font-semibold leading-tight tracking-[-0.035em] text-ink">
            {t("brand.tagline")}
          </h1>
          <p className="mt-4 text-base leading-7 text-muted">{t("landing.description")}</p>
          <div className="mt-8 flex items-center gap-3 text-sm text-muted">
            <span className="grid size-9 place-items-center rounded-xl bg-blush-100 text-blush-700">
              <ShieldCheck className="size-4" />
            </span>
            <span>{language === "ar" ? "خصوصية ووضوح وتجربة هادئة" : "Private, clear, and thoughtfully designed"}</span>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[490px] animate-slide-up rounded-[24px] border border-white bg-white/75 p-5 shadow-[0_16px_55px_rgba(204,118,165,0.11)] backdrop-blur-md sm:p-8">
          <div className="mb-6 text-center sm:text-start">
            <span className="mx-auto mb-4 grid size-11 place-items-center rounded-2xl border border-blush-200 bg-blush-50 text-blush-600 sm:mx-0">
              <Sparkles className="size-5" />
            </span>
            <h2 className="text-2xl font-semibold tracking-[-0.025em] text-ink">
              {t(isLogin ? "auth.welcomeBack" : "auth.createAccount")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {t(isLogin ? "auth.loginSubtitle" : "auth.registerSubtitle")}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4" noValidate>
            {!isLogin && (
              <Input
                name="name"
                autoComplete="name"
                label={t("auth.name")}
                placeholder={t("auth.namePlaceholder")}
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={50}
              />
            )}
            <Input
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              dir="ltr"
              label={t("auth.email")}
              placeholder={t("auth.emailPlaceholder")}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <div className="relative">
              <Input
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={isLogin ? "current-password" : "new-password"}
                label={t("auth.password")}
                placeholder={t("auth.passwordPlaceholder")}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="pe-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute end-2 top-[34px] grid size-10 place-items-center rounded-xl text-muted transition hover:bg-blush-50 hover:text-ink"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {!isLogin && (
              <Input
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                label={t("auth.confirmPassword")}
                placeholder={t("auth.confirmPasswordPlaceholder")}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            )}
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="mt-1 w-full"
            >
              {t(
                loading
                  ? isLogin
                    ? "auth.loggingIn"
                    : "auth.creating"
                  : isLogin
                  ? "auth.loginButton"
                  : "auth.registerButton"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            {t(isLogin ? "auth.noAccount" : "auth.hasAccount")}{" "}
            <Link
              href={isLogin ? "/register" : "/login"}
              className="font-medium text-blush-700 underline-offset-4 hover:underline"
            >
              {t(isLogin ? "auth.registerLink" : "auth.loginLink")}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
