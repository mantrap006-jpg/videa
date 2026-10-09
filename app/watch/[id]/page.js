"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

function formatTime(value) {
  const seconds = Math.max(0, Math.floor(Number(value) || 0));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function WatchPage() {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [percent, setPercent] = useState(0);
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [message, setMessage] = useState("Loading video...");
  const [rewarded, setRewarded] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const playerHost = useRef(null);
  const rewardedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setVideo(null);
    setPercent(0);
    setWatchedSeconds(0);
    setRewarded(false);
    rewardedRef.current = false;
    setVideoEnded(false);
    setMessage("Loading video...");
    fetch("/api/videos/" + id, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Video not found.");
        if (!cancelled && data.video) setVideo(data.video);
        else if (!cancelled) setMessage(data.error || "Video not found.");
      })
      .catch((error) => { if (!cancelled) setMessage(error.message || "Could not load video."); });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!video || !id || !playerHost.current) return;
    let disposed = false;
    let player = null;
    let heartbeatTimer = null;
    let apiRetryTimer = null;
    let initialized = false;

    const sendHeartbeat = async (isPlaying) => {
      if (disposed || !player || typeof player.getCurrentTime !== "function") return;
      let currentTime = 0;
      try { currentTime = player.getCurrentTime(); } catch { return; }
      try {
        const response = await fetch("/api/watch-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId: id, isPlaying, currentTime })
        });
        const data = await response.json();
        if (disposed) return;
        if (!response.ok) {
          setMessage(data.error || "Could not verify watch progress.");
          return;
        }
        setPercent(Number(data.watchedPercent || 0));
        setWatchedSeconds(Number(data.watchedSeconds || 0));
        if (data.rewarded) {
          rewardedRef.current = true;
          setRewarded(true);
          setMessage(data.message || `Reward received: +${data.points} points`);
        } else {
          setMessage(data.message || "Watch progress is being verified by Videa's server.");
        }
      } catch {
        if (!disposed) setMessage("Connection interrupted. Videa will retry watch verification.");
      }
    };

    const initPlayer = () => {
      if (disposed || initialized || !playerHost.current || !window.YT?.Player) return;
      initialized = true;
      player = new window.YT.Player(playerHost.current, {
        videoId: video.youtubeId,
        playerVars: { enablejsapi: 1, origin: window.location.origin, rel: 0 },
        events: {
          onReady: () => {
            if (disposed) return;
            setMessage("Video ready. Play it to begin server-verified watch tracking.");
            heartbeatTimer = window.setInterval(() => {
              if (player?.getPlayerState?.() === window.YT.PlayerState.PLAYING) sendHeartbeat(true);
            }, 5000);
          },
          onStateChange: (event) => {
            if (disposed) return;
            const state = event.data;
            setPlaying(state === window.YT.PlayerState.PLAYING);
            if (state === window.YT.PlayerState.ENDED) {
              sendHeartbeat(true).finally(() => {
                if (!disposed) {
                  setVideoEnded(true);
                  setPlaying(false);
                  setMessage(rewardedRef.current
                    ? "Video finished. Your reward is saved in your Videa wallet."
                    : "Video finished. Your verified watch time is saved; the reward is issued only after the required percentage is reached.");
                }
              });
            }
          },
          onError: () => {
            if (!disposed) setMessage("YouTube could not play this video. It may be private, removed, or embedding may be disabled.");
          }
        }
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      let script = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (!script) {
        script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.async = true;
        document.head.appendChild(script);
      }
      const previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof previousReady === "function") previousReady();
        initPlayer();
      };
      apiRetryTimer = window.setInterval(() => {
        if (window.YT?.Player) {
          window.clearInterval(apiRetryTimer);
          initPlayer();
        }
      }, 250);
      window.setTimeout(() => {
        if (apiRetryTimer) window.clearInterval(apiRetryTimer);
      }, 15000);
    }

    return () => {
      disposed = true;
      if (heartbeatTimer) window.clearInterval(heartbeatTimer);
      if (apiRetryTimer) window.clearInterval(apiRetryTimer);
      try { player?.destroy?.(); } catch {}
    };
  }, [video, id]);

  if (!video) return <section><p>{message}</p></section>;

  return (
    <section>
      <h2>{video.title}</h2>
      <div className="video-wrap">
        <div ref={playerHost} title={video.title} />
      </div>
      <div className="card" style={{ marginTop: 18 }}>
        <p>Verified watch progress: <strong>{percent}%</strong></p>
        <div className="security-score-track" role="progressbar" aria-valuenow={percent} aria-valuemin="0" aria-valuemax="100" aria-label="Verified watch progress">
          <span style={{ width: percent + "%" }} />
        </div>
        <p>Verified watch time: <strong>{formatTime(watchedSeconds)}</strong>{video.durationSeconds > 0 ? ` / ${formatTime(video.durationSeconds)}` : ""}</p>
        <p role="status">{videoEnded ? "Video finished. " : playing ? "Playing — watch time is being checked by the server. " : ""}{message}</p>
        <p className="muted">Reward: {video.rewardPoints} points after {video.minimumWatchPercent}% verified watch time.</p>
        {rewarded && <p className="success">Reward saved: +{video.rewardPoints} points.</p>}
      </div>
    </section>
  );
}
