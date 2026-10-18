"use client";

import { Sparkles } from "lucide-react";

/**
 * Shared Videa loading indicator.
 * Used by Next.js route loading boundaries and can be reused by page-level states.
 */
export default function VideaLoading({ message = "Getting everything ready…" }) {
  return (
    <section
      className="videa-loading"
      role="status"
      aria-live="polite"
      aria-label="Loading Videa"
    >
      <div className="videa-loading-brand">
        <span className="videa-loading-mark">
          <Sparkles size={19} aria-hidden="true" />
        </span>
        <span>VI<span>DEA</span></span>
      </div>
      <div className="videa-loading-track" aria-hidden="true"><span /></div>
      <p>{message}</p>
      <span className="videa-loading-sr">Please wait while this page loads.</span>
    </section>
  );
}
