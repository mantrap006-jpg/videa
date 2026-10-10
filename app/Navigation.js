"use client";

import { useEffect, useId, useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navigation({ children }) {
  const [open, setOpen] = useState(false);
  const navigationId = useId();

  useEffect(() => {
    if (!open) return undefined;

    function closeOnEscape(event) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="nav-toggle"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        aria-controls={navigationId}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
      </button>

      <nav
        id={navigationId}
        className={`nav-links${open ? " open" : ""}`}
        aria-label="Main navigation"
        onClick={() => setOpen(false)}
      >
        {children}
      </nav>
    </>
  );
}
