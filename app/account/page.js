"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserCircle, ShieldCheck, Wallet, Coins, CalendarDays, LogOut } from "lucide-react";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/account", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(response.status === 401 ? "Please log in to view your account." : "Could not load your account.");
        return response.json();
      })
      .then((data) => { if (alive) setUser(data.user); })
      .catch((err) => { if (alive) setError(err.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  if (loading) return <section className="account-page"><div className="card">Loading your account…</div></section>;
  if (error) return <section className="account-page"><div className="card"><h1>Account</h1><p>{error}</p><a className="button" href="/login">Log in</a></div></section>;
  if (!user) return null;

  const joined = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—";
  const plan = user.subscription?.plan || "free";
  const status = user.subscription?.status || "inactive";

  return (
    <section className="account-page">
      <div className="dashboard-head"><div><div className="eyebrow">PROFILE & SETTINGS</div><h1>Account</h1><p>Review your profile, membership and account shortcuts.</p></div></div>
      <div className="card account-profile-card">
        <div className="account-avatar"><UserCircle size={32} /></div>
        <div><h2>{user.name}</h2><p>{user.email}</p><span className="account-role"><ShieldCheck size={14} /> {user.role}</span></div>
      </div>
      <div className="stats-grid">
        <div className="card stat-card"><span><Coins size={14} /> Available points</span><strong>{Number(user.points || 0).toLocaleString()}</strong><small>Your current balance</small></div>
        <div className="card stat-card"><span><ShieldCheck size={14} /> Membership</span><strong className="account-plan">{plan}</strong><small>Status: {status.replace("_", " ")}</small></div>
        <div className="card stat-card"><span><CalendarDays size={14} /> Joined</span><strong className="account-date">{joined}</strong><small>Account creation date</small></div>
      </div>
      <div className="card account-shortcuts"><h2>Quick links</h2><a href="/points"><Coins size={17} /> Points history</a><a href="/wallet"><Wallet size={17} /> Wallet & payments</a>{user.role === "creator" && <a href="/creator"><ShieldCheck size={17} /> Creator dashboard</a>}{user.role === "admin" && <a href="/admin"><ShieldCheck size={17} /> Admin control center</a>}<a className="account-logout" href="/api/auth/logout"><LogOut size={17} /> Log out</a></div>
    </section>
  );
}
