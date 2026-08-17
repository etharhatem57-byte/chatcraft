import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { getCurrentUser } from "@/lib/auth";
import { isDemoMode } from "@/lib/mongodb";

export const metadata = { title: "Create account" };

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/chat");
  return <Suspense><AuthForm mode="register" demo={isDemoMode()} /></Suspense>;
}
