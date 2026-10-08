"use client";

import { useState } from "react";

export default function Admin() {
  const [form, setForm] = useState({
    title: "",
    youtubeUrl: "",
    description: "",
    rewardPoints: 10,
    minimumWatchPercent: 80
  });
  const [message, setMessage] = useState("");

  async function add(e) {
    e.preventDefault();
    setMessage("");

    try {
      const res = await fetch("/api/admin/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      setMessage(res.ok ? "Video added successfully." : (data.error || "Could not add video."));
    } catch {
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <section className="form admin-form">
      <div className="eyebrow">ADMINISTRATION</div>
      <h2>Add a video</h2>
      <p className="muted">This area is for authorized Videa administrators.</p>
      <form onSubmit={add} className="card">
        <label>Title<input required value={form.title} onChange={e => setForm({...form, title:e.target.value})} /></label>
        <label>YouTube URL<input required value={form.youtubeUrl} onChange={e => setForm({...form, youtubeUrl:e.target.value})} /></label>
        <label>Description<textarea value={form.description} onChange={e => setForm({...form, description:e.target.value})} /></label>
        <label>Reward points<input type="number" min="0" value={form.rewardPoints} onChange={e => setForm({...form, rewardPoints:Number(e.target.value)})} /></label>
        <label>Minimum watch percentage<input type="number" min="1" max="100" value={form.minimumWatchPercent} onChange={e => setForm({...form, minimumWatchPercent:Number(e.target.value)})} /></label>
        <button className="button">Add video</button>
        {message && <p className={message.includes("successfully") ? "success" : "error"}>{message}</p>}
      </form>
    </section>
  );
}