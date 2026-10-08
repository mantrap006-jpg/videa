"use client";

import { useState } from "react";

export default function SubscriptionForm({ price }) {
  const [phone, setPhone] = useState("");
  const [transactionReference, setTransactionReference] = useState("");
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setStatus(null);

    try {
      const response = await fetch("/api/subscription/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          transactionReference: transactionReference.trim(),
          amountRwf: price
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Submission failed");

      setStatus({ type: "success", message: "Payment submitted successfully.", detail: "An administrator will verify the transaction before activating your Creator subscription." });
      setPhone("");
      setTransactionReference("");
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Submission failed", detail: "Please check your details and try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="subscription-submit">
      <div className="form-section-heading">
        <div className="step-label">STEP 2 · SUBMIT</div>
        <h3>Send your payment for verification</h3>
        <p>Use the same phone number that made the payment.</p>
      </div>

      <form onSubmit={submit}>
        <label>
          Payment phone number
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXXXXXXX" inputMode="tel" autoComplete="tel" required disabled={busy} />
        </label>

        <label>
          Transaction / reference number
          <input value={transactionReference} onChange={(e) => setTransactionReference(e.target.value)} placeholder="e.g. MPXXXXXXXX" autoComplete="off" required disabled={busy} />
        </label>

        <button className="button subscription-submit-button" type="submit" disabled={busy}>
          {busy ? "Submitting..." : "Submit for verification"}
        </button>
      </form>

      <div className="subscription-form-hint">For your security, never enter your mobile-money PIN or Videa password.</div>

      {status && (
        <div className={status.type === "success" ? "form-status success" : "form-status error"}>
          <div><strong>{status.message}</strong><span>{status.detail}</span></div>
        </div>
      )}
    </div>
  );
}
