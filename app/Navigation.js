"use client";

import { useId, useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navigation({ children }) {
  const [open, setOpen] = useState(false);
  const navigationId = useId();

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
        {open ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
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
