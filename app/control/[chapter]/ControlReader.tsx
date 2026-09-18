"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ControlChapter } from "@/app/lib/control-content";

type ControlReaderProps = {
  chapter: ControlChapter;
  imagePaths: string[];
  initiallyComplete: boolean;
};

export default function ControlReader({
  chapter,
  imagePaths,
  initiallyComplete,
}: ControlReaderProps) {
  const router = useRouter();
  const [pageIndex, setPageIndex] = useState(0);
  const [complete, setComplete] = useState(initiallyComplete);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const openedAtRef = useRef(Date.now());
  const openLoggedRef = useRef(false);
  const closeSentRef = useRef(false);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (!openLoggedRef.current) {
      openLoggedRef.current = true;
      fetch("/api/control/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "open", chapter: chapter.id }),
        keepalive: true,
      }).catch(() => undefined);
    }

    const openedAt = openedAtRef.current;
    const sendCloseEvent = () => {
      if (closeSentRef.current) return;
      closeSentRef.current = true;

      const durationSeconds = Math.max(
        0,
        Math.round((Date.now() - openedAt) / 1000)
      );
      const payload = JSON.stringify({
        type: "close",
        chapter: chapter.id,
        durationSeconds,
      });
      navigator.sendBeacon(
        "/api/control/events",
        new Blob([payload], { type: "application/json" })
      );
    };

    window.addEventListener("pagehide", sendCloseEvent);

    return () => {
      window.removeEventListener("pagehide", sendCloseEvent);
      closeTimerRef.current = window.setTimeout(sendCloseEvent, 0);
    };
  }, [chapter.id]);

  async function markComplete() {
    if (saving) return;
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/control/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapter: chapter.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "未能儲存閱讀進度");
      setComplete(true);
      router.push("/control");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "未能儲存閱讀進度"
      );
      setSaving(false);
    }
  }

  function reportImageError() {
    setError("未能載入此頁，請檢查網絡後再試。技術問題已記錄。");
    fetch("/api/control/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "image_error",
        chapter: chapter.id,
        details: imagePaths[pageIndex],
      }),
    }).catch(() => undefined);
  }

  const isLastPage = pageIndex === imagePaths.length - 1;

  return (
    <main className="reader-page">
      <header className="reader-header">
        <button
          className="chat-back-button"
          type="button"
          onClick={() => router.push("/control")}
          aria-label="返回學習內容"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m15 5-7 7 7 7" />
          </svg>
        </button>
        <div>
          <span>CH.{chapter.id}</span>
          <h1>{chapter.title}</h1>
        </div>
        <span className="reader-page-count">
          {pageIndex + 1} / {imagePaths.length}
        </span>
      </header>

      <section className="reader-content" aria-live="polite">
        {/* These are faithful crops of the supplied booklet and intentionally bypass image optimisation. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="reader-image"
          src={imagePaths[pageIndex]}
          alt={`${chapter.title}，第 ${pageIndex + 1} 頁`}
          onError={reportImageError}
        />
        {error ? <p className="reader-error">{error}</p> : null}
      </section>

      <footer className="reader-controls">
        <button
          type="button"
          onClick={() => setPageIndex((current) => Math.max(0, current - 1))}
          disabled={pageIndex === 0}
        >
          上一頁
        </button>
        {isLastPage ? (
          <button
            className="reader-primary-action"
            type="button"
            onClick={markComplete}
            disabled={saving}
          >
            {saving ? "儲存中…" : complete ? "返回內容列表" : "完成本章"}
          </button>
        ) : (
          <button
            className="reader-primary-action"
            type="button"
            onClick={() =>
              setPageIndex((current) => Math.min(imagePaths.length - 1, current + 1))
            }
          >
            下一頁
          </button>
        )}
      </footer>
    </main>
  );
}
