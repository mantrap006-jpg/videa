"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Signup() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "viewer" });
  const [message, setMessage] = useState("");

  async function submit(e) {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (!res.ok) return setMessage(data.error || "Signup failed");
    router.push(form.role === "viewer" ? "/dashboard" : "/creator");
  }

  return <section className="form">
    <div className="eyebrow">JOIN VIDEA</div>
    <h2>Create your account</h2>
    <p className="muted">Watch videos as a viewer, or become a YouTuber / advertiser and promote your content.</p>
    <form onSubmit={submit} className="card">
      <label>Name<input required value={form.name} onChange={e => setForm({...form, name:e.target.value})} /></label>
      <label>Email<input required type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} /></label>
      <label>Password<input required minLength={6} type="password" value={form.password} onChange={e => setForm({...form, password:e.target.value})} /></label>
      <label>Account type
        <select value={form.role} onChange={e => setForm({...form, role:e.target.value})}>
          <option value="viewer">Viewer — watch & earn</option>
          <option value="youtuber">YouTuber — upload & promote videos</option>
          <option value="advertiser">Advertiser — promote campaigns</option>
        </select>
      </label>
      <button className="button">Create account</button>
      <p className="muted">Already registered? <a href="/login">Log in</a></p>
      {message && <p className="error">{message}</p>}
    </form>
  </section>;
}