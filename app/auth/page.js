"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, UserPlus, Eye, Megaphone } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState(searchParams.get("mode") === "signup" ? "signup" : "login");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "viewer" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function switchMode(nextMode) {
    setMode(nextMode);
    setMessage("");
  }

  async function submit(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
    const body = mode === "login"
      ? { email: form.email, password: form.password }
      : form;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || (mode === "login" ? "Login failed." : "Signup failed."));
        return;
      }

      const role = data.user?.role || form.role;
      router.push(role === "youtuber" || role === "advertiser" ? "/creator" : "/dashboard");
      router.refresh();
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const signup = mode === "signup";

  return (
    <section className="auth-page">
      <div className="auth-shell">
        <div className="auth-copy">
          <div className="eyebrow">WELCOME TO VIDEA</div>
          <h2>{signup ? "Create your Videa account." : "Welcome back to Videa."}</h2>
          <p>
            {signup
              ? "Choose how you want to use Videa: watch and earn, promote YouTube content, or run advertising campaigns."
              : "Log in to keep watching videos, earning points, and managing your Videa account."}
          </p>

          <div className="auth-benefits">
            <div><Eye size={18} /> Watch and earn points</div>
            <div><Megaphone size={18} /> Promote your content</div>
          </div>
        </div>

        <div className="auth-card card">
          <div className="auth-tabs">
            <button type="button" className={!signup ? "active" : ""} onClick={() => switchMode("login")}>
              <LogIn size={17} /> Log in
            </button>
            <button type="button" className={signup ? "active" : ""} onClick={() => switchMode("signup")}>
              <UserPlus size={17} /> Create account
            </button>
          </div>

          <div className="auth-heading">
            <h3>{signup ? "Create your account" : "Log in"}</h3>
            <p>{signup ? "It only takes a minute to get started." : "Enter your account details below."}</p>
          </div>

          <form onSubmit={submit}>
            {signup && (
              <label>
                Name
                <input
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name"
                />
              </label>
            )}

            <label>
              Email
              <input
                required
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
              />
            </label>

            <label>
              Password
              <input
                required
                minLength={6}
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="At least 6 characters"
              />
            </label>

            {signup && (
              <label>
                Account type
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="viewer">Viewer — watch & earn</option>
                  <option value="youtuber">YouTuber — upload & promote videos</option>
                  <option value="advertiser">Advertiser — promote campaigns</option>
                </select>
              </label>
            )}

            <button className="button auth-submit" disabled={loading}>
              {loading ? "Please wait..." : signup ? "Create account" : "Log in"}
            </button>

            {message && <p className="error">{message}</p>}
          </form>

          <p className="auth-switch muted">
            {signup ? "Already have an account?" : "New to Videa?"}{" "}
            <button type="button" onClick={() => switchMode(signup ? "login" : "signup")}>
              {signup ? "Log in" : "Create account"}
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}
