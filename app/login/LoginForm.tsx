"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import CareMddLogo from "@/app/components/CareMddLogo";
import InstallAppPrompt from "./InstallAppPrompt";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "登入失敗，請再試一次");
      }

      router.replace(data.nextPath || "/mood?phase=pre");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "登入失敗，請再試一次"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand">
          <CareMddLogo className="login-logo" />
          <h1 id="login-title">另存心檔</h1>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="field-group">
            <label htmlFor="username">用戶名稱</label>
            <input
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="用戶名稱"
              autoComplete="username"
              autoFocus
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="password">密碼</label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="密碼"
              autoComplete="current-password"
              required
            />
          </div>

          <div className="login-message" aria-live="polite">
            {error ? <p>{error}</p> : null}
          </div>

          <button className="login-button" type="submit" disabled={loading}>
            {loading ? "登入中…" : "登入"}
          </button>
        </form>
      </section>
      <InstallAppPrompt />
    </main>
  );
}
