"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LockKeyhole, Sparkles } from "lucide-react";

export default function SubscriptionForm({
  plans,
  points = 0,
  currentPlanId = null,
  subscriptionActive = false
}) {
  const router = useRouter();
  const [busyPlan, setBusyPlan] = useState(null);
  const [status, setStatus] = useState(null);
  const [availablePoints, setAvailablePoints] = useState(Number(points) || 0);
  const statusRef = useRef(null);

  useEffect(() => {
    if (status?.type === "success") statusRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [status]);

  async function submit(plan) {
    if (!plan || busyPlan || (subscriptionActive && currentPlanId === plan.id)) return;
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
      if (!response.ok) {
        if (response.status === 409) router.refresh();
        throw new Error(data.error || "Could not activate subscription.");
      }

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

      {subscriptionActive && currentPlanId && (
        <div className="current-plan-banner" role="status">
          <span className="current-plan-banner-icon"><Sparkles size={18} /></span>
          <div>
            <strong>Current Plan: {plans.find((plan) => plan.id === currentPlanId)?.name || currentPlanId}</strong>
            <p>This plan is active. Its purchase button is disabled to prevent duplicate purchases. You can choose another tier if you want to upgrade.</p>
          </div>
        </div>
      )}

      <div className="subscription-plans-grid">
        {plans.map((plan) => {
          const canAfford = availablePoints >= plan.price;
          const isBusy = busyPlan === plan.id;
          const isCurrentPlan = subscriptionActive && currentPlanId === plan.id;
          const buttonDisabled = Boolean(busyPlan) || isCurrentPlan || !canAfford;
          return (
            <article key={plan.id} className={`subscription-plan-box subscription-plan-box-${plan.id}${isCurrentPlan ? " subscription-plan-current" : ""}`}>
              <div className="subscription-plan-box-top">
                <span className="subscription-plan-duration">{plan.days} DAYS</span>
                {isCurrentPlan ? (
                  <span className="subscription-plan-popular"><CheckCircle2 size={13} /> CURRENT PLAN</span>
                ) : plan.id === "quarterly" ? (
                  <span className="subscription-plan-popular">POPULAR</span>
                ) : null}
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
                <button
                  className="button subscription-submit-button"
                  type="button"
                  onClick={() => submit(plan)}
                  disabled={buttonDisabled}
                  aria-disabled={buttonDisabled}
                >
                  {isCurrentPlan ? <><LockKeyhole size={15} /> Current Plan</> : isBusy ? "Activating..." : canAfford ? "Choose this plan" : "Not enough points"}
                </button>
                {!isCurrentPlan && !canAfford && <small>You need {(plan.price - availablePoints).toLocaleString()} more points.</small>}
              </div>
            </article>
          );
        })}
      </div>

      {status && (
        <div ref={statusRef} className={status.type === "success" ? "form-status success" : "form-status error"} role="status" tabIndex={-1}>
          <div><strong>{status.message}</strong></div>
        </div>
      )}
      <p className="subscription-form-hint">No mobile-money payment is made from this page. Subscription cost is deducted from your approved Videa wallet points.</p>
    </div>
  );
}
