import Link from "next/link";

export default function NotFound() {
  return (
    <main className="videa-error-page">
      <section className="videa-error-card">
        <div className="videa-error-icon" aria-hidden="true">?</div>
        <p className="videa-error-eyebrow">VIDEA · 404</p>
        <h1>We couldn’t find that page</h1>
        <p className="videa-error-copy">The link may be outdated, or the page may have moved. Head back to Videa and choose where to go next.</p>
        <div className="videa-error-actions">
          <Link className="button" href="/points">Go to points</Link>
          <Link className="button secondary" href="/videos">Browse videos</Link>
        </div>
      </section>
      <style>{`
        .videa-error-page{min-height:65vh;display:grid;place-items:center;padding:28px 16px;background:radial-gradient(ellipse at top,#281044 0%,transparent 60%)}
        .videa-error-card{width:min(100%,520px);padding:clamp(22px,5vw,36px);border:1px solid rgba(190,145,255,.2);border-radius:22px;background:#0f0a1a;box-shadow:0 24px 80px rgba(0,0,0,.28);text-align:center;color:#f8f5ff}
        .videa-error-icon{display:grid;place-items:center;width:48px;height:48px;margin:0 auto 18px;border-radius:16px;background:rgba(139,92,246,.15);border:1px solid rgba(190,145,255,.3);color:#c5a0ff;font-size:27px;font-weight:800}
        .videa-error-eyebrow{font-size:11px;letter-spacing:.14em;font-weight:800;color:#c5a0ff}
        .videa-error-card h1{margin:10px 0;font-size:clamp(24px,5vw,34px);line-height:1.15}
        .videa-error-copy{color:#bdb5cc;line-height:1.6;font-size:14px}
        .videa-error-actions{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:24px}
      `}</style>
    </main>
  );
}
