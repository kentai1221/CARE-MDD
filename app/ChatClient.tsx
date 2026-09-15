"use client";

import {
  type ChangeEvent,
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
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
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
];

function readImageAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("未能讀取圖片"));
      }
    };
    reader.onerror = () => reject(new Error("未能讀取圖片"));
    reader.readAsDataURL(file);
  });
}

function formatRecordingTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

export default function ChatClient({ initialConversation }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialConversation.title);
  const [savedTitle, setSavedTitle] = useState(initialConversation.title);
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialConversation.messages
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [savingTitle, setSavingTitle] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(
    initialConversation.sessionId
  );
  const [charId] = useState(initialConversation.charId ?? "");

  const listRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const recordingStartedAtRef = useRef(0);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  useEffect(() => {
    if (!isRecording) return;

    const timer = window.setInterval(() => {
      setRecordingSeconds(
        Math.floor((Date.now() - recordingStartedAtRef.current) / 1000)
      );
    }, 250);

    return () => window.clearInterval(timer);
  }, [isRecording]);

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

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || loading || uploadingImage) return;

    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      setError("只支援 PNG、JPEG、WebP、GIF、HEIC 或 HEIF 圖片");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("圖片大小不能超過 5 MB");
      return;
    }

    setUploadingImage(true);
    setError(null);

    try {
      const imageDataUrl = await readImageAsDataUrl(file);
      const imageMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: "圖片",
        imageDataUrl,
        createdAt: new Date().toISOString(),
      };
      const nextMessages = [...messages, imageMessage];

      setMessages(nextMessages);
      await updateConversation({
        messages: nextMessages,
        sessionId,
        charId: charId || null,
      });
    } catch (caughtError) {
      setMessages(messages);
      setError(
        caughtError instanceof Error ? caughtError.message : "未能上傳圖片"
      );
    } finally {
      setUploadingImage(false);
    }
  }

  function beginPrototypeRecording() {
    if (loading || uploadingImage || emergencyOpen || input.trim()) return;

    recordingStartedAtRef.current = Date.now();
    setRecordingSeconds(0);
    setIsRecording(true);
  }

  function endPrototypeRecording() {
    setIsRecording(false);
    setRecordingSeconds(0);
  }

  function handleVoicePointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (input.trim()) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    beginPrototypeRecording();
  }

  function handleVoiceKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (
      input.trim() ||
      event.repeat ||
      (event.key !== " " && event.key !== "Enter")
    ) {
      return;
    }

    event.preventDefault();
    beginPrototypeRecording();
  }

  function handleVoiceKeyUp(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== " " && event.key !== "Enter") return;

    event.preventDefault();
    endPrototypeRecording();
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
            <div
              className={`message-bubble message-${message.role} ${message.imageDataUrl ? "message-image-bubble" : ""}`}
            >
              {message.imageDataUrl ? (
                // User-selected data URLs are displayed directly and are not sent to Convai.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="chat-message-image"
                  src={message.imageDataUrl}
                  alt="用戶上傳的圖片"
                />
              ) : (
                <span>{message.content}</span>
              )}
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
        <div className="composer-input-area">
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
            disabled={loading || uploadingImage || emergencyOpen || isRecording}
          />

          {isRecording ? (
            <div className="recording-status" role="status" aria-live="polite">
              <span className="recording-dot" aria-hidden="true" />
              <span>錄音中</span>
              <time>{formatRecordingTime(recordingSeconds)}</time>
            </div>
          ) : null}
        </div>

        <input
          ref={imageInputRef}
          className="image-upload-input"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/heic,image/heif"
          onChange={uploadImage}
          tabIndex={-1}
          aria-hidden="true"
        />

        <button
          className="composer-icon-button image-upload-button"
          type="button"
          onClick={() => imageInputRef.current?.click()}
          disabled={loading || uploadingImage || emergencyOpen || isRecording}
          aria-label={uploadingImage ? "正在上傳圖片" : "上傳圖片"}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="4" width="18" height="16" rx="3" />
            <circle cx="9" cy="9" r="1.5" />
            <path d="m5 17 4.5-4.5 3 3 2-2L19 18" />
          </svg>
        </button>

        <button
          className={`composer-icon-button composer-primary-button ${input.trim() ? "send-button" : "voice-input-button"} ${isRecording ? "is-recording" : ""}`}
          type={input.trim() ? "submit" : "button"}
          disabled={loading || uploadingImage || emergencyOpen}
          onPointerDown={handleVoicePointerDown}
          onPointerUp={endPrototypeRecording}
          onPointerCancel={endPrototypeRecording}
          onKeyDown={handleVoiceKeyDown}
          onKeyUp={handleVoiceKeyUp}
          onContextMenu={(event) => event.preventDefault()}
          aria-label={
            input.trim()
              ? "傳送訊息"
              : isRecording
                ? "鬆開停止錄音"
                : "按住錄音"
          }
        >
          {input.trim() ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m3 3 18 9-18 9 3-8 9-1-9-1-3-8Z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6" />
            </svg>
          )}
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
