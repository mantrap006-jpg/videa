"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, CheckCircle2, Eye, Film, PauseCircle,
  PlayCircle, RefreshCw, Search, ShieldAlert, Users, Settings, Save
} from "lucide-react";

const number = (value) => Number(value || 0).toLocaleString();

export default function AdminControlCenter() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("overview");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [ussdNumber, setUssdNumber] = useState("");
  const [paymentNetwork, setPaymentNetwork] = useState("MTN / Airtel Money");
  const [dailyRewardPointsLimit, setDailyRewardPointsLimit] = useState(100);
  const [dailyRewardCountLimit, setDailyRewardCountLimit] = useState(10);
  const [maxPointsPerVideo, setMaxPointsPerVideo] = useState(50);
  const [minimumWatchPercent, setMinimumWatchPercent] = useState(80);
  const [monthlyFixedCostsRwf, setMonthlyFixedCostsRwf] = useState(100000);
  const [settingsBusy, setSettingsBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/admin/control-center", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load control center.");
      setData(result);
      const settingsResponse = await fetch("/api/admin/settings", { cache: "no-store" });
      const settings = await settingsResponse.json();
      if (settingsResponse.ok) {
        setUssdNumber(settings.ussdNumber || "");
        setPaymentNetwork(settings.paymentNetwork || "MTN / Airtel Money");
        setDailyRewardPointsLimit(Number(settings.dailyRewardPointsLimit ?? 100));
        setDailyRewardCountLimit(Number(settings.dailyRewardCountLimit ?? 10));
        setMaxPointsPerVideo(Number(settings.maxPointsPerVideo ?? 50));
        setMinimumWatchPercent(Number(settings.minimumWatchPercent ?? 80));
        setMonthlyFixedCostsRwf(Number(settings.monthlyFixedCostsRwf ?? 100000));
      }
    } catch (e) {
      setError(e.message || "Could not load control center.");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveSettings(event) {
    event.preventDefault();
    setSettingsBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ussdNumber: ussdNumber.trim(),
          paymentNetwork: paymentNetwork.trim(),
          dailyRewardPointsLimit: Number(dailyRewardPointsLimit),
          dailyRewardCountLimit: Number(dailyRewardCountLimit),
          maxPointsPerVideo: Number(maxPointsPerVideo),
          minimumWatchPercent: Number(minimumWatchPercent),
          monthlyFixedCostsRwf: Number(monthlyFixedCostsRwf)
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save settings.");
      setUssdNumber(result.ussdNumber || "");
      setPaymentNetwork(result.paymentNetwork || "MTN / Airtel Money");
      setDailyRewardPointsLimit(Number(result.dailyRewardPointsLimit ?? 100));
      setDailyRewardCountLimit(Number(result.dailyRewardCountLimit ?? 10));
      setMaxPointsPerVideo(Number(result.maxPointsPerVideo ?? 50));
      setMinimumWatchPercent(Number(result.minimumWatchPercent ?? 80));
      setMonthlyFixedCostsRwf(Number(result.monthlyFixedCostsRwf ?? 100000));
      setMessage("Payment and reward settings saved. Server-side reward limits are now updated.");
    } catch (e) {
      setError(e.message || "Could not save settings.");
    } finally {
      setSettingsBusy(false);
    }
  }

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

          <div className="control-stat-grid control-finance-grid">
            <article className="card control-stat"><span>Creator revenue · 30 days</span><strong>{number(data.stats.revenueRwf30d)} <small>RWF</small></strong><small>Approved subscription payments</small></article>
            <article className="card control-stat"><span>Viewer reward cost · 30 days</span><strong>{number(data.stats.rewardCostRwf30d)} <small>RWF</small></strong><small>1 point is valued at 1 RWF</small></article>
            <article className="card control-stat"><span>Fixed monthly costs</span><strong>{number(data.stats.monthlyFixedCostsRwf)} <small>RWF</small></strong><small>Configured by admin</small></article>
            <article className="card control-stat"><span>Estimated 30-day profit</span><strong className={data.stats.estimatedProfitRwf30d < 0 ? "control-loss" : "control-profit"}>{number(data.stats.estimatedProfitRwf30d)} <small>RWF</small></strong><small>Estimated margin: {Number(data.stats.profitMarginPercent || 0).toFixed(1)}%</small></article>
          </div>
          <p className="control-hint">Profit estimate = approved creator subscription revenue − viewer reward costs − configured fixed monthly costs. Taxes, refunds, payment fees, and unrecorded expenses are not included.</p>

          <div className="control-tabs" role="tablist" aria-label="Admin sections">
            <button type="button" className={tab === "overview" ? "active" : ""} onClick={() => { setTab("overview"); setQuery(""); }}>Overview</button>
            <button type="button" className={tab === "users" ? "active" : ""} onClick={() => { setTab("users"); setQuery(""); }}>Users <span>{number(data.stats.usersCount)}</span></button>
            <button type="button" className={tab === "videos" ? "active" : ""} onClick={() => { setTab("videos"); setQuery(""); }}>Videos <span>{number(data.stats.videoCount)}</span></button>
            <button type="button" className={tab === "reviews" ? "active" : ""} onClick={() => { setTab("reviews"); setQuery(""); }}>Activity review <span>{data.flags.length}</span></button>
            <button type="button" className={tab === "settings" ? "active" : ""} onClick={() => { setTab("settings"); setQuery(""); }}><Settings size={15}/> Payment settings</button>
          </div>

          {tab === "overview" && (
            <>
              <article className="card security-score-card">
                <div className="security-score-top">
                  <div>
                    <div className="eyebrow">PLATFORM SECURITY</div>
                    <h2>Security score</h2>
                    <p>Based on the security checks currently assessed by Videa.</p>
                  </div>
                  <div className="security-score-number" aria-label={`Security score ${data.security?.score ?? 0} percent`}>
                    <strong>{data.security?.score ?? 0}%</strong>
                    <span>checked</span>
                  </div>
                </div>
                <div className="security-score-track" role="progressbar" aria-valuenow={data.security?.score ?? 0} aria-valuemin="0" aria-valuemax="100" aria-label="Security score">
                  <span style={{ width: (data.security?.score ?? 0) + "%" }} />
                </div>
                <div className="security-check-list">
                  {(data.security?.checks || []).map((check) => (
                    <div className="security-check-row" key={check.id}>
                      {check.passed ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}
                      <div><strong>{check.label}</strong><small>{check.detail}</small></div>
                      <span className={check.passed ? "security-check-passed" : "security-check-failed"}>{check.passed ? "Pass" : "Needs attention"} · {check.weight}%</span>
                    </div>
                  ))}
                </div>
                <p className="control-hint">{data.security?.note || "This score covers only the listed checks and is not a guarantee of complete security."}</p>
              </article>
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
            </>
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

          {tab === "settings" && (
            <div className="card control-list-card">
              <div className="control-list-head"><div><h2>Payment details</h2><p>Set the mobile-money number shown to users when they deposit or subscribe.</p></div></div>
              <form className="admin-settings-form" onSubmit={saveSettings}>
                <label>USSD / mobile-money payment number
                  <input value={ussdNumber} onChange={(event) => setUssdNumber(event.target.value)} placeholder="e.g. *182*1*1*078XXXXXXX#" maxLength={40} />
                </label>
                <label>Payment network
                  <input value={paymentNetwork} onChange={(event) => setPaymentNetwork(event.target.value)} placeholder="MTN MoMo / Airtel Money" maxLength={80} required />
                </label>
                <div className="control-business-heading"><h3>Reward limits</h3><p>These limits are checked by the server, not trusted from the browser.</p></div>
                <label>Maximum points a viewer can earn per day
                  <input type="number" min="0" max="100000" step="1" value={dailyRewardPointsLimit} onChange={(event) => setDailyRewardPointsLimit(event.target.value)} required />
                </label>
                <label>Maximum rewarded videos per viewer per day
                  <input type="number" min="0" max="1000" step="1" value={dailyRewardCountLimit} onChange={(event) => setDailyRewardCountLimit(event.target.value)} required />
                </label>
                <label>Maximum points awarded for one video
                  <input type="number" min="0" max="10000" step="1" value={maxPointsPerVideo} onChange={(event) => setMaxPointsPerVideo(event.target.value)} required />
                </label>
                <label>Minimum watch percentage required (%)
                  <input type="number" min="1" max="100" step="1" value={minimumWatchPercent} onChange={(event) => setMinimumWatchPercent(event.target.value)} required />
                </label>
                <div className="control-business-heading"><h3>Profitability assumptions</h3><p>Videa currently treats 1 point as 1 RWF in the wallet.</p></div>
                <label>Estimated fixed operating costs per month (RWF)
                  <input type="number" min="0" max="1000000000" step="1000" value={monthlyFixedCostsRwf} onChange={(event) => setMonthlyFixedCostsRwf(event.target.value)} required />
                </label>
                <p className="control-hint">Leave the payment number empty if you do not want to display one. Never enter a mobile-money PIN or account password.</p>
                <button type="submit" className="button" disabled={settingsBusy}><Save size={16}/>{settingsBusy ? "Saving…" : "Save payment and reward settings"}</button>
              </form>
            </div>
          )}
        </>
      )}
    </section>
  );
}
