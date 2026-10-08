import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import User from "@/models/User";
import PlatformSetting from "@/models/PlatformSetting";
import { connectDB } from "@/lib/mongodb";
import { CheckCircle2, Clock3, ShieldCheck, Smartphone, Sparkles, Zap } from "lucide-react";
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
  const user = await User.findById(session.sub).select("name role subscription").lean();
  if (!user) redirect("/login");

  const active =
    user.subscription?.status === "active" &&
    (!user.subscription?.expiresAt || new Date(user.subscription.expiresAt) > new Date());

  const plans = [
    { id: "monthly", name: "Monthly Creator", price: Number(process.env.CREATOR_SUBSCRIPTION_PRICE_RWF || 5000), days: 30, description: "A flexible plan billed every 30 days." },
    { id: "quarterly", name: "Quarterly Creator", price: Number(process.env.CREATOR_QUARTERLY_PRICE_RWF || 13500), days: 90, description: "One payment for 90 days of Creator access." },
    { id: "annual", name: "Annual Creator", price: Number(process.env.CREATOR_ANNUAL_PRICE_RWF || 50000), days: 365, description: "One payment for a full year of Creator access." }
  ];
  const paymentSettings = await PlatformSetting.findOne({ key: "payment" }).lean().catch(() => null);
  const ussdNumber = paymentSettings?.ussdNumber || process.env.CREATOR_USSD_NUMBER || "Payment number not configured";
  const network = paymentSettings?.paymentNetwork || process.env.CREATOR_PAYMENT_NETWORK || "MTN / Airtel Money";

  return (
    <section className="page subscription-page">
      <div className="subscription-hero">
        <div>
          <div className="eyebrow"><Sparkles size={15} /> CREATOR SUBSCRIPTION</div>
          <h1>Turn your videos into a bigger audience.</h1>
          <p className="subscription-lead">
            Choose a Creator access period. Pay by mobile money and submit the sender name shown on your receipt,
            and our admin team will verify the payment before activation.
          </p>
          <div className="subscription-trust">
            <span><ShieldCheck size={16} /> Manual verification</span>
            <span><Zap size={16} /> 30, 90, or 365 days</span>
            <span><Smartphone size={16} /> Mobile-money friendly</span>
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
          <p>{active ? "Your Creator access is ready." : "Complete payment verification to activate Creator access."}</p>
          {active && user.subscription?.expiresAt && (
            <div className="status-expiry">
              <Clock3 size={15} />
              Expires {new Date(user.subscription.expiresAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      <div className="subscription-layout">
        <div className="subscription-plan-card">
          <div className="plan-badge">CREATOR PLANS</div>
          <div className="plan-heading">
            <div>
              <h2>Choose your access period</h2>
              <p>All plans include Creator access after payment verification.</p>
            </div>
          </div>

          <div className="plan-benefits">
            {plans.map((plan) => (
              <div key={plan.id} className="subscription-plan-option">
                <CheckCircle2 size={18} />
                <span><strong>{plan.name}</strong><br />{plan.description}<br /><b>{plan.price.toLocaleString()} RWF · {plan.days} days</b></span>
              </div>
            ))}
          </div>

          <div className="plan-note">
            <ShieldCheck size={18} />
            <div>
              <strong>Manual payment verification</strong>
              <span>Your selected plan activates only after an administrator confirms your payment.</span>
            </div>
          </div>
        </div>

        <div className="subscription-payment-card">
          <div className="eyebrow"><Smartphone size={15} /> STEP 1 · PAY</div>
          <h2>Pay with {network}</h2>
          <p className="muted">Choose a plan and send the exact amount shown. Then enter the sender name displayed on your payment confirmation.</p>

          <div className="payment-steps">
            <div><b>01</b><span>Open your mobile-money menu.</span></div>
            <div><b>02</b><span>Send the amount for your selected plan to the Videa payment number shown in the form.</span></div>
            <div><b>03</b><span>Submit the sender name and phone number used for the payment.</span></div>
          </div>

          {user.role === "creator" && !active ? (
            <SubscriptionForm plans={plans} ussdNumber={ussdNumber} network={network} />
          ) : active ? (
            <div className="subscription-success">
              <CheckCircle2 size={20} />
              <div><strong>Creator access is active</strong><span>You do not need to submit another payment while this subscription is active.</span></div>
            </div>
          ) : (
            <div className="subscription-info">Creator access is available for creator accounts.</div>
          )}

          {user.role === "creator" && (
            <a className="button secondary subscription-back" href="/creator">Back to Creator dashboard</a>
          )}
        </div>
      </div>

      <div className="subscription-bottom">
        <div className="subscription-mini-card">
          <ShieldCheck size={20} />
          <div><strong>Secure by design</strong><span>Never share your mobile-money PIN or Videa password.</span></div>
        </div>
        <div className="subscription-mini-card">
          <Clock3 size={20} />
          <div><strong>Verification first</strong><span>Payments stay pending until an administrator reviews them.</span></div>
        </div>
        <div className="subscription-mini-card">
          <Zap size={20} />
          <div><strong>Simple renewal</strong><span>Submit a new payment whenever your selected access period needs renewal.</span></div>
        </div>
      </div>
    </section>
  );
}
