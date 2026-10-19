"use client";

import { useEffect, useId, useState } from "react";
import { LogOut, UserRound, UserPlus } from "lucide-react";

export default function Navigation({ children, user }) {
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
      {user ? (
        <a href="/api/auth/logout" className="nav-toggle nav-toggle-logout" aria-label="Log out" title="Log out">
          <LogOut size={20} aria-hidden="true" />
        </a>
      ) : (
        <div className="nav-auth-actions" aria-label="Account actions">
          <a href="/login" className="nav-auth-icon nav-auth-login" aria-label="Sign In" title="Sign In">
            <UserRound size={18} strokeWidth={2} aria-hidden="true" />
            <span>Sign In</span>
          </a>
          <a href="/signup" className="nav-auth-icon nav-auth-signup" aria-label="Join Now" title="Join Now">
            <UserPlus size={18} aria-hidden="true" />
            <span>Join Now</span>
          </a>
        </div>
      )}

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
