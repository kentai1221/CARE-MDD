"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ChatMessage, Conversation } from "./lib/conversation-types";

type Props = {
  initialConversation: Conversation;
};

const EMERGENCY_REPLY = `【系統緊急提示】
系統留意到你提及自殺嘅行為。為咗保障你嘅安全，我哋需要暫停對話。請立即聯絡專業人員：

📞 致電 999
📞 醫管局精神健康專線：2466 7350
📞 撒瑪利亞防止自殺會：2389 2222`;

const HARDCODED_USER_MESSAGE =
  "我最近真係好大壓力，成日形住自己會做錯嘢，停唔到咁諗...";
const HARDCODED_ASSISTANT_REPLY =
  "聽得出你最近真係好辛苦。我哋試吓退後一步睇？如果呢個『驚做錯嘢』嘅想法有一把聲，你覺得佢會點同你講嘢？";

export default function ChatClient({ initialConversation }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialConversation.title);
  const [savedTitle, setSavedTitle] = useState(initialConversation.title);
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialConversation.messages
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingTitle, setSavingTitle] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(
    initialConversation.sessionId
  );
  const [charId] = useState(initialConversation.charId ?? "");

  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function updateConversation(
    updates: Partial<
      Pick<Conversation, "title" | "messages" | "sessionId" | "charId">
    >
  ) {
    const response = await fetch(`/api/conversations/${initialConversation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "未能儲存對話");
    }

    return data.conversation as Conversation;
  }

  async function saveTitle() {
    const trimmed = title.trim();

    if (!trimmed) {
      setTitle(savedTitle);
      return;
    }

    if (trimmed === savedTitle || savingTitle) {
      setTitle(trimmed);
      return;
    }

    setSavingTitle(true);
    setError(null);

    try {
      const conversation = await updateConversation({ title: trimmed });
      setTitle(conversation.title);
      setSavedTitle(conversation.title);
    } catch (caughtError) {
      setTitle(savedTitle);
      setError(
        caughtError instanceof Error ? caughtError.message : "未能儲存標題"
      );
    } finally {
      setSavingTitle(false);
    }
  }

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    const messagesWithUser = [...messages, userMessage];

    setError(null);
    setLoading(true);
    setInput("");
    setMessages(messagesWithUser);

    try {
      if (trimmed.includes("自殺")) {
        const emergencyMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: EMERGENCY_REPLY,
          createdAt: new Date().toISOString(),
        };
        const emergencyMessages = [...messagesWithUser, emergencyMessage];

        setMessages(emergencyMessages);
        setEmergencyOpen(true);
        await updateConversation({
          messages: emergencyMessages,
          sessionId,
          charId: charId || null,
        });
        return;
      }

      if (trimmed === HARDCODED_USER_MESSAGE) {
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: HARDCODED_ASSISTANT_REPLY,
          createdAt: new Date().toISOString(),
        };
        const hardcodedMessages = [...messagesWithUser, assistantMessage];

        setMessages(hardcodedMessages);
        await updateConversation({
          messages: hardcodedMessages,
          sessionId,
          charId: charId || null,
        });
        return;
      }

      await updateConversation({
        messages: messagesWithUser,
        sessionId,
        charId: charId || null,
      });

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          sessionId: sessionId ?? "-1",
          charId: charId || undefined,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Request failed");
      }

      const nextSessionId = data.sessionId ?? sessionId;
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          data.reply ||
          "如果困擾持續或加劇，建議諮詢合資格的心理健康專業人士。",
        createdAt: new Date().toISOString(),
      };
      const nextMessages = [...messagesWithUser, assistantMessage];

      setSessionId(nextSessionId);
      setMessages(nextMessages);
      await updateConversation({
        messages: nextMessages,
        sessionId: nextSessionId,
        charId: charId || null,
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  async function deleteCurrentConversation() {
    const response = await fetch(
      `/api/conversations/${initialConversation.id}`,
      { method: "DELETE" }
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "未能刪除對話");
    }
  }

  function returnToThreads() {
    router.replace("/threads");
    router.refresh();
  }

  async function goBack() {
    if (deleting) return;

    const hasUserMessage = messages.some((message) => message.role === "user");
    if (hasUserMessage) {
      returnToThreads();
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await deleteCurrentConversation();
      returnToThreads();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "未能刪除空白對話"
      );
      setDeleting(false);
    }
  }

  async function confirmDelete() {
    if (deleting) return;
    if (!window.confirm("確定要刪除這個對話嗎？刪除後不能復原。")) return;

    setDeleting(true);
    setError(null);

    try {
      await deleteCurrentConversation();
      returnToThreads();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "未能刪除對話"
      );
      setDeleting(false);
    }
  }

  return (
    <main className="chat-page">
      <header className="chat-header">
        <button
          className="chat-back-button"
          type="button"
          onClick={goBack}
          disabled={deleting}
          aria-label="返回對話列表"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m15 5-7 7 7 7" />
          </svg>
        </button>

        <div className="conversation-title-editor">
          <label className="sr-only" htmlFor="conversation-title">
            對話標題
          </label>
          <input
            id="conversation-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={saveTitle}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.blur();
              }
              if (event.key === "Escape") {
                setTitle(savedTitle);
                event.currentTarget.blur();
              }
            }}
            maxLength={60}
            aria-label="對話標題"
          />
          <span className="title-save-status" aria-live="polite">
            {savingTitle ? "儲存中…" : ""}
          </span>
        </div>

        <button
          className="delete-conversation-button"
          type="button"
          onClick={confirmDelete}
          disabled={deleting || loading}
        >
          {deleting ? "刪除中…" : "刪除"}
        </button>
      </header>

      <aside className="chat-notice">
        <span aria-hidden="true">i</span>
        <p>
          CARE-MDD 提供認知行為治療相關的心理教育與自助練習，只供一般參考，
          不能取代專業診斷或治療。如困擾持續、加劇或出現危機，請尋求合資格的心理健康專業人士或緊急支援服務。
        </p>
      </aside>

      <div className="message-list" ref={listRef} aria-live="polite">
        {messages.map((message) => (
          <div
            className={`message-row ${message.role === "user" ? "message-row-user" : ""}`}
            key={message.id}
          >
            <div className={`message-bubble message-${message.role}`}>
              <span>{message.content}</span>
            </div>
          </div>
        ))}

        {loading ? <div className="typing-indicator">CARE-MDD 正在輸入…</div> : null}
        {error ? <div className="chat-error">信息：{error}</div> : null}
      </div>

      <form
        className="chat-composer"
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage();
        }}
      >
        <label className="sr-only" htmlFor="chat-message">
          訊息
        </label>
        <input
          id="chat-message"
          placeholder="輸入訊息…"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              sendMessage();
            }
          }}
          disabled={loading || emergencyOpen}
        />
        <button
          type="submit"
          disabled={loading || emergencyOpen || !input.trim()}
          aria-label="傳送訊息"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m3 3 18 9-18 9 3-8 9-1-9-1-3-8Z" />
          </svg>
        </button>
      </form>

      {emergencyOpen ? (
        <div className="emergency-overlay">
          <section
            className="emergency-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="emergency-title"
            aria-describedby="emergency-description"
          >
            <div className="emergency-icon" aria-hidden="true">
              !
            </div>
            <h2 id="emergency-title">【系統緊急提示】</h2>
            <p id="emergency-description">
              系統留意到你提及自殺嘅行為。為咗保障你嘅安全，我哋需要暫停對話。請立即聯絡專業人員：
            </p>

            <div className="emergency-actions">
              <a className="emergency-action emergency-action-primary" href="tel:999">
                <span aria-hidden="true">📞</span>
                <span>致電 999</span>
              </a>
              <a className="emergency-action" href="tel:24667350">
                <span aria-hidden="true">📞</span>
                <span>醫管局精神健康專線：2466 7350</span>
              </a>
              <a className="emergency-action" href="tel:23892222">
                <span aria-hidden="true">📞</span>
                <span>撒瑪利亞防止自殺會：2389 2222</span>
              </a>
            </div>

            <button
              className="emergency-close"
              type="button"
              onClick={() => setEmergencyOpen(false)}
            >
              關閉提示
            </button>
          </section>
        </div>
      ) : null}
    </main>
  );
}
