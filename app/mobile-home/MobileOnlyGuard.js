"use client";

import { useEffect } from "react";

export default function MobileOnlyGuard() {
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 769px)");
    const redirectIfDesktop = () => {
      if (desktop.matches) window.location.replace("/");
    };
    redirectIfDesktop();
    desktop.addEventListener("change", redirectIfDesktop);
    return () => desktop.removeEventListener("change", redirectIfDesktop);
  }, []);

  return null;
}
