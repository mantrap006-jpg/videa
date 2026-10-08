import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import User from "@/models/User";
import SubscriptionPayment from "@/models/SubscriptionPayment";
import Withdrawal from "@/models/Withdrawal";
import Deposit from "@/models/Deposit";
import { connectDB } from "@/lib/mongodb";
import AdminFinance from "./AdminFinance";
import AdminControlCenter from "./AdminControlCenter";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const token = (await cookies()).get("videa_token")?.value;
  if (!token || !process.env.JWT_SECRET) redirect("/admin/login");
  let session;
  try { session = jwt.verify(token, process.env.JWT_SECRET); } catch { redirect("/admin/login"); }
  if (!session?.sub) redirect("/admin/login");

  await connectDB();
  const admin = await User.findById(session.sub).select("role").lean();
  if (!admin || admin.role !== "admin") redirect("/admin/login");

  const [paymentDocs, withdrawalDocs, depositDocs] = await Promise.all([
    SubscriptionPayment.find({}).sort({ createdAt: -1 }).limit(100).populate("user", "name email").lean(),
    Withdrawal.find({}).sort({ createdAt: -1 }).limit(100).populate("user", "name email").lean(),
    Deposit.find({}).sort({ createdAt: -1 }).limit(100).populate("user", "name email").lean()
  ]);
  const initialPayments = paymentDocs.map(item => ({
    id: item._id.toString(), userName: item.user?.name || "Unknown user", userEmail: item.user?.email || "",
    amountRwf: item.amountRwf, phone: item.phone, senderName: item.senderName || "", transactionReference: item.transactionReference,
    status: item.status, adminNote: item.adminNote || "", createdAt: item.createdAt?.toISOString() || null,
    verifiedAt: item.verifiedAt?.toISOString() || null
  }));
  const initialWithdrawals = withdrawalDocs.map(item => ({
    id: item._id.toString(), userName: item.user?.name || "Unknown user", userEmail: item.user?.email || "",
    points: item.points, amountRwf: item.amountRwf, phone: item.phone, network: item.network,
    status: item.status, adminNote: item.adminNote || "", createdAt: item.createdAt?.toISOString() || null,
    reviewedAt: item.reviewedAt?.toISOString() || null
  }));
  const initialDeposits = depositDocs.map(item => ({
    id: item._id.toString(), userName: item.user?.name || "Unknown user", userEmail: item.user?.email || "",
    points: item.points, amountRwf: item.amountRwf, phone: item.phone, network: item.network,
    senderName: item.senderName || "", transactionReference: item.transactionReference, status: item.status, adminNote: item.adminNote || "",
    createdAt: item.createdAt?.toISOString() || null, reviewedAt: item.reviewedAt?.toISOString() || null
  }));
  return <><AdminControlCenter /><AdminFinance initialPayments={initialPayments} initialWithdrawals={initialWithdrawals} initialDeposits={initialDeposits} /></>;
}
