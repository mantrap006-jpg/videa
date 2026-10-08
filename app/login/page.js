"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  async function submit(e) {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (!res.ok) return setMessage(data.error || "Login failed");
    router.push("/dashboard");
  }

  return <section className="form">
    <h2>Log in</h2>
    <form onSubmit={submit} className="card">
      <label>Email<input required type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} /></label>
      <label>Password<input required type="password" value={form.password} onChange={e => setForm({...form, password:e.target.value})} /></label>
      <button className="button">Log in</button>
      {message && <p className="error">{message}</p>}
    </form>
  </section>;
}