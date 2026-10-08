"use client";

import { useState } from "react";
import { Coins, Megaphone, Play, Sparkles, UploadCloud } from "lucide-react";

export default function Creator() {
  const [form, setForm] = useState({ title: "", youtubeUrl: "", description: "", rewardPoints: 10, minimumWatchPercent: 80 });
  const [message, setMessage] = useState("");

  async function add(e) {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch("/api/creator/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      setMessage(res.ok ? "Video submitted successfully." : (data.error || "Could not submit video."));
    } catch {
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <section className="creator-page">
      <div className="creator-hero">
        <div>
          <div className="eyebrow"><Megaphone size={15} /> CREATOR</div>
          <h2>Put your videos in front of engaged viewers.</h2>
          <p className="muted">Creators can subscribe to Videa, submit approved YouTube content, choose a viewer reward, and grow their reach.</p>
        </div>
        <div className="creator-plan">
          <Sparkles size={20} />
          <span>Creator subscription</span>
          <strong>Required</strong>
          <small>Payment integration connects here.</small>
        </div>
      </div>

      <div className="creator-grid">
        <form onSubmit={add} className="card creator-form">
          <div className="eyebrow"><UploadCloud size={15} /> SUBMIT VIDEO</div>
          <h3>Promote a video</h3>
          <label>Title<input required value={form.title} onChange={e => setForm({...form, title:e.target.value})} /></label>
          <label>YouTube URL<input required value={form.youtubeUrl} onChange={e => setForm({...form, youtubeUrl:e.target.value})} /></label>
          <label>Description<textarea value={form.description} onChange={e => setForm({...form, description:e.target.value})} /></label>
          <label>Viewer reward points<input type="number" min="1" value={form.rewardPoints} onChange={e => setForm({...form, rewardPoints:Number(e.target.value)})} /></label>
          <label>Minimum watch percentage<input type="number" min="1" max="100" value={form.minimumWatchPercent} onChange={e => setForm({...form, minimumWatchPercent:Number(e.target.value)})} /></label>
          <button className="button" type="submit"><Play size={17} /> Submit video</button>
          {message && <p className={message.includes("successfully") ? "success" : "error"}>{message}</p>}
        </form>

        <div className="creator-benefits">
          <div className="card"><Coins size={20} /><h3>Choose your reward</h3><p className="muted">Set how many points an eligible viewer receives for completing the required watch level.</p></div>
          <div className="card"><Megaphone size={20} /><h3>Promote your content</h3><p className="muted">Give viewers a clear reason to discover your videos through the Videa library.</p></div>
          <div className="card"><Sparkles size={20} /><h3>Subscription model</h3><p className="muted">Creator access will be tied to an active subscription and payment status.</p></div>
        </div>
      </div>
    </section>
  );
}