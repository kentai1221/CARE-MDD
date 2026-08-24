import { redirect } from "next/navigation";
import ConversationThreads from "./ConversationThreads";
import { hasValidSession } from "@/app/lib/auth";
import { listConversations } from "@/app/lib/conversations";

export const dynamic = "force-dynamic";

export default async function ThreadsPage() {
  if (!(await hasValidSession())) {
    redirect("/login");
  }

  return (
    <ConversationThreads initialConversations={await listConversations()} />
  );
}
