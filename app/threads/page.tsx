import { redirect } from "next/navigation";
import ConversationThreads from "./ConversationThreads";
import { getStudySession } from "@/app/lib/auth";
import { listConversations } from "@/app/lib/conversations";

export const dynamic = "force-dynamic";

export default async function ThreadsPage() {
  const session = await getStudySession();

  if (!session) {
    redirect("/login");
  }

  if (session.arm === "control") redirect("/control");

  return (
    <ConversationThreads initialConversations={await listConversations()} />
  );
}
