"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import CareMddLogo from "@/app/components/CareMddLogo";

type MoodRatingFormProps = {
  phase: "pre" | "post";
};

export default function MoodRatingForm({ phase }: MoodRatingFormProps) {
  const router = useRouter();
  const [score, setScore] = useState(50);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isPreUse = phase === "pre";

  async function submitRating(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase, score }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "未能儲存心情記錄");

      if (!isPreUse) {
        const logoutResponse = await fetch("/api/logout", { method: "POST" });
        if (!logoutResponse.ok) throw new Error("未能登出，請再試一次");
      }

      router.replace(data.nextPath);
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "未能儲存心情記錄"
      );
      setSaving(false);
    }
  }

  return (
    <main className="mood-page">
      <section className="mood-card" aria-labelledby="mood-title">
        <CareMddLogo className="mood-logo" />
        <p className="mood-brand">另存心檔</p>
        <h1 id="mood-title">
          {isPreUse ? "使用前心情記錄" : "使用後心情記錄"}
        </h1>
        <p className="mood-instruction">
          你好，請在0至100的範圍內評估你當下的心情。
        </p>

        <form onSubmit={submitRating}>
          <output className="mood-score" htmlFor="mood-range">
            {score}
          </output>
          <input
            id="mood-range"
            className="mood-range"
            type="range"
            min="0"
            max="100"
            step="1"
            value={score}
            onChange={(event) => setScore(Number(event.target.value))}
            aria-label="心情評分"
          />
          <div className="mood-scale-labels" aria-hidden="true">
            <span>0<br />非常低落</span>
            <span>100<br />感覺良好</span>
          </div>
          <div className="mood-error" aria-live="polite">
            {error ? <p>{error}</p> : null}
          </div>
          <button className="mood-submit" type="submit" disabled={saving}>
            {saving
              ? "儲存中…"
              : isPreUse
                ? "提交並開始"
                : "提交並登出"}
          </button>
        </form>
      </section>
    </main>
  );
}
