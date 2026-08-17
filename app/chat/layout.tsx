import { redirect } from "next/navigation";
import { ChatShell } from "@/components/chat/ChatShell";
import { getCurrentUser } from "@/lib/auth";
import { isDemoMode } from "@/lib/mongodb";

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <ChatShell user={user} demo={isDemoMode()}>{children}</ChatShell>;
}
