import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { CheckCircle2, Sparkles } from "lucide-react";

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
  const user = await User.findById(session.sub)
    .select("name role subscription")
    .lean();

  if (!user) redirect("/login");

  const active =
    user.subscription?.status === "active" &&
    (!user.subscription?.expiresAt ||
      new Date(user.subscription.expiresAt) > new Date());

  return (
    <section className="page subscription-page">
      <div className="eyebrow"><Sparkles size={15} /> CREATOR SUBSCRIPTION</div>
      <h1>Grow your audience with Videa</h1>
      <p className="muted">
        An active Creator subscription is required to promote videos on Videa.
        Viewers can continue watching and earning for free.
      </p>

      <div className="card subscription-card">
        <div>
          <h2>Creator Plan</h2>
          <p className="muted">Monthly creator access</p>
          <ul className="subscription-list">
            <li><CheckCircle2 size={17} /> Submit YouTube videos</li>
            <li><CheckCircle2 size={17} /> Promote approved content</li>
            <li><CheckCircle2 size={17} /> Reach Videa viewers</li>
          </ul>
        </div>

        <div className="subscription-status">
          <span className={active ? "success" : "muted"}>
            {active ? "Subscription active" : "Subscription inactive"}
          </span>
          {active && user.subscription?.expiresAt && (
            <small>
              Expires {new Date(user.subscription.expiresAt).toLocaleDateString()}
            </small>
          )}
          {!active && (
            <p className="muted">
              Payment is not connected yet. Once a payment provider is added,
              this page will start the subscription checkout flow.
            </p>
          )}
          {user.role === "creator" && (
            <a className="button" href="/creator">Back to Creator</a>
          )}
        </div>
      </div>
    </section>
  );
}
