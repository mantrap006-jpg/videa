"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, LogIn } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Login failed.");
        return;
      }

      if (data.user?.role !== "admin") {
        await fetch("/api/auth/logout");
        setMessage("This account does not have administrator access.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="admin-login-page">
      <div className="admin-login-card card">
        <div className="admin-login-icon"><ShieldCheck size={28} /></div>
        <div className="eyebrow">VIDEA ADMIN</div>
        <h1>Administrator login</h1>
        <p>Access payment verification and Creator subscription management.</p>

        <form onSubmit={submit} className="admin-login-form">
          <label>
            Admin email
            <input
              required
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="admin@videa.rw"
            />
          </label>

          <label>
            Password
            <input
              required
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="Your admin password"
            />
          </label>

          <button className="button admin-login-button" disabled={loading}>
            <LogIn size={17} />
            {loading ? "Signing in..." : "Sign in as admin"}
          </button>

          {message && <p className="error">{message}</p>}
        </form>
      </div>
    </section>
  );
}
