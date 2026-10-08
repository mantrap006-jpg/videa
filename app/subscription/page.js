import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { CheckCircle2, Smartphone, Sparkles } from "lucide-react";
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
      <div className="eyebrow"><Sparkles size={15} /> CREATOR SUBSCRIPTION</div>
      <h1>Activate Creator access</h1>
      <p className="muted">
        Pay manually by USSD/mobile money. Videa will activate your Creator subscription
        only after an administrator confirms the transaction.
      </p>

      <div className="subscription-grid">
        <div className="card">
          <h2>Creator Plan</h2>
          <p className="muted">30 days of Creator access</p>
          <h3 className="subscription-price">{price.toLocaleString()} RWF</h3>

          <ul className="subscription-list">
            <li><CheckCircle2 size={17} /> Submit YouTube videos</li>
            <li><CheckCircle2 size={17} /> Promote approved content</li>
            <li><CheckCircle2 size={17} /> Reach Videa viewers</li>
          </ul>

          <div className={active ? "subscription-active" : "subscription-pending"}>
            {active ? "Subscription active" : "Subscription requires verification"}
          </div>

          {active && user.subscription?.expiresAt && (
            <p className="muted">
              Expires {new Date(user.subscription.expiresAt).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="card ussd-card">
          <div className="eyebrow"><Smartphone size={15} /> MANUAL USSD PAYMENT</div>
          <h2>Pay using {network}</h2>
          <p className="muted">Send exactly the subscription amount, then keep your transaction/reference number.</p>

          <div className="ussd-box">
            <span>USSD / payment number</span>
            <strong>{ussdNumber}</strong>
          </div>

          <ol className="ussd-steps">
            <li>Open your mobile-money USSD menu.</li>
            <li>Send <strong>{price.toLocaleString()} RWF</strong> to the Videa payment number.</li>
            <li>Save the transaction/reference number.</li>
            <li>Submit that reference to Videa for manual verification.</li>
          </ol>

          <p className="muted">
            Admin verification is required. Do not send your PIN or password to Videa.
          </p>

          {user.role === "creator" && !active && (
            <SubscriptionForm price={price} />
          )}

          {user.role === "creator" && (
            <a className="button" href="/creator">Back to Creator</a>
          )}
        </div>
      </div>
    </section>
  );
}
