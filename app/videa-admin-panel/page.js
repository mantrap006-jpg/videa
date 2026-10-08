import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export default async function VideaAdminPanel() {
  const token = (await cookies()).get("videa_token")?.value;
  if (!token || !process.env.JWT_SECRET) redirect("/login");

  try {
    const session = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(session.sub).select("name role").lean();
    if (!user || user.role !== "admin") redirect("/dashboard");
    return <section className="page"><div className="eyebrow">SECURE ADMIN PANEL</div><h1>Videa Administration</h1><p className="muted">Administrator-only control panel.</p></section>;
  } catch {
    redirect("/login");
  }
}
