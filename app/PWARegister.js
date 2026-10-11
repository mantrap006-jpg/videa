"use client";

import { useEffect, useState } from "react";

export default function PWARegister() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    let mounted = true;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error) => {
        console.error("Videa service worker registration failed:", error);
      });
    }

    const onBeforeInstall = (event) => {
      event.preventDefault();
      if (mounted) setInstallPrompt(event);
    };
    const onInstalled = () => {
      if (mounted) {
        setInstalled(true);
        setInstallPrompt(null);
        setShowHelp(false);
      }
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    // Detect an app that was already installed before this page loaded.
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      window.navigator.standalone === true;
    if (standalone) setInstalled(true);

    return () => {
      mounted = false;
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const install = async () => {
    if (!installPrompt) {
      setShowHelp((current) => !current);
      return;
    }
    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
    } catch (error) {
      console.error("Videa install prompt could not be opened:", error);
      setShowHelp(true);
    } finally {
      setInstallPrompt(null);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={install}
        aria-label="Install Videa app"
        style={{
          position: "fixed", right: 16, bottom: 18, zIndex: 100000,
          border: 0, borderRadius: 999, padding: "11px 16px",
          background: "#635bff", color: "#fff", fontWeight: 700,
          fontSize: 13, boxShadow: "0 8px 24px rgba(31,25,110,.28)",
          cursor: "pointer", touchAction: "manipulation"
        }}
      >
        ＋ Install Videa
      </button>
      {showHelp && (
        <section
          role="dialog"
          aria-label="How to install Videa"
          style={{
            position: "fixed", left: 16, right: 16, bottom: 76,
            zIndex: 100000, maxWidth: 420, marginInline: "auto",
            padding: 18, borderRadius: 16, color: "#fff",
            background: "#171020", border: "1px solid #49345f",
            boxShadow: "0 12px 36px rgba(0,0,0,.35)", fontSize: 14,
            lineHeight: 1.5
          }}
        >
          <strong style={{ display: "block", marginBottom: 8 }}>Install Videa on Android</strong>
          <p style={{ margin: "0 0 10px" }}>
            In Chrome, tap the ⋮ menu at the top, then choose <strong>Install app</strong> or
            <strong> Add to Home screen</strong>. If that option is missing, open this website
            directly in Chrome, make sure you are online, and try again after the page finishes loading.
          </p>
          <button
            type="button"
            onClick={() => setShowHelp(false)}
            style={{
              border: 0, borderRadius: 8, padding: "8px 12px",
              background: "#635bff", color: "#fff", fontWeight: 700
            }}
          >
            Got it
          </button>
        </section>
      )}
    </>
  );
}
