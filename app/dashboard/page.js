import { redirect } from "next/navigation";
import User from "@/models/User";
import Earning from "@/models/Earning";
import { connectDB } from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/auth";
import { headers } from "next/headers";

async function getUser() {
  const headerStore = await headers();
  const token = headerStore.get("x-videa-token");

  if (!token) return null;

  try {
    const jwt = await import("jsonwebtoken");
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const session = await getUser();

  if (!session?.sub) {
    redirect("/login");
  }

  await connectDB();

  const user = await User.findById(session.sub).lean();
  const earnings = await Earning.find({ userId: session.sub })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return (
    <section>
      <h2>Welcome, {user?.name || "User"}</h2>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="muted">Your points</div>
        <div className="stat">{user?.points ?? 0}</div>
      </div>

      <h3>Recent earnings</h3>

      <div className="card">
        {earnings.length === 0 ? (
          <p>
            No earnings yet. <a href="/videos">Start watching.</a>
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Points</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {earnings.map((e) => (
                <tr key={e._id.toString()}>
                  <td>+{e.points}</td>
                  <td>{new Date(e.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
