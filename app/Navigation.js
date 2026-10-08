"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navigation({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="nav-toggle"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={21} /> : <Menu size={21} />}
      </button>

      <nav
        className={`nav-links${open ? " open" : ""}`}
        onClick={() => setOpen(false)}
      >
        {children}
      </nav>
    </>
  );
}
