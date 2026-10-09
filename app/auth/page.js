"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, Megaphone, ShieldCheck, Sparkles } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState(searchParams.get("mode") === "signup" ? "signup" : "login");
  const [role, setRole] = useState("viewer");
  const [message, setMessage] = useState("");
  const [googleReady, setGoogleReady] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!googleReady || !googleClientId || !window.google?.accounts?.id) return;
    const container = document.getElementById("google-signin-button");
    if (!container) return;
    container.innerHTML = "";

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: async (response) => {
        if (!response?.credential) {
          setMessage("Google did not return a sign-in credential. Please try again.");
          return;
        }
        setMessage("");
        setGoogleLoading(true);
        try {
          const res = await fetch("/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ credential: response.credential, role })
          });
          const data = await res.json();
          if (!res.ok) {
            setMessage(data.error || "Google sign-in failed. Please try again.");
            return;
          }
          const userRole = data.user?.role || "viewer";
          router.push(userRole === "admin" ? "/admin" : userRole === "creator" ? "/creator" : "/dashboard");
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
  }, [googleReady, googleClientId, mode, role, router]);

  return (
    <section className="auth-page">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGoogleReady(true)}
        onError={() => setMessage("Google sign-in could not load. Check your internet connection and try again.")}
      />
      <div className="auth-shell">
        <div className="auth-copy">
          <div className="eyebrow"><Sparkles size={15} /> WELCOME TO VIDEA</div>
          <h2>{mode === "signup" ? "Your Videa journey starts here." : "Welcome back to Videa."}</h2>
          <p>
            {mode === "signup"
              ? "Create your account securely with Google. No separate password to remember."
              : "Continue securely with your Google account to watch videos, earn points, or manage your creator account."}
          </p>
          <div className="auth-benefits">
            <div><Eye size={18} /> Watch videos and earn points</div>
            <div><Megaphone size={18} /> Promote your content</div>
            <div><ShieldCheck size={18} /> Google-secured sign-in</div>
          </div>
        </div>

        <div className="auth-card card">
          <div className="auth-tabs">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setMessage(""); }}>
              Log in
            </button>
            <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setMessage(""); }}>
              Create account
            </button>
          </div>

          <div className="auth-heading">
            <h3>{mode === "signup" ? "Create your account" : "Log in to Videa"}</h3>
            <p>{mode === "signup" ? "Choose an account type, then continue with Google." : "Use the Google account connected to your Videa profile."}</p>
          </div>

          <label className="auth-account-type">
            Account type
            <select value={role} onChange={event => setRole(event.target.value)}>
              <option value="viewer">Viewer — watch &amp; earn</option>
              <option value="creator">Creator — upload &amp; promote videos</option>
            </select>
            {mode === "login" && <small className="muted">For existing accounts, Videa keeps your saved account type.</small>}
          </label>

          {googleClientId ? (
            <>
              <div id="google-signin-button" className="auth-google-button" />
              {googleLoading && <p className="muted auth-google-status" role="status">Connecting securely with Google…</p>}
            </>
          ) : (
            <div className="auth-google-missing" role="alert">
              <strong>Google sign-in needs setup</strong>
              <p>The site administrator must configure NEXT_PUBLIC_GOOGLE_CLIENT_ID in Vercel before accounts can be created or accessed.</p>
            </div>
          )}

          {message && <p className="error" role="alert">{message}</p>}

          <p className="auth-google-terms">By continuing, you agree to use Videa in accordance with its terms and policies. Your Google account is used to verify your identity.</p>

          <div className="auth-switch muted">
            {mode === "signup" ? "Already have an account?" : "New to Videa?"}{" "}
            <button type="button" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setMessage(""); }}>
              {mode === "signup" ? "Log in with Google" : "Create account with Google"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
