import { redirect } from "next/navigation";
import { WelcomeDashboard } from "@/components/chat/WelcomeDashboard";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Conversations" };

export default async function ChatsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <WelcomeDashboard name={user.name} />;
}
