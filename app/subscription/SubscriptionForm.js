"use client";

import { useState } from "react";

export default function SubscriptionForm({ price }) {
  const [phone, setPhone] = useState("");
  const [transactionReference, setTransactionReference] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setStatus("");

    try {
      const response = await fetch("/api/subscription/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          transactionReference,
          amountRwf: price
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Submission failed");

      setStatus("Payment submitted. An administrator will verify the transaction before activating your Creator subscription.");
      setPhone("");
      setTransactionReference("");
    } catch (error) {
      setStatus(error.message || "Submission failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card subscription-submit">
      <strong>Submit payment for verification</strong>
      <p className="muted">Enter the phone number used for payment and the transaction/reference number.</p>

      <form onSubmit={submit}>
        <label>
          Payment phone number
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07XXXXXXXX"
            required
            autoComplete="tel"
          />
        </label>

        <label>
          Transaction/reference number
          <input
            value={transactionReference}
            onChange={(e) => setTransactionReference(e.target.value)}
            placeholder="Example: MPXXXXXXXX"
            required
          />
        </label>

        <button className="button" type="submit" disabled={busy}>
          {busy ? "Submitting..." : "Submit for verification"}
        </button>
      </form>

      {status && <p className="muted">{status}</p>}
    </div>
  );
}
