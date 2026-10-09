"use client";

import { useState } from "react";
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

  const startGoogleAuthorization = () => {
    if (!googleReady || !googleClientId || !window.google?.accounts?.oauth2) {
      setMessage("Google authorization is still loading. Please try again.");
      return;
    }
    setMessage("");
    setGoogleLoading(true);
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: googleClientId,
      scope: "openid email profile https://www.googleapis.com/auth/youtube.readonly",
      include_granted_scopes: true,
      callback: async (tokenResponse) => {
        if (tokenResponse?.error || !tokenResponse?.access_token) {
          setMessage(tokenResponse?.error_description || "Google authorization was cancelled. Please try again.");
          setGoogleLoading(false);
          return;
        }
        try {
          const res = await fetch("/api/auth/google", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accessToken: tokenResponse.access_token, role })
          });
          const data = await res.json();
          if (!res.ok) {
            setMessage(data.error || "Google sign-in failed. Please try again.");
            setGoogleLoading(false);
            return;
          }
          const userRole = data.user?.role || "viewer";
          router.push(userRole === "admin" ? "/admin" : userRole === "creator" ? "/creator" : "/dashboard");
          router.refresh();
        } catch {
          setMessage("Could not connect to Videa. Please try again.");
          setGoogleLoading(false);
        }
      },
      error_callback: (error) => {
        setMessage(error?.message || "Google authorization could not be opened. Please try again.");
        setGoogleLoading(false);
      }
    });
    tokenClient.requestAccessToken({ prompt: "" });
  };

  return (
    <section className="auth-page">
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive"
        onLoad={() => setGoogleReady(true)}
        onError={() => setMessage("Google sign-in could not load. Check your internet connection and try again.")}
      />
      <div className="auth-shell">
        <div className="auth-copy">
          <div className="eyebrow"><Sparkles size={15} /> WELCOME TO VIDEA</div>
          <h2>{mode === "signup" ? "Your Videa journey starts here." : "Welcome back to Videa."}</h2>
          <p>{mode === "signup"
            ? "Create your account securely with Google and grant YouTube access for automatic subscription checks."
            : "Continue securely with Google. With your permission, Videa can check YouTube channel subscriptions automatically."}</p>
          <div className="auth-benefits">
            <div><Eye size={18} /> Watch videos and earn points</div>
            <div><Megaphone size={18} /> Promote your content</div>
            <div><ShieldCheck size={18} /> Google sign-in + YouTube subscription check</div>
          </div>
        </div>
        <div className="auth-card card">
          <div className="auth-tabs">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setMessage(""); }}>Log in</button>
            <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setMessage(""); }}>Create account</button>
          </div>
          <div className="auth-heading">
            <h3>{mode === "signup" ? "Create your account" : "Log in to Videa"}</h3>
            <p>Continue with Google and approve the requested YouTube read-only permission for automatic subscription checks.</p>
          </div>
          <label className="auth-account-type">
            Account type
            <select value={role} onChange={event => setRole(event.target.value)}>
              <option value="viewer">Viewer — watch &amp; earn</option>
              <option value="creator">Creator — upload &amp; promote videos</option>
            </select>
            {mode === "login" && <small className="muted">Existing accounts keep their saved account type.</small>}
          </label>
          {googleClientId ? <>
            <button type="button" className="button auth-google-button" onClick={startGoogleAuthorization} disabled={!googleReady || googleLoading}>
              {googleLoading ? "Connecting to Google…" : mode === "signup" ? "Create account with Google" : "Continue with Google"}
            </button>
            <p className="muted auth-google-status" role="status">This requests basic profile information and YouTube read-only access. Google will ask you to approve the permissions.</p>
          </> : <div className="auth-google-missing" role="alert">
            <strong>Google sign-in needs setup</strong>
            <p>The site administrator must configure NEXT_PUBLIC_GOOGLE_CLIENT_ID in Vercel before accounts can be created or accessed.</p>
          </div>}
          {message && <p className="error" role="alert">{message}</p>}
          <p className="auth-google-terms">By continuing, you agree to use Videa in accordance with its terms and policies. YouTube read-only access checks whether you subscribe to a creator's channel; Videa does not subscribe or change your YouTube account.</p>
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
