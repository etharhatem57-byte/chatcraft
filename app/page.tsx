import { LandingPage } from "@/components/landing/LandingPage";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();
  return <LandingPage authenticated={Boolean(user)} />;
}
