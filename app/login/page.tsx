import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { getCurrentUser } from "@/lib/auth";
import { isDemoMode } from "@/lib/mongodb";

export const metadata = { title: "Log in" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/chat");
  return <Suspense><AuthForm mode="login" demo={isDemoMode()} /></Suspense>;
}
