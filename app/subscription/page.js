import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { CheckCircle2, Clock3, ShieldCheck, Sparkles, Zap } from "lucide-react";
import SubscriptionForm from "./SubscriptionForm";

export const dynamic = "force-dynamic";

export default async function SubscriptionPage() {
  const token = (await cookies()).get("videa_token")?.value;
  if (!token || !process.env.JWT_SECRET) redirect("/login");

  let session;
  try {
    session = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    redirect("/login");
  }

  await connectDB();
  const user = await User.findById(session.sub).select("name role points subscription").lean();
  if (!user) redirect("/login");

  const plans = [
    {
      id: "monthly",
      name: "Starter Creator",
      price: 12000,
      days: 30,
      videoLimit: 5,
      maxVideoMinutes: 10,
      tagline: "Start promoting your content",
      description: "A compact campaign plan for creators getting started on Videa.",
      features: ["30 days of Creator access", "Up to 5 active video promotions", "Maximum 10 minutes per video", "Video views and watch-progress statistics", "Renew using approved wallet points"]
    },
    {
      id: "quarterly",
      name: "Growth Creator",
      price: 30000,
      days: 90,
      videoLimit: 15,
      maxVideoMinutes: 20,
      tagline: "Promote more videos",
      description: "More upload capacity for creators running several campaigns.",
      features: ["90 days of Creator access", "Up to 15 active video promotions", "Maximum 20 minutes per video", "Video views and watch-progress statistics", "Renew using approved wallet points"]
    },
    {
      id: "annual",
      name: "Pro Creator",
      price: 50000,
      days: 365,
      videoLimit: 50,
      maxVideoMinutes: 30,
      tagline: "Maximum campaign capacity",
      description: "Higher video capacity for creators promoting content at scale.",
      features: ["365 days of Creator access", "Up to 50 active video promotions", "Maximum 30 minutes per video", "Video views and watch-progress statistics", "Renew using approved wallet points"]
    }
  ];

  const freeTrialPlan = {
    id: "free",
    name: "Free Creator Trial",
    days: 7,
    videoLimit: 1,
    maxVideoMinutes: 5
  };
  const now = new Date();
  const currentPlanId = user.subscription?.plan;
  const currentPlan = currentPlanId === "free"
    ? freeTrialPlan
    : plans.find((plan) => plan.id === currentPlanId) || null;
  const active = user.subscription?.status === "active" &&
    (!user.subscription?.expiresAt || new Date(user.subscription.expiresAt) > now);
  const displayedCurrentPlan = active ? currentPlan : null;

  return (
    <section className="page subscription-page">
      <div className="subscription-hero">
        <div>
          <div className="eyebrow"><Sparkles size={15} /> CREATOR SUBSCRIPTION</div>
          <h1>Turn your videos into a bigger audience.</h1>
          <p className="subscription-lead">
            Upgrade or renew your Creator access using points in your Videa wallet. Deposit money into your wallet first, wait for admin approval, then spend your approved points here.
          </p>
          <div className="subscription-trust">
            <span><ShieldCheck size={16} /> Uses wallet points</span>
            <span><Zap size={16} /> Plans last 30, 90, or 365 days</span>
            <span><CheckCircle2 size={16} /> Activates immediately</span>
          </div>
        </div>

        <div className="subscription-status-card">
          <div className="status-card-top">
            <span>Your account</span>
            <span className={active ? "status-pill active" : "status-pill pending"}>
              {active ? "ACTIVE" : "NOT ACTIVE"}
            </span>
          </div>
          <strong>{user.name || "Creator"}</strong>
          {displayedCurrentPlan ? (
            <div className="current-plan-summary" aria-live="polite">
              <span>{displayedCurrentPlan.id === "free" ? "FREE TRIAL" : "Current Plan"}</span>
              <strong>{displayedCurrentPlan.name}</strong>
              <small>{displayedCurrentPlan.days} days · {displayedCurrentPlan.videoLimit} active video promotion{displayedCurrentPlan.videoLimit === 1 ? "" : "s"} · up to {displayedCurrentPlan.maxVideoMinutes} minutes per video</small>
            </div>
          ) : (
            <p>No active paid plan. Choose a plan below to activate Creator access.</p>
          )}
          {active && user.subscription?.expiresAt && (
            <div className="status-expiry">
              <Clock3 size={15} />
              Expires {new Date(user.subscription.expiresAt).toLocaleDateString()}
            </div>
          )}
          <div className="status-expiry">
            <Sparkles size={15} />
            Wallet: {Number(user.points || 0).toLocaleString()} points
          </div>
        </div>
      </div>

      <section className="subscription-choose-section">
        <div className="subscription-choose-heading">
          <div className="plan-badge">CREATOR PLANS</div>
          <h2>Choose your access period</h2>
          <p>One point equals 1 RWF. Your points are deducted only when the upgrade succeeds. Your current plan cannot be purchased twice while active.</p>
        </div>

        {user.role === "creator" ? (
          <SubscriptionForm
            plans={plans}
            points={Number(user.points || 0)}
            currentPlanId={displayedCurrentPlan?.id || null}
            subscriptionActive={active}
          />
        ) : (
          <div className="subscription-info">Creator access is available for creator accounts. Sign in with a Creator account to use wallet points for a subscription.</div>
        )}

        <div className="subscription-links">
          {user.role === "creator" && <a className="button secondary subscription-back" href="/creator">Back to Creator dashboard</a>}
          <a className="button secondary subscription-back" href="/wallet">Open wallet / deposit points</a>
        </div>
      </section>

      <div className="subscription-bottom">
        <div className="subscription-mini-card">
          <ShieldCheck size={20} />
          <div><strong>Secure wallet deduction</strong><span>The server checks your balance and current plan before activating a plan.</span></div>
        </div>
        <div className="subscription-mini-card">
          <Clock3 size={20} />
          <div><strong>Deposits require approval</strong><span>Only points from approved deposits can be spent.</span></div>
        </div>
        <div className="subscription-mini-card">
          <Zap size={20} />
          <div><strong>Clear renewal rules</strong><span>Purchasing the same plan again is blocked while it is active. A different tier can be selected as an upgrade.</span></div>
        </div>
      </div>
    </section>
  );
}
