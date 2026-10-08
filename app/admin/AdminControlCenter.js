"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, CheckCircle2, Eye, Film, PauseCircle,
  PlayCircle, RefreshCw, Search, ShieldAlert, Users
} from "lucide-react";

const number = (value) => Number(value || 0).toLocaleString();

export default function AdminControlCenter() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("overview");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/admin/control-center", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load control center.");
      setData(result);
    } catch (e) {
      setError(e.message || "Could not load control center.");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function act(id, action, extra = {}) {
    const label = action === "suspend-user" ? "suspend this user" :
      action === "activate-user" ? "reactivate this user" :
      extra.active ? "activate this video" : "pause this video";
    if (!window.confirm("Are you sure you want to " + label + "?")) return;
    setBusy(id);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/control-center", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, ...extra })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Action failed.");
      setMessage(action === "toggle-video" ? (extra.active ? "Video activated." : "Video paused.") :
        action === "suspend-user" ? "User suspended." : "User reactivated.");
      await load();
    } catch (e) {
      setError(e.message || "Action failed.");
    } finally {
      setBusy("");
    }
  }

  const filteredUsers = useMemo(() => (data?.users || []).filter((user) =>
    [user.name, user.email, user.role, user.status].join(" ").toLowerCase().includes(query.toLowerCase())
  ), [data, query]);
  const filteredVideos = useMemo(() => (data?.videos || []).filter((video) =>
    [video.title, video.youtubeUrl].join(" ").toLowerCase().includes(query.toLowerCase())
  ), [data, query]);

  return (
    <section className="control-center">
      <div className="control-center-head">
        <div>
          <div className="eyebrow">VIDEA ADMINISTRATION</div>
          <h1>Control center</h1>
          <p>Monitor platform activity, manage accounts, and moderate videos.</p>
        </div>
        <button type="button" className="button control-refresh" onClick={load} disabled={busy !== ""}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && <p className="control-message error" role="alert">{error}</p>}
      {message && <p className="control-message success" role="status">{message}</p>}

      {!data ? (
        <div className="card control-loading">Loading admin data…</div>
      ) : (
        <>
          <div className="control-stat-grid">
            <article className="card control-stat"><span><Users size={16}/> Registered users</span><strong>{number(data.stats.usersCount)}</strong></article>
            <article className="card control-stat"><span><Film size={16}/> Active videos</span><strong>{number(data.stats.activeVideoCount)} <small>/ {number(data.stats.videoCount)}</small></strong></article>
            <article className="card control-stat"><span><Activity size={16}/> Rewards in 24 hours</span><strong>{number(data.stats.rewards24h)}</strong><small>{number(data.stats.pointsIssued24h)} points issued</small></article>
            <article className="card control-stat"><span><ShieldAlert size={16}/> Pending reviews</span><strong>{number(data.stats.pendingDeposits + data.stats.pendingWithdrawals + data.stats.pendingSubscriptions)}</strong><small>Deposits, withdrawals, subscriptions</small></article>
          </div>

          <div className="control-tabs" role="tablist" aria-label="Admin sections">
            <button type="button" className={tab === "overview" ? "active" : ""} onClick={() => { setTab("overview"); setQuery(""); }}>Overview</button>
            <button type="button" className={tab === "users" ? "active" : ""} onClick={() => { setTab("users"); setQuery(""); }}>Users <span>{number(data.stats.usersCount)}</span></button>
            <button type="button" className={tab === "videos" ? "active" : ""} onClick={() => { setTab("videos"); setQuery(""); }}>Videos <span>{number(data.stats.videoCount)}</span></button>
            <button type="button" className={tab === "reviews" ? "active" : ""} onClick={() => { setTab("reviews"); setQuery(""); }}>Activity review <span>{data.flags.length}</span></button>
          </div>

          {tab === "overview" && (
            <div className="control-overview-grid">
              <article className="card control-overview-card">
                <div className="control-card-title"><div><h2>Needs attention</h2><p>Requests waiting for an administrator</p></div><Eye size={20}/></div>
                <div className="control-queue-row"><span>Wallet deposits</span><strong>{number(data.stats.pendingDeposits)}</strong></div>
                <div className="control-queue-row"><span>Withdrawals</span><strong>{number(data.stats.pendingWithdrawals)}</strong></div>
                <div className="control-queue-row"><span>Creator subscriptions</span><strong>{number(data.stats.pendingSubscriptions)}</strong></div>
                <p className="control-hint">Use the Payment center below to approve or reject payment requests.</p>
              </article>
              <article className="card control-overview-card">
                <div className="control-card-title"><div><h2>Activity review</h2><p>Accounts with unusually high reward volume</p></div><AlertTriangle size={20}/></div>
                {data.flags.length ? data.flags.slice(0, 5).map((flag) => (
                  <div className="control-flag-row" key={flag.userId}>
                    <div><strong>{flag.userName}</strong><small>{flag.rewardCount} rewards · {number(flag.points)} points in 24h</small></div>
                    <span className="control-flag-pill">Review</span>
                  </div>
                )) : <p className="control-hint">No high-volume reward flags currently meet the review threshold.</p>}
                <button type="button" className="control-text-button" onClick={() => setTab("reviews")}>Review flagged activity →</button>
              </article>
            </div>
          )}

          {tab === "users" && (
            <div className="card control-list-card">
              <div className="control-list-head"><div><h2>User management</h2><p>Showing the 100 most recently registered accounts.</p></div><label className="control-search"><Search size={16}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, role…" /></label></div>
              <div className="control-table-wrap"><table className="control-table"><thead><tr><th>User</th><th>Role</th><th>Points</th><th>Status</th><th>Joined</th><th>Action</th></tr></thead><tbody>
                {filteredUsers.map((user) => <tr key={user.id}>
                  <td><strong>{user.name}</strong><small>{user.email}</small></td>
                  <td>{user.role}</td><td>{number(user.points)}</td>
                  <td><span className={"control-status " + (user.status === "suspended" ? "suspended" : "active")}>{user.status || "active"}</span></td>
                  <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</td>
                  <td>{user.role === "admin" ? <span className="control-muted">Protected</span> : <button type="button" className="control-action-button" disabled={busy === user.id} onClick={() => act(user.id, user.status === "suspended" ? "activate-user" : "suspend-user")}>{user.status === "suspended" ? "Reactivate" : "Suspend"}</button>}</td>
                </tr>)}
                {!filteredUsers.length && <tr><td colSpan="6">No matching users.</td></tr>}
              </tbody></table></div>
            </div>
          )}

          {tab === "videos" && (
            <div className="card control-list-card">
              <div className="control-list-head"><div><h2>Video moderation</h2><p>Pause a video to remove it from active listings, or reactivate it.</p></div><label className="control-search"><Search size={16}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search videos…" /></label></div>
              <div className="control-video-list">
                {filteredVideos.map((video) => <article className="control-video-row" key={video.id}>
                  <div className="control-video-icon"><Film size={19}/></div>
                  <div className="control-video-info"><strong>{video.title}</strong><a href={video.youtubeUrl} target="_blank" rel="noreferrer">Open YouTube video ↗</a><small>{number(video.rewardPoints)} points · minimum watch {video.minimumWatchPercent}%</small></div>
                  <span className={"control-status " + (video.active ? "active" : "suspended")}>{video.active ? "Active" : "Paused"}</span>
                  <button type="button" className="control-action-button" disabled={busy === video.id} onClick={() => act(video.id, "toggle-video", { active: !video.active })}>{video.active ? <><PauseCircle size={15}/> Pause</> : <><PlayCircle size={15}/> Activate</>}</button>
                </article>)}
                {!filteredVideos.length && <p className="control-hint">No matching videos.</p>}
              </div>
            </div>
          )}

          {tab === "reviews" && (
            <div className="card control-list-card">
              <div className="control-list-head"><div><h2>Activity review queue</h2><p>Flags are based on reward volume and need human review; they do not prove abuse.</p></div></div>
              {data.flags.length ? <div className="control-video-list">{data.flags.map((flag) => <article className="control-flag-card" key={flag.userId}>
                <div className="control-video-icon"><AlertTriangle size={19}/></div>
                <div className="control-video-info"><strong>{flag.userName}</strong><small>{flag.email}</small><small>{flag.reason}</small><small>{number(flag.rewardCount)} rewards · {number(flag.points)} points in the last 24 hours</small></div>
                <span className={"control-status " + (flag.status === "suspended" ? "suspended" : "active")}>{flag.status}</span>
                {flag.role === "admin" ? <span className="control-muted">Protected</span> : <button type="button" className="control-action-button" disabled={busy === flag.userId} onClick={() => act(flag.userId, flag.status === "suspended" ? "activate-user" : "suspend-user")}>{flag.status === "suspended" ? "Reactivate" : "Suspend user"}</button>}
              </article>)}</div> : <div className="control-empty"><CheckCircle2 size={25}/><strong>No flags right now</strong><span>Accounts that reach the review threshold will appear here.</span></div>}
            </div>
          )}
        </>
      )}
    </section>
  );
}
