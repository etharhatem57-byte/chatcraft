import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import type { Language } from "@/types";

export const metadata: Metadata = {
  title: { default: "ChatCraft — Think clearly with AI", template: "%s · ChatCraft" },
  description: "A calm bilingual AI chat workspace powered by Groq.",
  applicationName: "ChatCraft",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FAFAFA",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const saved = cookieStore.get("chatcraft_language")?.value;
  const language: Language = saved === "ar" ? "ar" : "en";

  return (
    <html lang={language} dir={language === "ar" ? "rtl" : "ltr"} suppressHydrationWarning>
      <body>
        <LanguageProvider initialLanguage={language}>
          <ToastProvider>{children}</ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
