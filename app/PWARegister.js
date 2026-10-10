"use client";

import { useEffect, useState } from "react";

export default function PWARegister() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const onBeforeInstall = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || !installPrompt) return null;

  const install = async () => {
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <button type="button" onClick={install} aria-label="Install Videa app" style={{
      position: "fixed", right: 16, bottom: 18, zIndex: 1000,
      border: 0, borderRadius: 999, padding: "11px 16px",
      background: "#635bff", color: "#fff", fontWeight: 700,
      fontSize: 13, boxShadow: "0 8px 24px rgba(31,25,110,.28)", cursor: "pointer"
    }}>
      ＋ Install Videa
    </button>
  );
}
