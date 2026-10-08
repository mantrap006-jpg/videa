"use client";

import { useEffect, useRef, useState } from "react";
import { Coins, Megaphone, Play, Sparkles, UploadCloud } from "lucide-react";

function extractYouTubeId(input) {
  try {
    const url = new URL(input);
    const host = url.hostname.replace("www.", "");

    if (host === "youtu.be") {
      return url.pathname.slice(1).split("/")[0] || null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") return url.searchParams.get("v");
      if (url.pathname.startsWith("/shorts/")) return url.pathname.split("/")[2];
      if (url.pathname.startsWith("/embed/")) return url.pathname.split("/")[2];
    }
  } catch {}

  return null;
}

export default function CreatorClient() {
  const [form, setForm] = useState({
    title: "",
    youtubeUrl: "",
    description: "",
    durationSeconds: 600,
    pointsPerMinute: 1,
    minimumWatchPercent: 80
  });
  const [message, setMessage] = useState("");
  const [durationStatus, setDurationStatus] = useState("Enter a YouTube URL to detect duration.");
  const playerRef = useRef(null);
  const playerInstanceRef = useRef(null);
  const detectedVideoIdRef = useRef(null);

  useEffect(() => {
    const videoId = extractYouTubeId(form.youtubeUrl);

    if (!videoId) {
      detectedVideoIdRef.current = null;
      setDurationStatus("Enter a valid YouTube URL to detect duration.");
      return;
    }

    if (detectedVideoIdRef.current === videoId) return;
    detectedVideoIdRef.current = videoId;

    let cancelled = false;

    function createPlayer() {
      if (cancelled || !playerRef.current || !window.YT?.Player) return;

      if (playerInstanceRef.current) {
        try {
          playerInstanceRef.current.destroy();
        } catch {}
      }

      setDurationStatus("Detecting video duration...");

      playerInstanceRef.current = new window.YT.Player(playerRef.current, {
        videoId,
        width: "1",
        height: "1",
        playerVars: {
          autoplay: 0,
          controls: 0,
          rel: 0
        },
        events: {
          onReady: event => {
            const duration = Math.round(event.target.getDuration() || 0);

            if (duration > 0) {
              setForm(current => ({
                ...current,
                durationSeconds: duration
              }));
              setDurationStatus(
                `Auto-detected: ${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")}`
              );
            } else {
              setDurationStatus("Could not detect duration. You can enter it manually.");
            }
          },
          onError: () => {
            setDurationStatus("Could not detect duration. You can enter it manually.");
          }
        }
      });
    }

    if (window.YT?.Player) {
      createPlayer();
      return () => {
        cancelled = true;
      };
    }

    const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');

    if (!existing) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.body.appendChild(script);
    }

    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      createPlayer();
    };

    return () => {
      cancelled = true;
      if (window.onYouTubeIframeAPIReady === createPlayer) {
        window.onYouTubeIframeAPIReady = previousReady;
      }
    };
  }, [form.youtubeUrl]);

  async function add(e) {
    e.preventDefault();
    setMessage("");

    if (!form.durationSeconds || form.durationSeconds <= 0) {
      setMessage("Please enter a valid video duration.");
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
          ? "Video submitted successfully."
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
            Creators can subscribe to Videa, submit approved YouTube content,
            choose a viewer reward, and grow their reach.
          </p>
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

          <label>
            Title
            <input
              required
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />
          </label>

          <label>
            YouTube URL
            <input
              required
              value={form.youtubeUrl}
              placeholder="https://www.youtube.com/watch?v=..."
              onChange={e => setForm({ ...form, youtubeUrl: e.target.value })}
            />
          </label>

          <div ref={playerRef} aria-hidden="true" style={{ width: 1, height: 1, overflow: "hidden" }} />

          <label>
            Video duration (minutes)
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={(form.durationSeconds / 60).toFixed(1)}
              onChange={e =>
                setForm({
                  ...form,
                  durationSeconds: Math.max(1, Number(e.target.value) * 60)
                })
              }
            />
          </label>

          <p className="muted duration-status">{durationStatus}</p>

          <label>
            Description
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </label>

          <label>
            Viewer points per minute
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={form.pointsPerMinute}
              onChange={e =>
                setForm({
                  ...form,
                  pointsPerMinute: Math.max(0.1, Number(e.target.value))
                })
              }
            />
          </label>

          <p className="muted reward-preview">
            Estimated full-video reward:{" "}
            <strong>
              {Math.floor(
                (form.durationSeconds / 60) * form.pointsPerMinute
              )}{" "}
              points
            </strong>
          </p>

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

          <button className="button" type="submit">
            <Play size={17} /> Submit video
          </button>

          {message && (
            <p className={message.includes("successfully") ? "success" : "error"}>
              {message}
            </p>
          )}
        </form>

        <div className="creator-benefits">
          <div className="card">
            <Coins size={20} />
            <h3>Choose your reward</h3>
            <p className="muted">
              Set a points-per-minute rate. Videa calculates the reward from
              the detected video duration.
            </p>
          </div>

          <div className="card">
            <Megaphone size={20} />
            <h3>Promote your content</h3>
            <p className="muted">
              Give viewers a clear reason to discover your videos through the
              Videa library.
            </p>
          </div>

          <div className="card">
            <Sparkles size={20} />
            <h3>Subscription model</h3>
            <p className="muted">
              Creator access will be tied to an active subscription and
              payment status.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
