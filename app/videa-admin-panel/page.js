import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import User from "@/models/User";
import SubscriptionPayment from "@/models/SubscriptionPayment";
import { connectDB } from "@/lib/mongodb";
import AdminPaymentsClient from "./AdminPaymentsClient";

export const dynamic = "force-dynamic";

export default async function VideaAdminPanel() {
  const token = (await cookies()).get("videa_token")?.value;
  if (!token || !process.env.JWT_SECRET) redirect("/login");

  try {
    const session = jwt.verify(token, process.env.JWT_SECRET);
    await connectDB();
    const user = await User.findById(session.sub).select("name role").lean();
    if (!user || user.role !== "admin") redirect("/dashboard");

    const payments = await SubscriptionPayment.find({ status: "pending" })
      .populate("user", "name email")
      .sort({ createdAt: 1 })
      .lean();

    const initialPayments = payments.map((p) => ({
      id: p._id.toString(),
      name: p.user?.name || "Unknown",
      email: p.user?.email || "",
      amountRwf: p.amountRwf,
      phone: p.phone,
      transactionReference: p.transactionReference,
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null
    }));

    return <AdminPaymentsClient initialPayments={initialPayments} />;
  } catch {
    redirect("/login");
  }
}
