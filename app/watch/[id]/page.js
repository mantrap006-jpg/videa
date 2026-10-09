"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

function formatTime(value) {
  const seconds = Math.max(0, Math.floor(Number(value) || 0));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function loadGoogleOAuth() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve();
    let script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (!script) {
      script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", () => window.google?.accounts?.oauth2 ? resolve() : reject(new Error("Google authorization could not load.")), { once: true });
    script.addEventListener("error", () => reject(new Error("Could not load Google authorization.")), { once: true });
    if (window.google?.accounts?.oauth2) resolve();
  });
}

export default function WatchPage() {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [percent, setPercent] = useState(0);
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [message, setMessage] = useState("Preparing your video...");
  const [rewarded, setRewarded] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState("loading");
  const [subscriptionMessage, setSubscriptionMessage] = useState("Detecting the video's YouTube channel...");
  const [verifyingSubscription, setVerifyingSubscription] = useState(false);
  const playerHost = useRef(null);
  const rewardedRef = useRef(false);
  const verifyingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setVideo(null);
    setPercent(0);
    setWatchedSeconds(0);
    setRewarded(false);
    rewardedRef.current = false;
    setVideoEnded(false);
    setPlaying(false);
    setSubscriptionStatus("loading");
    setSubscriptionMessage("Detecting the video's YouTube channel...");
    setMessage("Preparing your video...");

    async function loadVideo() {
      try {
        const response = await fetch("/api/videos/" + encodeURIComponent(id), { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Video not found.");
        if (cancelled || !data.video) return;
        setVideo(data.video);
        setSubscriptionMessage("Checking whether your subscription has already been verified...");
        const statusResponse = await fetch("/api/youtube-subscription?videoId=" + encodeURIComponent(id), { cache: "no-store" });
        const statusData = await statusResponse.json();
        if (cancelled) return;
        if (statusResponse.status === 401) {
          setSubscriptionStatus("login-required");
          setSubscriptionMessage("Log in to Videa before watching and earning points.");
        } else if (statusResponse.ok && statusData.subscribed) {
          setSubscriptionStatus("verified");
          setSubscriptionMessage("Subscription verified. You can watch and earn.");
        } else {
          setSubscriptionStatus("needs-check");
          setSubscriptionMessage("Connect YouTube to check whether you are already subscribed. You will not need to subscribe again if you already are.");
        }
      } catch (error) {
        if (!cancelled) {
          setSubscriptionStatus("error");
          setSubscriptionMessage(error.message || "Could not load this video.");
          setMessage(error.message || "Could not load this video.");
        }
      }
    }
    if (id) loadVideo();
    return () => { cancelled = true; };
  }, [id]);

  const verifySubscription = useCallback(async (accessToken) => {
    const response = await fetch("/api/youtube-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId: id, accessToken })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Subscription verification failed.");
    if (data.subscribed) {
      setSubscriptionStatus("verified");
      setSubscriptionMessage(data.message || "Subscription verified. You can watch and earn.");
      setMessage("Ready to watch. Videa will verify your watch progress.");
    } else {
      setSubscriptionStatus("not-subscribed");
      setSubscriptionMessage(data.message || "Subscribe to the channel, then check again.");
    }
  }, [id]);

  const handleVerifySubscription = useCallback(async () => {
    if (verifyingRef.current) return;
    verifyingRef.current = true;
    setVerifyingSubscription(true);
    setSubscriptionMessage("Opening secure Google authorization...");
    try {
      await loadGoogleOAuth();
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) throw new Error("Google sign-in is not configured for this website.");
      await new Promise((resolve, reject) => {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "https://www.googleapis.com/auth/youtube.readonly",
          include_granted_scopes: true,
          callback: async (tokenResponse) => {
            if (tokenResponse?.error) {
              reject(new Error(tokenResponse.error_description || "Google authorization was cancelled."));
              return;
            }
            if (!tokenResponse?.access_token) {
              reject(new Error("Google did not return YouTube access. Please try again."));
              return;
            }
            try {
              await verifySubscription(tokenResponse.access_token);
              resolve();
            } catch (error) {
              reject(error);
            }
          },
          error_callback: (error) => reject(new Error(error?.message || "Google authorization could not be opened."))
        });
        tokenClient.requestAccessToken({ prompt: "" });
      });
    } catch (error) {
      setSubscriptionStatus("error");
      setSubscriptionMessage(error.message || "Could not verify your YouTube subscription.");
    } finally {
      verifyingRef.current = false;
      setVerifyingSubscription(false);
    }
  }, [verifySubscription]);

  useEffect(() => {
    if (!video || !id || subscriptionStatus !== "verified" || !playerHost.current) return;
    let disposed = false;
    let player = null;
    let heartbeatTimer = null;
    let apiRetryTimer = null;
    let apiTimeoutTimer = null;
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
          if (data.subscriptionRequired) {
            setSubscriptionStatus("needs-check");
            setSubscriptionMessage("Please verify your YouTube subscription again before earning.");
            setMessage(data.error || "Subscription verification is required.");
            try { player?.pauseVideo?.(); } catch {}
            return;
          }
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
          setMessage(data.message || "Videa is securely verifying your watch progress.");
        }
      } catch {
        if (!disposed) setMessage("Connection interrupted. Videa will retry watch verification.");
      }
    };

    const initPlayer = () => {
      if (disposed || initialized || !playerHost.current || !window.YT?.Player) return;
      initialized = true;
      if (apiRetryTimer) window.clearInterval(apiRetryTimer);
      if (apiTimeoutTimer) window.clearTimeout(apiTimeoutTimer);
      player = new window.YT.Player(playerHost.current, {
        videoId: video.youtubeId,
        playerVars: { enablejsapi: 1, origin: window.location.origin, rel: 0 },
        events: {
          onReady: () => {
            if (disposed) return;
            setMessage("Video ready. Play it to start server-verified watch tracking.");
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
                    : "Video finished. Your reward is issued after the required verified watch percentage is reached.");
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
        if (window.YT?.Player) initPlayer();
      }, 250);
      apiTimeoutTimer = window.setTimeout(() => {
        if (apiRetryTimer) window.clearInterval(apiRetryTimer);
        if (!disposed && !initialized) setMessage("YouTube player is taking too long to load. Refresh and try again.");
      }, 15000);
    }

    return () => {
      disposed = true;
      if (heartbeatTimer) window.clearInterval(heartbeatTimer);
      if (apiRetryTimer) window.clearInterval(apiRetryTimer);
      if (apiTimeoutTimer) window.clearTimeout(apiTimeoutTimer);
      try { player?.destroy?.(); } catch {}
    };
  }, [video, id, subscriptionStatus]);

  if (!video) {
    return <main className="watch-page"><div className="watch-loading card"><span className="watch-spinner" /><h2>Preparing your watch room</h2><p>{message}</p></div></main>;
  }

  const verified = subscriptionStatus === "verified";
  const needsSubscribe = subscriptionStatus === "not-subscribed";

  return (
    <main className="watch-page">
      <header className="watch-page-header">
        <div>
          <div className="eyebrow">VIDEA WATCH STUDIO</div>
          <h1>Watch. <span>Earn.</span></h1>
          <p>Your progress is checked securely, and eligible rewards are recorded in your Videa wallet.</p>
        </div>
        <div className="watch-live-pill"><span /> {verified ? "SUBSCRIPTION VERIFIED" : "SUBSCRIPTION CHECK REQUIRED"}</div>
      </header>

      <div className="watch-layout">
        <section className="watch-main-column">
          <article className="watch-player-card card">
            {verified ? (
              <div className="watch-player-frame"><div ref={playerHost} title={video.title} /></div>
            ) : (
              <div className="watch-locked-player">
                <div className="watch-lock-icon">▶</div>
                <span className="eyebrow">WATCH ACCESS</span>
                <h2>Unlock this video</h2>
                <p>Verify your subscription to this creator's YouTube channel first. If you already subscribed, simply verify it — no need to subscribe again.</p>
              </div>
            )}
            <div className="watch-video-details">
              <div className="watch-video-title-row">
                <div>
                  <span className="watch-content-label">FEATURED VIDEO</span>
                  <h2>{video.title}</h2>
                </div>
                <span className={verified ? "watch-status-badge ready" : "watch-status-badge"}>{verified ? "Ready to watch" : "Locked"}</span>
              </div>
              {video.description ? <p className="watch-description">{video.description}</p> : null}
              <div className="watch-channel-row">
                {video.channelThumbnail ? <img src={video.channelThumbnail} alt="" className="watch-channel-avatar" /> : <div className="watch-channel-avatar watch-channel-placeholder">▶</div>}
                <div className="watch-channel-meta">
                  <strong>{video.channelTitle || "YouTube channel"}</strong>
                  <span>Detected automatically from YouTube</span>
                </div>
                <a className="watch-channel-link" href={video.channelUrl || "https://www.youtube.com"} target="_blank" rel="noreferrer">View channel ↗</a>
              </div>
            </div>
          </article>

          <section className="watch-progress-card card">
            <div className="watch-section-heading">
              <div><span className="eyebrow">YOUR SESSION</span><h2>Watch progress</h2></div>
              <span className="watch-percent">{percent}%</span>
            </div>
            <div className="watch-progress-track" role="progressbar" aria-valuenow={percent} aria-valuemin="0" aria-valuemax="100" aria-label="Verified watch progress"><span style={{ width: percent + "%" }} /></div>
            <div className="watch-progress-meta"><span>{formatTime(watchedSeconds)} watched{video.durationSeconds > 0 ? ` / ${formatTime(video.durationSeconds)}` : ""}</span><span>{video.minimumWatchPercent}% required</span></div>
            <div className="watch-feedback" role="status"><span className={playing ? "watch-feedback-dot active" : "watch-feedback-dot"} />{verified && playing ? "Playing — watch time is being checked by the server." : message}</div>
            {videoEnded && <p className="watch-finished-note">Video finished. Your verified progress has been updated.</p>}
          </section>
        </section>

        <aside className="watch-sidebar">
          <section className="watch-subscription-card card">
            <div className="watch-card-icon">✓</div>
            <span className="eyebrow">STEP 1 · CHANNEL CHECK</span>
            <h2>{verified ? "You're all set" : needsSubscribe ? "Subscribe to unlock" : "Check your subscription"}</h2>
            <p>{subscriptionMessage}</p>
            {!verified && (
              <>
                {needsSubscribe && <a className="button watch-subscribe-button" href={video.channelUrl || "https://www.youtube.com"} target="_blank" rel="noreferrer">Subscribe on YouTube ↗</a>}
                <button className="button watch-verify-button" onClick={handleVerifySubscription} disabled={verifyingSubscription || subscriptionStatus === "loading" || subscriptionStatus === "login-required"}>
                  {verifyingSubscription ? "Checking with Google…" : needsSubscribe ? "I've subscribed — check again" : "Verify with Google"}
                </button>
                {subscriptionStatus === "login-required" && <a className="button watch-verify-button" href="/auth">Log in to Videa</a>}
              </>
            )}
            {verified && <div className="watch-verified-line">✓ You can watch and earn points</div>}
            <div className="watch-privacy-note">Videa checks subscription status securely. It does not subscribe on your behalf.</div>
          </section>

          <section className="watch-reward-card card">
            <span className="eyebrow">STEP 2 · EARN REWARDS</span>
            <div className="watch-reward-amount"><span>✦</span><strong>{video.rewardPoints}</strong><small>UP TO POINTS</small></div>
            <p>Available after at least {video.minimumWatchPercent}% verified watch time. Daily limits may reduce the final reward.</p>
            <div className="watch-reward-divider" />
            <div className="watch-reward-row"><span>Minimum watch</span><strong>{video.minimumWatchPercent}%</strong></div>
            <div className="watch-reward-row"><span>Current progress</span><strong>{percent}%</strong></div>
            <div className="watch-reward-row"><span>Reward status</span><strong className={rewarded ? "watch-reward-earned" : ""}>{rewarded ? "Earned ✓" : verified ? "In progress" : "Locked"}</strong></div>
            {rewarded && <div className="watch-earned-banner">✓ Reward saved to your Videa wallet</div>}
          </section>

          <section className="watch-safety-note">
            <span>🔒</span><p><strong>Fair-play tracking</strong><br />Only server-verified watch time counts toward eligible rewards.</p>
          </section>
        </aside>
      </div>
    </main>
  );
}
