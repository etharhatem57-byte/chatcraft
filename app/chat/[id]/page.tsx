import { Suspense } from "react";
import { ChatPanel } from "@/components/chat/ChatPanel";

export const metadata = { title: "Conversation" };

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Suspense><ChatPanel chatId={id} /></Suspense>;
}
