"use client";

import { useState } from "react";
import { Coins, Megaphone, Play, Sparkles, UploadCloud, CheckCircle2, LockKeyhole } from "lucide-react";

export default function CreatorClient({ subscriptionActive = false, subscriptionExpiresAt = null }) {
  const [form, setForm] = useState({
    title: "",
    youtubeUrl: "",
    description: "",
    minimumWatchPercent: 80
  });
  const [message, setMessage] = useState("");
  const [metadataStatus, setMetadataStatus] = useState("");
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  async function fetchYouTubeDetails() {
    const url = form.youtubeUrl.trim();
    if (!url) return;
    setLoadingMetadata(true);
    setMetadataStatus("");
    try {
      const res = await fetch("/api/creator/youtube-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeUrl: url })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not retrieve YouTube details.");
      setForm(current => ({
        ...current,
        title: data.title || "",
        description: data.description ?? ""
      }));
      setMetadataStatus("Title and description loaded from YouTube.");
    } catch (error) {
      setMetadataStatus(error.message || "Could not retrieve YouTube details. Check the link and try again.");
    } finally {
      setLoadingMetadata(false);
    }
  }

  async function add(e) {
    e.preventDefault();
    setMessage("");
    if (!subscriptionActive) {
      setMessage("An active Creator subscription is required. Please activate your subscription first.");
      return;
    }
    if (!form.title.trim()) {
      setMessage("Enter a valid YouTube URL so Videa can retrieve the title and description.");
      return;
    }

    try {
      const res = await fetch("/api/creator/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      setMessage(
        res.ok
          ? "Video submitted successfully. Videa verified the video details and duration."
          : (data.error || "Could not submit video.")
      );
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
          <p className="muted">
            Creators can submit YouTube content and grow their reach with an active subscription.
          </p>
        </div>

        <div className="creator-plan">
          {subscriptionActive ? <CheckCircle2 size={20} /> : <LockKeyhole size={20} />}
          <span>Creator subscription</span>
          <strong>{subscriptionActive ? "Active" : "Required"}</strong>
          <small>
            {subscriptionActive
              ? subscriptionExpiresAt
                ? `Active until ${new Date(subscriptionExpiresAt).toLocaleDateString()}`
                : "Your creator subscription is active."
              : "Activate your subscription to submit videos."}
          </small>
          <a className="button" href="/subscription">
            {subscriptionActive ? "Manage subscription" : "View subscription"}
          </a>
        </div>
      </div>

      <div className="creator-grid">
        <form onSubmit={add} className="card creator-form">
          <div className="eyebrow"><UploadCloud size={15} /> SUBMIT VIDEO</div>
          <h3>Promote a video</h3>

          {!subscriptionActive && (
            <div className="error" role="status">
              An active Creator subscription is required before you can submit a video.
              <a href="/subscription"> View subscription</a>
            </div>
          )}

          <label>
            Title (from YouTube)
            <input
              required
              value={form.title}
              readOnly
              disabled
              placeholder="Automatically retrieved from YouTube"
            />
          </label>

          <label>
            YouTube URL
            <input
              required
              value={form.youtubeUrl}
              placeholder="https://www.youtube.com/watch?v=..."
              onChange={e => {
                setForm({ ...form, youtubeUrl: e.target.value, title: "", description: "" });
                setMetadataStatus("");
              }}
              onBlur={fetchYouTubeDetails}
            />
            <p className="muted duration-status">
              {loadingMetadata ? "Retrieving title and description from YouTube…" : "Paste a YouTube link. The title and description are retrieved automatically and cannot be edited."}
            </p>
            {metadataStatus && <p className={metadataStatus.startsWith("Title and description loaded") ? "success" : "error"}>{metadataStatus}</p>}
          </label>

          <p className="muted duration-status">
            Video duration and reward points are verified and calculated automatically by Videa.
          </p>

          <label>
            Description (from YouTube)
            <textarea
              value={form.description}
              readOnly
              disabled
              placeholder="Automatically retrieved from YouTube"
              rows={4}
            />
          </label>

          <label>
            Minimum watch percentage
            <input
              type="number"
              min="1"
              max="100"
              value={form.minimumWatchPercent}
              onChange={e =>
                setForm({
                  ...form,
                  minimumWatchPercent: Number(e.target.value)
                })
              }
            />
          </label>

          <button className="button" type="submit" disabled={!subscriptionActive || loadingMetadata}>
            <Play size={17} /> {subscriptionActive ? "Submit video" : "Subscription required"}
          </button>

          {message && (
            <p className={message.includes("successfully") ? "success" : "error"} role="status">
              {message}
            </p>
          )}
        </form>

        <div className="creator-benefits">
          <div className="card">
            <Coins size={20} />
            <h3>Automatic rewards</h3>
            <p className="muted">
              Videa calculates viewer rewards using the verified YouTube video duration and platform reward rate.
            </p>
          </div>

          <div className="card">
            <Megaphone size={20} />
            <h3>Promote your content</h3>
            <p className="muted">
              Give viewers a clear reason to discover your videos through the Videa library.
            </p>
          </div>

          <div className="card">
            <Sparkles size={20} />
            <h3>Subscription access</h3>
            <p className="muted">
              Video submissions are available only while your Creator subscription is active.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
