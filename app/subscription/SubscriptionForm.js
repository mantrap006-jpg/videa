"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SubscriptionForm({ plans, points = 0 }) {
  const router = useRouter();
  const [planId, setPlanId] = useState(plans?.[0]?.id || "monthly");
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [availablePoints, setAvailablePoints] = useState(Number(points) || 0);
  const selectedPlan = plans.find((plan) => plan.id === planId) || plans[0];
  const canAfford = Boolean(selectedPlan && availablePoints >= selectedPlan.price);

  async function submit(event) {
    event.preventDefault();
    if (!selectedPlan || busy) return;
    setBusy(true);
    setStatus(null);

    try {
      const response = await fetch("/api/subscription/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan.id })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not activate subscription.");

      setAvailablePoints(Number(data.wallet?.points ?? Math.max(0, availablePoints - selectedPlan.price)));
      setStatus({
        type: "success",
        message: data.message || "Creator subscription activated.",
        detail: `Your plan is active for ${selectedPlan.days} days. Your remaining balance is ${Number(data.wallet?.points ?? 0).toLocaleString()} points.`
      });
      router.refresh();
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Subscription upgrade failed.",
        detail: "Your points are not deducted unless the subscription is successfully activated."
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="subscription-submit">
      <div className="form-section-heading">
        <div className="step-label">USE YOUR VIDEA POINTS</div>
        <h3>Upgrade your Creator plan</h3>
        <p>Choose a plan and activate it with points already in your wallet. One point equals 1 RWF.</p>
      </div>

      <div className="payment-number subscription-selected-plan">
        <span>Available wallet balance</span>
        <strong>{availablePoints.toLocaleString()} points</strong>
        <small>Deposits become spendable after an administrator approves them.</small>
      </div>

      <form onSubmit={submit}>
        <label>
          Subscription plan
          <select value={planId} onChange={(e) => setPlanId(e.target.value)} required disabled={busy}>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} — {plan.price.toLocaleString()} points / {plan.days} days
              </option>
            ))}
          </select>
        </label>

        {selectedPlan && (
          <div className="payment-number subscription-selected-plan">
            <span>Points required</span>
            <strong>{selectedPlan.price.toLocaleString()} points</strong>
            <small>{selectedPlan.days} days of Creator access</small>
          </div>
        )}

        <button className="button subscription-submit-button" type="submit" disabled={busy || !selectedPlan || !canAfford}>
          {busy ? "Activating..." : canAfford ? "Upgrade using points" : "Not enough points"}
        </button>

        {!canAfford && selectedPlan && (
          <p className="muted">You need {(selectedPlan.price - availablePoints).toLocaleString()} more points. Make a deposit in your wallet and wait for admin approval.</p>
        )}
      </form>

      <div className="subscription-form-hint">No mobile-money payment is made from this page. Subscription cost is deducted from your approved Videa wallet points.</div>

      {status && (
        <div className={status.type === "success" ? "form-status success" : "form-status error"}>
          <div><strong>{status.message}</strong><span>{status.detail}</span></div>
        </div>
      )}
    </div>
  );
}
