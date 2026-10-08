"use client";

import { useState } from "react";

export default function SubscriptionForm({ plans, ussdNumber, network }) {
  const [planId, setPlanId] = useState(plans?.[0]?.id || "monthly");
  const [phone, setPhone] = useState("");
  const [senderName, setSenderName] = useState("");
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const selectedPlan = plans.find((plan) => plan.id === planId) || plans[0];

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setStatus(null);

    try {
      const response = await fetch("/api/subscription/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan.id,
          phone: phone.trim(),
          senderName: senderName.trim(),
          amountRwf: selectedPlan.price
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Submission failed");

      setStatus({ type: "success", message: "Payment submitted successfully.", detail: "An administrator will verify the sender name, phone number, and payment amount before activating your selected plan." });
      setPhone("");
      setSenderName("");
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Submission failed", detail: "Please check your details and try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="subscription-submit">
      <div className="form-section-heading">
        <div className="step-label">STEP 1 · CHOOSE & SUBMIT</div>
        <h3>Choose your creator plan</h3>
        <p>Select a plan, pay the exact amount, then submit your payment details.</p>
      </div>

      <form onSubmit={submit}>
        <label>
          Subscription plan
          <select value={planId} onChange={(e) => setPlanId(e.target.value)} required disabled={busy}>
            {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} — {plan.price.toLocaleString()} RWF / {plan.days} days</option>)}
          </select>
        </label>

        <div className="payment-number subscription-selected-plan">
          <span>Pay {network} to Videa</span>
          <strong>{ussdNumber}</strong>
          <small>{selectedPlan.price.toLocaleString()} RWF · {selectedPlan.days} days access</small>
        </div>

        <label>
          Payment phone number
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXXXXXXX" inputMode="tel" autoComplete="tel" required disabled={busy} />
        </label>

        <label>
          Sender name
          <input value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Name shown on payment confirmation" autoComplete="name" maxLength={120} required disabled={busy} />
        </label>

        <button className="button subscription-submit-button" type="submit" disabled={busy || !selectedPlan}>
          {busy ? "Submitting..." : "Submit for verification"}
        </button>
      </form>

      <div className="subscription-form-hint">Use the name shown in the mobile-money confirmation. Never enter your mobile-money PIN or Videa password.</div>

      {status && (
        <div className={status.type === "success" ? "form-status success" : "form-status error"}>
          <div><strong>{status.message}</strong><span>{status.detail}</span></div>
        </div>
      )}
    </div>
  );
}
