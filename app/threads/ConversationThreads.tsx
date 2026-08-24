"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ConversationSummary } from "@/app/lib/conversation-types";

type ConversationThreadsProps = {
  initialConversations: ConversationSummary[];
};

function formatConversationDate(value: string) {
  return new Intl.DateTimeFormat("zh-HK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Hong_Kong",
  }).format(new Date(value));
}

export default function ConversationThreads({
  initialConversations,
}: ConversationThreadsProps) {
  const router = useRouter();
  const [conversations, setConversations] =
    useState<ConversationSummary[]>(initialConversations);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetch("/api/conversations", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "未能載入對話");
        if (active) setConversations(data.conversations);
      })
      .catch((caughtError) => {
        if (active) {
          setError(
            caughtError instanceof Error ? caughtError.message : "未能載入對話"
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function createNewConversation() {
    if (creating) return;
    setCreating(true);
    setError("");

    try {
      const response = await fetch("/api/conversations", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "未能建立對話");
      router.push(`/chat/${data.conversation.id}`);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "未能建立對話"
      );
      setCreating(false);
    }
  }

  async function logout() {
    if (!window.confirm("確定要登出嗎？")) return;

    await fetch("/api/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <main className="threads-page">
      <header className="threads-header">
        <div className="threads-header-inner">
          <button
            className="chat-back-button"
            type="button"
            onClick={logout}
            aria-label="登出"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m15 5-7 7 7 7" />
            </svg>
          </button>
          <h1 className="threads-brand">CARE-MDD</h1>
          <button
            className="new-conversation-button"
            type="button"
            onClick={createNewConversation}
            disabled={creating}
            aria-label="新增對話"
          >
            <span aria-hidden="true">+</span>
          </button>
        </div>
      </header>

      <section className="threads-content" aria-live="polite">
        {error ? <p className="threads-error">{error}</p> : null}

        {conversations.length === 0 ? (
          <div className="threads-empty">
            <div className="threads-empty-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M5 5h14v10H9l-4 4V5Z" />
                <path d="M9 9h6M9 12h4" />
              </svg>
            </div>
            <h2>尚未有對話</h2>
            <p>按右上角的「+」開始第一個對話。</p>
          </div>
        ) : (
          <div className="threads-list">
            {conversations.map((conversation) => (
              <Link
                className="thread-card"
                href={`/chat/${conversation.id}`}
                key={conversation.id}
              >
                <div className="thread-card-copy">
                  <div className="thread-card-heading">
                    <h2>{conversation.title}</h2>
                    <time dateTime={conversation.updatedAt}>
                      {formatConversationDate(conversation.updatedAt)}
                    </time>
                  </div>
                  <p>{conversation.preview}</p>
                </div>
                <svg className="thread-card-chevron" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m9 5 7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
