"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, UserPlus, Eye, Megaphone } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState(searchParams.get("mode") === "signup" ? "signup" : "login");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "viewer" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

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
      router.push(role === "creator" ? "/creator" : role === "admin" ? "/admin" : "/dashboard");
      router.refresh();
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!googleReady || !googleClientId || !window.google?.accounts?.id) return;

    const container = document.getElementById("google-signin-button");
    if (!container) return;
    container.innerHTML = "";

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: async (response) => {
        if (!response?.credential) {
          setMessage("Google sign-in did not return a credential. Please try again.");
          return;
        }

        setMessage("");
        setGoogleLoading(true);
        try {
          const res = await fetch("/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              credential: response.credential,
              role: form.role
            })
          });
          const data = await res.json();

          if (!res.ok) {
            setMessage(data.error || "Google sign-in failed.");
            return;
          }

          const role = data.user?.role || "viewer";
          router.push(role === "admin" ? "/admin" : role === "creator" ? "/creator" : "/dashboard");
          router.refresh();
        } catch {
          setMessage("Could not connect to Videa. Please try again.");
        } finally {
          setGoogleLoading(false);
        }
      }
    });

    window.google.accounts.id.renderButton(container, {
      theme: "outline",
      size: "large",
      shape: "rectangular",
      text: mode === "signup" ? "signup_with" : "signin_with",
      logo_alignment: "left",
      width: 320
    });
  }, [googleReady, googleClientId, mode, form.role, router]);

  const signup = mode === "signup";

  return (
    <section className="auth-page">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGoogleReady(true)}
      />
      <div className="auth-shell">
        <div className="auth-copy">
          <div className="eyebrow">WELCOME TO VIDEA</div>
          <h2>{signup ? "Create your Videa account." : "Welcome back to Videa."}</h2>
          <p>
            {signup
              ? "Choose how you want to use Videa: watch and earn, promote your videos or campaigns."
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

          {(signup || googleClientId) && (
            <label className="auth-account-type">
              {signup ? "Account type" : "Account type for a new Google account"}
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="viewer">Viewer — watch &amp; earn</option>
                <option value="creator">Creator — upload &amp; promote videos</option>
              </select>
              {!signup && googleClientId && (
                <small className="muted">Your choice applies only if this Google account is new. Existing accounts keep their current role.</small>
              )}
            </label>
          )}

          {googleClientId ? (
            <>
              <div id="google-signin-button" style={{ display: "flex", justifyContent: "center", minHeight: 40 }} />
              {googleLoading && <p className="muted" style={{ textAlign: "center" }}>Signing in with Google...</p>}
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0", color: "var(--muted, #777)", fontSize: 12 }}>
                <span style={{ height: 1, flex: 1, background: "var(--border, #ddd)" }} />
                OR USE EMAIL
                <span style={{ height: 1, flex: 1, background: "var(--border, #ddd)" }} />
              </div>
            </>
          ) : (
            <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
              Google sign-in will appear after <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> is configured in Vercel.
            </p>
          )}

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


            <button className="button auth-submit" disabled={loading}>
              {loading ? "Please wait..." : signup ? "Create account" : "Log in"}
            </button>

            {message && <p className="error" role="alert">{message}</p>}
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
