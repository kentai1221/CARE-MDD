import { notFound, redirect } from "next/navigation";
import ChatClient from "@/app/ChatClient";
import { hasValidSession } from "@/app/lib/auth";
import { getConversation } from "@/app/lib/conversations";

type ChatPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function ChatPage({ params }: ChatPageProps) {
  if (!(await hasValidSession())) {
    redirect("/login");
  }

  const { id } = await params;
  const conversation = await getConversation(id);

  if (!conversation) {
    notFound();
  }

  return <ChatClient initialConversation={conversation} />;
}
