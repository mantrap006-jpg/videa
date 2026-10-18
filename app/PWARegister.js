"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !window.isSecureContext) return;

    let disposed = false;
    let registrationPromise = null;

    const register = () => {
      if (disposed || !navigator.onLine || registrationPromise) {
        return registrationPromise;
      }

      registrationPromise = navigator.serviceWorker
        .register("/sw.js", {
          scope: "/",
          updateViaCache: "none"
        })
        .catch((error) => {
          if (!disposed) {
            console.error(
              `Videa service worker registration failed for ${window.location.origin}/sw.js:`,
              error
            );
          }
        })
        .finally(() => {
          registrationPromise = null;
        });

      return registrationPromise;
    };

    void register();
    window.addEventListener("online", register);

    return () => {
      disposed = true;
      window.removeEventListener("online", register);
    };
  }, []);

  return null;
}
