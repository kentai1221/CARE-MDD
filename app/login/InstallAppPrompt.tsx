"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type InstallChoice = {
  outcome: "accepted" | "dismissed";
  platform: string;
};

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallChoice>;
}

const DISMISSED_KEY = "care-mdd-install-prompt-dismissed-v1";
const INSTALLED_KEY = "care-mdd-pwa-installed";

export default function InstallAppPrompt() {
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const mobileNavigator = navigator as Navigator & { standalone?: boolean };
    const isMobile =
      window.matchMedia("(max-width: 768px)").matches ||
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const iosDevice =
      /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      mobileNavigator.standalone === true;
    const wasDismissed = localStorage.getItem(DISMISSED_KEY) === "true";
    const wasInstalled = localStorage.getItem(INSTALLED_KEY) === "true";

    setIsIos(iosDevice);

    if (!isMobile || isStandalone || wasDismissed || wasInstalled) return;

    const showTimer = window.setTimeout(() => setVisible(true), 500);

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    }

    function handleInstalled() {
      localStorage.setItem(INSTALLED_KEY, "true");
      setVisible(false);
      setInstallPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.clearTimeout(showTimer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  function closePrompt() {
    localStorage.setItem(DISMISSED_KEY, "true");
    setVisible(false);
  }

  async function installApp() {
    if (!installPrompt) {
      setShowInstructions(true);
      return;
    }

    setInstalling(true);

    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;

      if (choice.outcome === "accepted") {
        localStorage.setItem(INSTALLED_KEY, "true");
        setVisible(false);
      }

      setInstallPrompt(null);
    } finally {
      setInstalling(false);
    }
  }

  if (!visible) return null;

  return (
    <aside className="install-app-prompt" aria-labelledby="install-app-title">
      <button
        className="install-app-close"
        type="button"
        onClick={closePrompt}
        aria-label="關閉安裝提示"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      </button>

      <div className="install-app-heading">
        <Image
          className="install-app-icon"
          src="/icons/care-mdd-192.png"
          width={54}
          height={54}
          alt=""
        />
        <div>
          <h2 id="install-app-title">安裝 CARE-MDD</h2>
          <p>加到手機主畫面，以 App 模式開啟。</p>
        </div>
      </div>

      <button
        className="install-app-button"
        type="button"
        onClick={installApp}
        disabled={installing}
      >
        {installing ? "準備安裝…" : installPrompt ? "安裝 App" : "查看安裝方法"}
      </button>

      {showInstructions ? (
        <p className="install-app-instructions" role="status">
          {isIos
            ? "請按 Safari 下方的分享按鈕，再選擇「加入主畫面」。"
            : "請開啟瀏覽器選單，再選擇「安裝應用程式」或「新增至主畫面」。"}
        </p>
      ) : null}
    </aside>
  );
}
