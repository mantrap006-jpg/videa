"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("Videa root error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#090611", color: "#f8f5ff", fontFamily: "Arial, sans-serif" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 }}>
          <section style={{ width: "min(100%, 480px)", padding: 28, textAlign: "center", border: "1px solid #38234e", borderRadius: 20, background: "#130d1d" }} role="alert">
            <p style={{ color: "#c5a0ff", fontSize: 11, fontWeight: 800, letterSpacing: ".14em" }}>VIDEA · APP ERROR</p>
            <h1 style={{ fontSize: 28 }}>Videa needs to reload</h1>
            <p style={{ color: "#c6bed1", lineHeight: 1.6 }}>A critical error interrupted this page. Please try again. Your saved account data has not been intentionally changed.</p>
            <button type="button" onClick={() => reset()} style={{ padding: "12px 18px", border: 0, borderRadius: 10, background: "#8b5cf6", color: "white", fontWeight: 700, cursor: "pointer" }}>Try again</button>
          </section>
        </main>
      </body>
    </html>
  );
}
