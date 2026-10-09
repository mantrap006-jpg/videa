"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

export default function SubscriptionForm({ plans, points = 0 }) {
  const router = useRouter();
  const [busyPlan, setBusyPlan] = useState(null);
  const [status, setStatus] = useState(null);
  const [availablePoints, setAvailablePoints] = useState(Number(points) || 0);

  async function submit(plan) {
    if (!plan || busyPlan) return;
    if (availablePoints < plan.price) {
      setStatus({ type: "error", message: `You need ${(plan.price - availablePoints).toLocaleString()} more points for the ${plan.name} plan.` });
      return;
    }

    setBusyPlan(plan.id);
    setStatus(null);
    try {
      const response = await fetch("/api/subscription/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.id })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not activate subscription.");

      setAvailablePoints(Number(data.wallet?.points ?? Math.max(0, availablePoints - plan.price)));
      setStatus({ type: "success", message: data.message || `${plan.name} activated successfully.` });
      router.refresh();
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Subscription upgrade failed." });
    } finally {
      setBusyPlan(null);
    }
  }

  return (
    <div className="subscription-choice">
      <div className="subscription-wallet-balance">
        <span>Available wallet balance</span>
        <strong>{availablePoints.toLocaleString()} points</strong>
        <small>Deposits become spendable after an administrator approves them.</small>
      </div>

      <div className="subscription-plans-grid">
        {plans.map((plan) => {
          const canAfford = availablePoints >= plan.price;
          const isBusy = busyPlan === plan.id;
          return (
            <article key={plan.id} className={`subscription-plan-box subscription-plan-box-${plan.id}`}>
              <div className="subscription-plan-box-top">
                <span className="subscription-plan-duration">{plan.days} DAYS</span>
                {plan.id === "quarterly" && <span className="subscription-plan-popular">POPULAR</span>}
              </div>
              <h3>{plan.name}</h3>
              <p className="subscription-plan-tagline">{plan.tagline}</p>
              <div className="subscription-plan-price">
                <strong>{plan.price.toLocaleString()}</strong>
                <span>points</span>
              </div>
              <p className="subscription-plan-description">{plan.description}</p>
              <ul className="subscription-plan-features">
                {plan.features.map((feature) => (
                  <li key={feature}><CheckCircle2 size={16} /><span>{feature}</span></li>
                ))}
              </ul>
              <div className="subscription-plan-action">
                <p>{plan.days} days of Creator access</p>
                <button className="button subscription-submit-button" type="button" onClick={() => submit(plan)} disabled={Boolean(busyPlan) || !canAfford}>
                  {isBusy ? "Activating..." : canAfford ? "Upgrade this plan" : "Not enough points"}
                </button>
                {!canAfford && <small>You need {(plan.price - availablePoints).toLocaleString()} more points.</small>}
              </div>
            </article>
          );
        })}
      </div>

      {status && (
        <div className={status.type === "success" ? "form-status success" : "form-status error"} role="status">
          <div><strong>{status.message}</strong></div>
        </div>
      )}
      <p className="subscription-form-hint">No mobile-money payment is made from this page. Subscription cost is deducted from your approved Videa wallet points.</p>
    </div>
  );
}
