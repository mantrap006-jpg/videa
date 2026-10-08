import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import User from "@/models/User";
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

  const price = Number(process.env.CREATOR_SUBSCRIPTION_PRICE_RWF || 5000);
  const ussdNumber = process.env.CREATOR_USSD_NUMBER || "YOUR_USSD_NUMBER";
  const network = process.env.CREATOR_PAYMENT_NETWORK || "MTN / Airtel Money";

  return (
    <section className="page subscription-page">
      <div className="subscription-hero">
        <div>
          <div className="eyebrow"><Sparkles size={15} /> CREATOR SUBSCRIPTION</div>
          <h1>Turn your videos into a bigger audience.</h1>
          <p className="subscription-lead">
            Unlock Creator access for 30 days. Pay by mobile money, submit your transaction reference,
            and our admin team will verify the payment before activation.
          </p>
          <div className="subscription-trust">
            <span><ShieldCheck size={16} /> Manual verification</span>
            <span><Zap size={16} /> 30 days access</span>
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
          <div className="plan-badge">CREATOR PLAN</div>
          <div className="plan-heading">
            <div>
              <h2>Creator</h2>
              <p>Everything you need to publish and promote approved content.</p>
            </div>
            <div className="plan-price">
              <strong>{price.toLocaleString()}</strong>
              <span>RWF / 30 days</span>
            </div>
          </div>

          <div className="plan-benefits">
            <div><CheckCircle2 size={18} /><span>Submit YouTube videos for approval</span></div>
            <div><CheckCircle2 size={18} /><span>Promote approved content to Videa viewers</span></div>
            <div><CheckCircle2 size={18} /><span>Creator dashboard and publishing tools</span></div>
            <div><CheckCircle2 size={18} /><span>Manual payment verification for added security</span></div>
          </div>

          <div className="plan-note">
            <ShieldCheck size={18} />
            <div>
              <strong>No automatic activation</strong>
              <span>Your subscription becomes active only after an administrator confirms your payment.</span>
            </div>
          </div>
        </div>

        <div className="subscription-payment-card">
          <div className="eyebrow"><Smartphone size={15} /> STEP 1 · PAY</div>
          <h2>Pay with {network}</h2>
          <p className="muted">Send the exact amount below, then keep your transaction/reference number.</p>

          <div className="payment-number">
            <span>Videa payment number</span>
            <strong>{ussdNumber}</strong>
            <small>{price.toLocaleString()} RWF · 30 days</small>
          </div>

          <div className="payment-steps">
            <div><b>01</b><span>Open your mobile-money USSD menu.</span></div>
            <div><b>02</b><span>Send <strong>{price.toLocaleString()} RWF</strong> to the Videa payment number.</span></div>
            <div><b>03</b><span>Save the transaction/reference number from the confirmation message.</span></div>
          </div>

          {user.role === "creator" && !active ? (
            <SubscriptionForm price={price} />
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
          <div><strong>Simple renewal</strong><span>Submit a new payment whenever your 30-day access needs renewal.</span></div>
        </div>
      </div>
    </section>
  );
}
