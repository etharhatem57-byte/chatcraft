import { redirect } from "next/navigation";
import { ProfilePage } from "@/components/profile/ProfilePage";
import { getCurrentUser } from "@/lib/auth";
import { countUserChats } from "@/lib/data";
import { isDemoMode } from "@/lib/mongodb";

export const metadata = { title: "Profile" };

export default async function ProfileRoute() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const totalChats = await countUserChats(user.id);
  return <ProfilePage user={user} totalChats={totalChats} demo={isDemoMode()} />;
}
