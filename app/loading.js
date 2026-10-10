import { Sparkles } from "lucide-react";

export default function Loading() {
  return (
    <section className="videa-loading" role="status" aria-live="polite" aria-label="Loading Videa">
      <div className="videa-loading-brand">
        <span className="videa-loading-mark"><Sparkles size={19} aria-hidden="true" /></span>
        <span>VI<span>DEA</span></span>
      </div>
      <div className="videa-loading-track"><span /></div>
      <p>Getting everything ready…</p>
      <span className="videa-loading-sr">Please wait while this page loads.</span>
    </section>
  );
}
