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

  const active =
    user.subscription?.status === "active" &&
    (!user.subscription?.expiresAt || new Date(user.subscription.expiresAt) > new Date());

  const plans = [
    { id: "monthly", name: "Monthly Creator", price: Number(process.env.CREATOR_SUBSCRIPTION_PRICE_RWF || 5000), days: 30, description: "30 days of Creator access." },
    { id: "quarterly", name: "Quarterly Creator", price: Number(process.env.CREATOR_QUARTERLY_PRICE_RWF || 13500), days: 90, description: "90 days of Creator access." },
    { id: "annual", name: "Annual Creator", price: Number(process.env.CREATOR_ANNUAL_PRICE_RWF || 50000), days: 365, description: "365 days of Creator access." }
  ];

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
            <span><Zap size={16} /> 30, 90, or 365 days</span>
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
          <p>{active ? "Your Creator access is ready. You can add more time by upgrading again." : "Choose a plan to activate Creator access with your wallet points."}</p>
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

      <div className="subscription-layout">
        <div className="subscription-plan-card">
          <div className="plan-badge">CREATOR PLANS</div>
          <div className="plan-heading">
            <div>
              <h2>Choose your access period</h2>
              <p>One point equals 1 RWF. Your points are deducted only when the upgrade succeeds.</p>
            </div>
          </div>

          <div className="plan-benefits">
            {plans.map((plan) => (
              <div key={plan.id} className="subscription-plan-option">
                <CheckCircle2 size={18} />
                <span><strong>{plan.name}</strong><br />{plan.description}<br /><b>{plan.price.toLocaleString()} points · {plan.days} days</b></span>
              </div>
            ))}
          </div>

          <div className="plan-note">
            <ShieldCheck size={18} />
            <div>
              <strong>Use approved wallet points</strong>
              <span>No separate payment, sender name, phone number, or manual subscription payment verification is needed here.</span>
            </div>
          </div>
        </div>

        <div className="subscription-payment-card">
          <div className="eyebrow"><Sparkles size={15} /> WALLET POINTS</div>
          <h2>Upgrade with your balance</h2>
          <p className="muted">Choose your plan below. If your balance is too low, deposit points into your wallet and wait for admin approval.</p>

          {user.role === "creator" ? (
            <SubscriptionForm plans={plans} points={Number(user.points || 0)} />
          ) : (
            <div className="subscription-info">Creator access is available for creator accounts. Sign in with a Creator account to use wallet points for a subscription.</div>
          )}

          {user.role === "creator" && (
            <a className="button secondary subscription-back" href="/creator">Back to Creator dashboard</a>
          )}
          <a className="button secondary subscription-back" href="/wallet">Open wallet / deposit points</a>
        </div>
      </div>

      <div className="subscription-bottom">
        <div className="subscription-mini-card">
          <ShieldCheck size={20} />
          <div><strong>Secure wallet deduction</strong><span>The server checks your balance before activating a plan.</span></div>
        </div>
        <div className="subscription-mini-card">
          <Clock3 size={20} />
          <div><strong>Deposits require approval</strong><span>Only points from approved deposits can be spent.</span></div>
        </div>
        <div className="subscription-mini-card">
          <Zap size={20} />
          <div><strong>Easy renewal</strong><span>Buying another plan adds its days to your existing active subscription.</span></div>
        </div>
      </div>
    </section>
  );
}
