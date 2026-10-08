"use client";

import { useState } from "react";

export default function AdminPaymentsClient({ initialPayments = [] }) {
  const [items, setItems] = useState(initialPayments);
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState("");

  async function review(id, action) {
    const note = action === "reject"
      ? window.prompt("Reason for rejection (optional):") || ""
      : window.prompt("Admin note (optional):") || "";

    setBusy(id + action);
    setMessage("");

    try {
      const response = await fetch("/api/videa-admin/subscription-payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, note })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Review failed");

      setItems((current) => current.filter((item) => item.id !== id));
      setMessage(action === "approve" ? "Payment approved and Creator access activated." : "Payment rejected.");
    } catch (error) {
      setMessage(error.message || "Review failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="page">
      <div className="eyebrow">SECURE ADMIN PANEL</div>
      <h1>Subscription verification</h1>
      <p className="muted">
        Verify each transaction in your mobile-money records before approving it.
      </p>

      {message && <div className="card"><strong>{message}</strong></div>}

      {items.length === 0 ? (
        <div className="card"><h3>No pending requests</h3><p className="muted">The queue is empty.</p></div>
      ) : (
        <div className="admin-payment-list">
          {items.map((item) => (
            <article className="card admin-payment-card" key={item.id}>
              <h3>{item.name}</h3>
              <p className="muted">{item.email}</p>
              <p>Amount: <strong>{item.amountRwf?.toLocaleString()} RWF</strong></p>
              <p>Phone: <strong>{item.phone}</strong></p>
              <p>Reference: <strong>{item.transactionReference}</strong></p>
              {item.createdAt && <p className="muted">Submitted: {new Date(item.createdAt).toLocaleString()}</p>}
              <div className="admin-payment-actions">
                <button className="button" onClick={() => review(item.id, "approve")} disabled={busy !== null}>
                  {busy === item.id + "approve" ? "Approving..." : "Approve"}
                </button>
                <button className="button secondary" onClick={() => review(item.id, "reject")} disabled={busy !== null}>
                  {busy === item.id + "reject" ? "Rejecting..." : "Reject"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
