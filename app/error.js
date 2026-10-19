"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AppError({ error, reset }) {
  useEffect(() => {
    console.error("Videa page error:", error);
  }, [error]);

  return (
    <main className="videa-error-page" role="alert">
      <section className="videa-error-card">
        <div className="videa-error-icon" aria-hidden="true">!</div>
        <p className="videa-error-eyebrow">VIDEA · SOMETHING WENT WRONG</p>
        <h1>We couldn’t load this page</h1>
        <p className="videa-error-copy">
          Your account and saved activity are safe. Try again, or return to Videa and reopen this page.
        </p>
        <div className="videa-error-actions">
          <button type="button" className="button" onClick={() => reset()}>Try again</button>
          <Link className="button secondary" href="/points">Go to points</Link>
        </div>
        <p className="videa-error-help">If this keeps happening, refresh the page in a moment.</p>
      </section>
      <style jsx>{`
        .videa-error-page{min-height:65vh;display:grid;place-items:center;padding:28px 16px;background:radial-gradient(ellipse at top,#281044 0%,transparent 60%)}
        .videa-error-card{width:min(100%,520px);padding:clamp(22px,5vw,36px);border:1px solid rgba(190,145,255,.2);border-radius:22px;background:rgba(15,10,26,.94);box-shadow:0 24px 80px rgba(0,0,0,.28);text-align:center;color:#f8f5ff}
        .videa-error-icon{display:grid;place-items:center;width:48px;height:48px;margin:0 auto 18px;border-radius:16px;background:rgba(255,77,94,.12);border:1px solid rgba(255,77,94,.35);color:#ff6575;font-size:27px;font-weight:800}
        .videa-error-eyebrow{font-size:11px;letter-spacing:.14em;font-weight:800;color:#c5a0ff}
        .videa-error-card h1{margin:10px 0;font-size:clamp(24px,5vw,34px);line-height:1.15}
        .videa-error-copy,.videa-error-help{color:#bdb5cc;line-height:1.6;font-size:14px}
        .videa-error-actions{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:24px}
        .videa-error-help{margin:22px 0 0;font-size:12px}
      `}</style>
    </main>
  );
}
